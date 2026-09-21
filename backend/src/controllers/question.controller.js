import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import { Question, Subject, State, Exam } from '../models/index.js';

const validateQuestionData = (data, { isNew = false } = {}) => {
  const errors = {};

  if (isNew || data.content !== undefined) {
    const content = String(data.content || '').trim();
    if (!content) {
      errors.content = 'Question content is required';
    } else if (content.length < 3) {
      errors.content = 'Question content must be at least 3 characters long';
    }
  }

  if (isNew || data.options !== undefined) {
    if (!Array.isArray(data.options) || data.options.length < 2) {
      errors.options = 'At least 2 options are required (e.g. Option 1 and Option 2)';
    } else {
      const validOptions = data.options.filter((opt) => opt && String(opt.text || '').trim().length > 0);
      if (validOptions.length < 2) {
        errors.options = 'Please fill in at least 2 option descriptions';
      }
    }
  }

  if (isNew || data.correct_answer !== undefined || data.options !== undefined) {
    const hasCorrect =
      Boolean(data.correct_answer) ||
      (Array.isArray(data.options) && data.options.some((opt) => opt && opt.is_correct));
    if (!hasCorrect) {
      errors.correct_answer = 'Please select the correct answer option';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const getQuestions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const search = (req.query.search || req.query.q || '').trim();
  const statusFilter = (req.query.status || 'all').toLowerCase();
  const subjectFilter = req.query.subject || '';
  const stateFilter = req.query.state || '';
  const examFilter = req.query.exam || '';
  const levelFilter = req.query.level || '';
  const dateFilter = req.query.date || '';

  // Base query
  const query = {};

  // Status filtering
  if (statusFilter === 'published' || statusFilter === 'publish') {
    query.status = { $in: ['publish', 'published', 'Published'] };
  } else if (statusFilter === 'draft' || statusFilter === 'drafts') {
    query.status = { $in: ['draft', 'Draft'] };
  } else if (statusFilter === 'pending') {
    query.status = { $in: ['pending', 'Pending'] };
  } else if (statusFilter === 'trash' || statusFilter === 'trashed') {
    query.status = { $in: ['trash', 'trashed', 'Trashed'] };
  } else {
    // 'all' tab shows non-trashed questions by default, matching standard CMS/WordPress behavior
    query.status = { $nin: ['trash', 'trashed', 'Trashed'] };
  }

  // Search filter
  if (search) {
    if (!isNaN(search)) {
      query.$or = [
        { sql_id: Number(search) },
        { content: { $regex: search, $options: 'i' } },
        { 'options.text': { $regex: search, $options: 'i' } },
        { subject_name: { $regex: search, $options: 'i' } },
        { state_name: { $regex: search, $options: 'i' } },
        { author_name: { $regex: search, $options: 'i' } },
      ];
    } else {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { 'options.text': { $regex: search, $options: 'i' } },
        { subject_name: { $regex: search, $options: 'i' } },
        { state_name: { $regex: search, $options: 'i' } },
        { author_name: { $regex: search, $options: 'i' } },
      ];
    }
  }

  if (subjectFilter && subjectFilter !== 'all') {
    if (/^[0-9a-fA-F]{24}$/.test(subjectFilter)) {
      query.subject = subjectFilter;
    } else {
      query.subject_name = { $regex: subjectFilter, $options: 'i' };
    }
  }

  if (stateFilter && stateFilter !== 'all') {
    if (/^[0-9a-fA-F]{24}$/.test(stateFilter)) {
      query.state = stateFilter;
    } else {
      query.state_name = { $regex: stateFilter, $options: 'i' };
    }
  }

  if (examFilter && examFilter !== 'all') {
    if (/^[0-9a-fA-F]{24}$/.test(examFilter)) {
      query.examinations = examFilter;
    } else {
      query.examination_names = { $in: [new RegExp(examFilter, 'i')] };
    }
  }

  if (levelFilter && levelFilter !== 'all') {
    query['level.slug'] = levelFilter;
  }

  if (dateFilter) {
    // E.g. YYYY-MM
    query.createdAt = {
      $gte: new Date(`${dateFilter}-01T00:00:00.000Z`),
      $lt: new Date(`${dateFilter}-31T23:59:59.999Z`),
    };
  }

  // Get status counts for badges
  const [
    allCount,
    publishedCount,
    draftCount,
    pendingCount,
    trashCount,
    questions,
    totalFiltered,
  ] = await Promise.all([
    Question.countDocuments({ status: { $nin: ['trash', 'trashed', 'Trashed'] } }),
    Question.countDocuments({ status: { $in: ['publish', 'published', 'Published'] } }),
    Question.countDocuments({ status: { $in: ['draft', 'Draft'] } }),
    Question.countDocuments({ status: { $in: ['pending', 'Pending'] } }),
    Question.countDocuments({ status: { $in: ['trash', 'trashed', 'Trashed'] } }),
    Question.find(query)
      .populate('author', 'name email')
      .populate('subject', 'name slug')
      .populate('state', 'name slug')
      .populate('district', 'name slug')
      .populate('examinations', 'name slug')
      .sort({ sql_id: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Question.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: questions,
    counts: {
      all: allCount,
      published: publishedCount,
      draft: draftCount,
      pending: pendingCount,
      trash: trashCount,
    },
    pagination: {
      page,
      limit,
      total: totalFiltered,
      pages: Math.ceil(totalFiltered / limit) || 1,
    },
  });
});

export const getQuestionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  const query = isObjectId ? { _id: id } : { sql_id: Number(id) };

  const question = await Question.findOne(query)
    .populate('author', 'name email')
    .populate('subject', 'name slug')
    .populate('state', 'name slug')
    .populate('district', 'name slug')
    .populate('examinations', 'name slug')
    .lean();

  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  res.status(200).json(new ApiResponse(200, question, 'Question retrieved successfully'));
});

export const createQuestion = asyncHandler(async (req, res) => {
  const validation = validateQuestionData(req.body, { isNew: true });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: Object.values(validation.errors)[0] || 'Validation failed. Please fix the highlighted fields.',
      errors: validation.errors,
    });
  }

  const {
    content,
    instruction,
    ans_info,
    marks,
    negative,
    type,
    language,
    level,
    subject,
    subject_name,
    state,
    state_name,
    district,
    district_name,
    city,
    examinations,
    examination_names,
    options,
    correct_answer,
    status,
  } = req.body;

  // Resolve subject name if ID is provided
  let resolvedSubjectName = subject_name || '';
  let resolvedSubjectId = subject || null;
  if (subject && /^[0-9a-fA-F]{24}$/.test(subject)) {
    const sDoc = await Subject.findById(subject).lean();
    if (sDoc) resolvedSubjectName = sDoc.name;
  }

  // Resolve state name if ID is provided
  let resolvedStateName = state_name || '';
  let resolvedStateId = state || null;
  if (state && /^[0-9a-fA-F]{24}$/.test(state)) {
    const stDoc = await State.findById(state).lean();
    if (stDoc) resolvedStateName = stDoc.name;
  }

  // Resolve examinations
  let resolvedExamNames = Array.isArray(examination_names) ? [...examination_names] : [];
  let resolvedExamIds = Array.isArray(examinations) ? examinations.filter((e) => /^[0-9a-fA-F]{24}$/.test(e)) : [];
  if (resolvedExamIds.length > 0 && resolvedExamNames.length === 0) {
    const examDocs = await Exam.find({ _id: { $in: resolvedExamIds } }).select('name').lean();
    resolvedExamNames = examDocs.map((e) => e.name);
  }

  // Formatted options
  const formattedOptions = (options || []).map((opt, idx) => {
    const optText = typeof opt === 'string' ? opt : (opt.text || '');
    const isCorrect = typeof opt === 'object' ? Boolean(opt.is_correct) : false;
    return {
      index: idx + 1,
      text: optText.trim(),
      is_correct: isCorrect,
    };
  });

  // Calculate correct_answer text/index if option is marked
  let resolvedCorrect = correct_answer || '';
  if (!resolvedCorrect) {
    const correctOpt = formattedOptions.find((o) => o.is_correct);
    if (correctOpt) {
      resolvedCorrect = String.fromCharCode(65 + (correctOpt.index - 1)); // 'A', 'B', etc.
    }
  } else {
    // If correct_answer provided (e.g. 'A' or '1' or exact text), ensure matching option has is_correct = true
    const letterIdx = resolvedCorrect.length === 1 && /[A-Fa-f]/.test(resolvedCorrect)
      ? resolvedCorrect.toUpperCase().charCodeAt(0) - 65
      : -1;
    formattedOptions.forEach((opt, idx) => {
      if (idx === letterIdx || opt.text.trim() === resolvedCorrect.trim()) {
        opt.is_correct = true;
      }
    });
  }

  const highest = await Question.findOne({ sql_id: { $ne: null } }).sort({ sql_id: -1 }).select('sql_id').lean();
  const nextSqlId = (highest?.sql_id || 0) + 1;

  const authorId = req.user?._id || req.user?.id || null;
  const authorName = req.user?.name || 'Administrator';

  const newQuestion = await Question.create({
    sql_id: nextSqlId,
    content: content.trim(),
    instruction: instruction || '',
    ans_info: ans_info || '',
    marks: Number(marks) || 1,
    negative: Number(negative) || 0,
    type: type || { name: 'Objective', slug: 'objective' },
    language: language || 'Hindi',
    level: level || { name: 'Medium', slug: 'medium' },
    subject: resolvedSubjectId,
    subject_name: resolvedSubjectName,
    state: resolvedStateId,
    state_name: resolvedStateName,
    district: district || null,
    district_name: district_name || '',
    city: city || '',
    examinations: resolvedExamIds,
    examination_names: resolvedExamNames,
    options: formattedOptions,
    correct_answer: resolvedCorrect,
    author: authorId,
    author_name: authorName,
    status: status || 'Published',
  });

  res.status(201).json(new ApiResponse(201, newQuestion, 'Question created successfully'));
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const question = await Question.findById(id);
  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  const validation = validateQuestionData(req.body, { isNew: false });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: Object.values(validation.errors)[0] || 'Validation failed. Please fix the highlighted fields.',
      errors: validation.errors,
    });
  }

  const {
    content,
    instruction,
    ans_info,
    marks,
    negative,
    type,
    language,
    level,
    subject,
    state,
    district,
    city,
    examinations,
    options,
    correct_answer,
    status,
  } = req.body;

  if (content !== undefined) question.content = content.trim();
  if (instruction !== undefined) question.instruction = instruction;
  if (ans_info !== undefined) question.ans_info = ans_info;
  if (marks !== undefined) question.marks = Number(marks) || 1;
  if (negative !== undefined) question.negative = Number(negative) || 0;
  if (type !== undefined) question.type = type;
  if (language !== undefined) question.language = language;
  if (level !== undefined) question.level = level;
  if (city !== undefined) question.city = city;
  if (status !== undefined) question.status = status;

  if (subject !== undefined) {
    if (subject && /^[0-9a-fA-F]{24}$/.test(subject)) {
      const sDoc = await Subject.findById(subject).lean();
      question.subject = sDoc ? sDoc._id : null;
      question.subject_name = sDoc ? sDoc.name : '';
    } else {
      question.subject = null;
      question.subject_name = '';
    }
  }

  if (state !== undefined) {
    if (state && /^[0-9a-fA-F]{24}$/.test(state)) {
      const stDoc = await State.findById(state).lean();
      question.state = stDoc ? stDoc._id : null;
      question.state_name = stDoc ? stDoc.name : '';
    } else {
      question.state = null;
      question.state_name = '';
    }
  }

  if (district !== undefined) {
    question.district = district || null;
  }

  if (examinations !== undefined) {
    const validIds = Array.isArray(examinations) ? examinations.filter((e) => /^[0-9a-fA-F]{24}$/.test(e)) : [];
    question.examinations = validIds;
    if (validIds.length > 0) {
      const examDocs = await Exam.find({ _id: { $in: validIds } }).select('name').lean();
      question.examination_names = examDocs.map((e) => e.name);
    } else {
      question.examination_names = [];
    }
  }

  if (options !== undefined) {
    const formattedOptions = (options || []).map((opt, idx) => {
      const optText = typeof opt === 'string' ? opt : (opt.text || '');
      const isCorrect = typeof opt === 'object' ? Boolean(opt.is_correct) : false;
      return {
        index: idx + 1,
        text: optText.trim(),
        is_correct: isCorrect,
      };
    });

    let resolvedCorrect = correct_answer !== undefined ? correct_answer : question.correct_answer;
    if (!resolvedCorrect) {
      const correctOpt = formattedOptions.find((o) => o.is_correct);
      if (correctOpt) {
        resolvedCorrect = String.fromCharCode(65 + (correctOpt.index - 1));
      }
    } else {
      const letterIdx = resolvedCorrect.length === 1 && /[A-Fa-f]/.test(resolvedCorrect)
        ? resolvedCorrect.toUpperCase().charCodeAt(0) - 65
        : -1;
      formattedOptions.forEach((opt, idx) => {
        if (idx === letterIdx || opt.text.trim() === String(resolvedCorrect).trim()) {
          opt.is_correct = true;
        }
      });
    }

    question.options = formattedOptions;
    question.correct_answer = resolvedCorrect;
  }

  question.editor = req.user?._id || req.user?.id || null;
  await question.save();

  res.status(200).json(new ApiResponse(200, question, 'Question updated successfully'));
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const force = req.query.force === 'true' || req.query.force === true;

  const question = await Question.findById(id);
  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  if (force || question.status === 'trashed' || question.status === 'trash' || question.status === 'Trashed') {
    await Question.findByIdAndDelete(id);
    return res.status(200).json(new ApiResponse(200, null, 'Question permanently deleted'));
  }

  question.status = 'trashed';
  question.deleted_at = new Date();
  await question.save();

  res.status(200).json(new ApiResponse(200, question, 'Question moved to trash'));
});

export const restoreQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const question = await Question.findById(id);
  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  question.status = 'Published';
  question.deleted_at = null;
  await question.save();

  res.status(200).json(new ApiResponse(200, question, 'Question restored successfully'));
});

export const bulkActionQuestions = asyncHandler(async (req, res) => {
  const { action, ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'No questions selected');
  }

  if (action === 'publish' || action === 'Published') {
    await Question.updateMany({ _id: { $in: ids } }, { $set: { status: 'Published', deleted_at: null } });
    return res.status(200).json(new ApiResponse(200, null, `Published ${ids.length} questions`));
  }

  if (action === 'draft' || action === 'Draft') {
    await Question.updateMany({ _id: { $in: ids } }, { $set: { status: 'Draft', deleted_at: null } });
    return res.status(200).json(new ApiResponse(200, null, `Moved ${ids.length} questions to Draft`));
  }

  if (action === 'trash' || action === 'trashed') {
    await Question.updateMany({ _id: { $in: ids } }, { $set: { status: 'trashed', deleted_at: new Date() } });
    return res.status(200).json(new ApiResponse(200, null, `Moved ${ids.length} questions to Trash`));
  }

  if (action === 'restore') {
    await Question.updateMany({ _id: { $in: ids } }, { $set: { status: 'Published', deleted_at: null } });
    return res.status(200).json(new ApiResponse(200, null, `Restored ${ids.length} questions`));
  }

  if (action === 'delete' || action === 'force_delete') {
    await Question.deleteMany({ _id: { $in: ids } });
    return res.status(200).json(new ApiResponse(200, null, `Permanently deleted ${ids.length} questions`));
  }

  throw new ApiError(400, 'Invalid bulk action');
});

export const importExcelQuestions = asyncHandler(async (req, res) => {
  const { questions: items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'No questions provided for import');
  }

  const subjects = await Subject.find({}).lean();
  const states = await State.find({}).lean();
  const exams = await Exam.find({}).lean();

  const highest = await Question.findOne({ sql_id: { $ne: null } }).sort({ sql_id: -1 }).select('sql_id').lean();
  let nextSqlId = (highest?.sql_id || 0) + 1;

  const authorId = req.user?._id || req.user?.id || null;
  const authorName = req.user?.name || 'Excel Importer';

  const validDocs = [];
  const errors = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rowNum = i + 2; // Excel row reference (header is row 1)

    const content = String(item.content || item.question || item.Question || '').trim();
    if (!content) {
      errors.push({ row: rowNum, error: 'Question text is missing' });
      continue;
    }

    // Extract options
    const optA = String(item.option_a || item.option1 || item.OptionA || item.Option1 || item.A || '').trim();
    const optB = String(item.option_b || item.option2 || item.OptionB || item.Option2 || item.B || '').trim();
    const optC = String(item.option_c || item.option3 || item.OptionC || item.Option3 || item.C || '').trim();
    const optD = String(item.option_d || item.option4 || item.OptionD || item.Option4 || item.D || '').trim();
    const optE = String(item.option_e || item.option5 || item.OptionE || item.Option5 || item.E || '').trim();
    const optF = String(item.option_f || item.option6 || item.OptionF || item.Option6 || item.F || '').trim();

    const options = [];
    if (optA) options.push({ index: 1, text: optA, is_correct: false });
    if (optB) options.push({ index: 2, text: optB, is_correct: false });
    if (optC) options.push({ index: 3, text: optC, is_correct: false });
    if (optD) options.push({ index: 4, text: optD, is_correct: false });
    if (optE) options.push({ index: 5, text: optE, is_correct: false });
    if (optF) options.push({ index: 6, text: optF, is_correct: false });

    if (options.length < 2) {
      errors.push({ row: rowNum, error: `At least 2 options required, found ${options.length}` });
      continue;
    }

    // Resolve correct answer
    const rawAnswer = String(item.answer || item.correct_answer || item.Answer || item.CorrectAnswer || '').trim();
    let isCorrectMatched = false;

    if (rawAnswer) {
      const upperAns = rawAnswer.toUpperCase();
      if (['A', 'B', 'C', 'D', 'E', 'F'].includes(upperAns)) {
        const targetIdx = upperAns.charCodeAt(0) - 65;
        if (options[targetIdx]) {
          options[targetIdx].is_correct = true;
          isCorrectMatched = true;
        }
      } else if (['1', '2', '3', '4', '5', '6'].includes(rawAnswer)) {
        const targetIdx = Number(rawAnswer) - 1;
        if (options[targetIdx]) {
          options[targetIdx].is_correct = true;
          isCorrectMatched = true;
        }
      } else {
        // Search matching option text
        const matched = options.find((o) => o.text.toLowerCase() === rawAnswer.toLowerCase());
        if (matched) {
          matched.is_correct = true;
          isCorrectMatched = true;
        }
      }
    }

    if (!isCorrectMatched && options.length > 0) {
      options[0].is_correct = true; // Fallback to Option A
    }

    // Resolve subject
    const rawSubject = String(item.subject || item.Subject || '').trim();
    let matchedSubject = null;
    if (rawSubject) {
      matchedSubject = subjects.find(
        (s) => s.name.toLowerCase() === rawSubject.toLowerCase() || s.slug.toLowerCase() === rawSubject.toLowerCase()
      );
    }

    // Resolve state
    const rawState = String(item.state || item.State || '').trim();
    let matchedState = null;
    if (rawState) {
      matchedState = states.find(
        (s) => s.name.toLowerCase() === rawState.toLowerCase() || s.slug.toLowerCase() === rawState.toLowerCase()
      );
    }

    // Resolve exam
    const rawExam = String(item.exam || item.examination || item.Exam || '').trim();
    let matchedExamIds = [];
    let matchedExamNames = [];
    if (rawExam) {
      const foundExam = exams.find(
        (e) => e.name.toLowerCase() === rawExam.toLowerCase() || e.slug.toLowerCase() === rawExam.toLowerCase()
      );
      if (foundExam) {
        matchedExamIds.push(foundExam._id);
        matchedExamNames.push(foundExam.name);
      }
    }

    const doc = {
      sql_id: nextSqlId++,
      content,
      instruction: String(item.instruction || item.Instruction || '').trim(),
      ans_info: String(item.ans_info || item.explanation || item.Explanation || '').trim(),
      marks: Number(item.marks || item.Marks) || 1,
      negative: Number(item.negative || item.Negative) || 0,
      type: { name: 'Objective', slug: 'objective' },
      language: String(item.language || item.Language || 'Hindi').trim(),
      level: {
        name: String(item.level || item.Level || 'Medium').trim(),
        slug: String(item.level || item.Level || 'medium').trim().toLowerCase(),
      },
      subject: matchedSubject ? matchedSubject._id : null,
      subject_name: matchedSubject ? matchedSubject.name : (rawSubject || ''),
      state: matchedState ? matchedState._id : null,
      state_name: matchedState ? matchedState.name : (rawState || ''),
      examinations: matchedExamIds,
      examination_names: matchedExamNames,
      options,
      correct_answer: rawAnswer || 'A',
      author: authorId,
      author_name: authorName,
      status: String(item.status || item.Status || 'Published').trim(),
    };

    validDocs.push(doc);
  }

  let insertedCount = 0;
  if (validDocs.length > 0) {
    const inserted = await Question.insertMany(validDocs, { ordered: false });
    insertedCount = inserted.length;
  }

  res.status(200).json({
    success: true,
    message: `Successfully imported ${insertedCount} questions (${errors.length} skipped with errors).`,
    imported: insertedCount,
    skipped: errors.length,
    errors,
  });
});
