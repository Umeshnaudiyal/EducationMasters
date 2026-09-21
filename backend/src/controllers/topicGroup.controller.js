import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import TopicGroup from '../models/topicGroup.model.js';
import { validateUniqueSlug, slugify } from '../utils/slug.js';

const validateTopicGroupData = async (data, { isNew = false, currentId = null } = {}) => {
  const errors = {};

  if (isNew || data.name !== undefined) {
    const name = String(data.name || '').trim();
    if (!name) {
      errors.name = 'Topic Group name is required';
    } else if (name.length < 2) {
      errors.name = 'Topic Group name must be at least 2 characters long';
    } else if (name.length > 200) {
      errors.name = 'Topic Group name cannot exceed 200 characters';
    }
  }

  if (isNew || data.slug !== undefined) {
    const slugValidation = await validateUniqueSlug(TopicGroup, {
      slug: data.slug,
      fallbackText: data.name,
      currentId,
      modelLabel: 'topic group',
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

export const getTopicGroups = asyncHandler(async (req, res) => {
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

  const [groups, total] = await Promise.all([
    TopicGroup.find(query)
      .sort({ sql_id: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TopicGroup.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: groups,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
  });
});

export const getTopicGroupById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  const group = isObjectId
    ? await TopicGroup.findById(id).lean()
    : await TopicGroup.findOne({ slug: id }).lean();

  if (!group) {
    throw new ApiError(404, 'Topic Group not found');
  }

  res.status(200).json(new ApiResponse(200, group, 'Topic Group retrieved successfully'));
});

export const createTopicGroup = asyncHandler(async (req, res) => {
  const { name, slug, image, description, seo } = req.body;

  const validation = await validateTopicGroupData(req.body, { isNew: true });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: Object.values(validation.errors)[0] || 'Validation failed. Please fix the highlighted fields.',
      errors: validation.errors,
    });
  }

  const cleanSlug = slug ? slugify(slug) : slugify(name);
  const highest = await TopicGroup.findOne({ sql_id: { $ne: null } }).sort({ sql_id: -1 }).select('sql_id').lean();
  const nextSqlId = (highest?.sql_id || 0) + 1;

  const group = await TopicGroup.create({
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

  res.status(201).json(new ApiResponse(201, group, 'Topic Group created successfully'));
});

export const updateTopicGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const group = await TopicGroup.findById(id);
  if (!group) {
    throw new ApiError(404, 'Topic Group not found');
  }

  const validation = await validateTopicGroupData(req.body, { isNew: false, currentId: group._id });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: Object.values(validation.errors)[0] || 'Validation failed. Please fix the highlighted fields.',
      errors: validation.errors,
    });
  }

  const { name, slug, image, description, seo } = req.body;

  if (name !== undefined) group.name = name.trim();
  if (slug !== undefined) group.slug = slugify(slug);
  if (image !== undefined) group.image = image ? image.trim() : '';
  if (description !== undefined) group.description = description;

  if (seo) {
    group.seo = {
      allow_indexing: seo.allow_indexing !== undefined ? Boolean(seo.allow_indexing) : group.seo?.allow_indexing ?? true,
      meta_title: seo.meta_title !== undefined ? seo.meta_title : group.seo?.meta_title ?? '',
      meta_keywords: seo.meta_keywords !== undefined ? seo.meta_keywords : group.seo?.meta_keywords ?? '',
      meta_description: seo.meta_description !== undefined ? seo.meta_description : group.seo?.meta_description ?? '',
    };
  }

  await group.save();
  res.status(200).json(new ApiResponse(200, group, 'Topic Group updated successfully'));
});

export const deleteTopicGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const group = await TopicGroup.findByIdAndDelete(id);
  if (!group) {
    throw new ApiError(404, 'Topic Group not found');
  }
  res.status(200).json(new ApiResponse(200, null, 'Topic Group deleted successfully'));
});

export const bulkActionTopicGroups = asyncHandler(async (req, res) => {
  const { action, ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'No topic groups selected');
  }

  if (action === 'delete') {
    await TopicGroup.deleteMany({ _id: { $in: ids } });
    return res.status(200).json(new ApiResponse(200, null, `Deleted ${ids.length} topic groups`));
  }

  throw new ApiError(400, 'Invalid bulk action');
});
