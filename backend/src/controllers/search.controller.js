import { Job, AdmitCard, Result, Blog, Question } from '../models/index.js';

/**
 * Intelligent Multi-Entity Global Search Controller
 * Performs weighted semantic token relevance scoring across Jobs, Admit Cards, Results, Blogs, and MCQs
 */
export const globalSearch = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const rawQuery = (req.query.q || req.query.search || req.query.query || '').trim();
    const typeFilter = (req.query.type || 'all').toLowerCase(); // 'all', 'job', 'admit-card', 'result', 'blog', 'mcq'
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const isSuggestion = req.query.suggestion === 'true' || req.query.autocomplete === 'true';

    if (!rawQuery) {
      return res.status(200).json({
        success: true,
        query: '',
        total: 0,
        page,
        pages: 0,
        tookMs: Date.now() - startTime,
        counts: { all: 0, jobs: 0, 'admit-cards': 0, results: 0, blogs: 0, mcqs: 0 },
        data: [],
      });
    }

    const queryClean = rawQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const tokens = rawQuery.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    const regexContains = new RegExp(queryClean, 'i');

    // Scoring helper function
    const calculateScore = (title = '', post = '', dept = '', desig = '', desc = '', createdAt = null) => {
      let score = 0;
      const lowerTitle = String(title || '').toLowerCase();
      const lowerPost = String(post || '').toLowerCase();
      const lowerDept = String(dept || '').toLowerCase();
      const lowerDesig = String(desig || '').toLowerCase();
      const lowerDesc = String(desc || '').toLowerCase();
      const lowerQ = rawQuery.toLowerCase();

      // 1. Exact matches
      if (lowerTitle === lowerQ) score += 100;
      else if (lowerPost === lowerQ) score += 95;
      else if (lowerTitle.startsWith(lowerQ)) score += 80;
      else if (lowerTitle.includes(lowerQ)) score += 65;

      // 2. Department & Designation matches
      if (lowerDept.includes(lowerQ)) score += 45;
      if (lowerDesig.includes(lowerQ)) score += 40;
      if (lowerPost.includes(lowerQ)) score += 40;

      // 3. Token intersections
      if (tokens.length > 1) {
        let allTokensInTitle = true;
        let tokenMatchCount = 0;

        for (const token of tokens) {
          if (lowerTitle.includes(token)) {
            tokenMatchCount++;
          } else {
            allTokensInTitle = false;
          }
        }

        if (allTokensInTitle) score += 50;
        else score += tokenMatchCount * 12;

        // Check tokens across whole doc
        const fullDocText = `${lowerTitle} ${lowerPost} ${lowerDept} ${lowerDesig}`;
        let docTokenCount = 0;
        for (const token of tokens) {
          if (fullDocText.includes(token)) docTokenCount++;
        }
        score += docTokenCount * 8;
      }

      // 4. Description match
      if (lowerDesc.includes(lowerQ)) score += 15;

      // 5. Freshness bonus (up to 10 points for posts within last 60 days)
      if (createdAt) {
        try {
          const ageDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
          if (ageDays < 30) score += 10;
          else if (ageDays < 90) score += 5;
        } catch (e) {}
      }

      return score;
    };

    // Helper to build $or search query for each model
    const buildSearchQuery = (fields) => {
      const conditions = [];
      fields.forEach(field => {
        conditions.push({ [field]: regexContains });
        tokens.forEach(tok => {
          conditions.push({ [field]: { $regex: tok.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), $options: 'i' } });
        });
      });
      return { status: { $in: ['publish', 'published', 'active', null] }, $or: conditions };
    };

    // Perform queries concurrently across models
    const fetchPromises = [];

    // Jobs
    if (typeFilter === 'all' || typeFilter === 'job' || typeFilter === 'jobs') {
      fetchPromises.push(
        Job.find(buildSearchQuery(['title', 'posts', 'dept', 'desig', 'qualification', 'job_location']))
          .populate('featured_media', 'path file alt name')
          .select('title slug posts dept desig salary app_ends dates job_location qualification created_at featured_media description')
          .limit(isSuggestion ? 8 : 40)
          .lean()
          .then(docs => docs.map(doc => {
            const score = calculateScore(doc.title, doc.posts, doc.dept, doc.desig, doc.description, doc.created_at);
            return {
              id: doc._id,
              type: 'job',
              typeLabel: 'Job Alert',
              title: doc.title || 'Government Job Vacancy',
              slug: doc.slug,
              url: `/job/${doc.slug || doc._id}`,
              department: doc.dept || 'Government Dept',
              subtitle: String(doc.desig || doc.posts || 'Recruitment 2026'),
              description: doc.description || '',
              badge: 'Job',
              badgeColor: '#2563eb', // Blue
              date: doc.app_ends || doc.dates?.last_date || doc.created_at,
              metaText: doc.app_ends ? `Last Date: ${doc.app_ends}` : (doc.job_location ? `Location: ${doc.job_location}` : 'Apply Online'),
              featured_media: doc.featured_media,
              score,
            };
          }))
          .catch(err => {
            console.error('Job search error:', err);
            return [];
          })
      );
    } else {
      fetchPromises.push(Promise.resolve([]));
    }

    // Results
    if (typeFilter === 'all' || typeFilter === 'result' || typeFilter === 'results') {
      fetchPromises.push(
        Result.find(buildSearchQuery(['title', 'post', 'dept', 'desig', 'description']))
          .populate('featured_media', 'path file alt name')
          .select('title slug post dept desig result_status exam_date created_at featured_media description')
          .limit(isSuggestion ? 8 : 40)
          .lean()
          .then(docs => docs.map(doc => {
            const score = calculateScore(doc.title, doc.post, doc.dept, doc.desig, doc.description, doc.created_at);
            return {
              id: doc._id,
              type: 'result',
              typeLabel: 'Result Out',
              title: doc.title || 'Examination Result',
              slug: doc.slug,
              url: `/result/${doc.slug || doc._id}`,
              department: doc.dept || 'Examination Authority',
              subtitle: String(doc.post || doc.desig || 'Declared Result & Scorecard'),
              description: doc.description || '',
              badge: 'Result',
              badgeColor: '#059669', // Emerald
              date: doc.exam_date || doc.created_at,
              metaText: doc.result_status || 'Declared / Out',
              featured_media: doc.featured_media,
              score: score + 5, // slight boost for result searches
            };
          }))
          .catch(err => {
            console.error('Result search error:', err);
            return [];
          })
      );
    } else {
      fetchPromises.push(Promise.resolve([]));
    }

    // Admit Cards
    if (typeFilter === 'all' || typeFilter === 'admit-card' || typeFilter === 'admit-cards') {
      fetchPromises.push(
        AdmitCard.find(buildSearchQuery(['title', 'post', 'dept', 'desig', 'description']))
          .populate('featured_media', 'path file alt name')
          .select('title slug post dept desig exam_date created_at featured_media description')
          .limit(isSuggestion ? 8 : 40)
          .lean()
          .then(docs => docs.map(doc => {
            const score = calculateScore(doc.title, doc.post, doc.dept, doc.desig, doc.description, doc.created_at);
            return {
              id: doc._id,
              type: 'admit-card',
              typeLabel: 'Admit Card',
              title: doc.title || 'Admit Card Download',
              slug: doc.slug,
              url: `/admit-card/${doc.slug || doc._id}`,
              department: doc.dept || 'Examination Board',
              subtitle: String(doc.post || doc.desig || 'Hall Ticket Download'),
              description: doc.description || '',
              badge: 'Admit Card',
              badgeColor: '#7c3aed', // Purple
              date: doc.exam_date || doc.created_at,
              metaText: doc.exam_date ? `Exam: ${doc.exam_date}` : 'Download Available',
              featured_media: doc.featured_media,
              score,
            };
          }))
          .catch(err => {
            console.error('AdmitCard search error:', err);
            return [];
          })
      );
    } else {
      fetchPromises.push(Promise.resolve([]));
    }

    // Blogs & Articles
    if (typeFilter === 'all' || typeFilter === 'blog' || typeFilter === 'blogs' || typeFilter === 'article' || typeFilter === 'articles') {
      fetchPromises.push(
        Blog.find(buildSearchQuery(['title', 'content', 'description']))
          .populate('featured_media', 'path file alt name')
          .select('title slug description created_at featured_media')
          .limit(isSuggestion ? 6 : 30)
          .lean()
          .then(docs => docs.map(doc => {
            const score = calculateScore(doc.title, '', '', '', doc.description || doc.content, doc.created_at);
            return {
              id: doc._id,
              type: 'blog',
              typeLabel: 'Article',
              title: doc.title || 'Educational Article',
              slug: doc.slug,
              url: `/${doc.slug || doc._id}`,
              department: 'Education Masters',
              subtitle: 'Exam Preparation & Guidelines',
              description: doc.description || '',
              badge: 'Article',
              badgeColor: '#d97706', // Amber
              date: doc.created_at,
              metaText: 'Educational Guide',
              featured_media: doc.featured_media,
              score,
            };
          }))
          .catch(err => {
            console.error('Blog search error:', err);
            return [];
          })
      );
    } else {
      fetchPromises.push(Promise.resolve([]));
    }

    // MCQs & Questions
    if (typeFilter === 'all' || typeFilter === 'mcq' || typeFilter === 'mcqs' || typeFilter === 'question') {
      fetchPromises.push(
        Question.find({
          $or: [
            { question: regexContains },
            { 'topic.name': regexContains },
            { 'subject.name': regexContains }
          ]
        })
          .select('question slug subject topic created_at')
          .limit(isSuggestion ? 4 : 20)
          .lean()
          .then(docs => docs.map(doc => {
            const cleanQ = String(doc.question || '').replace(/<[^>]*>/g, '');
            const score = calculateScore(cleanQ, doc.topic?.name || '', doc.subject?.name || '', '', '', doc.created_at);
            return {
              id: doc._id,
              type: 'mcq',
              typeLabel: 'MCQ Question',
              title: cleanQ,
              slug: doc.slug,
              url: `/mcq-questions/${doc.slug || doc._id}`,
              department: doc.subject?.name || 'General Knowledge',
              subtitle: doc.topic?.name || 'Practice Quiz',
              description: cleanQ,
              badge: 'MCQ',
              badgeColor: '#4f46e5', // Indigo
              date: doc.created_at,
              metaText: doc.subject?.name ? `Subject: ${doc.subject.name}` : 'Daily Practice',
              featured_media: null,
              score,
            };
          }))
          .catch(err => {
            console.error('MCQ search error:', err);
            return [];
          })
      );
    } else {
      fetchPromises.push(Promise.resolve([]));
    }

    const [jobResults, resultResults, admitCardResults, blogResults, mcqResults] = await Promise.all(fetchPromises);

    // Combine all, filter items with score > 0, and sort by relevance score descending
    let combined = [
      ...jobResults.filter(i => i.score > 0),
      ...resultResults.filter(i => i.score > 0),
      ...admitCardResults.filter(i => i.score > 0),
      ...blogResults.filter(i => i.score > 0),
      ...mcqResults.filter(i => i.score > 0),
    ].sort((a, b) => b.score - a.score);

    // Deduplicate by ID and URL
    const seenUrls = new Set();
    combined = combined.filter(item => {
      if (seenUrls.has(item.url)) return false;
      seenUrls.add(item.url);
      return true;
    });

    const counts = {
      all: combined.length,
      jobs: combined.filter(i => i.type === 'job').length,
      results: combined.filter(i => i.type === 'result').length,
      'admit-cards': combined.filter(i => i.type === 'admit-card').length,
      blogs: combined.filter(i => i.type === 'blog').length,
      mcqs: combined.filter(i => i.type === 'mcq').length,
    };

    const total = combined.length;
    const startIndex = (page - 1) * limit;
    const paginated = isSuggestion ? combined.slice(0, limit) : combined.slice(startIndex, startIndex + limit);

    const tookMs = Date.now() - startTime;

    res.status(200).json({
      success: true,
      query: rawQuery,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      tookMs,
      counts,
      data: paginated,
    });
  } catch (error) {
    next(error);
  }
};
