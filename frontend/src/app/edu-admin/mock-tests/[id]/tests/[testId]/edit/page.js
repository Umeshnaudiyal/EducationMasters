'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import MockTestEditor from '@/components/admin/MockTestEditor';
import { BACKEND_URL } from '@/utils/api';

const API_BASE = BACKEND_URL;

export default function EditMockTestPage() {
  const params = useParams();
  const seriesId = params?.id;
  const testId = params?.testId;

  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!testId) return;
    const fetchTest = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/apis/v1/mock-tests/${testId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setTestData(data.data);
        } else {
          setError(data.message || 'Test not found');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load mock test data');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [testId]);

  if (loading) {
    return (
      <div className="py-24 text-center bg-white rounded-2xl border border-slate-200">
        <Loader2 size={24} className="animate-spin text-[#2271b1] mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading test details & questions...</p>
      </div>
    );
  }

  if (error || !testData) {
    return (
      <div className="py-24 text-center bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
        <p className="text-sm font-bold text-rose-600">{error || 'Test not found'}</p>
        <a
          href={`/edu-admin/mock-tests/${seriesId}/tests`}
          className="inline-block px-4 py-2 bg-[#2271b1] text-white text-xs font-semibold rounded-xl"
        >
          Back to Tests List
        </a>
      </div>
    );
  }

  return <MockTestEditor seriesId={seriesId} initialTest={testData} isEdit={true} />;
}
