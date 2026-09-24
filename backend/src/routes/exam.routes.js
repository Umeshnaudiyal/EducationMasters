import express from 'express';
import {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  bulkActionExams,
} from '../controllers/exam.controller.js';
import { protect, restrictTo, optionalAuth } from '../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';

const router = express.Router();

const EXAM_CACHE_PATTERNS = ['exam*', 'search*'];

router.post('/bulk', optionalAuth, invalidateCache(...EXAM_CACHE_PATTERNS), bulkActionExams);
router.route('/')
  .get(optionalAuth, cacheResponse(60), getExams)
  .post(optionalAuth, invalidateCache(...EXAM_CACHE_PATTERNS), createExam);
router.route('/:id')
  .get(optionalAuth, cacheResponse(60), getExamById)
  .put(optionalAuth, invalidateCache(...EXAM_CACHE_PATTERNS), updateExam)
  .delete(optionalAuth, invalidateCache(...EXAM_CACHE_PATTERNS), deleteExam);

export default router;
