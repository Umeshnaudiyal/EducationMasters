import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(uri);
  const result = await mongoose.connection.db.collection('mock_tests').updateMany(
    { marks_per_question: { $lt: 0 } },
    { $set: { marks_per_question: 1 } }
  );
  console.log('Fixed negative marks_per_question count:', result.modifiedCount);

  const all = await mongoose.connection.db.collection('mock_tests').find({}).toArray();
  console.log('All tests after fix:', all.map(t => ({ title: t.title, marks_per_question: t.marks_per_question, negative_marking: t.negative_marking })));
  process.exit(0);
}

run().catch(console.error);
