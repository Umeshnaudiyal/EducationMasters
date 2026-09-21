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
    ];
  },
};

export default nextConfig;
