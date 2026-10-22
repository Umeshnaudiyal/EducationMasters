import { Job, Blog, Result, AdmitCard, Category, Department, Institute } from '../models/index.js';

const SITE_URL = 'https://educationmasters.in';

export const STATIC_PAGES = [
  // Exact pages from user reference screenshot
  { path: 'departments/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'expiring-jobs/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'privacy-policy/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'terms-of-service/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'editorial-policy/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'admit-cards/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'results/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'categories/', priority: '0.5', changefreq: 'monthly', lastmod: '2022-08-10T10:55:00+00:00' },
  { path: 'subjects/', priority: '0.5', changefreq: 'monthly', lastmod: '2022-08-10T10:55:00+00:00' },
  { path: 'blogs/', priority: '0.5', changefreq: 'monthly', lastmod: '2022-08-10T10:55:00+00:00' },
  { path: 'institutes/', priority: '0.5', changefreq: 'monthly', lastmod: '2022-08-10T10:55:00+00:00' },
  { path: 'author/', priority: '0.5', changefreq: 'monthly', lastmod: '2022-08-10T10:55:00+00:00' },
  { path: 'contact-us/', priority: '0.5', changefreq: 'monthly', lastmod: '2022-08-10T10:55:00+00:00' },
  { path: 'disclaimer/', priority: '0.5', changefreq: 'monthly', lastmod: '2022-08-10T10:55:00+00:00' },
  { path: 'refer-and-earn/', priority: '0.5', changefreq: 'monthly', lastmod: '2022-08-10T10:55:00+00:00' },
  { path: 'about-us/', priority: '0.5', changefreq: 'monthly', lastmod: '2022-08-17T08:03:00+00:00' },
  { path: 'jobs/', priority: '0.5', changefreq: 'monthly', lastmod: '2022-08-17T12:18:00+00:00' },
  { path: 'home/', priority: '0.5', changefreq: 'monthly', lastmod: '2022-09-14T18:30:00+00:00' },

  // Additional active website pages ("and add others too")
  { path: '', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'jobs-expiring-in-30-days/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'syllabus/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'mock-tests/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'mock-test/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'mcq-questions/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'typing-test/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'leaderboard/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'authors/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'articles/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'article/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'terms-and-conditions/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'dmca/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'education/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'state/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'admit-card/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'result/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'category/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'department/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
  { path: 'search/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-10-13T10:39:00+00:00' },
];

function formatIso(date) {
  if (!date) return new Date().toISOString();
  try {
    const d = new Date(date);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function resolveMediaUrl(doc) {
  if (!doc) return null;
  if (doc.image && typeof doc.image === 'string' && doc.image.trim()) {
    const img = doc.image.trim();
    if (img.startsWith('http')) return img;
    return `${SITE_URL}${img.startsWith('/') ? '' : '/'}${img}`;
  }
  if (doc.featured_media && typeof doc.featured_media === 'object') {
    const file = doc.featured_media.file;
    if (file && typeof file === 'string') {
      if (file.startsWith('http')) return file;
      return `${SITE_URL}${file.startsWith('/') ? '' : '/'}${file}`;
    }
  }
  if (doc.logo && typeof doc.logo === 'string') {
    const l = doc.logo.trim();
    if (l.startsWith('http')) return l;
    return `${SITE_URL}${l.startsWith('/') ? '' : '/'}${l}`;
  }
  return null;
}

export const getSitemapIndexData = async (req, res, next) => {
  try {
    const [
      jobsCount,
      latestJob,
      blogsCount,
      latestBlog,
      categoriesCount,
      latestCategory,
      institutesCount,
      latestInstitute,
      departmentsCount,
      latestDepartment,
      resultsCount,
      latestResult,
      admitCardsCount,
      latestAdmitCard,
    ] = await Promise.all([
      Job.countDocuments({ status: { $ne: 'trash' }, slug: { $exists: true, $ne: '' } }),
      Job.findOne({ status: { $ne: 'trash' } }).sort({ updatedAt: -1, created_at: -1 }).select('updatedAt created_at').lean(),
      Blog.countDocuments({ status: { $ne: 'trash' }, slug: { $exists: true, $ne: '' } }),
      Blog.findOne({ status: { $ne: 'trash' } }).sort({ updatedAt: -1, created_at: -1 }).select('updatedAt created_at').lean(),
      Category.countDocuments({ status: { $ne: 'trash' }, slug: { $exists: true, $ne: '' } }),
      Category.findOne({ status: { $ne: 'trash' } }).sort({ updatedAt: -1 }).select('updatedAt').lean(),
      Institute.countDocuments({ status: { $ne: 'trash' }, slug: { $exists: true, $ne: '' } }),
      Institute.findOne({ status: { $ne: 'trash' } }).sort({ updatedAt: -1 }).select('updatedAt').lean(),
      Department.countDocuments({ status: { $ne: 'trash' }, slug: { $exists: true, $ne: '' } }),
      Department.findOne({ status: { $ne: 'trash' } }).sort({ updatedAt: -1 }).select('updatedAt').lean(),
      Result.countDocuments({ status: { $ne: 'trash' }, slug: { $exists: true, $ne: '' } }),
      Result.findOne({ status: { $ne: 'trash' } }).sort({ updatedAt: -1 }).select('updatedAt').lean(),
      AdmitCard.countDocuments({ status: { $ne: 'trash' }, slug: { $exists: true, $ne: '' } }),
      AdmitCard.findOne({ status: { $ne: 'trash' } }).sort({ updatedAt: -1 }).select('updatedAt').lean(),
    ]);

    const sitemaps = [];

    // 1. Jobs Sitemaps (1000 per sitemap)
    const jobPages = Math.max(1, Math.ceil(jobsCount / 1000));
    for (let i = 1; i <= jobPages; i++) {
      const name = i === 1 ? 'jobs-sitemap.xml' : `jobs-sitemap${i}.xml`;
      const count = i < jobPages ? 1000 : (jobsCount % 1000 || 1000);
      sitemaps.push({
        name,
        loc: `${SITE_URL}/${name}/`,
        count,
        lastmod: formatIso(latestJob?.updatedAt || latestJob?.created_at),
      });
    }

    // 2. Blogs Sitemaps (1000 per sitemap)
    const blogPages = Math.max(1, Math.ceil(blogsCount / 1000));
    for (let i = 1; i <= blogPages; i++) {
      const name = i === 1 ? 'blogs-sitemap.xml' : `blogs-sitemap${i}.xml`;
      const count = i < blogPages ? 1000 : (blogsCount % 1000 || 1000);
      sitemaps.push({
        name,
        loc: `${SITE_URL}/${name}/`,
        count,
        lastmod: formatIso(latestBlog?.updatedAt || latestBlog?.created_at),
      });
    }

    // 3. Pages Sitemap
    sitemaps.push({
      name: 'pages-sitemap.xml',
      loc: `${SITE_URL}/pages-sitemap.xml/`,
      count: STATIC_PAGES.length,
      lastmod: STATIC_PAGES[0]?.lastmod || '2026-10-13T10:39:00+00:00',
    });

    // 4. Categories Sitemap
    sitemaps.push({
      name: 'categories-sitemap.xml',
      loc: `${SITE_URL}/categories-sitemap.xml/`,
      count: categoriesCount,
      lastmod: formatIso(latestCategory?.updatedAt || '2022-10-11T10:14:00+00:00'),
    });

    // 5. Institutes Sitemap
    sitemaps.push({
      name: 'institutes-sitemap.xml',
      loc: `${SITE_URL}/institutes-sitemap.xml/`,
      count: institutesCount,
      lastmod: formatIso(latestInstitute?.updatedAt || '2022-10-21T12:00:02+00:00'),
    });

    // 6. Departments Sitemap
    sitemaps.push({
      name: 'departments-sitemap.xml',
      loc: `${SITE_URL}/departments-sitemap.xml/`,
      count: departmentsCount,
      lastmod: formatIso(latestDepartment?.updatedAt || '2025-10-08T18:34:06+00:00'),
    });

    // 7. Results Sitemap
    if (resultsCount > 0) {
      sitemaps.push({
        name: 'results-sitemap.xml',
        loc: `${SITE_URL}/results-sitemap.xml/`,
        count: resultsCount,
        lastmod: formatIso(latestResult?.updatedAt),
      });
    }

    // 8. Admit Cards Sitemap
    if (admitCardsCount > 0) {
      sitemaps.push({
        name: 'admit-cards-sitemap.xml',
        loc: `${SITE_URL}/admit-cards-sitemap.xml/`,
        count: admitCardsCount,
        lastmod: formatIso(latestAdmitCard?.updatedAt),
      });
    }

    res.status(200).json({
      success: true,
      totalSitemaps: sitemaps.length,
      generatedAt: new Date().toISOString(),
      sitemaps,
    });
  } catch (error) {
    next(error);
  }
};

export const getSitemapUrlsData = async (req, res, next) => {
  try {
    const { type } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit, 10) || 1000));
    const skip = (page - 1) * limit;

    let urls = [];
    let total = 0;

    switch (type) {
      case 'jobs': {
        const query = { status: { $ne: 'trash' }, slug: { $exists: true, $ne: '' } };
        const [docs, count] = await Promise.all([
          Job.find(query)
            .select('slug updatedAt created_at createdAt featured_media image')
            .populate('featured_media', 'file path')
            .sort({ _id: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          Job.countDocuments(query),
        ]);
        total = count;
        urls = docs.map((doc) => {
          const media = resolveMediaUrl(doc);
          return {
            loc: `${SITE_URL}/job/${doc.slug}/`,
            lastmod: formatIso(doc.updatedAt || doc.created_at || doc.createdAt),
            changefreq: 'daily',
            priority: '0.9',
            images: media ? [media] : [],
          };
        });
        break;
      }

      case 'blogs': {
        const query = { status: { $ne: 'trash' }, slug: { $exists: true, $ne: '' } };
        const [docs, count] = await Promise.all([
          Blog.find(query)
            .select('slug updatedAt created_at createdAt featured_media image')
            .populate('featured_media', 'file path')
            .sort({ _id: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          Blog.countDocuments(query),
        ]);
        total = count;
        urls = docs.map((doc) => {
          const media = resolveMediaUrl(doc);
          return {
            loc: `${SITE_URL}/${doc.slug}/`,
            lastmod: formatIso(doc.updatedAt || doc.created_at || doc.createdAt),
            changefreq: 'daily',
            priority: '0.8',
            images: media ? [media] : [],
          };
        });
        break;
      }

      case 'pages': {
        const paginatedPages = STATIC_PAGES.slice(skip, skip + limit);
        total = STATIC_PAGES.length;
        urls = paginatedPages.map((p) => ({
          loc: p.path ? `${SITE_URL}/${p.path}` : `${SITE_URL}/`,
          lastmod: p.lastmod,
          changefreq: p.changefreq,
          priority: p.priority,
          images: [],
        }));
        break;
      }

      case 'categories': {
        const query = { status: { $ne: 'trash' }, slug: { $exists: true, $ne: '' } };
        const [docs, count] = await Promise.all([
          Category.find(query).select('slug updatedAt createdAt').sort({ _id: 1 }).skip(skip).limit(limit).lean(),
          Category.countDocuments(query),
        ]);
        total = count;
        urls = docs.map((doc) => ({
          loc: `${SITE_URL}/category/${doc.slug}/`,
          lastmod: formatIso(doc.updatedAt || doc.createdAt || '2022-10-11T10:14:00+00:00'),
          changefreq: 'weekly',
          priority: '0.7',
          images: [],
        }));
        break;
      }

      case 'institutes': {
        const query = { status: { $ne: 'trash' }, slug: { $exists: true, $ne: '' } };
        const [docs, count] = await Promise.all([
          Institute.find(query)
            .select('slug logo featured_image updatedAt')
            .sort({ _id: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          Institute.countDocuments(query),
        ]);
        total = count;
        urls = docs.map((doc) => {
          const media = resolveMediaUrl(doc);
          return {
            loc: `${SITE_URL}/institute/${doc.slug}/`,
            lastmod: formatIso(doc.updatedAt || '2022-10-21T12:00:02+00:00'),
            changefreq: 'monthly',
            priority: '0.6',
            images: media ? [media] : [],
          };
        });
        break;
      }

      case 'departments': {
        const query = { status: { $ne: 'trash' }, slug: { $exists: true, $ne: '' } };
        const [docs, count] = await Promise.all([
          Department.find(query).select('slug updatedAt').sort({ _id: 1 }).skip(skip).limit(limit).lean(),
          Department.countDocuments(query),
        ]);
        total = count;
        urls = docs.map((doc) => ({
          loc: `${SITE_URL}/department/${doc.slug}/`,
          lastmod: formatIso(doc.updatedAt || '2025-10-08T18:34:06+00:00'),
          changefreq: 'weekly',
          priority: '0.7',
          images: [],
        }));
        break;
      }

      case 'results': {
        const query = { status: { $ne: 'trash' }, slug: { $exists: true, $ne: '' } };
        const [docs, count] = await Promise.all([
          Result.find(query)
            .select('slug updatedAt featured_media image')
            .populate('featured_media', 'file path')
            .sort({ _id: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          Result.countDocuments(query),
        ]);
        total = count;
        urls = docs.map((doc) => {
          const media = resolveMediaUrl(doc);
          return {
            loc: `${SITE_URL}/result/${doc.slug}/`,
            lastmod: formatIso(doc.updatedAt),
            changefreq: 'daily',
            priority: '0.8',
            images: media ? [media] : [],
          };
        });
        break;
      }

      case 'admit-cards':
      case 'admitcards': {
        const query = { status: { $ne: 'trash' }, slug: { $exists: true, $ne: '' } };
        const [docs, count] = await Promise.all([
          AdmitCard.find(query)
            .select('slug updatedAt featured_media image')
            .populate('featured_media', 'file path')
            .sort({ _id: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          AdmitCard.countDocuments(query),
        ]);
        total = count;
        urls = docs.map((doc) => {
          const media = resolveMediaUrl(doc);
          return {
            loc: `${SITE_URL}/admit-card/${doc.slug}/`,
            lastmod: formatIso(doc.updatedAt),
            changefreq: 'daily',
            priority: '0.8',
            images: media ? [media] : [],
          };
        });
        break;
      }

      default:
        return res.status(404).json({ success: false, message: `Unknown sitemap type: ${type}` });
    }

    res.status(200).json({
      success: true,
      type,
      page,
      limit,
      total,
      urls,
    });
  } catch (error) {
    next(error);
  }
};
