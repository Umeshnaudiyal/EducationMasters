import { notFound } from 'next/navigation';
import SingleArticlePage from '@/components/SingleArticlePage';
import { fetchPageData, generatePageMetadata, generateJsonLd } from '@/utils/seo';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await fetchPageData(slug, 'job');
  if (!result) {
    return {
      title: 'Page Not Found | Education Masters',
      description: 'The requested job notification was not found.',
    };
  }
  return generatePageMetadata({
    result,
    slug,
    canonicalPath: `/job/${slug}`,
    fallbackTitle: slug.replace(/-/g, ' '),
    fallbackType: 'job'
  });
}

export default async function SingleJobPage({ params }) {
  const { slug } = await params;
  const result = await fetchPageData(slug, 'job');

  if (!result) {
    notFound();
  }

  const jsonLd = generateJsonLd({ result, slug, canonicalPath: `/job/${slug}` });

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <SingleArticlePage initialData={result} />
    </>
  );
}
