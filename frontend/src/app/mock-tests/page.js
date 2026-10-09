import React from 'react';
import MockTestsClient from './MockTestsClient';
import { getApiBaseUrl } from '@/utils/api';

const API_BASE = getApiBaseUrl();

export const metadata = {
  title: 'Online Mock Tests & Test Series 2026 | Education Masters',
  description:
    'Practice online mock tests for SSC CGL, CHSL, GD, Banking, Railway RRB NTPC, Teaching CTET, UPSC Civil Services, and State Exams based on latest patterns.',
};

async function getMockSeriesData() {
  try {
    const res = await fetch(`${API_BASE}/apis/v1/mock-test-series?status=published&limit=50`, {
      next: { revalidate: 30 },
    });
    const data = await res.json();
    return data.success ? data.data || [] : [];
  } catch (err) {
    console.error('Error fetching mock series on SSR:', err);
    return [];
  }
}

export default async function MockTestsPublicPage() {
  const seriesList = await getMockSeriesData();

  return <MockTestsClient initialSeries={seriesList} />;
}
