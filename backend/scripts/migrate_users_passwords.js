import fs from 'fs';
import readline from 'readline';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const SQL_FILE_PATH = 'd:/EducationMasters/bookmziw_edums (1).sql';

function cleanVal(str) {
  if (!str) return null;
  str = str.trim();
  if (str === 'NULL' || str === 'null') return null;
  if ((str.startsWith("'") && str.endsWith("'")) || (str.startsWith('"') && str.endsWith('"'))) {
    str = str.slice(1, -1);
  }
  str = str.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
  return str;
}

function parseSqlLine(line) {
  const values = [];
  let cur = '';
  let inStr = false;
  let qChar = null;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (!inStr && (ch === "'" || ch === '"')) {
      inStr = true;
      qChar = ch;
      continue;
    }

    if (inStr && ch === qChar) {
      if (i + 1 < line.length && line[i + 1] === qChar) {
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

async function migrateUsersPasswords() {
  console.log('\n================================================================');
  console.log('  MIGRATING ALL USERS & PASSWORDS FROM SQL DUMP TO MONGODB  ');
  console.log('================================================================\n');

  const fileStream = fs.createReadStream(SQL_FILE_PATH, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const usersMap = new Map();
  let currentInsertTable = null;
  let currentCols = [];

  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed.startsWith('INSERT INTO')) {
      const match = trimmed.match(/^INSERT INTO `([^`]+)` \(([^)]+)\) VALUES/i);
      if (match) {
        currentInsertTable = match[1];
        currentCols = match[2].split(',').map(c => c.replace(/[`\s]/g, ''));
      }
      continue;
    }

    if (currentInsertTable === 'users' && trimmed.startsWith('(')) {
      let rawRow = trimmed;
      if (rawRow.endsWith(';') || rawRow.endsWith(',')) {
        rawRow = rawRow.slice(0, -1);
      }
      if (rawRow.startsWith('(') && rawRow.endsWith(')')) {
        rawRow = rawRow.slice(1, -1);
      }

      const values = parseSqlLine(rawRow);
      if (values.length >= currentCols.length) {
        const row = {};
        currentCols.forEach((col, idx) => {
          row[col] = values[idx];
        });
        const rowId = parseInt(row.id, 10);
        if (!isNaN(rowId)) {
          usersMap.set(rowId, row);
        }
      }
    }
  }

  console.log(`✓ Parsed ${usersMap.size} unique user records from SQL dump.`);

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const ROLE_MAP = { 1: 'admin', 2: 'editor', 3: 'author' };

  const bulkOps = [];
  for (const u of usersMap.values()) {
    const sql_id = parseInt(u.id, 10);
    const passwordHash = u.password ? u.password.replace(/^\$2y\$/, '$2a$') : null;

    const doc = {
      sql_id,
      role_id: parseInt(u.role_id, 10) || 3,
      social_id: parseInt(u.social_id, 10) || 0,
      name: u.name || 'User',
      nicename: u.nicename || u.name || 'user',
      email: (u.email || '').toLowerCase().trim(),
      phone: u.phone || null,
      password: passwordHash,
      role: ROLE_MAP[parseInt(u.role_id, 10)] || 'user',
      image: u.image || null,
      bio: u.bio || null,
      active: parseInt(u.active, 10) || 0,
      backend: parseInt(u.backend, 10) || 0,
      gender: u.gender || null,
      otp: u.otp || null,
      phone_verified_at: u.phone_verified_at || null,
      email_verified_at: u.email_verified_at || null,
      remember_token: u.remember_token || null,
      email_token: u.email_token || null,
      phone_token: u.phone_token || null,
      status: u.status || null,
      created_at: u.created_at || null,
      updated_at: u.updated_at || null,
      deleted_at: u.deleted_at || null,
    };

    bulkOps.push({
      updateOne: {
        filter: { sql_id },
        update: { $set: doc },
        upsert: true
      }
    });
  }

  console.log(`Syncing ${bulkOps.length} users into MongoDB 'users' collection...`);
  const chunkSize = 500;
  for (let i = 0; i < bulkOps.length; i += chunkSize) {
    const chunk = bulkOps.slice(i, i + chunkSize);
    await db.collection('users').bulkWrite(chunk);
    console.log(`   - Processed ${Math.min(i + chunkSize, bulkOps.length)} / ${bulkOps.length} users...`);
  }

  const totalMongoUsers = await db.collection('users').countDocuments({});
  const usersWithPassword = await db.collection('users').countDocuments({ password: { $exists: true, $ne: null } });

  console.log('\n================================================================');
  console.log(`✓ MIGRATION COMPLETE! Total users in MongoDB: ${totalMongoUsers}`);
  console.log(`✓ Users with Password Hashes stored: ${usersWithPassword}`);
  console.log('================================================================\n');

  // Print sample users with password hashes
  const sampleUsers = await db.collection('users').find({}).limit(5).toArray();
  console.log('--- SAMPLE MIGRATED USERS IN MONGODB ---');
  sampleUsers.forEach(user => {
    console.log(`ID: ${user.sql_id} | Name: ${user.name} | Email: ${user.email} | Role: ${user.role} | HasPassword: ${Boolean(user.password)} (${user.password ? user.password.substring(0, 15) + '...' : 'NONE'})`);
  });

  await mongoose.disconnect();
}

migrateUsersPasswords().catch(console.error);
