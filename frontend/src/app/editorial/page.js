import React from 'react';
import EditorialPolicyPage from '@/components/EditorialPolicyPage';

export const metadata = {
  title: 'Editorial Policy — Standards, Integrity & Fact-Checking | Education Masters',
  description:
    'Read the official Editorial Policy of EducationMasters.in (Last Updated: 15th Oct. 2025). Learn about our editorial mission, content sources, fact-checking process, editorial independence, and corrections policy.',
  keywords:
    'Education Masters editorial policy, journalistic standards, fact-checking policy, editorial independence, corrections policy, education news verification, Vikash Sharma',
  alternates: {
    canonical: 'https://educationmasters.in/editorial-policy/',
  },
  openGraph: {
    title: 'Editorial Policy — EducationMasters.in',
    description:
      'Our editorial mission, content verification sources, independent journalism guidelines, and corrections policy for EducationMasters.in.',
    url: 'https://educationmasters.in/editorial-policy/',
    siteName: 'Education Masters',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Editorial Policy — EducationMasters.in',
    description:
      'Official Editorial Policy, fact-checking standards, and journalistic guidelines for EducationMasters.in.',
  },
};

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Editorial Policy — EducationMasters.in',
    description:
      'Official Editorial Policy, fact-checking standards, and journalistic guidelines of EducationMasters.in.',
    url: 'https://educationmasters.in/editorial-policy/',
    dateModified: '2025-10-15',
    publisher: {
      '@type': 'Organization',
      name: 'Education Masters',
      url: 'https://educationmasters.in',
      logo: 'https://educationmasters.in/logo.webp',
    },
    author: {
      '@type': 'Person',
      name: 'Vikash Sharma',
      jobTitle: 'Editorial Head',
      email: 'editor@educationmasters.in',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EditorialPolicyPage />
    </>
  );
}
