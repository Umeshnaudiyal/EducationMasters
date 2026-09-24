import fs from 'fs';
import readline from 'readline';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { cleanHtmlContent } from '../src/utils/cleanHtml.js';
dotenv.config();

const sqlFilePath = 'D:\\EducationMasters\\bookmziw_edums (1).sql';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://invincibleumesh28_db_user:htx9Tc74HRdqE403@cluster28.ktzer3o.mongodb.net/educationmasters?retryWrites=true&w=majority';

// Parse SQL tuple values
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

function cleanVal(v) {
  v = v.trim();
  if (v.toUpperCase() === 'NULL') return null;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  return v;
}

async function migrateStateData() {
  console.log('[1/4] Reading and parsing SQL dump for state tables...');
  
  const tablesToExtract = ['states', 'state_data', 'metadata', 'metadata_hindi', 'media'];
  const extractedData = {
    states: [],
    state_data: [],
    metadata: [],
    metadata_hindi: [],
    media: [],
  };

  const fileStream = fs.createReadStream(sqlFilePath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let currentTable = null;
  let currentCols = [];
  let inInsert = false;
  let tupleBuf = '';
  let inStr = false;
  let qChar = null;
  let escaped = false;

  for await (const line of rl) {
    const trimmed = line.trim();

    if (!inInsert) {
      if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*')) continue;

      const insertMatch = line.match(/^INSERT INTO `?([a-zA-Z0-9_]+)`?\s*\(([^)]+)\)\s*VALUES/i);
      if (insertMatch) {
        const tbl = insertMatch[1].toLowerCase();
        if (tablesToExtract.includes(tbl)) {
          currentTable = tbl;
          currentCols = insertMatch[2].split(',').map((c) => c.replace(/[`\s]/g, ''));
          inInsert = true;
          tupleBuf = '';
          inStr = false;
          qChar = null;
          escaped = false;

          const valSegment = line.substring(line.indexOf('VALUES') + 6);
          processSegment(valSegment);
        }
      }
    } else {
      processSegment('\n' + line);
    }
  }

  function processSegment(segment) {
    for (let i = 0; i < segment.length; i++) {
      const ch = segment[i];
      tupleBuf += ch;

      if (escaped) {
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
        if (i + 1 < segment.length && segment[i + 1] === qChar) {
          tupleBuf += qChar;
          i++;
        } else {
          inStr = false;
          qChar = null;
        }
        continue;
      }

      if (!inStr) {
        const isEndStmt = ch === ';';
        const isEndTuple = ch === ',' || isEndStmt;

        if (isEndTuple) {
          const rawTuple = tupleBuf.trim();
          if (rawTuple.startsWith('(') && (rawTuple.endsWith('),') || rawTuple.endsWith(');') || rawTuple.endsWith(')'))) {
            const values = parseSqlTupleValues(rawTuple);
            const doc = {};
            currentCols.forEach((col, idx) => {
              doc[col] = values[idx] !== undefined ? values[idx] : null;
            });
            extractedData[currentTable].push(doc);
            tupleBuf = '';

            if (isEndStmt) {
              inInsert = false;
              currentTable = null;
              currentCols = [];
              tupleBuf = '';
            }
          }
        }
      }
    }
  }

  console.log(`[2/4] Extracted counts:`);
  console.log(`  - states: ${extractedData.states.length}`);
  console.log(`  - state_data: ${extractedData.state_data.length}`);
  console.log(`  - metadata: ${extractedData.metadata.length}`);
  console.log(`  - metadata_hindi: ${extractedData.metadata_hindi.length}`);
  console.log(`  - media: ${extractedData.media.length}`);

  // Build lookup maps
  const stateDataByStateId = new Map();
  for (const sd of extractedData.state_data) {
    if (sd.state_id) {
      stateDataByStateId.set(sd.state_id, sd);
    }
  }

  const metadataById = new Map();
  for (const m of extractedData.metadata) {
    if (m.id) metadataById.set(m.id, m);
  }

  const metadataHindiById = new Map();
  for (const mh of extractedData.metadata_hindi) {
    if (mh.id) metadataHindiById.set(mh.id, mh);
  }

  const mediaById = new Map();
  for (const med of extractedData.media) {
    if (med.id) mediaById.set(med.id, med);
  }

  // Connect to MongoDB Atlas
  console.log('\n[3/4] Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected successfully!');

  const State = mongoose.models.State || mongoose.model('State', new mongoose.Schema({}, { strict: false }), 'states');

  const mongoStates = await State.find({});
  console.log(`Found ${mongoStates.length} existing State documents in MongoDB.`);

  let updatedCount = 0;

  for (const mongoState of mongoStates) {
    const sqlId = mongoState.sql_id || mongoState.id;
    let sData = stateDataByStateId.get(sqlId);

    // Fallback match by slug or name if sqlId doesn't match
    if (!sData) {
      const matchedSqlState = extractedData.states.find(
        (s) => s.slug === mongoState.slug || s.name?.toLowerCase() === mongoState.name?.toLowerCase()
      );
      if (matchedSqlState) {
        sData = stateDataByStateId.get(matchedSqlState.id);
      }
    }

    if (sData) {
      // Find media
      let imagePath = mongoState.image || '';
      const mediaId = sData.fimg_id || sData.media_id || sData.jimg_id;
      if (mediaId && mediaById.has(mediaId)) {
        const med = mediaById.get(mediaId);
        imagePath = med.path || med.file || med.name || imagePath;
      }

      // Find SEO metadata
      const meta = sData.meta_id ? metadataById.get(sData.meta_id) : null;
      const metah = sData.metah_id ? metadataHindiById.get(sData.metah_id) : null;

      const updateFields = {
        state_number: sData.number ? String(sData.number).trim() : (mongoState.state_number || ''),
        capital: sData.capital ? String(sData.capital).trim() : (mongoState.capital || ''),
        governor: sData.governor ? String(sData.governor).trim() : (mongoState.governor || ''),
        chief_minister: sData.minister ? String(sData.minister).trim() : (mongoState.chief_minister || ''),
        land_area: sData.area ? String(sData.area).trim() : (mongoState.land_area || ''),
        population: sData.population ? String(sData.population).trim() : (mongoState.population || ''),
        about_state: sData.content ? cleanHtmlContent(String(sData.content)) : (cleanHtmlContent(mongoState.about_state) || ''),
        description: sData.description ? cleanHtmlContent(String(sData.description)) : (cleanHtmlContent(mongoState.description) || ''),
        description_hi: sData.desch ? cleanHtmlContent(String(sData.desch)) : (cleanHtmlContent(mongoState.description_hi) || ''),
        job_description: sData.descj ? cleanHtmlContent(String(sData.descj)) : (cleanHtmlContent(mongoState.job_description) || ''),
        image: imagePath || mongoState.image || '',
        seo: {
          allow_indexing: meta ? meta.robots !== 0 : true,
          meta_title: meta?.m_title || '',
          meta_keywords: meta?.m_keys || '',
          meta_description: meta?.m_desc || '',
        },
        seo_hi: {
          meta_title: metah?.m_title || '',
          meta_keywords: metah?.m_keys || '',
          meta_description: metah?.m_desc || '',
        },
      };

      await State.updateOne({ _id: mongoState._id }, { $set: updateFields });
      console.log(`✓ Migrated data for [${mongoState.name}] (${mongoState.slug}) -> Capital: ${updateFields.capital}, CM: ${updateFields.chief_minister}, Gov: ${updateFields.governor}, No: ${updateFields.state_number}`);
      updatedCount++;
    } else {
      console.log(`⚠️ No state_data found in SQL dump for [${mongoState.name}] (${mongoState.slug})`);
    }
  }

  console.log(`\n[4/4] Migration Complete! Updated ${updatedCount} / ${mongoStates.length} states in MongoDB.`);

  // Sample verification
  const sample = await State.findOne({ slug: 'andhra-pradesh' }).lean();
  console.log('\n--- VERIFICATION SAMPLE: Andhra Pradesh ---');
  console.log({
    name: sample.name,
    slug: sample.slug,
    state_number: sample.state_number,
    capital: sample.capital,
    governor: sample.governor,
    chief_minister: sample.chief_minister,
    land_area: sample.land_area,
    population: sample.population,
    about_state_length: sample.about_state?.length,
    description_en_length: sample.description?.length,
    description_hi_length: sample.description_hi?.length,
    job_description_length: sample.job_description?.length,
    seo: sample.seo,
    seo_hi: sample.seo_hi,
  });

  await mongoose.disconnect();
  console.log('Disconnected cleanly from MongoDB.');
}

migrateStateData().catch((err) => {
  console.error('[Migration Error]', err);
  process.exit(1);
});
