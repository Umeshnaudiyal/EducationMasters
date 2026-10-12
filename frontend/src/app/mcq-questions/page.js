import { Suspense } from 'react';
import McqQuestionPage from '@/components/McqQuestionPage';
import { generateMcqJsonLd } from '@/utils/seo';

export const metadata = {
  title: 'Subject Wise MCQ Questions with Answers | Practice 15,000+ MCQs - Education Masters',
  description: 'Subject-wise MCQ questions with answers in English and Hindi for competitive exams like SSC, UPSC, State PCS, Railway, Bank, and Teaching exams.',
  alternates: {
    canonical: 'https://educationmasters.in/mcq-questions/',
  },
};

export default function Page() {
  const jsonLd = generateMcqJsonLd({
    slug: 'general-knowledge',
    taxInfo: {
      name: 'General Knowledge',
      title: 'Subject Wise MCQ Questions with Answers | Practice 15,000+ MCQs - Education Masters',
      description: 'Subject-wise MCQ questions with answers in English and Hindi for competitive exams like SSC, UPSC, State PCS, Railway, Bank, and Teaching exams.'
    },
    canonicalUrl: 'https://educationmasters.in/mcq-questions/'
  });

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <McqQuestionPage
          initialSlug="general-knowledge"
          initialSubjectName="General Knowledge"
        />
      </Suspense>
    </>
  );
}

