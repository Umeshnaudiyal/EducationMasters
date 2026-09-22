import express from 'express';
import { globalSearch } from '../controllers/search.controller.js';
import { cacheResponse } from '../middlewares/cache.middleware.js';

const router = express.Router();

// GET /apis/v1/search?q=...&type=...&page=...&limit=...
router.get('/', cacheResponse(300), globalSearch);

export default router;

