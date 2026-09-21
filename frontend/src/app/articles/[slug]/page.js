import { redirect } from 'next/navigation';

export default async function ArticlesSlugRedirect({ params }) {
  const { slug } = await params;
  redirect(`/${slug}`);
}
