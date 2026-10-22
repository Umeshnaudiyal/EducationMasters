import express from 'express';
import {
  getPoolStatus,
  createSession,
  initSession,
  getSessionQR,
  disconnectSession,
  deleteSession,
  sendTestOTP,
  sendMessage,
  verifyOTP,
  getLogs,
} from '../controllers/whatsapp.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Pool status and sessions management
router.get('/status', getPoolStatus);
router.get('/pool-status', getPoolStatus);
router.get('/sessions', getPoolStatus);
router.post('/sessions', optionalAuth, createSession);
router.post('/sessions/:sessionId/init', optionalAuth, initSession);
router.get('/sessions/:sessionId/qr', getSessionQR);
router.post('/sessions/:sessionId/disconnect', optionalAuth, disconnectSession);
router.delete('/sessions/:sessionId', optionalAuth, deleteSession);

// OTP generation & dispatch via pool
router.post('/send-otp', optionalAuth, sendTestOTP);
router.post('/send-message', optionalAuth, sendMessage);
router.post('/verify-otp', verifyOTP);

// Dispatch Logs
router.get('/logs', optionalAuth, getLogs);

export default router;
