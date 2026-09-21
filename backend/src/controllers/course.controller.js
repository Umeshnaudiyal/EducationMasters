import { Course } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { validateUniqueSlug } from '../utils/slug.js';

export const getCourses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const search = (req.query.search || req.query.q || '').trim();

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } },
      { info: { $regex: search, $options: 'i' } },
    ];
  }

  const [courses, total] = await Promise.all([
    Course.find(query)
      .sort({ name: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Course.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: courses.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data: courses,
  });
});

export const getAllCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ disabled: { $ne: true } })
    .sort({ name: 1 })
    .select('_id name slug')
    .lean();

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses,
  });
});

export const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }
  res.status(200).json({ success: true, data: course });
});

export const createCourse = asyncHandler(async (req, res) => {
  const { name, slug, info } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({
      success: false,
      message: 'Course name is required',
      errors: { name: 'Course name is required' },
    });
  }

  const slugValidation = await validateUniqueSlug(Course, {
    slug,
    fallbackText: name,
    modelLabel: 'course',
    isRequired: true,
  });

  if (!slugValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: slugValidation.error,
      errors: { slug: slugValidation.error },
    });
  }

  const count = await Course.countDocuments();
  const course = await Course.create({
    sql_id: count + 1,
    name: name.trim(),
    slug: slugValidation.slug,
    info: info || '',
  });

  res.status(201).json({ success: true, data: course, message: 'Course created successfully' });
});

export const updateCourse = asyncHandler(async (req, res) => {
  const { name, slug, info } = req.body;
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  if (name !== undefined) {
    if (!String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Course name cannot be empty',
        errors: { name: 'Course name cannot be empty' },
      });
    }
    course.name = name.trim();
  }

  if (slug !== undefined && String(slug).trim()) {
    const slugValidation = await validateUniqueSlug(Course, {
      slug,
      currentId: course._id,
      modelLabel: 'course',
      isRequired: true,
    });

    if (!slugValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: slugValidation.error,
        errors: { slug: slugValidation.error },
      });
    }

    course.slug = slugValidation.slug;
  }

  if (info !== undefined) course.info = info;

  await course.save();
  res.status(200).json({ success: true, data: course, message: 'Course updated successfully' });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }
  res.status(200).json({ success: true, message: 'Course deleted successfully' });
});

export const bulkActionCourses = asyncHandler(async (req, res) => {
  const { action, ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'No items selected' });
  }

  if (action === 'delete') {
    await Course.deleteMany({ _id: { $in: ids } });
    return res.status(200).json({ success: true, message: `Successfully deleted ${ids.length} courses` });
  }

  res.status(400).json({ success: false, message: 'Invalid action' });
});
