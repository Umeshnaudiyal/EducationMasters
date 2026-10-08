import mongoose from 'mongoose';

const mockTestPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    tagline: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    original_price: {
      type: Number,
      default: 0,
    },
    validity: {
      type: String,
      default: '1 Year', // e.g., "1 Month", "1 Year", "2 Years", "Lifetime"
    },
    validity_days: {
      type: Number,
      default: 365,
    },
    is_free: {
      type: Boolean,
      default: false,
    },
    is_popular: {
      type: Boolean,
      default: false,
    },
    badge: {
      type: String,
      default: '', // e.g. "100% FREE", "MOST POPULAR", "BEST VALUE"
    },
    features: [
      {
        type: String,
      },
    ],
    button_text: {
      type: String,
      default: 'Select Plan',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const MockTestPlan =
  mongoose.models.MockTestPlan ||
  mongoose.model('MockTestPlan', mockTestPlanSchema, 'mock_test_plans');

export default MockTestPlan;
