import express from 'express';
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  restoreQuestion,
  bulkActionQuestions,
  importExcelQuestions,
} from '../controllers/question.controller.js';
import { protect, restrictTo, optionalAuth } from '../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';

const router = express.Router();

const QUESTION_CACHE_PATTERNS = ['question*', 'mcq*', 'search*'];

router.get('/', optionalAuth, cacheResponse(60), getQuestions);
router.get('/:id', optionalAuth, cacheResponse(60), getQuestionById);

router.post('/bulk-action', optionalAuth, invalidateCache(...QUESTION_CACHE_PATTERNS), bulkActionQuestions);
router.post('/import-excel', optionalAuth, invalidateCache(...QUESTION_CACHE_PATTERNS), importExcelQuestions);
router.put('/:id/restore', optionalAuth, invalidateCache(...QUESTION_CACHE_PATTERNS), restoreQuestion);

router.post('/', optionalAuth, invalidateCache(...QUESTION_CACHE_PATTERNS), createQuestion);
router.put('/:id', optionalAuth, invalidateCache(...QUESTION_CACHE_PATTERNS), updateQuestion);
router.delete('/:id', optionalAuth, invalidateCache(...QUESTION_CACHE_PATTERNS), deleteQuestion);

export default router;

