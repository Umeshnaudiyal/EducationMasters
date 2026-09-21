import User from '../models/user.model.js';
import ApiError from '../utils/apiError.js';

class AuthService {
  async registerUser({ name, email, password }) {
    const cleanEmail = String(email || '').toLowerCase().trim();
    if (!name || !cleanEmail || !password) {
      throw new ApiError(400, 'Please provide name, email, and password');
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists');
    }

    // Newly registered users are set to inactive (active: 0) pending administrator approval
    const user = await User.create({
      name: String(name).trim(),
      email: cleanEmail,
      password,
      role: 'user',
      active: 0,
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
      },
      requiresActivation: true,
      message: 'Account registered successfully! Your account is currently pending administrator activation.',
    };
  }

  async loginUser({ email, username, password }) {
    const inputIdentifier = (email || username || '').trim();
    if (!inputIdentifier || !password) {
      throw new ApiError(400, 'Please provide email/username and password');
    }

    // Support logging in via email, nicename (username), display name, or phone number
    const user = await User.findOne({
      $or: [
        { email: inputIdentifier.toLowerCase() },
        { nicename: inputIdentifier },
        { name: inputIdentifier },
        { phone: inputIdentifier }
      ]
    }).select('+password');

    if (!user) {
      console.log(`[AuthService] Login failed: User '${inputIdentifier}' not found in MongoDB.`);
      throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`[AuthService] Login failed: Password mismatch for user '${user.email}' (${user.nicename}).`);
      throw new ApiError(401, 'Invalid email or password');
    }

    // Block inactive or deleted accounts
    if (user.active === 0 || user.deleted_at) {
      console.log(`[AuthService] Login blocked: User '${user.email}' is inactive or deleted.`);
      throw new ApiError(403, 'Your account is currently inactive or pending administrator approval. Please contact the administrator.');
    }

    const token = user.generateAuthToken();

    return {
      user: {
        id: user._id,
        sql_id: user.sql_id,
        name: user.name,
        nicename: user.nicename,
        email: user.email,
        role: user.role,
        active: user.active,
      },
      token,
    };
  }
}

export default new AuthService();
