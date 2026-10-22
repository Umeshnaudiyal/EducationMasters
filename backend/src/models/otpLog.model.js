import mongoose from 'mongoose';

const otpLogSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['OTP', 'NOTIFICATION', 'TEST'],
      default: 'OTP',
    },
    channel: {
      type: String,
      enum: ['WHATSAPP', 'EMAIL', 'SMS'],
      default: 'WHATSAPP',
      index: true,
    },
    sessionId: {
      type: String,
      default: '',
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'DELIVERED', 'VERIFIED', 'EXPIRED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    messageText: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    error: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Auto-expire indexing
otpLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // 30 days retention

const OtpLog = mongoose.models.OtpLog || mongoose.model('OtpLog', otpLogSchema);

export default OtpLog;
