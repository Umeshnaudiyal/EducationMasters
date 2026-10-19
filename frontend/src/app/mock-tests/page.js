import React from 'react';
import MockTestsClient from './MockTestsClient';
import { BACKEND_URL } from '@/utils/api';

export const metadata = {
  title: 'Online Mock Tests & Test Series 2026 | Education Masters',
  description:
    'Practice online mock tests for Banking (SBI, IBPS, RBI), SSC CGL, CHSL, Railways RRB NTPC, Teaching CTET, UPSC Civil Services, and State Exams based on the latest 2026 pattern.',
  alternates: {
    canonical: 'https://educationmasters.in/mock-tests',
  },
};

async function getInitialDirectoriesData() {
  try {
    const [examsRes, seriesRes, subjectsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/apis/v1/exams?all=true&status=published`, { cache: 'no-store' }),
      fetch(`${BACKEND_URL}/apis/v1/mock-test-series?status=published&limit=100`, { cache: 'no-store' }),
      fetch(`${BACKEND_URL}/apis/v1/subjects?limit=100`, { cache: 'no-store' }),
    ]);

    const [examsData, seriesData, subjectsData] = await Promise.all([
      examsRes.json(),
      seriesRes.json(),
      subjectsRes.json(),
    ]);

    return {
      exams: examsData.success ? examsData.data || [] : [],
      series: seriesData.success ? seriesData.data || [] : [],
      subjects: subjectsData.success ? subjectsData.data || [] : [],
    };
  } catch (err) {
    console.error('Error fetching mock directories on SSR:', err);
    return { exams: [], series: [], subjects: [] };
  }
}

const mockTestsCollectionSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  'name': 'Online Mock Tests & Test Series 2026 | Education Masters',
  'description':
    'Practice online mock tests for SSC, Banking, Railways, Teaching, and State Exams based on latest patterns.',
  'url': 'https://educationmasters.in/mock-tests',
  'breadcrumb': {
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://educationmasters.in',
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Mock Tests',
        'item': 'https://educationmasters.in/mock-tests',
      },
    ],
  },
};

export default async function MockTestsPublicPage() {
  const initialData = await getInitialDirectoriesData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mockTestsCollectionSchema) }}
      />
      <MockTestsClient
        initialExams={initialData.exams}
        initialSeries={initialData.series}
        initialSubjects={initialData.subjects}
      />
    </>
  );
}
