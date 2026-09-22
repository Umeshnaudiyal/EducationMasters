import express from 'express';
import {
  getInstitutes,
  getInstituteBySlug,
  createInstitute,
  updateInstitute,
  deleteInstitute,
  bulkActionInstitutes,
} from '../controllers/institute.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/bulk', protect, restrictTo('admin', 'superadmin'), bulkActionInstitutes);
router.route('/')
  .get(getInstitutes)
  .post(protect, restrictTo('admin', 'superadmin', 'editor'), createInstitute);

router.route('/:slug')
  .get(getInstituteBySlug)
  .put(protect, restrictTo('admin', 'superadmin', 'editor'), updateInstitute)
  .delete(protect, restrictTo('admin', 'superadmin'), deleteInstitute);

export default router;
