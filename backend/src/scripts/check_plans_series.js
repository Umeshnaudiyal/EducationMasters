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
  const cols = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections list:', cols.map(c => c.name));

  const planCol = cols.find(c => c.name.includes('plan'))?.name;
  if (planCol) {
    const plans = await mongoose.connection.db.collection(planCol).find({}).toArray();
    console.log(`Plans in ${planCol}:`, plans);
  }

  const seriesCol = cols.find(c => c.name.includes('series'))?.name;
  if (seriesCol) {
    const series = await mongoose.connection.db.collection(seriesCol).find({}).toArray();
    console.log(`Series in ${seriesCol}:`, series.map(s => ({ id: s._id, title: s.title, plans: s.plans })));
  }

  await mongoose.disconnect();
  process.exit(0);
}

check();
