import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global_settings',
      unique: true,
      index: true,
    },
    siteName: {
      type: String,
      default: 'Education Masters',
    },
    tagline: {
      type: String,
      default: 'Leading Educational Hub & Admission Portal in India',
    },
    adminEmail: {
      type: String,
      default: 'info@educationmasters.in',
    },
    contactPhone: {
      type: String,
      default: '+91 98765 43210',
    },
    metaTitle: {
      type: String,
      default: 'Education Masters - Colleges, Courses, Exams & Jobs Portal',
    },
    metaDescription: {
      type: String,
      default:
        'Search best colleges, top universities, government job alerts, admit cards, results, and practice free online mock tests in India.',
    },
    metaKeywords: {
      type: String,
      default: 'colleges, universities, govt jobs, admit cards, results, mock tests, education masters',
    },
    allowIndexing: {
      type: Boolean,
      default: true,
    },

    // Global SMTP Configuration
    smtp: {
      host: { type: String, default: 'smtp.gmail.com' },
      port: { type: Number, default: 587 },
      user: { type: String, default: '' },
      pass: { type: String, default: '' },
      secure: { type: Boolean, default: false }, // true for 465, false for 587
      fromName: { type: String, default: 'Education Masters' },
      fromEmail: { type: String, default: 'noreply@educationmasters.in' },
      isConfigured: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ['CONNECTED', 'DISCONNECTED', 'ERROR', 'UNCONFIGURED'],
        default: 'UNCONFIGURED',
      },
      lastTestedAt: { type: Date, default: null },
      lastError: { type: String, default: '' },
    },

    // Global WhatsApp Pool Configuration
    whatsapp: {
      defaultSessionId: { type: String, default: 'primary' },
      maxWorkers: { type: Number, default: 3 },
      otpExpiryMinutes: { type: Number, default: 10 },
      otpTemplate: {
        type: String,
        default:
          '🔐 *Education Masters Verification Code*\n\nYour OTP is *{{OTP}}*. Valid for {{MINUTES}} minutes.\nDo not share this code with anyone.',
      },
      autoReconnect: { type: Boolean, default: true },
      isEnabled: { type: Boolean, default: true },
      defaultCountryCode: { type: String, default: '91' },
      status: {
        type: String,
        enum: ['CONNECTED', 'SCAN_QR', 'DISCONNECTED', 'OFFLINE'],
        default: 'DISCONNECTED',
      },
      lastActiveAt: { type: Date, default: null },
    },

    // Global Login & Registration Dynamic Settings
    authSettings: {
      // 1. Allow or Stop New User Registrations
      allowNewRegistrations: { type: Boolean, default: true },
      registrationClosedMessage: {
        type: String,
        default: 'New user registration is currently closed. If you already have an account, please sign in.',
      },

      // 2. Google Login Second-Step Mobile Verification for NEW Users
      googleNewUserPhoneVerification: { type: Boolean, default: true },

      // 3. Second-Step Mobile Verification for EXISTING / OLD Users with Unverified Phone
      existingUserPhoneVerification: { type: Boolean, default: false },

      // 4. Manual Registration OTP Channel
      // 'whatsapp' (WhatsApp Mobile OTP) | 'email' (Email OTP) | 'both' (WhatsApp & Email OTP) | 'none' (Direct Registration)
      manualRegistrationOtpMode: {
        type: String,
        enum: ['whatsapp', 'email', 'both', 'none'],
        default: 'whatsapp',
      },

      otpExpiryMinutes: { type: Number, default: 10 },
      emailOtpSubject: {
        type: String,
        default: '🔐 Your Education Masters Verification Code',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Singleton helper to get or initialize settings
settingSchema.statics.getGlobal = async function () {
  let doc = await this.findOne({ key: 'global_settings' });
  if (!doc) {
    doc = await this.create({ key: 'global_settings' });
  }
  return doc;
};

const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
export default Setting;
