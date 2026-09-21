import mongoose from 'mongoose';

const advertSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    active: { type: Boolean, default: true, index: true },
    media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    media_id: Number,
    location: String,
    name: { type: String, required: true, trim: true },
    slug: { type: String, index: true, trim: true },
    size: String,
    rel: String,
    hlink: String,
    code: String,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const Advert = mongoose.model('Advert', advertSchema);
export default Advert;
