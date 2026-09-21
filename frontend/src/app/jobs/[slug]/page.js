import { redirect } from 'next/navigation';

export default async function JobsSlugRedirect({ params }) {
  const { slug } = await params;
  redirect(`/job/${slug}`);
}
