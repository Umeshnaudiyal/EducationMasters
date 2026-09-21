import fs from 'fs';
import readline from 'readline';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const sqlFilePath = 'D:\\EducationMasters\\bookmziw_edums (1).sql';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://invincibleumesh28_db_user:htx9Tc74HRdqE403@cluster28.ktzer3o.mongodb.net/educationmasters?retryWrites=true&w=majority';

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

async function runMasterMigration() {
  console.log('\n================================================================');
  console.log('  STARTING MASTER SQL-TO-MONGODB MIGRATION & DEDUPLICATION  ');
  console.log('================================================================\n');

  console.log('[1/4] Streaming and parsing SQL dump file...');
  const fileStream = fs.createReadStream(sqlFilePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  // Data accumulators (Map ensures absolute deduplication by primary key / sql_id)
  const tables = {};
  let currentInsertTable = null;
  let currentCols = [];
  let lineCount = 0;

  for await (const line of rl) {
    lineCount++;
    const trimmed = line.trim();

    if (trimmed.startsWith('INSERT INTO')) {
      const match = trimmed.match(/^INSERT INTO `([^`]+)` \(([^)]+)\) VALUES/i);
      if (match) {
        currentInsertTable = match[1];
        currentCols = match[2].split(',').map(c => c.replace(/[`\s]/g, ''));
        if (!tables[currentInsertTable]) {
          tables[currentInsertTable] = new Map();
        }
      }
      continue;
    }

    if (currentInsertTable && trimmed.startsWith('(')) {
      const vals = parseSqlTupleValues(trimmed);
      const row = {};
      currentCols.forEach((col, idx) => {
        row[col] = vals[idx] !== undefined ? vals[idx] : null;
      });

      const rowId = row.id !== undefined && row.id !== null ? row.id : tables[currentInsertTable].size + 1;
      // Deduplicate: set in Map by primary id
      tables[currentInsertTable].set(rowId, row);
    }
  }

  console.log(`✓ Finished reading ${lineCount} SQL lines.`);
  console.log('✓ Extracted SQL row counts (100% Deduplicated):');
  for (const [tName, mapData] of Object.entries(tables)) {
    console.log(`   - Table [${tName.padEnd(25)}]: ${mapData.size} unique rows`);
  }

  // ================================================================
  // [2/4] CONNECT TO MONGODB & LOAD OBJECTID REFS
  // ================================================================
  console.log('\n[2/4] Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  console.log('✓ Connected to MongoDB Atlas!');

  // Extract maps for quick relational lookups
  const metadataMap = tables['metadata'] || new Map();
  const mediaMap = tables['media'] || new Map();
  const categoriesMap = tables['categories'] || new Map();
  const tagsMap = tables['tags'] || new Map();
  const statesMap = tables['states'] || new Map();
  const districtsMap = tables['districts'] || new Map();
  const usersMap = tables['users'] || new Map();
  const departmentsMap = tables['departments'] || new Map();
  const coursesMap = tables['courses'] || new Map();
  const facilitiesMap = tables['facilities'] || new Map();
  const questionLevelsMap = tables['question_levels'] || new Map();
  const questionTypesMap = tables['question_types'] || new Map();
  const admitCardsMap = tables['job_admit_cards'] || new Map();
  const resultsMap = tables['job_results'] || new Map();

  // Pivot Maps
  const blogCategoryPivot = new Map();
  if (tables['blog_category']) {
    for (const r of tables['blog_category'].values()) {
      if (r.blog_id && r.category_id) {
        if (!blogCategoryPivot.has(r.blog_id)) blogCategoryPivot.set(r.blog_id, []);
        blogCategoryPivot.get(r.blog_id).push(r.category_id);
      }
    }
  }

  const blogTagPivot = new Map();
  if (tables['blog_tag']) {
    for (const r of tables['blog_tag'].values()) {
      if (r.blog_id && r.tag_id) {
        if (!blogTagPivot.has(r.blog_id)) blogTagPivot.set(r.blog_id, []);
        blogTagPivot.get(r.blog_id).push(r.tag_id);
      }
    }
  }

  const jobCategoryPivot = new Map();
  if (tables['category_job']) {
    for (const r of tables['category_job'].values()) {
      if (r.job_id && r.category_id) {
        if (!jobCategoryPivot.has(r.job_id)) jobCategoryPivot.set(r.job_id, []);
        jobCategoryPivot.get(r.job_id).push(r.category_id);
      }
    }
  }

  const questionOptionsPivot = new Map();
  if (tables['question_options']) {
    for (const r of tables['question_options'].values()) {
      if (r.question_id && r.value) {
        if (!questionOptionsPivot.has(r.question_id)) questionOptionsPivot.set(r.question_id, []);
        questionOptionsPivot.get(r.question_id).push(r.value);
      }
    }
  }

  const courseInstitutePivot = new Map();
  if (tables['course_institute']) {
    for (const r of tables['course_institute'].values()) {
      if (r.institute_id && r.course_id) {
        if (!courseInstitutePivot.has(r.institute_id)) courseInstitutePivot.set(r.institute_id, []);
        courseInstitutePivot.get(r.institute_id).push(r.course_id);
      }
    }
  }

  const facilityInstitutePivot = new Map();
  if (tables['facility_institute']) {
    for (const r of tables['facility_institute'].values()) {
      if (r.institute_id && r.facility_id) {
        if (!facilityInstitutePivot.has(r.institute_id)) facilityInstitutePivot.set(r.institute_id, []);
        facilityInstitutePivot.get(r.institute_id).push(r.facility_id);
      }
    }
  }

  // Helper for batch inserting cleanly with atomic collection replacement
  async function atomicSyncCollection(colName, docs, uniqueIndexes = ['sql_id']) {
    console.log(`\n  Syncing Collection [${colName}] (${docs.length} clean documents)...`);
    const tempColName = `${colName}_clean_temp`;
    await db.collection(tempColName).drop().catch(() => {});

    if (docs.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < docs.length; i += batchSize) {
        const chunk = docs.slice(i, i + batchSize);
        await db.collection(tempColName).insertMany(chunk, { ordered: false });
      }
    }

    // Create indexes on temp collection
    for (const idxField of uniqueIndexes) {
      await db.collection(tempColName).createIndex({ [idxField]: 1 }, { unique: true, sparse: true }).catch(() => {});
    }

    // Replace original collection
    await db.collection(colName).drop().catch(() => {});
    if (docs.length > 0) {
      await db.collection(tempColName).rename(colName);
    } else {
      await db.createCollection(colName);
    }

    const count = await db.collection(colName).countDocuments();
    console.log(`  ✓ [${colName}] successfully populated with ${count} unique documents.`);
  }

  // ================================================================
  // [3/4] BUILD & SYNC PRIMARY COLLECTIONS
  // ================================================================
  console.log('\n[3/4] Transforming and consolidating documents...');

  // 1. STATES
  const stateDocs = Array.from(statesMap.values()).map(s => ({
    sql_id: s.id,
    name: s.name,
    slug: s.slug,
    country_id: s.country_id
  }));
  await atomicSyncCollection('states', stateDocs, ['sql_id']);

  // 2. DISTRICTS
  const districtDocs = Array.from(districtsMap.values()).map(d => ({
    sql_id: d.id,
    name: d.name,
    state_id: d.state_id
  }));
  await atomicSyncCollection('districts', districtDocs, ['sql_id']);

  // 3. CATEGORIES
  const categoryDocs = Array.from(categoriesMap.values()).map(c => ({
    sql_id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    parent_id: c.parent_id
  }));
  await atomicSyncCollection('categories', categoryDocs, ['sql_id']);

  // 4. TAGS
  const tagDocs = Array.from(tagsMap.values()).map(t => ({
    sql_id: t.id,
    name: t.name,
    slug: t.slug
  }));
  await atomicSyncCollection('tags', tagDocs, ['sql_id']);

  // 5. USERS
  const ROLE_MAP = { 1: 'admin', 2: 'editor', 3: 'author' };
  const userDocs = Array.from(usersMap.values()).map(u => ({
    sql_id: u.id,
    role_id: u.role_id,
    social_id: u.social_id,
    name: u.name,
    nicename: u.nicename || u.name,
    email: u.email,
    phone: u.phone,
    password: u.password ? u.password.replace(/^\$2y\$/, '$2a$') : null,
    role: ROLE_MAP[u.role_id] || 'user',
    image: u.image,
    bio: u.bio,
    active: u.active !== undefined ? u.active : 1,
    backend: u.backend,
    gender: u.gender,
    otp: u.otp,
    phone_verified_at: u.phone_verified_at,
    email_verified_at: u.email_verified_at,
    remember_token: u.remember_token,
    email_token: u.email_token,
    phone_token: u.phone_token,
    status: u.status,
    created_at: u.created_at,
    updated_at: u.updated_at,
    deleted_at: u.deleted_at
  }));
  await atomicSyncCollection('users', userDocs, ['sql_id']);

  // 6. MEDIA
  const mediaDocs = Array.from(mediaMap.values()).map(m => ({
    sql_id: m.id,
    name: m.name,
    slug: m.slug,
    file: m.file,
    path: m.path,
    size: m.size,
    ext: m.ext,
    alt: m.alt,
    created_at: m.created_at
  }));
  await atomicSyncCollection('media', mediaDocs, ['sql_id']);

  // 7. BLOGS (Embedded metadata, categories, tags, media, author)
  const blogDocs = Array.from(tables['blogs'].values()).map(b => {
    const meta = metadataMap.get(b.meta_id);
    const media = mediaMap.get(b.media_id);
    const author = usersMap.get(b.user_id);
    const state = statesMap.get(b.state_id);

    const catIds = blogCategoryPivot.get(b.id) || [];
    const tagIds = blogTagPivot.get(b.id) || [];

    const cats = catIds.map(id => categoriesMap.get(id)).filter(Boolean).map(c => ({ sql_id: c.id, name: c.name, slug: c.slug }));
    const tgs = tagIds.map(id => tagsMap.get(id)).filter(Boolean).map(t => ({ sql_id: t.id, name: t.name, slug: t.slug }));

    return {
      sql_id: b.id,
      user_id: b.user_id,
      title: b.title,
      slug: b.slug,
      status: b.status || 'draft',
      content: b.content,
      updates: b.updates,
      categories: cats,
      category_ids: catIds,
      tags: tgs,
      tag_ids: tagIds,
      state_id: b.state_id,
      meta_id: b.meta_id,
      media_id: b.media_id,
      author: author ? { sql_id: author.id, name: author.name, nicename: author.nicename, email: author.email, image: author.image, bio: author.bio } : null,
      state: state ? { sql_id: state.id, name: state.name, slug: state.slug } : null,
      featured_media: media ? { sql_id: media.id, name: media.name, alt: media.alt, path: media.path, file: media.file } : null,
      metadata: meta ? {
        m_title: meta.m_title,
        m_desc: meta.m_desc,
        m_keys: meta.m_keys,
        canonical: meta.canonical,
        robots: meta.robots,
        schema: meta.schema
      } : null,
      created_at: b.created_at,
      updated_at: b.updated_at
    };
  });
  await atomicSyncCollection('blogs', blogDocs, ['sql_id']);

  // 8. JOBS (Embedded metadata, categories, admit card, result, state)
  const jobDocs = Array.from(tables['jobs'].values()).map(j => {
    const meta = metadataMap.get(j.meta_id);
    const media = mediaMap.get(j.media_id);
    const author = usersMap.get(j.user_id);
    const state = statesMap.get(j.state_id);
    const dept = departmentsMap.get(j.dept_id || j.department_id);

    const admitCard = admitCardsMap.get(j.id);
    const result = resultsMap.get(j.id);

    const catIds = jobCategoryPivot.get(j.id) || [];
    const cats = catIds.map(id => categoriesMap.get(id)).filter(Boolean).map(c => ({ sql_id: c.id, name: c.name, slug: c.slug }));

    return {
      sql_id: j.id,
      user_id: j.user_id,
      title: j.title,
      slug: j.slug,
      status: j.status || 'active',
      post: j.post,
      posts: j.posts || j.tot_post,
      desig: j.desig,
      dept: j.dept,
      department: dept ? { sql_id: dept.id, name: dept.name, slug: dept.slug } : null,
      app_link: j.app_link,
      noti_link: j.noti_link,
      released: j.released,
      app_start: j.app_start || j.start_date,
      app_ends: j.app_ends || j.last_date,
      min_age: j.min_age,
      max_age: j.max_age,
      exam_date: j.exam_date,
      state_id: j.state_id,
      meta_id: j.meta_id,
      media_id: j.media_id,
      author: author ? { sql_id: author.id, name: author.name, nicename: author.nicename, email: author.email, image: author.image, bio: author.bio } : null,
      state: state ? { sql_id: state.id, name: state.name, slug: state.slug } : null,
      featured_media: media ? { sql_id: media.id, name: media.name, alt: media.alt, path: media.path, file: media.file } : null,
      categories: cats,
      category_ids: catIds,
      dates: {
        start_date: j.start_date || j.app_start,
        last_date: j.last_date || j.app_ends,
        fee_date: j.fee_date,
        exam_date: j.exam_date,
        admit_date: j.admit_date,
        result_date: j.result_date
      },
      fees: { gen_fee: j.gen_fee, sc_fee: j.sc_fee, obc_fee: j.obc_fee, ph_fee: j.ph_fee, fee_mode: j.fee_mode },
      age_limit: { min_age: j.min_age, max_age: j.max_age },
      total_posts: j.tot_post || j.posts,
      eligibility: j.eligibility,
      links: { site_url: j.site_url || j.noti_link, down_url: j.down_url || j.app_link },
      description: j.description || j.content,
      admitCardNotification: admitCard ? { title: admitCard.title, slug: admitCard.slug, down_url: admitCard.down_url } : null,
      resultNotification: result ? { title: result.title, slug: result.slug, down_url: result.down_url } : null,
      metadata: meta ? {
        m_title: meta.m_title,
        m_desc: meta.m_desc,
        m_keys: meta.m_keys,
        canonical: meta.canonical,
        robots: meta.robots,
        schema: meta.schema
      } : null,
      created_at: j.created_at,
      updated_at: j.updated_at
    };
  });
  await atomicSyncCollection('jobs', jobDocs, ['sql_id']);

  // 9. QUESTIONS
  if (tables['questions']) {
    const questionDocs = Array.from(tables['questions'].values()).map(q => {
      const optionValues = questionOptionsPivot.get(q.id) || [];
      const level = questionLevelsMap.get(q.level_id);
      const type = questionTypesMap.get(q.type_id);

      const options = optionValues.map((val, idx) => ({
        index: idx + 1,
        text: val,
        is_correct: q.answer_id ? (idx + 1 === q.answer_id) : false
      }));

      return {
        sql_id: q.id,
        content: q.content,
        instruction: q.instruction,
        ans_info: q.ans_info,
        marks: q.marks || 1,
        negative: q.negative || 0,
        subject_id: q.subject_id,
        options: options,
        level: level ? { sql_id: level.id, name: level.name, slug: level.slug } : null,
        type: type ? { sql_id: type.id, name: type.name, slug: type.slug } : null,
        status: q.status,
        created_at: q.created_at
      };
    });
    await atomicSyncCollection('questions', questionDocs, ['sql_id']);
  }

  // 10. INSTITUTES
  if (tables['institutes']) {
    const instituteDocs = Array.from(tables['institutes'].values()).map(inst => {
      const courseIds = courseInstitutePivot.get(inst.id) || [];
      const facilityIds = facilityInstitutePivot.get(inst.id) || [];

      const crs = courseIds.map(id => coursesMap.get(id)).filter(Boolean).map(c => ({ sql_id: c.id, name: c.name, slug: c.slug }));
      const facs = facilityIds.map(id => facilitiesMap.get(id)).filter(Boolean).map(f => ({ sql_id: f.id, name: f.name, slug: f.slug }));

      return {
        sql_id: inst.id,
        name: inst.name,
        slug: inst.slug,
        address: inst.address,
        phone: inst.phone,
        email: inst.email,
        site_url: inst.site_url,
        description: inst.description,
        courses: crs,
        facilities: facs,
        created_at: inst.created_at
      };
    });
    await atomicSyncCollection('institutes', instituteDocs, ['sql_id']);
  }

  // 11. ADVERTS
  if (tables['adverts']) {
    const advertDocs = Array.from(tables['adverts'].values()).map(a => ({
      sql_id: a.id,
      active: a.active,
      location: a.location,
      name: a.name,
      slug: a.slug,
      size: a.size,
      rel: a.rel,
      hlink: a.hlink,
      code: a.code,
      created_at: a.created_at
    }));
    await atomicSyncCollection('adverts', advertDocs, ['sql_id']);
  }

  // 12. SUBSCRIBERS
  if (tables['subscribers']) {
    const subDocs = Array.from(tables['subscribers'].values()).map(s => ({
      sql_id: s.id,
      email: s.email,
      name: s.name,
      status: s.status,
      created_at: s.created_at
    }));
    await atomicSyncCollection('subscribers', subDocs, ['sql_id']);
  }

  // ================================================================
  // [4/4] LINK MONGOOSE OBJECTID REFERENCES
  // ================================================================
  console.log('\n[4/4] Linking Mongoose ObjectId references across collections...');
  const loadObjMap = async (colName) => {
    const docs = await db.collection(colName).find({}, { projection: { _id: 1, sql_id: 1 } }).toArray();
    const map = new Map();
    for (const d of docs) {
      if (d.sql_id !== undefined && d.sql_id !== null) {
        map.set(d.sql_id, d._id);
      }
    }
    return map;
  };

  const usersMapObj = await loadObjMap('users');
  const catMapObj = await loadObjMap('categories');
  const tagsMapObj = await loadObjMap('tags');
  const mediaMapObj = await loadObjMap('media');
  const statesMapObj = await loadObjMap('states');
  const districtsMapObj = await loadObjMap('districts');

  const processRefLinking = async (colName, transformFn) => {
    const cursor = db.collection(colName).find({});
    let bulkOps = [];
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
      if (bulkOps.length >= 500) {
        await db.collection(colName).bulkWrite(bulkOps, { ordered: false });
        bulkOps = [];
      }
    }
    if (bulkOps.length > 0) {
      await db.collection(colName).bulkWrite(bulkOps, { ordered: false });
    }
  };

  await processRefLinking('jobs', (doc) => {
    const fields = {};
    if (doc.user_id && usersMapObj.has(doc.user_id)) fields.author = usersMapObj.get(doc.user_id);
    if (doc.media_id && mediaMapObj.has(doc.media_id)) fields.featured_media = mediaMapObj.get(doc.media_id);
    if (doc.state_id && statesMapObj.has(doc.state_id)) fields.state = statesMapObj.get(doc.state_id);
    const catObjIds = (doc.category_ids || []).map(id => catMapObj.get(id)).filter(Boolean);
    if (catObjIds.length > 0) fields.categories = catObjIds;
    return fields;
  });

  await processRefLinking('blogs', (doc) => {
    const fields = {};
    if (doc.user_id && usersMapObj.has(doc.user_id)) fields.author = usersMapObj.get(doc.user_id);
    if (doc.media_id && mediaMapObj.has(doc.media_id)) fields.featured_media = mediaMapObj.get(doc.media_id);
    if (doc.state_id && statesMapObj.has(doc.state_id)) fields.state = statesMapObj.get(doc.state_id);
    const catObjIds = (doc.category_ids || []).map(id => catMapObj.get(id)).filter(Boolean);
    if (catObjIds.length > 0) fields.categories = catObjIds;
    const tagObjIds = (doc.tag_ids || []).map(id => tagsMapObj.get(id)).filter(Boolean);
    if (tagObjIds.length > 0) fields.tags = tagObjIds;
    return fields;
  });

  await processRefLinking('institutes', (doc) => {
    const fields = {};
    if (doc.user_id && usersMapObj.has(doc.user_id)) fields.author = usersMapObj.get(doc.user_id);
    if (doc.state_id && statesMapObj.has(doc.state_id)) fields.state = statesMapObj.get(doc.state_id);
    if (doc.district_id && districtsMapObj.has(doc.district_id)) fields.district = districtsMapObj.get(doc.district_id);
    return fields;
  });

  await processRefLinking('questions', (doc) => {
    const fields = {};
    if (doc.user_id && usersMapObj.has(doc.user_id)) fields.author = usersMapObj.get(doc.user_id);
    if (doc.state_id && statesMapObj.has(doc.state_id)) fields.state = statesMapObj.get(doc.state_id);
    return fields;
  });

  console.log('✓ All Mongoose ObjectId references linked successfully!');

  // Drop temporary pivot tables in MongoDB
  const legacyPivotTables = [
    'blog_category', 'blog_tag', 'blog_subject', 'category_job',
    'course_institute', 'facility_institute', 'institute_media',
    'examination_question', 'question_options', 'question_levels',
    'question_types', 'departments', 'facilities', 'metadata_hindi',
    'migrations', 'password_resets', 'personal_access_tokens',
    'social_links', 'state_data', 'state_subject', 'topic_groups',
    'ticker', 'cities', 'failed_jobs', 'metadata'
  ];

  console.log('\nCleaning up relational pivot helper collections...');
  for (const pName of legacyPivotTables) {
    await db.collection(pName).drop().catch(() => {});
  }

  console.log('\n================================================================');
  console.log('         MASTER MIGRATION & DEDUPLICATION COMPLETE         ');
  console.log('================================================================\n');

  const finalCollections = await db.listCollections().toArray();
  console.log(`Final Active MongoDB Collections (${finalCollections.length}):`);
  for (const col of finalCollections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`  ➜ Collection [${col.name.padEnd(25)}]: ${count} documents`);
  }

  console.log('================================================================\n');
  await mongoose.disconnect();
  console.log('Disconnected cleanly from MongoDB Atlas.');
}

runMasterMigration().catch(err => {
  console.error('\n[Migration Fatal Error]:', err);
  process.exit(1);
});
