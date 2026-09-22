import { Suspense } from 'react';
import McqQuestionPage from '@/components/McqQuestionPage';
import { getTaxonomyInfo } from '@/utils/mcqTaxonomies';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const taxInfo = getTaxonomyInfo(slug);

  return {
    title: taxInfo.title,
    description: taxInfo.description,
    keywords: `${taxInfo.name} MCQ questions, ${taxInfo.name} objective questions, ${taxInfo.name} previous year questions, competitive exam MCQ test`,
    openGraph: {
      title: taxInfo.title,
      description: taxInfo.description,
      url: `https://educationmasters.in/mcq-questions/${slug}/`,
      siteName: 'Education Masters',
      type: 'website',
    },
    alternates: {
      canonical: `https://educationmasters.in/mcq-questions/${slug}/`,
    },
  };
}

export default async function Page({ params }) {
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
