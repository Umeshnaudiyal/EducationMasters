import express from 'express';
import {
  getStates,
  getStateById,
  createState,
  updateState,
  deleteState,
  bulkActionStates,
  getDistricts,
  getDistrictsByState,
} from '../controllers/state.controller.js';
import { verifyToken, checkRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', getStates);
router.get('/districts', getDistricts);
router.get('/:stateId/districts', getDistrictsByState);
router.get('/:id', getStateById);

router.post('/bulk-action', verifyToken, checkRole('admin', 'editor'), bulkActionStates);
router.post('/', verifyToken, checkRole('admin', 'editor'), createState);
router.put('/:id', verifyToken, checkRole('admin', 'editor'), updateState);
router.delete('/:id', verifyToken, checkRole('admin', 'editor'), deleteState);

export default router;
