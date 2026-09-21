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
} from '../controllers/user.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

// User's own profile routes (Any authenticated user can view & update their own profile)
router.route('/profile').get(protect, getProfile).put(protect, updateProfile);
router.route('/me').get(protect, getProfile).put(protect, updateProfile);

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

