import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET || 'educationmasters_nextauth_secret_2026_super_secure_key';

/**
 * Next.js Edge Middleware for Route Protection
 * - Intercepts all requests to /edu-admin/*
 * - Automatically redirects unauthenticated users to /edu-login
 * - Prevents already logged-in administrators from accessing /edu-login
 */
export async function middleware(req) {
  const { pathname, search } = req.nextUrl;

  const token = await getToken({
    req,
    secret: NEXTAUTH_SECRET,
  });

  const isAuthenticated = Boolean(token && token.id);

  // 1. Protected Admin Panel Routes: /edu-admin and /edu-admin/:path*
  if (pathname.startsWith('/edu-admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/edu-login', req.url);
      loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    // Block deactivated/inactive accounts at the edge
    const status = (token.status || 'active').toLowerCase();
    if (status === 'inactive' || status === 'blocked' || status === 'deactivated') {
      const loginUrl = new URL('/edu-login', req.url);
      loginUrl.searchParams.set('inactive', '1');
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Authentication Login Page: /edu-login
  if (pathname === '/edu-login') {
    if (isAuthenticated) {
      const userRole = (token.role || '').toLowerCase();
      // If student/end-user, redirect to homepage, else redirect to admin dashboard
      if (userRole === 'user' || userRole === 'subscriber') {
        return NextResponse.redirect(new URL('/', req.url));
      }
      return NextResponse.redirect(new URL('/edu-admin', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/edu-admin',
    '/edu-admin/:path*',
    '/edu-login',
  ],
};
