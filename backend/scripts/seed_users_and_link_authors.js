import fs from 'fs';
import readline from 'readline';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://invincibleumesh28_db_user:htx9Tc74HRdqE403@cluster28.ktzer3o.mongodb.net/educationmasters?retryWrites=true&w=majority';
const SQL_PATH = 'd:/EducationMasters/bookmziw_edums (1).sql';

async function seedAndLink() {
  console.log('===============================================================');
  console.log('[Phase 1] Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected successfully!\n');

  const db = mongoose.connection.db;

  // 1. STREAM-PARSE USERS FROM SQL DUMP
  console.log('[Phase 2] Stream-parsing users from SQL dump...');
  const fileStream = fs.createReadStream(SQL_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let inUsers = false;
  let userRows = [];
  let totalParsed = 0;

  for await (const line of rl) {
    if (line.includes('INSERT INTO `users`')) {
      inUsers = true;
      continue;
    }
    if (inUsers) {
      const trimmed = line.trim();
      if (trimmed.startsWith('(')) {
        let rowStr = trimmed;
        if (rowStr.endsWith('),')) rowStr = rowStr.slice(1, -2);
        else if (rowStr.endsWith(');')) rowStr = rowStr.slice(1, -2);
        else if (rowStr.endsWith(')')) rowStr = rowStr.slice(1, -1);
        else if (rowStr.startsWith('(')) rowStr = rowStr.slice(1);

        const values = [];
        let curr = '';
        let inQuote = false;
        let escapeNext = false;

        for (let i = 0; i < rowStr.length; i++) {
          const ch = rowStr[i];
          if (escapeNext) {
            curr += ch;
            escapeNext = false;
          } else if (ch === '\\') {
            escapeNext = true;
          } else if (ch === "'" && !inQuote) {
            inQuote = true;
          } else if (ch === "'" && inQuote) {
            inQuote = false;
          } else if (ch === ',' && !inQuote) {
            values.push(curr.trim());
            curr = '';
          } else {
            curr += ch;
          }
        }
        values.push(curr.trim());

        if (values.length >= 14) {
          const cleanVal = (v) => {
            if (!v || v === 'NULL') return null;
            if (v.startsWith("'") && v.endsWith("'")) {
              return v.slice(1, -1).replace(/\\'/g, "'").replace(/\\r/g, "\r").replace(/\\n/g, "\n");
            }
            return v;
          };

          const sql_id = parseInt(values[0]);
          if (!isNaN(sql_id)) {
            userRows.push({
              sql_id,
              role_id: cleanVal(values[1]) ? parseInt(values[1]) : null,
              social_id: cleanVal(values[2]) ? parseInt(values[2]) : null,
              active: cleanVal(values[3]) ? parseInt(values[3]) : 1,
              backend: cleanVal(values[4]) ? parseInt(values[4]) : 0,
              gender: cleanVal(values[5]),
              name: cleanVal(values[6]) || 'Education Masters Team',
              nicename: cleanVal(values[7]),
              image: cleanVal(values[8]),
              email: cleanVal(values[9]),
              phone: cleanVal(values[10]),
              bio: cleanVal(values[13]),
              created_at: cleanVal(values[17]) || new Date().toISOString(),
              updated_at: cleanVal(values[18]) || new Date().toISOString()
            });
            totalParsed++;
          }
        }
      }
      if (trimmed.endsWith(';')) {
        inUsers = false;
      }
    }
  }

  console.log(`✓ Parsed ${totalParsed} total user records from SQL.\n`);

  // 2. BATCH UPSERT USERS INTO MONGODB
  console.log('[Phase 3] Bulk upserting users into MongoDB Atlas...');
  let userBulkOps = [];
  let upsertedCount = 0;

  for (const u of userRows) {
    userBulkOps.push({
      updateOne: {
        filter: { sql_id: u.sql_id },
        update: {
          $set: {
            sql_id: u.sql_id,
            name: u.name,
            nicename: u.nicename,
            image: u.image,
            email: u.email,
            phone: u.phone,
            bio: u.bio,
            active: u.active,
            role_id: u.role_id,
            backend: u.backend,
            gender: u.gender,
            updated_at: u.updated_at
          },
          $setOnInsert: {
            created_at: u.created_at
          }
        },
        upsert: true
      }
    });

    if (userBulkOps.length >= 1000) {
      await db.collection('users').bulkWrite(userBulkOps, { ordered: false });
      upsertedCount += userBulkOps.length;
      console.log(`  Processed ${upsertedCount} / ${totalParsed} users...`);
      userBulkOps = [];
    }
  }

  if (userBulkOps.length > 0) {
    await db.collection('users').bulkWrite(userBulkOps, { ordered: false });
    upsertedCount += userBulkOps.length;
  }
  console.log(`✓ Completed bulk upsert of ${upsertedCount} users in MongoDB Atlas.\n`);

  const finalUserCount = await db.collection('users').countDocuments();
  console.log(`Current Total Users in MongoDB: ${finalUserCount}\n`);

  // 3. BUILD ID LOOKUP MAP
  console.log('[Phase 4] Building sql_id -> _id lookup map...');
  const allUsers = await db.collection('users').find({}, { projection: { _id: 1, sql_id: 1 } }).toArray();
  const userMap = new Map();
  for (const u of allUsers) {
    if (u.sql_id !== undefined && u.sql_id !== null) {
      userMap.set(u.sql_id, u._id);
    }
  }
  console.log(`✓ Loaded map with ${userMap.size} users.\n`);

  // 4. LINK AUTHORS IN BLOGS
  console.log('[Phase 5] Linking authors in BLOGS...');
  const blogCursor = db.collection('blogs').find({ user_id: { $ne: null } }, { projection: { _id: 1, user_id: 1, author: 1 } });
  let blogBulkOps = [];
  let blogLinked = 0;
  let blogTotal = 0;

  for await (const b of blogCursor) {
    blogTotal++;
    const authorObjId = userMap.get(b.user_id);
    if (authorObjId && (!b.author || String(b.author) !== String(authorObjId))) {
      blogBulkOps.push({
        updateOne: {
          filter: { _id: b._id },
          update: { $set: { author: authorObjId } }
        }
      });
      blogLinked++;
    }

    if (blogBulkOps.length >= 1000) {
      await db.collection('blogs').bulkWrite(blogBulkOps, { ordered: false });
      blogBulkOps = [];
    }
  }

  if (blogBulkOps.length > 0) {
    await db.collection('blogs').bulkWrite(blogBulkOps, { ordered: false });
  }
  console.log(`✓ Scanned ${blogTotal} blogs, newly updated ${blogLinked} blogs with author ObjectIds.\n`);

  // 5. LINK AUTHORS IN JOBS
  console.log('[Phase 6] Linking authors in JOBS...');
  const jobCursor = db.collection('jobs').find({ user_id: { $ne: null } }, { projection: { _id: 1, user_id: 1, author: 1 } });
  let jobBulkOps = [];
  let jobLinked = 0;
  let jobTotal = 0;

  for await (const j of jobCursor) {
    jobTotal++;
    const authorObjId = userMap.get(j.user_id);
    if (authorObjId && (!j.author || String(j.author) !== String(authorObjId))) {
      jobBulkOps.push({
        updateOne: {
          filter: { _id: j._id },
          update: { $set: { author: authorObjId } }
        }
      });
      jobLinked++;
    }

    if (jobBulkOps.length >= 500) {
      await db.collection('jobs').bulkWrite(jobBulkOps, { ordered: false });
      jobBulkOps = [];
    }
  }

  if (jobBulkOps.length > 0) {
    await db.collection('jobs').bulkWrite(jobBulkOps, { ordered: false });
  }
  console.log(`✓ Scanned ${jobTotal} jobs, newly updated ${jobLinked} jobs with author ObjectIds.\n`);

  // 6. VERIFICATION
  console.log('[Phase 7] Verifying updated author linkages in MongoDB...');
  const blogsWithAuthor = await db.collection('blogs').countDocuments({ author: { $ne: null } });
  const jobsWithAuthor = await db.collection('jobs').countDocuments({ author: { $ne: null } });
  console.log(`✓ Blogs with linked author: ${blogsWithAuthor} / 18,611`);
  console.log(`✓ Jobs with linked author: ${jobsWithAuthor} / 1,170\n`);

  const sampleBlog = await db.collection('blogs').findOne({ slug: 'uttarakhand-current-affairs-november-40-important-updates' });
  if (sampleBlog?.author) {
    const authorDoc = await db.collection('users').findOne({ _id: sampleBlog.author });
    console.log('Sample Blog ("uttarakhand-current-affairs-november-40-important-updates"):');
    console.log(`  Author Name: ${authorDoc?.name}`);
    console.log(`  Author Nicename: ${authorDoc?.nicename}`);
    console.log(`  Author Image: ${authorDoc?.image}`);
    console.log(`  Author Bio: ${authorDoc?.bio?.substring(0, 80)}...`);
  }

  await mongoose.disconnect();
  console.log('\n===============================================================');
  console.log('Migration & Author Relinking Completed Successfully!');
  console.log('===============================================================');
}

seedAndLink().catch(console.error);
