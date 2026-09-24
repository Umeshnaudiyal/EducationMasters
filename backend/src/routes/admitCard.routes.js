import express from 'express';
import {
  getAdmitCards,
  getAdmitCardBySlug,
  createAdmitCard,
  updateAdmitCard,
  deleteAdmitCard,
} from '../controllers/admitCard.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';

const router = express.Router();

const ADMIT_CARD_CACHE_PATTERNS = ['admit-card*', 'search*'];

router.route('/')
  .get(cacheResponse(300), getAdmitCards)
  .post(optionalAuth, invalidateCache(...ADMIT_CARD_CACHE_PATTERNS), createAdmitCard);

router.route('/:slug')
  .get(cacheResponse(300), getAdmitCardBySlug);

router.route('/:id')
  .put(optionalAuth, invalidateCache(...ADMIT_CARD_CACHE_PATTERNS), updateAdmitCard)
  .delete(optionalAuth, invalidateCache(...ADMIT_CARD_CACHE_PATTERNS), deleteAdmitCard);

export default router;

