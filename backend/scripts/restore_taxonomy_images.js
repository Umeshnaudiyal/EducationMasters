import fs from 'fs';
import readline from 'readline';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const sqlFilePath = 'D:\\EducationMasters\\bookmziw_edums (1).sql';

function cleanVal(v) {
  if (v === undefined || v === null) return null;
  v = String(v).trim();
  if (v.toUpperCase() === 'NULL') return null;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  return v;
}

function parseSqlTupleValues(str) {
  str = str.trim();
  if (str.startsWith('(')) str = str.substring(1);
  if (str.endsWith(');')) str = str.slice(0, -2);
  else if (str.endsWith('),')) str = str.slice(0, -2);
  else if (str.endsWith(')')) str = str.slice(0, -1);

  const values = [];
  let inStr = false;
  let qChar = null;
  let escaped = false;
  let cur = '';

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (escaped) {
      cur += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (!inStr && (ch === "'" || ch === '"')) {
      inStr = true;
      qChar = ch;
      continue;
    }
    if (inStr && ch === qChar) {
      if (i + 1 < str.length && str[i + 1] === qChar) {
        cur += qChar;
        i++;
      } else {
        inStr = false;
        qChar = null;
      }
      continue;
    }
    if (inStr) {
      cur += ch;
      continue;
    }
    if (ch === ',') {
      values.push(cleanVal(cur));
      cur = '';
      continue;
    }
    cur += ch;
  }
  values.push(cleanVal(cur));
  return values;
}

async function restoreTaxonomyImages() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/educationmasters';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    console.log('Connected to MongoDB');

    // 1. Build Media Map from MongoDB media collection
    console.log('Loading media collection...');
    const mediaDocs = await db.collection('media').find({}).toArray();
    const mediaMap = new Map();

    mediaDocs.forEach((m) => {
      if (m.sql_id) {
        let filePath = m.file || '';
        if (!filePath && m.path && m.name) {
          const cleanPath = m.path.endsWith('/') ? m.path.slice(0, -1) : m.path;
          filePath = `${cleanPath}/${m.name}`;
        }
        if (!filePath && m.url) {
          filePath = m.url;
        }
        if (filePath) {
          mediaMap.set(Number(m.sql_id), filePath);
        }
      }
    });

    console.log(`Loaded ${mediaMap.size} media file mappings.`);

    // 2. Parse SQL dump for entity-to-media relations
    console.log('Streaming SQL dump to extract media_id mappings...');
    const fileStream = fs.createReadStream(sqlFilePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const targetTables = ['examinations', 'subjects', 'topics', 'topic_groups', 'state_data'];
    const sqlEntities = {
      examinations: [],
      subjects: [],
      topics: [],
      topic_groups: [],
      state_data: [],
    };

    let currentInsertTable = null;
    let currentCols = [];

    for await (const line of rl) {
      const trimmed = line.trim();

      if (trimmed.startsWith('INSERT INTO')) {
        const match = trimmed.match(/^INSERT INTO `([^`]+)` \(([^)]+)\) VALUES/i);
        if (match) {
          currentInsertTable = match[1];
          currentCols = match[2].split(',').map((c) => c.replace(/[`\s]/g, ''));
        }
        continue;
      }

      if (currentInsertTable && targetTables.includes(currentInsertTable) && trimmed.startsWith('(')) {
        const vals = parseSqlTupleValues(trimmed);
        const row = {};
        currentCols.forEach((col, idx) => {
          row[col] = vals[idx] !== undefined ? vals[idx] : null;
        });
        sqlEntities[currentInsertTable].push(row);
      }
    }

    console.log('Extracted SQL entity counts:');
    for (const [k, v] of Object.entries(sqlEntities)) {
      console.log(` - ${k}: ${v.length}`);
    }

    // 3. Update Examinations
    let examUpdated = 0;
    for (const e of sqlEntities.examinations) {
      const sqlId = Number(e.id);
      const mediaId = Number(e.media_id);
      const filePath = mediaId ? mediaMap.get(mediaId) : null;
      if (filePath) {
        await db.collection('examinations').updateOne(
          { $or: [{ sql_id: sqlId }, { name: e.name }, { slug: e.slug }] },
          { $set: { image: filePath } }
        );
        examUpdated++;
        console.log(`[Exam] Updated "${e.name}" with image: ${filePath}`);
      }
    }
    console.log(`\nUpdated ${examUpdated} Examinations with full image URLs.`);

    // 4. Update Subjects
    let subjectUpdated = 0;
    for (const s of sqlEntities.subjects) {
      const sqlId = Number(s.id);
      const mediaId = Number(s.media_id);
      const filePath = mediaId ? mediaMap.get(mediaId) : null;
      if (filePath) {
        await db.collection('subjects').updateOne(
          { $or: [{ sql_id: sqlId }, { name: s.name }, { slug: s.slug }] },
          { $set: { image: filePath } }
        );
        subjectUpdated++;
        console.log(`[Subject] Updated "${s.name}" with image: ${filePath}`);
      }
    }
    console.log(`Updated ${subjectUpdated} Subjects with full image URLs.`);

    // 5. Update Topics
    let topicUpdated = 0;
    for (const t of sqlEntities.topics) {
      const sqlId = Number(t.id);
      const mediaId = Number(t.media_id);
      const filePath = mediaId ? mediaMap.get(mediaId) : null;
      if (filePath) {
        await db.collection('topics').updateOne(
          { $or: [{ sql_id: sqlId }, { name: t.name }, { slug: t.slug }] },
          { $set: { image: filePath } }
        );
        topicUpdated++;
        console.log(`[Topic] Updated "${t.name}" with image: ${filePath}`);
      }
    }
    console.log(`Updated ${topicUpdated} Topics with full image URLs.`);

    // 6. Update Topic Groups
    let groupUpdated = 0;
    for (const g of sqlEntities.topic_groups) {
      const sqlId = Number(g.id);
      const mediaId = Number(g.media_id);
      const filePath = mediaId ? mediaMap.get(mediaId) : null;
      if (filePath) {
        await db.collection('topic_groups').updateOne(
          { $or: [{ sql_id: sqlId }, { name: g.name }, { slug: g.slug }] },
          { $set: { image: filePath } }
        );
        groupUpdated++;
        console.log(`[TopicGroup] Updated "${g.name}" with image: ${filePath}`);
      }
    }
    console.log(`Updated ${groupUpdated} Topic Groups with full image URLs.`);

    // 7. Update States from state_data if media_id present
    let stateUpdated = 0;
    for (const sd of sqlEntities.state_data) {
      const stateId = Number(sd.state_id);
      const mediaId = Number(sd.media_id);
      const filePath = mediaId ? mediaMap.get(mediaId) : null;
      if (filePath && stateId) {
        await db.collection('states').updateOne(
          { $or: [{ sql_id: stateId }, { state_number: String(stateId).padStart(2, '0') }] },
          { $set: { image: filePath } }
        );
        stateUpdated++;
        console.log(`[State] Updated state #${stateId} with image: ${filePath}`);
      }
    }
    console.log(`Updated ${stateUpdated} States with full image URLs.`);

    console.log('\n======================================================');
    console.log(' ALL TAXONOMY IMAGES RESTORED SUCCESSFULLY WITH REAL FILENAMES!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Error restoring taxonomy images:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

restoreTaxonomyImages();
