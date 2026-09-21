import React from 'react';
import ResultEditorForm from '@/components/admin/ResultEditorForm';

export const metadata = {
  title: 'Add New Job Result | Education Masters Admin',
};

export default function CreateResultsPage() {
  return <ResultEditorForm isEdit={false} />;
}
