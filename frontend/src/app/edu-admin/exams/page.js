'use client';

import React from 'react';
import TaxonomyManager from '@/components/admin/TaxonomyManager';

export default function ExamsAdminPage() {
  return (
    <TaxonomyManager
      title="Exams"
      singularTitle="Exam"
      apiEndpoint="/api/v1/exams"
      columns={[
        {
          header: 'Description',
          render: (item) => (
            <span className="text-slate-500 line-clamp-1 max-w-xs">
              {item.description || '—'}
            </span>
          ),
        },
      ]}
    />
  );
}
