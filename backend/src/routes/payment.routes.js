import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  getUserPassStatus,
  getAllPaymentsAdmin,
} from '../controllers/payment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public / Aspirant endpoints
router.post('/create-order', createPaymentOrder);
router.post('/verify-payment', verifyPayment);
router.get('/user-status', getUserPassStatus);

// Admin-only endpoints
router.get('/admin/all', verifyJWT, getAllPaymentsAdmin);

export default router;
