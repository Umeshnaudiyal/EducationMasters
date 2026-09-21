import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://invincibleumesh28_db_user:htx9Tc74HRdqE403@cluster28.ktzer3o.mongodb.net/educationmasters?retryWrites=true&w=majority';

async function consolidateDatabase() {
  console.log(`[Consolidation] Connecting to MongoDB Atlas...`);
  await mongoose.connect(MONGO_URI);
  console.log('[Consolidation] Connected successfully!');

  const db = mongoose.connection.db;

  // Helper to load small lookup map keyed by sql_id or id
  async function loadMap(colName) {
    const docs = await db.collection(colName).find({}).toArray();
    const map = new Map();
    for (const d of docs) {
      const k = (d.sql_id !== undefined && d.sql_id !== null) ? d.sql_id : d.id;
      if (k !== undefined && k !== null) {
        map.set(k, d);
      }
    }
    return map;
  }

  async function loadPivotMap(colName, groupKey, valKey) {
    const docs = await db.collection(colName).find({}).toArray();
    const map = new Map();
    for (const d of docs) {
      const g = d[groupKey];
      const v = d[valKey];
      if (g !== undefined && v !== undefined && g !== null && v !== null) {
        if (!map.has(g)) map.set(g, []);
        map.get(g).push(v);
      }
    }
    return map;
  }

  console.log('\n[1/5] Pre-loading taxonomy & lookup maps into RAM...');
  const categoriesMap = await loadMap('categories');
  const tagsMap = await loadMap('tags');
  const subjectsMap = await loadMap('subjects');
  const departmentsMap = await loadMap('departments');
  const coursesMap = await loadMap('courses');
  const facilitiesMap = await loadMap('facilities');
  const questionLevelsMap = await loadMap('question_levels');
  const questionTypesMap = await loadMap('question_types');
  const metadataMap = await loadMap('metadata');
  const mediaMap = await loadMap('media');

  console.log('  Pre-loading pivot relationships...');
  const blogCatPivot = await loadPivotMap('blog_category', 'blog_id', 'category_id');
  const blogTagPivot = await loadPivotMap('blog_tag', 'blog_id', 'tag_id');
  const jobCatPivot = await loadPivotMap('category_job', 'job_id', 'category_id');
  const jobAdmitCardMap = await loadMap('job_admit_cards');
  const jobResultMap = await loadMap('job_results');
  const questionOptionsPivot = await loadPivotMap('question_options', 'question_id', 'value');
  const courseInstitutePivot = await loadPivotMap('course_institute', 'institute_id', 'course_id');
  const facilityInstitutePivot = await loadPivotMap('facility_institute', 'institute_id', 'facility_id');

  // ==========================================
  // CONSOLIDATE BLOGS
  // ==========================================
  console.log('\n[2/5] Consolidating BLOGS collection...');
  const blogCursor = db.collection('blogs').find({});
  let blogBatch = [];
  let totalBlogs = 0;
  await db.collection('blogs_new').drop().catch(() => {});

  for await (const b of blogCursor) {
    const bId = b.sql_id || b.id;
    const catIds = blogCatPivot.get(bId) || [];
    const tagIds = blogTagPivot.get(bId) || [];

    const cats = catIds.map(id => categoriesMap.get(id)).filter(Boolean).map(c => ({ sql_id: c.sql_id || c.id, name: c.name, slug: c.slug }));
    const tgs = tagIds.map(id => tagsMap.get(id)).filter(Boolean).map(t => ({ sql_id: t.sql_id || t.id, name: t.name, slug: t.slug }));

    const meta = metadataMap.get(b.meta_id);
    const media = mediaMap.get(b.media_id);

    const doc = {
      sql_id: bId,
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
      featured_media: media ? { sql_id: media.sql_id || media.id, name: media.name, alt: media.alt, path: media.path, file: media.file } : null,
      metadata: meta ? { m_title: meta.m_title, m_desc: meta.m_desc, m_keys: meta.m_keys, canonical: meta.canonical } : null,
      created_at: b.created_at,
      updated_at: b.updated_at
    };

    blogBatch.push(doc);
    totalBlogs++;

    if (blogBatch.length >= 250) {
      await db.collection('blogs_new').insertMany(blogBatch, { ordered: false });
      blogBatch = [];
    }
  }

  if (blogBatch.length > 0) {
    await db.collection('blogs_new').insertMany(blogBatch, { ordered: false });
    blogBatch = [];
  }

  await db.collection('blogs').drop().catch(() => {});
  await db.collection('blogs_new').rename('blogs');
  console.log(`  ✓ Successfully consolidated ${totalBlogs} Blog documents into MongoDB Atlas.`);

  // ==========================================
  // CONSOLIDATE JOBS
  // ==========================================
  console.log('\n[3/5] Consolidating JOBS collection...');
  const jobCursor = db.collection('jobs').find({});
  let jobBatch = [];
  let totalJobs = 0;
  await db.collection('jobs_new').drop().catch(() => {});

  for await (const j of jobCursor) {
    const jId = j.sql_id || j.id;
    const catIds = jobCatPivot.get(jId) || [];
    const cats = catIds.map(id => categoriesMap.get(id)).filter(Boolean).map(c => ({ sql_id: c.sql_id || c.id, name: c.name, slug: c.slug }));
    const dept = departmentsMap.get(j.dept_id || j.department_id);

    const admitCard = jobAdmitCardMap.get(jId);
    const result = jobResultMap.get(jId);
    const meta = metadataMap.get(j.meta_id);

    const doc = {
      sql_id: jId,
      title: j.title,
      slug: j.slug,
      status: j.status,
      post: j.post,
      desig: j.desig,
      dept: j.dept,
      department: dept ? { sql_id: dept.sql_id || dept.id, name: dept.name, slug: dept.slug } : null,
      categories: cats,
      category_ids: catIds,
      dates: {
        start_date: j.start_date,
        last_date: j.last_date,
        fee_date: j.fee_date,
        exam_date: j.exam_date,
        admit_date: j.admit_date,
        result_date: j.result_date
      },
      fees: { gen_fee: j.gen_fee, sc_fee: j.sc_fee, obc_fee: j.obc_fee, ph_fee: j.ph_fee, fee_mode: j.fee_mode },
      age_limit: { min_age: j.min_age, max_age: j.max_age },
      total_posts: j.tot_post,
      eligibility: j.eligibility,
      links: { site_url: j.site_url, down_url: j.down_url },
      description: j.description,
      admitCardNotification: admitCard ? { title: admitCard.title, slug: admitCard.slug, down_url: admitCard.down_url } : null,
      resultNotification: result ? { title: result.title, slug: result.slug, down_url: result.down_url } : null,
      metadata: meta ? { m_title: meta.m_title, m_desc: meta.m_desc, m_keys: meta.m_keys } : null,
      created_at: j.created_at
    };

    jobBatch.push(doc);
    totalJobs++;

    if (jobBatch.length >= 250) {
      await db.collection('jobs_new').insertMany(jobBatch, { ordered: false });
      jobBatch = [];
    }
  }

  if (jobBatch.length > 0) {
    await db.collection('jobs_new').insertMany(jobBatch, { ordered: false });
    jobBatch = [];
  }

  await db.collection('jobs').drop().catch(() => {});
  await db.collection('jobs_new').rename('jobs');
  console.log(`  ✓ Successfully consolidated ${totalJobs} Job documents into MongoDB Atlas.`);

  // ==========================================
  // CONSOLIDATE QUESTIONS
  // ==========================================
  console.log('\n[4/5] Consolidating QUESTIONS collection...');
  const qCursor = db.collection('questions').find({});
  let qBatch = [];
  let totalQuestions = 0;
  await db.collection('questions_new').drop().catch(() => {});

  for await (const q of qCursor) {
    const qId = q.sql_id || q.id;
    const optionValues = questionOptionsPivot.get(qId) || [];
    const answerId = q.answer_id;
    const level = questionLevelsMap.get(q.level_id);
    const type = questionTypesMap.get(q.type_id);

    const options = optionValues.map((val, idx) => ({
      index: idx + 1,
      text: val,
      is_correct: answerId ? (idx + 1 === answerId) : false
    }));

    const doc = {
      sql_id: qId,
      content: q.content,
      instruction: q.instruction,
      ans_info: q.ans_info,
      marks: q.marks || 1,
      negative: q.negative || 0,
      subject_id: q.subject_id,
      options: options,
      level: level ? { sql_id: level.sql_id || level.id, name: level.name, slug: level.slug } : null,
      type: type ? { sql_id: type.sql_id || type.id, name: type.name, slug: type.slug } : null,
      status: q.status,
      created_at: q.created_at
    };

    qBatch.push(doc);
    totalQuestions++;

    if (qBatch.length >= 250) {
      await db.collection('questions_new').insertMany(qBatch, { ordered: false });
      qBatch = [];
    }
  }

  if (qBatch.length > 0) {
    await db.collection('questions_new').insertMany(qBatch, { ordered: false });
    qBatch = [];
  }

  await db.collection('questions').drop().catch(() => {});
  await db.collection('questions_new').rename('questions');
  console.log(`  ✓ Successfully consolidated ${totalQuestions} Question documents into MongoDB Atlas.`);

  // ==========================================
  // CONSOLIDATE INSTITUTES
  // ==========================================
  console.log('\n[5/5] Consolidating INSTITUTES collection...');
  const instCursor = db.collection('institutes').find({});
  let instBatch = [];
  let totalInstitutes = 0;
  await db.collection('institutes_new').drop().catch(() => {});

  for await (const inst of instCursor) {
    const instId = inst.sql_id || inst.id;
    const courseIds = courseInstitutePivot.get(instId) || [];
    const facilityIds = facilityInstitutePivot.get(instId) || [];

    const crs = courseIds.map(id => coursesMap.get(id)).filter(Boolean).map(c => ({ sql_id: c.sql_id || c.id, name: c.name, slug: c.slug }));
    const facs = facilityIds.map(id => facilitiesMap.get(id)).filter(Boolean).map(f => ({ sql_id: f.sql_id || f.id, name: f.name, slug: f.slug }));

    const doc = {
      sql_id: instId,
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

    instBatch.push(doc);
    totalInstitutes++;

    if (instBatch.length >= 250) {
      await db.collection('institutes_new').insertMany(instBatch, { ordered: false });
      instBatch = [];
    }
  }

  if (instBatch.length > 0) {
    await db.collection('institutes_new').insertMany(instBatch, { ordered: false });
    instBatch = [];
  }

  await db.collection('institutes').drop().catch(() => {});
  await db.collection('institutes_new').rename('institutes');
  console.log(`  ✓ Successfully consolidated ${totalInstitutes} Institute documents into MongoDB Atlas.`);

  // ==========================================
  // DROP SQL PIVOT & UNNECESSARY RELATIONAL TABLES
  // ==========================================
  const collectionsToDrop = [
    'blog_category', 'blog_tag', 'blog_subject', 'category_job',
    'course_institute', 'facility_institute', 'institute_media',
    'examination_question', 'question_options', 'question_levels',
    'question_types', 'departments', 'facilities', 'metadata_hindi',
    'migrations', 'password_resets', 'personal_access_tokens',
    'social_links', 'state_data', 'state_subject', 'topic_groups',
    'ticker', 'cities', 'failed_jobs', 'metadata'
  ];

  console.log('\n[Dropping] Cleaning up unnecessary SQL pivot & helper collections...');
  for (const colName of collectionsToDrop) {
    await db.collection(colName).drop().catch(() => {});
    console.log(`  - Dropped collection [${colName}]`);
  }

  console.log('\n================ CONSOLIDATION COMPLETE ================');
  const finalCols = await db.listCollections().toArray();
  console.log(`Remaining Clean MongoDB Collections (${finalCols.length}):`);
  for (const c of finalCols) {
    const cnt = await db.collection(c.name).countDocuments();
    console.log(`  ➜ Collection [${c.name.padEnd(20)}]: ${cnt} documents`);
  }
  console.log('========================================================\n');

  await mongoose.disconnect();
  console.log('[Consolidation] Disconnected cleanly from MongoDB Atlas.');
}

consolidateDatabase().catch(err => {
  console.error('[Consolidation Error]', err);
  process.exit(1);
});
