'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import StateEditorForm from '@/components/admin/StateEditorForm';

export default function EditStateSingularPage() {
  const params = useParams();
  const stateId = params?.id;

  return <StateEditorForm isEdit={true} stateId={stateId} />;
}
