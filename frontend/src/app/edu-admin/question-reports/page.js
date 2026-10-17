'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Flag,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  X,
  Sparkles,
  BookOpen,
  Filter,
  Check,
  Save,
  CheckSquare,
  Layers,
} from 'lucide-react';
import { getAuthToken } from '@/utils/auth';
import { toast } from '@/context/ToastContext';
import { BACKEND_URL } from '@/utils/api';

export default function QuestionReportsAdminPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Data states
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [stats, setStats] = useState({ total: 0, pending: 0, in_review: 0, resolved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeStatus, setActiveStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Review & Direct Edit Modal state
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalTab, setModalTab] = useState('review'); // 'review' | 'edit_question'
  const [adminNotes, setAdminNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Direct Question Edit State
  const [editQuestionContent, setEditQuestionContent] = useState('');
  const [editOptions, setEditOptions] = useState([
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ]);
  const [editAnsInfo, setEditAnsInfo] = useState('');
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken(session);
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (activeStatus !== 'all') {
        queryParams.append('status', activeStatus);
      }
      if (debouncedSearch.trim()) {
        queryParams.append('search', debouncedSearch.trim());
      }

      const res = await fetch(`${BACKEND_URL}/apis/v1/question-reports?${queryParams.toString()}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      const data = await res.json();
      if (data.success) {
        setReports(data.data || []);
        if (data.pagination) setPagination(data.pagination);
        if (data.stats) setStats(data.stats);
      } else {
        toast.error(data.message || 'Failed to load question reports');
      }
    } catch (err) {
      console.error('Error fetching question reports:', err);
      toast.error('Network error loading reports');
    } finally {
      setLoading(false);
    }
  }, [session, pagination.page, pagination.limit, activeStatus, debouncedSearch]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Open review / direct edit modal
  const handleOpenReview = (report, defaultTab = 'review') => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setModalTab(defaultTab);

    // Initial question content
    const populatedQ = report.question_id && typeof report.question_id === 'object' ? report.question_id : null;
    const initialContent = populatedQ?.content || report.question_text || '';
    setEditQuestionContent(initialContent);

    // Initial explanation
    const initialAns = populatedQ?.ans_info || report.ans_info || '';
    setEditAnsInfo(initialAns);

    // Initial options
    let rawOptions = (populatedQ?.options && populatedQ.options.length > 0)
      ? populatedQ.options
      : (Array.isArray(report.options) && report.options.length > 0 ? report.options : []);

    let parsedOptions = [];
    if (rawOptions.length > 0) {
      parsedOptions = rawOptions.slice(0, 4).map((opt) => ({
        text: opt.text || '',
        is_correct: !!opt.is_correct,
      }));
    }
    // Pad to 4 options if less
    while (parsedOptions.length < 4) {
      parsedOptions.push({ text: '', is_correct: false });
    }

    // Ensure at least one option is marked correct (default to Option A if none)
    if (!parsedOptions.some((o) => o.is_correct)) {
      parsedOptions[0].is_correct = true;
    }

    setEditOptions(parsedOptions);
  };

  const handleOptionTextChange = (index, newText) => {
    setEditOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, text: newText } : opt))
    );
  };

  const handleSetCorrectOption = (index) => {
    setEditOptions((prev) =>
      prev.map((opt, i) => ({ ...opt, is_correct: i === index }))
    );
    toast.success(`Option ${String.fromCharCode(65 + index)} marked as the correct answer key!`);
  };

  const applyStudentSuggestionToOption = (targetIndex, text) => {
    setEditOptions((prev) =>
      prev.map((opt, i) =>
        i === targetIndex
          ? { text, is_correct: true }
          : { ...opt, is_correct: false }
      )
    );
    toast.success(`Applied suggestion to Option ${String.fromCharCode(65 + targetIndex)} and marked as correct key!`);
  };

  const handleInsertStudentRemarks = () => {
    if (!selectedReport?.remarks) return;
    setEditAnsInfo((prev) =>
      prev ? `${prev}\n\n[Reference]: ${selectedReport.remarks}` : `[Reference]: ${selectedReport.remarks}`
    );
    toast.success('Inserted student remarks into explanation.');
  };

  // Directly save question in DB & optionally mark report as resolved
  const handleSaveQuestion = async (markResolved = true) => {
    if (!selectedReport) return;
    if (!editQuestionContent.trim()) {
      toast.error('Question content cannot be empty');
      return;
    }

    const filledOptions = editOptions.filter((o) => o.text.trim().length > 0);
    if (filledOptions.length < 2) {
      toast.error('Please enter text for at least 2 options');
      return;
    }

    const correctIdx = editOptions.findIndex((o) => o.is_correct);
    if (correctIdx === -1) {
      toast.error('Please select which option is correct');
      return;
    }

    setIsSavingQuestion(true);
    try {
      const token = getAuthToken(session);
      const payload = {
        content: editQuestionContent.trim(),
        options: editOptions.map((opt, idx) => ({
          text: opt.text.trim(),
          is_correct: opt.is_correct,
          index: idx + 1,
        })),
        correct_answer: `Option ${correctIdx + 1}`,
        ans_info: editAnsInfo.trim(),
        mark_resolved: markResolved,
        admin_notes: adminNotes || (markResolved ? 'Corrected question in database based on student report.' : ''),
        status: markResolved ? 'resolved' : 'in_review',
      };

      const res = await fetch(`${BACKEND_URL}/apis/v1/question-reports/${selectedReport._id}/update-question`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Question updated successfully!');
        setSelectedReport(null);
        fetchReports();
      } else {
        toast.error(data.message || 'Failed to update question');
      }
    } catch (err) {
      console.error('Error saving question from report:', err);
      toast.error('Network error updating question');
    } finally {
      setIsSavingQuestion(false);
    }
  };

  // Update report status
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedReport) return;
    setUpdatingStatus(true);
    try {
      const token = getAuthToken(session);
      const res = await fetch(`${BACKEND_URL}/apis/v1/question-reports/${selectedReport._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          status: newStatus,
          admin_notes: adminNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Report marked as ${newStatus}`);
        setSelectedReport(null);
        fetchReports();
      } else {
        toast.error(data.message || 'Failed to update report status');
      }
    } catch (err) {
      console.error('Error updating report status:', err);
      toast.error('Network error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delete report
  const handleDeleteReport = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const token = getAuthToken(session);
      const res = await fetch(`${BACKEND_URL}/apis/v1/question-reports/${deleteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Question report deleted');
        setDeleteId(null);
        fetchReports();
      } else {
        toast.error(data.message || 'Failed to delete report');
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      toast.error('Network error deleting report');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Resolved
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock size={12} className="text-blue-600" />
            In Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={12} className="text-rose-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle size={12} className="text-amber-600" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white flex items-center justify-center shadow-md">
              <Flag size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Question Reports &amp; Error Flags
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Student error reports, disputed answer keys, and suggested corrections.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/edu-admin/questions"
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <BookOpen size={14} className="text-blue-600" />
            <span>Manage Question Bank</span>
          </Link>

          <button
            type="button"
            onClick={fetchReports}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition cursor-pointer shadow-2xs"
            title="Refresh reports"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => { setActiveStatus('all'); setPagination((p) => ({ ...p, page: 1 })); }}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            activeStatus === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800 shadow-2xs'
          }`}
        >
          <span className={`text-[11px] font-semibold block ${activeStatus === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
            Total Reports
          </span>
          <span className="text-2xl font-black">{stats.total}</span>
        </div>

        <div
          onClick={() => { setActiveStatus('pending'); setPagination((p) => ({ ...p, page: 1 })); }}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            activeStatus === 'pending'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-white hover:bg-amber-50/50 border-slate-200/90 text-slate-800 shadow-2xs'
          }`}
        >
          <span className={`text-[11px] font-semibold block ${activeStatus === 'pending' ? 'text-amber-100' : 'text-amber-600'}`}>
            Pending
          </span>
          <span className="text-2xl font-black text-amber-700">{stats.pending}</span>
        </div>

        <div
          onClick={() => { setActiveStatus('in_review'); setPagination((p) => ({ ...p, page: 1 })); }}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            activeStatus === 'in_review'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-white hover:bg-blue-50/50 border-slate-200/90 text-slate-800 shadow-2xs'
          }`}
        >
          <span className={`text-[11px] font-semibold block ${activeStatus === 'in_review' ? 'text-blue-100' : 'text-blue-600'}`}>
            In Review
          </span>
          <span className="text-2xl font-black text-blue-700">{stats.in_review}</span>
        </div>

        <div
          onClick={() => { setActiveStatus('resolved'); setPagination((p) => ({ ...p, page: 1 })); }}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            activeStatus === 'resolved'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white hover:bg-emerald-50/50 border-slate-200/90 text-slate-800 shadow-2xs'
          }`}
        >
          <span className={`text-[11px] font-semibold block ${activeStatus === 'resolved' ? 'text-emerald-100' : 'text-emerald-600'}`}>
            Resolved
          </span>
          <span className="text-2xl font-black text-emerald-700">{stats.resolved}</span>
        </div>

        <div
          onClick={() => { setActiveStatus('rejected'); setPagination((p) => ({ ...p, page: 1 })); }}
          className={`p-3.5 rounded-2xl border transition cursor-pointer col-span-2 sm:col-span-1 ${
            activeStatus === 'rejected'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md'
              : 'bg-white hover:bg-rose-50/50 border-slate-200/90 text-slate-800 shadow-2xs'
          }`}
        >
          <span className={`text-[11px] font-semibold block ${activeStatus === 'rejected' ? 'text-rose-100' : 'text-rose-600'}`}>
            Rejected
          </span>
          <span className="text-2xl font-black text-rose-700">{stats.rejected}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto text-xs font-bold">
          {['all', 'pending', 'in_review', 'resolved', 'rejected'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => { setActiveStatus(st); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer whitespace-nowrap ${
                activeStatus === st
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search reports or questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
          <Loader2 size={32} className="animate-spin text-blue-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading student reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
          <Flag size={36} className="text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Question Reports Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeStatus !== 'all'
              ? `There are currently no reports marked as '${activeStatus}'.`
              : 'No errors have been flagged by students yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report._id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-sm transition-all duration-200 space-y-3"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(report.status)}

                  <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold">
                    {report.reported_reason}
                  </span>

                  <span className="text-[11px] text-slate-400">
                    {new Date(report.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenReview(report, 'edit_question')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                    title="Directly edit and fix this question in the database"
                  >
                    <Edit2 size={13} />
                    <span>Fix Question</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenReview(report, 'review')}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Flag size={13} />
                    <span>Review &amp; Resolve</span>
                  </button>

                  {report.question_id && (
                    <Link
                      href={`/edu-admin/questions/edit/${report.question_id._id || report.question_id}`}
                      target="_blank"
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      title="Open full Question Bank editor"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeleteId(report._id)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                    title="Delete report"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Reported Question
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                  {report.question_text}
                </p>
              </div>

              {/* Student's Proposed Answer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Student Suggested Answer
                  </span>
                  {report.is_custom_option ? (
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        Custom User Option
                      </span>
                      <p className="font-semibold text-slate-900 pt-0.5">
                        &ldquo;{report.custom_option_text}&rdquo;
                      </p>
                    </div>
                  ) : report.suggested_option_index >= 0 ? (
                    <p className="font-semibold text-emerald-800">
                      Option {String.fromCharCode(65 + report.suggested_option_index)}:{' '}
                      {report.suggested_option_text}
                    </p>
                  ) : (
                    <p className="text-slate-400 italic">No alternative answer selected</p>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Student Remarks &amp; Feedback
                  </span>
                  <p className="text-slate-700 leading-relaxed font-normal">
                    {report.remarks || <span className="text-slate-400 italic">No comments provided</span>}
                  </p>
                </div>
              </div>

              {/* Footer info: user & admin notes */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>
                  Reported by: <strong className="text-slate-700">{report.user_name}</strong>{' '}
                  {report.user_email ? `(${report.user_email})` : ''}
                </span>

                {report.admin_notes && (
                  <span className="text-slate-600 truncate max-w-xs font-medium">
                    Note: {report.admin_notes}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 bg-white p-3 rounded-2xl border border-slate-200/90 text-xs text-slate-600">
              <span>
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} reports)
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 🔍 REVIEW & DIRECT QUESTION RESOLUTION MODAL                    */}
      {/* ============================================================== */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div
            onClick={() => setSelectedReport(null)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 z-10 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center justify-center font-bold">
                  <Flag size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Question Report Resolution
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                      {selectedReport.reported_reason}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Review feedback or directly edit the question in the database.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedReport.question_id && (
                  <Link
                    href={`/edu-admin/questions/edit/${selectedReport.question_id._id || selectedReport.question_id}`}
                    target="_blank"
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 transition"
                  >
                    <ExternalLink size={12} />
                    <span>Full Editor</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Modal Tab Switcher */}
            <div className="flex items-center border-b border-slate-200 bg-slate-100/80 px-4 sm:px-6 pt-2 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setModalTab('review')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 cursor-pointer ${
                  modalTab === 'review'
                    ? 'bg-white text-blue-700 border-t border-x border-slate-200 shadow-2xs -mb-px'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Flag size={13} className={modalTab === 'review' ? 'text-blue-600' : 'text-slate-400'} />
                <span>1. Report &amp; Student Feedback</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('edit_question')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 cursor-pointer ${
                  modalTab === 'edit_question'
                    ? 'bg-white text-emerald-700 border-t border-x border-slate-200 shadow-2xs -mb-px'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Edit2 size={13} className={modalTab === 'edit_question' ? 'text-emerald-600' : 'text-slate-400'} />
                <span>2. Edit Question Directly</span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md">
                  Live DB Fix
                </span>
              </button>
            </div>

            {/* ========================================================== */}
            {/* TAB 1: REPORT REVIEW & STATUS                              */}
            {/* ========================================================== */}
            {modalTab === 'review' && (
              <>
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar">
                  {/* Quick Action Prompt to Edit Directly */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-emerald-600" />
                        Fix this question in the database right now?
                      </span>
                      <p className="text-[11px] text-emerald-800">
                        Edit question text, update options, change the correct answer key, and resolve this report in one click.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalTab('edit_question')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                    >
                      <Edit2 size={13} />
                      <span>Edit Question Directly</span>
                    </button>
                  </div>

                  {/* Question preview */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Question Text
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                      {selectedReport.question_text}
                    </p>
                  </div>

                  {/* Original Question Options */}
                  {Array.isArray(selectedReport.options) && selectedReport.options.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Question Options in Database
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedReport.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                              opt.is_correct
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                : 'bg-white border-slate-200 text-slate-800 font-normal'
                            }`}
                          >
                            <span className="truncate pr-2">
                              <strong className="mr-1">{String.fromCharCode(65 + oIdx)}.</strong>
                              {opt.text}
                            </span>
                            {opt.is_correct && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold shrink-0">
                                Key Answer
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Student's proposal */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                      Student&apos;s Suggested Correction
                    </span>
                    {selectedReport.is_custom_option ? (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
                          Student Custom Option:
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 pl-1 pt-1">
                          &ldquo;{selectedReport.custom_option_text}&rdquo;
                        </p>
                      </div>
                    ) : selectedReport.suggested_option_index >= 0 ? (
                      <p className="text-xs sm:text-sm font-bold text-slate-900">
                        Option {String.fromCharCode(65 + selectedReport.suggested_option_index)}:{' '}
                        {selectedReport.suggested_option_text}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No alternative answer selected</p>
                    )}

                    {selectedReport.remarks && (
                      <div className="pt-2 border-t border-amber-200/70 text-xs text-slate-700">
                        <strong className="text-slate-900">Student Remarks: </strong>
                        {selectedReport.remarks}
                      </div>
                    )}
                  </div>

                  {/* Admin Resolution Notes Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Resolution Notes (Internal / Audit Record)
                    </label>
                    <textarea
                      rows={2}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="e.g. Verified official gazette reference. Updated question in database..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Modal Footer / Actions for Tab 1 */}
                <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400">
                    Current Status: <strong className="capitalize text-slate-700">{selectedReport.status}</strong>
                  </span>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus('rejected')}
                      className="px-3 py-1.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold transition cursor-pointer"
                    >
                      Reject Report
                    </button>

                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus('in_review')}
                      className="px-3 py-1.5 rounded-xl border border-blue-300 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold transition cursor-pointer"
                    >
                      Mark In Review
                    </button>

                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus('resolved')}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                    >
                      {updatingStatus ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      <span>Mark as Resolved</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ========================================================== */}
            {/* TAB 2: DIRECT QUESTION EDITOR                              */}
            {/* ========================================================== */}
            {modalTab === 'edit_question' && (
              <>
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4.5 custom-scrollbar text-xs">
                  {/* Student Suggestion Quick Apply Banner */}
                  {selectedReport.is_custom_option && selectedReport.custom_option_text && (
                    <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-amber-600" />
                          Student Suggested: &ldquo;{selectedReport.custom_option_text}&rdquo;
                        </span>
                        <span className="text-[10px] text-amber-700 font-semibold uppercase">1-Click Apply:</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[0, 1, 2, 3].map((optIdx) => (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => applyStudentSuggestionToOption(optIdx, selectedReport.custom_option_text)}
                            className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                          >
                            <span>Apply to Option {String.fromCharCode(65 + optIdx)} &amp; Make Key</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!selectedReport.is_custom_option && selectedReport.suggested_option_index >= 0 && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-emerald-950">
                        Student suggests Option {String.fromCharCode(65 + selectedReport.suggested_option_index)} is the correct answer
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSetCorrectOption(selectedReport.suggested_option_index)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer active:scale-95 shrink-0"
                      >
                        Set Option {String.fromCharCode(65 + selectedReport.suggested_option_index)} as Key
                      </button>
                    </div>
                  )}

                  {/* Question Statement / Content */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Question Statement (Content) <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-slate-400">Directly updates in Question Bank</span>
                    </label>
                    <textarea
                      rows={3}
                      value={editQuestionContent}
                      onChange={(e) => setEditQuestionContent(e.target.value)}
                      placeholder="Enter question statement..."
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs leading-snug"
                    />
                  </div>

                  {/* Options Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        MCQ Options &amp; Correct Answer Key <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-500">
                        Click &ldquo;Make Key&rdquo; on the right answer
                      </span>
                    </div>

                    <div className="space-y-2">
                      {editOptions.map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                              opt.is_correct
                                ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400/20 shadow-2xs'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSetCorrectOption(idx)}
                              className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 cursor-pointer transition ${
                                opt.is_correct
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                              title={`Set Option ${letter} as Correct`}
                            >
                              {letter}
                            </button>

                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                              placeholder={`Option ${letter} description...`}
                              className="flex-1 px-3 py-1.5 bg-white text-xs font-medium text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />

                            <button
                              type="button"
                              onClick={() => handleSetCorrectOption(idx)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shrink-0 ${
                                opt.is_correct
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              {opt.is_correct ? (
                                <>
                                  <CheckCircle2 size={13} />
                                  <span>Correct Key</span>
                                </>
                              ) : (
                                <span>Make Key</span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation / Ans Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Solution Explanation / Reference (ans_info)
                      </label>
                      {selectedReport.remarks && (
                        <button
                          type="button"
                          onClick={handleInsertStudentRemarks}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles size={11} />
                          <span>+ Insert Student Remarks</span>
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      value={editAnsInfo}
                      onChange={(e) => setEditAnsInfo(e.target.value)}
                      placeholder="Add or update verified concept explanation..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs resize-none"
                    />
                  </div>

                  {/* Admin Resolution Note */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Admin Audit Resolution Note
                    </label>
                    <input
                      type="text"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="e.g. Corrected Option B typo and verified with official answer key..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Modal Footer / Actions for Tab 2 */}
                <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setModalTab('review')}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold transition cursor-pointer"
                  >
                    &larr; View Student Report
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSavingQuestion}
                      onClick={() => handleSaveQuestion(false)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      Save Question Only
                    </button>

                    <button
                      type="button"
                      disabled={isSavingQuestion}
                      onClick={() => handleSaveQuestion(true)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSavingQuestion ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Updating Question...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Save &amp; Mark Resolved</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900">Delete Question Report?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this error report? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteReport}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
