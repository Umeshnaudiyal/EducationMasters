import mongoose from 'mongoose';
import { Institute, User, State, District, Course, Facility } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { validateUniqueSlug, slugify } from '../utils/slug.js';

// Helper to escape regex special characters
const escapeRegex = (str) => String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Helper to validate and sanitize ObjectIds
const isValidObjectId = (id) => id && /^[0-9a-fA-F]{24}$/.test(String(id));

export const getInstitutes = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
  const skip = (page - 1) * limit;
  const search = (req.query.search || req.query.q || '').trim();
  const status = (req.query.status || 'all').toLowerCase();
  const state = req.query.state || '';

  const query = {};

  if (search) {
    const escaped = escapeRegex(search);
    query.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
      { phone: { $regex: escaped, $options: 'i' } },
      { city: { $regex: escaped, $options: 'i' } },
      { address: { $regex: escaped, $options: 'i' } },
    ];
  }

  if (status === 'draft') {
    query.status = 'draft';
  } else if (status === 'published' || status === 'publish') {
    query.status = 'publish';
  } else if (status === 'pending') {
    query.status = 'pending';
  } else if (status === 'trash' || status === 'trashed') {
    query.status = 'trash';
  } else if (status === 'all') {
    query.status = { $ne: 'trash' };
  }

  if (state && state !== 'all') {
    const stateStr = String(state).trim();
    if (isValidObjectId(stateStr)) {
      query.state = stateStr;
    } else {
      const stateDoc = await State.findOne({ slug: stateStr }).lean();
      if (stateDoc) query.state = stateDoc._id;
    }
  }

  const [institutes, total, statusAgg] = await Promise.all([
    Institute.find(query)
      .populate('author', 'name email')
      .populate('state', 'name slug')
      .populate('district', 'name')
      .populate('courses', 'name slug')
      .populate('facilities', 'name slug')
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Institute.countDocuments(query),
    Institute.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);

  const statusCounts = {
    all: 0,
    published: 0,
    draft: 0,
    pending: 0,
    trash: 0,
  };

  statusAgg.forEach(s => {
    if (s._id === 'publish' || s._id === 'published') {
      statusCounts.published += s.count;
      statusCounts.all += s.count;
    } else if (s._id === 'draft') {
      statusCounts.draft += s.count;
      statusCounts.all += s.count;
    } else if (s._id === 'pending') {
      statusCounts.pending += s.count;
      statusCounts.all += s.count;
    } else if (s._id === 'trash' || s._id === 'trashed') {
      statusCounts.trash += s.count;
    } else {
      statusCounts.published += s.count;
      statusCounts.all += s.count;
    }
  });

  res.status(200).json({
    success: true,
    count: institutes.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    statusCounts,
    data: institutes,
  });
});

export const getInstituteBySlug = asyncHandler(async (req, res) => {
  const target = req.params.slug || req.params.id;
  const targetStr = String(target || '').trim();

  if (!targetStr) {
    return res.status(400).json({ success: false, message: 'Institute identifier is required' });
  }

  const isObjectId = isValidObjectId(targetStr);

  const institute = isObjectId
    ? await Institute.findById(targetStr)
        .populate('author', 'name email')
        .populate('state', 'name slug')
        .populate('district', 'name')
        .populate('courses', 'name slug')
        .populate('facilities', 'name slug')
        .lean()
    : await Institute.findOne({ slug: targetStr })
        .populate('author', 'name email')
        .populate('state', 'name slug')
        .populate('district', 'name')
        .populate('courses', 'name slug')
        .populate('facilities', 'name slug')
        .lean();

  if (!institute) {
    return res.status(404).json({ success: false, message: 'Institute not found' });
  }

  res.status(200).json({ success: true, data: institute });
});

export const createInstitute = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    email,
    phone,
    video,
    gmap,
    website,
    city,
    logo,
    cover,
    address,
    about,
    status,
    state,
    district,
    courses,
    facilities,
    author_id,
  } = req.body;

  // Validation
  const errors = {};
  if (!name || !String(name).trim()) {
    errors.name = 'Institute name is required';
  } else if (String(name).trim().length < 2) {
    errors.name = 'Institute name must be at least 2 characters long';
  }

  if (email && String(email).trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      errors.email = 'Please provide a valid email address';
    }
  }

  // Slug uniqueness validation
  const slugValidation = await validateUniqueSlug(Institute, {
    slug,
    fallbackText: name,
    modelLabel: 'institute',
    isRequired: true,
  });

  if (!slugValidation.isValid) {
    errors.slug = slugValidation.error;
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: Object.values(errors)[0],
      errors,
    });
  }

  const finalSlug = slugValidation.slug;
  const count = await Institute.countDocuments();

  // Sanitize ObjectIds
  const validState = isValidObjectId(state) ? state : null;
  const validDistrict = isValidObjectId(district) ? district : null;
  const validAuthor = isValidObjectId(author_id) ? author_id : (isValidObjectId(req.user?._id) ? req.user._id : null);
  const validCourses = Array.isArray(courses) ? courses.filter(isValidObjectId) : [];
  const validFacilities = Array.isArray(facilities) ? facilities.filter(isValidObjectId) : [];

  const normalizedStatus =
    status === 'publish' || status === 'published'
      ? 'publish'
      : status === 'pending'
      ? 'pending'
      : status === 'trash'
      ? 'trash'
      : 'draft';

  const institute = await Institute.create({
    sql_id: count + 1,
    name: String(name).trim(),
    slug: finalSlug,
    email: email ? String(email).trim() : '',
    phone: phone ? String(phone).trim() : '',
    video: video ? String(video).trim() : null,
    gmap: gmap ? String(gmap).trim() : null,
    website: website ? String(website).trim() : null,
    city: city ? String(city).trim() : null,
    logo: logo || null,
    cover: cover || null,
    address: address ? String(address).trim() : '',
    about: about || '',
    status: normalizedStatus,
    author: validAuthor,
    state: validState,
    district: validDistrict,
    courses: validCourses,
    facilities: validFacilities,
  });

  const populated = await Institute.findById(institute._id)
    .populate('author', 'name email')
    .populate('state', 'name slug')
    .populate('district', 'name')
    .populate('courses', 'name slug')
    .populate('facilities', 'name slug');

  res.status(201).json({ success: true, data: populated, message: 'Institute created successfully' });
});

export const updateInstitute = asyncHandler(async (req, res) => {
  const target = req.params.slug || req.params.id;
  const targetStr = String(target || '').trim();

  if (!targetStr) {
    return res.status(400).json({ success: false, message: 'Institute identifier is required' });
  }

  const isObjectId = isValidObjectId(targetStr);

  const institute = isObjectId
    ? await Institute.findById(targetStr)
    : await Institute.findOne({ slug: targetStr });

  if (!institute) {
    return res.status(404).json({ success: false, message: 'Institute not found' });
  }

  // Validation
  const errors = {};
  if (req.body.name !== undefined) {
    if (!String(req.body.name).trim()) {
      errors.name = 'Institute name cannot be empty';
    } else if (String(req.body.name).trim().length < 2) {
      errors.name = 'Institute name must be at least 2 characters long';
    }
  }

  if (req.body.email !== undefined && String(req.body.email).trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(req.body.email).trim())) {
      errors.email = 'Please provide a valid email address';
    }
  }

  // Slug uniqueness validation on update
  if (req.body.slug !== undefined && String(req.body.slug).trim()) {
    const slugValidation = await validateUniqueSlug(Institute, {
      slug: req.body.slug,
      currentId: institute._id,
      modelLabel: 'institute',
      isRequired: true,
    });
    if (!slugValidation.isValid) {
      errors.slug = slugValidation.error;
    } else {
      institute.slug = slugValidation.slug;
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: Object.values(errors)[0],
      errors,
    });
  }

  // Update fields safely
  if (req.body.name !== undefined) institute.name = String(req.body.name).trim();
  if (req.body.email !== undefined) institute.email = String(req.body.email).trim();
  if (req.body.phone !== undefined) institute.phone = String(req.body.phone).trim();
  if (req.body.website !== undefined) institute.website = String(req.body.website).trim();
  if (req.body.city !== undefined) institute.city = String(req.body.city).trim();
  if (req.body.address !== undefined) institute.address = String(req.body.address).trim();
  if (req.body.gmap !== undefined) institute.gmap = String(req.body.gmap).trim();
  if (req.body.video !== undefined) institute.video = String(req.body.video).trim();
  if (req.body.about !== undefined) institute.about = req.body.about;
  if (req.body.logo !== undefined) institute.logo = req.body.logo || null;
  if (req.body.cover !== undefined) institute.cover = req.body.cover || null;

  if (req.body.status !== undefined) {
    const s = String(req.body.status).toLowerCase();
    institute.status =
      s === 'publish' || s === 'published'
        ? 'publish'
        : s === 'pending'
        ? 'pending'
        : s === 'trash'
        ? 'trash'
        : 'draft';
  }

  if (req.body.state !== undefined) {
    institute.state = isValidObjectId(req.body.state) ? req.body.state : null;
  }
  if (req.body.district !== undefined) {
    institute.district = isValidObjectId(req.body.district) ? req.body.district : null;
  }
  if (req.body.courses !== undefined) {
    institute.courses = Array.isArray(req.body.courses) ? req.body.courses.filter(isValidObjectId) : [];
  }
  if (req.body.facilities !== undefined) {
    institute.facilities = Array.isArray(req.body.facilities) ? req.body.facilities.filter(isValidObjectId) : [];
  }

  await institute.save();

  const populated = await Institute.findById(institute._id)
    .populate('author', 'name email')
    .populate('state', 'name slug')
    .populate('district', 'name')
    .populate('courses', 'name slug')
    .populate('facilities', 'name slug');

  res.status(200).json({ success: true, data: populated, message: 'Institute updated successfully' });
});

export const deleteInstitute = asyncHandler(async (req, res) => {
  const target = req.params.slug || req.params.id;
  const targetStr = String(target || '').trim();

  if (!targetStr) {
    return res.status(400).json({ success: false, message: 'Institute identifier is required' });
  }

  const isObjectId = isValidObjectId(targetStr);
  const { permanent } = req.query;

  if (permanent === 'true') {
    const deleted = isObjectId
      ? await Institute.findByIdAndDelete(targetStr)
      : await Institute.findOneAndDelete({ slug: targetStr });
    if (!deleted) return res.status(404).json({ success: false, message: 'Institute not found' });
    return res.status(200).json({ success: true, message: 'Institute permanently deleted' });
  }

  const updated = isObjectId
    ? await Institute.findByIdAndUpdate(targetStr, { status: 'trash', deleted_at: new Date() }, { new: true })
    : await Institute.findOneAndUpdate({ slug: targetStr }, { status: 'trash', deleted_at: new Date() }, { new: true });

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Institute not found' });
  }

  res.status(200).json({ success: true, message: 'Institute moved to trash' });
});

export const bulkActionInstitutes = asyncHandler(async (req, res) => {
  const { action, ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'Please select at least one institute' });
  }

  const validIds = ids.filter(isValidObjectId);
  if (validIds.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid institutes selected' });
  }

  if (action === 'trash') {
    await Institute.updateMany({ _id: { $in: validIds } }, { status: 'trash', deleted_at: new Date() });
    return res.status(200).json({ success: true, message: `Moved ${validIds.length} institute(s) to trash` });
  } else if (action === 'publish' || action === 'published') {
    await Institute.updateMany({ _id: { $in: validIds } }, { status: 'publish' });
    return res.status(200).json({ success: true, message: `Published ${validIds.length} institute(s)` });
  } else if (action === 'draft') {
    await Institute.updateMany({ _id: { $in: validIds } }, { status: 'draft' });
    return res.status(200).json({ success: true, message: `Moved ${validIds.length} institute(s) to draft` });
  } else if (action === 'restore') {
    await Institute.updateMany({ _id: { $in: validIds } }, { status: 'publish', deleted_at: null });
    return res.status(200).json({ success: true, message: `Restored ${validIds.length} institute(s)` });
  } else if (action === 'delete') {
    await Institute.deleteMany({ _id: { $in: validIds } });
    return res.status(200).json({ success: true, message: `Permanently deleted ${validIds.length} institute(s)` });
  }

  res.status(400).json({ success: false, message: 'Invalid bulk action specified' });
});

