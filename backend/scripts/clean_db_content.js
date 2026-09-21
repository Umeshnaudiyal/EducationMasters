import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { cleanHtmlContent } from '../src/utils/cleanHtml.js';

async function runCleanup() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  console.log('--- Cleaning Blogs ---');
  const blogs = await db.collection('blogs').find({}).toArray();
  const blogOps = [];

  for (const blog of blogs) {
    if (blog.content) {
      const cleaned = cleanHtmlContent(blog.content);
      if (cleaned !== blog.content) {
        blogOps.push({
          updateOne: {
            filter: { _id: blog._id },
            update: { $set: { content: cleaned } }
          }
        });
      }
    }
  }

  if (blogOps.length > 0) {
    console.log(`Executing bulkWrite for ${blogOps.length} blogs...`);
    const chunkSize = 500;
    for (let i = 0; i < blogOps.length; i += chunkSize) {
      const chunk = blogOps.slice(i, i + chunkSize);
      await db.collection('blogs').bulkWrite(chunk);
    }
  }
  console.log(`Cleaned ${blogOps.length} / ${blogs.length} blogs.`);

  console.log('\n--- Cleaning Jobs ---');
  const jobs = await db.collection('jobs').find({}).toArray();
  const jobOps = [];

  for (const job of jobs) {
    const update = {};
    const fields = ['content', 'description', 'eligibility', 'fees', 'salary'];
    for (const field of fields) {
      if (job[field] && typeof job[field] === 'string') {
        const cleaned = cleanHtmlContent(job[field]);
        if (cleaned !== job[field]) {
          update[field] = cleaned;
        }
      }
    }

    if (Object.keys(update).length > 0) {
      jobOps.push({
        updateOne: {
          filter: { _id: job._id },
          update: { $set: update }
        }
      });
    }
  }

  if (jobOps.length > 0) {
    console.log(`Executing bulkWrite for ${jobOps.length} jobs...`);
    await db.collection('jobs').bulkWrite(jobOps);
  }
  console.log(`Cleaned ${jobOps.length} / ${jobs.length} jobs.`);

  console.log('\n--- Cleaning Categories & Departments ---');
  const categories = await db.collection('categories').find({}).toArray();
  const catOps = [];
  for (const cat of categories) {
    if (cat.description && typeof cat.description === 'string') {
      const cleaned = cleanHtmlContent(cat.description);
      if (cleaned !== cat.description) {
        catOps.push({
          updateOne: {
            filter: { _id: cat._id },
            update: { $set: { description: cleaned } }
          }
        });
      }
    }
  }
  if (catOps.length > 0) {
    await db.collection('categories').bulkWrite(catOps);
  }
  console.log(`Cleaned ${catOps.length} / ${categories.length} categories.`);

  const departments = await db.collection('departments').find({}).toArray();
  const deptOps = [];
  for (const dept of departments) {
    if (dept.description && typeof dept.description === 'string') {
      const cleaned = cleanHtmlContent(dept.description);
      if (cleaned !== dept.description) {
        deptOps.push({
          updateOne: {
            filter: { _id: dept._id },
            update: { $set: { description: cleaned } }
          }
        });
      }
    }
  }
  if (deptOps.length > 0) {
    await db.collection('departments').bulkWrite(deptOps);
  }
  console.log(`Cleaned ${deptOps.length} / ${departments.length} departments.`);

  console.log('\nAll collections cleaned successfully!');
  await mongoose.disconnect();
}

runCleanup().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
