import express from 'express';
import {
  getInstitutes,
  getInstituteBySlug,
  createInstitute,
  updateInstitute,
  deleteInstitute,
  bulkActionInstitutes,
} from '../controllers/institute.controller.js';

const router = express.Router();

router.post('/bulk', bulkActionInstitutes);
router.route('/').get(getInstitutes).post(createInstitute);
router.route('/:slug').get(getInstituteBySlug).put(updateInstitute).delete(deleteInstitute);

export default router;
