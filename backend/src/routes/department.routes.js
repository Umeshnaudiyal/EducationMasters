import express from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  bulkActionDepartments,
} from '../controllers/department.controller.js';

const router = express.Router();

router.post('/bulk', bulkActionDepartments);
router.route('/').get(getDepartments).post(createDepartment);
router.route('/:id').get(getDepartmentById).put(updateDepartment).delete(deleteDepartment);

export default router;
