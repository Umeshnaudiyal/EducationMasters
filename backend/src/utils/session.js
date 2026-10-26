
export const TIMEZONE_IST = 'Asia/Kolkata';


export const getTodayDateString = (dateObj = new Date()) => {
  try {
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE_IST }).format(d);
  } catch (e) {
    const d = new Date(dateObj);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};


export const getMidnightDateForDateString = (dateStr) => {
  if (!dateStr) return getMidnightDate();
  // Start of day in IST:
  const startOfDayMs = new Date(`${dateStr}T00:00:00.000+05:30`).getTime();
  // Midnight ending this date is 24 hours later (00:00:00 IST of next day):
  return new Date(startOfDayMs + 24 * 60 * 60 * 1000);
};

/**
 * Returns the exact Date object for upcoming 12:00:00 AM IST midnight
 */
export const getMidnightDate = (baseDate = new Date()) => {
  const istDateStr = getTodayDateString(baseDate);
  return getMidnightDateForDateString(istDateStr);
};

/**
 * Returns number of seconds remaining until next 12:00:00 AM IST
 * Ensures at least 60 seconds is returned.
 */
export const getSecondsUntilMidnight = (now = new Date()) => {
  const midnight = getMidnightDate(now);
  const diffMs = midnight.getTime() - now.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  return Math.max(diffSec, 60);
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
