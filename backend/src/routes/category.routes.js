import express from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories,
} from '../controllers/category.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';

const router = express.Router();

const CATEGORY_CACHE_PATTERNS = ['/apis/v1/categories*', '/apis/v1/category*'];

router.get('/', cacheResponse(1800), getAllCategories);
router.post('/', protect, restrictTo('admin', 'superadmin', 'editor'), invalidateCache(...CATEGORY_CACHE_PATTERNS), createCategory);
router.post('/bulk-delete', protect, restrictTo('admin', 'superadmin'), invalidateCache(...CATEGORY_CACHE_PATTERNS), bulkDeleteCategories);
router.get('/:id', cacheResponse(1800), getCategoryById);
router.put('/:id', protect, restrictTo('admin', 'superadmin', 'editor'), invalidateCache(...CATEGORY_CACHE_PATTERNS), updateCategory);
router.delete('/:id', protect, restrictTo('admin', 'superadmin'), invalidateCache(...CATEGORY_CACHE_PATTERNS), deleteCategory);

export default router;

