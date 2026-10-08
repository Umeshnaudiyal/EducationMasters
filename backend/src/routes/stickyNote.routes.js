import express from 'express';
import {
  getStickyNotes,
  getStickyNoteById,
  createStickyNote,
  updateStickyNote,
  deleteStickyNote,
  toggleArchiveStickyNote,
  incrementViewCount,
} from '../controllers/stickyNote.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', getStickyNotes);
router.get('/:id', getStickyNoteById);
router.post('/', optionalAuth, createStickyNote);
router.put('/:id', optionalAuth, updateStickyNote);
router.delete('/:id', optionalAuth, deleteStickyNote);
router.patch('/:id/archive', optionalAuth, toggleArchiveStickyNote);
router.post('/:id/view', incrementViewCount);

export default router;
