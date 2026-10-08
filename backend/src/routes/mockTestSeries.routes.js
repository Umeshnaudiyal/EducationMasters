import express from 'express';
import {
  getMockTestSeriesList,
  getMockTestSeriesBySlugOrId,
  createMockTestSeries,
  updateMockTestSeries,
  deleteMockTestSeries,
  bulkActionMockTestSeries,
} from '../controllers/mockTestSeries.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getMockTestSeriesList);
router.get('/:identifier', getMockTestSeriesBySlugOrId);

// Admin / protected routes
router.post('/bulk-action', verifyJWT, bulkActionMockTestSeries);
router.post('/', verifyJWT, createMockTestSeries);
router.put('/:id', verifyJWT, updateMockTestSeries);
router.delete('/:id', verifyJWT, deleteMockTestSeries);

export default router;
