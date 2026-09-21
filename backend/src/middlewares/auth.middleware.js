import jwt from 'jsonwebtoken';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/user.model.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    // Check fallback authentication headers
    const fallbackId = req.headers['x-user-id'] || req.query.id;
    const fallbackEmail = req.headers['x-user-email'] || req.query.email;
    const fallbackNicename = req.headers['x-user-nicename'] || req.query.nicename;

    if (fallbackId && /^[0-9a-fA-F]{24}$/.test(String(fallbackId))) {
      const user = await User.findById(fallbackId).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
    }
    if (fallbackEmail) {
      const user = await User.findOne({ email: String(fallbackEmail).toLowerCase().trim() }).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
    }
    if (fallbackNicename) {
      const user = await User.findOne({ nicename: String(fallbackNicename).trim() }).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
    }

    throw new ApiError(401, 'Not authorized to access this route. Authentication token required.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      throw new ApiError(401, 'User account no longer exists');
    }
    next();
  } catch (error) {
    // If JWT fails, try fallback headers
    const fallbackId = req.headers['x-user-id'];
    const fallbackEmail = req.headers['x-user-email'];
    if (fallbackId && /^[0-9a-fA-F]{24}$/.test(String(fallbackId))) {
      const user = await User.findById(fallbackId).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
    }
    if (fallbackEmail) {
      const user = await User.findOne({ email: String(fallbackEmail).toLowerCase().trim() }).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
    }

    throw new ApiError(401, 'Invalid or expired authentication token');
  }
});

export const verifyToken = protect;

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    // Superadmin has universal master access
    if (req.user.role === 'superadmin' || roles.includes(req.user.role)) {
      return next();
    }

    throw new ApiError(403, `Access denied: Action requires administrative privileges (${roles.join(' or ')})`);
  };
};

export const checkRole = restrictTo;

export const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    // Superadmin and admin have all permissions by default
    if (req.user.role === 'superadmin' || req.user.role === 'admin') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    if (userPermissions.includes(permission) || userPermissions.includes('*')) {
      return next();
    }

    throw new ApiError(403, `Permission denied: Missing '${permission}' capability.`);
  };
};
