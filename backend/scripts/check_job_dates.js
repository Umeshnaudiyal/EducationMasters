import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function checkJobDates() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const recentJobs = await db.collection('jobs').find({}).sort({ createdAt: -1 }).limit(5).toArray();
  console.log('--- RECENT JOBS SAMPLES ---');
  for (const j of recentJobs) {
    console.log({
      title: j.title,
      app_ends: j.app_ends,
      created_at: j.created_at,
      createdAt: j.createdAt,
      status: j.status,
      dates: j.dates
    });
  }

  const expiringJobs = await db.collection('jobs').find({ app_ends: { $exists: true, $ne: null, $ne: '' } }).sort({ app_ends: 1 }).limit(10).toArray();
  console.log('\n--- EXPIRING JOBS SAMPLES ---');
  for (const j of expiringJobs) {
    console.log({
      title: j.title,
      app_ends: j.app_ends,
      dates: j.dates
    });
  }

  await mongoose.disconnect();
}

checkJobDates().catch(console.error);
