import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://invincibleumesh28_db_user:htx9Tc74HRdqE403@cluster28.ktzer3o.mongodb.net/educationmasters?retryWrites=true&w=majority';

async function test() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const blogWithAuthor = await db.collection('blogs').countDocuments({ author: { $ne: null } });
  const blogTotal = await db.collection('blogs').countDocuments({});
  const blogWithUserId = await db.collection('blogs').countDocuments({ user_id: { $ne: null } });
  console.log('Blogs: total =', blogTotal, ', with author =', blogWithAuthor, ', with user_id =', blogWithUserId);

  const sampleBlog = await db.collection('blogs').findOne({ slug: 'uttarakhand-current-affairs-november-40-important-updates' });
  console.log('Sample current affair blog:', {
    _id: sampleBlog?._id,
    title: sampleBlog?.title,
    author: sampleBlog?.author,
    user_id: sampleBlog?.user_id
  });

  if (sampleBlog?.author) {
    const authorDoc = await db.collection('users').findOne({ _id: sampleBlog.author });
    console.log('Sample blog author doc:', {
      _id: authorDoc?._id,
      name: authorDoc?.name,
      email: authorDoc?.email,
      image: authorDoc?.image,
      bio: authorDoc?.bio?.substring(0, 50)
    });
  }

  const jobWithAuthor = await db.collection('jobs').countDocuments({ author: { $ne: null } });
  const jobTotal = await db.collection('jobs').countDocuments({});
  const jobWithUserId = await db.collection('jobs').countDocuments({ user_id: { $ne: null } });
  console.log('Jobs: total =', jobTotal, ', with author =', jobWithAuthor, ', with user_id =', jobWithUserId);

  const sampleJob = await db.collection('jobs').findOne({});
  console.log('Sample job:', {
    _id: sampleJob?._id,
    title: sampleJob?.title,
    author: sampleJob?.author,
    user_id: sampleJob?.user_id
  });

  if (sampleJob?.author) {
    const jobAuthorDoc = await db.collection('users').findOne({ _id: sampleJob.author });
    console.log('Sample job author doc:', {
      _id: jobAuthorDoc?._id,
      name: jobAuthorDoc?.name,
      email: jobAuthorDoc?.email,
      image: jobAuthorDoc?.image,
      bio: jobAuthorDoc?.bio?.substring(0, 50)
    });
  }

  await mongoose.disconnect();
}

test().catch(console.error);
