import express from 'express';
import {
  getResults,
  getResultBySlug,
  createResult,
  updateResult,
  deleteResult,
} from '../controllers/result.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';

const router = express.Router();

const RESULT_CACHE_PATTERNS = ['/apis/v1/result*', '/apis/v1/results*', '/apis/v1/search*'];

router.get('/', cacheResponse(300), getResults);
router.post('/', protect, restrictTo('admin', 'superadmin', 'editor', 'writer'), invalidateCache(...RESULT_CACHE_PATTERNS), createResult);
router.get('/:slug', cacheResponse(300), getResultBySlug);
router.put('/:id', protect, restrictTo('admin', 'superadmin', 'editor', 'writer'), invalidateCache(...RESULT_CACHE_PATTERNS), updateResult);
router.delete('/:id', protect, restrictTo('admin', 'superadmin'), invalidateCache(...RESULT_CACHE_PATTERNS), deleteResult);

export default router;

