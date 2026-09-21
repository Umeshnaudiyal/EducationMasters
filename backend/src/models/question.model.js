import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    content: {
      type: String,
      required: [true, 'Question content is required'],
      trim: true,
    },
    instruction: {
      type: String,
      default: '',
    },
    ans_info: {
      type: String,
      default: '',
    },
    marks: {
      type: Number,
      default: 1,
    },
    negative: {
      type: Number,
      default: 0,
    },
    type: {
      type: mongoose.Schema.Types.Mixed,
      default: { name: 'Objective', slug: 'objective' },
    },
    language: {
      type: String,
      default: 'Hindi',
    },
    level: {
      type: mongoose.Schema.Types.Mixed,
      default: { name: 'Medium', slug: 'medium' },
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    subject_id: Number,
    subject_name: {
      type: String,
      default: '',
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State',
    },
    state_id: Number,
    state_name: {
      type: String,
      default: '',
    },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
    },
    district_id: Number,
    district_name: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    examinations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
      },
    ],
    examination_names: [
      {
        type: String,
      },
    ],
    options: [
      {
        index: Number,
        text: String,
        is_correct: { type: Boolean, default: false },
      },
    ],
    correct_answer: {
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
    user_id: Number,
    editor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['publish', 'published', 'Published', 'draft', 'Draft', 'pending', 'Pending', 'trash', 'trashed', 'Trashed'],
      default: 'Published',
      index: true,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
    created_at: String,
    updated_at: String,
  },
  { timestamps: true }
);

const Question = mongoose.models.Question || mongoose.model('Question', questionSchema, 'questions');
export default Question;
