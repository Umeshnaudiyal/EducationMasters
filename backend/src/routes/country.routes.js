import express from 'express';
import {
  getCountries,
  getCountryById,
  createCountry,
  updateCountry,
  deleteCountry,
} from '../controllers/country.controller.js';
import { verifyToken, checkRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', getCountries);
router.get('/:id', getCountryById);

router.post('/', verifyToken, checkRole('admin', 'editor'), createCountry);
router.put('/:id', verifyToken, checkRole('admin', 'editor'), updateCountry);
router.delete('/:id', verifyToken, checkRole('admin', 'editor'), deleteCountry);

export default router;
