import { redirect } from 'next/navigation';

export default async function AdmitCardsSlugRedirect({ params }) {
  const { slug } = await params;
  redirect(`/admit-card/${slug}`);
}
