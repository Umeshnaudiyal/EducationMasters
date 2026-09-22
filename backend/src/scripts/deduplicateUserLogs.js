import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const parts = [];
  if (hrs > 0) parts.push(hrs + ' hr' + (hrs > 1 ? 's' : ''));
  if (mins > 0) parts.push(mins + ' min' + (mins > 1 ? 's' : ''));
  if (secs > 0 || parts.length === 0) parts.push(secs + ' sec' + (secs > 1 ? 's' : ''));
  return parts.join(' ');
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/educationmasters');
  const UserLog = mongoose.model('UserLog', new mongoose.Schema({}, { strict: false }));

  const duplicates = await UserLog.aggregate([
    {
      $group: {
        _id: { user: '$user', session_date: '$session_date' },
        count: { $sum: 1 },
        docs: { $push: '$$ROOT' },
      },
    },
    { $match: { count: { $gt: 1 }, '_id.session_date': { $ne: null } } },
  ]);

  console.log('Duplicate groups found:', duplicates.length);

  for (const group of duplicates) {
    const docs = group.docs;
    docs.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

    const primaryDoc = docs[0];
    const otherDocIds = docs.slice(1).map((d) => d._id);

    const loginTimes = docs.map((d) => d.login_time).filter(Boolean).map((t) => new Date(t));
    const earliestLogin = loginTimes.length > 0 ? new Date(Math.min(...loginTimes)) : (primaryDoc.login_time || new Date());

    const logoutTimes = docs.map((d) => d.logout_time).filter(Boolean).map((t) => new Date(t));
    const latestLogout = logoutTimes.length > 0 ? new Date(Math.max(...logoutTimes)) : null;

    const hasActive = docs.some((d) => d.status === 'active');
    const finalStatus = hasActive ? 'active' : 'completed';

    let durationSeconds = 0;
    if (latestLogout && earliestLogin) {
      durationSeconds = Math.max(0, Math.floor((latestLogout.getTime() - earliestLogin.getTime()) / 1000));
    } else {
      durationSeconds = Math.max(...docs.map((d) => d.duration_seconds || 0));
    }

    const lastDoc = docs[docs.length - 1];

    await UserLog.updateOne(
      { _id: primaryDoc._id },
      {
        $set: {
          action: 'login',
          login_time: earliestLogin,
          logout_time: hasActive ? undefined : (latestLogout || primaryDoc.logout_time),
          status: finalStatus,
          duration_seconds: durationSeconds,
          duration_formatted: formatDuration(durationSeconds),
          user_name: lastDoc.user_name || primaryDoc.user_name,
          email: lastDoc.email || primaryDoc.email,
          role: lastDoc.role || primaryDoc.role,
          ip_address: lastDoc.ip_address || primaryDoc.ip_address,
          user_agent: lastDoc.user_agent || primaryDoc.user_agent,
          device: lastDoc.device || primaryDoc.device,
        },
        $unset: hasActive ? { logout_time: 1 } : {},
      }
    );

    await UserLog.deleteMany({ _id: { $in: otherDocIds } });
    console.log(`Merged group for user: ${group._id.user} date: ${group._id.session_date} - removed ${otherDocIds.length} duplicates`);
  }

  console.log('Deduplication completed successfully.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
