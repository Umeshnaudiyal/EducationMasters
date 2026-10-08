import React from 'react';
import { notFound } from 'next/navigation';
import SingleSeriesClient from './SingleSeriesClient';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

async function getSeriesData(slug) {
  try {
    const res = await fetch(`${API_BASE}/apis/v1/mock-test-series/${slug}`, {
      next: { revalidate: 30 },
    });
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (err) {
    console.error('Error fetching series details:', err);
    return null;
  }
}

async function getAllPublishedSeries() {
  try {
    const res = await fetch(`${API_BASE}/apis/v1/mock-test-series?status=published&limit=20`, {
      next: { revalidate: 30 },
    });
    const data = await res.json();
    return data.success ? data.data || [] : [];
  } catch (err) {
    console.error('Error fetching all series:', err);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const series = await getSeriesData(resolvedParams.slug);

  if (!series) {
    return { title: 'Mock Test Series | Education Masters' };
  }

  const metaTitle = series.seo?.meta_title || `${series.title} - Online Mock Tests & Free Practice Papers`;
  const metaDesc =
    series.seo?.meta_description ||
    `Practice ${series.title} online with full length mock tests, sectional papers, detailed solutions, and All India Rank on Education Masters.`;

  return {
    title: metaTitle,
    description: metaDesc,
    keywords: series.seo?.meta_keywords || `${series.title}, mock test, free test, practice paper`,
    robots: series.seo?.allow_indexing ? 'index, follow' : 'noindex, nofollow',
  };
}

export default async function MockTestSeriesDetailPage({ params }) {
  const resolvedParams = await params;
  const [series, allSeries] = await Promise.all([
    getSeriesData(resolvedParams.slug),
    getAllPublishedSeries(),
  ]);

  if (!series) {
    notFound();
  }

  return <SingleSeriesClient series={series} allSeries={allSeries} />;
}
