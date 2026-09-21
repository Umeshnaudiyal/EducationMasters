import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.nicename = user.nicename;
        token.role = user.role;
        token.permissions = user.permissions;
        token.institute_id = user.institute_id;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.nicename = token.nicename;
        session.user.role = token.role;
        session.user.permissions = token.permissions;
        session.user.institute_id = token.institute_id;
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
  },
  secret: process.env.NEXTAUTH_SECRET || 'educationmasters_nextauth_secret_2026',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
