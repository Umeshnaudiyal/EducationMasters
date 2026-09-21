import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, index: true, lowercase: true, trim: true },
    description: { type: String, default: null },
    seo: {
      allow_indexing: { type: Boolean, default: true },
      meta_title: { type: String, default: '' },
      meta_keywords: { type: String, default: '' },
      meta_description: { type: String, default: '' },
    },
  },
  { timestamps: true, strict: false }
);

const Tag = mongoose.models.Tag || mongoose.model('Tag', tagSchema);
export default Tag;
