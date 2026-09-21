import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import Topic from '../models/topic.model.js';
import Subject from '../models/subject.model.js';
import TopicGroup from '../models/topicGroup.model.js';
import { validateUniqueSlug, slugify } from '../utils/slug.js';

const validateTopicData = async (data, { isNew = false, currentId = null } = {}) => {
  const errors = {};

  if (isNew || data.name !== undefined) {
    const name = String(data.name || '').trim();
    if (!name) {
      errors.name = 'Topic name is required';
    } else if (name.length < 2) {
      errors.name = 'Topic name must be at least 2 characters long';
    } else if (name.length > 200) {
      errors.name = 'Topic name cannot exceed 200 characters';
    }
  }

  if (isNew || data.slug !== undefined) {
    const slugValidation = await validateUniqueSlug(Topic, {
      slug: data.slug,
      fallbackText: data.name,
      currentId,
      modelLabel: 'topic',
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

export const getTopics = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const search = (req.query.search || req.query.q || '').trim();
  const subjectFilter = req.query.subject || '';

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } },
      { subject_name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (subjectFilter && subjectFilter !== 'all') {
    if (/^[0-9a-fA-F]{24}$/.test(subjectFilter)) {
      query.subject = subjectFilter;
    } else {
      query.subject_name = { $regex: subjectFilter, $options: 'i' };
    }
  }

  const [topics, total] = await Promise.all([
    Topic.find(query)
      .populate('subject', 'name slug')
      .populate('topic_group', 'name slug')
      .sort({ sql_id: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Topic.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: topics,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
  });
});

export const getTopicById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  const topic = isObjectId
    ? await Topic.findById(id).populate('subject').populate('topic_group').lean()
    : await Topic.findOne({ slug: id }).populate('subject').populate('topic_group').lean();

  if (!topic) {
    throw new ApiError(404, 'Topic not found');
  }

  res.status(200).json(new ApiResponse(200, topic, 'Topic retrieved successfully'));
});

export const createTopic = asyncHandler(async (req, res) => {
  const { name, slug, subject, subject_id, topic_group, topic_group_id, image, description, seo } = req.body;

  const validation = await validateTopicData(req.body, { isNew: true });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: Object.values(validation.errors)[0] || 'Validation failed. Please fix the highlighted fields.',
      errors: validation.errors,
    });
  }

  const cleanSlug = slug ? slugify(slug) : slugify(name);
  const highest = await Topic.findOne({ sql_id: { $ne: null } }).sort({ sql_id: -1 }).select('sql_id').lean();
  const nextSqlId = (highest?.sql_id || 0) + 1;

  let resolvedSubjectName = '';
  let resolvedSubjectId = subject || null;
  if (subject && /^[0-9a-fA-F]{24}$/.test(subject)) {
    const sDoc = await Subject.findById(subject);
    if (sDoc) resolvedSubjectName = sDoc.name;
  }

  let resolvedGroupName = '';
  let resolvedGroupId = topic_group || null;
  if (topic_group && /^[0-9a-fA-F]{24}$/.test(topic_group)) {
    const gDoc = await TopicGroup.findById(topic_group);
    if (gDoc) resolvedGroupName = gDoc.name;
  }

  const topic = await Topic.create({
    sql_id: nextSqlId,
    name: name.trim(),
    slug: cleanSlug,
    subject: resolvedSubjectId,
    subject_id: subject_id ? Number(subject_id) : undefined,
    subject_name: resolvedSubjectName,
    topic_group: resolvedGroupId,
    topic_group_id: topic_group_id ? Number(topic_group_id) : undefined,
    topic_group_name: resolvedGroupName,
    image: image ? image.trim() : '',
    description: description || '',
    seo: {
      allow_indexing: seo?.allow_indexing !== undefined ? Boolean(seo.allow_indexing) : true,
      meta_title: seo?.meta_title || name.trim(),
      meta_keywords: seo?.meta_keywords || '',
      meta_description: seo?.meta_description || description || '',
    },
  });

  res.status(201).json(new ApiResponse(201, topic, 'Topic created successfully'));
});

export const updateTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const topic = await Topic.findById(id);
  if (!topic) {
    throw new ApiError(404, 'Topic not found');
  }

  const validation = await validateTopicData(req.body, { isNew: false, currentId: topic._id });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: Object.values(validation.errors)[0] || 'Validation failed. Please fix the highlighted fields.',
      errors: validation.errors,
    });
  }

  const { name, slug, subject, topic_group, image, description, seo } = req.body;

  if (name !== undefined) topic.name = name.trim();
  if (slug !== undefined) topic.slug = slugify(slug);

  if (subject !== undefined) {
    if (subject && /^[0-9a-fA-F]{24}$/.test(subject)) {
      const sDoc = await Subject.findById(subject);
      topic.subject = sDoc ? sDoc._id : null;
      topic.subject_name = sDoc ? sDoc.name : '';
    } else {
      topic.subject = null;
      topic.subject_name = '';
    }
  }

  if (topic_group !== undefined) {
    if (topic_group && /^[0-9a-fA-F]{24}$/.test(topic_group)) {
      const gDoc = await TopicGroup.findById(topic_group);
      topic.topic_group = gDoc ? gDoc._id : null;
      topic.topic_group_name = gDoc ? gDoc.name : '';
    } else {
      topic.topic_group = null;
      topic.topic_group_name = '';
    }
  }

  if (image !== undefined) topic.image = image ? image.trim() : '';
  if (description !== undefined) topic.description = description;

  if (seo) {
    topic.seo = {
      allow_indexing: seo.allow_indexing !== undefined ? Boolean(seo.allow_indexing) : topic.seo?.allow_indexing ?? true,
      meta_title: seo.meta_title !== undefined ? seo.meta_title : topic.seo?.meta_title ?? '',
      meta_keywords: seo.meta_keywords !== undefined ? seo.meta_keywords : topic.seo?.meta_keywords ?? '',
      meta_description: seo.meta_description !== undefined ? seo.meta_description : topic.seo?.meta_description ?? '',
    };
  }

  await topic.save();
  res.status(200).json(new ApiResponse(200, topic, 'Topic updated successfully'));
});

export const deleteTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const topic = await Topic.findByIdAndDelete(id);
  if (!topic) {
    throw new ApiError(404, 'Topic not found');
  }
  res.status(200).json(new ApiResponse(200, null, 'Topic deleted successfully'));
});

export const bulkActionTopics = asyncHandler(async (req, res) => {
  const { action, ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'No topics selected');
  }

  if (action === 'delete') {
    await Topic.deleteMany({ _id: { $in: ids } });
    return res.status(200).json(new ApiResponse(200, null, `Deleted ${ids.length} topics`));
  }

  throw new ApiError(400, 'Invalid bulk action');
});
