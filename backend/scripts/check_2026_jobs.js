import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function check2026Jobs() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const todayStr = '2026-01-01';

  const futureJobs = await db.collection('jobs').find({ app_ends: { $gte: todayStr } }).sort({ app_ends: 1 }).limit(10).toArray();
  console.log('--- 2026 / FUTURE JOBS COUNT:', futureJobs.length, '---');
  for (const j of futureJobs) {
    console.log({ title: j.title, app_ends: j.app_ends, created_at: j.created_at });
  }

  const allJobsWithEnds = await db.collection('jobs').find({ app_ends: { $exists: true, $ne: null, $ne: '' } }).sort({ created_at: -1 }).limit(15).toArray();
  console.log('\n--- JOBS SORTED BY CREATED_AT DESC (RECENT POSTS) ---');
  for (const j of allJobsWithEnds) {
    console.log({ title: j.title, app_ends: j.app_ends, created_at: j.created_at, status: j.status });
  }

  await mongoose.disconnect();
}

check2026Jobs().catch(console.error);
