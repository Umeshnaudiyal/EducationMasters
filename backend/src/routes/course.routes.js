import express from 'express';
import {
  getCourses,
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  bulkActionCourses,
} from '../controllers/course.controller.js';

const router = express.Router();

router.get('/all', getAllCourses);
router.post('/bulk', bulkActionCourses);
router.route('/').get(getCourses).post(createCourse);
router.route('/:id').get(getCourseById).put(updateCourse).delete(deleteCourse);

export default router;
