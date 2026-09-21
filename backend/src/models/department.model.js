import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    sql_id: {
      type: Number,
      index: true,
    },
    meta_id: {
      type: Number,
      default: 0,
    },
    media_id: {
      type: Number,
      default: 0,
    },
    cover_id: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: null,
    },
    seo: {
      allow_indexing: { type: Boolean, default: true },
      meta_title: { type: String, default: '' },
      meta_keywords: { type: String, default: '' },
      meta_description: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

const Department = mongoose.models.Department || mongoose.model('Department', departmentSchema);

export default Department;
