import express from 'express';
import {
  getMockTests,
  getMockTestById,
  createMockTest,
  updateMockTest,
  deleteMockTest,
  allocateQuestionsToTest,
  submitTestAttempt,
  getUserAttempts,
  getTestLeaderboard,
  getSeriesLeaderboard,
  getGlobalLeaderboard,
} from '../controllers/mockTest.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes (Specific routes first before /:id)
router.get('/leaderboard/global', getGlobalLeaderboard);
router.get('/user/attempts', getUserAttempts);
router.get('/series/:seriesId/leaderboard', getSeriesLeaderboard);
router.get('/:id/leaderboard', getTestLeaderboard);
router.get('/', getMockTests);
router.get('/:id', getMockTestById);
router.post('/:id/submit', submitTestAttempt);

// Admin / protected routes
router.post('/', verifyJWT, createMockTest);
router.put('/:id', verifyJWT, updateMockTest);
router.delete('/:id', verifyJWT, deleteMockTest);
router.post('/:id/allocate-questions', verifyJWT, allocateQuestionsToTest);

export default router;
