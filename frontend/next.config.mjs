/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'educationmasters.in',
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
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:5001';
    return [
      {
        source: '/apis/:path*',
        destination: `${backendUrl}/apis/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
