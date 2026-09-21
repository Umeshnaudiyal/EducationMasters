import express from 'express';
import {
  getAdmitCards,
  getAdmitCardBySlug,
  createAdmitCard,
  updateAdmitCard,
  deleteAdmitCard,
} from '../controllers/admitCard.controller.js';

const router = express.Router();

router.route('/')
  .get(getAdmitCards)
  .post(createAdmitCard);

router.route('/:slug')
  .get(getAdmitCardBySlug);

router.route('/:id')
  .put(updateAdmitCard)
  .delete(deleteAdmitCard);

export default router;
