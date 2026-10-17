import React, { Suspense } from 'react';
import StateJobsClient from './StateJobsClient';
import { getStateNameBySlug } from '@/utils/indianStatesData';
import { stripHtmlToPlainText } from '@/utils/cleanHtml';
import { getBackendUrl } from '@/utils/api';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const rawSlug = decodeURIComponent(slug || '');

  let state = null;
  try {
    const backendUrl = getBackendUrl();
    const res = await fetch(`${backendUrl}/apis/v1/states/public/${encodeURIComponent(rawSlug)}`, {
      next: { revalidate: 60 },
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      state = data?.data?.state || data?.data || null;
    }
  } catch (err) {
    // Graceful fallback to default Indian states dictionary
  }

  const stateName = state?.name || getStateNameBySlug(rawSlug);

  // Dynamic Title: 1) jobs_seo.meta_title, 2) jobs_title, 3) Fallback
  const title =
    state?.jobs_seo?.meta_title?.trim() ||
    (state?.jobs_title?.trim() ? `${state.jobs_title.trim()} | Education Masters` : null) ||
    `${stateName} Government Jobs 2026 - Latest Recruitment Notifications | Education Masters`;

  // Dynamic Description: 1) jobs_seo.meta_description, 2) stripped job_description, 3) Fallback
  const plainJobDesc = state?.job_description ? stripHtmlToPlainText(state.job_description) : '';
  const description =
    state?.jobs_seo?.meta_description?.trim() ||
    (plainJobDesc ? (plainJobDesc.length > 160 ? `${plainJobDesc.slice(0, 157)}...` : plainJobDesc) : null) ||
    `Explore latest ${stateName} government jobs, recruitment notifications, admit cards, and application forms in 2026. Apply online for ${stateName} PSC, Police, Teaching, and State Department vacancies.`;

  // Dynamic Keywords: 1) jobs_seo.meta_keywords, 2) Fallback
  const keywords =
    state?.jobs_seo?.meta_keywords?.trim() ||
    `${stateName} government jobs, ${stateName} sarkari naukri, ${stateName} recruitment 2026, ${stateName} vacancy, ${stateName} PSC jobs, ${stateName} police bharti`;

  const allowIndexing = state?.jobs_seo?.allow_indexing ?? true;
  const canonical = `https://educationmasters.in/state/${rawSlug}/jobs/`;

  return {
    title,
    description,
    keywords,
    robots: {
      index: allowIndexing,
      follow: allowIndexing,
      googleBot: {
        index: allowIndexing,
        follow: allowIndexing,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Education Masters',
      type: 'website',
      ...(state?.image ? { images: [{ url: state.image, alt: `${stateName} Govt Jobs` }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(state?.image ? { images: [state.image] } : {}),
    },
    alternates: {
      canonical,
    },
  };
}

export default async function StateJobsPage({ params }) {
  const { slug } = await params;
  const rawSlug = decodeURIComponent(slug || '');

  let initialState = null;
  try {
    const backendUrl = getBackendUrl();
    const res = await fetch(`${backendUrl}/apis/v1/states/public/${encodeURIComponent(rawSlug)}`, {
      next: { revalidate: 60 },
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      initialState = data?.data?.state || data?.data || null;
    }
  } catch (err) {
    // Graceful fallback
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <StateJobsClient stateSlug={rawSlug} initialState={initialState} />
    </Suspense>
  );
}
