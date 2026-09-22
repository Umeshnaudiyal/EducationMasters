import express from 'express';
import {
  uploadSingleMedia,
  getAllMedia,
  getMediaById,
  updateMedia,
  deleteMedia
} from '../controllers/media.controller.js';
import { upload } from '../middlewares/upload.middleware.js';
import { protect, restrictTo, optionalAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Upload Single File Route: POST /apis/v1/media/upload (Protected Admin/Editor/Writer)
router.post('/upload', protect, restrictTo('admin', 'superadmin', 'editor', 'writer'), upload.any(), uploadSingleMedia);

// Get All Media: GET /apis/v1/media (Public view / Admin library)
router.get('/', optionalAuth, getAllMedia);

// Get Media by ID: GET /apis/v1/media/:id
router.get('/:id', optionalAuth, getMediaById);

// Update and Delete Media (Protected)
router.put('/:id', protect, restrictTo('admin', 'superadmin', 'editor', 'writer'), updateMedia);
router.delete('/:id', protect, restrictTo('admin', 'superadmin'), deleteMedia);

export default router;
