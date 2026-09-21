import express from 'express';
import {
  uploadSingleMedia,
  getAllMedia,
  getMediaById,
  updateMedia,
  deleteMedia
} from '../controllers/media.controller.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

// Upload Single File Route: POST /apis/v1/media/upload
router.post('/upload', upload.any(), uploadSingleMedia);

// Get All Media: GET /apis/v1/media
router.get('/', getAllMedia);

// Get Media by ID: GET /apis/v1/media/:id
router.get('/:id', getMediaById);
router.put('/:id', updateMedia);
router.delete('/:id', deleteMedia);

export default router;
