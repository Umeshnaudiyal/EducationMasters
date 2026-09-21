import SingleArticlePage from '@/components/SingleArticlePage';
import { fetchPageData, generatePageMetadata, generateJsonLd } from '@/utils/seo';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await fetchPageData(slug, 'auto');
  return generatePageMetadata({
    result,
    slug,
    canonicalPath: `/result/${slug}`,
    fallbackTitle: slug.replace(/-/g, ' '),
    fallbackType: 'result'
  });
}

export default async function SingleResultPage({ params }) {
  const { slug } = await params;
  const result = await fetchPageData(slug, 'auto');
  const jsonLd = generateJsonLd({ result, slug, canonicalPath: `/result/${slug}` });

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <SingleArticlePage />
    </>
  );
}
