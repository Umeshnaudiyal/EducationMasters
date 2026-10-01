import express from 'express';
import {
  subscribeNewsletter,
  getSubscribers,
  getSubscriberById,
  createSubscriber,
  updateSubscriber,
  deleteSubscriber,
  bulkActionSubscribers,
} from '../controllers/subscriber.controller.js';

const router = express.Router();

// Public subscription endpoints
router.post('/subscribe', subscribeNewsletter);

// Bulk actions endpoint
router.post('/bulk', bulkActionSubscribers);

// CRUD Collection endpoints
router.route('/')
  .get(getSubscribers)
  .post(createSubscriber);

// Single Item CRUD endpoints
router.route('/:id')
  .get(getSubscriberById)
  .put(updateSubscriber)
  .delete(deleteSubscriber);

export default router;
