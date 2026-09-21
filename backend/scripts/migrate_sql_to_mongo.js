import fs from 'fs';
import readline from 'readline';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const sqlFilePath = 'D:\\EducationMasters\\bookmziw_edums (1).sql';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://invincibleumesh28_db_user:htx9Tc74HRdqE403@cluster28.ktzer3o.mongodb.net/educationmasters?retryWrites=true&w=majority';

// Parse a single SQL tuple string like "(1, 'val', 3)" into an array of values
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

async function startMigration() {
  console.log(`[Migration] Connecting to MongoDB Atlas...`);
  await mongoose.connect(MONGO_URI);
  console.log('[Migration] Connected successfully to MongoDB Atlas!');

  const db = mongoose.connection.db;

  const fileStream = fs.createReadStream(sqlFilePath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const tableCounts = {};

  let currentInsertTable = null;
  let currentCols = [];
  let inInsert = false;

  let tupleBuf = '';
  let inStr = false;
  let qChar = null;
  let escaped = false;

  let batchDocs = [];

  const flushBatch = async (tName) => {
    if (!tName || batchDocs.length === 0) return;
    const ops = batchDocs.map(doc => ({ insertOne: { document: doc } }));
    try {
      await db.collection(tName).bulkWrite(ops, { ordered: false });
      tableCounts[tName] = (tableCounts[tName] || 0) + batchDocs.length;
    } catch (err) {
      if (err.insertedCount) {
        tableCounts[tName] = (tableCounts[tName] || 0) + err.insertedCount;
      }
    }
    batchDocs = [];
  };

  let lineCount = 0;
  console.log('[Migration] Processing 207,099 SQL lines into MongoDB Atlas...');

  for await (const line of rl) {
    lineCount++;
    if (lineCount % 50000 === 0) {
      console.log(`[Progress] Streamed ${lineCount} / 207,099 lines...`);
    }

    const trimmed = line.trim();

    if (!inInsert) {
      if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*')) continue;

      const insertMatch = line.match(/^INSERT INTO `?([a-zA-Z0-9_]+)`?\s*\(([^)]+)\)\s*VALUES/i);
      if (insertMatch) {
        currentInsertTable = insertMatch[1];
        currentCols = insertMatch[2].split(',').map(c => c.replace(/[`\s]/g, ''));
        inInsert = true;
        tupleBuf = '';
        inStr = false;
        qChar = null;
        escaped = false;

        const valSegment = line.substring(line.indexOf('VALUES') + 6);
        await processSegment(valSegment);
      }
    } else {
      await processSegment('\n' + line);
    }
  }

  async function processSegment(segment) {
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
              doc[col === 'id' ? 'sql_id' : col] = values[idx] !== undefined ? values[idx] : null;
            });
            batchDocs.push(doc);
            tupleBuf = '';

            if (batchDocs.length >= 250) {
              await flushBatch(currentInsertTable);
            }

            if (isEndStmt) {
              await flushBatch(currentInsertTable);
              inInsert = false;
              currentInsertTable = null;
              currentCols = [];
              tupleBuf = '';
            }
          }
        }
      }
    }
  }

  if (currentInsertTable && batchDocs.length > 0) {
    await flushBatch(currentInsertTable);
  }

  console.log('\n================ FULL MIGRATION COMPLETE ================');
  for (const [tName, count] of Object.entries(tableCounts)) {
    console.log(`Collection [${tName}]: ${count} documents imported`);
  }
  console.log('=========================================================\n');

  await mongoose.disconnect();
  console.log('[Migration] Disconnected cleanly from MongoDB Atlas.');
}

startMigration().catch(err => {
  console.error('[Migration Error]', err);
  process.exit(1);
});
