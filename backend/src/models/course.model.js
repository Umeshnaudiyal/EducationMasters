import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    user_id: { type: Number, default: 0 },
    name: { type: String, required: true, trim: true },
    slug: { type: String, index: true, trim: true },
    info: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Course = mongoose.model('Course', courseSchema);
export default Course;
