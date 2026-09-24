import express from 'express';
import {
  getJobs,
  getExpiringJobs,
  getJobBySlug,
  createJob,
  updateJob,
  deleteJob
} from '../controllers/job.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';

const router = express.Router();

const JOB_CACHE_PATTERNS = ['job*', 'search*'];

router.get('/', cacheResponse(300), getJobs);
router.post('/', optionalAuth, invalidateCache(...JOB_CACHE_PATTERNS), createJob);
router.get('/expiring-soon', cacheResponse(300), getExpiringJobs);
router.get('/:slug', cacheResponse(300), getJobBySlug);
router.put('/:id', optionalAuth, invalidateCache(...JOB_CACHE_PATTERNS), updateJob);
router.delete('/:id', optionalAuth, invalidateCache(...JOB_CACHE_PATTERNS), deleteJob);

export default router;

