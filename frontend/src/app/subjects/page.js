import { Suspense } from 'react';
import SubjectsPage from '@/components/SubjectsPage';

export const metadata = {
  title: 'All Subjects - MCQ Questions, Study Material & Mock Tests | Education Masters',
  description: 'Explore all subjects for competitive exam preparation. Practice chapter-wise and topic-wise MCQ questions for History, Geography, Polity, Science, Computer, Economics, English, and more.',
  keywords: 'subjects, competitive exam subjects, gk subjects mcq, online study subjects, ssc subjects, upsc subjects, ctet subjects',
  openGraph: {
    title: 'All Subjects - MCQ Questions, Study Material & Mock Tests | Education Masters',
    description: 'Explore all subjects for competitive exam preparation. Practice chapter-wise and topic-wise MCQ questions.',
    url: 'https://educationmasters.in/subjects/',
    siteName: 'Education Masters',
    type: 'website',
  },
  alternates: {
    canonical: 'https://educationmasters.in/subjects/',
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
      <SubjectsPage />
    </Suspense>
  );
}
