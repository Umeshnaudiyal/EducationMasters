import express from 'express';
import {
  getInstitutes,
  getInstituteBySlug,
  createInstitute,
  updateInstitute,
  deleteInstitute,
  bulkActionInstitutes,
} from '../controllers/institute.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';

const router = express.Router();
const INSTITUTE_CACHE_PATTERNS = ['institute*', 'search*'];

router.post('/bulk', optionalAuth, invalidateCache(...INSTITUTE_CACHE_PATTERNS), bulkActionInstitutes);
router.route('/')
  .get(cacheResponse(180), getInstitutes)
  .post(optionalAuth, invalidateCache(...INSTITUTE_CACHE_PATTERNS), createInstitute);

router.route('/:slug')
  .get(cacheResponse(180), getInstituteBySlug)
  .put(optionalAuth, invalidateCache(...INSTITUTE_CACHE_PATTERNS), updateInstitute)
  .delete(optionalAuth, invalidateCache(...INSTITUTE_CACHE_PATTERNS), deleteInstitute);

export default router;
