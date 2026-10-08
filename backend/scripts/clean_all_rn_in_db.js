import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { cleanHtmlContent } from '../src/utils/cleanHtml.js';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  let totalUpdated = 0;

  for (const c of collections) {
    const colName = c.name;
    const col = db.collection(colName);
    const docs = await col.find({}).toArray();

    let colUpdated = 0;

    for (const doc of docs) {
      let modified = false;
      const updateFields = {};

      const stringFields = [
        'content',
        'description',
        'description_hi',
        'about_state',
        'job_description',
        'eligibility',
        'fees',
        'application_fee',
        'salary',
        'pay_scale',
        'selection_process',
        'how_to_apply',
        'important_links',
        'overview',
        'details',
      ];

      for (const field of stringFields) {
        if (doc[field] && typeof doc[field] === 'string') {
          // Check if field contains corrupted rn or \r\n
          if (doc[field].includes('rn') || doc[field].includes('\r\n') || doc[field].includes('\\r\\n')) {
            const cleaned = cleanHtmlContent(doc[field]);
            if (cleaned !== doc[field]) {
              updateFields[field] = cleaned;
              modified = true;
            }
          }
        }
      }

      // Check nested SEO fields
      if (doc.seo) {
        let seoModified = false;
        const newSeo = { ...doc.seo };
        ['meta_title', 'meta_description', 'meta_keywords'].forEach((sf) => {
          if (newSeo[sf] && typeof newSeo[sf] === 'string') {
            const cleaned = cleanHtmlContent(newSeo[sf]);
            if (cleaned !== newSeo[sf]) {
              newSeo[sf] = cleaned;
              seoModified = true;
            }
          }
        });
        if (seoModified) {
          updateFields.seo = newSeo;
          modified = true;
        }
      }

      if (modified) {
        await col.updateOne({ _id: doc._id }, { $set: updateFields });
        colUpdated++;
      }
    }

    if (colUpdated > 0) {
      console.log(`✓ Cleaned ${colUpdated} documents in collection: ${colName}`);
      totalUpdated += colUpdated;
    }
  }

  console.log(`\n Total documents cleaned across all collections: ${totalUpdated}`);

  // Specifically check the Railway examination doc
  const railwayDoc = await db.collection('examinations').findOne({ slug: 'railway' });
  if (railwayDoc) {
    console.log('\nRailway Exam Description after cleanup:\n', railwayDoc.description);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
