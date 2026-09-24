import express from 'express';
import {
  uploadSingleMedia,
  getAllMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
} from '../controllers/media.controller.js';
import { upload } from '../middlewares/upload.middleware.js';
import { protect, restrictTo, optionalAuth } from '../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';

const router = express.Router();
const MEDIA_CACHE_PATTERNS = ['media*', 'search*'];

// Upload Single File Route: POST /apis/v1/media/upload (Protected Admin/Editor/Writer)
router.post('/upload', optionalAuth, invalidateCache(...MEDIA_CACHE_PATTERNS), upload.any(), uploadSingleMedia);

// Get All Media: GET /apis/v1/media (Public view / Admin library)
router.get('/', optionalAuth, cacheResponse(120), getAllMedia);

// Get Media by ID: GET /apis/v1/media/:id
router.get('/:id', optionalAuth, cacheResponse(120), getMediaById);

// Update and Delete Media (Protected)
router.put('/:id', optionalAuth, invalidateCache(...MEDIA_CACHE_PATTERNS), updateMedia);
router.delete('/:id', optionalAuth, invalidateCache(...MEDIA_CACHE_PATTERNS), deleteMedia);

export default router;
