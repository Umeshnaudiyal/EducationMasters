import { Suspense } from 'react';
import McqQuestionPage from '@/components/McqQuestionPage';
import { getTaxonomyInfo } from '@/utils/mcqTaxonomies';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const taxInfo = getTaxonomyInfo(slug);

  return {
    title: taxInfo.title,
    description: taxInfo.description,
    keywords: `${taxInfo.name} MCQ questions, ${taxInfo.name} objective questions, ${taxInfo.name} previous year questions, ${taxInfo.name} competitive exam GK test`,
    openGraph: {
      title: taxInfo.title,
      description: taxInfo.description,
      url: `https://educationmasters.in/state/${slug}/mcq-questions/`,
      siteName: 'Education Masters',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: taxInfo.title,
      description: taxInfo.description,
    },
    alternates: {
      canonical: `https://educationmasters.in/state/${slug}/mcq-questions/`,
    },
  };
}

export default async function StateMcqPage({ params }) {
  const { slug } = await params;
  const taxInfo = getTaxonomyInfo(slug);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <McqQuestionPage
        initialSlug={slug}
        initialSubjectName={taxInfo.name}
      />
    </Suspense>
  );
}
