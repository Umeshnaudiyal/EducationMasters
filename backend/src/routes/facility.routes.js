import express from 'express';
import {
  getFacilities,
  getAllFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
  bulkActionFacilities,
} from '../controllers/facility.controller.js';

const router = express.Router();

router.get('/all', getAllFacilities);
router.post('/bulk', bulkActionFacilities);
router.route('/').get(getFacilities).post(createFacility);
router.route('/:id').get(getFacilityById).put(updateFacility).delete(deleteFacility);

export default router;
