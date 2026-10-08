import mongoose from 'mongoose';

const mockTestSeriesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Mock test series title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    image: {
      type: String,
      default: '',
    },
    examination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
    },
    examination_name: {
      type: String,
      default: '',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    category_name: {
      type: String,
      default: '',
    },
    badge: {
      type: String,
      default: 'Popular', // e.g. "Trending", "Free Tests", "New Pattern", "Best Seller"
    },
    top_description: {
      type: String,
      default: '',
    },
    bottom_description: {
      type: String,
      default: '',
    },
    highlights: [
      {
        type: String,
      },
    ],
    plans: [
      {
        name: { type: String, required: true }, // e.g. "Free Plan", "Pro Plan", "Premium Plan"
        price: { type: Number, default: 0 },
        original_price: { type: Number, default: 0 },
        validity: { type: String, default: '1 Year' }, // e.g. "1 Month", "1 Year", "2 Years", "Lifetime"
        validity_days: { type: Number, default: 365 },
        is_free: { type: Boolean, default: false },
        is_popular: { type: Boolean, default: false },
        badge: { type: String, default: '' }, // e.g. "100% FREE", "MOST POPULAR", "BEST VALUE"
        tagline: { type: String, default: '' },
        features: [{ type: String }],
        button_text: { type: String, default: 'Select Plan' },
      },
    ],
    total_tests: {
      type: Number,
      default: 0,
    },
    free_tests_count: {
      type: Number,
      default: 0,
    },
    total_questions: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['publish', 'published', 'Published', 'draft', 'Draft', 'pending'],
      default: 'Published',
      index: true,
    },
    is_featured: {
      type: Boolean,
      default: false,
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
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const MockTestSeries =
  mongoose.models.MockTestSeries ||
  mongoose.model('MockTestSeries', mockTestSeriesSchema, 'mock_test_series');

export default MockTestSeries;
