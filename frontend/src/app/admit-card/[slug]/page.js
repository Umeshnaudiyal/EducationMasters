import { notFound } from 'next/navigation';
import SingleArticlePage from '@/components/SingleArticlePage';
import { fetchPageData, generatePageMetadata, generateJsonLd } from '@/utils/seo';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await fetchPageData(slug, 'admit-card');
  if (!result) {
    return {
      title: 'Page Not Found | Education Masters',
      description: 'The requested admit card was not found.',
    };
  }
  return generatePageMetadata({
    result,
    slug,
    canonicalPath: `/admit-card/${slug}`,
    fallbackTitle: slug.replace(/-/g, ' '),
    fallbackType: 'admit-card'
  });
}

export default async function SingleAdmitCardPage({ params }) {
  const { slug } = await params;
  const result = await fetchPageData(slug, 'admit-card');

  if (!result) {
    notFound();
  }

  const jsonLd = generateJsonLd({ result, slug, canonicalPath: `/admit-card/${slug}` });

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
