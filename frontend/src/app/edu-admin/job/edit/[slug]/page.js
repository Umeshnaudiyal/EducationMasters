'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import JobEditorForm from '@/components/admin/JobEditorForm';

export default function EditJobPage() {
  const params = useParams();
  const slug = params?.slug;

  return <JobEditorForm slugOrId={slug} isEdit={true} />;
}
