import express from 'express';
import { getBriefStats, getDashboardStats } from '../controllers/stats.controller.js';

const router = express.Router();

router.get('/brief', getBriefStats);
router.get('/dashboard', getDashboardStats);

export default router;
