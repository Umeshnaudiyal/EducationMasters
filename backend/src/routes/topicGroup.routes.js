import express from 'express';
import {
  getTopicGroups,
  getTopicGroupById,
  createTopicGroup,
  updateTopicGroup,
  deleteTopicGroup,
  bulkActionTopicGroups,
} from '../controllers/topicGroup.controller.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';

const router = express.Router();
const TOPIC_GROUP_PATTERNS = ['topic-group*', 'topic*', 'search*'];

router.post('/bulk', invalidateCache(...TOPIC_GROUP_PATTERNS), bulkActionTopicGroups);
router.route('/')
  .get(cacheResponse(1800), getTopicGroups)
  .post(invalidateCache(...TOPIC_GROUP_PATTERNS), createTopicGroup);
router.route('/:id')
  .get(cacheResponse(1800), getTopicGroupById)
  .put(invalidateCache(...TOPIC_GROUP_PATTERNS), updateTopicGroup)
  .delete(invalidateCache(...TOPIC_GROUP_PATTERNS), deleteTopicGroup);

export default router;
