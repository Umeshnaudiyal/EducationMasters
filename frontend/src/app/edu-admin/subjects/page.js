'use client';

import React from 'react';
import TaxonomyManager from '@/components/admin/TaxonomyManager';
import { stripHtmlToPlainText } from '@/utils/cleanHtml';

export default function SubjectsAdminPage() {
  return (
    <TaxonomyManager
      title="Subjects"
      singularTitle="Subject"
      apiEndpoint="/apis/v1/subjects"
      columns={[
        {
          header: 'Description',
          render: (item) => {
            const plainText = stripHtmlToPlainText(item.description);
            return (
              <span className="text-slate-500 line-clamp-1 max-w-xs" title={plainText || ''}>
                {plainText || '—'}
              </span>
            );
          },
        },
      ]}
    />
  );
}

