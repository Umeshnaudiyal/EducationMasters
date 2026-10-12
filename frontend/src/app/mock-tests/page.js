import React from 'react';
import MockTestsClient from './MockTestsClient';
import { BACKEND_URL } from '@/utils/api';

export const metadata = {
  title: 'Online Mock Tests & Test Series 2026 | Education Masters',
  description:
    'Practice online mock tests for SSC CGL, CHSL, GD, Banking, Railway RRB NTPC, Teaching CTET, UPSC Civil Services, and State Exams based on latest patterns.',
};

async function getMockSeriesData() {
  try {
    const res = await fetch(`${BACKEND_URL}/apis/v1/mock-test-series?status=published&limit=50`, {
      cache: 'no-store',
    });
    const data = await res.json();
    return data.success ? data.data || [] : [];
  } catch (err) {
    console.error('Error fetching mock series on SSR:', err);
    return [];
  }
}

const mockTestsCollectionSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  'name': 'Online Mock Tests & Test Series 2026 | Education Masters',
  'description':
    'Practice online mock tests for SSC CGL, CHSL, GD, Banking, Railway RRB NTPC, Teaching CTET, UPSC Civil Services, and State Exams based on latest patterns.',
  'url': 'https://educationmasters.in/mock-tests',
  'breadcrumb': {
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://educationmasters.in'
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Mock Tests',
        'item': 'https://educationmasters.in/mock-tests'
      }
    ]
  }
};

export default async function MockTestsPublicPage() {
  const seriesList = await getMockSeriesData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mockTestsCollectionSchema) }}
      />
      <MockTestsClient initialSeries={seriesList} />
    </>
  );
}

