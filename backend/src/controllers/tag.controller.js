import Tag from '../models/tag.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validateUniqueSlug, slugify } from '../utils/slug.js';

// Get Paginated & Searchable Tags
export const getTags = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;
  const skip = (page - 1) * limit;
  const search = (req.query.search || req.query.q || '').trim();

  const query = { name: { $exists: true, $ne: '' } };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const [tags, total] = await Promise.all([
    Tag.find(query)
      .sort({ sql_id: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Tag.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: tags.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data: tags,
  });
});

// Get Tag by ID or Slug
export const getTagById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(id).trim());

  const tag = isObjectId
    ? await Tag.findById(id).lean()
    : await Tag.findOne({ $or: [{ slug: id }, { name: id }] }).lean();

  if (!tag) {
    throw new ApiError(404, 'Tag not found');
  }

  res.status(200).json(new ApiResponse(200, tag));
});

// Create New Tag
export const createTag = asyncHandler(async (req, res) => {
  const { name, slug, description, seo } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, 'Tag name is required', { name: 'Tag name is required' });
  }

  const cleanName = name.trim();
  const slugValidation = await validateUniqueSlug(Tag, {
    slug,
    fallbackText: cleanName,
    modelLabel: 'tag',
    isRequired: true,
  });

  if (!slugValidation.isValid) {
    throw new ApiError(400, slugValidation.error, { slug: slugValidation.error });
  }

  const cleanSlug = slugValidation.slug;

  const existingName = await Tag.findOne({ name: cleanName });
  if (existingName) {
    throw new ApiError(400, 'A tag with this name already exists', { name: 'A tag with this name already exists' });
  }

  const highestTag = await Tag.findOne({ sql_id: { $ne: null } })
    .sort({ sql_id: -1 })
    .select('sql_id')
    .lean();
  const nextSqlId = (highestTag?.sql_id || 0) + 1;

  const newTag = await Tag.create({
    sql_id: nextSqlId,
    name: cleanName,
    slug: cleanSlug,
    description: description || null,
    seo: {
      allow_indexing: seo?.allow_indexing !== undefined ? seo.allow_indexing : true,
      meta_title: seo?.meta_title || '',
      meta_keywords: seo?.meta_keywords || '',
      meta_description: seo?.meta_description || '',
    },
  });

  res.status(201).json(new ApiResponse(201, newTag, 'Tag created successfully'));
});

// Update Tag
export const updateTag = asyncHandler(async (req, res) => {
  const role = req.user?.role || req.headers?.['x-user-role'] || req.body?.role || req.query?.role;
  if (role === 'author' || role === 'writer') {
    throw new ApiError(403, 'Permission denied: Authors do not have permission to modify tags.');
  }

  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(id).trim());

  const tag = isObjectId
    ? await Tag.findById(id)
    : await Tag.findOne({ $or: [{ slug: id }, { name: id }] });

  if (!tag) {
    throw new ApiError(404, 'Tag not found');
  }

  const { name, slug, description, seo } = req.body;

  if (name !== undefined) {
    if (!String(name).trim()) {
      throw new ApiError(400, 'Tag name cannot be empty', { name: 'Tag name cannot be empty' });
    }
    const cleanName = name.trim();
    const existingName = await Tag.findOne({ name: cleanName, _id: { $ne: tag._id } });
    if (existingName) {
      throw new ApiError(400, 'A tag with this name already exists', { name: 'A tag with this name already exists' });
    }
    tag.name = cleanName;
  }

  if (slug !== undefined && String(slug).trim()) {
    const slugValidation = await validateUniqueSlug(Tag, {
      slug,
      currentId: tag._id,
      modelLabel: 'tag',
      isRequired: true,
    });

    if (!slugValidation.isValid) {
      throw new ApiError(400, slugValidation.error, { slug: slugValidation.error });
    }

    tag.slug = slugValidation.slug;
  }
  if (description !== undefined) tag.description = description;
  if (seo !== undefined) {
    tag.seo = {
      allow_indexing: seo.allow_indexing !== undefined ? seo.allow_indexing : true,
      meta_title: seo.meta_title || '',
      meta_keywords: seo.meta_keywords || '',
      meta_description: seo.meta_description || '',
    };
  }

  await tag.save();
  res.status(200).json(new ApiResponse(200, tag, 'Tag updated successfully'));
});

// Delete Tag
export const deleteTag = asyncHandler(async (req, res) => {
  const role = req.user?.role || req.headers?.['x-user-role'] || req.body?.role || req.query?.role;
  if (role === 'author' || role === 'writer') {
    throw new ApiError(403, 'Permission denied: Authors do not have permission to delete tags.');
  }

  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(id).trim());

  const tag = isObjectId
    ? await Tag.findByIdAndDelete(id)
    : await Tag.findOneAndDelete({ $or: [{ slug: id }, { name: id }] });

  if (!tag) {
    throw new ApiError(404, 'Tag not found');
  }

  res.status(200).json(new ApiResponse(200, null, 'Tag deleted successfully'));
});

// Bulk Action on Tags
export const bulkActionTags = asyncHandler(async (req, res) => {
  const role = req.user?.role || req.headers?.['x-user-role'] || req.body?.role || req.query?.role;
  if (role === 'author' || role === 'writer') {
    throw new ApiError(403, 'Permission denied: Authors do not have permission to delete tags.');
  }

  const { action, ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'No tags selected');
  }

  if (action === 'delete') {
    await Tag.deleteMany({ _id: { $in: ids } });
    return res.status(200).json(new ApiResponse(200, null, `Successfully deleted ${ids.length} tags`));
  }

  throw new ApiError(400, 'Invalid bulk action');
});
