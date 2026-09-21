import express from 'express';
import {
  getTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
  bulkActionTags,
} from '../controllers/tag.controller.js';

const router = express.Router();

router.post('/bulk', bulkActionTags);
router.route('/').get(getTags).post(createTag);
router.route('/:id').get(getTagById).put(updateTag).delete(deleteTag);

export default router;
