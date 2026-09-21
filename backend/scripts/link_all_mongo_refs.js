import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://invincibleumesh28_db_user:htx9Tc74HRdqE403@cluster28.ktzer3o.mongodb.net/educationmasters?retryWrites=true&w=majority';

async function linkAllObjectIdReferences() {
  console.log('===============================================================');
  console.log('[Full Ref Linking] Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('[Full Ref Linking] Connected successfully!\n');

  const db = mongoose.connection.db;

  // Helper to build sql_id -> _id lookup maps
  async function loadMap(colName) {
    const docs = await db.collection(colName).find({}, { projection: { _id: 1, sql_id: 1 } }).toArray();
    const map = new Map();
    for (const d of docs) {
      if (d.sql_id !== undefined && d.sql_id !== null) {
        map.set(d.sql_id, d._id);
      }
    }
    return map;
  }

  console.log('[1/8] Loading ID lookup maps from MongoDB...');
  const usersMap = await loadMap('users');
  const catMap = await loadMap('categories');
  const tagsMap = await loadMap('tags');
  const mediaMap = await loadMap('media');
  const statesMap = await loadMap('states');
  const districtsMap = await loadMap('districts');
  const countriesMap = await loadMap('countries');

  console.log(`  ✓ Lookup Maps Loaded: Users (${usersMap.size}), Categories (${catMap.size}), Tags (${tagsMap.size}), Media (${mediaMap.size}), States (${statesMap.size}), Districts (${districtsMap.size}), Countries (${countriesMap.size})\n`);

  // Helper for batch execution
  async function processCollection(colName, transformFn) {
    console.log(`[*] Processing ${colName.toUpperCase()} collection...`);
    const cursor = db.collection(colName).find({});
    let bulkOps = [];
    let count = 0;

    for await (const doc of cursor) {
      const updateFields = transformFn(doc);
      if (updateFields && Object.keys(updateFields).length > 0) {
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: updateFields }
          }
        });
      }

      count++;
      if (bulkOps.length >= 500) {
        await db.collection(colName).bulkWrite(bulkOps, { ordered: false });
        bulkOps = [];
      }
    }

    if (bulkOps.length > 0) {
      await db.collection(colName).bulkWrite(bulkOps, { ordered: false });
    }
    console.log(`  ✓ Linked ${count} documents in ${colName}.\n`);
  }

  // 1. INSTITUTES
  await processCollection('institutes', (doc) => {
    const fields = {};
    if (doc.user_id && usersMap.has(doc.user_id)) fields.author = usersMap.get(doc.user_id);
    if (doc.editor_id && usersMap.has(doc.editor_id)) fields.editor = usersMap.get(doc.editor_id);
    if (doc.approver_id && usersMap.has(doc.approver_id)) fields.approver = usersMap.get(doc.approver_id);
    if (doc.state_id && statesMap.has(doc.state_id)) fields.state = statesMap.get(doc.state_id);
    if (doc.district_id && districtsMap.has(doc.district_id)) fields.district = districtsMap.get(doc.district_id);
    return fields;
  });

  // 2. JOBS
  await processCollection('jobs', (doc) => {
    const fields = {};
    if (doc.user_id && usersMap.has(doc.user_id)) fields.author = usersMap.get(doc.user_id);
    if (doc.editor_id && usersMap.has(doc.editor_id)) fields.editor = usersMap.get(doc.editor_id);
    if (doc.approver_id && usersMap.has(doc.approver_id)) fields.approver = usersMap.get(doc.approver_id);
    if (doc.media_id && mediaMap.has(doc.media_id)) fields.featured_media = mediaMap.get(doc.media_id);
    if (doc.state_id && statesMap.has(doc.state_id)) fields.state = statesMap.get(doc.state_id);
    const catObjIds = (doc.category_ids || []).map(id => catMap.get(id)).filter(Boolean);
    if (catObjIds.length > 0) fields.categories = catObjIds;
    return fields;
  });

  // 3. QUESTIONS
  await processCollection('questions', (doc) => {
    const fields = {};
    if (doc.user_id && usersMap.has(doc.user_id)) fields.author = usersMap.get(doc.user_id);
    if (doc.editor_id && usersMap.has(doc.editor_id)) fields.editor = usersMap.get(doc.editor_id);
    if (doc.state_id && statesMap.has(doc.state_id)) fields.state = statesMap.get(doc.state_id);
    if (doc.district_id && districtsMap.has(doc.district_id)) fields.district = districtsMap.get(doc.district_id);
    return fields;
  });

  // 4. BLOGS
  await processCollection('blogs', (doc) => {
    const fields = {};
    if (doc.user_id && usersMap.has(doc.user_id)) fields.author = usersMap.get(doc.user_id);
    if (doc.editor_id && usersMap.has(doc.editor_id)) fields.editor = usersMap.get(doc.editor_id);
    if (doc.approver_id && usersMap.has(doc.approver_id)) fields.approver = usersMap.get(doc.approver_id);
    if (doc.media_id && mediaMap.has(doc.media_id)) fields.featured_media = mediaMap.get(doc.media_id);
    if (doc.state_id && statesMap.has(doc.state_id)) fields.state = statesMap.get(doc.state_id);
    const catObjIds = (doc.category_ids || []).map(id => catMap.get(id)).filter(Boolean);
    if (catObjIds.length > 0) fields.categories = catObjIds;
    const tagObjIds = (doc.tag_ids || []).map(id => tagsMap.get(id)).filter(Boolean);
    if (tagObjIds.length > 0) fields.tags = tagObjIds;
    return fields;
  });

  // 5. CATEGORIES
  await processCollection('categories', (doc) => {
    const fields = {};
    if (doc.parent_id && catMap.has(doc.parent_id)) fields.parent = catMap.get(doc.parent_id);
    if (doc.media_id && mediaMap.has(doc.media_id)) fields.featured_media = mediaMap.get(doc.media_id);
    return fields;
  });

  // 6. ADVERTS
  await processCollection('adverts', (doc) => {
    const fields = {};
    if (doc.media_id && mediaMap.has(doc.media_id)) fields.media = mediaMap.get(doc.media_id);
    return fields;
  });

  // 7. MEDIA
  await processCollection('media', (doc) => {
    const fields = {};
    if (doc.user_id && usersMap.has(doc.user_id)) fields.uploader = usersMap.get(doc.user_id);
    return fields;
  });

  console.log('===============================================================');
  console.log('  SUCCESS: ALL MONGOOSE OBJECTID REFERENCES LINKED IN ATLAS!  ');
  console.log('===============================================================\n');

  await mongoose.disconnect();
}

linkAllObjectIdReferences().catch(console.error);
