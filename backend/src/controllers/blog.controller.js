import { Blog, Job, Category, User } from '../models/index.js';
import { cleanHtmlContent } from '../utils/cleanHtml.js';
import ApiError from '../utils/apiError.js';
import { validateUniqueSlug, slugify } from '../utils/slug.js';
import {
  resolveCategoryIds,
  resolveTagIds,
  resolveStateId,
  sanitizeObjectId,
} from '../utils/resolveReferences.js';

export const getBlogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const type = req.query.type || '';
    const category = req.query.category || req.query.cat || '';

    const query = { title: { $exists: true, $ne: '' } };
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Author Scoping (Authors only see their own blogs)
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

    // Filter status handling: Exclude trash from 'all', only show trash when explicitly requested
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
      // Default: exclude trashed blogs from 'all' query
      query.status = { $ne: 'trash' };
    }

    const targetFilter = (category || type || '').toLowerCase().trim();

    // Special handler for Results & Admit Cards (combines Jobs & Blogs)
    if (['result', 'results', 'admit-card', 'admit', 'admit-cards'].includes(targetFilter)) {
      const isResult = targetFilter.includes('result');
      const catSearch = isResult ? /result/i : /admit/i;
      const titleRegex = isResult ? /result|answer key|merit|cutoff|scorecard/i : /admit|hall ticket|call letter/i;

      const matchingCats = await Category.find({
        $or: [{ slug: catSearch }, { name: catSearch }]
      }).lean();
      const catIds = matchingCats.map(c => c._id);

      const jobQuery = {
        status: { $in: ['active', 'publish', 'published'] },
        $or: isResult ? [
          { categories: { $in: catIds } },
          { 'resultNotification.down_url': { $type: 'string', $ne: '' } },
          { 'dates.result_date': { $type: 'string', $ne: '' } },
          { title: titleRegex }
        ] : [
          { categories: { $in: catIds } },
          { 'admitCardNotification.down_url': { $type: 'string', $ne: '' } },
          { 'dates.admit_date': { $type: 'string', $ne: '' } },
          { title: titleRegex }
        ]
      };

      const blogQuery = {
        status: { $in: ['publish', 'published', 'active'] },
        $or: [
          { categories: { $in: catIds } },
          { title: titleRegex }
        ]
      };

      const [jobs, blogs] = await Promise.all([
        Job.find(jobQuery)
          .populate('author', 'name nicename email image bio')
          .populate('categories', 'name slug')
          .populate('featured_media', 'path file alt name')
          .lean(),
        Blog.find(blogQuery)
          .populate('author', 'name nicename email image bio')
          .populate('categories', 'name slug')
          .populate('tags', 'name slug')
          .populate('featured_media', 'path file alt name')
          .lean()
      ]);

      const combined = [...jobs, ...blogs].sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
        const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      const paginated = combined.slice(skip, skip + limit);

      return res.status(200).json({
        success: true,
        count: paginated.length,
        total: combined.length,
        page,
        pages: Math.ceil(combined.length / limit),
        data: paginated,
      });
    }

    if (targetFilter) {
      // General article/articles filter should list all published articles in chronological order
      if (!['article', 'articles', 'all'].includes(targetFilter)) {
        const CATEGORY_MAP = {
          'current-affair': 'current|affair|samayik',
          'current-affairs': 'current|affair|samayik',
          'syllabus': 'syllabus|exam pattern|pathyakram',
          'gk': 'gk|general knowledge|samanya gyan',
          'general-knowledge': 'gk|general knowledge|samanya gyan',
          'defence': 'defence|army|navy|air force|nda|cds|agniveer',
          'biography': 'biography|jeewan parichay|katha|story',
          'railway': 'railway|rrb|rrc',
          'bank': 'bank|sbi|ibps|rbi',
          'ssc': 'ssc|cgl|chsl|cpo|mts|gd',
          'upsc': 'upsc|ias|ips|civil services',
          'funzone': 'fact|interesting|paheliyan|funzone',
          'tips': 'tip|guide|strategy|preparation|exam tips',
          'exam-tips': 'tip|guide|strategy|preparation|exam tips',
        };

        const regexPattern = CATEGORY_MAP[targetFilter] || targetFilter.replace(/-/g, ' ');
        query.title = { $regex: regexPattern, $options: 'i' };
      }
    }

    const baseCountQuery = authorFilter ? { $and: [authorFilter] } : {};

    const [blogs, total, allCount, draftCount, publishedCount, pendingCount, trashCount] = await Promise.all([
      Blog.find(query)
        .populate('author', 'name nicename email image bio')
        .populate('categories', 'name slug')
        .populate('tags', 'name slug')
        .populate('featured_media')
        .sort({ created_at: -1, sql_id: -1 })
        .skip(skip)
        .limit(limit),
      Blog.countDocuments(query),
      Blog.countDocuments({ ...baseCountQuery, status: { $ne: 'trash' } }),
      Blog.countDocuments({ ...baseCountQuery, status: 'draft' }),
      Blog.countDocuments({ ...baseCountQuery, status: { $in: ['publish', 'published', 'active'] } }),
      Blog.countDocuments({ ...baseCountQuery, status: { $in: ['pending', 'pending_review'] } }),
      Blog.countDocuments({ ...baseCountQuery, status: 'trash' }),
    ]);

    res.status(200).json({
      success: true,
      count: blogs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      statusCounts: {
        all: allCount,
        draft: draftCount,
        published: publishedCount,
        pending: pendingCount,
        trash: trashCount,
      },
      data: blogs,
    });
  } catch (error) {
    next(error);
  }
};

export const getBlogBySlug = async (req, res, next) => {
  try {
    const isId = req.params.slug.match(/^[0-9a-fA-F]{24}$/);
    const blog = await Blog.findOne(isId ? { _id: req.params.slug } : { slug: req.params.slug })
      .populate('author', 'name nicename email image bio')
      .populate('categories', 'name slug description')
      .populate('tags', 'name slug')
      .populate('featured_media', 'path file alt caption');

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    next(error);
  }
};

export const createBlog = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    let { slug } = req.body;

    const validationErrors = {};
    if (!title || !title.trim()) {
      validationErrors.title = 'Blog post title is required.';
    } else if (title.trim().length < 3) {
      validationErrors.title = 'Blog title must be at least 3 characters long.';
    }

    const strippedContent = (content || '').replace(/<[^>]*>/g, '').trim();
    if (!content || !content.trim() || strippedContent === '') {
      validationErrors.content = 'Article content is required. Please write your article content.';
    }

    const mTitle = req.body.metadata?.m_title || req.body.metaTitle || req.body.m_title;
    if (!mTitle || !String(mTitle).trim()) {
      validationErrors.metaTitle = 'SEO Meta Title is required.';
    }

    const mDesc = req.body.metadata?.m_desc || req.body.metaDescription || req.body.m_desc;
    if (!mDesc || !String(mDesc).trim()) {
      validationErrors.metaDescription = 'SEO Meta Description is required.';
    }

    if (req.body.categories && Array.isArray(req.body.categories) && req.body.categories.length === 0) {
      validationErrors.categories = 'Please select at least one category for this post.';
    }

    const slugValidation = await validateUniqueSlug(Blog, {
      slug,
      fallbackText: title,
      modelLabel: 'article',
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

    if (req.body.content && typeof req.body.content === 'string') {
      req.body.content = cleanHtmlContent(req.body.content);
    }

    // Resolve ObjectId references
    if (req.body.categories !== undefined) {
      req.body.categories = await resolveCategoryIds(req.body.categories);
    }
    if (req.body.tags !== undefined) {
      req.body.tags = await resolveTagIds(req.body.tags);
    }
    if (req.body.state !== undefined) {
      req.body.state = await resolveStateId(req.body.state);
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

    const blog = await Blog.create(req.body);
    res.status(201).json({ success: true, message: 'Blog created successfully', data: blog });
  } catch (error) {
    next(error);
  }
};

export const updateBlog = async (req, res, next) => {
  try {
    const isId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    const existingBlog = await Blog.findOne(isId ? { _id: req.params.id } : { slug: req.params.id });
    if (!existingBlog) {
      throw new ApiError(404, 'Blog post not found or has been deleted.');
    }

    // Preserve the original author and user_id - NEVER allow author change on update/edit
    delete req.body.author;
    delete req.body.user_id;

    let { slug, title, content } = req.body;

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

    const validationErrors = {};
    if (title !== undefined) {
      if (!title || !title.trim()) {
        validationErrors.title = 'Blog post title cannot be empty.';
      } else if (title.trim().length < 3) {
        validationErrors.title = 'Blog title must be at least 3 characters long.';
      }
    }

    if (content !== undefined) {
      const strippedContent = (content || '').replace(/<[^>]*>/g, '').trim();
      if (!content || !content.trim() || strippedContent === '') {
        validationErrors.content = 'Article content cannot be empty.';
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
      validationErrors.categories = 'Please select at least one category for this post.';
    }

    if (slug !== undefined && String(slug).trim()) {
      const slugValidation = await validateUniqueSlug(Blog, {
        slug,
        currentId: existingBlog._id,
        modelLabel: 'article',
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

    if (req.body.content && typeof req.body.content === 'string') {
      req.body.content = cleanHtmlContent(req.body.content);
    }

    // Resolve ObjectId references
    if (req.body.categories !== undefined) {
      req.body.categories = await resolveCategoryIds(req.body.categories);
    }
    if (req.body.tags !== undefined) {
      req.body.tags = await resolveTagIds(req.body.tags);
    }
    if (req.body.state !== undefined) {
      req.body.state = await resolveStateId(req.body.state);
    }
    if (req.body.featured_media !== undefined) {
      req.body.featured_media = sanitizeObjectId(req.body.featured_media);
    }

    const blog = await Blog.findByIdAndUpdate(
      existingBlog._id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!blog) {
      throw new ApiError(404, 'Blog post not found or has been deleted.');
    }
    res.status(200).json({ success: true, message: 'Blog updated successfully', data: blog });
  } catch (error) {
    next(error);
  }
};

export const deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, { status: 'trash' }, { new: true });
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }
    res.status(200).json({ success: true, message: 'Blog moved to trash' });
  } catch (error) {
    next(error);
  }
};

