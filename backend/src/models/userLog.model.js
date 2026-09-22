import mongoose from 'mongoose';

const userLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    user_name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      default: 'user',
      index: true,
    },
    action: {
      type: String,
      enum: ['login', 'logout', 'session_expired', 'auto_logout'],
      default: 'login',
      index: true,
    },
    login_time: {
      type: Date,
      required: true,
      default: Date.now,
    },
    logout_time: {
      type: Date,
    },
    session_date: {
      type: String, // YYYY-MM-DD
      index: true,
    },
    ip_address: {
      type: String,
      default: 'Unknown',
    },
    user_agent: {
      type: String,
      default: 'Unknown',
    },
    device: {
      type: String,
      default: 'Desktop',
    },
    duration_seconds: {
      type: Number,
      default: 0,
    },
    duration_formatted: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'expired'],
      default: 'active',
      index: true,
    },
    expires_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast querying & audit reporting
userLogSchema.index({ user: 1, session_date: 1 }, { unique: true });
userLogSchema.index({ user: 1, createdAt: -1 });
userLogSchema.index({ session_date: -1, status: 1 });

const UserLog = mongoose.model('UserLog', userLogSchema);
export default UserLog;
