import mongoose from 'mongoose';
import QuestionReport from '../models/questionReport.model.js';
import Question from '../models/question.model.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Submit a question report from student
 * @route   POST /apis/v1/question-reports
 * @access  Public / Optional Auth
 */
export const submitQuestionReport = asyncHandler(async (req, res) => {
  const {
    question_id,
    question_sql_id,
    question_text,
    options,
    reported_reason,
    suggested_option_index,
    suggested_option_text,
    is_custom_option,
    custom_option_text,
    remarks,
    user_name,
    user_email,
  } = req.body;

  if (!question_text || question_text.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Question text is required to file a report.',
    });
  }

  // Validate question_id if provided
  let validQuestionId = null;
  if (question_id && mongoose.Types.ObjectId.isValid(question_id)) {
    validQuestionId = question_id;
  }

  let finalOptions = Array.isArray(options) && options.length > 0 ? options : [];

  // If question was not explicitly provided by ID, try finding it in database to link
  try {
    let matchedQ = null;
    if (validQuestionId) {
      matchedQ = await Question.findById(validQuestionId).select('_id options content ans_info').lean();
    } else if (question_sql_id) {
      matchedQ = await Question.findOne({ sql_id: Number(question_sql_id) }).select('_id options content ans_info').lean();
    } else if (question_text) {
      matchedQ = await Question.findOne({ content: question_text.trim() }).select('_id options content ans_info').lean();
    }
    if (matchedQ) {
      validQuestionId = matchedQ._id;
      if (finalOptions.length === 0 && Array.isArray(matchedQ.options) && matchedQ.options.length > 0) {
        finalOptions = matchedQ.options;
      }
    }
  } catch (lookupErr) {
    // Non-blocking lookup fallback
  }

  const report = await QuestionReport.create({
    question_id: validQuestionId,
    question_sql_id: question_sql_id || null,
    question_text: question_text.trim(),
    options: finalOptions,
    reported_reason: reported_reason || 'Wrong Answer Key',
    suggested_option_index: typeof suggested_option_index === 'number' ? suggested_option_index : -1,
    suggested_option_text: suggested_option_text || '',
    is_custom_option: !!is_custom_option,
    custom_option_text: custom_option_text || '',
    remarks: remarks || '',
    user_id: req.user?._id || null,
    user_name: req.user?.name || user_name || 'Student',
    user_email: req.user?.email || user_email || '',
    status: 'pending',
  });

  return res.status(201).json({
    success: true,
    message: 'Question report submitted successfully. Thank you for helping keep our question bank accurate!',
    data: report,
  });
});

/**
 * @desc    Get all question reports with filters & pagination
 * @route   GET /apis/v1/question-reports
 * @access  Private (Admin / Superadmin)
 */
export const getQuestionReports = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const query = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (search && search.trim() !== '') {
    const s = search.trim();
    query.$or = [
      { question_text: { $regex: s, $options: 'i' } },
      { custom_option_text: { $regex: s, $options: 'i' } },
      { remarks: { $regex: s, $options: 'i' } },
      { user_name: { $regex: s, $options: 'i' } },
      { user_email: { $regex: s, $options: 'i' } },
    ];
  }

  const [reports, totalCount, countsByStatus] = await Promise.all([
    QuestionReport.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('question_id', 'content options ans_info correct_answer')
      .populate('resolved_by', 'name email role')
      .lean(),
    QuestionReport.countDocuments(query),
    QuestionReport.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const stats = {
    total: 0,
    pending: 0,
    in_review: 0,
    resolved: 0,
    rejected: 0,
  };

  countsByStatus.forEach((item) => {
    stats.total += item.count;
    if (stats[item._id] !== undefined) {
      stats[item._id] = item.count;
    }
  });

  return res.status(200).json({
    success: true,
    data: reports,
    pagination: {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    },
    stats,
  });
});

/**
 * @desc    Get single question report
 * @route   GET /apis/v1/question-reports/:id
 * @access  Private (Admin / Superadmin)
 */
export const getQuestionReportById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid report ID' });
  }

  const report = await QuestionReport.findById(id)
    .populate('question_id')
    .populate('resolved_by', 'name email role');

  if (!report) {
    return res.status(404).json({ success: false, message: 'Question report not found' });
  }

  return res.status(200).json({
    success: true,
    data: report,
  });
});

/**
 * @desc    Update question report status & admin notes
 * @route   PUT /apis/v1/question-reports/:id
 * @access  Private (Admin / Superadmin)
 */
export const updateQuestionReportStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, admin_notes } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid report ID' });
  }

  const updateFields = {};
  if (status) {
    if (!['pending', 'in_review', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    updateFields.status = status;
    if (status === 'resolved' || status === 'rejected') {
      updateFields.resolved_by = req.user?._id || null;
      updateFields.resolved_at = new Date();
    }
  }

  if (typeof admin_notes === 'string') {
    updateFields.admin_notes = admin_notes.trim();
  }

  const updatedReport = await QuestionReport.findByIdAndUpdate(id, updateFields, {
    new: true,
    runValidators: true,
  }).populate('resolved_by', 'name email role');

  if (!updatedReport) {
    return res.status(404).json({ success: false, message: 'Question report not found' });
  }

  return res.status(200).json({
    success: true,
    message: 'Report updated successfully',
    data: updatedReport,
  });
});

/**
 * @desc    Delete a question report
 * @route   DELETE /apis/v1/question-reports/:id
 * @access  Private (Superadmin)
 */
export const deleteQuestionReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid report ID' });
  }

  const deleted = await QuestionReport.findByIdAndDelete(id);

  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Question report not found' });
  }

  return res.status(200).json({
    success: true,
    message: 'Question report deleted successfully',
  });
});

/**
 * @desc    Directly update a question from a question report & mark report as resolved
 * @route   PUT /apis/v1/question-reports/:id/update-question
 * @access  Private (Superadmin, Admin, Editor)
 */
export const updateQuestionFromReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    content,
    options,
    correct_answer,
    ans_info,
    mark_resolved = true,
    admin_notes,
    status = 'resolved',
  } = req.body;

  const report = await QuestionReport.findById(id);
  if (!report) {
    return res.status(404).json({ success: false, message: 'Question report not found' });
  }

  // 1. Locate Question in DB
  let question = null;
  if (report.question_id && mongoose.Types.ObjectId.isValid(report.question_id)) {
    question = await Question.findById(report.question_id);
  }

  if (!question && report.question_sql_id) {
    question = await Question.findOne({ sql_id: Number(report.question_sql_id) });
  }

  if (!question && report.question_text) {
    question = await Question.findOne({ content: report.question_text.trim() });
    if (!question) {
      const escaped = report.question_text.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      question = await Question.findOne({
        content: { $regex: new RegExp(`^${escaped}$`, 'i') },
      });
    }
  }

  // 2. If question found, update it in MongoDB
  let questionUpdated = false;
  if (question) {
    if (content !== undefined && String(content).trim()) {
      question.content = String(content).trim();
    }

    if (ans_info !== undefined) {
      question.ans_info = String(ans_info).trim();
    }

    if (Array.isArray(options) && options.length >= 2) {
      const formattedOptions = options.map((opt, idx) => {
        const optText = typeof opt === 'string' ? opt : (opt.text || '');
        const isCorrect = typeof opt === 'object' ? Boolean(opt.is_correct) : false;
        return {
          index: idx + 1,
          text: String(optText).trim(),
          is_correct: isCorrect,
        };
      });

      // Handle correct_answer if specified (e.g. "B" or "Option 2" or index)
      let resolvedCorrect = correct_answer !== undefined ? correct_answer : question.correct_answer;
      if (resolvedCorrect !== undefined && resolvedCorrect !== null) {
        const letterIdx = String(resolvedCorrect).trim().length === 1 && /[A-Fa-f]/.test(String(resolvedCorrect).trim())
          ? String(resolvedCorrect).trim().toUpperCase().charCodeAt(0) - 65
          : -1;

        if (letterIdx >= 0) {
          formattedOptions.forEach((opt, idx) => {
            opt.is_correct = idx === letterIdx;
          });
        }
      }

      // Ensure at least one option is marked correct if any was selected
      const hasAnyCorrect = formattedOptions.some((o) => o.is_correct);
      if (!hasAnyCorrect && formattedOptions.length > 0) {
        formattedOptions[0].is_correct = true;
      }

      question.options = formattedOptions;

      // Update question.correct_answer string representation
      const correctOpt = formattedOptions.find((o) => o.is_correct);
      if (correctOpt) {
        question.correct_answer = `Option ${correctOpt.index}`;
      }
    }

    await question.save();
    questionUpdated = true;

    // Link report to this question and keep report's snapshot in sync
    report.question_id = question._id;
    report.question_text = question.content;
    report.options = question.options;
  }

  // 3. Update report resolution status
  if (mark_resolved || status === 'resolved') {
    report.status = 'resolved';
    report.resolved_at = new Date();
    if (req.user) {
      report.resolved_by = req.user._id;
    }
  } else if (status) {
    report.status = status;
  }

  if (admin_notes !== undefined) {
    report.admin_notes = String(admin_notes).trim();
  } else if (mark_resolved && !report.admin_notes) {
    report.admin_notes = 'Question corrected and updated directly in question bank by administrator.';
  }

  await report.save();

  return res.status(200).json({
    success: true,
    message: questionUpdated
      ? 'Question updated successfully in question bank and report marked as resolved!'
      : 'Report updated, but question was not found in database to modify.',
    data: {
      report,
      question,
      question_updated: questionUpdated,
    },
  });
});
