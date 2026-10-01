import JobsExpiringClient from './JobsExpiringClient';

export const metadata = {
  title: 'Jobs Expiring in 30 Days | Apply Before Last Date - Education Masters',
  description: 'Find all government and central recruitment notifications expiring in the next 30 days. Check last dates, eligibility, vacancy details, and apply online before deadlines.',
  alternates: {
    canonical: 'https://educationmasters.in/jobs-expiring-in-30-days',
  },
  openGraph: {
    title: 'Jobs Expiring in 30 Days | Education Masters',
    description: 'Find all government and central recruitment notifications expiring in the next 30 days. Apply before the closing date.',
    url: 'https://educationmasters.in/jobs-expiring-in-30-days',
    siteName: 'Education Masters',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jobs Expiring in 30 Days | Education Masters',
    description: 'Find all government and central recruitment notifications expiring in the next 30 days.',
  },
};

export default function JobsExpiringIn30DaysPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Jobs Expiring in 30 Days',
    description: 'Find all government and central recruitment notifications expiring in the next 30 days.',
    url: 'https://educationmasters.in/jobs-expiring-in-30-days',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://educationmasters.in/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Jobs',
          item: 'https://educationmasters.in/jobs',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Expiring in 30 Days',
          item: 'https://educationmasters.in/jobs-expiring-in-30-days',
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JobsExpiringClient />
    </>
  );
}
