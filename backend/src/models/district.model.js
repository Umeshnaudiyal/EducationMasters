import mongoose from 'mongoose';

const districtSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
    state_id: Number,
    name: { type: String, required: true, trim: true },
  },
  { timestamps: false }
);

const District = mongoose.model('District', districtSchema);
export default District;
