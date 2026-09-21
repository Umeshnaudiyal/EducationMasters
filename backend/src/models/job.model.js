import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    title: {
      type: String,
      required: [true, 'Job post title is required.'],
      trim: true,
      minlength: [3, 'Job post title must be at least 3 characters long.'],
    },
    slug: { type: String, index: true, trim: true },
    status: { type: String, default: 'active', index: true },
    post: String,
    posts: mongoose.Schema.Types.Mixed,
    desig: String,
    dept: String,
    app_link: String,
    noti_link: String,
    released: String,
    app_start: String,
    app_ends: String,
    min_age: mongoose.Schema.Types.Mixed,
    max_age: mongoose.Schema.Types.Mixed,
    exam_date: String,
    
    // Mongoose ObjectId References
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    user_id: Number,
    
    editor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    editor_id: Number,
    
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approver_id: Number,
    
    featured_media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    media_id: Number,
    
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
    state_id: Number,
    
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    category_ids: [Number],
    
    dates: {
      start_date: String,
      last_date: String,
      fee_date: String,
      exam_date: String,
      admit_date: String,
      result_date: String,
    },
    fees: {
      gen_fee: String,
      sc_fee: String,
      obc_fee: String,
      ph_fee: String,
      fee_mode: String,
    },
    age_limit: {
      min_age: String,
      max_age: String,
    },
    total_posts: String,
    eligibility: String,
    links: {
      site_url: String,
      down_url: String,
    },
    description: String,
    
    admitCardNotification: {
      title: String,
      slug: String,
      down_url: String,
    },
    resultNotification: {
      title: String,
      slug: String,
      down_url: String,
    },
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

const Job = mongoose.model('Job', jobSchema);
export default Job;
