import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://invincibleumesh28_db_user:htx9Tc74HRdqE403@cluster28.ktzer3o.mongodb.net/educationmasters?retryWrites=true&w=majority';

async function runCleanup() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const collections = ['jobs', 'admitcards', 'results', 'articles'];
    const placeholderPatterns = [
      /^\s*[-—–]+\s*please choose\s*[-—–]*\s*$/i,
      /^\s*please choose\s*$/i,
      /^\s*[-—–]+\s*select\s*[-—–]*\s*$/i,
      /^\s*select\s*$/i,
      /^\s*[-—–]+\s*select (state|department|country)\s*[-—–]*\s*$/i,
      /^\s*none\s*$/i,
      /^\s*null\s*$/i,
      /^\s*undefined\s*$/i,
    ];

    const fieldsToCheck = ['dept', 'state_name', 'country_name', 'department_name', 'state', 'department', 'country'];

    for (const colName of collections) {
      const col = mongoose.connection.db.collection(colName);
      for (const field of fieldsToCheck) {
        for (const pattern of placeholderPatterns) {
          const res = await col.updateMany(
            { [field]: { $regex: pattern } },
            { $set: { [field]: null } }
          );
          if (res.modifiedCount > 0) {
            console.log(`Updated ${res.modifiedCount} docs in ${colName} where ${field} matched ${pattern}`);
          }
        }
      }
    }

    console.log('Cleanup completed successfully!');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runCleanup();
