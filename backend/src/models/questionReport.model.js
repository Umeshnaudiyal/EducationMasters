import mongoose from 'mongoose';

const questionReportSchema = new mongoose.Schema(
  {
    question_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      index: true,
      default: null,
    },
    question_sql_id: {
      type: Number,
      index: true,
      default: null,
    },
    question_text: {
      type: String,
      required: true,
      trim: true,
    },
    options: [
      {
        text: { type: String, default: '' },
        is_correct: { type: Boolean, default: false },
      },
    ],
    reported_reason: {
      type: String,
      required: true,
      enum: [
        'Wrong Answer Key',
        'Spelling / Grammar Error',
        'Incomplete or Wrong Explanation',
        'Question is Ambiguous / Invalid',
        'Outdated Syllabus / Question',
        'Other Issue',
      ],
      default: 'Wrong Answer Key',
    },
    // Chosen existing option index (0, 1, 2, 3...)
    suggested_option_index: {
      type: Number,
      default: -1,
    },
    suggested_option_text: {
      type: String,
      default: '',
      trim: true,
    },
    // When user selects "Other" and enters custom option
    is_custom_option: {
      type: Boolean,
      default: false,
    },
    custom_option_text: {
      type: String,
      default: '',
      trim: true,
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    user_name: {
      type: String,
      default: 'Student',
      trim: true,
    },
    user_email: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'resolved', 'rejected'],
      default: 'pending',
      index: true,
    },
    admin_notes: {
      type: String,
      default: '',
      trim: true,
    },
    resolved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolved_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

const QuestionReport =
  mongoose.models.QuestionReport ||
  mongoose.model('QuestionReport', questionReportSchema, 'question_reports');

export default QuestionReport;
