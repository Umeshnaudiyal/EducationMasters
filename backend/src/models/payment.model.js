import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    user_name: {
      type: String,
      trim: true,
      default: '',
    },
    user_email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    user_phone: {
      type: String,
      trim: true,
      default: '',
    },
    series: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockTestSeries',
      index: true,
    },
    series_title: {
      type: String,
      default: '',
    },
    plan: {
      id: String,
      name: { type: String, required: true },
      slug: String,
      price: { type: Number, required: true, default: 0 },
      original_price: { type: Number, default: 0 },
      validity: { type: String, default: '1 Year' },
      validity_days: { type: Number, default: 365 },
      badge: String,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    razorpay_order_id: {
      type: String,
      index: true,
    },
    razorpay_payment_id: {
      type: String,
      index: true,
    },
    razorpay_signature: {
      type: String,
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded', 'free_activated'],
      default: 'created',
      index: true,
    },
    payment_method: {
      type: String,
      default: 'razorpay',
    },
    notes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    error_message: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Payment =
  mongoose.models.Payment || mongoose.model('Payment', paymentSchema, 'payments');

export default Payment;
