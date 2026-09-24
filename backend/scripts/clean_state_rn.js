import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { cleanHtmlContent } from '../src/utils/cleanHtml.js';

dotenv.config({ path: 'd:/EducationMasters/backend/.env' });

const MONGO_URI = process.env.MONGODB_URI;

async function cleanAllStateData() {
  console.log('Connecting to MongoDB Atlas to clean all state documents...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected!');

  const State = mongoose.models.State || mongoose.model('State', new mongoose.Schema({}, { strict: false }), 'states');
  const states = await State.find({});

  console.log(`Found ${states.length} states to process.`);

  let modifiedCount = 0;

  for (const s of states) {
    let hasChanges = false;
    const updates = {};

    const stringFields = [
      'description',
      'description_hi',
      'job_description',
      'about_state',
      'capital',
      'governor',
      'chief_minister',
      'land_area',
      'population',
    ];

    for (const f of stringFields) {
      if (typeof s[f] === 'string' && s[f].length > 0) {
        const cleaned = cleanHtmlContent(s[f]);
        if (cleaned !== s[f]) {
          updates[f] = cleaned;
          hasChanges = true;
        }
      }
    }

    // Also check SEO
    if (s.seo) {
      let seoChanged = false;
      const seoUpdate = { ...s.seo };
      if (typeof s.seo.meta_title === 'string') {
        const cl = cleanHtmlContent(s.seo.meta_title);
        if (cl !== s.seo.meta_title) { seoUpdate.meta_title = cl; seoChanged = true; }
      }
      if (typeof s.seo.meta_description === 'string') {
        const cl = cleanHtmlContent(s.seo.meta_description);
        if (cl !== s.seo.meta_description) { seoUpdate.meta_description = cl; seoChanged = true; }
      }
      if (typeof s.seo.meta_keywords === 'string') {
        const cl = cleanHtmlContent(s.seo.meta_keywords);
        if (cl !== s.seo.meta_keywords) { seoUpdate.meta_keywords = cl; seoChanged = true; }
      }
      if (seoChanged) {
        updates.seo = seoUpdate;
        hasChanges = true;
      }
    }

    // Also check SEO Hindi
    if (s.seo_hi) {
      let seoHiChanged = false;
      const seoHiUpdate = { ...s.seo_hi };
      if (typeof s.seo_hi.meta_title === 'string') {
        const cl = cleanHtmlContent(s.seo_hi.meta_title);
        if (cl !== s.seo_hi.meta_title) { seoHiUpdate.meta_title = cl; seoHiChanged = true; }
      }
      if (typeof s.seo_hi.meta_description === 'string') {
        const cl = cleanHtmlContent(s.seo_hi.meta_description);
        if (cl !== s.seo_hi.meta_description) { seoHiUpdate.meta_description = cl; seoHiChanged = true; }
      }
      if (typeof s.seo_hi.meta_keywords === 'string') {
        const cl = cleanHtmlContent(s.seo_hi.meta_keywords);
        if (cl !== s.seo_hi.meta_keywords) { seoHiUpdate.meta_keywords = cl; seoHiChanged = true; }
      }
      if (seoHiChanged) {
        updates.seo_hi = seoHiUpdate;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await State.updateOne({ _id: s._id }, { $set: updates });
      console.log(`✓ Cleaned state: [${s.name}] (${s.slug}) -> Fields: ${Object.keys(updates).join(', ')}`);
      modifiedCount++;
    }
  }

  console.log(`\nDone! Successfully updated ${modifiedCount} state records in MongoDB Atlas.`);

  await mongoose.disconnect();
}

cleanAllStateData().catch((err) => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
