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

const router = express.Router();

router.get('/', getQuestions);
router.get('/:id', getQuestionById);

router.post('/bulk-action', bulkActionQuestions);
router.post('/import-excel', importExcelQuestions);
router.put('/:id/restore', restoreQuestion);

router.post('/', createQuestion);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

export default router;
