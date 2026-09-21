import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    active: { type: Boolean, default: true },
    name: { type: String, trim: true },
    email: { type: String, trim: true, index: true },
    phone: String,
    interest: String,
    vcode: String,
    hash: String,
    verified_at: Date,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const Subscriber = mongoose.model('Subscriber', subscriberSchema);
export default Subscriber;
