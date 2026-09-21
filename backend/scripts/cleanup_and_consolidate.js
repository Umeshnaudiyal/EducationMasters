import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://invincibleumesh28_db_user:htx9Tc74HRdqE403@cluster28.ktzer3o.mongodb.net/educationmasters?retryWrites=true&w=majority';

async function finalCleanUp() {
  console.log('[Atlas Cleanup] Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('[Atlas Cleanup] Connected successfully!');

  const db = mongoose.connection.db;

  // The 8 Core Clean MongoDB Collections to keep:
  const allowedCoreCollections = new Set([
    'blogs',
    'jobs',
    'questions',
    'institutes',
    'users',
    'categories',
    'adverts',
    'subscribers',
    'media',
    'districts',
    'states'
  ]);

  const allCols = await db.listCollections().toArray();
  console.log(`\nFound ${allCols.length} total collections in MongoDB Atlas.`);

  for (const c of allCols) {
    if (!allowedCoreCollections.has(c.name)) {
      await db.collection(c.name).drop().catch(() => {});
      console.log(`  ✓ Dropped relational pivot collection: [${c.name}]`);
    }
  }

  console.log('\n================ CLEAN MONGODB ATLAS DATABASE ================');
  const finalCols = await db.listCollections().toArray();
  console.log(`Final Active Collections (${finalCols.length}):`);
  for (const c of finalCols) {
    const cnt = await db.collection(c.name).countDocuments();
    console.log(`  ➜ [${c.name.padEnd(20)}]: ${cnt} documents`);
  }
  console.log('=============================================================\n');

  await mongoose.disconnect();
  console.log('[Atlas Cleanup] Disconnected cleanly.');
}

finalCleanUp().catch(console.error);
