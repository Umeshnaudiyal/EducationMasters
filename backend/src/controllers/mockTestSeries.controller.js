import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import { MockTestSeries, MockTest, MockTestAttempt, Exam, Category } from '../models/index.js';
import { slugify, validateUniqueSlug } from '../utils/slug.js';
import { cleanHtmlContent, stripHtmlToPlainText } from '../utils/cleanHtml.js';

// Get list of Mock Test Series with filters & pagination
export const getMockTestSeriesList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const skip = (page - 1) * limit;

  const search = (req.query.search || req.query.q || '').trim();
  const examFilter = req.query.exam || req.query.examination || '';
  const categoryFilter = req.query.category || '';
  const statusFilter = (req.query.status || 'published').toLowerCase();
  const isFeatured = req.query.featured;

  const query = {};

  if (statusFilter === 'all') {
    // Return all statuses (for admin)
  } else if (statusFilter === 'draft') {
    query.status = { $in: ['draft', 'Draft'] };
  } else if (statusFilter === 'published' || statusFilter === 'publish') {
    query.status = { $in: ['publish', 'published', 'Published'] };
  } else {
    query.status = { $in: ['publish', 'published', 'Published'] };
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } },
      { examination_name: { $regex: search, $options: 'i' } },
      { category_name: { $regex: search, $options: 'i' } },
      { badge: { $regex: search, $options: 'i' } },
    ];
  }

  if (examFilter && examFilter !== 'all') {
    if (/^[0-9a-fA-F]{24}$/.test(examFilter)) {
      query.examination = examFilter;
    } else {
      query.examination_name = { $regex: examFilter.replace(/-/g, ' '), $options: 'i' };
    }
  }

  if (categoryFilter && categoryFilter !== 'all') {
    if (/^[0-9a-fA-F]{24}$/.test(categoryFilter)) {
      query.category = categoryFilter;
    } else {
      query.category_name = { $regex: categoryFilter.replace(/-/g, ' '), $options: 'i' };
    }
  }

  if (isFeatured !== undefined) {
    query.is_featured = isFeatured === 'true' || isFeatured === true;
  }

  const [
    allCount,
    publishedCount,
    draftCount,
    pendingCount,
    trashCount,
    seriesList,
    totalFiltered,
  ] = await Promise.all([
    MockTestSeries.countDocuments({ status: { $nin: ['trash', 'trashed', 'Trashed'] } }),
    MockTestSeries.countDocuments({ status: { $in: ['publish', 'published', 'Published'] } }),
    MockTestSeries.countDocuments({ status: { $in: ['draft', 'Draft'] } }),
    MockTestSeries.countDocuments({ status: { $in: ['pending', 'Pending'] } }),
    MockTestSeries.countDocuments({ status: { $in: ['trash', 'trashed', 'Trashed'] } }),
    MockTestSeries.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MockTestSeries.countDocuments(query),
  ]);

  // Aggregate dynamic candidate counts per series
  const seriesIds = seriesList.map((s) => s._id);
  const seriesUserAggregate = await MockTestAttempt.aggregate([
    {
      $match: {
        series: { $in: seriesIds },
      },
    },
    {
      $group: {
        _id: {
          series: '$series',
          userKey: {
            $cond: [
              { $ne: ['$user', null] },
              '$user',
              {
                $cond: [
                  { $and: [{ $ne: ['$user_email', ''] }, { $ne: ['$user_email', null] }] },
                  '$user_email',
                  '$_id',
                ],
              },
            ],
          },
        },
      },
    },
    {
      $group: {
        _id: '$_id.series',
        uniqueUsers: { $sum: 1 },
      },
    },
  ]);

  const seriesUserMap = {};
  seriesUserAggregate.forEach((item) => {
    seriesUserMap[String(item._id)] = item.uniqueUsers;
  });

  // Recalculate test counts & dynamic users count
  const populatedSeries = await Promise.all(
    seriesList.map(async (s) => {
      const [totalTests, freeTests] = await Promise.all([
        MockTest.countDocuments({ series: s._id, status: { $in: ['publish', 'published', 'Published'] } }),
        MockTest.countDocuments({
          series: s._id,
          $or: [{ is_paid: false }, { is_free: true }],
          status: { $in: ['publish', 'published', 'Published'] },
        }),
      ]);
      return {
        ...s,
        total_tests: totalTests,
        free_tests_count: freeTests,
        total_users: seriesUserMap[String(s._id)] || 0,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: populatedSeries,
    counts: {
      all: allCount,
      published: publishedCount,
      draft: draftCount,
      pending: pendingCount,
      trash: trashCount,
    },
    total: totalFiltered,
    page,
    pages: Math.ceil(totalFiltered / limit) || 1,
  });
});

// Get single Mock Test Series by slug or ID with all child tests and dynamic candidate counts
export const getMockTestSeriesBySlugOrId = asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

  const series = isObjectId
    ? await MockTestSeries.findById(identifier).lean()
    : await MockTestSeries.findOne({ slug: identifier }).lean();

  if (!series) {
    throw new ApiError(404, 'Mock test series not found');
  }

  // Fetch all child tests under this series
  const childTests = await MockTest.find({ series: series._id })
    .select(
      'title slug test_type is_paid is_free duration_minutes total_marks pass_marks negative_marking marks_per_question medium sections total_questions total_attempts status order'
    )
    .sort({ order: 1, createdAt: 1 })
    .lean();

  const totalTests = childTests.length;
  const freeTests = childTests.filter((t) => !t.is_paid || t.is_free).length;
  const totalQuestions = childTests.reduce((acc, t) => acc + (t.total_questions || 0), 0);
  const childTestIds = childTests.map((t) => t._id);

  // 1. Calculate dynamic unique user count across the entire examination / test series
  let examSeriesIds = [series._id];
  if (series.examination) {
    const siblingSeries = await MockTestSeries.find({ examination: series.examination }).select('_id').lean();
    if (siblingSeries.length > 0) {
      examSeriesIds = siblingSeries.map((s) => s._id);
    }
  }

  const allExamTests = await MockTest.find({ series: { $in: examSeriesIds } }).select('_id').lean();
  const allExamTestIds = allExamTests.map((t) => t._id);
  const targetTestIds = allExamTestIds.length > 0 ? allExamTestIds : childTestIds;

  const [seriesParticipantsAggregate, testCandidatesAggregate] = await Promise.all([
    // Dynamic Unique Candidates for the entire examination / series
    MockTestAttempt.aggregate([
      {
        $match: {
          $or: [
            { series: { $in: examSeriesIds } },
            { test: { $in: targetTestIds } },
          ],
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $ne: ['$user', null] },
              '$user',
              {
                $cond: [
                  { $and: [{ $ne: ['$user_email', ''] }, { $ne: ['$user_email', null] }] },
                  '$user_email',
                  '$_id',
                ],
              },
            ],
          },
        },
      },
    ]),

    // Dynamic Unique Candidates & Total Attempts per individual child test
    MockTestAttempt.aggregate([
      {
        $match: {
          test: { $in: childTestIds },
        },
      },
      {
        $group: {
          _id: {
            test: '$test',
            userKey: {
              $cond: [
                { $ne: ['$user', null] },
                '$user',
                {
                  $cond: [
                    { $and: [{ $ne: ['$user_email', ''] }, { $ne: ['$user_email', null] }] },
                    '$user_email',
                    '$_id',
                  ],
                },
              ],
            },
          },
          attemptsCount: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.test',
          uniqueUsers: { $sum: 1 },
          totalAttempts: { $sum: '$attemptsCount' },
        },
      },
    ]),
  ]);

  const totalExaminationUsers = seriesParticipantsAggregate.length;

  const testStatsMap = {};
  testCandidatesAggregate.forEach((stat) => {
    testStatsMap[String(stat._id)] = {
      total_users: stat.uniqueUsers,
      total_attempts: stat.totalAttempts,
    };
  });

  const enrichedChildTests = childTests.map((t) => {
    const stats = testStatsMap[String(t._id)] || { total_users: 0, total_attempts: 0 };
    return {
      ...t,
      total_users: stats.total_users,
      total_attempts: Math.max(t.total_attempts || 0, stats.total_attempts),
    };
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        ...series,
        tests: enrichedChildTests,
        total_tests: totalTests,
        free_tests_count: freeTests,
        total_questions: totalQuestions,
        total_users: totalExaminationUsers,
      },
      'Mock test series retrieved successfully'
    )
  );
});

// Create Mock Test Series
export const createMockTestSeries = asyncHandler(async (req, res) => {
  const {
    title,
    slug,
    image,
    examination,
    category,
    badge,
    top_description,
    bottom_description,
    highlights,
    plans,
    status,
    is_featured,
    order,
    seo,
  } = req.body;

  const errors = {};
  if (!title || !title.trim()) {
    errors.title = 'Series title is required';
  }

  const cleanSlug = slug ? slugify(slug) : title ? slugify(title) : '';
  if (!cleanSlug) {
    errors.slug = 'Valid URL slug is required';
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, Object.values(errors)[0], errors);
  }

  // Check unique slug
  const existing = await MockTestSeries.findOne({ slug: cleanSlug });
  if (existing) {
    throw new ApiError(409, `A mock test series with URL slug "${cleanSlug}" already exists`, {
      slug: `The URL slug "${cleanSlug}" is already taken. Please choose a different slug.`,
    });
  }

  let examName = '';
  if (examination && /^[0-9a-fA-F]{24}$/.test(examination)) {
    const ex = await Exam.findById(examination).select('name').lean();
    if (ex) examName = ex.name;
  }

  let categoryName = '';
  if (category && /^[0-9a-fA-F]{24}$/.test(category)) {
    const cat = await Category.findById(category).select('name').lean();
    if (cat) categoryName = cat.name;
  }

  // Clean and validate plans array
  let formattedPlans = [];
  if (Array.isArray(plans) && plans.length > 0) {
    formattedPlans = plans.map((p) => ({
      name: p.name ? p.name.trim() : 'Standard Plan',
      price: Number(p.price) || 0,
      original_price: Number(p.original_price) || 0,
      validity: p.validity || '1 Year',
      validity_days: Number(p.validity_days) || 365,
      is_free: p.is_free !== undefined ? Boolean(p.is_free) : Number(p.price) === 0,
      is_popular: Boolean(p.is_popular),
      badge: p.badge || '',
      tagline: p.tagline || '',
      features: Array.isArray(p.features) ? p.features.filter((f) => f && f.trim()) : [],
      button_text: p.button_text || (Number(p.price) === 0 ? 'Select Free Plan' : `Select ₹${p.price} Plan`),
    }));
  }

  const cleanTopDesc = cleanHtmlContent(top_description || '');
  const cleanBottomDesc = cleanHtmlContent(bottom_description || '');
  const cleanMetaDesc = seo?.meta_description || stripHtmlToPlainText(top_description || '');

  const newSeries = await MockTestSeries.create({
    title: title.trim(),
    slug: cleanSlug,
    image: image || '',
    examination: examination || null,
    examination_name: examName,
    category: category || null,
    category_name: categoryName,
    badge: badge || 'Popular',
    top_description: cleanTopDesc,
    bottom_description: cleanBottomDesc,
    highlights: Array.isArray(highlights) ? highlights.filter((h) => h && h.trim()) : [],
    plans: formattedPlans,
    status: status || 'Published',
    is_featured: Boolean(is_featured),
    order: Number(order) || 0,
    author: req.user?._id || null,
    seo: {
      allow_indexing: seo?.allow_indexing !== undefined ? Boolean(seo.allow_indexing) : true,
      meta_title: stripHtmlToPlainText(seo?.meta_title || title.trim()),
      meta_keywords: stripHtmlToPlainText(seo?.meta_keywords || ''),
      meta_description: stripHtmlToPlainText(cleanMetaDesc),
    },
  });

  res.status(201).json(new ApiResponse(201, newSeries, 'Mock test series created successfully'));
});

// Update Mock Test Series
export const updateMockTestSeries = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const series = await MockTestSeries.findById(id);

  if (!series) {
    throw new ApiError(404, 'Mock test series not found');
  }

  const {
    title,
    slug,
    image,
    examination,
    category,
    badge,
    top_description,
    bottom_description,
    highlights,
    plans,
    status,
    is_featured,
    order,
    seo,
  } = req.body;

  const errors = {};
  if (title !== undefined && !title.trim()) {
    errors.title = 'Series title cannot be empty';
  }

  if (slug !== undefined) {
    const cleanSlug = slugify(slug);
    if (!cleanSlug) {
      errors.slug = 'Valid URL slug is required';
    } else if (cleanSlug !== series.slug) {
      const existing = await MockTestSeries.findOne({ slug: cleanSlug, _id: { $ne: series._id } });
      if (existing) {
        errors.slug = `The URL slug "${cleanSlug}" is already in use by another series.`;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, Object.values(errors)[0], errors);
  }

  if (title !== undefined) series.title = title.trim();
  if (slug !== undefined && slug.trim()) series.slug = slugify(slug);
  if (image !== undefined) series.image = image;
  if (badge !== undefined) series.badge = badge;
  if (top_description !== undefined) series.top_description = cleanHtmlContent(top_description || '');
  if (bottom_description !== undefined) series.bottom_description = cleanHtmlContent(bottom_description || '');
  if (highlights !== undefined) series.highlights = Array.isArray(highlights) ? highlights.filter((h) => h && h.trim()) : [];
  if (plans !== undefined && Array.isArray(plans)) {
    series.plans = plans.map((p) => ({
      name: p.name ? p.name.trim() : 'Standard Plan',
      price: Number(p.price) || 0,
      original_price: Number(p.original_price) || 0,
      validity: p.validity || '1 Year',
      validity_days: Number(p.validity_days) || 365,
      is_free: p.is_free !== undefined ? Boolean(p.is_free) : Number(p.price) === 0,
      is_popular: Boolean(p.is_popular),
      badge: p.badge || '',
      tagline: p.tagline || '',
      features: Array.isArray(p.features) ? p.features.filter((f) => f && f.trim()) : [],
      button_text: p.button_text || (Number(p.price) === 0 ? 'Select Free Plan' : `Select ₹${p.price} Plan`),
    }));
  }
  if (status !== undefined) series.status = status;
  if (is_featured !== undefined) series.is_featured = Boolean(is_featured);
  if (order !== undefined) series.order = Number(order);

  if (examination !== undefined) {
    series.examination = examination || null;
    if (examination && /^[0-9a-fA-F]{24}$/.test(examination)) {
      const ex = await Exam.findById(examination).select('name').lean();
      if (ex) series.examination_name = ex.name;
    } else {
      series.examination_name = '';
    }
  }

  if (category !== undefined) {
    series.category = category || null;
    if (category && /^[0-9a-fA-F]{24}$/.test(category)) {
      const cat = await Category.findById(category).select('name').lean();
      if (cat) series.category_name = cat.name;
    } else {
      series.category_name = '';
    }
  }

  if (seo) {
    series.seo = {
      allow_indexing: seo.allow_indexing !== undefined ? Boolean(seo.allow_indexing) : series.seo?.allow_indexing ?? true,
      meta_title: seo.meta_title !== undefined ? stripHtmlToPlainText(seo.meta_title) : series.seo?.meta_title ?? '',
      meta_keywords: seo.meta_keywords !== undefined ? stripHtmlToPlainText(seo.meta_keywords) : series.seo?.meta_keywords ?? '',
      meta_description: seo.meta_description !== undefined ? stripHtmlToPlainText(seo.meta_description) : series.seo?.meta_description ?? '',
    };
  }

  await series.save();

  res.status(200).json(new ApiResponse(200, series, 'Mock test series updated successfully'));
});

// Delete Mock Test Series & optionally child tests
export const deleteMockTestSeries = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const series = await MockTestSeries.findById(id);

  if (!series) {
    throw new ApiError(404, 'Mock test series not found');
  }

  // Delete child tests
  await MockTest.deleteMany({ series: series._id });
  await MockTestSeries.findByIdAndDelete(id);

  res.status(200).json(new ApiResponse(200, null, 'Mock test series and its tests deleted successfully'));
});

// Bulk Action for Mock Test Series
export const bulkActionMockTestSeries = asyncHandler(async (req, res) => {
  const { action, ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Please select at least one item');
  }

  if (action === 'delete') {
    await MockTest.deleteMany({ series: { $in: ids } });
    const result = await MockTestSeries.deleteMany({ _id: { $in: ids } });
    return res.status(200).json(new ApiResponse(200, result, `${result.deletedCount} series deleted successfully`));
  }

  if (action === 'publish') {
    const result = await MockTestSeries.updateMany({ _id: { $in: ids } }, { $set: { status: 'Published' } });
    return res.status(200).json(new ApiResponse(200, result, `${result.modifiedCount} series published`));
  }

  if (action === 'draft') {
    const result = await MockTestSeries.updateMany({ _id: { $in: ids } }, { $set: { status: 'Draft' } });
    return res.status(200).json(new ApiResponse(200, result, `${result.modifiedCount} series set to draft`));
  }

  throw new ApiError(400, 'Invalid bulk action');
});
