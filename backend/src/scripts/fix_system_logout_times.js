import 'dotenv/config';
import connectDB from '../config/db.config.js';
import UserLog from '../models/userLog.model.js';
import { getMidnightDateForDateString, formatDuration } from '../utils/session.js';

async function fixSystemLogoutTimes() {
  await connectDB();
  console.log('[Script] Connected to MongoDB. Searching for system_logout records with UTC midnight (05:30 am IST)...');

  // Find all UserLogs where action is 'system_logout' or logout_by is 'system'
  const systemLogs = await UserLog.find({
    $or: [
      { action: 'system_logout' },
      { logout_by: 'system' },
      { action: 'session_expired' },
      { action: 'auto_logout' }
    ]
  });

  console.log(`[Script] Total system logout records found: ${systemLogs.length}`);

  let updatedCount = 0;
  for (const log of systemLogs) {
    if (!log.session_date) continue;

    const correctMidnightIST = getMidnightDateForDateString(log.session_date);
    const correctIso = correctMidnightIST.toISOString(); // ends in T18:30:00.000Z

    const currentLogoutIso = log.logout_time ? new Date(log.logout_time).toISOString() : '';
    const currentExpiresIso = log.expires_at ? new Date(log.expires_at).toISOString() : '';

    // If current logout is null, or ends in T00:00:00.000Z (which renders as 05:30 am IST), or ends in T23:59:59.999Z
    const isFiveThirtyAmLogout =
      !log.logout_time ||
      currentLogoutIso.endsWith('T00:00:00.000Z') ||
      currentLogoutIso.endsWith('T23:59:59.999Z');

    if (isFiveThirtyAmLogout) {
      const loginTime = log.login_time || new Date(`${log.session_date}T09:00:00.000+05:30`);
      const durSec = Math.max(0, Math.floor((correctMidnightIST.getTime() - new Date(loginTime).getTime()) / 1000));

      log.logout_time = correctMidnightIST;
      log.expires_at = correctMidnightIST;
      log.action = 'system_logout';
      log.logout_by = 'system';
      log.status = 'completed';
      log.duration_seconds = durSec;
      log.duration_formatted = formatDuration(durSec);

      await log.save();
      updatedCount++;
    }
  }

  console.log(`[Script] Successfully updated ${updatedCount} system logout records to 12:00 AM IST (${correctMidnightIST_sample()})!`);
  process.exit(0);
}

function correctMidnightIST_sample() {
  return getMidnightDateForDateString('2026-10-08').toISOString();
}

fixSystemLogoutTimes().catch((err) => {
  console.error('[Script] Error:', err);
  process.exit(1);
});
