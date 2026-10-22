import express from 'express';
import { getSettings, updateSettings, getGlobalStatus } from '../controllers/settings.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', optionalAuth, getSettings);
router.put('/', optionalAuth, updateSettings);
router.post('/', optionalAuth, updateSettings);
router.get('/status', getGlobalStatus);

export default router;
