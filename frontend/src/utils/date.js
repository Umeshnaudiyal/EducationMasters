/**
 * Format timestamp into human-readable relative time (e.g., "3 hours ago", "2 days ago")
 */
export function formatTimeAgo(dateInput) {
  if (!dateInput) return 'Recently';

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
  } catch {
    return 'Recently';
  }
}

/**
 * Format timestamp into clean date string (e.g., "13 Sep, 2026")
 */
export function formatDate(dateInput) {
  if (!dateInput) return '17 Sep, 2026';

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '17 Sep, 2026';

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '17 Sep, 2026';
  }
}

export default { formatTimeAgo, formatDate };
