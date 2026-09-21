import mongoose from 'mongoose';

const countrySchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true },
    slug: { type: String, index: true, trim: true },
    phone_code: String,
  },
  { timestamps: true }
);

const Country = mongoose.model('Country', countrySchema);
export default Country;
