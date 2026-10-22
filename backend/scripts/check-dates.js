import mongoose from 'mongoose';
import connectDB from '../src/config/db.config.js';

async function run() {
  await connectDB();
  const col = mongoose.connection.collection('jobs');

  const onlyDatesLastDate = await col.countDocuments({
    $or: [{ app_ends: null }, { app_ends: '' }, { app_ends: { $exists: false } }],
    'dates.last_date': { $exists: true, $nin: [null, '', '0000-00-00'] }
  });
  console.log('Jobs with dates.last_date but missing/null app_ends:', onlyDatesLastDate);

  const sample = await col.find({
    $or: [{ app_ends: null }, { app_ends: '' }, { app_ends: { $exists: false } }],
    'dates.last_date': { $exists: true, $nin: [null, '', '0000-00-00'] }
  }).limit(5).toArray();
  sample.forEach(j => console.log(' - ', j.title, '| dates.last_date:', j.dates?.last_date));

  process.exit(0);
}

run().catch(console.error);
