import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://invincibleumesh28_db_user:htx9Tc74HRdqE403@cluster28.ktzer3o.mongodb.net/educationmasters?retryWrites=true&w=majority';

async function check() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const plans = await mongoose.connection.db.collection('mocktestplans').find({}).toArray();
  console.log('=== MOCK TEST PLANS (Master Pool) ===');
  console.log(plans.map(p => ({ id: p._id, name: p.name, slug: p.slug, price: p.price, status: p.status })));

  const series = await mongoose.connection.db.collection('mocktestseries').find({}).toArray();
  console.log('=== MOCK TEST SERIES ===');
  console.log(series.map(s => ({ id: s._id, title: s.title, plans: s.plans })));

  await mongoose.disconnect();
  process.exit(0);
}

check();
