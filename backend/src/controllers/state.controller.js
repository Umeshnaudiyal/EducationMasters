import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import { State, District, Country } from '../models/index.js';
import { validateUniqueSlug, slugify } from '../utils/slug.js';
import { cleanHtmlContent } from '../utils/cleanHtml.js';
import mongoose from 'mongoose';

const validateStateData = async (data, { isNew = false, currentId = null } = {}) => {
  const errors = {};

  if (isNew || data.name !== undefined) {
    const name = String(data.name || '').trim();
    if (!name) {
      errors.name = 'State name is required';
    } else if (name.length < 2) {
      errors.name = 'State name must be at least 2 characters long';
    } else if (name.length > 100) {
      errors.name = 'State name cannot exceed 100 characters';
    }
  }

  if (isNew || data.slug !== undefined) {
    const slugValidation = await validateUniqueSlug(State, {
      slug: data.slug,
      fallbackText: data.name,
      currentId,
      modelLabel: 'state',
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

export const getStates = asyncHandler(async (req, res) => {
  const isAll = req.query.all === 'true' || req.query.all === true;
  const search = (req.query.search || req.query.q || '').trim();
  const countryParam = (req.query.country || req.query.countryId || '').trim();

  const query = { name: { $exists: true, $ne: '' } };

  if (countryParam) {
    let countryDoc = null;
    if (mongoose.Types.ObjectId.isValid(countryParam)) {
      countryDoc = await Country.findById(countryParam);
    } else {
      countryDoc = await Country.findOne({
        $or: [
          { name: { $regex: `^${countryParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
          { slug: countryParam.toLowerCase() },
          { code: countryParam.toUpperCase() },
        ],
      });
    }

    if (countryDoc) {
      if (countryDoc.slug === 'india' || countryDoc.code === 'IN' || countryDoc.sql_id === 1) {
        query.$or = [
          { country: countryDoc._id },
          { country_id: countryDoc.sql_id },
          { country: { $exists: false } },
          { country: null },
        ];
      } else {
        query.$or = [
          { country: countryDoc._id },
          { country_id: countryDoc.sql_id },
        ];
      }
    } else if (countryParam.toLowerCase() === 'india') {
      query.$or = [
        { country_id: 1 },
        { country: { $exists: false } },
        { country: null },
      ];
    } else {
      query.country = new mongoose.Types.ObjectId(); // Unlinked country
    }
  }

  if (search) {
    const searchCondition = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { capital: { $regex: search, $options: 'i' } },
        { governor: { $regex: search, $options: 'i' } },
        { chief_minister: { $regex: search, $options: 'i' } },
      ],
    };

    if (query.$or) {
      query.$and = [{ $or: query.$or }, searchCondition];
      delete query.$or;
    } else {
      query.$or = searchCondition.$or;
    }
  }

  if (isAll) {
    const states = await State.find(query)
      .collation({ locale: 'en', strength: 2 })
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: states.length,
      total: states.length,
      data: states,
    });
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [states, total] = await Promise.all([
    State.find(query)
      .collation({ locale: 'en', strength: 2 })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    State.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: states,
    count: states.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
  });
});

export const getStateById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  const state = isObjectId
    ? await State.findById(id).lean()
    : await State.findOne({ slug: id }).lean();

  if (!state) {
    throw new ApiError(404, 'State not found');
  }

  res.status(200).json(new ApiResponse(200, state, 'State retrieved successfully'));
});

export const createState = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    image,
    state_number,
    governor,
    chief_minister,
    capital,
    land_area,
    population,
    about_state,
    description,
    description_hi,
    job_description,
    seo,
    seo_hi,
  } = req.body;

  const validation = await validateStateData(req.body, { isNew: true });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: Object.values(validation.errors)[0] || 'Validation failed. Please fix the highlighted fields.',
      errors: validation.errors,
    });
  }

  const cleanSlug = slug ? slugify(slug) : slugify(name);
  const highest = await State.findOne({ sql_id: { $ne: null } }).sort({ sql_id: -1 }).select('sql_id').lean();
  const nextSqlId = (highest?.sql_id || 0) + 1;

  const state = await State.create({
    sql_id: nextSqlId,
    name: name.trim(),
    slug: cleanSlug,
    image: image ? image.trim() : '',
    state_number: state_number ? String(state_number).trim() : '',
    governor: governor ? governor.trim() : '',
    chief_minister: chief_minister ? chief_minister.trim() : '',
    capital: capital ? capital.trim() : '',
    land_area: land_area ? land_area.trim() : '',
    population: population ? population.trim() : '',
    about_state: about_state ? cleanHtmlContent(about_state) : '',
    description: description ? cleanHtmlContent(description) : '',
    description_hi: description_hi ? cleanHtmlContent(description_hi) : '',
    job_description: job_description ? cleanHtmlContent(job_description) : '',
    seo: {
      allow_indexing: seo?.allow_indexing ?? true,
      meta_title: seo?.meta_title || '',
      meta_keywords: seo?.meta_keywords || '',
      meta_description: seo?.meta_description || '',
    },
    seo_hi: {
      meta_title: seo_hi?.meta_title || '',
      meta_keywords: seo_hi?.meta_keywords || '',
      meta_description: seo_hi?.meta_description || '',
    },
  });

  res.status(201).json(new ApiResponse(201, state, 'State created successfully'));
});

export const updateState = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const state = await State.findById(id);
  if (!state) {
    throw new ApiError(404, 'State not found');
  }

  const validation = await validateStateData(req.body, { isNew: false, currentId: state._id });
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
    state_number,
    governor,
    chief_minister,
    capital,
    land_area,
    population,
    about_state,
    description,
    description_hi,
    job_description,
    seo,
    seo_hi,
  } = req.body;

  if (name !== undefined) state.name = name.trim();
  if (slug !== undefined) state.slug = slugify(slug);
  if (image !== undefined) state.image = image ? image.trim() : '';
  if (state_number !== undefined) state.state_number = String(state_number).trim();
  if (governor !== undefined) state.governor = governor ? governor.trim() : '';
  if (chief_minister !== undefined) state.chief_minister = chief_minister ? chief_minister.trim() : '';
  if (capital !== undefined) state.capital = capital ? capital.trim() : '';
  if (land_area !== undefined) state.land_area = land_area ? land_area.trim() : '';
  if (population !== undefined) state.population = population ? population.trim() : '';
  if (about_state !== undefined) state.about_state = cleanHtmlContent(about_state);
  if (description !== undefined) state.description = cleanHtmlContent(description);
  if (description_hi !== undefined) state.description_hi = cleanHtmlContent(description_hi);
  if (job_description !== undefined) state.job_description = cleanHtmlContent(job_description);
  if (seo !== undefined) {
    state.seo = {
      allow_indexing: seo.allow_indexing ?? true,
      meta_title: seo.meta_title || '',
      meta_keywords: seo.meta_keywords || '',
      meta_description: seo.meta_description || '',
    };
  }
  if (seo_hi !== undefined) {
    state.seo_hi = {
      meta_title: seo_hi.meta_title || '',
      meta_keywords: seo_hi.meta_keywords || '',
      meta_description: seo_hi.meta_description || '',
    };
  }

  await state.save();
  res.status(200).json(new ApiResponse(200, state, 'State updated successfully'));
});

export const deleteState = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const state = await State.findByIdAndDelete(id);
  if (!state) {
    throw new ApiError(404, 'State not found');
  }
  res.status(200).json(new ApiResponse(200, null, 'State deleted successfully'));
});

export const bulkActionStates = asyncHandler(async (req, res) => {
  const { action, ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'No states selected for bulk action');
  }

  // Handle delete action (default to delete if action is 'delete' or not specified on delete routes)
  if (!action || action === 'delete') {
    const validObjectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const rawIds = ids.map((id) => (!isNaN(id) ? parseInt(id, 10) : id));

    const deleteQuery = {
      $or: [
        { _id: { $in: validObjectIds } },
        { sql_id: { $in: rawIds } },
      ],
    };

    const result = await State.deleteMany(deleteQuery);
    return res.status(200).json(
      new ApiResponse(200, { deletedCount: result.deletedCount }, `Successfully deleted ${result.deletedCount || ids.length} state(s)`)
    );
  }

  throw new ApiError(400, `Invalid bulk action "${action}"`);
});

export const getDistricts = asyncHandler(async (req, res) => {
  const { stateId, state } = req.query;
  const target = stateId || state;

  let query = {};
  if (target) {
    const targetStr = String(target).trim();
    if (/^[0-9a-fA-F]{24}$/.test(targetStr)) {
      const stateDoc = await State.findById(targetStr).lean();
      if (stateDoc) {
        query = {
          $or: [
            { state: stateDoc._id },
            { state_id: stateDoc.sql_id || stateDoc.id }
          ]
        };
      } else {
        query = { state: targetStr };
      }
    } else if (!isNaN(targetStr)) {
      query = { state_id: parseInt(targetStr, 10) };
    } else {
      const stateDoc = await State.findOne({ slug: targetStr }).lean();
      if (stateDoc) {
        query = {
          $or: [
            { state: stateDoc._id },
            { state_id: stateDoc.sql_id || stateDoc.id }
          ]
        };
      }
    }
  }

  const districts = await District.find(query)
    .collation({ locale: 'en', strength: 2 })
    .sort({ name: 1 })
    .lean();

  res.status(200).json({
    success: true,
    count: districts.length,
    data: districts,
  });
});

export const getDistrictsByState = asyncHandler(async (req, res) => {
  const { stateId } = req.params;
  let query = {};

  if (stateId) {
    const targetStr = String(stateId).trim();
    if (/^[0-9a-fA-F]{24}$/.test(targetStr)) {
      const stateDoc = await State.findById(targetStr).lean();
      if (stateDoc) {
        query = {
          $or: [
            { state: stateDoc._id },
            { state_id: stateDoc.sql_id || stateDoc.id }
          ]
        };
      } else {
        query = { state: targetStr };
      }
    } else if (!isNaN(targetStr)) {
      query = { state_id: parseInt(targetStr, 10) };
    } else {
      const stateDoc = await State.findOne({ slug: targetStr }).lean();
      if (stateDoc) {
        query = {
          $or: [
            { state: stateDoc._id },
            { state_id: stateDoc.sql_id || stateDoc.id }
          ]
        };
      }
    }
  }

  const districts = await District.find(query)
    .collation({ locale: 'en', strength: 2 })
    .sort({ name: 1 })
    .lean();

  res.status(200).json({
    success: true,
    count: districts.length,
    data: districts,
  });
});

// Public State Portal Hub Data (Jobs, Admit Cards, Results, MCQs, Districts, State Facts)
export const getPublicStateProfile = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    throw new ApiError(400, 'State identifier is required');
  }

  const rawSlug = decodeURIComponent(slug).trim();
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(rawSlug);
  const numId = Number(rawSlug);

  const queryConditions = [
    { slug: rawSlug.toLowerCase() },
    { slug: slugify(rawSlug) },
    { name: new RegExp(`^${rawSlug.replace(/[-_]/g, ' ')}$`, 'i') },
    { name: rawSlug },
  ];

  if (isObjectId) {
    queryConditions.push({ _id: rawSlug });
  }
  if (!isNaN(numId) && numId > 0) {
    queryConditions.push({ sql_id: numId });
  }

  let state = await State.findOne({ $or: queryConditions }).populate('country', 'name slug code').lean();

  if (!state) {
    state = await State.findOne({
      $or: [
        { slug: new RegExp(rawSlug, 'i') },
        { name: new RegExp(rawSlug.replace(/[-_]/g, '.*'), 'i') },
      ],
    }).populate('country', 'name slug code').lean();
  }

  if (!state) {
    throw new ApiError(404, `State "${rawSlug}" not found`);
  }

  // Import related models dynamically
  const Job = (await import('../models/job.model.js')).default;
  const AdmitCard = (await import('../models/admitCard.model.js')).default;
  const Result = (await import('../models/result.model.js')).default;
  const Question = (await import('../models/question.model.js')).default;

  const stateFilter = {
    $or: [
      { state: state._id },
      ...(state.sql_id ? [{ state_id: state.sql_id }] : []),
      { dept: { $regex: state.name, $options: 'i' } },
      { title: { $regex: state.name, $options: 'i' } },
    ],
  };

  const questionFilter = {
    $or: [
      { state: state._id },
      ...(state.sql_id ? [{ state_id: state.sql_id }] : []),
      { state_name: { $regex: state.name, $options: 'i' } },
    ],
  };

  const [
    jobsCount,
    admitCardsCount,
    resultsCount,
    mcqCount,
    districts,
    recentJobs,
    recentAdmitCards,
    recentResults,
  ] = await Promise.all([
    Job.countDocuments({ ...stateFilter, status: { $ne: 'trash' } }),
    AdmitCard.countDocuments({ ...stateFilter, status: { $ne: 'trash' } }),
    Result.countDocuments({ ...stateFilter, status: { $ne: 'trash' } }),
    Question.countDocuments(questionFilter),
    District.find({
      $or: [
        { state: state._id },
        ...(state.sql_id ? [{ state_id: state.sql_id }] : []),
      ],
    }).sort({ name: 1 }).lean(),
    Job.find({ ...stateFilter, status: { $ne: 'trash' } })
      .sort({ createdAt: -1, created_at: -1 })
      .limit(24)
      .populate('featured_media', 'path file alt name')
      .select('title slug image featured_media description app_ends createdAt created_at dept')
      .lean(),
    AdmitCard.find({ ...stateFilter, status: { $ne: 'trash' } })
      .sort({ createdAt: -1, created_at: -1 })
      .limit(10)
      .populate('featured_media', 'path file alt name')
      .select('title slug image featured_media description createdAt created_at department')
      .lean(),
    Result.find({ ...stateFilter, status: { $ne: 'trash' } })
      .sort({ createdAt: -1, created_at: -1 })
      .limit(10)
      .populate('featured_media', 'path file alt name')
      .select('title slug image featured_media description createdAt created_at department')
      .lean(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        state,
        stats: {
          jobs: jobsCount,
          admitCards: admitCardsCount,
          results: resultsCount,
          mcqs: mcqCount || 500,
          districts: districts.length,
        },
        districts,
        jobs: recentJobs,
        admitCards: recentAdmitCards,
        results: recentResults,
      },
      'State profile fetched successfully'
    )
  );
});

