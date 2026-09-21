import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://invincibleumesh28_db_user:htx9Tc74HRdqE403@cluster28.ktzer3o.mongodb.net/educationmasters?retryWrites=true&w=majority';

async function populateObjectIdReferences() {
  console.log('[Ref Linking] Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('[Ref Linking] Connected successfully!');

  const db = mongoose.connection.db;

  // Build sql_id -> ObjectId lookup maps
  async function loadObjectIdMap(colName) {
    const docs = await db.collection(colName).find({}, { projection: { _id: 1, sql_id: 1 } }).toArray();
    const map = new Map();
    for (const d of docs) {
      if (d.sql_id !== undefined && d.sql_id !== null) {
        map.set(d.sql_id, d._id);
      }
    }
    return map;
  }

  console.log('\n[1/5] Building sql_id -> MongoDB ObjectId lookup maps...');
  const userObjIdMap = await loadObjectIdMap('users');
  const catObjIdMap = await loadObjectIdMap('categories');
  const tagObjIdMap = await loadObjectIdMap('tags');
  const mediaObjIdMap = await loadObjectIdMap('media');
  const stateObjIdMap = await loadObjectIdMap('states');
  const districtObjIdMap = await loadObjectIdMap('districts');

  console.log(`  ✓ Loaded Users: ${userObjIdMap.size}, Categories: ${catObjIdMap.size}, Tags: ${tagObjIdMap.size}, Media: ${mediaObjIdMap.size}, States: ${stateObjIdMap.size}, Districts: ${districtObjIdMap.size}`);

  // ==========================================
  // LINK BLOGS OBJECTID REFERENCES
  // ==========================================
  console.log('\n[2/4] Linking ObjectId references in BLOGS collection...');
  const blogsCursor = db.collection('blogs').find({});
  let blogBulkOps = [];
  let blogCount = 0;

  for await (const b of blogsCursor) {
    const authorObjId = b.user_id ? userObjIdMap.get(b.user_id) : null;
    const catObjIds = (b.category_ids || []).map(id => catObjIdMap.get(id)).filter(Boolean);
    const tagObjIds = (b.tag_ids || []).map(id => tagObjIdMap.get(id)).filter(Boolean);
    const mediaObjId = b.media_id ? mediaObjIdMap.get(b.media_id) : null;

    const updateDoc = {};
    if (authorObjId) updateDoc.author = authorObjId;
    if (catObjIds.length > 0) updateDoc.categories = catObjIds;
    if (tagObjIds.length > 0) updateDoc.tags = tagObjIds;
    if (mediaObjId) updateDoc.featured_media = mediaObjId;

    if (Object.keys(updateDoc).length > 0) {
      blogBulkOps.push({
        updateOne: {
          filter: { _id: b._id },
          update: { $set: updateDoc }
        }
      });
    }

    blogCount++;
    if (blogBulkOps.length >= 500) {
      await db.collection('blogs').bulkWrite(blogBulkOps, { ordered: false });
      blogBulkOps = [];
    }
  }

  if (blogBulkOps.length > 0) {
    await db.collection('blogs').bulkWrite(blogBulkOps, { ordered: false });
    blogBulkOps = [];
  }
  console.log(`  ✓ Linked Mongoose ObjectId references across ${blogCount} Blog documents.`);

  // ==========================================
  // LINK JOBS OBJECTID REFERENCES
  // ==========================================
  console.log('\n[3/4] Linking ObjectId references in JOBS collection...');
  const jobsCursor = db.collection('jobs').find({});
  let jobBulkOps = [];
  let jobCount = 0;

  for await (const j of jobsCursor) {
    const catObjIds = (j.category_ids || []).map(id => catObjIdMap.get(id)).filter(Boolean);
    if (catObjIds.length > 0) {
      jobBulkOps.push({
        updateOne: {
          filter: { _id: j._id },
          update: { $set: { categories: catObjIds } }
        }
      });
    }

    jobCount++;
    if (jobBulkOps.length >= 500) {
      await db.collection('jobs').bulkWrite(jobBulkOps, { ordered: false });
      jobBulkOps = [];
    }
  }

  if (jobBulkOps.length > 0) {
    await db.collection('jobs').bulkWrite(jobBulkOps, { ordered: false });
    jobBulkOps = [];
  }
  console.log(`  ✓ Linked Mongoose ObjectId references across ${jobCount} Job documents.`);

  // ==========================================
  // LINK QUESTIONS OBJECTID REFERENCES
  // ==========================================
  console.log('\n[4/4] Linking ObjectId references in QUESTIONS collection...');
  const questionsCursor = db.collection('questions').find({});
  let qBulkOps = [];
  let qCount = 0;

  for await (const q of questionsCursor) {
    const authorObjId = q.user_id ? userObjIdMap.get(q.user_id) : null;
    if (authorObjId) {
      qBulkOps.push({
        updateOne: {
          filter: { _id: q._id },
          update: { $set: { author: authorObjId } }
        }
      });
    }

    qCount++;
    if (qBulkOps.length >= 500) {
      await db.collection('questions').bulkWrite(qBulkOps, { ordered: false });
      qBulkOps = [];
    }
  }

  if (qBulkOps.length > 0) {
    await db.collection('questions').bulkWrite(qBulkOps, { ordered: false });
    qBulkOps = [];
  }
  // ==========================================
  // LINK DISTRICTS STATE OBJECTID REFERENCES
  // ==========================================
  console.log('\n[5/5] Linking State ObjectId references in DISTRICTS collection...');
  const distCursor = db.collection('districts').find({});
  let distBulkOps = [];
  let distCount = 0;

  for await (const d of distCursor) {
    const stateObjId = d.state_id ? stateObjIdMap.get(d.state_id) : null;
    if (stateObjId) {
      distBulkOps.push({
        updateOne: {
          filter: { _id: d._id },
          update: { $set: { state: stateObjId } }
        }
      });
    }

    distCount++;
    if (distBulkOps.length >= 500) {
      await db.collection('districts').bulkWrite(distBulkOps, { ordered: false });
      distBulkOps = [];
    }
  }

  if (distBulkOps.length > 0) {
    await db.collection('districts').bulkWrite(distBulkOps, { ordered: false });
    distBulkOps = [];
  }
  console.log(`  ✓ Linked Mongoose State ObjectId references across ${distCount} District documents.`);

  console.log('\n================ MONGOOSE REF LINKING COMPLETE ================');
  console.log('All documents in MongoDB Atlas now contain real Mongoose ObjectId references!');
  console.log('You can now use .populate("author"), .populate("categories"), .populate("tags"), .populate("state") directly!');
  console.log('===============================================================\n');

  await mongoose.disconnect();
}

populateObjectIdReferences().catch(console.error);
