import express from 'express';
import {
  getJobs,
  getExpiringJobs,
  getJobBySlug,
  createJob,
  updateJob,
  deleteJob
} from '../controllers/job.controller.js';

const router = express.Router();

router.get('/', getJobs);
router.post('/', createJob);
router.get('/expiring-soon', getExpiringJobs);
router.get('/:slug', getJobBySlug);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

export default router;
