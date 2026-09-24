import express from 'express';
import {
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog
} from '../controllers/blog.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';

const router = express.Router();

const BLOG_CACHE_PATTERNS = ['blog*', 'search*'];

router.get('/', cacheResponse(600), getBlogs);
router.post('/', optionalAuth, invalidateCache(...BLOG_CACHE_PATTERNS), createBlog);
router.get('/:slug', cacheResponse(600), getBlogBySlug);
router.put('/:id', optionalAuth, invalidateCache(...BLOG_CACHE_PATTERNS), updateBlog);
router.delete('/:id', optionalAuth, invalidateCache(...BLOG_CACHE_PATTERNS), deleteBlog);

export default router;

