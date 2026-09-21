import { Result, User, Media, State, Department, Category } from '../models/index.js';
import ApiError from '../utils/apiError.js';
import { cleanHtmlContent } from '../utils/cleanHtml.js';
import { validateUniqueSlug, slugify } from '../utils/slug.js';
import {
  resolveCategoryIds,
  resolveStateId,
  resolveDepartmentId,
  sanitizeObjectId,
} from '../utils/resolveReferences.js';

export const getResults = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const query = {};

    // Status Filter
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
      // Default: exclude trashed results on 'all'
      query.status = { $ne: 'trash' };
    }

    // Search Filter
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search.trim(), $options: 'i' };
      query.$or = [
        { title: searchRegex },
        { post: searchRegex },
        { slug: searchRegex },
        { dept: searchRegex },
        { desig: searchRegex },
      ];
    }

    // Author Scoping (Authors only see their own results)
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
      results,
      total,
      allCount,
      draftCount,
      publishedCount,
      pendingCount,
      trashCount,
    ] = await Promise.all([
      Result.find(query)
        .populate('author', 'name email nicename image')
        .populate('featured_media', 'path file alt name')
        .populate('state', 'name slug')
        .populate('department', 'name slug')
        .sort({ created_at: -1, sql_id: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Result.countDocuments(query),
      Result.countDocuments({ ...baseCountQuery, status: { $ne: 'trash' } }),
      Result.countDocuments({ ...baseCountQuery, status: 'draft' }),
      Result.countDocuments({ ...baseCountQuery, status: { $in: ['publish', 'published', 'active'] } }),
      Result.countDocuments({ ...baseCountQuery, status: { $in: ['pending', 'pending_review'] } }),
      Result.countDocuments({ ...baseCountQuery, status: 'trash' }),
    ]);

    res.status(200).json({
      success: true,
      count: results.length,
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
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

export const getResultBySlug = async (req, res, next) => {
  try {
    const isId = req.params.slug.match(/^[0-9a-fA-F]{24}$/);
    const resultDoc = await Result.findOne(
      isId ? { _id: req.params.slug } : { slug: req.params.slug }
    )
      .populate('author', 'name nicename email image bio')
      .populate('featured_media', 'path file alt name')
      .populate('state', 'name slug')
      .populate('department', 'name slug')
      .populate('categories', 'name slug');

    if (!resultDoc) {
      return res.status(404).json({ success: false, message: 'Result post not found' });
    }

    const doc = resultDoc.toObject();

    if ((!doc.state || typeof doc.state !== 'object' || !doc.state.name) && doc.state_id) {
      const stateDoc = await State.findOne({ sql_id: doc.state_id }).select('name slug');
      if (stateDoc) doc.state = stateDoc;
    }

    if ((!doc.department || typeof doc.department !== 'object' || !doc.department.name) && doc.department_id) {
      const deptDoc = await Department.findOne({ sql_id: doc.department_id }).select('name slug');
      if (deptDoc) doc.department = deptDoc;
    }

    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
};

export const createResult = async (req, res, next) => {
  try {
    const { title, post, down_url, inst_down, inst_impl } = req.body;
    let { slug } = req.body;

    const validationErrors = {};
    if (!title || !title.trim()) {
      validationErrors.title = 'Result post title is required.';
    } else if (title.trim().length < 3) {
      validationErrors.title = 'Title must be at least 3 characters long.';
    }

    const postVal = post || req.body.postName;
    if (!postVal || !String(postVal).trim()) {
      validationErrors.postName = 'Job Post Name (Name of Exam) is required.';
    }

    const downUrlVal = down_url || req.body.downUrl || req.body.result_url;
    if (!downUrlVal || !String(downUrlVal).trim()) {
      validationErrors.downUrl = 'Result Download URL is required.';
    }

    const strippedDown = (inst_down || req.body.downloadInstructions || '').replace(/<[^>]*>/g, '').trim();
    if (!strippedDown) {
      validationErrors.downloadInstructions = 'Download Instructions are required.';
    }

    const strippedImpl = (inst_impl || req.body.importantInstructions || '').replace(/<[^>]*>/g, '').trim();
    if (!strippedImpl) {
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

    const slugValidation = await validateUniqueSlug(Result, {
      slug,
      fallbackText: title,
      modelLabel: 'result post',
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

    ['description', 'inst_down', 'inst_impl', 'faq_content'].forEach((field) => {
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

    const resultDoc = await Result.create(req.body);
    res.status(201).json({ success: true, message: 'Result created successfully', data: resultDoc });
  } catch (error) {
    next(error);
  }
};

export const updateResult = async (req, res, next) => {
  try {
    const isId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    const query = isId ? { _id: req.params.id } : { slug: req.params.id };

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

    const { title, post, down_url, inst_down, inst_impl } = req.body;

    const validationErrors = {};
    if (title !== undefined) {
      if (!title || !title.trim()) {
        validationErrors.title = 'Result post title cannot be empty.';
      } else if (title.trim().length < 3) {
        validationErrors.title = 'Title must be at least 3 characters long.';
      }
    }

    if (post !== undefined || req.body.postName !== undefined) {
      const postVal = post || req.body.postName;
      if (!postVal || !String(postVal).trim()) {
        validationErrors.postName = 'Job Post Name (Name of Exam) cannot be empty.';
      }
    }

    if (down_url !== undefined || req.body.downUrl !== undefined) {
      const downUrlVal = down_url || req.body.downUrl;
      if (!downUrlVal || !String(downUrlVal).trim()) {
        validationErrors.downUrl = 'Result Download URL cannot be empty.';
      }
    }

    if (inst_down !== undefined || req.body.downloadInstructions !== undefined) {
      const strippedDown = (inst_down || req.body.downloadInstructions || '').replace(/<[^>]*>/g, '').trim();
      if (!strippedDown) {
        validationErrors.downloadInstructions = 'Download Instructions cannot be empty.';
      }
    }

    if (inst_impl !== undefined || req.body.importantInstructions !== undefined) {
      const strippedImpl = (inst_impl || req.body.importantInstructions || '').replace(/<[^>]*>/g, '').trim();
      if (!strippedImpl) {
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

    const existingResult = await Result.findOne(query);
    if (!existingResult) {
      return res.status(404).json({ success: false, message: 'Result post not found or has been deleted.' });
    }

    if (req.body.slug !== undefined && String(req.body.slug).trim()) {
      const slugValidation = await validateUniqueSlug(Result, {
        slug: req.body.slug,
        currentId: existingResult._id,
        modelLabel: 'result post',
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

    ['description', 'inst_down', 'inst_impl', 'faq_content'].forEach((field) => {
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

    const resultDoc = await Result.findByIdAndUpdate(existingResult._id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!resultDoc) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    res.status(200).json({ success: true, message: 'Result updated successfully', data: resultDoc });
  } catch (error) {
    next(error);
  }
};

export const deleteResult = async (req, res, next) => {
  try {
    const isId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    const query = isId ? { _id: req.params.id } : { slug: req.params.id };

    const resultDoc = await Result.findOne(query);
    if (!resultDoc) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    if (resultDoc.status === 'trash') {
      await Result.findOneAndDelete(query);
      return res.status(200).json({ success: true, message: 'Result permanently deleted' });
    }

    resultDoc.status = 'trash';
    await resultDoc.save();

    res.status(200).json({ success: true, message: 'Result moved to trash', data: resultDoc });
  } catch (error) {
    next(error);
  }
};
