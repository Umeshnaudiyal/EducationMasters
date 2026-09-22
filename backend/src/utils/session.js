/**
 * Session & Date Utility Helpers
 * Supports daily midnight (12:00 AM) expiration and session tracking
 */

/**
 * Returns number of seconds remaining until midnight (12:00:00 AM of the next day)
 * Ensures at least 60 seconds is returned.
 */
export const getSecondsUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // 00:00:00.000 of next day
  const diffMs = midnight.getTime() - now.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  return Math.max(diffSec, 60);
};

/**
 * Returns the exact Date object for the upcoming midnight (12:00 AM)
 */
export const getMidnightDate = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight;
};

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export const getTodayDateString = (dateObj = new Date()) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format duration in seconds into human-readable string (e.g., "2 hrs 15 mins", "45 mins", "30 secs")
 */
export const formatDuration = (totalSeconds) => {
  if (!totalSeconds || totalSeconds <= 0) return '0 secs';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
  if (hours === 0 && seconds > 0) parts.push(`${seconds} sec${seconds > 1 ? 's' : ''}`);

  return parts.join(' ') || '1 sec';
};

/**
 * Extract simple device name from User-Agent string
 */
export const parseUserAgentDevice = (ua = '') => {
  if (!ua) return 'Desktop';
  const lower = ua.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(lower)) {
    return 'Mobile';
  }
  if (/tablet|ipad/i.test(lower)) {
    return 'Tablet';
  }
  return 'Desktop';
};
