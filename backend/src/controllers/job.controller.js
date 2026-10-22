import mongoose from 'mongoose';
import { Job, State, Category, User, Country, Department } from '../models/index.js';
import { cleanHtmlContent } from '../utils/cleanHtml.js';
import ApiError from '../utils/apiError.js';
import { validateUniqueSlug, slugify } from '../utils/slug.js';
import {
  resolveCategoryIds,
  resolveCountryId,
  resolveStateId,
  resolveDepartmentId,
  sanitizeObjectId,
} from '../utils/resolveReferences.js';

// Helper to enrich job documents with populated taxonomy objects
const enrichJobTaxonomies = async (job) => {
  if (!job) return job;

  // 1. Resolve State by sql_id if unpopulated
  if ((!job.state || typeof job.state !== 'object' || !job.state.name) && job.state_id) {
    const stateDoc = await State.findOne({ sql_id: job.state_id }).select('name slug').lean();
    if (stateDoc) {
      job.state = stateDoc;
    }
  }

  // 2. Resolve Department by department_id or dept_id if unpopulated
  if ((!job.department || typeof job.department !== 'object' || !job.department.name) && (job.department_id || job.dept_id)) {
    const deptDoc = await Department.findOne({ sql_id: job.department_id || job.dept_id }).select('name slug').lean();
    if (deptDoc) {
      job.department = deptDoc;
      job.dept = deptDoc.name;
    }
  }

  // 3. Resolve Department from unpopulated ObjectId or string name
  if (!job.department || typeof job.department !== 'object' || !job.department.name) {
    const rawDept = job.dept || (typeof job.department === 'string' ? job.department : null);
    if (rawDept && typeof rawDept === 'string') {
      const trimmedDept = rawDept.trim();
      if (/^[0-9a-fA-F]{24}$/.test(trimmedDept)) {
        const deptDoc = await Department.findById(trimmedDept).select('name slug').lean();
        if (deptDoc) {
          job.department = deptDoc;
          job.dept = deptDoc.name;
        }
      } else if (
        trimmedDept &&
        !['none', 'null', 'undefined', 'select', '— select —', '— please choose —', '-- please choose --'].includes(
          trimmedDept.toLowerCase()
        )
      ) {
        const deptWords = trimmedDept.split(/[-_\s]+/).map((w) => w.trim()).filter(Boolean);
        const flexiblePattern =
          deptWords.length > 0
            ? deptWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\W]+')
            : '';
        const deptDoc = await Department.findOne({
          $or: [
            { name: { $regex: `^${trimmedDept.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
            { slug: trimmedDept.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') },
            ...(flexiblePattern ? [{ name: { $regex: `^${flexiblePattern}$`, $options: 'i' } }] : []),
          ],
        })
          .select('name slug')
          .lean();
        if (deptDoc) {
          job.department = deptDoc;
          job.dept = deptDoc.name;
        }
      }
    }
  } else if (job.department && typeof job.department === 'object' && job.department.name) {
    job.dept = job.department.name;
  }

  return job;
};

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

    // State Filter
    const stateParam = (req.query.state || req.query.state_id || '').trim();
    if (stateParam && stateParam !== 'all') {
      const stateConditions = [];
      if (stateParam === 'all-india' || stateParam === 'central' || stateParam === 'national') {
        stateConditions.push(
          { state: null },
          { state: { $exists: false } },
          { state_id: null },
          { state_id: 0 }
        );
      } else {
        const isObjectId = mongoose.Types.ObjectId.isValid(stateParam) && /^[0-9a-fA-F]{24}$/.test(stateParam);
        const numId = Number(stateParam);
        if (isObjectId) {
          stateConditions.push({ state: stateParam });
        }
        if (!isNaN(numId) && numId > 0) {
          stateConditions.push({ state_id: numId });
        }

        const stateDoc = await State.findOne({
          $or: [
            { slug: stateParam.toLowerCase() },
            { name: { $regex: `^${stateParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
          ],
        }).select('_id sql_id name slug');

        if (stateDoc) {
          stateConditions.push({ state: stateDoc._id });
          if (stateDoc.sql_id) stateConditions.push({ state_id: stateDoc.sql_id });
          stateConditions.push({ dept: { $regex: stateDoc.name, $options: 'i' } });
        } else {
          stateConditions.push({ dept: { $regex: stateParam, $options: 'i' } });
        }
      }

      if (stateConditions.length > 0) {
        query.$and = query.$and ? [...query.$and, { $or: stateConditions }] : [{ $or: stateConditions }];
      }
    }

    // Department Filter
    const deptParam = (req.query.department || req.query.dept || req.query.department_id || '').trim();
    if (deptParam && deptParam !== 'all') {
      const deptConditions = [];
      const isObjectId = mongoose.Types.ObjectId.isValid(deptParam) && /^[0-9a-fA-F]{24}$/.test(deptParam);
      const numId = Number(deptParam);
      if (isObjectId) {
        deptConditions.push({ department: deptParam });
      }
      if (!isNaN(numId) && numId > 0) {
        deptConditions.push({ dept_id: numId }, { department_id: numId });
      }

      const cleanDeptParam = deptParam.toLowerCase();
      const words = deptParam.split(/[-_\s]+/).map((w) => w.trim()).filter(Boolean);
      const flexiblePattern =
        words.length > 0
          ? words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\W]+')
          : '';

      const deptFindConditions = [
        { slug: cleanDeptParam },
        { name: { $regex: `^${deptParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
      ];
      if (flexiblePattern) {
        deptFindConditions.push(
          { name: { $regex: `^${flexiblePattern}$`, $options: 'i' } },
          { slug: { $regex: `^${flexiblePattern}$`, $options: 'i' } }
        );
      }

      const deptDoc = await Department.findOne({
        $or: deptFindConditions,
      }).select('_id sql_id name slug');

      if (deptDoc) {
        deptConditions.push({ department: deptDoc._id });
        if (deptDoc.sql_id) {
          deptConditions.push({ department_id: deptDoc.sql_id }, { dept_id: deptDoc.sql_id });
        }
        deptConditions.push({ dept: { $regex: deptDoc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } });

        const docWords = deptDoc.name.split(/[-_\s]+/).map((w) => w.trim()).filter(Boolean);
        if (docWords.length > 1) {
          const docFlexible = docWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\W]+');
          deptConditions.push({ dept: { $regex: docFlexible, $options: 'i' } });
        }
      }

      // Also match raw `dept` in Job collection using flexible word separators
      if (flexiblePattern) {
        deptConditions.push({ dept: { $regex: flexiblePattern, $options: 'i' } });
      }

      const cleanSearch = deptParam.replace(/[-_]+/g, ' ');
      deptConditions.push(
        { dept: { $regex: deptParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        { dept: { $regex: cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
      );

      // Match words without trailing acronym (e.g. "Haryana Staff Selection Commission" when slug is "haryana-staff-selection-commission-hssc")
      if (words.length >= 2) {
        const lastWord = words[words.length - 1];
        if (lastWord.length <= 8) {
          const withoutLast = words.slice(0, -1);
          if (withoutLast.length >= 2) {
            const withoutLastPattern = withoutLast
              .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
              .join('[\\s\\W]+');
            deptConditions.push({ dept: { $regex: withoutLastPattern, $options: 'i' } });
          }
          if (lastWord.length >= 2 && lastWord.length <= 6) {
            deptConditions.push({
              dept: {
                $regex: `(?:^|[\\s\\W(])${lastWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[\\s\\W)])`,
                $options: 'i',
              },
            });
          }
        }

        const sigWords = words.filter((w) => w.length > 2);
        if (sigWords.length >= 2) {
          deptConditions.push({
            $and: sigWords.map((w) => ({
              dept: { $regex: w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
            })),
          });
        }
      }

      if (deptConditions.length > 0) {
        query.$and = query.$and ? [...query.$and, { $or: deptConditions }] : [{ $or: deptConditions }];
      }
    }

    // Country Filter
    const countryParam = (req.query.country || req.query.country_id || '').trim();
    if (countryParam && countryParam !== 'all') {
      const countryConditions = [];
      const isObjectId = mongoose.Types.ObjectId.isValid(countryParam) && /^[0-9a-fA-F]{24}$/.test(countryParam);
      const numId = Number(countryParam);
      if (isObjectId) {
        countryConditions.push({ country: countryParam });
      }
      if (!isNaN(numId) && numId > 0) {
        countryConditions.push({ country_id: numId });
      }

      const countryDoc = await Country.findOne({
        $or: [
          { slug: countryParam.toLowerCase() },
          { code: countryParam.toUpperCase() },
          { name: { $regex: `^${countryParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
        ],
      }).select('_id sql_id slug code name');

      if (countryDoc) {
        countryConditions.push({ country: countryDoc._id });
        if (countryDoc.sql_id) countryConditions.push({ country_id: countryDoc.sql_id });
        if (countryDoc.slug === 'india' || countryDoc.code === 'IN' || countryDoc.sql_id === 1) {
          countryConditions.push({ country: null }, { country: { $exists: false } });
        }
      }

      if (countryConditions.length > 0) {
        query.$and = query.$and ? [...query.$and, { $or: countryConditions }] : [{ $or: countryConditions }];
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
        .populate('country', 'name slug code')
        .populate('state', 'name slug')
        .populate('department', 'name slug')
        .sort({ createdAt: -1, created_at: -1, _id: -1 })
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

    const formattedJobs = await Promise.all(
      jobs.map((job) => enrichJobTaxonomies(job))
    );

    res.status(200).json({
      success: true,
      count: formattedJobs.length,
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
      data: formattedJobs,
    });
  } catch (error) {
    next(error);
  }
};

export const getExpiringJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const days = req.query.days !== undefined && req.query.days !== '' ? parseInt(req.query.days, 10) : 30;
    const search = (req.query.search || req.query.keyword || '').trim();
    const stateParam = (req.query.state || req.query.state_id || '').trim();
    const countryParam = (req.query.country || req.query.country_id || '').trim();

    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
    const query = {
      status: { $nin: ['trash', 'draft'] }
    };

    let futureDateStr = null;
    if (days && days > 0) {
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + days);
      futureDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(futureDate);
      query.app_ends = { $gte: todayStr, $lte: futureDateStr, $nin: [null, '', '0000-00-00'] };
    } else {
      query.app_ends = { $gte: todayStr, $nin: [null, '', '0000-00-00'] };
    }

    if (search) {
      const searchConditions = [
        { title: { $regex: search, $options: 'i' } },
        { short_description: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { dept: { $regex: search, $options: 'i' } },
      ];
      if (query.$and) {
        query.$and.push({ $or: searchConditions });
      } else {
        query.$and = [{ $or: searchConditions }];
      }
    }

    // State Filter
    if (stateParam && stateParam !== 'all') {
      const stateConditions = [];
      if (stateParam === 'all-india' || stateParam === 'central' || stateParam === 'national') {
        stateConditions.push(
          { state: null },
          { state: { $exists: false } },
          { state_id: null },
          { state_id: 0 }
        );
      } else {
        const isObjectId = mongoose.Types.ObjectId.isValid(stateParam) && /^[0-9a-fA-F]{24}$/.test(stateParam);
        const numId = Number(stateParam);
        if (isObjectId) {
          stateConditions.push({ state: stateParam });
        }
        if (!isNaN(numId) && numId > 0) {
          stateConditions.push({ state_id: numId });
        }

        const stateDoc = await State.findOne({
          $or: [
            { slug: stateParam },
            { name: { $regex: `^${stateParam.replace(/-/g, ' ')}$`, $options: 'i' } },
            { name: { $regex: stateParam.replace(/-/g, ' '), $options: 'i' } },
          ],
        }).select('_id sql_id name');

        if (stateDoc) {
          stateConditions.push({ state: stateDoc._id });
          if (stateDoc.sql_id) stateConditions.push({ state_id: stateDoc.sql_id });
        }

        const stateRegex = new RegExp(stateParam.replace(/-/g, ' '), 'i');
        stateConditions.push({ dept: stateRegex });
      }

      if (stateConditions.length > 0) {
        if (query.$and) {
          query.$and.push({ $or: stateConditions });
        } else {
          query.$and = [{ $or: stateConditions }];
        }
      }
    }

    // Country Filter
    if (countryParam && countryParam !== 'all') {
      if (countryParam === 'india') {
        const indiaDoc = await Country.findOne({
          $or: [{ slug: 'india' }, { code: 'IN' }, { name: /^india$/i }],
        }).select('_id sql_id');
        const indiaConditions = [
          { country: null },
          { country: { $exists: false } },
          { country_id: null },
          { country_id: 0 },
        ];
        if (indiaDoc) {
          indiaConditions.push({ country: indiaDoc._id });
          if (indiaDoc.sql_id) indiaConditions.push({ country_id: indiaDoc.sql_id });
        }
        if (query.$and) {
          query.$and.push({ $or: indiaConditions });
        } else {
          query.$and = [{ $or: indiaConditions }];
        }
      } else {
        const isObjectId = mongoose.Types.ObjectId.isValid(countryParam) && /^[0-9a-fA-F]{24}$/.test(countryParam);
        const countryDoc = await Country.findOne({
          $or: [
            ...(isObjectId ? [{ _id: countryParam }] : []),
            { slug: countryParam },
            { code: countryParam.toUpperCase() },
            { name: { $regex: `^${countryParam.replace(/-/g, ' ')}$`, $options: 'i' } },
          ],
        }).select('_id sql_id');
        if (countryDoc) {
          const cConditions = [{ country: countryDoc._id }];
          if (countryDoc.sql_id) cConditions.push({ country_id: countryDoc.sql_id });
          if (query.$and) {
            query.$and.push({ $or: cConditions });
          } else {
            query.$and = [{ $or: cConditions }];
          }
        }
      }
    }

    let [jobs, total] = await Promise.all([
      Job.find(query)
        .select('title slug app_ends dates categories featured_media state country created_at short_description description author dept user_id state_id department department_id')
        .populate('author', 'name nicename image')
        .populate('featured_media', 'path file alt name')
        .populate('categories', 'name slug')
        .populate('state', 'name slug')
        .populate('country', 'name slug code')
        .populate('department', 'name slug')
        .sort({ app_ends: 1, created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Job.countDocuments(query),
    ]);

    const formattedJobs = await Promise.all(
      jobs.map(async (job) => {
        await enrichJobTaxonomies(job);
        if (job.app_ends) {
          const end = new Date(job.app_ends + 'T23:59:59+05:30');
          const diffTime = end.getTime() - now.getTime();
          job.daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }
        return job;
      })
    );

    res.status(200).json({
      success: true,
      count: formattedJobs.length,
      total,
      days: days || 30,
      startDate: todayStr,
      endDate: futureDateStr,
      page,
      pages: Math.ceil(total / limit) || 1,
      data: formattedJobs,
    });
  } catch (error) {
    next(error);
  }
};

export const getExpiringJobsCount = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(futureDate);

    const query = {
      app_ends: { $gte: todayStr, $lte: futureDateStr, $nin: [null, '', '0000-00-00'] },
      status: { $nin: ['trash', 'draft'] }
    };

    const stateParam = (req.query.state || req.query.state_id || '').trim();
    if (stateParam && stateParam !== 'all') {
      if (stateParam === 'all-india' || stateParam === 'central' || stateParam === 'national') {
        query.$or = [{ state: null }, { state: { $exists: false } }, { state_id: null }, { state_id: 0 }];
      } else {
        const isObjectId = mongoose.Types.ObjectId.isValid(stateParam) && /^[0-9a-fA-F]{24}$/.test(stateParam);
        const numId = Number(stateParam);
        const orConds = [];
        if (isObjectId) orConds.push({ state: stateParam });
        if (!isNaN(numId) && numId > 0) orConds.push({ state_id: numId });
        const stateDoc = await State.findOne({
          $or: [
            { slug: stateParam },
            { name: { $regex: `^${stateParam.replace(/-/g, ' ')}$`, $options: 'i' } }
          ]
        }).select('_id sql_id');
        if (stateDoc) {
          orConds.push({ state: stateDoc._id });
          if (stateDoc.sql_id) orConds.push({ state_id: stateDoc.sql_id });
        }
        if (orConds.length > 0) query.$or = orConds;
      }
    }

    const count = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      count,
      days,
      startDate: todayStr,
      endDate: futureDateStr
    });
  } catch (error) {
    next(error);
  }
};

export const getJobBySlug = async (req, res, next) => {
  try {
    const isId = req.params.slug.match(/^[0-9a-fA-F]{24}$/);
    const job = await Job.findOne(isId ? { _id: req.params.slug } : { slug: req.params.slug })
      .populate('author', 'name nicename email image bio website twitter facebook instagram linkedin youtube phone role')
      .populate('categories', 'name slug')
      .populate('featured_media', 'path file alt name')
      .populate('country', 'name slug code')
      .populate('state', 'name slug')
      .populate('department', 'name slug');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job notification not found' });
    }

    const jobObj = job.toObject();
    await enrichJobTaxonomies(jobObj);

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
      req.body.categories = ['Jobs'];
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
    if (req.body.country !== undefined) {
      req.body.country = await resolveCountryId(req.body.country);
    }
    if (req.body.state !== undefined) {
      req.body.state = await resolveStateId(req.body.state);
    }
    if (req.body.department !== undefined || req.body.dept !== undefined) {
      const deptRef = req.body.department !== undefined ? req.body.department : req.body.dept;
      if (!deptRef || deptRef === '— Please Choose —' || deptRef === '-- Please Choose --' || deptRef === '— Select Department —') {
        req.body.department = null;
        req.body.dept = null;
      } else {
        req.body.department = await resolveDepartmentId(deptRef);
        if (req.body.department) {
          const deptDoc = await Department.findById(req.body.department).select('name');
          if (deptDoc) {
            req.body.dept = deptDoc.name;
          }
        } else if (typeof deptRef === 'string' && !/^[0-9a-fA-F]{24}$/.test(deptRef.trim())) {
          req.body.dept = deptRef.trim();
        } else {
          req.body.dept = null;
        }
      }
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

    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').slice(0, 19);
    if (!req.body.created_at) {
      req.body.created_at = dateStr;
    }
    if (!req.body.createdAt) {
      req.body.createdAt = now;
    }
    req.body.updated_at = dateStr;
    req.body.updatedAt = now;

    const job = await Job.create(req.body);
    res.status(201).json({ success: true, message: 'Job created successfully', data: job });
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (req, res, next) => {
  try {
    const isId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    const existingJob = await Job.findOne(isId ? { _id: req.params.id } : { slug: req.params.id });
    if (!existingJob) {
      throw new ApiError(404, 'Job post not found or has been deleted.');
    }

    // Preserve the original author and user_id - NEVER allow author change on update/edit
    delete req.body.author;
    delete req.body.user_id;

    let { slug, title } = req.body;

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
      req.body.categories = ['Jobs'];
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
    if (req.body.country !== undefined) {
      req.body.country = await resolveCountryId(req.body.country);
    }
    if (req.body.state !== undefined) {
      req.body.state = await resolveStateId(req.body.state);
    }
    if (req.body.department !== undefined || req.body.dept !== undefined) {
      const deptRef = req.body.department !== undefined ? req.body.department : req.body.dept;
      if (!deptRef || deptRef === '— Please Choose —' || deptRef === '-- Please Choose --' || deptRef === '— Select Department —') {
        req.body.department = null;
        req.body.dept = null;
      } else {
        req.body.department = await resolveDepartmentId(deptRef);
        if (req.body.department) {
          const deptDoc = await Department.findById(req.body.department).select('name');
          if (deptDoc) {
            req.body.dept = deptDoc.name;
          }
        } else if (typeof deptRef === 'string' && !/^[0-9a-fA-F]{24}$/.test(deptRef.trim())) {
          req.body.dept = deptRef.trim();
        } else {
          req.body.dept = null;
        }
      }
    }
    if (req.body.featured_media !== undefined) {
      req.body.featured_media = sanitizeObjectId(req.body.featured_media);
    }

    req.body.updated_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
    req.body.updatedAt = new Date();

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
