import express from 'express';
import { testConnection, sendTestEmail } from '../controllers/smtp.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/test', optionalAuth, testConnection);
router.post('/test-connection', optionalAuth, testConnection);
router.post('/send-test', optionalAuth, sendTestEmail);

export default router;
