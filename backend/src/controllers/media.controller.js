import mongoose from 'mongoose';
import path from 'path';
import { Media } from '../models/index.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const uploadSingleMedia = asyncHandler(async (req, res) => {
  const file = req.file || (req.files && req.files[0]);
  if (!file) {
    throw new ApiError(400, 'Please upload an image file');
  }

  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  const ext = path.extname(file.originalname).toLowerCase();
  const rawName = path.basename(file.originalname, ext);

  const relativePath = `/uploads/${year}/${month}/`;
  const relativeFilePath = `/uploads/${year}/${month}/${file.filename}`;
  const formattedSize = `${(file.size / 1024).toFixed(2)}KB`;

  // Create Media Document in MongoDB Atlas
  const mediaDoc = await Media.create({
    name: rawName,
    alt: req.body.alt || rawName,
    description: req.body.description || null,
    caption: req.body.caption || null,
    path: relativePath,
    file: relativeFilePath,
    type: ext,
    size: formattedSize,
    uploader: req.user?._id || null,
    user_id: req.user?.sql_id || null,
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
  });

  res.status(201).json({
    success: true,
    message: 'Media uploaded and stored successfully',
    data: mediaDoc,
  });
});

export const getAllMedia = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 60;
  const skip = (page - 1) * limit;
  const search = (req.query.search || '').trim();
  const mediaType = (req.query.type || '').trim().toLowerCase();
  const dateFilter = (req.query.date || '').trim();

  const query = {};

  // Search by name, file, or alt
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { file: { $regex: search, $options: 'i' } },
      { alt: { $regex: search, $options: 'i' } },
      { caption: { $regex: search, $options: 'i' } },
    ];
  }

  // Filter by Date (e.g. '2026/08', '2026-08', '2026', etc.)
  if (dateFilter && dateFilter !== 'all') {
    const formattedDateRegex = dateFilter.replace('-', '/');
    const dateConditions = [
      { path: { $regex: formattedDateRegex, $options: 'i' } },
      { file: { $regex: formattedDateRegex, $options: 'i' } },
      { created_at: { $regex: dateFilter.replace('/', '-'), $options: 'i' } },
    ];

    if (query.$or) {
      query.$and = [{ $or: query.$or }, { $or: dateConditions }];
      delete query.$or;
    } else {
      query.$or = dateConditions;
    }
  }

  // Filter by Media Type
  if (mediaType && mediaType !== 'all') {
    if (mediaType === 'image') {
      query.file = { $regex: /\.(jpg|jpeg|png|webp|gif|svg)$/i };
    } else if (mediaType === 'document' || mediaType === 'pdf') {
      query.file = { $regex: /\.(pdf|doc|docx|zip|xls|xlsx)$/i };
    }
  }

  const [mediaItems, total] = await Promise.all([
    Media.find(query)
      .populate('uploader', 'name email')
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Media.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: mediaItems.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data: mediaItems,
  });
});

export const getMediaById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const filter = mongoose.isValidObjectId(id) ? { _id: id } : { sql_id: Number(id) };
  const mediaDoc = await Media.findOne(filter).populate('uploader', 'name email');
  if (!mediaDoc) {
    throw new ApiError(404, 'Media not found');
  }
  res.status(200).json({ success: true, data: mediaDoc });
});

export const updateMedia = asyncHandler(async (req, res) => {
  const role = req.user?.role || req.headers?.['x-user-role'] || req.body?.role || req.query?.role;
  if (role === 'author' || role === 'writer') {
    throw new ApiError(403, 'Permission denied: Authors do not have permission to edit media files.');
  }

  const { name, alt, caption, description } = req.body;
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (alt !== undefined) updateData.alt = alt;
  if (caption !== undefined) updateData.caption = caption;
  if (description !== undefined) updateData.description = description;

  const id = req.params.id;
  const filter = mongoose.isValidObjectId(id) ? { _id: id } : { sql_id: Number(id) };

  const mediaDoc = await Media.findOneAndUpdate(
    filter,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!mediaDoc) {
    throw new ApiError(404, 'Media not found');
  }

  res.status(200).json({
    success: true,
    message: 'Media updated successfully',
    data: mediaDoc,
  });
});

export const deleteMedia = asyncHandler(async (req, res) => {
  const role = req.user?.role || req.headers?.['x-user-role'] || req.body?.role || req.query?.role;
  if (role === 'author' || role === 'writer') {
    throw new ApiError(403, 'Permission denied: Authors do not have permission to delete media files.');
  }

  const id = req.params.id;
  const filter = mongoose.isValidObjectId(id) ? { _id: id } : { sql_id: Number(id) };
  const mediaDoc = await Media.findOneAndDelete(filter);
  if (!mediaDoc) {
    throw new ApiError(404, 'Media not found');
  }
  res.status(200).json({ success: true, message: 'Media deleted permanently' });
});
