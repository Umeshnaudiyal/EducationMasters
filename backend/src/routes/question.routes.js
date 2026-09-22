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
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';

const router = express.Router();

const QUESTION_CACHE_PATTERNS = ['/apis/v1/question*', '/apis/v1/questions*', '/apis/v1/mcqs*'];

router.get('/', cacheResponse(600), getQuestions);
router.get('/:id', cacheResponse(600), getQuestionById);

router.post('/bulk-action', protect, restrictTo('admin', 'superadmin'), invalidateCache(...QUESTION_CACHE_PATTERNS), bulkActionQuestions);
router.post('/import-excel', protect, restrictTo('admin', 'superadmin', 'editor'), invalidateCache(...QUESTION_CACHE_PATTERNS), importExcelQuestions);
router.put('/:id/restore', protect, restrictTo('admin', 'superadmin'), invalidateCache(...QUESTION_CACHE_PATTERNS), restoreQuestion);

router.post('/', protect, restrictTo('admin', 'superadmin', 'editor', 'writer'), invalidateCache(...QUESTION_CACHE_PATTERNS), createQuestion);
router.put('/:id', protect, restrictTo('admin', 'superadmin', 'editor', 'writer'), invalidateCache(...QUESTION_CACHE_PATTERNS), updateQuestion);
router.delete('/:id', protect, restrictTo('admin', 'superadmin'), invalidateCache(...QUESTION_CACHE_PATTERNS), deleteQuestion);

export default router;

