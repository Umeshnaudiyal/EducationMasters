'use client';

import React, { useState, useEffect, use } from 'react';
import QuestionEditorForm from '@/components/admin/QuestionEditorForm';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function EditQuestionPage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/questions/${id}`
        );
        const data = await res.json();
        if (data.success) {
          setQuestion(data.data);
        } else {
          setError(data.message || 'Question not found');
        }
      } catch (err) {
        console.error('Error fetching question:', err);
        setError('Failed to load question details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuestion();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 size={28} className="animate-spin text-[#2271b1]" />
        <p className="text-xs font-semibold">Loading question details...</p>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white border border-slate-200 rounded-xl shadow-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-800">Error Loading Question</h2>
          <p className="text-xs text-slate-500">{error || 'Question could not be found.'}</p>
        </div>
        <Link
          href="/edu-admin/questions"
          className="inline-block px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white rounded-lg text-xs font-bold"
        >
          Return to Question Bank
        </Link>
      </div>
    );
  }

  return <QuestionEditorForm initialData={question} isEdit={true} />;
}
