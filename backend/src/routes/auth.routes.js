import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  getSessionInfo,
  getSessionLogs,
  getDailyDashboardLogs,
  getUserCalendarHistory,
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.get('/session-info', getSessionInfo);
router.get('/logs', protect, getSessionLogs);
router.get('/daily-dashboard-logs', protect, getDailyDashboardLogs);
router.get('/calendar-history', protect, getUserCalendarHistory);
router.get('/calendar-history/:userId', protect, getUserCalendarHistory);

export default router;
