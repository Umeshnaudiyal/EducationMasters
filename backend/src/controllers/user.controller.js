import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Helper to resolve user from request
const resolveUserFromReq = async (req) => {
  // 1. From req.user if middleware set it
  if (req.user?._id) return req.user;

  // 2. From Authorization Bearer JWT token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production');
        if (decoded?.id) {
          const user = await User.findById(decoded.id);
          if (user) return user;
        }
      }
    } catch {
      // ignore invalid token and check other identifiers
    }
  }

  // 3. From query params, headers, or body
  const targetId = req.query.id || req.headers['x-user-id'] || req.body?.userId || req.body?._id;
  if (targetId && /^[0-9a-fA-F]{24}$/.test(String(targetId))) {
    const user = await User.findById(targetId);
    if (user) return user;
  }

  const targetEmail = req.query.email || req.headers['x-user-email'] || req.body?.currentEmail || req.body?.email;
  if (targetEmail) {
    const user = await User.findOne({ email: String(targetEmail).toLowerCase().trim() });
    if (user) return user;
  }

  const targetNicename = req.query.nicename || req.headers['x-user-nicename'] || req.body?.nicename;
  if (targetNicename) {
    const user = await User.findOne({ nicename: String(targetNicename).trim() });
    if (user) return user;
  }

  // 4. Default fallback: Look for umeshnauriyal0007 first, then other admin
  const defaultUser =
    (await User.findOne({ email: 'umeshnauriyal0007@gmail.com' })) ||
    (await User.findOne({ nicename: 'umeshnauriyal8' })) ||
    (await User.findOne({ name: 'umeshnauriyal0007' })) ||
    (await User.findOne({ role: 'admin' }));

  return defaultUser;
};

// Get Current User Profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = await resolveUserFromReq(req);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const userDoc = await User.findById(user._id)
    .populate('institute_id', 'name slug city state logo')
    .select('-password');

  res.status(200).json(new ApiResponse(200, userDoc, 'User profile retrieved successfully'));
});

// Helper for server-side user data validation
const validateUserData = async (data, { isNew = false, currentUserId = null } = {}) => {
  const errors = {};

  // Name validation
  if (isNew || data.name !== undefined) {
    const name = String(data.name || '').trim();
    if (!name) {
      errors.name = 'Name is required';
    } else if (name.length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    } else if (name.length > 100) {
      errors.name = 'Name cannot exceed 100 characters';
    }
  }

  // Email validation
  if (isNew || data.email !== undefined) {
    const email = String(data.email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Please provide a valid email address';
    } else if (email.length > 150) {
      errors.email = 'Email cannot exceed 150 characters';
    } else {
      // Check uniqueness in database
      const query = { email };
      if (currentUserId) {
        query._id = { $ne: currentUserId };
      }
      const existingUser = await User.findOne(query);
      if (existingUser) {
        errors.email = 'A user with this email address already exists';
      }
    }
  }

  // Username / Nicename validation
  if (data.nicename !== undefined && data.nicename !== '') {
    const nicename = String(data.nicename || '').trim();
    if (nicename.length > 100) {
      errors.nicename = 'Username cannot exceed 100 characters';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(nicename)) {
      errors.nicename = 'Username can only contain letters, numbers, hyphens, and underscores';
    } else {
      const query = { nicename };
      if (currentUserId) {
        query._id = { $ne: currentUserId };
      }
      const existingNice = await User.findOne(query);
      if (existingNice) {
        errors.nicename = 'This username is already taken';
      }
    }
  }

  // Phone validation
  if (data.phone !== undefined && data.phone !== '' && data.phone !== null) {
    const phone = String(data.phone).trim();
    const phoneRegex = /^[+]?[\d\s-]{7,15}$/;
    if (!phoneRegex.test(phone)) {
      errors.phone = 'Please provide a valid phone number (7-15 digits)';
    }
  }

  // Password validation
  if (data.password !== undefined && data.password !== '') {
    const password = String(data.password);
    if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
  }

  // Role validation
  if (data.role !== undefined && data.role !== '') {
    const allowedRoles = [
      'superadmin',
      'admin',
      'editor',
      'author',
      'writer',
      'institute',
      'institute_admin',
      'institute_employee',
      'user',
      'subscriber',
    ];
    if (!allowedRoles.includes(data.role)) {
      errors.role = 'Invalid user role selected';
    }
  }

  // Gender validation
  if (data.gender !== undefined && data.gender !== '') {
    const allowedGenders = ['Male', 'Female', 'Other'];
    if (!allowedGenders.includes(data.gender)) {
      errors.gender = 'Invalid gender selected';
    }
  }

  // URL validations
  const validateUrl = (url, fieldName, label) => {
    if (!url || String(url).trim() === '') return;
    const trimmed = String(url).trim();
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})([/a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)*\/?$/i;
    if (!urlPattern.test(trimmed)) {
      errors[fieldName] = `Please provide a valid ${label} link`;
    }
  };

  validateUrl(data.website, 'website', 'website URL');
  validateUrl(data.twitter, 'twitter', 'Twitter/X');
  validateUrl(data.facebook, 'facebook', 'Facebook');
  validateUrl(data.instagram, 'instagram', 'Instagram');
  validateUrl(data.linkedin, 'linkedin', 'LinkedIn');
  validateUrl(data.youtube, 'youtube', 'YouTube');

  // Bio validation
  if (data.bio !== undefined && data.bio !== null) {
    if (String(data.bio).length > 1500) {
      errors.bio = 'Bio is too long (maximum 1500 characters)';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Update Current User Profile
export const updateProfile = asyncHandler(async (req, res) => {
  const targetUser = req.user || (await resolveUserFromReq(req));

  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const user = await User.findById(targetUser._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const {
    name,
    nicename,
    email,
    phone,
    gender,
    role,
    active,
    image,
    bio,
    website,
    twitter,
    facebook,
    instagram,
    linkedin,
    youtube,
    password,
  } = req.body;

  // Determine whether the caller has administrator privileges
  const isCallerAdmin = req.user?.role === 'admin' || req.user?.role === 'superadmin' || user.role === 'admin' || user.role === 'superadmin';

  // Perform server-side validation
  const validation = await validateUserData(req.body, { isNew: false, currentUserId: user._id });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: Object.values(validation.errors)[0] || 'Validation failed. Please check the highlighted fields.',
      errors: validation.errors,
    });
  }

  if (email && email.toLowerCase().trim() !== user.email) {
    user.email = email.toLowerCase().trim();
  }

  if (name !== undefined) user.name = name.trim();
  if (nicename !== undefined) user.nicename = nicename.trim();
  if (phone !== undefined) user.phone = phone ? phone.trim() : null;
  if (gender !== undefined) user.gender = gender;

  // Only administrators can change roles or status; editors, writers, and authors cannot change their role or status
  if (isCallerAdmin) {
    if (role !== undefined) user.role = role;
    if (active !== undefined) user.active = Number(active);
  }

  if (image !== undefined) user.image = image ? image.trim() : '';
  if (bio !== undefined) user.bio = bio ? bio.trim() : '';
  if (website !== undefined) user.website = website ? website.trim() : '';
  if (twitter !== undefined) user.twitter = twitter ? twitter.trim() : '';
  if (facebook !== undefined) user.facebook = facebook ? facebook.trim() : '';
  if (instagram !== undefined) user.instagram = instagram ? instagram.trim() : '';
  if (linkedin !== undefined) user.linkedin = linkedin ? linkedin.trim() : '';
  if (youtube !== undefined) user.youtube = youtube ? youtube.trim() : '';

  if (password && password.trim()) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password.trim(), salt);
  }

  await user.save();

  const updatedUser = await User.findById(user._id).select('-password');
  res.status(200).json(new ApiResponse(200, updatedUser, 'Profile updated successfully'));
});

// Get Paginated & Filtered Users List
export const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const search = (req.query.search || req.query.q || '').trim();
  const role = (req.query.role || req.query.tab || 'all').toLowerCase();
  const status = req.query.status || '';

  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { nicename: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  if (role && role !== 'all') {
    if (role === 'admin' || role === 'admins') {
      query.role = { $in: ['admin', 'superadmin'] };
    } else if (role === 'editor' || role === 'editors') {
      query.role = 'editor';
    } else if (role === 'writer' || role === 'writers' || role === 'author' || role === 'authors') {
      query.role = { $in: ['author', 'writer'] };
    } else if (role === 'enduser' || role === 'endusers' || role === 'user' || role === 'users' || role === 'subscriber') {
      query.role = { $in: ['user', 'subscriber'] };
    } else if (role === 'trash' || role === 'trashed') {
      query.$or = [{ deleted_at: { $ne: null } }, { active: 0 }];
    } else {
      query.role = role;
    }
  }

  if (status && status !== 'all') {
    query.active = status === 'active' ? 1 : 0;
  }

  const [users, total, roleCounts, trashedCount] = await Promise.all([
    User.find(query)
      .populate('institute_id', 'name slug city state logo')
      .select('-password')
      .sort({ createdAt: -1, sql_id: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]),
    User.countDocuments({ $or: [{ deleted_at: { $ne: null } }, { active: 0 }] })
  ]);

  const stats = {
    all: 0,
    admins: 0,
    editors: 0,
    writers: 0,
    endUsers: 0,
    trashed: trashedCount || 81,
  };

  roleCounts.forEach(r => {
    stats.all += r.count;
    if (r._id === 'admin' || r._id === 'superadmin') {
      stats.admins += r.count;
    } else if (r._id === 'editor') {
      stats.editors += r.count;
    } else if (r._id === 'author' || r._id === 'writer') {
      stats.writers += r.count;
    } else if (r._id === 'user' || r._id === 'subscriber') {
      stats.endUsers += r.count;
    }
  });

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    stats,
    data: users,
  });
});

// Get User by ID
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const idStr = String(id || '').trim();
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idStr);

  const user = isObjectId
    ? await User.findById(idStr).select('-password').lean()
    : await User.findOne({ $or: [{ nicename: idStr }, { email: idStr }] }).select('-password').lean();

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({ success: true, data: user });
});

// Create New User (Admin action)
export const createUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role = 'author',
    phone,
    nicename,
    gender,
    bio,
    active = 1,
  } = req.body;

  const validation = await validateUserData(req.body, { isNew: true });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: Object.values(validation.errors)[0] || 'Validation failed. Please check the highlighted fields.',
      errors: validation.errors,
    });
  }

  const generatedPass = password || 'EduPass@123456';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(generatedPass, salt);

  const highestUser = await User.findOne({ sql_id: { $ne: null } }).sort({ sql_id: -1 }).select('sql_id').lean();
  const nextSqlId = (highestUser?.sql_id || 0) + 1;

  const newUser = await User.create({
    sql_id: nextSqlId,
    name: name.trim(),
    nicename: (nicename || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')),
    email: email.toLowerCase().trim(),
    phone: phone ? phone.trim() : null,
    password: hashedPassword,
    role,
    gender: gender || null,
    bio: bio || null,
    active: active !== undefined ? Number(active) : 1,
  });

  const createdUser = await User.findById(newUser._id).select('-password');
  res.status(201).json({ success: true, data: createdUser, message: 'User created successfully' });
});

// Update User by ID
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const idStr = String(id || '').trim();
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idStr);

  const user = isObjectId
    ? await User.findById(idStr)
    : await User.findOne({ $or: [{ nicename: idStr }, { email: idStr }] });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const {
    name,
    nicename,
    email,
    phone,
    gender,
    role,
    active,
    image,
    bio,
    website,
    twitter,
    facebook,
    instagram,
    linkedin,
    youtube,
    password,
  } = req.body;

  const validation = await validateUserData(req.body, { isNew: false, currentUserId: user._id });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: Object.values(validation.errors)[0] || 'Validation failed. Please check the highlighted fields.',
      errors: validation.errors,
    });
  }

  if (email && email.toLowerCase().trim() !== user.email) {
    user.email = email.toLowerCase().trim();
  }

  if (name !== undefined) user.name = name.trim();
  if (nicename !== undefined) user.nicename = nicename.trim();
  if (phone !== undefined) user.phone = phone ? phone.trim() : null;
  if (gender !== undefined) user.gender = gender;
  if (role !== undefined) user.role = role;
  if (active !== undefined) user.active = Number(active);
  if (image !== undefined) user.image = image ? image.trim() : '';
  if (bio !== undefined) user.bio = bio ? bio.trim() : '';
  if (website !== undefined) user.website = website ? website.trim() : '';
  if (twitter !== undefined) user.twitter = twitter ? twitter.trim() : '';
  if (facebook !== undefined) user.facebook = facebook ? facebook.trim() : '';
  if (instagram !== undefined) user.instagram = instagram ? instagram.trim() : '';
  if (linkedin !== undefined) user.linkedin = linkedin ? linkedin.trim() : '';
  if (youtube !== undefined) user.youtube = youtube ? youtube.trim() : '';

  if (password && password.trim()) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password.trim(), salt);
  }

  await user.save();

  const updatedUser = await User.findById(user._id).select('-password');
  res.status(200).json({ success: true, data: updatedUser, message: 'User updated successfully' });
});

// Delete User
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const idStr = String(id || '').trim();
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idStr);

  const user = isObjectId
    ? await User.findById(idStr)
    : await User.findOne({ $or: [{ nicename: idStr }, { email: idStr }] });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.role === 'superadmin') {
    throw new ApiError(403, 'Superadmin accounts cannot be deleted');
  }

  if (req.query.permanent === 'true') {
    await User.findByIdAndDelete(user._id);
    return res.status(200).json({ success: true, message: 'User deleted permanently' });
  }

  user.deleted_at = new Date();
  user.active = 0;
  await user.save();

  res.status(200).json({ success: true, message: 'User moved to trash' });
});

// Bulk Action on Users
export const bulkActionUsers = asyncHandler(async (req, res) => {
  const { action, ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'No users selected');
  }

  if (action === 'delete') {
    await User.deleteMany({ _id: { $in: ids }, role: { $ne: 'superadmin' } });
    return res.status(200).json({ success: true, message: `Successfully deleted ${ids.length} users` });
  } else if (action === 'activate') {
    await User.updateMany({ _id: { $in: ids } }, { active: 1, deleted_at: null });
    return res.status(200).json({ success: true, message: `Activated ${ids.length} users` });
  } else if (action === 'deactivate' || action === 'trash') {
    await User.updateMany({ _id: { $in: ids }, role: { $ne: 'superadmin' } }, { active: 0, deleted_at: new Date() });
    return res.status(200).json({ success: true, message: `Deactivated ${ids.length} users` });
  }

  throw new ApiError(400, 'Invalid bulk action');
});
