import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Job, Blog } from '../src/models/index.js';

dotenv.config();

async function testFetch() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Cloud');

  const slug = 'upsc-recruitment-2026-for-212-specialist-assistant-professor-and-more-posts';
  const job = await Job.findOne({ slug }).populate('author').populate('categories').populate('featured_media');
  if (job) {
    console.log('--- REAL MONGODB JOB DOCUMENT FOUND ---');
    console.log('Title:', job.title);
    console.log('Author:', job.author);
    console.log('Total Posts:', job.total_posts);
    console.log('Eligibility:', job.eligibility);
    console.log('Fees:', job.fees);
    console.log('Dates:', job.dates);
    console.log('Links:', job.links);
    console.log('Description length:', job.description?.length);
    console.log('Description snippet:\n', job.description?.slice(0, 1000));
  } else {
    console.log('Job not found by slug:', slug);
  }

  await mongoose.disconnect();
}

testFetch();
