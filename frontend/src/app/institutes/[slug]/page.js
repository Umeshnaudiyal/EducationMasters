import { redirect } from 'next/navigation';

export default async function RedirectToInstitute({ params }) {
  const { slug } = await params;
  redirect(`/institute/${slug}`);
}
