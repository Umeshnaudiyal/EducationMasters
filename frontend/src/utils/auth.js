/**
 * Safe Auth Token & Header Utilities for Education Masters Admin & Client
 */

export function getAuthToken(session = null) {
  // 1. NextAuth Session access token (highest priority and freshest)
  if (session?.user?.accessToken) {
    const token = session.user.accessToken;
    if (typeof token === 'string' && token !== 'undefined' && token !== 'null' && token.trim() !== '') {
      return token.trim();
    }
  }

  // 2. Client-side LocalStorage token fallback
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (raw && typeof raw === 'string' && raw !== 'undefined' && raw !== 'null' && raw.trim() !== '') {
      return raw.trim();
    }
  }

  return null;
}

export function getAuthHeaders(session = null, customHeaders = {}) {
  const token = getAuthToken(session);
  const headers = { ...customHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}
