'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import MockTestSeriesForm from '@/components/admin/MockTestSeriesForm';
import { BACKEND_URL } from '@/utils/api';

const API_BASE = BACKEND_URL;

export default function EditMockTestSeriesPage() {
  const params = useParams();
  const id = params?.id;
  const [seriesData, setSeriesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchSeries = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/apis/v1/mock-test-series/${id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setSeriesData(data.data);
        } else {
          setError(data.message || 'Mock test series not found');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load mock test series');
      } finally {
        setLoading(false);
      }
    };
    fetchSeries();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <Loader2 size={24} className="animate-spin text-[#2271b1] mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading series details...</p>
      </div>
    );
  }

  if (error || !seriesData) {
    return (
      <div className="py-24 text-center bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
        <p className="text-sm font-bold text-rose-600">{error || 'Series not found'}</p>
        <a
          href="/edu-admin/mock-tests"
          className="inline-block px-4 py-2 bg-[#2271b1] text-white text-xs font-semibold rounded-xl"
        >
          Back to Mock Tests
        </a>
      </div>
    );
  }

  return <MockTestSeriesForm initialData={seriesData} isEdit={true} />;
}
