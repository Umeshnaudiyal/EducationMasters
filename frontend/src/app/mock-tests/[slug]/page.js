import React from 'react';
import { notFound } from 'next/navigation';
import ExamSubDirectoryClient from './ExamSubDirectoryClient';
import { BACKEND_URL } from '@/utils/api';

export async function generateMetadata({ params }) {
  const { slug } = await params;

  try {
    const res = await fetch(`${BACKEND_URL}/apis/v1/exams/${slug}`, {
      cache: 'no-store',
    });
    const data = await res.json();

    if (!data.success || !data.data) {
      return {
        title: 'Mock Test Series | Education Masters',
        description: 'Practice online mock tests based on latest patterns.',
      };
    }

    const exam = data.data;
    const metaTitle =
      exam.seo?.meta_title ||
      `${exam.name} Mock Test Series 2026 - Online Practice Papers & Tests | Education Masters`;
    const metaDescription =
      exam.seo?.meta_description ||
      `Practice ${exam.name} online mock tests based on the latest 2026 syllabus & pattern. Attempt free full-length tests, sectional quizzes, and get instant All India Rank.`;

    return {
      title: metaTitle,
      description: metaDescription,
      keywords: exam.seo?.meta_keywords || `${exam.name}, ${exam.name} mock test, test series, online test, 2026 pattern`,
      alternates: {
        canonical: `https://educationmasters.in/mock-tests/${slug}`,
      },
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        url: `https://educationmasters.in/mock-tests/${slug}`,
        siteName: 'Education Masters',
        type: 'website',
        ...(exam.banner_image || exam.image
          ? {
              images: [
                {
                  url: exam.banner_image || exam.image,
                  width: 1200,
                  height: 630,
                  alt: exam.name,
                },
              ],
            }
          : {}),
      },
    };
  } catch (err) {
    console.error('Error generating metadata for exam sub-directory:', err);
    return {
      title: 'Mock Test Series | Education Masters',
      description: 'Practice online mock tests based on latest patterns.',
    };
  }
}

async function getExamDirectoryData(slug) {
  try {
    const [examRes, subjectsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/apis/v1/exams/${slug}`, { cache: 'no-store' }),
      fetch(`${BACKEND_URL}/apis/v1/subjects?limit=100`, { cache: 'no-store' }),
    ]);

    const [examData, subjectsData] = await Promise.all([
      examRes.json(),
      subjectsRes.json(),
    ]);

    if (!examData.success || !examData.data) {
      return null;
    }

    return {
      exam: examData.data,
      subjects: subjectsData.success ? subjectsData.data || [] : [],
    };
  } catch (err) {
    console.error('Error fetching exam directory data:', err);
    return null;
  }
}

export default async function ExamSubDirectoryPage({ params }) {
  const { slug } = await params;
  const data = await getExamDirectoryData(slug);

  if (!data || !data.exam) {
    notFound();
  }

  const { exam, subjects } = data;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://educationmasters.in',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Mock Tests',
        item: 'https://educationmasters.in/mock-tests',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: exam.name,
        item: `https://educationmasters.in/mock-tests/${slug}`,
      },
    ],
  };

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${exam.name} Mock Test Series 2026`,
    description: `Online mock test series directory for ${exam.name} exams with full-length papers and solutions.`,
    url: `https://educationmasters.in/mock-tests/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <ExamSubDirectoryClient
        exam={exam}
        initialSeries={exam.series || []}
        subjects={subjects}
      />
    </>
  );
}
