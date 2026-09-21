import express from 'express';
import {
  getTopicGroups,
  getTopicGroupById,
  createTopicGroup,
  updateTopicGroup,
  deleteTopicGroup,
  bulkActionTopicGroups,
} from '../controllers/topicGroup.controller.js';

const router = express.Router();

router.post('/bulk', bulkActionTopicGroups);
router.route('/').get(getTopicGroups).post(createTopicGroup);
router.route('/:id').get(getTopicGroupById).put(updateTopicGroup).delete(deleteTopicGroup);

export default router;
