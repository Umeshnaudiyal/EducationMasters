import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { decode as defaultDecode } from 'next-auth/jwt';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'educationmasters_nextauth_secret_2026_super_secure_key';

const getTodayDateString = (dateObj = new Date()) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }

        try {
          const res = await fetch(`${BACKEND_URL}/apis/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await res.json();

          if (res.ok && data.success && data.data?.token) {
            return {
              id: data.data.user.id,
              name: data.data.user.name,
              nicename: data.data.user.nicename,
              email: data.data.user.email,
              role: data.data.user.role,
              permissions: data.data.user.permissions || [],
              institute_id: data.data.user.institute_id || null,
              login_time: data.data.user.login_time || null,
              logout_time: data.data.user.logout_time || null,
              last_login_time: data.data.user.last_login_time || null,
              session_date: data.data.user.session_date || null,
              expires_at: data.data.user.expires_at || null,
              accessToken: data.data.token,
            };
          } else {
            throw new Error(data.message || 'Invalid email or password');
          }
        } catch (error) {
          throw new Error(error.message || 'Authentication failed');
        }
      },
    }),
  ],
  jwt: {
    async decode(params) {
      try {
        return await defaultDecode(params);
      } catch {
        // Gracefully handle any stale / old encrypted cookies without logging JWE error
        return null;
      }
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.nicename = user.nicename;
        token.role = user.role;
        token.permissions = user.permissions;
        token.institute_id = user.institute_id;
        token.login_time = user.login_time;
        token.logout_time = user.logout_time;
        token.last_login_time = user.last_login_time;
        token.session_date = user.session_date;
        token.expires_at = user.expires_at;
        token.accessToken = user.accessToken;
      }
      if (trigger === 'update' && session) {
        if (session.logout_time) token.logout_time = session.logout_time;
        if (session.login_time) token.login_time = session.login_time;
      }

      // Check if session has expired past 12:00 AM midnight or on next calendar day
      const now = new Date();
      const todayStr = getTodayDateString(now);

      const isDateExpired = Boolean(token?.session_date && token.session_date !== todayStr);
      const isTimeExpired = Boolean(token?.expires_at && now.getTime() >= new Date(token.expires_at).getTime());

      if (isDateExpired || isTimeExpired) {
        token.isExpired = true;
      }

      return token;
    },
    async session({ session, token }) {
      if (!token || token.isExpired) {
        return null;
      }

      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.nicename = token.nicename;
        session.user.role = token.role;
        session.user.permissions = token.permissions;
        session.user.institute_id = token.institute_id;
        session.user.login_time = token.login_time;
        session.user.logout_time = token.logout_time;
        session.user.last_login_time = token.last_login_time;
        session.user.session_date = token.session_date;
        session.user.expires_at = token.expires_at;
        session.user.accessToken = token.accessToken;
      }
      return session;
    },
  },

  pages: {
    signIn: '/edu-login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours (with client midnight check)
  },
  secret: NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
