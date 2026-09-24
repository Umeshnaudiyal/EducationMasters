import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    name: {
      type: String,
      required: [true, 'Examination name is required'],
      trim: true,
      minlength: [2, 'Examination name must be at least 2 characters long'],
      maxlength: [200, 'Examination name cannot exceed 200 characters'],
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
      trim: true,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    author_name: {
      type: String,
      default: '',
    },
    user_id: {
      type: Number,
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

const Exam = mongoose.models.Exam || mongoose.model('Exam', examSchema, 'examinations');
export default Exam;
