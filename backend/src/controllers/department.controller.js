import Department from '../models/department.model.js';
import Media from '../models/media.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validateUniqueSlug, slugify } from '../utils/slug.js';

// Get Paginated & Searchable Departments
export const getDepartments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
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

  const fetchAll = req.query.all === 'true' || req.query.all === '1';
  if (fetchAll) {
    const departments = await Department.find(query)
      .collation({ locale: 'en', strength: 2 })
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: departments.length,
      total: departments.length,
      data: departments,
    });
  }

  const [departments, total] = await Promise.all([
    Department.find(query)
      .sort({ sql_id: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Department.countDocuments(query),
  ]);

  // Resolve media thumbnail for each department
  const mediaIds = departments
    .map((d) => d.media_id)
    .filter((id) => id && id > 0);

  let mediaMap = {};
  if (mediaIds.length > 0) {
    const mediaDocs = await Media.find({ sql_id: { $in: mediaIds } }).lean();
    mediaDocs.forEach((m) => {
      mediaMap[m.sql_id] = m.file || m.url || (m.path && m.name ? `${m.path}/${m.name}` : '');
    });
  }

  const enrichedDepartments = departments.map((d) => {
    let resolvedImage = d.image || null;
    if (!resolvedImage && d.media_id && mediaMap[d.media_id]) {
      resolvedImage = mediaMap[d.media_id];
    }
    return {
      ...d,
      image: resolvedImage,
    };
  });

  res.status(200).json({
    success: true,
    count: enrichedDepartments.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data: enrichedDepartments,
  });
});

// Get Department by ID or Slug
export const getDepartmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(id).trim());

  const dept = isObjectId
    ? await Department.findById(id).lean()
    : await Department.findOne({ $or: [{ slug: id }, { name: id }] }).lean();

  if (!dept) {
    throw new ApiError(404, 'Department not found');
  }

  let resolvedImage = dept.image || null;
  if (!resolvedImage && dept.media_id) {
    const mediaDoc = await Media.findOne({ sql_id: dept.media_id }).lean();
    if (mediaDoc) {
      resolvedImage = mediaDoc.file || mediaDoc.url || '';
    }
  }

  res.status(200).json(new ApiResponse(200, { ...dept, image: resolvedImage }));
});

// Create New Department
export const createDepartment = asyncHandler(async (req, res) => {
  const { name, slug, description, image, media_id, seo } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, 'Department name is required', { name: 'Department name is required' });
  }

  const cleanName = name.trim();
  const slugValidation = await validateUniqueSlug(Department, {
    slug,
    fallbackText: cleanName,
    modelLabel: 'department',
    isRequired: true,
  });

  if (!slugValidation.isValid) {
    throw new ApiError(400, slugValidation.error, { slug: slugValidation.error });
  }

  const cleanSlug = slugValidation.slug;

  const existingName = await Department.findOne({ name: cleanName });
  if (existingName) {
    throw new ApiError(400, 'A department with this name already exists', { name: 'A department with this name already exists' });
  }

  const highestDept = await Department.findOne({ sql_id: { $ne: null } })
    .sort({ sql_id: -1 })
    .select('sql_id')
    .lean();
  const nextSqlId = (highestDept?.sql_id || 0) + 1;

  const newDept = await Department.create({
    sql_id: nextSqlId,
    name: cleanName,
    slug: cleanSlug,
    description: description || null,
    image: image || null,
    media_id: media_id || null,
    seo: {
      allow_indexing: seo?.allow_indexing !== undefined ? seo.allow_indexing : true,
      meta_title: seo?.meta_title || '',
      meta_keywords: seo?.meta_keywords || '',
      meta_description: seo?.meta_description || '',
    },
  });

  res.status(201).json(new ApiResponse(201, newDept, 'Department created successfully'));
});

// Update Department
export const updateDepartment = asyncHandler(async (req, res) => {
  const role = req.user?.role || req.headers?.['x-user-role'] || req.body?.role || req.query?.role;
  if (role === 'author' || role === 'writer') {
    throw new ApiError(403, 'Permission denied: Authors do not have permission to modify departments.');
  }

  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(id).trim());

  const dept = isObjectId
    ? await Department.findById(id)
    : await Department.findOne({ $or: [{ slug: id }, { name: id }] });

  if (!dept) {
    throw new ApiError(404, 'Department not found');
  }

  const { name, slug, description, image, media_id, seo } = req.body;

  if (name !== undefined) {
    if (!String(name).trim()) {
      throw new ApiError(400, 'Department name cannot be empty', { name: 'Department name cannot be empty' });
    }
    const cleanName = name.trim();
    const existingName = await Department.findOne({ name: cleanName, _id: { $ne: dept._id } });
    if (existingName) {
      throw new ApiError(400, 'A department with this name already exists', { name: 'A department with this name already exists' });
    }
    dept.name = cleanName;
  }

  if (slug !== undefined && String(slug).trim()) {
    const slugValidation = await validateUniqueSlug(Department, {
      slug,
      currentId: dept._id,
      modelLabel: 'department',
      isRequired: true,
    });

    if (!slugValidation.isValid) {
      throw new ApiError(400, slugValidation.error, { slug: slugValidation.error });
    }

    dept.slug = slugValidation.slug;
  }
  if (description !== undefined) dept.description = description;
  if (image !== undefined) dept.image = image;
  if (media_id !== undefined) dept.media_id = media_id;
  if (seo !== undefined) {
    dept.seo = {
      allow_indexing: seo.allow_indexing !== undefined ? seo.allow_indexing : true,
      meta_title: seo.meta_title || '',
      meta_keywords: seo.meta_keywords || '',
      meta_description: seo.meta_description || '',
    };
  }

  await dept.save();
  res.status(200).json(new ApiResponse(200, dept, 'Department updated successfully'));
});

// Delete Department
export const deleteDepartment = asyncHandler(async (req, res) => {
  const role = req.user?.role || req.headers?.['x-user-role'] || req.body?.role || req.query?.role;
  if (role === 'author' || role === 'writer') {
    throw new ApiError(403, 'Permission denied: Authors do not have permission to delete departments.');
  }

  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(id).trim());

  const dept = isObjectId
    ? await Department.findByIdAndDelete(id)
    : await Department.findOneAndDelete({ $or: [{ slug: id }, { name: id }] });

  if (!dept) {
    throw new ApiError(404, 'Department not found');
  }

  res.status(200).json(new ApiResponse(200, null, 'Department deleted successfully'));
});

// Bulk Action on Departments
export const bulkActionDepartments = asyncHandler(async (req, res) => {
  const role = req.user?.role || req.headers?.['x-user-role'] || req.body?.role || req.query?.role;
  if (role === 'author' || role === 'writer') {
    throw new ApiError(403, 'Permission denied: Authors do not have permission to delete departments.');
  }

  const { action, ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'No departments selected');
  }

  if (action === 'delete') {
    await Department.deleteMany({ _id: { $in: ids } });
    return res.status(200).json(new ApiResponse(200, null, `Successfully deleted ${ids.length} departments`));
  }

  throw new ApiError(400, 'Invalid bulk action');
});
