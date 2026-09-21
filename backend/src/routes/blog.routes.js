import express from 'express';
import {
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog
} from '../controllers/blog.controller.js';

const router = express.Router();

router.get('/', getBlogs);
router.post('/', createBlog);
router.get('/:slug', getBlogBySlug);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);

export default router;
