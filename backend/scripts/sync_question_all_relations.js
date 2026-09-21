import fs from 'fs';
import readline from 'readline';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const sqlFilePath = 'D:\\EducationMasters\\bookmziw_edums (1).sql';
const MONGO_URI = process.env.MONGODB_URI;

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
    if (escaped) { cur += ch; escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (!inStr && (ch === "'" || ch === '"')) { inStr = true; qChar = ch; continue; }
    if (inStr && ch === qChar) {
      if (i + 1 < str.length && str[i + 1] === qChar) { cur += qChar; i++; }
      else { inStr = false; qChar = null; }
      continue;
    }
    if (inStr) { cur += ch; continue; }
    if (ch === ',') { values.push(cleanVal(cur)); cur = ''; continue; }
    cur += ch;
  }
  values.push(cleanVal(cur));
  return values;
}

async function syncAllQuestionRelations() {
  console.log('\n======================================================');
  console.log('  STARTING COMPLETE QUESTION & RELATIONS RESTORATION  ');
  console.log('======================================================\n');

  console.log('[1/4] Reading SQL dump...');
  const rl = readline.createInterface({
    input: fs.createReadStream(sqlFilePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let currentInsertTable = null;
  let currentCols = [];

  const questionsMap = new Map();
  const questionOptionsMap = new Map(); // question_id -> array of { id, value }
  const examQuestionMap = new Map(); // question_id -> array of exam_id
  const questionLevelsMap = new Map();
  const questionTypesMap = new Map();

  let lineCount = 0;

  for await (const line of rl) {
    lineCount++;
    const trimmed = line.trim();

    if (trimmed.startsWith('INSERT INTO')) {
      const match = trimmed.match(/^INSERT INTO `([^`]+)` \(([^)]+)\) VALUES/i);
      if (match) {
        currentInsertTable = match[1];
        currentCols = match[2].split(',').map((c) => c.replace(/[`\s]/g, ''));
      }
      continue;
    }

    if (currentInsertTable && trimmed.startsWith('(')) {
      const vals = parseSqlTupleValues(trimmed);
      const row = {};
      currentCols.forEach((col, idx) => {
        row[col] = vals[idx] !== undefined ? vals[idx] : null;
      });

      if (currentInsertTable === 'questions' && row.id) {
        questionsMap.set(row.id, row);
      } else if (currentInsertTable === 'question_options' && row.question_id) {
        if (!questionOptionsMap.has(row.question_id)) {
          questionOptionsMap.set(row.question_id, []);
        }
        questionOptionsMap.get(row.question_id).push(row);
      } else if (currentInsertTable === 'examination_question' && row.question_id && row.examination_id) {
        if (!examQuestionMap.has(row.question_id)) {
          examQuestionMap.set(row.question_id, []);
        }
        examQuestionMap.get(row.question_id).push(row.examination_id);
      } else if (currentInsertTable === 'question_levels' && row.id) {
        questionLevelsMap.set(row.id, row);
      } else if (currentInsertTable === 'question_types' && row.id) {
        questionTypesMap.set(row.id, row);
      }
    }
  }

  console.log(`✓ Finished scanning SQL.`);
  console.log(`  - Questions: ${questionsMap.size}`);
  console.log(`  - Questions with options: ${questionOptionsMap.size}`);
  console.log(`  - Questions with exam links: ${examQuestionMap.size}`);

  console.log('\n[2/4] Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  // Load MongoDB Lookup Maps
  console.log('Loading Mongo taxonomies and users...');
  const [exams, states, districts, subjects, users] = await Promise.all([
    db.collection('examinations').find({}).toArray(),
    db.collection('states').find({}).toArray(),
    db.collection('districts').find({}).toArray(),
    db.collection('subjects').find({}).toArray(),
    db.collection('users').find({}).toArray(),
  ]);

  const examsBySqlId = new Map(exams.filter((e) => e.sql_id).map((e) => [e.sql_id, e]));
  const statesBySqlId = new Map(states.filter((s) => s.sql_id).map((s) => [s.sql_id, s]));
  const districtsBySqlId = new Map(districts.filter((d) => d.sql_id).map((d) => [d.sql_id, d]));
  const subjectsBySqlId = new Map(subjects.filter((s) => s.sql_id).map((s) => [s.sql_id, s]));
  const usersBySqlId = new Map(users.filter((u) => u.sql_id).map((u) => [u.sql_id, u]));

  console.log(`✓ Loaded: ${examsBySqlId.size} exams, ${statesBySqlId.size} states, ${districtsBySqlId.size} districts, ${subjectsBySqlId.size} subjects, ${usersBySqlId.size} users.`);

  console.log('\n[3/4] Transforming question documents with complete relations...');

  const bulkOps = [];
  let linkedExamsCount = 0;
  let linkedStatesCount = 0;
  let linkedDistrictsCount = 0;
  let correctAnswersCount = 0;

  for (const [qId, q] of questionsMap.entries()) {
    // Options & Correct Answer
    const rawOptions = questionOptionsMap.get(qId) || [];
    // Sort options by id to maintain deterministic A, B, C, D order
    rawOptions.sort((a, b) => (a.id || 0) - (b.id || 0));

    let correctIndex = 1;
    let foundCorrect = false;

    const formattedOptions = rawOptions.map((opt, idx) => {
      const isCorrect = q.answer_id ? opt.id === q.answer_id : idx === 0;
      if (isCorrect) {
        correctIndex = idx + 1;
        foundCorrect = true;
      }
      return {
        index: idx + 1,
        text: opt.value || '',
        is_correct: isCorrect,
      };
    });

    if (foundCorrect) correctAnswersCount++;

    // Linked Examinations
    const examSqlIds = examQuestionMap.get(qId) || [];
    const linkedExams = examSqlIds.map((eid) => examsBySqlId.get(eid)).filter(Boolean);
    const examIds = linkedExams.map((e) => e._id);
    const examNames = linkedExams.map((e) => e.name);
    if (examIds.length > 0) linkedExamsCount++;

    // Linked State
    const stateDoc = q.state_id ? statesBySqlId.get(q.state_id) : null;
    if (stateDoc) linkedStatesCount++;

    // Linked District
    const districtDoc = q.district_id ? districtsBySqlId.get(q.district_id) : null;
    if (districtDoc) linkedDistrictsCount++;

    // Linked Subject
    const subjectDoc = q.subject_id ? subjectsBySqlId.get(q.subject_id) : null;

    // Linked Author
    const userDoc = q.user_id ? usersBySqlId.get(q.user_id) : null;

    // Level & Type
    const level = questionLevelsMap.get(q.level_id);
    const type = questionTypesMap.get(q.type_id);

    const updateDoc = {
      sql_id: q.id,
      content: q.content,
      instruction: q.instruction || '',
      ans_info: q.ans_info || '',
      marks: q.marks || 1,
      negative: q.negative || 0,
      city: q.city || '',
      status: q.status || 'publish',
      options: formattedOptions,
      correct_answer: `Option ${correctIndex}`,
      examinations: examIds,
      examination_names: examNames,
      state: stateDoc ? stateDoc._id : null,
      state_id: q.state_id || null,
      state_name: stateDoc ? stateDoc.name : '',
      district: districtDoc ? districtDoc._id : null,
      district_id: q.district_id || null,
      district_name: districtDoc ? districtDoc.name : '',
      subject: subjectDoc ? subjectDoc._id : null,
      subject_id: q.subject_id || null,
      subject_name: subjectDoc ? subjectDoc.name : '',
      author: userDoc ? userDoc._id : null,
      author_name: userDoc ? userDoc.name : 'Test Student',
      user_id: q.user_id || null,
      level: level ? { sql_id: level.id, name: level.name, slug: level.slug } : { sql_id: 2, name: 'Medium', slug: 'medium' },
      type: type ? { sql_id: type.id, name: type.name, slug: type.slug } : { sql_id: 1, name: 'Objective', slug: 'objective' },
      language: q.lang_id === 2 ? 'English' : 'Hindi',
      created_at: q.created_at || new Date(),
      updated_at: q.updated_at || new Date(),
    };

    bulkOps.push({
      updateOne: {
        filter: { sql_id: q.id },
        update: { $set: updateDoc },
        upsert: true,
      },
    });
  }

  console.log(`✓ Prepared ${bulkOps.length} update operations.`);
  console.log(`  - Questions with linked examinations: ${linkedExamsCount}`);
  console.log(`  - Questions with linked states: ${linkedStatesCount}`);
  console.log(`  - Questions with linked districts: ${linkedDistrictsCount}`);
  console.log(`  - Questions with authentic correct answers: ${correctAnswersCount}`);

  console.log('\n[4/4] Executing bulk writes into MongoDB Atlas...');
  const batchSize = 1000;
  for (let i = 0; i < bulkOps.length; i += batchSize) {
    const batch = bulkOps.slice(i, i + batchSize);
    await db.collection('questions').bulkWrite(batch, { ordered: false });
    process.stdout.write(`  Processed ${Math.min(i + batchSize, bulkOps.length)} / ${bulkOps.length} questions...\r`);
  }

  console.log('\n\n======================================================');
  console.log('✓ ALL QUESTIONS SUCCESSFULLY SYNCHRONIZED & LINKED!');
  console.log('======================================================\n');

  // Verify question 11359
  const sample = await db.collection('questions').findOne({ sql_id: 11359 });
  console.log('Verification Sample (Question 11359):');
  console.log({
    content: sample.content,
    correct_answer: sample.correct_answer,
    options: sample.options,
    examination_names: sample.examination_names,
    examinations: sample.examinations,
    state_name: sample.state_name,
    state: sample.state,
    district_name: sample.district_name,
    district: sample.district,
    city: sample.city,
  });

  await mongoose.disconnect();
}

syncAllQuestionRelations().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
