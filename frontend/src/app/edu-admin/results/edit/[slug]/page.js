import React from 'react';
import ResultEditorForm from '@/components/admin/ResultEditorForm';

export const metadata = {
  title: 'Edit Job Result | Education Masters Admin',
};

export default async function EditResultsPage({ params }) {
  const { slug } = await params;
  return <ResultEditorForm slugOrId={slug} isEdit={true} />;
}
