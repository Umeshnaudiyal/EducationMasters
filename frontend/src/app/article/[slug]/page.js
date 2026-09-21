import { redirect } from 'next/navigation';

export default async function SingleArticleRedirect({ params }) {
  const { slug } = await params;
  redirect(`/${slug}`);
}
