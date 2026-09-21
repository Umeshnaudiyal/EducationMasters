import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, index: true, trim: true },
    description: { type: String, default: '' },
    
    // Mongoose ObjectId References
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    parent_id: { type: Number, default: null },
    
    featured_media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
    media_id: { type: Number, default: null },

    // SEO Fields
    allow_indexing: { type: Boolean, default: true },
    meta_title: { type: String, default: '' },
    meta_keywords: { type: String, default: '' },
    meta_description: { type: String, default: '' },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const Category = mongoose.model('Category', categorySchema);
export default Category;
