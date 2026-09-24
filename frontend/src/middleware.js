import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET || 'educationmasters_nextauth_secret_2026_super_secure_key';

/**
 * Next.js Edge Middleware for Route Protection
 * - Intercepts all requests to /edu-admin/*
 * - Automatically redirects unauthenticated and expired sessions to /edu-login
 * - Prevents already logged-in administrators with active valid sessions from accessing /edu-login
 */
export async function middleware(req) {
  const { pathname, search } = req.nextUrl;

  const token = await getToken({
    req,
    secret: NEXTAUTH_SECRET,
  });

  const now = new Date();
  const nowTime = now.getTime();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // Check if token exists but has expired (passed 12:00 AM midnight, calendar day changed, or JWT expiration)
  const isDateExpired = Boolean(token?.session_date && token.session_date !== todayStr);
  const isTimeExpired = Boolean(token?.expires_at && nowTime >= new Date(token.expires_at).getTime());
  const isJwtExpired = Boolean(token?.exp && nowTime >= token.exp * 1000);
  const isMarkedExpired = Boolean(token?.isExpired);

  const isTokenExpired = Boolean(
    token && (isDateExpired || isTimeExpired || isJwtExpired || isMarkedExpired)
  );

  const isAuthenticated = Boolean(token && token.id && !isTokenExpired);

  // 1. Protected Admin Panel Routes: /edu-admin and /edu-admin/:path*
  if (pathname.startsWith('/edu-admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/edu-login', req.url);
      if (isTokenExpired) {
        loginUrl.searchParams.set('expired', '1');
      } else {
        loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
      }
      
      const response = NextResponse.redirect(loginUrl);
      // Clean up stale session cookies on expired / unauthenticated redirect
      response.cookies.delete('next-auth.session-token');
      response.cookies.delete('__Secure-next-auth.session-token');
      response.cookies.delete('next-auth.csrf-token');
      response.cookies.delete('__Host-next-auth.csrf-token');
      return response;
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
    // Only redirect to admin if authenticated AND not expired
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

