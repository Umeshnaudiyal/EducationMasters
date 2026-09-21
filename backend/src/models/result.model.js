import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    job_id: { type: Number, default: 0, index: true },
    title: {
      type: String,
      required: [true, 'Result post title is required.'],
      trim: true,
      minlength: [3, 'Result title must be at least 3 characters long.'],
    },
    slug: { type: String, required: true, index: true, trim: true },
    status: { type: String, default: 'publish', index: true },

    // Exam & Result Details
    post: { type: String, default: null }, // Job Post Name (Name of Exam)
    dept: { type: String, default: null }, // Department Name
    desig: { type: String, default: null }, // Post Name (Designation)
    result_status: { type: String, default: 'Declared / Out' }, // Result Status (Declared, Provisional, Out, etc.)

    // Dates
    exam_date: { type: String, default: null }, // Result Examination Date
    exam_rdate: { type: String, default: null }, // Result Release Date
    result_date: { type: String, default: null }, // Result Release Date alias

    // Links
    down_url: { type: String, default: null }, // Result Download URL
    site_url: { type: String, default: null }, // Official Website URL
    job_url: { type: String, default: null }, // Linked Job Post URL

    // Rich Text Content
    description: { type: String, default: '' }, // Overview / Summary
    inst_down: { type: String, default: '' }, // Download Instructions
    inst_impl: { type: String, default: '' }, // Important Instructions
    faq_content: { type: String, default: '' }, // FAQ Section

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

    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],

    metadata: {
      m_title: { type: String, default: '' },
      m_desc: { type: String, default: '' },
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

resultSchema.index({ created_at: -1, _id: -1 });

const Result = mongoose.models.Result || mongoose.model('Result', resultSchema);
export default Result;
