'use client';

import React from 'react';
import TaxonomyManager from '@/components/admin/TaxonomyManager';

export default function SubjectsAdminPage() {
  return (
    <TaxonomyManager
      title="Subjects"
      singularTitle="Subject"
      apiEndpoint="/api/v1/subjects"
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
