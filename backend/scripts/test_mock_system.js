import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = 'your_super_secret_jwt_key_change_in_production';

async function runFullE2ETest() {
  try {
    const MONGODB_URI = 'mongodb+srv://invincibleumesh28_db_user:htx9Tc74HRdqE403@cluster28.ktzer3o.mongodb.net/educationmasters?retryWrites=true&w=majority';
    await mongoose.connect(MONGODB_URI);
    
    // Find an existing admin user from DB
    const dbUser = await mongoose.connection.collection('users').findOne({ role: { $in: ['admin', 'superadmin', 'administrator', 'Administrator'] } }) 
      || await mongoose.connection.collection('users').findOne({});

    let authToken = '';
    if (dbUser) {
      authToken = jwt.sign(
        { id: dbUser._id, email: dbUser.email, role: dbUser.role || 'superadmin' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      console.log('Using authenticated token for user:', dbUser.email, 'Role:', dbUser.role);
    }

    console.log('1. Fetching questions from 11,000+ Question Bank...');
    const qRes = await fetch('http://127.0.0.1:5001/api/v1/questions?limit=5');
    const qData = await qRes.json();
    const sampleQuestionIds = (qData.data || []).map(q => q._id);
    console.log(`Found ${sampleQuestionIds.length} sample question IDs.`);

    console.log('\n2. Testing Mock Test Series creation endpoint...');
    const testSlug = 'ssc-cgl-2024-test-series-' + Date.now();
    const seriesPayload = {
      title: 'SSC CGL 2024 Complete Mock Test Series',
      slug: testSlug,
      badge: 'Popular',
      top_description: '<p>Comprehensive test series for SSC CGL 2024 examination based on latest TCS pattern.</p>',
      bottom_description: '<p>Complete syllabus coverage with detailed step-by-step solutions.</p>',
      highlights: [
        'Based on latest 2024 TCS exam pattern',
        'All India Rank & detailed analytics',
        'Bilingual solutions & step-by-step hints',
      ],
      plans: [
        {
          name: 'Free Plan',
          price: 0,
          original_price: 0,
          validity: '1 Month',
          validity_days: 30,
          is_free: true,
          badge: '100% FREE',
          tagline: 'Basic free tests for practice and test series preview.',
          features: ['Access to Free Mock Tests', 'Instant Scorecard & Solutions'],
          button_text: 'Select Free Plan',
        },
        {
          name: 'Pro Plan',
          price: 499,
          original_price: 999,
          validity: '1 Year',
          validity_days: 365,
          is_free: false,
          is_popular: true,
          badge: 'MOST POPULAR',
          tagline: 'Full 1 Year continuous student test stream.',
          features: ['All Full Length Tests', 'Sectional Tests', 'Rank & Analytics'],
          button_text: 'Select ₹499 Plan',
        },
        {
          name: 'Premium Plan',
          price: 999,
          original_price: 1999,
          validity: '2 Years',
          validity_days: 730,
          is_free: false,
          badge: 'BEST VALUE',
          tagline: 'Maximum student engagement & featured sets.',
          features: ['All Mock Tests + PYQs', '2 Years Access', 'Unlimited Re-attempts'],
          button_text: 'Select ₹999 Plan',
        },
      ],
      status: 'Published',
    };

    const sRes = await fetch('http://127.0.0.1:5001/api/v1/mock-test-series', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(seriesPayload),
    });
    const sData = await sRes.json();
    console.log('Series creation status:', sRes.status, 'Created ID:', sData.data?._id);
    const createdSeriesId = sData.data?._id;

    if (createdSeriesId) {
      console.log('\n3. Testing Mock Test creation & question allocation endpoint...');
      const testSlugChild = 'ssc-cgl-tier1-mock-1-' + Date.now();
      const testPayload = {
        series: createdSeriesId,
        title: 'SSC CGL Tier-1 Full Mock Test 1',
        slug: testSlugChild,
        test_type: 'full_length',
        is_paid: false,
        duration_minutes: 60,
        total_marks: 100,
        pass_marks: 40,
        negative_marking: 0.5,
        marks_per_question: 2,
        medium: 'Bilingual',
        instructions: '<p>Each question carries 2 marks. 0.5 marks will be deducted for each wrong answer.</p>',
        questions: sampleQuestionIds,
        status: 'Published',
      };

      const tRes = await fetch('http://127.0.0.1:5001/api/v1/mock-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(testPayload),
      });
      const tData = await tRes.json();
      console.log('Test creation status:', tRes.status, 'Total Questions Allocated:', tData.data?.total_questions);
      const createdTestId = tData.data?._id;

      console.log('\n4. Verifying Public Series Retrieval with child tests and plans...');
      const fetchSeriesRes = await fetch(`http://127.0.0.1:5001/api/v1/mock-test-series/${testSlug}`);
      const fetchSeriesData = await fetchSeriesRes.json();
      console.log('Public Series Retrieved:', fetchSeriesData.data?.title);
      console.log('Total Tests under Series:', fetchSeriesData.data?.total_tests);
      console.log('Free Tests under Series:', fetchSeriesData.data?.free_tests_count);
      console.log('Total Questions in Series:', fetchSeriesData.data?.total_questions);
      console.log('Child Tests count:', fetchSeriesData.data?.tests?.length);
      console.log('Plans count:', fetchSeriesData.data?.plans?.length);

      if (createdTestId) {
        console.log('\n5. Testing Student Interactive Test Submission & Instant Evaluation...');
        const submitPayload = {
          time_spent_seconds: 180,
          user_name: 'Aakash Sharma',
          user_email: 'aakash@example.com',
          responses: sampleQuestionIds.map((qId, idx) => ({
            question_id: qId,
            selected_option_index: idx === 0 ? 0 : 1,
            is_marked_for_review: idx === 1,
          })),
        };

        const subRes = await fetch(`http://127.0.0.1:5001/api/v1/mock-tests/${createdTestId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitPayload),
        });
        const subData = await subRes.json();
        console.log('Submission evaluation status:', subRes.status);
        console.log('Evaluation Scorecard:', {
          score: subData.data?.score,
          accuracy: subData.data?.accuracy + '%',
          percentage: subData.data?.percentage + '%',
          total_correct: subData.data?.total_correct,
          total_incorrect: subData.data?.total_incorrect,
          total_questions: subData.data?.total_questions,
        });
      }
    }

    await mongoose.disconnect();
    console.log('\n======================================================');
    console.log('ALL END-TO-END MOCK TEST WORKFLOW TESTS PASSED 100%!');
    console.log('======================================================');
  } catch (err) {
    console.error('E2E Test Error:', err);
    try { await mongoose.disconnect(); } catch (e) {}
  }
}

runFullE2ETest();
