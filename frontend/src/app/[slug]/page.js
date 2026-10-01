import { notFound } from 'next/navigation';
import SingleArticlePage from '@/components/SingleArticlePage';
import { fetchPageData, generatePageMetadata, generateJsonLd } from '@/utils/seo';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await fetchPageData(slug, 'auto');
  if (!result) {
    return {
      title: 'Page Not Found | Education Masters',
      description: 'The requested page was not found.',
    };
  }
  return generatePageMetadata({
    result,
    slug,
    canonicalPath: `/${slug}`,
    fallbackTitle: slug.replace(/-/g, ' '),
    fallbackType: 'article'
  });
}

export default async function Page({ params }) {
  const { slug } = await params;
  const result = await fetchPageData(slug, 'auto');

  if (!result) {
    notFound();
  }

  const jsonLd = generateJsonLd({ result, slug, canonicalPath: `/${slug}` });

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
