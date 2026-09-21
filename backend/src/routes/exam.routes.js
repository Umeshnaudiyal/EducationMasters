import express from 'express';
import {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  bulkActionExams,
} from '../controllers/exam.controller.js';

const router = express.Router();

router.post('/bulk', bulkActionExams);
router.route('/').get(getExams).post(createExam);
router.route('/:id').get(getExamById).put(updateExam).delete(deleteExam);

export default router;
