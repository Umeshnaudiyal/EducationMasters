import { Blog, Job, Question, Institute, Category, User, Media, State, District, Country, Advert, Subscriber } from '../models/index.js';

export const getBriefStats = async (req, res, next) => {
  try {
    const [
      blogCount,
      jobCount,
      questionCount,
      instituteCount,
      categoryCount,
      userCount,
      mediaCount,
      stateCount,
      districtCount,
      countryCount,
      advertCount,
      subscriberCount,
    ] = await Promise.all([
      Blog.countDocuments(),
      Job.countDocuments(),
      Question.countDocuments(),
      Institute.countDocuments(),
      Category.countDocuments(),
      User.countDocuments(),
      Media.countDocuments(),
      State.countDocuments(),
      District.countDocuments(),
      Country.countDocuments(),
      Advert.countDocuments(),
      Subscriber.countDocuments(),
    ]);

    // Sample recent items with populated references
    const recentBlogs = await Blog.find()
      .select('title slug createdAt author categories featured_media')
      .populate('author', 'name email')
      .populate('categories', 'name slug')
      .populate('featured_media', 'path file alt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentJobs = await Job.find()
      .select('title slug status posts dept state categories')
      .populate('state', 'name slug')
      .populate('categories', 'name slug')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentInstitutes = await Institute.find()
      .select('name slug city state district logo cover')
      .populate('state', 'name')
      .populate('district', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      summary: {
        total_blogs: blogCount,
        total_jobs: jobCount,
        total_questions: questionCount,
        total_institutes: instituteCount,
        total_categories: categoryCount,
        total_users: userCount,
        total_media: mediaCount,
        total_states: stateCount,
        total_districts: districtCount,
        total_countries: countryCount,
        total_adverts: advertCount,
        total_subscribers: subscriberCount,
      },
      samples: {
        recent_blogs: recentBlogs,
        recent_jobs: recentJobs,
        recent_institutes: recentInstitutes,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      blogCount,
      jobCount,
      questionCount,
      instituteCount,
      userCount,
      mediaCount,
      categoryCount,
    ] = await Promise.all([
      Blog.countDocuments(),
      Job.countDocuments(),
      Question.countDocuments(),
      Institute.countDocuments(),
      User.countDocuments(),
      Media.countDocuments(),
      Category.countDocuments(),
    ]);

    // Sample posts activity for the chart (Mo to Su)
    const chartData = [
      { day: 'Mo', jobs: 5, blogs: 4 },
      { day: 'Tu', jobs: 28, blogs: 19 },
      { day: 'We', jobs: 16, blogs: 12 },
      { day: 'Th', jobs: 23, blogs: 14 },
      { day: 'Fr', jobs: 8, blogs: 17 },
      { day: 'Sa', jobs: 13, blogs: 9 },
      { day: 'Su', jobs: 15, blogs: 7 },
    ];

    const recentBlogs = await Blog.find()
      .select('title slug status created_at author')
      .populate('author', 'name email')
      .sort({ created_at: -1, _id: -1 })
      .limit(6)
      .lean();

    const recentJobs = await Job.find()
      .select('title slug status created_at dept state')
      .populate('state', 'name')
      .sort({ created_at: -1, _id: -1 })
      .limit(6)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        cards: {
          jobs: { total: jobCount, change: '+7% from last week' },
          blogs: { total: blogCount, change: '+0% from last week' },
          mcqs: { total: questionCount, change: '+0% from last week' },
          users: { total: userCount, change: '+3% from last week' },
          institutes: { total: instituteCount, change: '+5% from last week' },
          media: { total: mediaCount },
          categories: { total: categoryCount },
        },
        chart: chartData,
        system: {
          platform: 'Education Masters Admin Hub',
          version: '9.52.21',
          runtime: 'Node.js & Next.js 16',
          commentsCount: '00.00',
          sharesCount: '00.00',
        },
        recentBlogs,
        recentJobs,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCacheStats = async (req, res, next) => {
  try {
    const memoryCache = (await import('../services/cache.service.js')).default;
    res.status(200).json({
      success: true,
      data: memoryCache.getStats()
    });
  } catch (error) {
    next(error);
  }
};

export const clearCacheEndpoint = async (req, res, next) => {
  try {
    const memoryCache = (await import('../services/cache.service.js')).default;
    const { pattern } = req.body || {};
    let deletedCount = 0;

    if (pattern) {
      deletedCount = memoryCache.invalidatePattern(pattern);
    } else {
      deletedCount = memoryCache.store.size;
      memoryCache.clear();
    }

    res.status(200).json({
      success: true,
      message: pattern ? `Purged cache keys matching "${pattern}"` : 'All in-memory cache successfully cleared',
      deletedCount
    });
  } catch (error) {
    next(error);
  }
};

