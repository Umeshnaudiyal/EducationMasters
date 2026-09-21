'use client';

import React, { useState, useEffect } from 'react';
import TaxonomyManager from '@/components/admin/TaxonomyManager';

export default function TopicsAdminPage() {
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/subjects?limit=100`);
        const data = await res.json();
        if (data.success) {
          setSubjects(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load subjects for topics:', err);
      }
    };
    fetchSubjects();
  }, []);

  return (
    <TaxonomyManager
      title="Topics"
      singularTitle="Topic"
      apiEndpoint="/api/v1/topics"
      initialFormData={{
        subject: '',
      }}
      columns={[
        {
          header: 'Subject',
          render: (item) => (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-[#2271b1] border border-blue-200">
              {item.subject?.name || item.subject_name || '—'}
            </span>
          ),
        },
      ]}
      customFields={({ formData, handleChange }) => (
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Subject
          </label>
          <select
            value={formData.subject || ''}
            onChange={(e) => handleChange('subject', e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-hidden text-slate-800"
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            Assign this topic under an existing parent subject.
          </p>
        </div>
      )}
    />
  );
}
