import { AdmitCard, State, Department, User } from '../models/index.js';
import ApiError from '../utils/apiError.js';
import { cleanHtmlContent } from '../utils/cleanHtml.js';
import { validateUniqueSlug, slugify } from '../utils/slug.js';
import {
  resolveCountryId,
  resolveStateId,
  resolveDepartmentId,
  sanitizeObjectId,
} from '../utils/resolveReferences.js';

export const getAdmitCards = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const query = {};

    // Status Tab Filter
    if (req.query.status && req.query.status !== 'all') {
      if (req.query.status === 'published' || req.query.status === 'publish') {
        query.status = { $in: ['publish', 'published', 'active'] };
      } else if (req.query.status === 'draft') {
        query.status = 'draft';
      } else if (req.query.status === 'pending') {
        query.status = { $in: ['pending', 'pending_review'] };
      } else if (req.query.status === 'trash') {
        query.status = 'trash';
      } else {
        query.status = req.query.status;
      }
    } else {
      // Default: exclude trashed admit cards on 'all'
      query.status = { $ne: 'trash' };
    }

    // Search Filter
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      query.$or = [
        { title: searchRegex },
        { post: searchRegex },
        { slug: searchRegex },
        { dept: searchRegex },
        { desig: searchRegex },
      ];
    }

    // Author Scoping (Authors only see their own admit cards)
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

    const baseCountQuery = authorFilter ? { $and: [authorFilter] } : {};

    const [
      admitCards,
      total,
      allCount,
      draftCount,
      publishedCount,
      pendingCount,
      trashCount,
    ] = await Promise.all([
      AdmitCard.find(query)
        .populate('author', 'name email nicename image')
        .populate('featured_media', 'path file alt name')
        .populate('country', 'name slug code')
        .populate('state', 'name slug')
        .populate('department', 'name slug')
        .sort({ created_at: -1, sql_id: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AdmitCard.countDocuments(query),
      AdmitCard.countDocuments({ ...baseCountQuery, status: { $ne: 'trash' } }),
      AdmitCard.countDocuments({ ...baseCountQuery, status: 'draft' }),
      AdmitCard.countDocuments({ ...baseCountQuery, status: { $in: ['publish', 'published', 'active'] } }),
      AdmitCard.countDocuments({ ...baseCountQuery, status: { $in: ['pending', 'pending_review'] } }),
      AdmitCard.countDocuments({ ...baseCountQuery, status: 'trash' }),
    ]);

    res.status(200).json({
      success: true,
      count: admitCards.length,
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
      data: admitCards,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdmitCardBySlug = async (req, res, next) => {
  try {
    const isId = req.params.slug.match(/^[0-9a-fA-F]{24}$/);
    const admitCard = await AdmitCard.findOne(
      isId ? { _id: req.params.slug } : { slug: req.params.slug }
    )
      .populate('author', 'name nicename email image bio')
      .populate('featured_media', 'path file alt name')
      .populate('country', 'name slug code')
      .populate('state', 'name slug')
      .populate('department', 'name slug');

    if (!admitCard) {
      return res.status(404).json({ success: false, message: 'Admit Card post not found' });
    }

    const doc = admitCard.toObject();

    if ((!doc.state || typeof doc.state !== 'object' || !doc.state.name) && doc.state_id) {
      const stateDoc = await State.findOne({ sql_id: doc.state_id }).select('name slug');
      if (stateDoc) {
        doc.state = stateDoc;
      }
    }

    if ((!doc.department || typeof doc.department !== 'object' || !doc.department.name) && doc.department_id) {
      const deptDoc = await Department.findOne({ sql_id: doc.department_id }).select('name slug');
      if (deptDoc) {
        doc.department = deptDoc;
      }
    }

    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
};

export const createAdmitCard = async (req, res, next) => {
  try {
    const { title, post, down_url, inst_down, inst_impl } = req.body;
    let { slug } = req.body;

    const validationErrors = {};
    if (!title || !title.trim()) {
      validationErrors.title = 'Admit Card post title is required.';
    } else if (title.trim().length < 3) {
      validationErrors.title = 'Title must be at least 3 characters long.';
    }

    if (!post || !String(post).trim()) {
      validationErrors.postName = 'Job Post Name (Name of Exam) is required.';
    }

    if (!down_url || !String(down_url).trim()) {
      validationErrors.downUrl = 'Admit Card Download URL is required.';
    }

    const strippedDown = (inst_down || '').replace(/<[^>]*>/g, '').trim();
    if (!inst_down || !inst_down.trim() || strippedDown === '') {
      validationErrors.downloadInstructions = 'Download Instructions are required.';
    }

    const strippedImpl = (inst_impl || '').replace(/<[^>]*>/g, '').trim();
    if (!inst_impl || !inst_impl.trim() || strippedImpl === '') {
      validationErrors.importantInstructions = 'Important Instructions are required.';
    }

    const mTitle = req.body.metadata?.m_title || req.body.metaTitle || req.body.m_title;
    if (!mTitle || !String(mTitle).trim()) {
      validationErrors.metaTitle = 'SEO Meta Title is required.';
    }

    const mDesc = req.body.metadata?.m_desc || req.body.metaDescription || req.body.m_desc;
    if (!mDesc || !String(mDesc).trim()) {
      validationErrors.metaDescription = 'SEO Meta Description is required.';
    }

    const slugValidation = await validateUniqueSlug(AdmitCard, {
      slug,
      fallbackText: title,
      modelLabel: 'admit card post',
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

    ['description', 'inst_down', 'inst_impl'].forEach((field) => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = cleanHtmlContent(req.body[field]);
      }
    });

    // Resolve country, state and department ObjectId if strings passed
    if (req.body.country !== undefined) {
      req.body.country = await resolveCountryId(req.body.country);
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
    const actingRole =
      req.user?.role ||
      req.headers?.['x-user-role'] ||
      req.body?.role ||
      req.body?.authorRole;
    const isAuthor = actingRole === 'author' || actingRole === 'writer';

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
    } else {
      if (req.body.author) {
        req.body.author = sanitizeObjectId(req.body.author);
      } else if (req.user?._id) {
        req.body.author = req.user._id;
        req.body.user_id = req.user.sql_id || undefined;
      }
    }

    const admitCard = await AdmitCard.create(req.body);
    res.status(201).json({ success: true, message: 'Admit Card created successfully', data: admitCard });
  } catch (error) {
    next(error);
  }
};

export const updateAdmitCard = async (req, res, next) => {
  try {
    const isId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    const query = isId ? { _id: req.params.id } : { slug: req.params.id };

    const existingAdmitCard = await AdmitCard.findOne(query);
    if (!existingAdmitCard) {
      throw new ApiError(404, 'Admit Card post not found or has been deleted.');
    }

    // Preserve the original author and user_id - NEVER allow author change on update/edit
    delete req.body.author;
    delete req.body.user_id;

    // Enforce Author status restrictions only if the acting user is an author/writer
    const actingRole =
      req.user?.role ||
      req.headers?.['x-user-role'] ||
      req.body?.role ||
      req.body?.authorRole;
    const isAuthor = actingRole === 'author' || actingRole === 'writer';

    if (isAuthor) {
      if (req.body.status === 'publish' || req.body.status === 'published' || req.body.status === 'active') {
        req.body.status = 'pending';
      }
    }

    const { title, post, down_url, inst_down, inst_impl } = req.body;

    const validationErrors = {};
    if (title !== undefined) {
      if (!title || !title.trim()) {
        validationErrors.title = 'Admit Card post title cannot be empty.';
      } else if (title.trim().length < 3) {
        validationErrors.title = 'Title must be at least 3 characters long.';
      }
    }

    if (post !== undefined) {
      if (!post || !String(post).trim()) {
        validationErrors.postName = 'Job Post Name (Name of Exam) cannot be empty.';
      }
    }

    if (down_url !== undefined) {
      if (!down_url || !String(down_url).trim()) {
        validationErrors.downUrl = 'Admit Card Download URL cannot be empty.';
      }
    }

    if (inst_down !== undefined) {
      const strippedDown = (inst_down || '').replace(/<[^>]*>/g, '').trim();
      if (!inst_down || !inst_down.trim() || strippedDown === '') {
        validationErrors.downloadInstructions = 'Download Instructions cannot be empty.';
      }
    }

    if (inst_impl !== undefined) {
      const strippedImpl = (inst_impl || '').replace(/<[^>]*>/g, '').trim();
      if (!inst_impl || !inst_impl.trim() || strippedImpl === '') {
        validationErrors.importantInstructions = 'Important Instructions cannot be empty.';
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

    if (req.body.slug !== undefined && String(req.body.slug).trim()) {
      const slugValidation = await validateUniqueSlug(AdmitCard, {
        slug: req.body.slug,
        currentId: existingAdmitCard._id,
        modelLabel: 'admit card post',
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

    ['description', 'inst_down', 'inst_impl'].forEach((field) => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = cleanHtmlContent(req.body[field]);
      }
    });

    // Resolve country, state and department ObjectId if strings passed
    if (req.body.country !== undefined) {
      req.body.country = await resolveCountryId(req.body.country);
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

    const admitCard = await AdmitCard.findByIdAndUpdate(
      existingAdmitCard._id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!admitCard) {
      return res.status(404).json({ success: false, message: 'Admit Card not found' });
    }

    res.status(200).json({ success: true, message: 'Admit Card updated successfully', data: admitCard });
  } catch (error) {
    next(error);
  }
};

export const deleteAdmitCard = async (req, res, next) => {
  try {
    const isId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    const query = isId ? { _id: req.params.id } : { slug: req.params.id };

    const admitCard = await AdmitCard.findOne(query);
    if (!admitCard) {
      return res.status(404).json({ success: false, message: 'Admit Card not found' });
    }

    if (admitCard.status === 'trash') {
      await AdmitCard.findOneAndDelete(query);
      return res.status(200).json({ success: true, message: 'Admit Card permanently deleted' });
    }

    admitCard.status = 'trash';
    await admitCard.save();

    res.status(200).json({ success: true, message: 'Admit Card moved to trash', data: admitCard });
  } catch (error) {
    next(error);
  }
};
