import mongoose from 'mongoose';

const admitCardSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    job_id: { type: Number, default: 0, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, index: true, trim: true },
    status: { type: String, default: 'publish', index: true },
    
    // Exam Details
    post: { type: String, default: null }, // Job Post Name (Name of Exam)
    dept: { type: String, default: null }, // Department text
    desig: { type: String, default: null }, // Post Name (Designation)
    
    // Dates & Mode
    exam_rdate: { type: String, default: null }, // Release Date
    exam_date: { type: String, default: null }, // Job Examination Date
    exam_time: { type: String, default: null }, // Examination Time
    exam_mode: { type: String, default: null }, // Examination Mode
    
    // Links
    down_url: { type: String, default: null }, // Admit Card Download URL
    site_url: { type: String, default: null }, // Official Website URL
    syllabus_url: { type: String, default: null }, // Syllabus URL
    prevqp_url: { type: String, default: null }, // Previous Year Question Paper URL
    job_url: { type: String, default: null }, // Linked Job Post URL
    
    // Rich Text Content
    description: { type: String, default: '' }, // Job Description (Full width editor)
    inst_down: { type: String, default: '' }, // Download Instructions (Left editor)
    inst_impl: { type: String, default: '' }, // Important Instructions (Right editor)
    
    // References
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    user_id: { type: Number, default: 0 },
    
    editor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    editor_id: { type: Number, default: 0 },
    
    featured_media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    media_id: { type: Number, default: 0 },
    
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
    state_id: { type: Number, default: 0 },
    
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    department_id: { type: Number, default: 0 },
    
    metadata: {
      m_title: { type: String, default: '' },
      m_desc: { type: String, default: '' },
      m_keys: { type: String, default: '' },
      canonical: { type: String, default: '' },
      robots: { type: mongoose.Schema.Types.Mixed, default: 1 },
      schema: { type: String, default: '' },
    },
    meta_id: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    strict: false,
  }
);

const AdmitCard = mongoose.models.AdmitCard || mongoose.model('AdmitCard', admitCardSchema);

export default AdmitCard;
