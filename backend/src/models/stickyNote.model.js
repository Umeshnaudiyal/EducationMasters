import mongoose from 'mongoose';

const stickyNoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Sticky note title is required.'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters long.'],
      maxlength: [200, 'Title cannot exceed 200 characters.'],
    },
    content: {
      type: String,
      required: [true, 'Sticky note content is required.'],
      trim: true,
    },
    color: {
      type: String,
      enum: ['yellow', 'purple', 'blue', 'green', 'pink', 'orange', 'cyan'],
      default: 'yellow',
    },
    type: {
      type: String,
      enum: ['notice', 'advisory', 'exam-rule', 'urgent', 'announcement', 'general'],
      default: 'notice',
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'draft'],
      default: 'active',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    audience: {
      type: String,
      default: 'all',
    },
    linkUrl: {
      type: String,
      trim: true,
      default: '',
    },
    linkLabel: {
      type: String,
      trim: true,
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    viewCount: {
      type: Number,
      default: 0,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    authorName: {
      type: String,
      default: 'Education Masters',
    },
  },
  {
    timestamps: true,
  }
);

stickyNoteSchema.index({ status: 1, isPinned: -1, createdAt: -1 });

const StickyNote = mongoose.models.StickyNote || mongoose.model('StickyNote', stickyNoteSchema);

export default StickyNote;
