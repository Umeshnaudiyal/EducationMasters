import mongoose from 'mongoose';

const mockTestAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    user_name: {
      type: String,
      default: 'Guest Student',
    },
    user_email: {
      type: String,
      default: '',
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockTest',
      required: true,
      index: true,
    },
    series: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockTestSeries',
      index: true,
    },
    total_questions: {
      type: Number,
      default: 0,
    },
    total_attempted: {
      type: Number,
      default: 0,
    },
    total_correct: {
      type: Number,
      default: 0,
    },
    total_incorrect: {
      type: Number,
      default: 0,
    },
    total_unattempted: {
      type: Number,
      default: 0,
    },
    total_marked_for_review: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    max_score: {
      type: Number,
      default: 100,
    },
    language: {
      type: String,
      default: '',
    },
    percentage: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0, // percentage
    },
    time_spent_seconds: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: 1,
    },
    total_participants: {
      type: Number,
      default: 1,
    },
    responses: [
      {
        question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        selected_option_index: { type: Number, default: null },
        is_correct: { type: Boolean, default: false },
        is_attempted: { type: Boolean, default: false },
        is_marked_for_review: { type: Boolean, default: false },
        time_spent_seconds: { type: Number, default: 0 },
      },
    ],
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
      index: true,
    },
    started_at: {
      type: Date,
      default: Date.now,
    },
    completed_at: {
      type: Date,
    },
  },
  { timestamps: true }
);

const MockTestAttempt =
  mongoose.models.MockTestAttempt ||
  mongoose.model('MockTestAttempt', mockTestAttemptSchema, 'mock_test_attempts');

export default MockTestAttempt;
