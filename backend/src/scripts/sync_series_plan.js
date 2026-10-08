import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoUri = process.env.MONGODB_URI;

async function sync() {
  await mongoose.connect(mongoUri);

  const proPass = await mongoose.connection.db.collection('mock_test_plans').findOne({ slug: 'pro-pass' });
  if (proPass) {
    const res = await mongoose.connection.db.collection('mock_test_series').updateMany(
      {},
      {
        $set: {
          plans: [
            {
              name: proPass.name,
              price: proPass.price,
              original_price: proPass.original_price,
              validity: proPass.validity,
              validity_days: proPass.validity_days,
              is_free: proPass.is_free,
              is_popular: proPass.is_popular,
              badge: proPass.badge,
              tagline: proPass.tagline,
              features: proPass.features,
              button_text: proPass.button_text,
            }
          ]
        }
      }
    );
    console.log(`Updated ${res.modifiedCount} series to use master Pro Pass plan.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

sync();
