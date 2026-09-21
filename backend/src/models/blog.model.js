import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    title: {
      type: String,
      required: [true, 'Blog post title is required.'],
      trim: true,
      minlength: [3, 'Blog post title must be at least 3 characters long.'],
    },
    slug: { type: String, index: true, trim: true },
    status: { type: String, default: 'draft', index: true },
    content: String,
    updates: String,
    
    // Mongoose ObjectId References
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    user_id: Number,
    
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    category_ids: [Number],
    
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    tag_ids: [Number],
    
    featured_media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    media_id: Number,

    created_at: { type: String, index: true },
    updated_at: { type: String },
    metadata: {
      m_title: String,
      m_desc: String,
      m_keys: String,
      canonical: String,
      robots: mongoose.Schema.Types.Mixed,
      schema: String,
    },
  },
  { timestamps: true, strict: false }
);

const Blog = mongoose.model('Blog', blogSchema);
export default Blog;
