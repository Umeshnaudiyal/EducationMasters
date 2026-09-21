import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function checkTodayExpiring() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const todayStr = '2026-09-14';

  const futureJobs = await db.collection('jobs').find({ app_ends: { $gte: todayStr } }).sort({ app_ends: 1 }).limit(10).toArray();
  console.log('--- JOBS EXPIRING FROM TODAY (' + todayStr + ') ONWARDS ---');
  console.log('Count:', futureJobs.length);
  for (const j of futureJobs) {
    console.log({ title: j.title, app_ends: j.app_ends, created_at: j.created_at });
  }

  await mongoose.disconnect();
}

checkTodayExpiring().catch(console.error);
