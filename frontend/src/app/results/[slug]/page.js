import { redirect } from 'next/navigation';

export default async function ResultsSlugRedirect({ params }) {
  const { slug } = await params;
  redirect(`/result/${slug}`);
}
