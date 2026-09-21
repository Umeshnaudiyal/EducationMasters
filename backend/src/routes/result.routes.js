import express from 'express';
import {
  getResults,
  getResultBySlug,
  createResult,
  updateResult,
  deleteResult,
} from '../controllers/result.controller.js';

const router = express.Router();

router.get('/', getResults);
router.post('/', createResult);
router.get('/:slug', getResultBySlug);
router.put('/:id', updateResult);
router.delete('/:id', deleteResult);

export default router;
