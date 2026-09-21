import { Job, State, Category, User } from '../models/index.js';
import { cleanHtmlContent } from '../utils/cleanHtml.js';
import ApiError from '../utils/apiError.js';
import { validateUniqueSlug, slugify } from '../utils/slug.js';
import {
  resolveCategoryIds,
  resolveStateId,
  resolveDepartmentId,
  sanitizeObjectId,
} from '../utils/resolveReferences.js';

export const getJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const category = (req.query.category || req.query.cat || '').trim();

    const query = { title: { $exists: true, $ne: '' } };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filter: Only show trash when explicitly selected
    if (req.query.status && req.query.status !== 'all') {
      const s = req.query.status.toLowerCase().trim();
      if (s === 'published' || s === 'publish') {
        query.status = { $in: ['publish', 'published', 'active'] };
      } else if (s === 'draft' || s === 'drafts') {
        query.status = 'draft';
      } else if (s === 'trash' || s === 'trashed') {
        query.status = 'trash';
      } else if (s === 'pending' || s === 'pending_review') {
        query.status = { $in: ['pending', 'pending_review'] };
      } else {
        query.status = s;
      }
    } else {
      // Default: exclude trashed jobs from 'all'
      query.status = { $ne: 'trash' };
    }

    // Author Scoping (Authors only see their own jobs)
    const authorParam = req.query.author || req.query.authorId || req.query.user_id || (req.user && (req.user.role === 'author' || req.user.role === 'writer') ? req.user._id : null);
    let authorFilter = null;
    if (authorParam) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(authorParam).trim());
      const numId = Number(authorParam);
      const authorConditions = [];
      if (isObjectId) {
        authorConditions.push({ author: authorParam });
      }
      if (!isNaN(numId) && numId > 0) {
        authorConditions.push({ user_id: numId });
      }
      if (authorConditions.length > 0) {
        authorFilter = { $or: authorConditions };
        query.$and = query.$and ? [...query.$and, authorFilter] : [authorFilter];
      }
    }

    if (category && category !== 'all') {
      const catDoc = await Category.findOne({
        $or: [{ slug: category }, { name: { $regex: category, $options: 'i' } }],
      }).select('_id');
      if (catDoc) {
        query.categories = catDoc._id;
      }
    }

    const baseCountQuery = authorFilter ? { $and: [authorFilter] } : {};

    const [
      jobs,
      total,
      allCount,
      draftCount,
      publishedCount,
      pendingCount,
      trashCount,
    ] = await Promise.all([
      Job.find(query)
        .populate('author', 'name email nicename')
        .populate('categories', 'name slug')
        .populate('featured_media', 'path file alt name')
        .populate('state', 'name slug')
        .sort({ created_at: -1, sql_id: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Job.countDocuments(query),
      Job.countDocuments({ ...baseCountQuery, status: { $ne: 'trash' } }),
      Job.countDocuments({ ...baseCountQuery, status: 'draft' }),
      Job.countDocuments({ ...baseCountQuery, status: { $in: ['publish', 'published', 'active'] } }),
      Job.countDocuments({ ...baseCountQuery, status: { $in: ['pending', 'pending_review'] } }),
      Job.countDocuments({ ...baseCountQuery, status: 'trash' }),
    ]);

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      statusCounts: {
        all: allCount,
        draft: draftCount,
        published: publishedCount,
        pending: pendingCount,
        trash: trashCount,
      },
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

export const getExpiringJobs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;
    const todayStr = new Date().toISOString().slice(0, 10);
    
    const expiringJobs = await Job.find({ 
      app_ends: { $gte: todayStr, $nin: [null, '', '0000-00-00'] } 
    })
      .select('title slug app_ends dates categories featured_media state created_at')
      .populate('featured_media', 'path file alt')
      .populate('categories', 'name slug')
      .sort({ app_ends: 1, created_at: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: expiringJobs.length,
      data: expiringJobs,
    });
  } catch (error) {
    next(error);
  }
};

export const getJobBySlug = async (req, res, next) => {
  try {
    const isId = req.params.slug.match(/^[0-9a-fA-F]{24}$/);
    const job = await Job.findOne(isId ? { _id: req.params.slug } : { slug: req.params.slug })
      .populate('author', 'name nicename email image bio')
      .populate('categories', 'name slug')
      .populate('featured_media', 'path file alt name')
      .populate('state', 'name slug');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job notification not found' });
    }

    const jobObj = job.toObject();

    if ((!jobObj.state || typeof jobObj.state !== 'object' || !jobObj.state.name) && jobObj.state_id) {
      const stateDoc = await State.findOne({ sql_id: jobObj.state_id }).select('name slug');
      if (stateDoc) {
        jobObj.state = stateDoc;
      }
    }

    res.status(200).json({ success: true, data: jobObj });
  } catch (error) {
    next(error);
  }
};

export const createJob = async (req, res, next) => {
  try {
    const { title, post } = req.body;
    let { slug } = req.body;

    const validationErrors = {};
    if (!title || !title.trim()) {
      validationErrors.title = 'Job post title is required.';
    } else if (title.trim().length < 3) {
      validationErrors.title = 'Job title must be at least 3 characters long.';
    }

    const postVal = post || req.body.postName;
    if (!postVal || !String(postVal).trim()) {
      validationErrors.postName = 'Job Post Name (Name of Exam) is required.';
    }

    const vacanciesVal = req.body.vacancies || req.body.posts || req.body.total_posts;
    if (!vacanciesVal || !String(vacanciesVal).trim()) {
      validationErrors.vacancies = 'Number of Vacancies is required.';
    }

    const appEnd = req.body.app_ends || req.body.appEndDate || req.body.dates?.last_date;
    if (!appEnd || !String(appEnd).trim()) {
      validationErrors.appEndDate = 'Last Date of Application is required.';
    }

    const appLink = req.body.app_link || req.body.appUrl || req.body.links?.down_url;
    if (!appLink || !String(appLink).trim()) {
      validationErrors.appUrl = 'Job Application URL is required.';
    }

    const elig = req.body.eligibility;
    const strippedElig = (elig || '').replace(/<[^>]*>/g, '').trim();
    if (!elig || !elig.trim() || strippedElig === '') {
      validationErrors.eligibility = 'Eligibility Criteria is required.';
    }

    const fee = req.body.application_fee || req.body.fees?.fee_mode || (typeof req.body.fees === 'string' ? req.body.fees : '');
    const strippedFee = (fee || '').replace(/<[^>]*>/g, '').trim();
    if (!fee || !String(fee).trim() || strippedFee === '') {
      validationErrors.applicationFee = 'Application Fee details are required.';
    }

    const salary = req.body.pay_scale || req.body.salary;
    const strippedSalary = (salary || '').replace(/<[^>]*>/g, '').trim();
    if (!salary || !String(salary).trim() || strippedSalary === '') {
      validationErrors.payScale = 'Pay Scale (Salary Structure) is required.';
    }

    const desc = req.body.description || req.body.content;
    const strippedDesc = (desc || '').replace(/<[^>]*>/g, '').trim();
    if (!desc || !desc.trim() || strippedDesc === '') {
      validationErrors.description = 'Job Description content is required.';
    }

    const mTitle = req.body.metadata?.m_title || req.body.metaTitle || req.body.m_title;
    if (!mTitle || !String(mTitle).trim()) {
      validationErrors.metaTitle = 'SEO Meta Title is required.';
    }

    const mDesc = req.body.metadata?.m_desc || req.body.metaDescription || req.body.m_desc;
    if (!mDesc || !String(mDesc).trim()) {
      validationErrors.metaDescription = 'SEO Meta Description is required.';
    }

    if (!req.body.categories || (Array.isArray(req.body.categories) && req.body.categories.length === 0)) {
      validationErrors.categories = 'Please select at least one category for this job post.';
    }

    const slugValidation = await validateUniqueSlug(Job, {
      slug,
      fallbackText: title,
      modelLabel: 'job post',
      isRequired: true,
    });

    if (!slugValidation.isValid) {
      validationErrors.slug = slugValidation.error;
    } else {
      req.body.slug = slugValidation.slug;
    }

    if (Object.keys(validationErrors).length > 0) {
      throw new ApiError(400, Object.values(validationErrors)[0], validationErrors);
    }

    ['content', 'description', 'eligibility', 'fees', 'salary'].forEach((field) => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = cleanHtmlContent(req.body[field]);
      }
    });

    // Resolve ObjectId references
    if (req.body.categories !== undefined) {
      req.body.categories = await resolveCategoryIds(req.body.categories);
    }
    if (req.body.state !== undefined) {
      req.body.state = await resolveStateId(req.body.state);
    }
    if (req.body.department !== undefined || req.body.dept !== undefined) {
      req.body.department = await resolveDepartmentId(req.body.department || req.body.dept);
    }
    if (req.body.featured_media !== undefined) {
      req.body.featured_media = sanitizeObjectId(req.body.featured_media);
    }
    // Enforce Author status restrictions: Authors cannot publish directly, forced to 'pending' or 'draft'
    let isAuthor =
      req.user?.role === 'author' ||
      req.user?.role === 'writer' ||
      req.body?.role === 'author' ||
      req.body?.role === 'writer' ||
      req.body?.authorRole === 'author' ||
      req.headers?.['x-user-role'] === 'author';

    if (!isAuthor && req.body.author) {
      const authorUser = await User.findById(req.body.author).select('role sql_id');
      if (authorUser && (authorUser.role === 'author' || authorUser.role === 'writer')) {
        isAuthor = true;
        if (!req.body.user_id && authorUser.sql_id) {
          req.body.user_id = authorUser.sql_id;
        }
      }
    }

    if (isAuthor) {
      if (req.body.status === 'publish' || req.body.status === 'published' || req.body.status === 'active') {
        req.body.status = 'pending';
      } else if (!req.body.status) {
        req.body.status = 'draft';
      }
      if (req.user?._id) {
        req.body.author = req.user._id;
        req.body.user_id = req.user.sql_id || undefined;
      }
    }

    const job = await Job.create(req.body);
    res.status(201).json({ success: true, message: 'Job created successfully', data: job });
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (req, res, next) => {
  try {
    const isId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    let { slug, title } = req.body;

    // Enforce Author status restrictions: Authors cannot publish directly, forced to 'pending'
    let isAuthor =
      req.user?.role === 'author' ||
      req.user?.role === 'writer' ||
      req.body?.role === 'author' ||
      req.body?.role === 'writer' ||
      req.body?.authorRole === 'author' ||
      req.headers?.['x-user-role'] === 'author';

    if (!isAuthor && req.body.author) {
      const authorUser = await User.findById(req.body.author).select('role sql_id');
      if (authorUser && (authorUser.role === 'author' || authorUser.role === 'writer')) {
        isAuthor = true;
      }
    }

    if (isAuthor) {
      if (req.body.status === 'publish' || req.body.status === 'published' || req.body.status === 'active') {
        req.body.status = 'pending';
      }
    }

    const validationErrors = {};
    if (title !== undefined) {
      if (!title || !title.trim()) {
        validationErrors.title = 'Job post title cannot be empty.';
      } else if (title.trim().length < 3) {
        validationErrors.title = 'Job title must be at least 3 characters long.';
      }
    }

    if (req.body.post !== undefined || req.body.postName !== undefined) {
      const postVal = req.body.post || req.body.postName;
      if (!postVal || !String(postVal).trim()) {
        validationErrors.postName = 'Job Post Name (Name of Exam) cannot be empty.';
      }
    }

    if (req.body.vacancies !== undefined || req.body.posts !== undefined || req.body.total_posts !== undefined) {
      const vacanciesVal = req.body.vacancies || req.body.posts || req.body.total_posts;
      if (!vacanciesVal || !String(vacanciesVal).trim()) {
        validationErrors.vacancies = 'Number of Vacancies cannot be empty.';
      }
    }

    if (req.body.app_ends !== undefined || req.body.appEndDate !== undefined || req.body.dates?.last_date !== undefined) {
      const appEnd = req.body.app_ends || req.body.appEndDate || req.body.dates?.last_date;
      if (!appEnd || !String(appEnd).trim()) {
        validationErrors.appEndDate = 'Last Date of Application cannot be empty.';
      }
    }

    if (req.body.app_link !== undefined || req.body.appUrl !== undefined || req.body.links?.down_url !== undefined) {
      const appLink = req.body.app_link || req.body.appUrl || req.body.links?.down_url;
      if (!appLink || !String(appLink).trim()) {
        validationErrors.appUrl = 'Job Application URL cannot be empty.';
      }
    }

    if (req.body.eligibility !== undefined) {
      const strippedElig = (req.body.eligibility || '').replace(/<[^>]*>/g, '').trim();
      if (!req.body.eligibility || !req.body.eligibility.trim() || strippedElig === '') {
        validationErrors.eligibility = 'Eligibility Criteria cannot be empty.';
      }
    }

    if (req.body.application_fee !== undefined || req.body.fees !== undefined) {
      const fee = req.body.application_fee || req.body.fees?.fee_mode || (typeof req.body.fees === 'string' ? req.body.fees : '');
      const strippedFee = (fee || '').replace(/<[^>]*>/g, '').trim();
      if (!fee || !String(fee).trim() || strippedFee === '') {
        validationErrors.applicationFee = 'Application Fee details cannot be empty.';
      }
    }

    if (req.body.pay_scale !== undefined || req.body.salary !== undefined) {
      const salary = req.body.pay_scale || req.body.salary;
      const strippedSalary = (salary || '').replace(/<[^>]*>/g, '').trim();
      if (!salary || !String(salary).trim() || strippedSalary === '') {
        validationErrors.payScale = 'Pay Scale (Salary Structure) cannot be empty.';
      }
    }

    if (req.body.description !== undefined || req.body.content !== undefined) {
      const desc = req.body.description || req.body.content;
      const strippedDesc = (desc || '').replace(/<[^>]*>/g, '').trim();
      if (!desc || !desc.trim() || strippedDesc === '') {
        validationErrors.description = 'Job Description content cannot be empty.';
      }
    }

    if (req.body.metadata?.m_title !== undefined || req.body.metaTitle !== undefined) {
      const mTitle = req.body.metadata?.m_title || req.body.metaTitle;
      if (!mTitle || !String(mTitle).trim()) {
        validationErrors.metaTitle = 'SEO Meta Title is required.';
      }
    }

    if (req.body.metadata?.m_desc !== undefined || req.body.metaDescription !== undefined) {
      const mDesc = req.body.metadata?.m_desc || req.body.metaDescription;
      if (!mDesc || !String(mDesc).trim()) {
        validationErrors.metaDescription = 'SEO Meta Description is required.';
      }
    }

    if (req.body.categories !== undefined && Array.isArray(req.body.categories) && req.body.categories.length === 0) {
      validationErrors.categories = 'Please select at least one category for this job post.';
    }

    const existingJob = await Job.findOne(isId ? { _id: req.params.id } : { slug: req.params.id });
    if (!existingJob) {
      throw new ApiError(404, 'Job post not found or has been deleted.');
    }

    if (slug !== undefined && String(slug).trim()) {
      const slugValidation = await validateUniqueSlug(Job, {
        slug,
        currentId: existingJob._id,
        modelLabel: 'job post',
        isRequired: true,
      });

      if (!slugValidation.isValid) {
        validationErrors.slug = slugValidation.error;
      } else {
        req.body.slug = slugValidation.slug;
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      throw new ApiError(400, Object.values(validationErrors)[0], validationErrors);
    }

    ['content', 'description', 'eligibility', 'fees', 'salary'].forEach((field) => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = cleanHtmlContent(req.body[field]);
      }
    });

    // Resolve ObjectId references
    if (req.body.categories !== undefined) {
      req.body.categories = await resolveCategoryIds(req.body.categories);
    }
    if (req.body.state !== undefined) {
      req.body.state = await resolveStateId(req.body.state);
    }
    if (req.body.department !== undefined || req.body.dept !== undefined) {
      req.body.department = await resolveDepartmentId(req.body.department || req.body.dept);
    }
    if (req.body.featured_media !== undefined) {
      req.body.featured_media = sanitizeObjectId(req.body.featured_media);
    }
    if (req.body.author !== undefined) {
      req.body.author = sanitizeObjectId(req.body.author);
    }

    const job = await Job.findByIdAndUpdate(
      existingJob._id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!job) {
      throw new ApiError(404, 'Job post not found or has been deleted.');
    }
    res.status(200).json({ success: true, message: 'Job updated successfully', data: job });
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { status: 'trash' }, { new: true });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.status(200).json({ success: true, message: 'Job moved to trash' });
  } catch (error) {
    next(error);
  }
};
