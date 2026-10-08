import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    const col = db.collection(c.name);
    const docs = await col.find({
      $or: [
        { description: { $regex: 'Jagannath|Jamsetjee|Indian Railway', $options: 'i' } },
        { content: { $regex: 'Jagannath|Jamsetjee|Indian Railway', $options: 'i' } },
        { title: { $regex: 'Indian Railway', $options: 'i' } },
        { name: { $regex: 'Indian Railway', $options: 'i' } }
      ]
    }).toArray();
    if (docs.length > 0) {
      console.log('\n--- Collection:', c.name, 'Docs count:', docs.length);
      for (const d of docs) {
        console.log('Doc ID:', d._id, '| Name/Title:', d.name || d.title, '| Slug:', d.slug);
        if (d.description) {
          console.log('  description:', JSON.stringify(d.description.slice(0, 300)));
        }
        if (d.content) {
          console.log('  content:', JSON.stringify(d.content.slice(0, 300)));
        }
      }
    }
  }
  await mongoose.disconnect();
}
run();
