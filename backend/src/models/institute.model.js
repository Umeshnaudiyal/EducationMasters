import mongoose from 'mongoose';

const instituteSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, index: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    video: { type: String, default: null },
    gmap: { type: String, default: null },
    website: { type: String, default: null },
    city: { type: String, default: null },
    logo: { type: String, default: null },
    cover: { type: String, default: null },
    address: { type: String, default: '' },
    about: { type: String, default: '' },
    status: {
      type: String,
      enum: ['publish', 'draft', 'pending', 'trash'],
      default: 'draft',
      index: true,
    },
    
    // Mongoose ObjectId References
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    user_id: Number,
    
    editor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    editor_id: Number,
    
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approver_id: Number,
    
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
    state_id: Number,
    
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
    district_id: Number,

    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    facilities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Facility' }],
    media: [{ name: String, path: String, file: String }],
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

const Institute = mongoose.model('Institute', instituteSchema);
export default Institute;
