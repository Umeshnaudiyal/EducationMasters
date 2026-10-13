import { Suspense } from 'react';
import DepartmentJobsPage from '@/components/DepartmentJobsPage';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const rawSlug = decodeURIComponent(slug || 'army');
  const deptName = rawSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const title = `${deptName} Jobs 2026 - Latest Recruitment Notifications, Eligibility & Apply Online | Education Masters`;
  const description = `Explore latest ${deptName} jobs, recruitment notifications, application deadlines, eligibility criteria, and pay scale updates. Apply online for active vacancies under ${deptName}.`;
  const canonical = `https://educationmasters.in/department/${rawSlug}/jobs/`;

  return {
    title,
    description,
    keywords: `${deptName} jobs, ${deptName} recruitment 2026, ${deptName} notification, apply online ${deptName}, sarkari naukri`,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Education Masters',
      type: 'website',
    },
    alternates: {
      canonical,
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const rawSlug = decodeURIComponent(slug || 'army');

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DepartmentJobsPage deptSlug={rawSlug} />
    </Suspense>
  );
}
