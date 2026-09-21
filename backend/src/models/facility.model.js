import mongoose from 'mongoose';

const facilitySchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, index: true, trim: true },
    info: { type: String, default: '' },
  },
  { timestamps: true }
);

const Facility = mongoose.model('Facility', facilitySchema);
export default Facility;
