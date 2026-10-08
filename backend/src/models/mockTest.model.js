import mongoose from 'mongoose';

const mockTestSchema = new mongoose.Schema(
  {
    series: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockTestSeries',
      required: [true, 'Mock Test Series is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Test title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    test_type: {
      type: String,
      enum: ['full_length', 'sectional', 'chapter', 'previous_year', 'live', 'mini'],
      default: 'full_length',
    },
    is_paid: {
      type: Boolean,
      default: true,
    },
    is_free: {
      type: Boolean,
      default: false,
    },
    duration_minutes: {
      type: Number,
      default: 60,
    },
    total_marks: {
      type: Number,
      default: 100,
    },
    pass_marks: {
      type: Number,
      default: 35,
    },
    negative_marking: {
      type: Number,
      default: 0.25,
    },
    marks_per_question: {
      type: Number,
      default: 1,
    },
    medium: {
      type: String,
      enum: ['English', 'Hindi', 'Bilingual'],
      default: 'Bilingual',
    },
    instructions: {
      type: String,
      default: '',
    },
    sections: [
      {
        name: { type: String, required: true },
        duration_minutes: { type: Number, default: 0 },
        marks: { type: Number, default: 0 },
        question_count: { type: Number, default: 0 },
      },
    ],
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    total_questions: {
      type: Number,
      default: 0,
    },
    total_attempts: {
      type: Number,
      default: 0,
    },
    average_score: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['publish', 'published', 'Published', 'draft', 'Draft', 'pending'],
      default: 'Published',
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    seo: {
      allow_indexing: { type: Boolean, default: true },
      meta_title: { type: String, default: '' },
      meta_keywords: { type: String, default: '' },
      meta_description: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

// Auto-sync total_questions before saving
mockTestSchema.pre('save', function (next) {
  if (this.questions && Array.isArray(this.questions)) {
    this.total_questions = this.questions.length;
  }
  if (this.is_paid !== undefined) {
    this.is_free = !this.is_paid;
  }
  next();
});

const MockTest =
  mongoose.models.MockTest || mongoose.model('MockTest', mockTestSchema, 'mock_tests');

export default MockTest;
