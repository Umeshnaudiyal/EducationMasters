import { Facility } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { validateUniqueSlug } from '../utils/slug.js';

export const getFacilities = asyncHandler(async (req, res) => {
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

  const [facilities, total] = await Promise.all([
    Facility.find(query)
      .sort({ sql_id: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Facility.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: facilities.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data: facilities,
  });
});

export const getAllFacilities = asyncHandler(async (req, res) => {
  const facilities = await Facility.find({})
    .sort({ sql_id: 1, name: 1 })
    .select('_id name slug info')
    .lean();

  res.status(200).json({
    success: true,
    count: facilities.length,
    data: facilities,
  });
});

export const getFacilityById = asyncHandler(async (req, res) => {
  const facility = await Facility.findById(req.params.id);
  if (!facility) {
    return res.status(404).json({ success: false, message: 'Facility not found' });
  }
  res.status(200).json({ success: true, data: facility });
});

export const createFacility = asyncHandler(async (req, res) => {
  const { name, slug, info } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({
      success: false,
      message: 'Facility name is required',
      errors: { name: 'Facility name is required' },
    });
  }

  const slugValidation = await validateUniqueSlug(Facility, {
    slug,
    fallbackText: name,
    modelLabel: 'facility',
    isRequired: true,
  });

  if (!slugValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: slugValidation.error,
      errors: { slug: slugValidation.error },
    });
  }

  const count = await Facility.countDocuments();
  const facility = await Facility.create({
    sql_id: count + 1,
    name: name.trim(),
    slug: slugValidation.slug,
    info: info || '',
  });

  res.status(201).json({ success: true, data: facility, message: 'Facility created successfully' });
});

export const updateFacility = asyncHandler(async (req, res) => {
  const { name, slug, info } = req.body;
  const facility = await Facility.findById(req.params.id);
  if (!facility) {
    return res.status(404).json({ success: false, message: 'Facility not found' });
  }

  if (name !== undefined) {
    if (!String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Facility name cannot be empty',
        errors: { name: 'Facility name cannot be empty' },
      });
    }
    facility.name = name.trim();
  }

  if (slug !== undefined && String(slug).trim()) {
    const slugValidation = await validateUniqueSlug(Facility, {
      slug,
      currentId: facility._id,
      modelLabel: 'facility',
      isRequired: true,
    });

    if (!slugValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: slugValidation.error,
        errors: { slug: slugValidation.error },
      });
    }

    facility.slug = slugValidation.slug;
  }

  if (info !== undefined) facility.info = info;

  await facility.save();
  res.status(200).json({ success: true, data: facility, message: 'Facility updated successfully' });
});

export const deleteFacility = asyncHandler(async (req, res) => {
  const facility = await Facility.findByIdAndDelete(req.params.id);
  if (!facility) {
    return res.status(404).json({ success: false, message: 'Facility not found' });
  }
  res.status(200).json({ success: true, message: 'Facility deleted successfully' });
});

export const bulkActionFacilities = asyncHandler(async (req, res) => {
  const { action, ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'No items selected' });
  }

  if (action === 'delete') {
    await Facility.deleteMany({ _id: { $in: ids } });
    return res.status(200).json({ success: true, message: `Successfully deleted ${ids.length} facilities` });
  }

  res.status(400).json({ success: false, message: 'Invalid action' });
});
