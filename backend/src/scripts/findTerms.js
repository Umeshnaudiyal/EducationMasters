import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb+srv://invincibleumesh28_db_user:htx9Tc74HRdqE403@cluster28.ktzer3o.mongodb.net/educationmasters?retryWrites=true&w=majority');
  const cols = await mongoose.connection.db.listCollections().toArray();
  for (const c of cols) {
    const docs = await mongoose.connection.db.collection(c.name).find({
      $or: [
        { slug: /terms/i },
        { title: /terms of service/i },
        { title: /terms/i },
      ]
    }).toArray();
    if (docs.length > 0) {
      console.log(`FOUND IN ${c.name}:`, docs.map(d => ({ id: d._id, title: d.title, slug: d.slug })));
    }
  }
  process.exit(0);
}

run();
