import express from 'express';
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  bulkActionSubjects,
} from '../controllers/subject.controller.js';

const router = express.Router();

router.post('/bulk', bulkActionSubjects);
router.route('/').get(getSubjects).post(createSubject);
router.route('/:id').get(getSubjectById).put(updateSubject).delete(deleteSubject);

export default router;
