import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://invincibleumesh28_db_user:htx9Tc74HRdqE403@cluster28.ktzer3o.mongodb.net/educationmasters?retryWrites=true&w=majority';

async function seedAndLinkCountries() {
  console.log('[Countries Setup] Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('[Countries Setup] Connected successfully!');

  const db = mongoose.connection.db;

  const defaultCountries = [
    { sql_id: 1, name: 'India', code: 'IN', slug: 'india', phone_code: '+91' },
    { sql_id: 2, name: 'United States', code: 'US', slug: 'united-states', phone_code: '+1' },
    { sql_id: 3, name: 'United Kingdom', code: 'GB', slug: 'united-kingdom', phone_code: '+44' },
    { sql_id: 4, name: 'Canada', code: 'CA', slug: 'canada', phone_code: '+1' },
    { sql_id: 5, name: 'Australia', code: 'AU', slug: 'australia', phone_code: '+61' },
  ];

  console.log('\n[1/3] Seeding Countries into MongoDB...');
  for (const c of defaultCountries) {
    await db.collection('countries').updateOne(
      { slug: c.slug },
      { $setOnInsert: { ...c, createdAt: new Date(), updatedAt: new Date() } },
      { upsert: true }
    );
  }
  const countriesCount = await db.collection('countries').countDocuments();
  console.log(`  ✓ Total Countries in MongoDB: ${countriesCount}`);

  // Fetch India document
  const indiaDoc = await db.collection('countries').findOne({ slug: 'india' });
  console.log(`  ✓ Default Country (India) ObjectId: ${indiaDoc._id}`);

  // Link States to Country (India)
  console.log('\n[2/3] Linking all States to India ObjectId...');
  const stateResult = await db.collection('states').updateMany(
    {},
    { $set: { country: indiaDoc._id, country_id: indiaDoc.sql_id } }
  );
  console.log(`  ✓ Updated ${stateResult.modifiedCount || stateResult.matchedCount} State documents with Country reference.`);

  // Verification sample
  console.log('\n[3/3] Verifying Country -> State -> District Hierarchy...');
  const sampleState = await db.collection('states').findOne();
  const sampleDistrict = await db.collection('districts').findOne({ state_id: sampleState.sql_id });

  console.log('--- SAMPLE HIERARCHY ---');
  console.log('Country:', { name: indiaDoc.name, code: indiaDoc.code, id: indiaDoc._id });
  console.log('State:', { name: sampleState.name, id: sampleState._id, country_ref: sampleState.country });
  console.log('District:', { name: sampleDistrict?.name, id: sampleDistrict?._id, state_ref: sampleDistrict?.state });
  console.log('------------------------\n');

  await mongoose.disconnect();
}

seedAndLinkCountries().catch(console.error);
