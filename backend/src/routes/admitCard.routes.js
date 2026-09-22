import express from 'express';
import {
  getAdmitCards,
  getAdmitCardBySlug,
  createAdmitCard,
  updateAdmitCard,
  deleteAdmitCard,
} from '../controllers/admitCard.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';

const router = express.Router();

const ADMIT_CARD_CACHE_PATTERNS = ['/apis/v1/admit-card*', '/apis/v1/admit-cards*', '/apis/v1/search*'];

router.route('/')
  .get(cacheResponse(300), getAdmitCards)
  .post(protect, restrictTo('admin', 'superadmin', 'editor', 'writer'), invalidateCache(...ADMIT_CARD_CACHE_PATTERNS), createAdmitCard);

router.route('/:slug')
  .get(cacheResponse(300), getAdmitCardBySlug);

router.route('/:id')
  .put(protect, restrictTo('admin', 'superadmin', 'editor', 'writer'), invalidateCache(...ADMIT_CARD_CACHE_PATTERNS), updateAdmitCard)
  .delete(protect, restrictTo('admin', 'superadmin'), invalidateCache(...ADMIT_CARD_CACHE_PATTERNS), deleteAdmitCard);

export default router;

