import express from 'express';
import {
  getTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  bulkActionTopics,
} from '../controllers/topic.controller.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';

const router = express.Router();

const TOPIC_CACHE_PATTERNS = ['/apis/v1/topic*', '/apis/v1/topics*'];

router.post('/bulk', invalidateCache(...TOPIC_CACHE_PATTERNS), bulkActionTopics);
router.route('/')
  .get(cacheResponse(1800), getTopics)
  .post(invalidateCache(...TOPIC_CACHE_PATTERNS), createTopic);
router.route('/:id')
  .get(cacheResponse(1800), getTopicById)
  .put(invalidateCache(...TOPIC_CACHE_PATTERNS), updateTopic)
  .delete(invalidateCache(...TOPIC_CACHE_PATTERNS), deleteTopic);

export default router;

