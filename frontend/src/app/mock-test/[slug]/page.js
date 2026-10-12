import React from 'react';
import { notFound } from 'next/navigation';
import SingleSeriesClient from './SingleSeriesClient';
import { BACKEND_URL } from '@/utils/api';

async function getSeriesData(slug) {
  try {
    const res = await fetch(`${BACKEND_URL}/apis/v1/mock-test-series/${slug}`, {
      cache: 'no-store',
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
    const res = await fetch(`${BACKEND_URL}/apis/v1/mock-test-series?status=published&limit=20`, {
      cache: 'no-store',
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

  const seriesSchema = [
    {
      '@context': 'https://schema.org',
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
        },
        {
          '@type': 'ListItem',
          'position': 3,
          'name': series.title,
          'item': `https://educationmasters.in/mock-test/${resolvedParams.slug}`
        }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Course',
      'name': series.title,
      'description': series.description || `${series.title} online mock test series with sectional and full-length practice tests.`,
      'provider': {
        '@type': 'Organization',
        'name': 'Education Masters',
        'sameAs': 'https://educationmasters.in'
      },
      'isAccessibleForFree': !series.pricing?.is_paid,
      'offers': {
        '@type': 'Offer',
        'price': series.pricing?.sale_price || series.pricing?.base_price || 0,
        'priceCurrency': 'INR',
        'availability': 'https://schema.org/InStock'
      }
    }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seriesSchema) }}
      />
      <SingleSeriesClient series={series} allSeries={allSeries} />
    </>
  );
}

