import jwt from 'jsonwebtoken';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/user.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';

/**
 * Strict Authentication Protection Middleware
 * Requires a valid Bearer JWT token in Authorization header, x-auth-token, or cookie.
 * Ensures the authenticated user exists in DB and is active.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Extract Bearer Token from Authorization Header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. Reject if no token is present
  if (!token) {
    throw new ApiError(
      401,
      'Authentication required: Please log in to access this protected resource.'
    );
  }

  // 3. Verify JWT signature and expiration
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || !decoded.id) {
      throw new ApiError(401, 'Invalid authentication token payload.');
    }

    // 4. Look up user account in MongoDB
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new ApiError(401, 'User account associated with this token no longer exists.');
    }

    // 5. Verify account status
    const status = (user.status || 'active').toLowerCase();
    if (status === 'inactive' || status === 'blocked' || status === 'deactivated') {
      throw new ApiError(
        403,
        'Your account is currently inactive or pending administrator approval.'
      );
    }

    // Attach active user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Session expired. Please log in again to continue.');
    }
    throw new ApiError(401, 'Invalid or corrupted authentication token.');
  }
});

export const verifyToken = protect;

/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts access to specific administrative roles.
 * 'superadmin' role always has universal access.
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required before checking permissions.');
    }

    const userRole = (req.user.role || '').toLowerCase();

    // Universal superadmin override
    if (userRole === 'superadmin') {
      return next();
    }

    const normalizedRoles = roles.map((r) => r.toLowerCase());
    if (normalizedRoles.includes(userRole)) {
      return next();
    }

    throw new ApiError(
      403,
      `Access denied: This action requires (${roles.join(' or ')}) privileges. Your role is '${req.user.role}'.`
    );
  };
};

export const checkRole = restrictTo;

/**
 * Optional Authentication Middleware
 * Reads and populates req.user if a valid token is provided, without blocking unauthenticated requests.
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded?.id) {
        const user = await User.findById(decoded.id).select('-password');
        if (user && !['inactive', 'blocked', 'deactivated'].includes((user.status || '').toLowerCase())) {
          req.user = user;
        }
      }
    } catch (e) {
      // Optional auth failure is non-blocking
    }
  }

  next();
});

/**
 * Permission-Based Capability Middleware
 */
export const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required.');
    }

    const userRole = (req.user.role || '').toLowerCase();
    if (userRole === 'superadmin' || userRole === 'admin') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    if (userPermissions.includes(permission) || userPermissions.includes('*')) {
      return next();
    }

    throw new ApiError(403, `Permission denied: Missing '${permission}' capability.`);
  };
};
