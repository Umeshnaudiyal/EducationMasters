import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoUri = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(mongoUri);
  const series = await mongoose.connection.db.collection('mock_test_series').find({}).toArray();
  console.log('Series plans full:', JSON.stringify(series.map(s => ({ id: s._id, title: s.title, plans: s.plans })), null, 2));

  await mongoose.disconnect();
  process.exit(0);
}

check();
