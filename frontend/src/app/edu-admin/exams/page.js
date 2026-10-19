'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import TaxonomyManager from '@/components/admin/TaxonomyManager';

export default function ExamsAdminPage() {
  return (
    <TaxonomyManager
      title="Exams"
      singularTitle="Exam"
      apiEndpoint="/apis/v1/exams"
      hasTopBottomDescription={true}
      hasBannerAndEmblem={true}
      columns={[
        {
          header: 'Banner / Emblem',
          render: (item) => (
            <div className="flex items-center gap-2">
              {item.banner_image ? (
                <img
                  src={item.banner_image}
                  alt="Banner"
                  className="w-12 h-6 object-cover rounded border border-slate-200"
                />
              ) : null}
              {item.emblem ? (
                <img
                  src={item.emblem}
                  alt="Emblem"
                  className="w-6 h-6 object-contain rounded-full border border-slate-200"
                />
              ) : (
                <span className="text-slate-400 text-xs">—</span>
              )}
            </div>
          ),
        },
        {
          header: 'Sub-Series / Tests',
          render: (item) => (
            <div className="space-y-0.5 text-xs">
              <span className="font-semibold text-slate-800">
                {item.total_series || (item.child_series ? item.child_series.length : 0)} Series
              </span>
              <p className="text-[11px] text-slate-500">
                {item.total_tests || 0} Tests ({item.free_tests_count || 0} Free)
              </p>
            </div>
          ),
        },
        {
          header: 'Attempts Taken',
          render: (item) => (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-xs font-bold">
              ⚡ {item.total_attempts || item.total_users || 0}
            </span>
          ),
        },
        {
          header: 'Live View',
          render: (item) => (
            <Link
              href={`/mock-tests/${item.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-[#2271b1] hover:underline font-semibold"
            >
              <span>View Directory</span>
              <ExternalLink size={12} />
            </Link>
          ),
        },
      ]}
    />
  );
}
