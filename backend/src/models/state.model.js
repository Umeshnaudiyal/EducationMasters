import mongoose from 'mongoose';

const stateSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    name: {
      type: String,
      required: [true, 'State name is required'],
      trim: true,
      minlength: [2, 'State name must be at least 2 characters long'],
      maxlength: [100, 'State name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country',
    },
    country_id: Number,
    image: {
      type: String,
      default: '',
    },
    state_number: {
      type: String,
      default: '',
    },
    governor: {
      type: String,
      default: '',
    },
    chief_minister: {
      type: String,
      default: '',
    },
    capital: {
      type: String,
      default: '',
    },
    land_area: {
      type: String,
      default: '',
    },
    population: {
      type: String,
      default: '',
    },
    about_state: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    description_hi: {
      type: String,
      default: '',
    },
    job_description: {
      type: String,
      default: '',
    },
    seo: {
      allow_indexing: { type: Boolean, default: true },
      meta_title: { type: String, default: '' },
      meta_keywords: { type: String, default: '' },
      meta_description: { type: String, default: '' },
    },
    seo_hi: {
      meta_title: { type: String, default: '' },
      meta_keywords: { type: String, default: '' },
      meta_description: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

const State = mongoose.models.State || mongoose.model('State', stateSchema, 'states');
export default State;
