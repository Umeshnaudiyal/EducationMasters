import express from 'express';
import {
  getPlans,
  getAllPlansAdmin,
  createPlan,
  updatePlan,
  deletePlan,
} from '../controllers/mockTestPlan.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', getPlans);
router.get('/admin/all', getAllPlansAdmin);
router.post('/', verifyJWT, createPlan);
router.put('/:id', verifyJWT, updatePlan);
router.delete('/:id', verifyJWT, deletePlan);

export default router;
