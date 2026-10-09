/**
 * Unified Backend and API URL Resolver for Education Masters
 * 
 * Rules:
 * 1. In Browser (Client-side):
 *    - Relative URLs ('/apis/v1', '/uploads') are used so Next.js rewrites
 *      proxy them to the actual backend without CORS or localhost issues.
 * 
 * 2. On Server (SSR, Route Handlers, NextAuth, SEO Metadata):
 *    - Full absolute URLs are provided because Node.js fetch requires an origin.
 *    - Defaults to live production backend if in production or not configured.
 */

export const PROD_BACKEND_URL = 'https://education-masters-cv8z.vercel.app';
export const LOCAL_BACKEND_URL = 'http://localhost:5001';

/**
 * Get the backend server URL base.
 * - In browser: returns '' (empty string) so `${BACKEND_URL}/apis/...` becomes `/apis/...`
 * - On server: returns full backend origin (e.g. 'https://education-masters-cv8z.vercel.app')
 */
export function getBackendUrl() {
  if (typeof window !== 'undefined') {
    return '';
  }

  const configured =
    process.env.INTERNAL_BACKEND_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL;

  if (configured && configured.trim()) {
    return configured.trim().replace(/\/apis?\/?$/, '');
  }

  return process.env.NODE_ENV === 'production' ? PROD_BACKEND_URL : LOCAL_BACKEND_URL;
}

/**
 * Get an absolute backend URL guaranteed (even on client if an external origin is needed).
 */
export function getAbsoluteBackendUrl() {
  if (typeof window !== 'undefined') {
    if (
      process.env.NEXT_PUBLIC_BACKEND_URL &&
      !process.env.NEXT_PUBLIC_BACKEND_URL.includes('localhost')
    ) {
      return process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/apis?\/?$/, '');
    }
    return window.location.origin;
  }
  return getBackendUrl();
}

/**
 * Get the API base URL.
 * - In browser: '/apis/v1'
 * - On server: 'https://education-masters-cv8z.vercel.app/apis/v1' (or local in dev)
 */
export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    return '/apis/v1';
  }
  return `${getBackendUrl()}/apis/v1`;
}

export const API_BASE = getApiBaseUrl();
export const BACKEND_URL = getBackendUrl();

export default {
  getBackendUrl,
  getAbsoluteBackendUrl,
  getApiBaseUrl,
  API_BASE,
  BACKEND_URL,
  PROD_BACKEND_URL,
  LOCAL_BACKEND_URL,
};
