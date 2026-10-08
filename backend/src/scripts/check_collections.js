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
  console.log('Collections:', cols.map(c => c.name));

  for (const c of cols) {
    if (c.name.includes('mock') || c.name.includes('plan')) {
      const count = await mongoose.connection.db.collection(c.name).countDocuments();
      console.log(`Collection ${c.name} has ${count} docs`);
      const docs = await mongoose.connection.db.collection(c.name).find({}).toArray();
      console.log(`Sample from ${c.name}:`, JSON.stringify(docs, null, 2));
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

check();
