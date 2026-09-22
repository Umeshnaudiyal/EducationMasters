import express from 'express';
import {
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog
} from '../controllers/blog.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';

const router = express.Router();

const BLOG_CACHE_PATTERNS = ['/apis/v1/blog*', '/apis/v1/blogs*', '/apis/v1/search*'];

router.get('/', cacheResponse(600), getBlogs);
router.post('/', protect, restrictTo('admin', 'superadmin', 'editor', 'writer'), invalidateCache(...BLOG_CACHE_PATTERNS), createBlog);
router.get('/:slug', cacheResponse(600), getBlogBySlug);
router.put('/:id', protect, restrictTo('admin', 'superadmin', 'editor', 'writer'), invalidateCache(...BLOG_CACHE_PATTERNS), updateBlog);
router.delete('/:id', protect, restrictTo('admin', 'superadmin'), invalidateCache(...BLOG_CACHE_PATTERNS), deleteBlog);

export default router;

