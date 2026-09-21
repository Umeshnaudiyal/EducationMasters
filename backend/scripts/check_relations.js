import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function checkRelations() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  console.log('--- RELATION VALUE CHECKS ---');
  console.log('Institutes with state_id > 0:', await db.collection('institutes').countDocuments({ state_id: { $gt: 0 } }));
  console.log('Institutes with district_id > 0:', await db.collection('institutes').countDocuments({ district_id: { $gt: 0 } }));
  console.log('Institutes with user_id > 0:', await db.collection('institutes').countDocuments({ user_id: { $gt: 0 } }));
  
  console.log('Jobs with media_id > 0:', await db.collection('jobs').countDocuments({ media_id: { $gt: 0 } }));
  console.log('Jobs with user_id > 0:', await db.collection('jobs').countDocuments({ user_id: { $gt: 0 } }));
  console.log('Jobs with state_id > 0:', await db.collection('jobs').countDocuments({ state_id: { $gt: 0 } }));
  
  console.log('Questions with state_id > 0:', await db.collection('questions').countDocuments({ state_id: { $gt: 0 } }));
  console.log('Questions with district_id > 0:', await db.collection('questions').countDocuments({ district_id: { $gt: 0 } }));
  console.log('Questions with user_id > 0:', await db.collection('questions').countDocuments({ user_id: { $gt: 0 } }));
  
  console.log('Categories with parent_id > 0:', await db.collection('categories').countDocuments({ parent_id: { $gt: 0 } }));
  console.log('Categories with media_id > 0:', await db.collection('categories').countDocuments({ media_id: { $gt: 0 } }));
  
  console.log('Adverts with media_id > 0:', await db.collection('adverts').countDocuments({ media_id: { $gt: 0 } }));
  console.log('Media with user_id > 0:', await db.collection('media').countDocuments({ user_id: { $gt: 0 } }));

  await mongoose.disconnect();
}

checkRelations().catch(console.error);
