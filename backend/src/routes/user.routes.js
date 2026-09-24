import express from 'express';
import {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  bulkActionUsers,
  getPublicAuthorProfile,
} from '../controllers/user.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { getSessionLogs } from '../controllers/auth.controller.js';

const router = express.Router();

// Public Author Profile (No auth required)
router.get('/author/:slug', getPublicAuthorProfile);
router.get('/:slug/author', getPublicAuthorProfile);

// User's own profile routes (Any authenticated user can view & update their own profile)
router.route('/profile').get(protect, getProfile).put(protect, updateProfile);
router.route('/me').get(protect, getProfile).put(protect, updateProfile);

// User Session Logs (Admin and Superadmin only)
router.get('/logs', protect, restrictTo('admin', 'superadmin'), getSessionLogs);
router.get('/session-logs', protect, restrictTo('admin', 'superadmin'), getSessionLogs);

// Bulk actions (Admin and Superadmin only)
router.post('/bulk', protect, restrictTo('admin', 'superadmin'), bulkActionUsers);

// Admin User Management routes (Admin and Superadmin only)
router
  .route('/')
  .get(protect, restrictTo('admin', 'superadmin'), getAllUsers)
  .post(protect, restrictTo('admin', 'superadmin'), createUser);

router
  .route('/:id')
  .get(protect, restrictTo('admin', 'superadmin'), getUserById)
  .put(protect, restrictTo('admin', 'superadmin'), updateUser)
  .delete(protect, restrictTo('admin', 'superadmin'), deleteUser);

export default router;

