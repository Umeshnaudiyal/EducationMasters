/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'educationmasters.in',
      },
      {
        protocol: 'https',
        hostname: 'education-masters-cv8z.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/jobs/:slug',
        destination: '/job/:slug',
        permanent: true,
      },
      {
        source: '/admit-card',
        destination: '/admit-cards',
        permanent: true,
      },
      {
        source: '/admit-cards/:slug',
        destination: '/admit-card/:slug',
        permanent: true,
      },
      {
        source: '/result',
        destination: '/results',
        permanent: true,
      },
      {
        source: '/results/:slug',
        destination: '/result/:slug',
        permanent: true,
      },
      {
        source: '/articles',
        destination: '/category/articles',
        permanent: true,
      },
      {
        source: '/syllabus',
        destination: '/category/syllabus',
        permanent: true,
      },
      {
        source: '/articles/:slug',
        destination: '/:slug',
        permanent: true,
      },
      {
        source: '/article/:slug',
        destination: '/:slug',
        permanent: true,
      },
      {
        source: '/mock-test',
        destination: '/mock-tests',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const rawBackend =
      process.env.INTERNAL_BACKEND_URL ||
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      (process.env.NODE_ENV === 'production'
        ? "https://education-masters-cv8z.vercel.app"
        : "http://localhost:5001");
    const backendUrl = rawBackend.replace(/\/apis?\/?$/, ''); // strips trailing /api or /apis if present

    return [
      {
        source: '/apis/:path*',
        destination: `${backendUrl}/apis/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
