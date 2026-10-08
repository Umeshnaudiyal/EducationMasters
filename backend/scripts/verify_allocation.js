import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MockTest, MockTestSeries, Question } from '../src/models/index.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('--- DB CONNECTION SUCCESS ---');

  const tests = await MockTest.find({}).lean();
  console.log(`Total Mock Tests: ${tests.length}`);
  for (const t of tests) {
    console.log(`- Test: "${t.title}" (slug: ${t.slug}) | Questions: ${t.questions?.length} | total_questions: ${t.total_questions}`);
  }

  const series = await MockTestSeries.find({}).lean();
  console.log(`Total Mock Test Series: ${series.length}`);
  for (const s of series) {
    console.log(`- Series: "${s.title}" (slug: ${s.slug}) | total_tests: ${s.total_tests} | total_questions: ${s.total_questions}`);
  }

  // Ensure two-way sync for any existing tests
  for (const t of tests) {
    if (t.questions && t.questions.length > 0) {
      const qIds = t.questions.map(String);
      await Question.updateMany(
        { _id: { $in: qIds } },
        {
          $addToSet: {
            mock_tests: t._id,
            ...(t.series ? { mock_test_series: t.series } : {}),
          },
        }
      );
      await MockTest.findByIdAndUpdate(t._id, { total_questions: qIds.length });
    }
  }

  // Recalculate series counters
  for (const s of series) {
    const [totalTests, freeTests, allTests] = await Promise.all([
      MockTest.countDocuments({ series: s._id, status: { $in: ['publish', 'published', 'Published'] } }),
      MockTest.countDocuments({
        series: s._id,
        $or: [{ is_paid: false }, { is_free: true }],
        status: { $in: ['publish', 'published', 'Published'] },
      }),
      MockTest.find({ series: s._id }).select('questions').lean(),
    ]);

    const totalQuestions = allTests.reduce((acc, t) => acc + (t.questions?.length || 0), 0);

    await MockTestSeries.findByIdAndUpdate(s._id, {
      total_tests: totalTests,
      free_tests_count: freeTests,
      total_questions: totalQuestions,
    });
    console.log(`Updated series "${s.title}": total_tests=${totalTests}, free_tests=${freeTests}, total_questions=${totalQuestions}`);
  }

  console.log('--- ALLOCATION SYNC COMPLETED SUCCESSFULLY ---');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
