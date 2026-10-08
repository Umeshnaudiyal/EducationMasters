'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import MockTestEditor from '@/components/admin/MockTestEditor';

export default function CreateMockTestPage() {
  const params = useParams();
  const seriesId = params?.id;

  return <MockTestEditor seriesId={seriesId} isEdit={false} />;
}
