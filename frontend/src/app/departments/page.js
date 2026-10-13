import { Suspense } from 'react';
import DepartmentsPage from '@/components/DepartmentsPage';

export const metadata = {
  title: 'All Government Departments - Latest Vacancies, Recruitment & Exam Notifications | Education Masters',
  description: 'Explore all central and state government departments, public service commissions, defence wings, and banking recruitment boards across India on Education Masters.',
  keywords: 'government departments, ssc, upsc, railway recruitment, defence jobs, bank vacancies, state psc, govt vacancies 2026',
  openGraph: {
    title: 'All Government Departments - Latest Vacancies, Recruitment & Exam Notifications | Education Masters',
    description: 'Explore all central and state government departments, public service commissions, defence wings, and banking recruitment boards across India.',
    url: 'https://educationmasters.in/departments/',
    siteName: 'Education Masters',
    type: 'website',
  },
  alternates: {
    canonical: 'https://educationmasters.in/departments/',
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
      <DepartmentsPage />
    </Suspense>
  );
}
