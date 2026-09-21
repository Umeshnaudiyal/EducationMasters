import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    role_id: Number,
    social_id: Number,
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    nicename: {
      type: String,
      trim: true,
      maxlength: [100, 'Username cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
      maxlength: [150, 'Email cannot exceed 150 characters'],
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^[+]?[\d\s-]{7,15}$/.test(v);
        },
        message: 'Please provide a valid phone number (7-15 digits)',
      },
    },
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: [
          'superadmin',
          'admin',
          'editor',
          'author',
          'writer',
          'institute',
          'institute_admin',
          'institute_employee',
          'user',
          'subscriber',
        ],
        message: '{VALUE} is not a valid user role',
      },
      default: 'user',
      index: true,
    },
    permissions: [{ type: String }],
    institute_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
    subscription: {
      plan: { type: String, default: 'free' },
      startDate: { type: Date },
      expiryDate: { type: Date },
      isActive: { type: Boolean, default: true },
      maxUsers: { type: Number, default: 5 },
    },
    image: { type: String, trim: true },
    bio: {
      type: String,
      trim: true,
      maxlength: [1500, 'Bio cannot exceed 1500 characters'],
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^(https?:\/\/)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})([/a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)*\/?$/i.test(v);
        },
        message: 'Please provide a valid website URL',
      },
    },
    twitter: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^(https?:\/\/)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})([/a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)*\/?$/i.test(v);
        },
        message: 'Please provide a valid Twitter/X profile link',
      },
    },
    facebook: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^(https?:\/\/)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})([/a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)*\/?$/i.test(v);
        },
        message: 'Please provide a valid Facebook profile link',
      },
    },
    instagram: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^(https?:\/\/)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})([/a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)*\/?$/i.test(v);
        },
        message: 'Please provide a valid Instagram profile link',
      },
    },
    linkedin: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^(https?:\/\/)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})([/a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)*\/?$/i.test(v);
        },
        message: 'Please provide a valid LinkedIn profile link',
      },
    },
    youtube: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^(https?:\/\/)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})([/a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)*\/?$/i.test(v);
        },
        message: 'Please provide a valid YouTube channel URL',
      },
    },
    active: { type: Number, enum: [0, 1], default: 1 },
    backend: Number,
    gender: {
      type: String,
      enum: {
        values: ['Male', 'Female', 'Other', ''],
        message: '{VALUE} is not a valid gender option',
      },
      default: 'Male',
    },
    otp: String,
    phone_verified_at: String,
    email_verified_at: String,
    remember_token: String,
    email_token: String,
    phone_token: String,
    created_at: String,
    updated_at: String,
    deleted_at: String,
  },
  { timestamps: true, strict: false }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  // If already a bcrypt hash ($2a$, $2b$, or $2y$), do not re-hash
  if (/^\$2[aby]\$/.test(this.password)) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  const hash = this.password.replace(/^\$2y\$/, '$2a$');
  return await bcrypt.compare(enteredPassword, hash);
};

userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET || 'secretKey', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const User = mongoose.model('User', userSchema);
export default User;
