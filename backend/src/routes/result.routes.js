import express from 'express';
import {
  getResults,
  getResultBySlug,
  createResult,
  updateResult,
  deleteResult,
} from '../controllers/result.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';

const router = express.Router();

const RESULT_CACHE_PATTERNS = ['result*', 'search*'];

router.get('/', cacheResponse(300), getResults);
router.post('/', optionalAuth, invalidateCache(...RESULT_CACHE_PATTERNS), createResult);
router.get('/:slug', cacheResponse(300), getResultBySlug);
router.put('/:id', optionalAuth, invalidateCache(...RESULT_CACHE_PATTERNS), updateResult);
router.delete('/:id', optionalAuth, invalidateCache(...RESULT_CACHE_PATTERNS), deleteResult);

export default router;

