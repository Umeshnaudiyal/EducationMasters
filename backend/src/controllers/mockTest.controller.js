import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import { MockTest, MockTestSeries, Question, MockTestAttempt, User } from '../models/index.js';
import { slugify } from '../utils/slug.js';
import { cleanHtmlContent, stripHtmlToPlainText } from '../utils/cleanHtml.js';

// Get list of tests (filtered by series, type, is_paid, status)
export const getMockTests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const seriesId = req.query.series || req.query.series_id || '';
  const search = (req.query.search || req.query.q || '').trim();
  const testType = req.query.test_type || '';
  const isPaid = req.query.is_paid;
  const status = (req.query.status || 'published').toLowerCase();

  const query = {};

  if (seriesId) {
    query.series = seriesId;
  }

  if (status === 'all') {
    // Return all
  } else if (status === 'draft') {
    query.status = { $in: ['draft', 'Draft'] };
  } else {
    query.status = { $in: ['publish', 'published', 'Published'] };
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } },
    ];
  }

  if (testType && testType !== 'all') {
    query.test_type = testType;
  }

  if (isPaid !== undefined) {
    if (isPaid === 'false' || isPaid === false || isPaid === 'free') {
      query.$or = [{ is_paid: false }, { is_free: true }];
    } else {
      query.is_paid = true;
    }
  }

  const [tests, total] = await Promise.all([
    MockTest.find(query)
      .populate('series', 'title slug image')
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MockTest.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: tests,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
  });
});

// Get single Mock Test by ID or Slug (with questions for student or admin edit)
export const getMockTestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  const query = isObjectId ? { _id: id } : { slug: id };

  const test = await MockTest.findOne(query)
    .populate('series', 'title slug image badge plans')
    .populate({
      path: 'questions',
      select: 'content options correct_answer ans_info instruction marks negative language level subject_name state_name',
    })
    .lean();

  if (!test) {
    throw new ApiError(404, 'Mock test not found');
  }

  // Calculate dynamic unique candidates who took this test
  const uniqueUsersCount = await MockTestAttempt.aggregate([
    { $match: { test: test._id } },
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
  ]);

  test.total_users = uniqueUsersCount.length;

  res.status(200).json(new ApiResponse(200, test, 'Mock test retrieved successfully'));
});

// Create Mock Test & allocate initial questions
export const createMockTest = asyncHandler(async (req, res) => {
  const {
    series,
    title,
    slug,
    test_type,
    is_paid,
    duration_minutes,
    total_marks,
    pass_marks,
    negative_marking,
    marks_per_question,
    medium,
    instructions,
    sections,
    questions,
    status,
    order,
    seo,
  } = req.body;

  const errors = {};
  if (!series) {
    errors.series = 'Parent Mock Test Series is required';
  }
  if (!title || !title.trim()) {
    errors.title = 'Test title is required';
  }

  const cleanSlug = slug ? slugify(slug) : title ? slugify(title) : '';
  if (!cleanSlug) {
    errors.slug = 'Valid test slug is required';
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, Object.values(errors)[0], errors);
  }

  // Check unique slug
  const existing = await MockTest.findOne({ slug: cleanSlug });
  if (existing) {
    throw new ApiError(409, `A test with slug "${cleanSlug}" already exists`, {
      slug: `The slug "${cleanSlug}" is already in use by another test. Please choose a different slug.`,
    });
  }

  const cleanQuestions = Array.isArray(questions) ? questions.filter(Boolean) : [];
  const cleanInstructions = cleanHtmlContent(instructions || '');
  const calculatedTotalQuestions = cleanQuestions.length;

  const newTest = await MockTest.create({
    series,
    title: title.trim(),
    slug: cleanSlug,
    test_type: test_type || 'full_length',
    is_paid: is_paid !== undefined ? Boolean(is_paid) : true,
    is_free: is_paid !== undefined ? !Boolean(is_paid) : false,
    duration_minutes: Number(duration_minutes) || 60,
    total_marks: Number(total_marks) || (calculatedTotalQuestions * (Number(marks_per_question) || 1)) || 100,
    pass_marks: Number(pass_marks) || 35,
    negative_marking: Number(negative_marking) >= 0 ? Number(negative_marking) : 0.25,
    marks_per_question: Number(marks_per_question) || 1,
    medium: medium || 'Bilingual',
    instructions: cleanInstructions,
    sections: Array.isArray(sections) ? sections : [],
    questions: cleanQuestions,
    total_questions: calculatedTotalQuestions,
    status: status || 'Published',
    order: Number(order) || 0,
    seo: {
      allow_indexing: seo?.allow_indexing !== undefined ? Boolean(seo.allow_indexing) : true,
      meta_title: stripHtmlToPlainText(seo?.meta_title || title.trim()),
      meta_keywords: stripHtmlToPlainText(seo?.meta_keywords || ''),
      meta_description: stripHtmlToPlainText(seo?.meta_description || ''),
    },
  });

  // Update question counters on parent series
  await updateSeriesCounters(series);

  res.status(201).json(new ApiResponse(201, newTest, 'Mock test created successfully'));
});

// Update Mock Test & Questions Allocation
export const updateMockTest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const test = await MockTest.findById(id);

  if (!test) {
    throw new ApiError(404, 'Mock test not found');
  }

  const {
    series,
    title,
    slug,
    test_type,
    is_paid,
    duration_minutes,
    total_marks,
    pass_marks,
    negative_marking,
    marks_per_question,
    medium,
    instructions,
    sections,
    questions,
    status,
    order,
    seo,
  } = req.body;

  const errors = {};
  if (title !== undefined && !title.trim()) {
    errors.title = 'Test title cannot be empty';
  }

  if (slug !== undefined) {
    const cleanSlug = slugify(slug);
    if (!cleanSlug) {
      errors.slug = 'Valid test slug is required';
    } else if (cleanSlug !== test.slug) {
      const existing = await MockTest.findOne({ slug: cleanSlug, _id: { $ne: test._id } });
      if (existing) {
        errors.slug = `The slug "${cleanSlug}" is already taken by another test.`;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, Object.values(errors)[0], errors);
  }

  if (series !== undefined) test.series = series;
  if (test_type !== undefined) test.test_type = test_type;
  if (is_paid !== undefined) {
    test.is_paid = Boolean(is_paid);
    test.is_free = !Boolean(is_paid);
  }
  if (duration_minutes !== undefined) test.duration_minutes = Number(duration_minutes);
  if (total_marks !== undefined) test.total_marks = Number(total_marks);
  if (pass_marks !== undefined) test.pass_marks = Number(pass_marks);
  if (negative_marking !== undefined) test.negative_marking = Number(negative_marking);
  if (marks_per_question !== undefined) test.marks_per_question = Number(marks_per_question);
  if (medium !== undefined) test.medium = medium;
  if (instructions !== undefined) test.instructions = cleanHtmlContent(instructions || '');
  if (sections !== undefined && Array.isArray(sections)) test.sections = sections;
  if (status !== undefined) test.status = status;
  if (order !== undefined) test.order = Number(order);

  if (questions !== undefined && Array.isArray(questions)) {
    test.questions = questions.filter(Boolean);
    test.total_questions = test.questions.length;
  }

  if (seo) {
    test.seo = {
      allow_indexing: seo.allow_indexing !== undefined ? Boolean(seo.allow_indexing) : test.seo?.allow_indexing ?? true,
      meta_title: seo.meta_title !== undefined ? stripHtmlToPlainText(seo.meta_title) : test.seo?.meta_title ?? '',
      meta_keywords: seo.meta_keywords !== undefined ? stripHtmlToPlainText(seo.meta_keywords) : test.seo?.meta_keywords ?? '',
      meta_description: seo.meta_description !== undefined ? stripHtmlToPlainText(seo.meta_description) : test.seo?.meta_description ?? '',
    };
  }

  await test.save();

  // Update parent series counters
  if (test.series) {
    await updateSeriesCounters(test.series);
  }

  res.status(200).json(new ApiResponse(200, test, 'Mock test updated successfully'));
});

// Delete Mock Test
export const deleteMockTest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const test = await MockTest.findById(id);

  if (!test) {
    throw new ApiError(404, 'Mock test not found');
  }

  const seriesId = test.series;
  await MockTest.findByIdAndDelete(id);

  if (seriesId) {
    await updateSeriesCounters(seriesId);
  }

  res.status(200).json(new ApiResponse(200, null, 'Mock test deleted successfully'));
});

// Batch Allocate Questions to a Test
export const allocateQuestionsToTest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { question_ids, action } = req.body; // action: 'add' | 'remove' | 'replace'

  if (!Array.isArray(question_ids)) {
    throw new ApiError(400, 'question_ids must be an array');
  }

  const test = await MockTest.findById(id);
  if (!test) {
    throw new ApiError(404, 'Mock test not found');
  }

  if (action === 'replace') {
    test.questions = question_ids;
  } else if (action === 'remove') {
    test.questions = test.questions.filter((qId) => !question_ids.map(String).includes(String(qId)));
  } else {
    // Add unique
    const existingSet = new Set(test.questions.map(String));
    question_ids.forEach((qId) => {
      if (!existingSet.has(String(qId))) {
        test.questions.push(qId);
      }
    });
  }

  test.total_questions = test.questions.length;
  await test.save();

  if (test.series) {
    await updateSeriesCounters(test.series);
  }

  res.status(200).json(
    new ApiResponse(
      200,
      { total_questions: test.total_questions, questions: test.questions },
      'Questions allocated successfully'
    )
  );
});

// Student Test Submission & Instant Evaluation Engine
export const submitTestAttempt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { responses, time_spent_seconds, user_name, user_email, attempted_language } = req.body;

  const test = await MockTest.findById(id).populate('questions').lean();
  if (!test) {
    throw new ApiError(404, 'Mock test not found');
  }

  // Filter questions based on student's attempted language session if applicable
  const attemptedLangClean = (attempted_language || '').toLowerCase().trim();
  let relevantQuestions = test.questions || [];

  if (attemptedLangClean && attemptedLangClean !== 'all' && attemptedLangClean !== 'bilingual') {
    const langFiltered = relevantQuestions.filter(
      (q) => (q.language || '').toLowerCase() === attemptedLangClean
    );
    if (langFiltered.length > 0) {
      relevantQuestions = langFiltered;
    }
  }

  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalUnattempted = 0;
  let totalMarked = 0;
  let score = 0;

  const marksPerQ =
    typeof test.marks_per_question === 'number' && test.marks_per_question > 0
      ? test.marks_per_question
      : Number(test.marks_per_question) > 0
      ? Number(test.marks_per_question)
      : 1;
  const negativeMark =
    typeof test.negative_marking === 'number' && test.negative_marking >= 0
      ? test.negative_marking
      : Number(test.negative_marking) >= 0
      ? Number(test.negative_marking)
      : 0;

  const responseMap = new Map();
  if (Array.isArray(responses)) {
    responses.forEach((r) => {
      responseMap.set(String(r.question_id), r);
    });
  }

  const evaluatedResponses = relevantQuestions.map((q) => {
    const userResp = responseMap.get(String(q._id)) || {};
    const selectedIndex = userResp.selected_option_index;
    const isMarked = Boolean(userResp.is_marked_for_review);
    if (isMarked) totalMarked++;

    // Find correct index
    let correctIndex = -1;
    if (Array.isArray(q.options)) {
      correctIndex = q.options.findIndex((opt) => opt.is_correct || opt.text === q.correct_answer);
    }

    if (selectedIndex === null || selectedIndex === undefined || selectedIndex === -1) {
      totalUnattempted++;
      return {
        question_id: q._id,
        selected_option_index: null,
        correct_option_index: correctIndex,
        is_correct: false,
        is_attempted: false,
        is_marked_for_review: isMarked,
        marks_awarded: 0,
        explanation: q.ans_info || '',
      };
    }

    const isCorrect = Number(selectedIndex) === Number(correctIndex);
    if (isCorrect) {
      totalCorrect++;
      score += marksPerQ;
    } else {
      totalIncorrect++;
      if (negativeMark > 0) {
        score -= negativeMark;
      }
    }

    return {
      question_id: q._id,
      selected_option_index: selectedIndex,
      correct_option_index: correctIndex,
      is_correct: isCorrect,
      is_attempted: true,
      is_marked_for_review: isMarked,
      marks_awarded: isCorrect ? marksPerQ : negativeMark > 0 ? -negativeMark : 0,
      explanation: q.ans_info || '',
    };
  });

  const totalQuestions = relevantQuestions.length || 1;
  const maxPossibleScore =
    relevantQuestions.length < (test.questions || []).length
      ? relevantQuestions.length * marksPerQ
      : test.total_marks || relevantQuestions.length * marksPerQ || 100;

  const totalAttempted = totalCorrect + totalIncorrect;
  const accuracy = totalAttempted > 0 ? Number(((totalCorrect / totalAttempted) * 100).toFixed(1)) : 0;
  const percentage = Number(((Math.max(0, score) / maxPossibleScore) * 100).toFixed(1));

  // If user_email is provided but req.user is missing, try resolving user
  let linkedUserId = req.user?._id || null;
  let finalUserName = user_name || req.user?.name || 'Guest Student';
  let finalUserEmail = (user_email || req.user?.email || '').toLowerCase().trim();

  if (!linkedUserId && finalUserEmail) {
    try {
      const existingUser = await User.findOne({ email: finalUserEmail }).select('_id name email').lean();
      if (existingUser) {
        linkedUserId = existingUser._id;
        if (!user_name && existingUser.name) finalUserName = existingUser.name;
      }
    } catch (e) {}
  }

  // Calculate user rank in real-time
  const higherScoresCount = await MockTestAttempt.countDocuments({
    test: test._id,
    status: 'completed',
    score: { $gt: Number(score.toFixed(2)) },
  });
  const currentRank = higherScoresCount + 1;
  const totalAttemptsCount = (await MockTestAttempt.countDocuments({ test: test._id, status: 'completed' })) + 1;

  // Save attempt
  const attempt = await MockTestAttempt.create({
    user: linkedUserId,
    user_name: finalUserName,
    user_email: finalUserEmail,
    test: test._id,
    series: test.series,
    language: attempted_language || test.medium || 'Bilingual',
    total_questions: totalQuestions,
    total_attempted: totalAttempted,
    total_correct: totalCorrect,
    total_incorrect: totalIncorrect,
    total_unattempted: totalUnattempted,
    total_marked_for_review: totalMarked,
    score: Number(score.toFixed(2)),
    max_score: maxPossibleScore,
    percentage,
    accuracy,
    time_spent_seconds: Number(time_spent_seconds) || 0,
    rank: currentRank,
    total_participants: Math.max(totalAttemptsCount, 1),
    status: 'completed',
    completed_at: new Date(),
    responses: evaluatedResponses,
  });

  // Increment attempt counter on test
  await MockTest.findByIdAndUpdate(id, { $inc: { total_attempts: 1 } });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        attempt_id: attempt._id,
        score: attempt.score,
        max_score: attempt.max_score,
        accuracy: attempt.accuracy,
        percentage: attempt.percentage,
        total_questions: attempt.total_questions,
        total_correct: attempt.total_correct,
        total_incorrect: attempt.total_incorrect,
        total_unattempted: attempt.total_unattempted,
        time_spent_seconds: attempt.time_spent_seconds,
        rank: currentRank,
        total_participants: totalAttemptsCount,
        responses: evaluatedResponses,
      },
      'Test submitted and evaluated successfully'
    )
  );
});

// Fetch all mock test attempts for the current user to display "Attempted" status and scores
export const getUserAttempts = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.query.userId || req.query.user_id;
  const email = (req.user?.email || req.query.email || '').toLowerCase().trim();
  const seriesId = req.query.series || req.query.series_id;

  if (!userId && !email) {
    return res.status(200).json(
      new ApiResponse(200, { attempts: [], attemptMap: {}, total_attempted_tests: 0 }, 'No user provided')
    );
  }

  const orConditions = [];
  if (userId) orConditions.push({ user: userId });
  if (email) orConditions.push({ user_email: email });

  const query = {
    status: 'completed',
    $or: orConditions,
  };

  if (seriesId) {
    query.series = seriesId;
  }

  const attempts = await MockTestAttempt.find(query)
    .sort({ score: -1, completed_at: -1 })
    .lean();

  // Create lookup map of test_id -> user's best attempt details
  const attemptMap = {};
  attempts.forEach((att) => {
    const testKey = String(att.test);
    if (!attemptMap[testKey]) {
      attemptMap[testKey] = {
        has_attempted: true,
        attempt_id: att._id,
        test_id: att.test,
        series_id: att.series,
        best_score: att.score,
        max_score: att.max_score,
        accuracy: att.accuracy,
        percentage: att.percentage,
        time_spent_seconds: att.time_spent_seconds,
        completed_at: att.completed_at,
        total_questions: att.total_questions,
        total_correct: att.total_correct,
        total_incorrect: att.total_incorrect,
        total_unattempted: att.total_unattempted,
        rank: att.rank || 1,
      };
    } else if (att.score > attemptMap[testKey].best_score) {
      attemptMap[testKey].best_score = att.score;
      attemptMap[testKey].accuracy = att.accuracy;
      attemptMap[testKey].percentage = att.percentage;
      attemptMap[testKey].attempt_id = att._id;
      attemptMap[testKey].completed_at = att.completed_at;
    }
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        attempts,
        attemptMap,
        total_attempted_tests: Object.keys(attemptMap).length,
      },
      'User attempts fetched successfully'
    )
  );
});

// Single Mock Test Leaderboard (Top Rankers with realistic benchmarks)
export const getTestLeaderboard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id || req.query.userId || req.query.user_id;
  const userEmail = (req.user?.email || req.query.email || '').toLowerCase().trim();
  const langQuery = (req.query.language || req.query.medium || '').toLowerCase().trim();

  // Find test by ID or slug
  let test;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    test = await MockTest.findById(id).populate('questions').lean();
  } else {
    test = await MockTest.findOne({ slug: id }).populate('questions').lean();
  }

  if (!test) {
    throw new ApiError(404, 'Mock test not found');
  }

  // Fetch all completed attempts for this test
  const queryFilter = {
    test: test._id,
    status: 'completed',
  };

  if (langQuery && langQuery !== 'all' && langQuery !== 'bilingual') {
    queryFilter.language = new RegExp(`^${langQuery}$`, 'i');
  }

  const attempts = await MockTestAttempt.find(queryFilter)
    .sort({ score: -1, time_spent_seconds: 1, completed_at: 1 })
    .populate('user', 'name email avatar image')
    .lean();

  // Deduplicate by user so top scores per unique student are ranked
  const userBestMap = new Map();
  attempts.forEach((att) => {
    const key = att.user?._id ? String(att.user._id) : (att.user_email ? att.user_email.toLowerCase() : att.user_name);
    if (!userBestMap.has(key)) {
      userBestMap.set(key, att);
    }
  });

  // Determine realistic max marks for this test/section
  let actualMaxScore = test.total_marks || 100;
  if (attempts.length > 0 && attempts[0].max_score) {
    actualMaxScore = attempts[0].max_score;
  } else if (Array.isArray(test.questions) && test.questions.length > 0) {
    const marksPerQ = Number(test.marks_per_question) || 1;
    let qCount = test.questions.length;
    if (langQuery && langQuery !== 'all') {
      const filteredQs = test.questions.filter((q) => (q.language || '').toLowerCase() === langQuery);
      if (filteredQs.length > 0) qCount = filteredQs.length;
    } else {
      const hindiQs = test.questions.filter((q) => (q.language || '').toLowerCase() === 'hindi');
      const englishQs = test.questions.filter((q) => (q.language || '').toLowerCase() === 'english');
      if (hindiQs.length > 0 && englishQs.length > 0) {
        qCount = Math.max(hindiQs.length, englishQs.length);
      }
    }
    actualMaxScore = qCount * marksPerQ;
  }

  let rankedList = Array.from(userBestMap.values()).map((att, index) => {
    return {
      rank: index + 1,
      attempt_id: att._id,
      user_id: att.user?._id || null,
      user_name: att.user?.name || att.user_name || 'Student Aspirant',
      user_email: att.user?.email || att.user_email || '',
      avatar: att.user?.avatar || att.user?.image || '',
      language: att.language || test.medium || 'English',
      score: att.score,
      max_score: att.max_score || actualMaxScore,
      accuracy: att.accuracy,
      percentage: att.percentage,
      time_spent_seconds: att.time_spent_seconds,
      completed_at: att.completed_at,
      is_current_user:
        Boolean(userId && att.user?._id && String(att.user._id) === String(userId)) ||
        Boolean(userEmail && att.user_email && att.user_email.toLowerCase() === userEmail),
    };
  });

  rankedList.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  // Find user's specific rank
  let userRank = rankedList.find((r) => r.is_current_user) || null;

  const totalParticipants = Math.max(rankedList.length, test.total_attempts || 0, 1);
  const highestScore = rankedList.length > 0 ? rankedList[0].score : actualMaxScore;
  const avgAccuracy = rankedList.length > 0
    ? Number((rankedList.reduce((acc, cur) => acc + (cur.accuracy || 0), 0) / rankedList.length).toFixed(1))
    : 0;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        test: {
          _id: test._id,
          title: test.title,
          slug: test.slug,
          total_marks: actualMaxScore,
          duration_minutes: test.duration_minutes,
        },
        stats: {
          total_participants: totalParticipants,
          highest_score: highestScore,
          average_accuracy: avgAccuracy,
          max_score: actualMaxScore,
        },
        leaderboard: rankedList.slice(0, 50),
        total_participants: totalParticipants,
        user_rank: userRank,
      },
      'Leaderboard fetched successfully'
    )
  );
});

// Test Series Overall Leaderboard
export const getSeriesLeaderboard = asyncHandler(async (req, res) => {
  const { seriesId } = req.params;
  const userId = req.user?._id || req.query.userId || req.query.user_id;
  const userEmail = (req.user?.email || req.query.email || '').toLowerCase().trim();

  let series;
  if (seriesId.match(/^[0-9a-fA-F]{24}$/)) {
    series = await MockTestSeries.findById(seriesId).lean();
  } else {
    series = await MockTestSeries.findOne({ slug: seriesId }).lean();
  }

  if (!series) {
    throw new ApiError(404, 'Test series not found');
  }

  // Aggregate user attempts across this series
  const aggregatedAttempts = await MockTestAttempt.aggregate([
    { $match: { series: series._id, status: 'completed' } },
    {
      $group: {
        _id: { $ifNull: ['$user', '$user_email'] },
        user_id: { $first: '$user' },
        user_name: { $first: '$user_name' },
        user_email: { $first: '$user_email' },
        total_score: { $sum: '$score' },
        avg_accuracy: { $avg: '$accuracy' },
        tests_attempted: { $sum: 1 },
        total_time_spent: { $sum: '$time_spent_seconds' },
        latest_completed: { $max: '$completed_at' },
      },
    },
    { $sort: { total_score: -1, avg_accuracy: -1, total_time_spent: 1 } },
    { $limit: 50 },
  ]);

  const userIds = aggregatedAttempts.map((a) => a.user_id).filter(Boolean);
  const users = await User.find({ _id: { $in: userIds } }).select('name email avatar image').lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  let rankings = aggregatedAttempts.map((item, idx) => {
    const u = item.user_id ? userMap.get(String(item.user_id)) : null;
    return {
      rank: idx + 1,
      user_id: item.user_id || null,
      user_name: u?.name || item.user_name || 'Student Aspirant',
      user_email: u?.email || item.user_email || '',
      avatar: u?.avatar || u?.image || '',
      total_score: Number(item.total_score.toFixed(1)),
      avg_accuracy: Number(item.avg_accuracy.toFixed(1)),
      tests_attempted: item.tests_attempted,
      total_time_spent: item.total_time_spent,
      latest_completed: item.latest_completed,
      is_current_user:
        Boolean(userId && item.user_id && String(item.user_id) === String(userId)) ||
        Boolean(userEmail && item.user_email && item.user_email.toLowerCase() === userEmail),
    };
  });

  rankings.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  let userRank = rankings.find((r) => r.is_current_user) || null;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        series: {
          _id: series._id,
          title: series.title,
          slug: series.slug,
          total_tests: series.total_tests,
        },
        leaderboard: rankings.slice(0, 50),
        total_participants: Math.max(rankings.length, 1),
        user_rank: userRank,
      },
      'Series leaderboard fetched successfully'
    )
  );
});

// Global Mock Tests Leaderboard (All-India Toppers across entire platform)
export const getGlobalLeaderboard = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.query.userId || req.query.user_id;
  const userEmail = (req.user?.email || req.query.email || '').toLowerCase().trim();
  const { seriesId, period, language } = req.query;

  const matchQuery = { status: 'completed' };

  if (seriesId && seriesId !== 'all') {
    if (seriesId.match(/^[0-9a-fA-F]{24}$/)) {
      matchQuery.series = new mongoose.Types.ObjectId(seriesId);
    }
  }

  if (language && language !== 'all') {
    matchQuery.language = new RegExp(`^${language}$`, 'i');
  }

  if (period === 'today') {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    matchQuery.completed_at = { $gte: startOfToday };
  } else if (period === 'week') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    matchQuery.completed_at = { $gte: weekAgo };
  } else if (period === 'month') {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    matchQuery.completed_at = { $gte: monthAgo };
  }

  // Aggregate user attempts across the platform
  const aggregated = await MockTestAttempt.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { $ifNull: ['$user', '$user_email'] },
        user_id: { $first: '$user' },
        user_name: { $first: '$user_name' },
        user_email: { $first: '$user_email' },
        total_score: { $sum: '$score' },
        avg_accuracy: { $avg: '$accuracy' },
        tests_attempted: { $sum: 1 },
        total_time_spent: { $sum: '$time_spent_seconds' },
        latest_completed: { $max: '$completed_at' },
        best_single_score: { $max: '$score' },
      },
    },
    { $sort: { total_score: -1, avg_accuracy: -1, tests_attempted: -1 } },
    { $limit: 100 },
  ]);

  const userIds = aggregated.map((a) => a.user_id).filter(Boolean);
  const users = await User.find({ _id: { $in: userIds } }).select('name email avatar image').lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  let rankings = aggregated.map((item, idx) => {
    const u = item.user_id ? userMap.get(String(item.user_id)) : null;
    return {
      rank: idx + 1,
      user_id: item.user_id || null,
      user_name: u?.name || item.user_name || 'Student Aspirant',
      user_email: u?.email || item.user_email || '',
      avatar: u?.avatar || u?.image || '',
      total_score: Number(item.total_score.toFixed(1)),
      avg_accuracy: Number(item.avg_accuracy.toFixed(1)),
      tests_attempted: item.tests_attempted,
      total_time_spent: item.total_time_spent,
      best_single_score: item.best_single_score,
      latest_completed: item.latest_completed,
      is_current_user:
        Boolean(userId && item.user_id && String(item.user_id) === String(userId)) ||
        Boolean(userEmail && item.user_email && item.user_email.toLowerCase() === userEmail),
    };
  });

  rankings.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  let userRank = rankings.find((r) => r.is_current_user) || null;

  // Fetch all active series for the filter dropdown
  const allSeries = await MockTestSeries.find({ status: { $in: ['publish', 'published', 'Published'] } })
    .select('_id title slug total_tests image category_name')
    .sort({ total_tests: -1 })
    .limit(30)
    .lean();

  const totalParticipants = Math.max(rankings.length, 1);
  const highestScore = rankings.length > 0 ? rankings[0].total_score : 0;
  const avgAcc = rankings.length > 0
    ? Number((rankings.reduce((acc, cur) => acc + (cur.avg_accuracy || 0), 0) / rankings.length).toFixed(1))
    : 0;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        stats: {
          total_participants: totalParticipants,
          highest_score: highestScore,
          average_accuracy: avgAcc,
        },
        leaderboard: rankings.slice(0, 50),
        total_participants: totalParticipants,
        user_rank: userRank,
        series_list: allSeries,
      },
      'Global leaderboard fetched successfully'
    )
  );
});

// Helper to update total_tests and free_tests on MockTestSeries
async function updateSeriesCounters(seriesId) {
  try {
    const [totalTests, freeTests, allTests] = await Promise.all([
      MockTest.countDocuments({ series: seriesId, status: { $in: ['publish', 'published', 'Published'] } }),
      MockTest.countDocuments({
        series: seriesId,
        $or: [{ is_paid: false }, { is_free: true }],
        status: { $in: ['publish', 'published', 'Published'] },
      }),
      MockTest.find({ series: seriesId }).select('questions').lean(),
    ]);

    const totalQuestions = allTests.reduce((acc, t) => acc + (t.questions?.length || 0), 0);

    await MockTestSeries.findByIdAndUpdate(seriesId, {
      total_tests: totalTests,
      free_tests_count: freeTests,
      total_questions: totalQuestions,
    });
  } catch (err) {
    console.error('Error updating series counters:', err);
  }
}
