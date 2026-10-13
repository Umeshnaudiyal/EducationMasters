import { redirect } from 'next/navigation';

export default async function Page({ params }) {
  const { slug } = await params;
  const rawSlug = decodeURIComponent(slug || 'army');
  redirect(`/department/${rawSlug}/jobs`);
}
