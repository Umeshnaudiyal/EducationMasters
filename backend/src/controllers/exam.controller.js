import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import { Exam, MockTestSeries, MockTest, MockTestAttempt, Category, Subject } from '../models/index.js';
import { validateUniqueSlug, slugify } from '../utils/slug.js';
import { cleanHtmlContent } from '../utils/cleanHtml.js';

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
  const isAll = req.query.all === 'true' || req.query.limit === 'all';
  const limit = isAll ? 500 : parseInt(req.query.limit, 10) || 12;
  const skip = (page - 1) * limit;
  const search = (req.query.search || req.query.q || '').trim();
  const categoryFilter = req.query.category || '';
  const subjectFilter = req.query.subject || '';
  const statusFilter = (req.query.status || 'published').toLowerCase();

  const query = {};

  if (statusFilter === 'all') {
    // Return all statuses (for admin)
  } else if (statusFilter === 'draft') {
    query.status = { $in: ['draft', 'Draft'] };
  } else {
    query.status = { $in: ['publish', 'published', 'Published', undefined, null] };
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category_name: { $regex: search, $options: 'i' } },
      { badge: { $regex: search, $options: 'i' } },
    ];
  }

  if (categoryFilter && categoryFilter !== 'all') {
    if (/^[0-9a-fA-F]{24}$/.test(categoryFilter)) {
      query.category = categoryFilter;
    } else {
      const catKeyword = categoryFilter.replace(/-/g, ' ');
      query.$or = [
        ...(query.$or || []),
        { category_name: { $regex: catKeyword, $options: 'i' } },
        { slug: { $regex: categoryFilter, $options: 'i' } },
      ];
    }
  }

  if (subjectFilter && subjectFilter !== 'all') {
    if (/^[0-9a-fA-F]{24}$/.test(subjectFilter)) {
      query.subjects = subjectFilter;
    } else {
      const subDoc = await Subject.findOne({
        $or: [{ slug: subjectFilter }, { name: { $regex: subjectFilter, $options: 'i' } }],
      }).select('_id');
      if (subDoc) {
        query.subjects = subDoc._id;
      }
    }
  }

  // Author-specific scoping
  const userRole = (req.user?.role || '').toLowerCase();
  const userId = req.user?._id || req.user?.id;
  const isAuthor = userRole === 'author' || userRole === 'writer' || userRole === 'contributor';
  if (isAuthor && userId) {
    const authorCondition = {
      $or: [
        { author: userId },
        ...(req.user.sql_id ? [{ user_id: req.user.sql_id }] : []),
        { author: null },
        { author: { $exists: false } },
      ],
    };
    if (query.$or) {
      query.$and = [{ $or: query.$or }, authorCondition];
      delete query.$or;
    } else {
      query.$and = [authorCondition];
    }
  }

  const [exams, total] = await Promise.all([
    Exam.find(query)
      .populate('category', 'name slug')
      .populate('subjects', 'name slug')
      .sort({ order: 1, sql_id: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Exam.countDocuments(query),
  ]);

  // Aggregate dynamic child series & test counts for each exam
  const examIds = exams.map((e) => e._id);
  const seriesList = await MockTestSeries.find({
    examination: { $in: examIds },
    status: { $in: ['publish', 'published', 'Published'] },
  })
    .select('_id title slug examination total_tests free_tests_count total_questions highlights badge')
    .lean();

  const seriesByExam = {};
  seriesList.forEach((s) => {
    const eId = String(s.examination);
    if (!seriesByExam[eId]) seriesByExam[eId] = [];
    seriesByExam[eId].push(s);
  });

  // Calculate dynamic candidate counts per series
  const allSeriesIds = seriesList.map((s) => s._id);
  const attemptsAgg = await MockTestAttempt.aggregate([
    { $match: { series: { $in: allSeriesIds } } },
    { $group: { _id: '$series', count: { $sum: 1 } } },
  ]);
  const attemptsBySeries = {};
  attemptsAgg.forEach((a) => {
    attemptsBySeries[String(a._id)] = a.count;
  });

  const populatedExams = exams.map((exam) => {
    const childSeries = seriesByExam[String(exam._id)] || [];
    const totalSeries = childSeries.length;
    const totalTests = childSeries.reduce((acc, s) => acc + (s.total_tests || 0), 0);
    const freeTests = childSeries.reduce((acc, s) => acc + (s.free_tests_count || 0), 0);
    const totalQuestions = childSeries.reduce((acc, s) => acc + (s.total_questions || 0), 0);
    const totalAttempts = childSeries.reduce(
      (acc, s) => acc + (attemptsBySeries[String(s._id)] || 0),
      0
    );

    // Auto-generate highlights if not explicitly set
    let highlights = exam.highlights && exam.highlights.length > 0 ? exam.highlights : [];
    if (highlights.length === 0 && childSeries.length > 0) {
      highlights = childSeries.slice(0, 3).map((s) => s.title);
      if (childSeries.length > 3) {
        highlights.push(`+${childSeries.length - 3} more exam series`);
      }
    }
    if (highlights.length === 0) {
      highlights = [
        'Full Length Mock Tests based on latest pattern',
        'Chapter & Sectional Practice Tests',
        'Free Mock Papers with Instant Solutions',
        'All India Rank (AIR) & Detailed Analysis',
      ];
    }

    return {
      ...exam,
      total_series: totalSeries,
      total_tests: totalTests > 0 ? totalTests : (totalSeries > 0 ? totalSeries * 10 : 0),
      free_tests_count: freeTests,
      total_questions: totalQuestions,
      total_users: totalAttempts,
      total_attempts: totalAttempts,
      highlights,
      child_series: childSeries.map((s) => ({
        id: s._id,
        title: s.title,
        slug: s.slug,
        total_tests: s.total_tests,
        free_tests_count: s.free_tests_count,
      })),
    };
  });

  res.status(200).json({
    success: true,
    data: populatedExams,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
  });
});

export const getExamById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  const exam = isObjectId
    ? await Exam.findById(id).populate('category', 'name slug').populate('subjects', 'name slug').lean()
    : await Exam.findOne({ slug: id }).populate('category', 'name slug').populate('subjects', 'name slug').lean();

  if (!exam) {
    throw new ApiError(404, 'Examination not found');
  }

  // Fetch all child MockTestSeries under this exam
  const childSeries = await MockTestSeries.find({
    examination: exam._id,
    status: { $in: ['publish', 'published', 'Published'] },
  })
    .populate('category', 'name slug')
    .populate('subjects', 'name slug')
    .sort({ order: 1, createdAt: -1 })
    .lean();

  const seriesIds = childSeries.map((s) => s._id);

  // Dynamic child tests calculation
  const allChildTests = await MockTest.find({
    series: { $in: seriesIds },
    status: { $in: ['publish', 'published', 'Published'] },
  })
    .select('_id series is_paid is_free total_questions total_attempts')
    .lean();

  const testsBySeries = {};
  const freeTestsBySeries = {};
  const questionsBySeries = {};
  const testAttemptsBySeries = {};

  allChildTests.forEach((t) => {
    const sId = String(t.series);
    testsBySeries[sId] = (testsBySeries[sId] || 0) + 1;
    if (!t.is_paid || t.is_free) {
      freeTestsBySeries[sId] = (freeTestsBySeries[sId] || 0) + 1;
    }
    questionsBySeries[sId] = (questionsBySeries[sId] || 0) + (t.total_questions || 0);
    testAttemptsBySeries[sId] = (testAttemptsBySeries[sId] || 0) + (t.total_attempts || 0);
  });

  const testIds = allChildTests.map((t) => t._id);

  // Aggregate user attempts for all child series and tests
  const attemptsAgg = await MockTestAttempt.aggregate([
    {
      $match: {
        $or: [
          { series: { $in: seriesIds } },
          { test: { $in: testIds } },
        ],
      },
    },
    { $group: { _id: '$series', count: { $sum: 1 } } },
  ]);

  const attemptsMap = {};
  attemptsAgg.forEach((a) => {
    if (a._id) attemptsMap[String(a._id)] = a.count;
  });

  const populatedSeries = childSeries.map((s) => {
    const sId = String(s._id);
    const dynamicTests = testsBySeries[sId] !== undefined ? testsBySeries[sId] : (s.total_tests || 0);
    const dynamicFree = freeTestsBySeries[sId] !== undefined ? freeTestsBySeries[sId] : (s.free_tests_count || 0);
    const dynamicQuestions = questionsBySeries[sId] !== undefined ? questionsBySeries[sId] : (s.total_questions || 0);
    const dynamicUsers = Math.max(attemptsMap[sId] || 0, testAttemptsBySeries[sId] || 0);

    return {
      ...s,
      total_tests: dynamicTests,
      free_tests_count: dynamicFree,
      total_questions: dynamicQuestions,
      total_users: dynamicUsers,
    };
  });

  const totalTests = populatedSeries.reduce((acc, s) => acc + (s.total_tests || 0), 0);
  const freeTests = populatedSeries.reduce((acc, s) => acc + (s.free_tests_count || 0), 0);
  const totalQuestions = populatedSeries.reduce((acc, s) => acc + (s.total_questions || 0), 0);
  const totalAttempts = populatedSeries.reduce((acc, s) => acc + (s.total_users || 0), 0);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        ...exam,
        total_series: childSeries.length,
        total_tests: totalTests,
        free_tests_count: freeTests,
        total_questions: totalQuestions,
        total_users: totalAttempts,
        total_attempts: totalAttempts,
        series: populatedSeries,
      },
      'Examination retrieved successfully'
    )
  );
});

export const createExam = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    image,
    banner_image,
    emblem,
    category,
    category_name,
    subjects,
    highlights,
    languages,
    badge,
    description,
    top_description,
    bottom_description,
    status,
    is_featured,
    order,
    seo,
  } = req.body;

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

  let resolvedCatName = category_name || '';
  if (category && !resolvedCatName) {
    const cDoc = await Category.findById(category).select('name');
    if (cDoc) resolvedCatName = cDoc.name;
  }

  const exam = await Exam.create({
    sql_id: nextSqlId,
    name: name.trim(),
    slug: cleanSlug,
    image: image ? image.trim() : '',
    banner_image: banner_image ? banner_image.trim() : '',
    emblem: emblem ? emblem.trim() : (image ? image.trim() : ''),
    category: category || null,
    category_name: resolvedCatName,
    subjects: Array.isArray(subjects) ? subjects : [],
    highlights: Array.isArray(highlights) ? highlights.filter(Boolean) : [],
    languages: Array.isArray(languages) && languages.length > 0 ? languages : ['English', 'Hindi'],
    badge: badge || 'Popular',
    description: description || '',
    top_description: top_description ? cleanHtmlContent(top_description) : '',
    bottom_description: bottom_description ? cleanHtmlContent(bottom_description) : '',
    status: status || 'Published',
    is_featured: Boolean(is_featured),
    order: parseInt(order, 10) || 0,
    author: req.user?._id || null,
    author_name: req.user?.name || req.user?.nicename || 'Author',
    user_id: req.user?.sql_id || null,
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

  const userRole = (req.user?.role || '').toLowerCase();
  const userId = req.user?._id || req.user?.id;
  const isAuthor = userRole === 'author' || userRole === 'writer' || userRole === 'contributor';
  if (isAuthor && userId) {
    const isOwner = exam.author && String(exam.author) === String(userId);
    if (!isOwner) {
      throw new ApiError(403, 'Permission denied: You can only modify your own examination.');
    }
  }

  const validation = await validateExamData(req.body, { isNew: false, currentId: exam._id });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: Object.values(validation.errors)[0] || 'Validation failed. Please fix the highlighted fields.',
      errors: validation.errors,
    });
  }

  const {
    name,
    slug,
    image,
    banner_image,
    emblem,
    category,
    category_name,
    subjects,
    highlights,
    languages,
    badge,
    description,
    top_description,
    bottom_description,
    status,
    is_featured,
    order,
    seo,
  } = req.body;

  if (name !== undefined) exam.name = name.trim();
  if (slug !== undefined) exam.slug = slugify(slug);
  if (image !== undefined) exam.image = image ? image.trim() : '';
  if (banner_image !== undefined) exam.banner_image = banner_image ? banner_image.trim() : '';
  if (emblem !== undefined) exam.emblem = emblem ? emblem.trim() : '';
  if (category !== undefined) {
    exam.category = category || null;
    if (category) {
      const cDoc = await Category.findById(category).select('name');
      if (cDoc) exam.category_name = cDoc.name;
    } else {
      exam.category_name = '';
    }
  }
  if (category_name !== undefined) exam.category_name = category_name;
  if (subjects !== undefined) exam.subjects = Array.isArray(subjects) ? subjects : [];
  if (highlights !== undefined) exam.highlights = Array.isArray(highlights) ? highlights.filter(Boolean) : [];
  if (languages !== undefined) exam.languages = Array.isArray(languages) ? languages : ['English', 'Hindi'];
  if (badge !== undefined) exam.badge = badge;
  if (description !== undefined) exam.description = description;
  if (top_description !== undefined) exam.top_description = cleanHtmlContent(top_description);
  if (bottom_description !== undefined) exam.bottom_description = cleanHtmlContent(bottom_description);
  if (status !== undefined) exam.status = status;
  if (is_featured !== undefined) exam.is_featured = Boolean(is_featured);
  if (order !== undefined) exam.order = parseInt(order, 10) || 0;

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
  const exam = await Exam.findById(id);
  if (!exam) {
    throw new ApiError(404, 'Examination not found');
  }

  const userRole = (req.user?.role || '').toLowerCase();
  const userId = req.user?._id || req.user?.id;
  const isAuthor = userRole === 'author' || userRole === 'writer' || userRole === 'contributor';
  if (isAuthor && userId) {
    const isOwner = exam.author && String(exam.author) === String(userId);
    if (!isOwner) {
      throw new ApiError(403, 'Permission denied: You can only delete your own examination question papers.');
    }
  }

  await Exam.findByIdAndDelete(id);
  res.status(200).json(new ApiResponse(200, null, 'Examination deleted successfully'));
});

export const bulkActionExams = asyncHandler(async (req, res) => {
  const { action, ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'No examinations selected');
  }

  const userRole = (req.user?.role || '').toLowerCase();
  const userId = req.user?._id || req.user?.id;
  const isAuthor = userRole === 'author' || userRole === 'writer' || userRole === 'contributor';

  let targetQuery = { _id: { $in: ids } };
  if (isAuthor && userId) {
    targetQuery = { _id: { $in: ids }, author: userId };
  }

  if (action === 'delete') {
    await Exam.deleteMany(targetQuery);
    return res.status(200).json(new ApiResponse(200, null, `Deleted examinations`));
  }

  throw new ApiError(400, 'Invalid bulk action');
});
