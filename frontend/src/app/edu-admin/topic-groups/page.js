'use client';

import React from 'react';
import TaxonomyManager from '@/components/admin/TaxonomyManager';

export default function TopicGroupsAdminPage() {
  return (
    <TaxonomyManager
      title="Topic Groups"
      singularTitle="Topic Group"
      apiEndpoint="/api/v1/topic-groups"
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
