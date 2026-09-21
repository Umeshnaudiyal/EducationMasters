import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function cleanBrokenImages() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/educationmasters';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const collections = [
      'examinations',
      'subjects',
      'states',
      'topics',
      'topic_groups',
      'blogs',
      'jobs',
      'departments',
      'categories',
      'admitcards',
      'results',
      'institutes',
    ];

    let grandTotalUpdated = 0;

    for (const colName of collections) {
      const col = mongoose.connection.db.collection(colName);
      const docs = await col.find({}).toArray();
      let updatedCount = 0;

      for (const doc of docs) {
        const updateFields = {};
        let needsUpdate = false;

        // Check image field
        if (typeof doc.image === 'string') {
          const img = doc.image.trim();
          if (
            img.endsWith('/') ||
            img.endsWith('\\') ||
            img === 'placeholder.png' ||
            img === '/placeholder.png' ||
            img.includes('placeholder.png') ||
            img === 'null' ||
            img === 'undefined'
          ) {
            updateFields.image = '';
            needsUpdate = true;
          }
        }

        // Check featured_media field
        if (typeof doc.featured_media === 'string') {
          const fm = doc.featured_media.trim();
          if (
            fm.endsWith('/') ||
            fm.endsWith('\\') ||
            fm === 'placeholder.png' ||
            fm === '/placeholder.png' ||
            fm.includes('placeholder.png') ||
            fm === 'null' ||
            fm === 'undefined'
          ) {
            updateFields.featured_media = '';
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          await col.updateOne({ _id: doc._id }, { $set: updateFields });
          updatedCount++;
        }
      }

      console.log(`[${colName}] Cleaned ${updatedCount} records out of ${docs.length}`);
      grandTotalUpdated += updatedCount;
    }

    console.log(`\nSuccessfully cleaned ${grandTotalUpdated} total broken/placeholder image references.`);
  } catch (err) {
    console.error('Error cleaning images:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

cleanBrokenImages();
