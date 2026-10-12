import { ZipArchive } from 'archiver';
import {
  AdmitCard,
  Advert,
  Blog,
  Category,
  Country,
  Course,
  Department,
  District,
  Exam,
  Facility,
  Institute,
  Job,
  Media,
  Question,
  Result,
  State,
  Subject,
  Subscriber,
  Tag,
  Topic,
  TopicGroup,
  User,
  UserLog,
  MockTestSeries,
  MockTest,
  MockTestPlan,
  MockTestAttempt,
  Payment,
  StickyNote,
} from '../models/index.js';

export const MODEL_REGISTRY = {
  users: {
    key: 'users',
    name: 'Users & Staff Accounts',
    model: User,
    category: 'Users & CRM',
    description: 'Registered students, admins, roles, profile info and permissions.',
    icon: 'Users',
    sanitize: (doc) => {
      const copy = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
      delete copy.password;
      delete copy.resetPasswordToken;
      delete copy.resetPasswordExpire;
      delete copy.otp;
      delete copy.otpExpires;
      return copy;
    },
  },
  jobs: {
    key: 'jobs',
    name: 'Government Jobs & Alerts',
    model: Job,
    category: 'Recruitment & Alerts',
    description: 'Sarkari jobs, recruitment circulars, eligibility, department postings and application links.',
    icon: 'Briefcase',
  },
  admitCards: {
    key: 'admitCards',
    name: 'Admit Cards & Hall Tickets',
    model: AdmitCard,
    category: 'Recruitment & Alerts',
    description: 'Exam call letters, hall ticket release dates, download links and exam instructions.',
    icon: 'FileText',
  },
  results: {
    key: 'results',
    name: 'Exam Results & Cutoffs',
    model: Result,
    category: 'Recruitment & Alerts',
    description: 'Recruitment test results, answer keys, scorecards and merit list datasets.',
    icon: 'Award',
  },
  blogs: {
    key: 'blogs',
    name: 'Articles & Editorial Guides',
    model: Blog,
    category: 'Content & Editorial',
    description: 'Educational articles, career guidance guides, syllabus analysis and news updates.',
    icon: 'BookOpen',
  },
  questions: {
    key: 'questions',
    name: 'MCQs & Question Bank',
    model: Question,
    category: 'Practice & Examination',
    description: 'Multiple choice practice questions, explanations, difficulty tiers and subject tags.',
    icon: 'HelpCircle',
  },
  mockTestSeries: {
    key: 'mockTestSeries',
    name: 'Mock Test Series Packages',
    model: MockTestSeries,
    category: 'Practice & Examination',
    description: 'Test series collections, pricing tiers, test count and target exam categories.',
    icon: 'Package',
  },
  mockTests: {
    key: 'mockTests',
    name: 'Mock Tests & Exam Papers',
    model: MockTest,
    category: 'Practice & Examination',
    description: 'Test blueprints, section structure, duration, marking schemes and question lists.',
    icon: 'CheckSquare',
  },
  mockTestPlans: {
    key: 'mockTestPlans',
    name: 'Mock Test Pass Plans',
    model: MockTestPlan,
    category: 'Practice & Examination',
    description: 'Subscription pass plans, duration tiers (Monthly, Annual), pricing and benefits.',
    icon: 'CreditCard',
  },
  mockTestAttempts: {
    key: 'mockTestAttempts',
    name: 'Candidate Test Submissions',
    model: MockTestAttempt,
    category: 'Practice & Examination',
    description: 'Student test attempts, scores, question responses, accuracy analytics and ranks.',
    icon: 'BarChart2',
  },
  payments: {
    key: 'payments',
    name: 'Payment & Order Transactions',
    model: Payment,
    category: 'Finance & Orders',
    description: 'Payment transactions, Razorpay/Stripe order IDs, statuses and receipts.',
    icon: 'DollarSign',
  },
  institutes: {
    key: 'institutes',
    name: 'Colleges & Universities',
    model: Institute,
    category: 'Directory & CRM',
    description: 'Higher education colleges, universities, accreditation, campus facilities and contacts.',
    icon: 'Building2',
  },
  courses: {
    key: 'courses',
    name: 'Academic Courses & Degrees',
    model: Course,
    category: 'Directory & CRM',
    description: 'Degree programs, diplomas, durations and eligibility criteria.',
    icon: 'GraduationCap',
  },
  facilities: {
    key: 'facilities',
    name: 'Campus Facilities Master',
    model: Facility,
    category: 'Directory & CRM',
    description: 'Hostel, sports, library, laboratory and infrastructure amenities.',
    icon: 'Home',
  },
  stickyNotes: {
    key: 'stickyNotes',
    name: 'Sticky Notes & Admin Tasks',
    model: StickyNote,
    category: 'Editorial & Workspace',
    description: 'Admin color-coded reminders, pinned tasks, priorities and workspace boards.',
    icon: 'StickyNote',
  },
  categories: {
    key: 'categories',
    name: 'Categories & Streams',
    model: Category,
    category: 'Taxonomy & Geo',
    description: 'System-wide categorization taxonomy, hierarchical slugs and metadata.',
    icon: 'Folder',
  },
  departments: {
    key: 'departments',
    name: 'Govt Departments & Boards',
    model: Department,
    category: 'Taxonomy & Geo',
    description: 'Recruitment boards, ministries, commissions (SSC, UPSC, State PSCs).',
    icon: 'Landmark',
  },
  exams: {
    key: 'exams',
    name: 'Standardized Exams Master',
    model: Exam,
    category: 'Practice & Examination',
    description: 'Standard exam listings, eligibility codes, conduct body and frequency.',
    icon: 'FileSpreadsheet',
  },
  subjects: {
    key: 'subjects',
    name: 'Subjects & Curriculum',
    model: Subject,
    category: 'Practice & Examination',
    description: 'Subject names, codes, icon associations and question mappings.',
    icon: 'Book',
  },
  topics: {
    key: 'topics',
    name: 'Topics & Sub-modules',
    model: Topic,
    category: 'Practice & Examination',
    description: 'Specific subject topics, study notes and question associations.',
    icon: 'List',
  },
  topicGroups: {
    key: 'topicGroups',
    name: 'Topic Clusters & Groups',
    model: TopicGroup,
    category: 'Practice & Examination',
    description: 'Curriculum cluster groups for syllabus categorization.',
    icon: 'Layers',
  },
  states: {
    key: 'states',
    name: 'States & Union Territories',
    model: State,
    category: 'Taxonomy & Geo',
    description: 'Indian states, UTs, state codes and geographical metadata.',
    icon: 'MapPin',
  },
  districts: {
    key: 'districts',
    name: 'Districts Master',
    model: District,
    category: 'Taxonomy & Geo',
    description: 'District mappings linked to states.',
    icon: 'Navigation',
  },
  countries: {
    key: 'countries',
    name: 'Countries Master',
    model: Country,
    category: 'Taxonomy & Geo',
    description: 'Global countries master for international institutes.',
    icon: 'Globe',
  },
  tags: {
    key: 'tags',
    name: 'Tags & SEO Keywords',
    model: Tag,
    category: 'Taxonomy & Geo',
    description: 'SEO tags, search keywords and taxonomy indexing.',
    icon: 'Tag',
  },
  subscribers: {
    key: 'subscribers',
    name: 'Newsletter & Alert Subscribers',
    model: Subscriber,
    category: 'Users & CRM',
    description: 'Email newsletter subscribers, WhatsApp alert recipients and verification status.',
    icon: 'Mail',
  },
  media: {
    key: 'media',
    name: 'Media Assets & Uploads',
    model: Media,
    category: 'Media & Files',
    description: 'Uploaded banner image URLs, file metadata, MIME types and alt attributes.',
    icon: 'Image',
  },
  adverts: {
    key: 'adverts',
    name: 'Advertisements & Banners',
    model: Advert,
    category: 'Content & Editorial',
    description: 'Ad slots, click URLs, impression counters and active promotional banners.',
    icon: 'Megaphone',
  },
  userLogs: {
    key: 'userLogs',
    name: 'User Session & Audit Logs',
    model: UserLog,
    category: 'System & Security',
    description: 'Daily authentication tracking, session timestamps and user activity logs.',
    icon: 'Activity',
  },
};

/**
 * Get Manifest / Overview of all Backupable Models with Live Record Counts
 */
export const getBackupManifest = async (req, res, next) => {
  try {
    const keys = Object.keys(MODEL_REGISTRY);

    const counts = await Promise.all(
      keys.map(async (key) => {
        try {
          const item = MODEL_REGISTRY[key];
          const count = await item.model.countDocuments();
          return { key, count };
        } catch (e) {
          return { key, count: 0 };
        }
      })
    );

    const countMap = counts.reduce((acc, cur) => {
      acc[cur.key] = cur.count;
      return acc;
    }, {});

    let totalRecords = 0;
    const models = keys.map((key) => {
      const def = MODEL_REGISTRY[key];
      const count = countMap[key] || 0;
      totalRecords += count;

      return {
        key: def.key,
        name: def.name,
        category: def.category,
        description: def.description,
        icon: def.icon,
        count,
        estimatedSizeKb: Math.max(1, Math.round((count * 1.8) * 10) / 10),
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalModels: models.length,
        totalRecords,
        generatedAt: new Date().toISOString(),
        database: 'MongoDB Atlas',
        models,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export a Single Specific Model's Complete Dataset as Downloadable JSON or API Payload
 */
export const exportSpecificModel = async (req, res, next) => {
  try {
    const { modelKey } = req.params;
    const { download, format } = req.query;

    const def = MODEL_REGISTRY[modelKey];
    if (!def) {
      return res.status(404).json({
        success: false,
        message: `Model '${modelKey}' is not recognized or not available for backup.`,
        availableModels: Object.keys(MODEL_REGISTRY),
      });
    }

    const query = def.model.find().lean();
    if (modelKey === 'users') {
      query.select('-password -resetPasswordToken -resetPasswordExpire -otp -otpExpires');
    }

    let records = await query.exec();

    if (def.sanitize) {
      records = records.map((r) => def.sanitize(r));
    }

    const timestamp = new Date().toISOString();
    const cleanDate = timestamp.replace(/[:.]/g, '-');
    const filename = `education_masters_${modelKey}_backup_${cleanDate}.json`;

    const payload = {
      meta: {
        appName: 'Education Masters',
        exportType: 'single_model',
        modelKey: def.key,
        modelName: def.name,
        category: def.category,
        totalRecords: records.length,
        exportedAt: timestamp,
        schemaVersion: '2.0.0',
        exportedBy: req.user?.email || 'admin@educationmasters.in',
      },
      data: records,
    };

    if (download === 'true' || download === '1') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(JSON.stringify(payload, null, 2));
    }

    res.status(200).json({
      success: true,
      filename,
      ...payload,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export Multiple Selected Models or ALL Models into a Unified Backup Package
 */
export const exportBulkModels = async (req, res, next) => {
  try {
    const { models: requestedModels, all, download } = { ...req.query, ...req.body };

    let targetKeys = [];
    if (all === true || all === 'true' || requestedModels === 'all' || requestedModels === '*') {
      targetKeys = Object.keys(MODEL_REGISTRY);
    } else if (Array.isArray(requestedModels)) {
      targetKeys = requestedModels.filter((k) => MODEL_REGISTRY[k]);
    } else if (typeof requestedModels === 'string' && requestedModels.trim()) {
      targetKeys = requestedModels
        .split(',')
        .map((k) => k.trim())
        .filter((k) => MODEL_REGISTRY[k]);
    } else {
      targetKeys = Object.keys(MODEL_REGISTRY);
    }

    if (targetKeys.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid models selected for backup.',
        availableModels: Object.keys(MODEL_REGISTRY),
      });
    }

    const backupData = {};
    const summary = {};
    let totalRecordsCount = 0;

    await Promise.all(
      targetKeys.map(async (key) => {
        const def = MODEL_REGISTRY[key];
        try {
          const query = def.model.find().lean();
          if (key === 'users') {
            query.select('-password -resetPasswordToken -resetPasswordExpire -otp -otpExpires');
          }
          let items = await query.exec();
          if (def.sanitize) {
            items = items.map((i) => def.sanitize(i));
          }
          backupData[key] = items;
          summary[key] = {
            name: def.name,
            category: def.category,
            count: items.length,
          };
          totalRecordsCount += items.length;
        } catch (err) {
          backupData[key] = [];
          summary[key] = {
            name: def.name,
            category: def.category,
            count: 0,
            error: err.message,
          };
        }
      })
    );

    const timestamp = new Date().toISOString();
    const cleanDate = timestamp.replace(/[:.]/g, '-');
    const filename = `education_masters_full_database_backup_${cleanDate}.json`;

    const payload = {
      meta: {
        appName: 'Education Masters',
        exportType: targetKeys.length === Object.keys(MODEL_REGISTRY).length ? 'full_database' : 'custom_selection',
        exportedAt: timestamp,
        totalCollections: targetKeys.length,
        totalRecords: totalRecordsCount,
        exportedBy: req.user?.email || 'admin@educationmasters.in',
        schemaVersion: '2.0.0',
        summary,
      },
      collections: backupData,
    };

    if (download === 'true' || download === '1') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(JSON.stringify(payload, null, 2));
    }

    res.status(200).json({
      success: true,
      filename,
      ...payload,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export Multiple Selected Models or ALL Models as a ZIP Archive with Separate JSON Files
 */
export const exportZipArchive = async (req, res, next) => {
  try {
    const { models: requestedModels, all } = { ...req.query, ...req.body };

    let targetKeys = [];
    if (all === true || all === 'true' || requestedModels === 'all' || requestedModels === '*' || !requestedModels) {
      targetKeys = Object.keys(MODEL_REGISTRY);
    } else if (Array.isArray(requestedModels)) {
      targetKeys = requestedModels.filter((k) => MODEL_REGISTRY[k]);
    } else if (typeof requestedModels === 'string' && requestedModels.trim()) {
      targetKeys = requestedModels
        .split(',')
        .map((k) => k.trim())
        .filter((k) => MODEL_REGISTRY[k]);
    } else {
      targetKeys = Object.keys(MODEL_REGISTRY);
    }

    if (targetKeys.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid models selected for ZIP backup.',
        availableModels: Object.keys(MODEL_REGISTRY),
      });
    }

    const timestamp = new Date().toISOString();
    const cleanDate = timestamp.replace(/[:.]/g, '-');
    const isAll = targetKeys.length === Object.keys(MODEL_REGISTRY).length;
    const filename = isAll
      ? `education_masters_full_database_backup_${cleanDate}.zip`
      : `education_masters_custom_backup_${targetKeys.length}_models_${cleanDate}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const archive = new ZipArchive({
      zlib: { level: 9 },
    });

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: err.message });
      }
    });

    archive.pipe(res);

    const summary = {};
    let totalRecordsCount = 0;

    for (const key of targetKeys) {
      const def = MODEL_REGISTRY[key];
      try {
        const query = def.model.find().lean();
        if (key === 'users') {
          query.select('-password -resetPasswordToken -resetPasswordExpire -otp -otpExpires');
        }
        let items = await query.exec();
        if (def.sanitize) {
          items = items.map((i) => def.sanitize(i));
        }

        totalRecordsCount += items.length;
        summary[key] = {
          name: def.name,
          category: def.category,
          count: items.length,
          file: `${key}.json`,
        };

        const filePayload = {
          meta: {
            appName: 'Education Masters',
            modelKey: def.key,
            modelName: def.name,
            category: def.category,
            totalRecords: items.length,
            exportedAt: timestamp,
            schemaVersion: '2.0.0',
          },
          data: items,
        };

        archive.append(JSON.stringify(filePayload, null, 2), { name: `${key}.json` });
      } catch (err) {
        summary[key] = {
          name: def.name,
          category: def.category,
          count: 0,
          error: err.message,
        };
        archive.append(JSON.stringify({ error: err.message, data: [] }, null, 2), { name: `${key}.json` });
      }
    }

    const manifestPayload = {
      meta: {
        appName: 'Education Masters',
        exportType: isAll ? 'full_database_zip' : 'custom_selection_zip',
        exportedAt: timestamp,
        totalCollections: targetKeys.length,
        totalRecords: totalRecordsCount,
        exportedBy: req.user?.email || 'admin@educationmasters.in',
        schemaVersion: '2.0.0',
        instructions: 'This ZIP archive contains individual partitioned JSON files for each Mongoose model/collection.',
      },
      collections: summary,
    };

    archive.append(JSON.stringify(manifestPayload, null, 2), { name: 'manifest.json' });

    await archive.finalize();
  } catch (error) {
    next(error);
  }
};
