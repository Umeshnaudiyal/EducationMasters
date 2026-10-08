import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { stripHtmlToPlainText } from '../src/utils/cleanHtml.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanAllMetaDescriptions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;

    const collections = [
      'subjects',
      'topics',
      'examinations',
      'jobs',
      'blogs',
      'categories',
      'departments',
      'states',
      'results',
      'admitcards',
      'institutes'
    ];

    let totalUpdated = 0;

    for (const colName of collections) {
      const col = db.collection(colName);
      // Find docs where meta_description or seo has HTML/entities
      const docs = await col.find({
        $or: [
          { 'meta_description': { $regex: /<[a-z]|&[a-z0-9#]+;/i } },
          { 'meta_title': { $regex: /<[a-z]|&[a-z0-9#]+;/i } },
          { 'meta_keywords': { $regex: /<[a-z]|&[a-z0-9#]+;/i } },
          { 'seo.meta_description': { $regex: /<[a-z]|&[a-z0-9#]+;/i } },
          { 'seo.meta_title': { $regex: /<[a-z]|&[a-z0-9#]+;/i } },
          { 'seo.meta_keywords': { $regex: /<[a-z]|&[a-z0-9#]+;/i } }
        ]
      }).toArray();

      let updatedInCol = 0;

      for (const doc of docs) {
        let changed = false;
        const updateFields = {};

        if (doc.meta_description && /<[a-z]|&[a-z0-9#]+;/i.test(doc.meta_description)) {
          const cleaned = stripHtmlToPlainText(doc.meta_description);
          if (cleaned !== doc.meta_description) {
            updateFields.meta_description = cleaned;
            changed = true;
          }
        }

        if (doc.meta_title && /<[a-z]|&[a-z0-9#]+;/i.test(doc.meta_title)) {
          const cleaned = stripHtmlToPlainText(doc.meta_title);
          if (cleaned !== doc.meta_title) {
            updateFields.meta_title = cleaned;
            changed = true;
          }
        }

        if (doc.meta_keywords && /<[a-z]|&[a-z0-9#]+;/i.test(doc.meta_keywords)) {
          const cleaned = stripHtmlToPlainText(doc.meta_keywords);
          if (cleaned !== doc.meta_keywords) {
            updateFields.meta_keywords = cleaned;
            changed = true;
          }
        }

        if (doc.seo && typeof doc.seo === 'object') {
          let seoChanged = false;
          const newSeo = { ...doc.seo };

          if (newSeo.meta_description && /<[a-z]|&[a-z0-9#]+;/i.test(newSeo.meta_description)) {
            const cleaned = stripHtmlToPlainText(newSeo.meta_description);
            if (cleaned !== newSeo.meta_description) {
              newSeo.meta_description = cleaned;
              seoChanged = true;
            }
          }

          if (newSeo.meta_title && /<[a-z]|&[a-z0-9#]+;/i.test(newSeo.meta_title)) {
            const cleaned = stripHtmlToPlainText(newSeo.meta_title);
            if (cleaned !== newSeo.meta_title) {
              newSeo.meta_title = cleaned;
              seoChanged = true;
            }
          }

          if (newSeo.meta_keywords && /<[a-z]|&[a-z0-9#]+;/i.test(newSeo.meta_keywords)) {
            const cleaned = stripHtmlToPlainText(newSeo.meta_keywords);
            if (cleaned !== newSeo.meta_keywords) {
              newSeo.meta_keywords = cleaned;
              seoChanged = true;
            }
          }

          if (seoChanged) {
            updateFields.seo = newSeo;
            changed = true;
          }
        }

        if (changed) {
          await col.updateOne({ _id: doc._id }, { $set: updateFields });
          updatedInCol++;
        }
      }

      if (updatedInCol > 0) {
        console.log(`✓ Cleaned SEO meta tags in ${updatedInCol} documents for collection: ${colName}`);
        totalUpdated += updatedInCol;
      }
    }

    console.log(`\n🎉 Total documents updated: ${totalUpdated}`);

    // Verify General Knowledge subject
    const gk = await db.collection('subjects').findOne({ slug: 'general-knowledge' });
    if (gk) {
      console.log('\nGeneral Knowledge Subject SEO after cleanup:');
      console.log('seo.meta_description:', gk.seo?.meta_description || gk.meta_description);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning meta descriptions:', error);
    process.exit(1);
  }
}

cleanAllMetaDescriptions();
