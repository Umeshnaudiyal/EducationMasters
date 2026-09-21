import mongoose from 'mongoose';
import { Category, Media } from '../models/index.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { validateUniqueSlug, slugify } from '../utils/slug.js';

// Helper to generate URL-safe slug
const generateSlug = (text) => {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// GET /apis/v1/categories - Get all categories with optional pagination & search
export const getAllCategories = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const search = (req.query.search || '').trim();
  const fetchAll = req.query.all === 'true' || req.query.all === '1';

  const query = { name: { $exists: true, $ne: '' } };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (fetchAll) {
    const categories = await Category.find(query)
      .populate('featured_media')
      .populate('parent', 'name slug')
      .collation({ locale: 'en', strength: 2 })
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: categories.length,
      total: categories.length,
      data: categories,
    });
  }

  const skip = (page - 1) * limit;

  const [categories, total] = await Promise.all([
    Category.find(query)
      .populate('featured_media')
      .populate('parent', 'name slug')
      .collation({ locale: 'en', strength: 2 })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Category.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: categories.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data: categories,
  });
});

// GET /apis/v1/categories/:id - Get single category by ID or slug
export const getCategoryById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const filter = mongoose.isValidObjectId(id)
    ? { _id: id }
    : !isNaN(id)
    ? { sql_id: Number(id) }
    : { slug: id };

  const category = await Category.findOne(filter)
    .populate('featured_media')
    .populate('parent', 'name slug')
    .lean();

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  res.status(200).json({
    success: true,
    data: category,
  });
});

// POST /apis/v1/categories - Create new category
export const createCategory = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    description,
    parent,
    featured_media,
    allow_indexing,
    meta_title,
    meta_keywords,
    meta_description,
  } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, 'Category name is required');
  }

  const cleanName = name.trim();
  const slugValidation = await validateUniqueSlug(Category, {
    slug,
    fallbackText: cleanName,
    modelLabel: 'category',
    isRequired: true,
  });

  if (!slugValidation.isValid) {
    throw new ApiError(400, slugValidation.error, { slug: slugValidation.error });
  }

  const uniqueSlug = slugValidation.slug;

  let parentId = null;
  if (parent && mongoose.isValidObjectId(parent)) {
    parentId = parent;
  }

  let mediaId = null;
  if (featured_media && mongoose.isValidObjectId(featured_media)) {
    mediaId = featured_media;
  }

  const category = await Category.create({
    name: cleanName,
    slug: uniqueSlug,
    description: description || '',
    parent: parentId,
    featured_media: mediaId,
    allow_indexing: allow_indexing !== false,
    meta_title: meta_title || '',
    meta_keywords: meta_keywords || '',
    meta_description: meta_description || '',
  });

  const populated = await Category.findById(category._id)
    .populate('featured_media')
    .populate('parent', 'name slug')
    .lean();

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: populated,
  });
});

// PUT /apis/v1/categories/:id - Update category
export const updateCategory = asyncHandler(async (req, res) => {
  const role = req.user?.role || req.headers?.['x-user-role'] || req.body?.role || req.query?.role;
  if (role === 'author' || role === 'writer') {
    throw new ApiError(403, 'Permission denied: Authors do not have permission to modify categories.');
  }

  const id = req.params.id;
  const filter = mongoose.isValidObjectId(id)
    ? { _id: id }
    : !isNaN(id)
    ? { sql_id: Number(id) }
    : { slug: id };

  const existing = await Category.findOne(filter);
  if (!existing) {
    throw new ApiError(404, 'Category not found');
  }

  const {
    name,
    slug,
    description,
    parent,
    featured_media,
    allow_indexing,
    meta_title,
    meta_keywords,
    meta_description,
  } = req.body;

  const updateData = {};
  if (name !== undefined) {
    if (!String(name).trim()) {
      throw new ApiError(400, 'Category name cannot be empty', { name: 'Category name cannot be empty' });
    }
    updateData.name = name.trim();
  }
  if (description !== undefined) updateData.description = description;
  if (allow_indexing !== undefined) updateData.allow_indexing = Boolean(allow_indexing);
  if (meta_title !== undefined) updateData.meta_title = meta_title;
  if (meta_keywords !== undefined) updateData.meta_keywords = meta_keywords;
  if (meta_description !== undefined) updateData.meta_description = meta_description;

  if (slug !== undefined && String(slug).trim()) {
    const slugValidation = await validateUniqueSlug(Category, {
      slug,
      currentId: existing._id,
      modelLabel: 'category',
      isRequired: true,
    });

    if (!slugValidation.isValid) {
      throw new ApiError(400, slugValidation.error, { slug: slugValidation.error });
    }

    updateData.slug = slugValidation.slug;
  }

  if (parent !== undefined) {
    updateData.parent = parent && mongoose.isValidObjectId(parent) ? parent : null;
  }

  if (featured_media !== undefined) {
    updateData.featured_media =
      featured_media && mongoose.isValidObjectId(featured_media) ? featured_media : null;
  }

  const updated = await Category.findByIdAndUpdate(
    existing._id,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate('featured_media')
    .populate('parent', 'name slug')
    .lean();

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: updated,
  });
});

// DELETE /apis/v1/categories/:id - Delete single category
export const deleteCategory = asyncHandler(async (req, res) => {
  const role = req.user?.role || req.headers?.['x-user-role'] || req.body?.role || req.query?.role;
  if (role === 'author' || role === 'writer') {
    throw new ApiError(403, 'Permission denied: Authors do not have permission to delete categories.');
  }

  const id = req.params.id;
  const filter = mongoose.isValidObjectId(id)
    ? { _id: id }
    : !isNaN(id)
    ? { sql_id: Number(id) }
    : { slug: id };

  const category = await Category.findOne(filter);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  // Prevent deleting default Uncategorized category
  if (category.slug === 'uncategorized' || category.name.toLowerCase() === 'uncategorized') {
    throw new ApiError(400, 'The default "Uncategorized" category cannot be deleted');
  }

  await Category.findByIdAndDelete(category._id);

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully',
  });
});

// POST /apis/v1/categories/bulk-delete - Bulk delete categories
export const bulkDeleteCategories = asyncHandler(async (req, res) => {
  const role = req.user?.role || req.headers?.['x-user-role'] || req.body?.role || req.query?.role;
  if (role === 'author' || role === 'writer') {
    throw new ApiError(403, 'Permission denied: Authors do not have permission to delete categories.');
  }

  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Please provide an array of category IDs to delete');
  }

  // Filter out uncategorized
  const validIds = ids.filter((id) => mongoose.isValidObjectId(id));
  const result = await Category.deleteMany({
    _id: { $in: validIds },
    slug: { $ne: 'uncategorized' },
    name: { $not: /^uncategorized$/i },
  });

  res.status(200).json({
    success: true,
    message: `${result.deletedCount} categories deleted successfully`,
    deletedCount: result.deletedCount,
  });
});
