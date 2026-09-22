import express from 'express';
import { getBriefStats, getDashboardStats, getCacheStats, clearCacheEndpoint } from '../controllers/stats.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/brief', getBriefStats);
router.get('/dashboard', getDashboardStats);
router.get('/cache', getCacheStats);
router.post('/cache/clear', protect, restrictTo('admin', 'superadmin'), clearCacheEndpoint);

export default router;

