import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    name: {
      type: String,
      required: [true, 'Topic name is required'],
      trim: true,
      minlength: [2, 'Topic name must be at least 2 characters long'],
      maxlength: [200, 'Topic name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
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
    topic_group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TopicGroup',
    },
    topic_group_id: Number,
    topic_group_name: {
      type: String,
      default: '',
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
    seo: {
      allow_indexing: { type: Boolean, default: true },
      meta_title: { type: String, default: '' },
      meta_keywords: { type: String, default: '' },
      meta_description: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

const Topic = mongoose.models.Topic || mongoose.model('Topic', topicSchema, 'topics');
export default Topic;
