import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import Subject from '../models/subject.model.js';
import { validateUniqueSlug, slugify } from '../utils/slug.js';

const validateSubjectData = async (data, { isNew = false, currentId = null } = {}) => {
  const errors = {};

  if (isNew || data.name !== undefined) {
    const name = String(data.name || '').trim();
    if (!name) {
      errors.name = 'Subject name is required';
    } else if (name.length < 2) {
      errors.name = 'Subject name must be at least 2 characters long';
    } else if (name.length > 200) {
      errors.name = 'Subject name cannot exceed 200 characters';
    }
  }

  if (isNew || data.slug !== undefined) {
    const slugValidation = await validateUniqueSlug(Subject, {
      slug: data.slug,
      fallbackText: data.name,
      currentId,
      modelLabel: 'subject',
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

export const getSubjects = asyncHandler(async (req, res) => {
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

  const [subjects, total] = await Promise.all([
    Subject.find(query)
      .sort({ sql_id: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Subject.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: subjects,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
  });
});

export const getSubjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  const subject = isObjectId
    ? await Subject.findById(id).lean()
    : await Subject.findOne({ slug: id }).lean();

  if (!subject) {
    throw new ApiError(404, 'Subject not found');
  }

  res.status(200).json(new ApiResponse(200, subject, 'Subject retrieved successfully'));
});

export const createSubject = asyncHandler(async (req, res) => {
  const { name, slug, image, description, seo } = req.body;

  const validation = await validateSubjectData(req.body, { isNew: true });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: Object.values(validation.errors)[0] || 'Validation failed. Please fix the highlighted fields.',
      errors: validation.errors,
    });
  }

  const cleanSlug = slug ? slugify(slug) : slugify(name);
  const highest = await Subject.findOne({ sql_id: { $ne: null } }).sort({ sql_id: -1 }).select('sql_id').lean();
  const nextSqlId = (highest?.sql_id || 0) + 1;

  const subject = await Subject.create({
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

  res.status(201).json(new ApiResponse(201, subject, 'Subject created successfully'));
});

export const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const subject = await Subject.findById(id);
  if (!subject) {
    throw new ApiError(404, 'Subject not found');
  }

  const validation = await validateSubjectData(req.body, { isNew: false, currentId: subject._id });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: Object.values(validation.errors)[0] || 'Validation failed. Please fix the highlighted fields.',
      errors: validation.errors,
    });
  }

  const { name, slug, image, description, seo } = req.body;

  if (name !== undefined) subject.name = name.trim();
  if (slug !== undefined) subject.slug = slugify(slug);
  if (image !== undefined) subject.image = image ? image.trim() : '';
  if (description !== undefined) subject.description = description;

  if (seo) {
    subject.seo = {
      allow_indexing: seo.allow_indexing !== undefined ? Boolean(seo.allow_indexing) : subject.seo?.allow_indexing ?? true,
      meta_title: seo.meta_title !== undefined ? seo.meta_title : subject.seo?.meta_title ?? '',
      meta_keywords: seo.meta_keywords !== undefined ? seo.meta_keywords : subject.seo?.meta_keywords ?? '',
      meta_description: seo.meta_description !== undefined ? seo.meta_description : subject.seo?.meta_description ?? '',
    };
  }

  await subject.save();
  res.status(200).json(new ApiResponse(200, subject, 'Subject updated successfully'));
});

export const deleteSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const subject = await Subject.findByIdAndDelete(id);
  if (!subject) {
    throw new ApiError(404, 'Subject not found');
  }
  res.status(200).json(new ApiResponse(200, null, 'Subject deleted successfully'));
});

export const bulkActionSubjects = asyncHandler(async (req, res) => {
  const { action, ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'No subjects selected');
  }

  if (action === 'delete') {
    await Subject.deleteMany({ _id: { $in: ids } });
    return res.status(200).json(new ApiResponse(200, null, `Deleted ${ids.length} subjects`));
  }

  throw new ApiError(400, 'Invalid bulk action');
});
