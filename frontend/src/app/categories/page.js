import { Suspense } from 'react';
import CategoriesPage from '@/components/CategoriesPage';

export const metadata = {
  title: 'All Categories - Educational Articles, Syllabus, GK & Study Resources | Education Masters',
  description: 'Explore all categories on Education Masters. Discover latest government exam syllabus, daily current affairs, GK notes, educational articles, and career guides.',
  keywords: 'categories, exam syllabus, educational articles, current affairs, gk notes, ssc categories, upsc syllabus, competitive exam preparation',
  openGraph: {
    title: 'All Categories - Educational Articles, Syllabus, GK & Study Resources | Education Masters',
    description: 'Explore all categories on Education Masters. Discover latest government exam syllabus, daily current affairs, GK notes, and career guides.',
    url: 'https://educationmasters.in/categories/',
    siteName: 'Education Masters',
    type: 'website',
  },
  alternates: {
    canonical: 'https://educationmasters.in/categories/',
  },
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CategoriesPage />
    </Suspense>
  );
}
