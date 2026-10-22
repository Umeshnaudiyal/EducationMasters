import express from 'express';
import {
  submitQuestionReport,
  getQuestionReports,
  getQuestionReportById,
  updateQuestionReportStatus,
  updateQuestionFromReport,
  deleteQuestionReport,
} from '../controllers/questionReport.controller.js';
import { protect, restrictTo, optionalAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public / student submission route (optional authentication to link user account if logged in)
router.post('/', optionalAuth, submitQuestionReport);

// Admin & Superadmin management routes
router.get(
  '/',
  protect,
  restrictTo('superadmin', 'admin', 'editor', 'author'),
  getQuestionReports
);

// Direct question update from report
router.put(
  '/:id/update-question',
  protect,
  restrictTo('superadmin', 'admin', 'editor'),
  updateQuestionFromReport
);

router
  .route('/:id')
  .get(
    protect,
    restrictTo('superadmin', 'admin', 'editor', 'author'),
    getQuestionReportById
  )
  .put(
    protect,
    restrictTo('superadmin', 'admin', 'editor'),
    updateQuestionReportStatus
  )
  .delete(
    protect,
    restrictTo('superadmin', 'admin'),
    deleteQuestionReport
  );

export default router;
