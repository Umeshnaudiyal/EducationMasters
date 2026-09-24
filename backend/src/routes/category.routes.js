import express from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories,
} from '../controllers/category.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';

const router = express.Router();

const CATEGORY_CACHE_PATTERNS = ['categor*', 'search*'];

router.get('/', cacheResponse(1800), getAllCategories);
router.post('/', optionalAuth, invalidateCache(...CATEGORY_CACHE_PATTERNS), createCategory);
router.post('/bulk-delete', optionalAuth, invalidateCache(...CATEGORY_CACHE_PATTERNS), bulkDeleteCategories);
router.get('/:id', cacheResponse(1800), getCategoryById);
router.put('/:id', optionalAuth, invalidateCache(...CATEGORY_CACHE_PATTERNS), updateCategory);
router.delete('/:id', optionalAuth, invalidateCache(...CATEGORY_CACHE_PATTERNS), deleteCategory);

export default router;

