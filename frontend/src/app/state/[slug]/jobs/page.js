import React, { Suspense } from 'react';
import StateJobsClient from './StateJobsClient';
import { getStateNameBySlug } from '@/utils/indianStatesData';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const rawSlug = decodeURIComponent(slug || '');
  const stateName = getStateNameBySlug(rawSlug);

  const title = `${stateName} Government Jobs 2026 - Latest Recruitment Notifications | Education Masters`;
  const description = `Explore latest ${stateName} government jobs, recruitment notifications, admit cards, and application forms in 2026. Apply online for ${stateName} PSC, Police, Teaching, and State Department vacancies.`;
  const canonical = `https://educationmasters.in/state/${rawSlug}/jobs/`;

  return {
    title,
    description,
    keywords: `${stateName} government jobs, ${stateName} sarkari naukri, ${stateName} recruitment 2026, ${stateName} vacancy, ${stateName} PSC jobs, ${stateName} police bharti`,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Education Masters',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical,
    },
  };
}

export default async function StateJobsPage({ params }) {
  const { slug } = await params;
  const rawSlug = decodeURIComponent(slug || '');

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <StateJobsClient stateSlug={rawSlug} />
    </Suspense>
  );
}
