'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import InstituteForm from '@/components/admin/InstituteForm';
import AdminLoader from '@/components/admin/AdminLoader';
import { AlertCircle, RefreshCw, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export default function EditInstitutePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;

  const [institute, setInstitute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInstitute = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BACKEND_URL}/apis/v1/institutes/${slug}`);
      if (!res.ok) {
        throw new Error(res.status === 404 ? 'Institute not found' : `HTTP error ${res.status}`);
      }
      const data = await res.json();

      if (data.success && data.data) {
        setInstitute(data.data);
      } else {
        setError(data.message || 'Institute not found');
      }
    } catch (err) {
      console.error('Error fetching institute:', err);
      setError(err.message || 'Failed to load institute details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchInstitute();
  }, [fetchInstitute]);

  if (loading) {
    return (
      <div className="w-full py-16">
        <AdminLoader
          text="Loading Institute Record..."
          subtext="Fetching institute profile, courses, and facilities from database"
          minHeight="min-h-[300px]"
        />
      </div>
    );
  }

  if (error || !institute) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center gap-3 text-slate-700 font-sans">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-1">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-base font-bold text-slate-900">{error || 'Institute Not Found'}</h2>
        <p className="text-xs text-slate-500 max-w-sm text-center">
          The requested institute identifier "{slug}" could not be retrieved from the database.
        </p>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={fetchInstitute}
            className="px-3.5 py-1.5 bg-[#f0f0f1] hover:bg-[#dcdcde] text-slate-800 rounded text-xs font-semibold border border-slate-300 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={12} />
            <span>Try Again</span>
          </button>
          <Link
            href="/edu-admin/institutes"
            className="px-4 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <ChevronLeft size={13} />
            <span>Back to Institutes</span>
          </Link>
        </div>
      </div>
    );
  }

  return <InstituteForm initialData={institute} isEdit={true} />;
}
