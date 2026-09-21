import express from 'express';
import {
  getTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  bulkActionTopics,
} from '../controllers/topic.controller.js';

const router = express.Router();

router.post('/bulk', bulkActionTopics);
router.route('/').get(getTopics).post(createTopic);
router.route('/:id').get(getTopicById).put(updateTopic).delete(deleteTopic);

export default router;
