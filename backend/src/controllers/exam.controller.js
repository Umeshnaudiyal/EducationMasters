import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import Exam from '../models/exam.model.js';
import { validateUniqueSlug, slugify } from '../utils/slug.js';

const validateExamData = async (data, { isNew = false, currentId = null } = {}) => {
  const errors = {};

  if (isNew || data.name !== undefined) {
    const name = String(data.name || '').trim();
    if (!name) {
      errors.name = 'Examination name is required';
    } else if (name.length < 2) {
      errors.name = 'Examination name must be at least 2 characters long';
    } else if (name.length > 200) {
      errors.name = 'Examination name cannot exceed 200 characters';
    }
  }

  if (isNew || data.slug !== undefined) {
    const slugValidation = await validateUniqueSlug(Exam, {
      slug: data.slug,
      fallbackText: data.name,
      currentId,
      modelLabel: 'examination',
      isRequired: true,
    });

    if (!slugValidation.isValid) {
      errors.slug = slugValidation.error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const getExams = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const search = (req.query.search || req.query.q || '').trim();

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const [exams, total] = await Promise.all([
    Exam.find(query)
      .sort({ sql_id: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Exam.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: exams,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
  });
});

export const getExamById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  const exam = isObjectId
    ? await Exam.findById(id).lean()
    : await Exam.findOne({ slug: id }).lean();

  if (!exam) {
    throw new ApiError(404, 'Examination not found');
  }

  res.status(200).json(new ApiResponse(200, exam, 'Examination retrieved successfully'));
});

export const createExam = asyncHandler(async (req, res) => {
  const { name, slug, image, description, seo } = req.body;

  const validation = await validateExamData(req.body, { isNew: true });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: Object.values(validation.errors)[0] || 'Validation failed. Please fix the highlighted fields.',
      errors: validation.errors,
    });
  }

  const cleanSlug = slug ? slugify(slug) : slugify(name);
  const highest = await Exam.findOne({ sql_id: { $ne: null } }).sort({ sql_id: -1 }).select('sql_id').lean();
  const nextSqlId = (highest?.sql_id || 0) + 1;

  const exam = await Exam.create({
    sql_id: nextSqlId,
    name: name.trim(),
    slug: cleanSlug,
    image: image ? image.trim() : '',
    description: description || '',
    seo: {
      allow_indexing: seo?.allow_indexing !== undefined ? Boolean(seo.allow_indexing) : true,
      meta_title: seo?.meta_title || name.trim(),
      meta_keywords: seo?.meta_keywords || '',
      meta_description: seo?.meta_description || description || '',
    },
  });

  res.status(201).json(new ApiResponse(201, exam, 'Examination created successfully'));
});

export const updateExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const exam = await Exam.findById(id);
  if (!exam) {
    throw new ApiError(404, 'Examination not found');
  }

  const validation = await validateExamData(req.body, { isNew: false, currentId: exam._id });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: Object.values(validation.errors)[0] || 'Validation failed. Please fix the highlighted fields.',
      errors: validation.errors,
    });
  }

  const { name, slug, image, description, seo } = req.body;

  if (name !== undefined) exam.name = name.trim();
  if (slug !== undefined) exam.slug = slugify(slug);
  if (image !== undefined) exam.image = image ? image.trim() : '';
  if (description !== undefined) exam.description = description;

  if (seo) {
    exam.seo = {
      allow_indexing: seo.allow_indexing !== undefined ? Boolean(seo.allow_indexing) : exam.seo?.allow_indexing ?? true,
      meta_title: seo.meta_title !== undefined ? seo.meta_title : exam.seo?.meta_title ?? '',
      meta_keywords: seo.meta_keywords !== undefined ? seo.meta_keywords : exam.seo?.meta_keywords ?? '',
      meta_description: seo.meta_description !== undefined ? seo.meta_description : exam.seo?.meta_description ?? '',
    };
  }

  await exam.save();
  res.status(200).json(new ApiResponse(200, exam, 'Examination updated successfully'));
});

export const deleteExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const exam = await Exam.findByIdAndDelete(id);
  if (!exam) {
    throw new ApiError(404, 'Examination not found');
  }
  res.status(200).json(new ApiResponse(200, null, 'Examination deleted successfully'));
});

export const bulkActionExams = asyncHandler(async (req, res) => {
  const { action, ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'No examinations selected');
  }

  if (action === 'delete') {
    await Exam.deleteMany({ _id: { $in: ids } });
    return res.status(200).json(new ApiResponse(200, null, `Deleted ${ids.length} examinations`));
  }

  throw new ApiError(400, 'Invalid bulk action');
});
