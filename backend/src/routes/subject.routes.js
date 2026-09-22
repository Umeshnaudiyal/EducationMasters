import express from 'express';
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  bulkActionSubjects,
} from '../controllers/subject.controller.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';

const router = express.Router();

const SUBJECT_CACHE_PATTERNS = ['/apis/v1/subject*', '/apis/v1/subjects*'];

router.post('/bulk', invalidateCache(...SUBJECT_CACHE_PATTERNS), bulkActionSubjects);
router.route('/')
  .get(cacheResponse(1800), getSubjects)
  .post(invalidateCache(...SUBJECT_CACHE_PATTERNS), createSubject);
router.route('/:id')
  .get(cacheResponse(1800), getSubjectById)
  .put(invalidateCache(...SUBJECT_CACHE_PATTERNS), updateSubject)
  .delete(invalidateCache(...SUBJECT_CACHE_PATTERNS), deleteSubject);

export default router;

