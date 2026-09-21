'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  FileSpreadsheet,
  Download,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  CheckSquare,
  HelpCircle,
} from 'lucide-react';
import ExcelQuestionImportModal from '@/components/admin/ExcelQuestionImportModal';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

export default function QuestionsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    all: 0,
    published: 0,
    draft: 0,
    pending: 0,
    trash: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  // Filters
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Dropdown options
  const [subjectsList, setSubjectsList] = useState([]);
  const [statesList, setStatesList] = useState([]);

  // Selections & bulk actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Modals & messages
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [serverMessage, setServerMessage] = useState(null);

  // Fetch filter options (Subjects & States)
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [subRes, stRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/subjects?limit=100`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/states?all=true`),
        ]);
        const subData = await subRes.json();
        const stData = await stRes.json();
        if (subData.success) setSubjectsList(subData.data || []);
        if (stData.success) setStatesList(stData.data || []);
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };
    fetchOptions();
  }, []);

  // Fetch Questions
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        status: activeTab,
        search: activeSearch,
        subject: selectedSubject,
        state: selectedState,
        date: selectedDate,
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/questions?${query}`
      );
      const data = await res.json();

      if (data.success) {
        setQuestions(data.data || []);
        if (data.counts) setCounts(data.counts);
        if (data.pagination) setPagination(data.pagination);
      } else {
        setServerMessage({ type: 'error', text: data.message || 'Failed to load questions' });
      }
    } catch (err) {
      console.error('Questions fetch error:', err);
      setServerMessage({ type: 'error', text: 'Error connecting to server to fetch questions.' });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, activeTab, activeSearch, selectedSubject, selectedState, selectedDate]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Tab change
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSelectedIds([]);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Search submit
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setActiveSearch(searchTerm.trim());
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Selection handlers
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(questions.map((q) => q._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkAction = async () => {
    if (!bulkAction) return;
    if (selectedIds.length === 0) {
      setServerMessage({ type: 'error', text: 'Please select questions to apply bulk action.' });
      return;
    }

    const actionText =
      bulkAction === 'publish'
        ? 'publish'
        : bulkAction === 'draft'
        ? 'move to draft'
        : bulkAction === 'trash'
        ? 'move to trash'
        : bulkAction === 'restore'
        ? 'restore'
        : 'permanently delete';

    if (!window.confirm(`Are you sure you want to ${actionText} ${selectedIds.length} selected questions?`)) {
      return;
    }

    try {
      setBulkLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/questions/bulk-action`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ action: bulkAction, ids: selectedIds }),
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        setServerMessage({ type: 'success', text: data.message || 'Bulk action applied successfully.' });
        setSelectedIds([]);
        setBulkAction('');
        fetchQuestions();
      } else {
        setServerMessage({ type: 'error', text: data.message || 'Failed to apply bulk action.' });
      }
    } catch (err) {
      console.error('Bulk action error:', err);
      setServerMessage({ type: 'error', text: 'Server error occurred during bulk action.' });
    } finally {
      setBulkLoading(false);
    }
  };

  // Single Question Delete / Trash
  const confirmDelete = (q) => {
    setItemToDelete(q);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const isPermanently = activeTab === 'trash';

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/questions/${itemToDelete._id}${
          isPermanently ? '?force=true' : ''
        }`,
        {
          method: 'DELETE',
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        setServerMessage({
          type: 'success',
          text: isPermanently ? 'Question permanently deleted.' : 'Question moved to trash.',
        });
        fetchQuestions();
      } else {
        setServerMessage({ type: 'error', text: data.message || 'Failed to delete question.' });
      }
    } catch (err) {
      console.error('Delete error:', err);
      setServerMessage({ type: 'error', text: 'Server error while deleting.' });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  // Single Question Restore
  const handleRestore = async (id) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/questions/${id}/restore`,
        {
          method: 'PUT',
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setServerMessage({ type: 'success', text: 'Question restored to published.' });
        fetchQuestions();
      } else {
        setServerMessage({ type: 'error', text: data.message || 'Failed to restore question.' });
      }
    } catch (err) {
      console.error('Restore error:', err);
      setServerMessage({ type: 'error', text: 'Server error while restoring.' });
    }
  };

  // Inline Status Change Handler
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingStatusId(id);
    const prevQuestions = [...questions];

    // Optimistic UI update
    setQuestions((prev) =>
      prev.map((q) => (q._id === id ? { ...q, status: newStatus } : q))
    );

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/questions/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setServerMessage({
          type: 'success',
          text: `Status changed to "${newStatus}" successfully.`,
        });
        setTimeout(() => setServerMessage(null), 3000);
        fetchQuestions();
      } else {
        setQuestions(prevQuestions);
        setServerMessage({ type: 'error', text: data.message || 'Failed to update status.' });
      }
    } catch (err) {
      console.error('Status update error:', err);
      setQuestions(prevQuestions);
      setServerMessage({ type: 'error', text: 'Error connecting to server to update status.' });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const tabs = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'published', label: 'Published', count: counts.published },
    { key: 'draft', label: 'Drafts', count: counts.draft },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'trash', label: 'Trashed', count: counts.trash },
  ];

  return (
    <div className="space-y-3 w-full select-none font-sans text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-normal text-slate-900 tracking-tight">
            Question
          </h1>
          <Link
            href="/edu-admin/questions/create"
            className="px-2.5 py-1 bg-[#f6f7f7] hover:bg-slate-100 text-[#0073aa] border border-[#0073aa] rounded text-xs font-normal transition-colors flex items-center gap-1 shadow-2xs"
          >
            <Plus size={12} />
            <span>Add Question</span>
          </Link>
          <button
            type="button"
            onClick={() => setExcelModalOpen(true)}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet size={12} />
            <span>Import Excel</span>
          </button>
        </div>

        {/* Top Right Search Form */}
        <form onSubmit={handleSearch} className="flex items-center gap-1.5 self-end sm:self-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions / answer..."
            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] w-44 sm:w-56"
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-[#f6f7f7] hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-normal transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
          >
            Search Questions
          </button>
        </form>
      </div>

      {/* Global Alert Notification Banner */}
      {serverMessage && (
        <div
          className={`p-2.5 rounded border text-xs flex items-start gap-2 animate-in fade-in duration-200 ${
            serverMessage.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-emerald-50 border-emerald-300 text-emerald-800'
          }`}
        >
          {serverMessage.type === 'error' ? (
            <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
          ) : (
            <CheckCircle2 size={15} className="shrink-0 text-emerald-600 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{serverMessage.text}</div>
          <button
            type="button"
            onClick={() => setServerMessage(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Status Tabs Bar */}
      <div className="flex items-center gap-1.5 text-xs">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.key;
          return (
            <React.Fragment key={tab.key}>
              <button
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`transition-colors cursor-pointer py-0.5 font-normal ${
                  isActive
                    ? 'text-slate-900 font-bold border-b-2 border-[#2271b1]'
                    : 'text-[#2271b1] hover:text-[#135e96]'
                }`}
              >
                {tab.label}{' '}
                <span className="text-slate-500 font-normal">
                  ({tab.count?.toLocaleString() || 0})
                </span>
              </button>
              {idx < tabs.length - 1 && <span className="text-slate-300">|</span>}
            </React.Fragment>
          );
        })}
      </div>

      {/* Filter Toolbar (Bulk Actions + Dropdowns) */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-0.5">
        {/* Left: Bulk Actions */}
        <div className="flex items-center gap-1.5">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 font-normal focus:outline-none focus:border-[#2271b1]"
          >
            <option value="">Bulk Actions</option>
            {activeTab !== 'trash' ? (
              <>
                <option value="publish">Mark Published</option>
                <option value="draft">Move to Draft</option>
                <option value="trash">Move to Trash</option>
              </>
            ) : (
              <>
                <option value="restore">Restore</option>
                <option value="delete">Delete Permanently</option>
              </>
            )}
          </select>

          <button
            type="button"
            onClick={handleBulkAction}
            disabled={bulkLoading || selectedIds.length === 0}
            className="px-2.5 py-1 bg-[#f6f7f7] hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-300 rounded text-xs font-normal transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            {bulkLoading && <Loader2 size={11} className="animate-spin" />}
            <span>Apply</span>
          </button>
        </div>

        {/* Right: Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 font-normal focus:outline-none focus:border-[#2271b1] max-w-[160px]"
          >
            <option value="">All Subjects</option>
            {subjectsList.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 font-normal focus:outline-none focus:border-[#2271b1] max-w-[160px]"
          >
            <option value="">All States</option>
            {statesList.map((st) => (
              <option key={st._id} value={st._id}>
                {st.name}
              </option>
            ))}
          </select>

          {/* Filter Trigger Button */}
          <button
            type="button"
            onClick={fetchQuestions}
            className="px-2.5 py-1 bg-[#f6f7f7] hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-normal transition-colors cursor-pointer shadow-2xs"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Questions Data Table */}
      <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-[#f6f7f7] border-b border-slate-300 text-xs font-semibold text-slate-800">
              <tr>
                <th className="py-2 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    onChange={toggleSelectAll}
                    checked={questions.length > 0 && selectedIds.length === questions.length}
                    className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                  />
                </th>
                <th className="py-2 px-2 w-12 text-center text-slate-600">#</th>
                <th className="py-2 px-3 min-w-[240px] max-w-[340px]">Question</th>
                <th className="py-2 px-3 min-w-[90px]">Answer</th>
                <th className="py-2 px-3 min-w-[120px]">Subject</th>
                <th className="py-2 px-3 min-w-[110px]">State</th>
                <th className="py-2 px-3 min-w-[90px]">Author</th>
                <th className="py-2 px-3 text-center min-w-[80px]">Status</th>
                <th className="py-2 px-3 text-right pr-3 min-w-[90px]">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-[#2271b1]" />
                      <span>Loading question bank...</span>
                    </div>
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="space-y-1">
                      <HelpCircle size={28} className="mx-auto text-slate-300 mb-1" />
                      <p className="font-semibold text-slate-700">No questions found</p>
                      <p className="text-[11px] text-slate-400">
                        Try changing the status tab, filters, or search term.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                questions.map((q, idx) => {
                  const isSelected = selectedIds.includes(q._id);
                  const correctOpt = q.options?.find((o) => o.is_correct);
                  const answerDisplay =
                    q.correct_answer ||
                    (correctOpt ? `Option ${correctOpt.index}` : 'A');

                  const statusStr = (q.status || 'Published').toLowerCase();

                  return (
                    <tr
                      key={q._id}
                      className={`hover:bg-[#f6f7f7] transition-colors ${
                        isSelected ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2 px-3 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(q._id)}
                          className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                        />
                      </td>

                      {/* SQL ID */}
                      <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-400 align-middle">
                        {q.sql_id || (pagination.page - 1) * pagination.limit + idx + 1}
                      </td>

                      {/* Question Content */}
                      <td className="py-2 px-3 align-middle max-w-[340px]">
                        <div className="font-medium text-slate-800 line-clamp-2">
                          {q.content}
                        </div>
                        {q.ans_info && (
                          <p
                            title={q.ans_info}
                            className="text-[11px] text-slate-400 mt-0.5 max-w-[260px] truncate italic cursor-help"
                          >
                            💡 {q.ans_info.length > 45 ? `${q.ans_info.slice(0, 45).trim()}...` : q.ans_info}
                          </p>
                        )}
                      </td>

                      {/* Answer Pill */}
                      <td className="py-2 px-3 align-middle">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} className="text-emerald-600" />
                          <span>{answerDisplay}</span>
                        </span>
                      </td>

                      {/* Subject */}
                      <td className="py-2 px-3 align-middle">
                        <span className="text-slate-700">
                          {q.subject?.name || q.subject_name || '—'}
                        </span>
                      </td>

                      {/* State */}
                      <td className="py-2 px-3 align-middle">
                        <span className="text-slate-600">
                          {q.state?.name || q.state_name || '—'}
                        </span>
                      </td>

                      {/* Author */}
                      <td className="py-2 px-3 text-slate-500 text-[11px] align-middle">
                        {q.author?.name || q.author_name || 'Test Student'}
                      </td>

                      {/* Status Dropdown / Toggle */}
                      <td className="py-2 px-3 text-center align-middle">
                        <div className="relative inline-flex items-center">
                          <select
                            value={
                              statusStr.includes('pub')
                                ? 'Published'
                                : statusStr.includes('pending')
                                ? 'Pending'
                                : statusStr.includes('trash')
                                ? 'Trash'
                                : 'Draft'
                            }
                            disabled={updatingStatusId === q._id}
                            onChange={(e) => handleStatusChange(q._id, e.target.value)}
                            className={`text-[11px] font-semibold rounded px-2 py-0.5 border cursor-pointer appearance-none pr-5 focus:outline-none transition-all shadow-2xs ${
                              statusStr.includes('pub')
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/80 focus:ring-1 focus:ring-emerald-400'
                                : statusStr.includes('pending')
                                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/80 focus:ring-1 focus:ring-amber-400'
                                : statusStr.includes('trash')
                                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100/80 focus:ring-1 focus:ring-rose-400'
                                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200/80 focus:ring-1 focus:ring-slate-400'
                            } ${updatingStatusId === q._id ? 'opacity-50 pointer-events-none' : ''}`}
                          >
                            <option value="Published">Published</option>
                            <option value="Pending">Pending</option>
                            <option value="Draft">Draft</option>
                            <option value="Trash">Trash</option>
                          </select>
                          {updatingStatusId === q._id ? (
                            <span className="absolute right-1.5 w-2.5 h-2.5 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin pointer-events-none" />
                          ) : (
                            <ChevronDown
                              size={11}
                              className={`absolute right-1 pointer-events-none ${
                                statusStr.includes('pub')
                                  ? 'text-emerald-600'
                                  : statusStr.includes('pending')
                                  ? 'text-amber-600'
                                  : statusStr.includes('trash')
                                  ? 'text-rose-600'
                                  : 'text-slate-600'
                              }`}
                            />
                          )}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-2 px-3 text-right pr-3 align-middle">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {activeTab === 'trash' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRestore(q._id)}
                                title="Restore question"
                                className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors shadow-2xs cursor-pointer"
                              >
                                <RotateCcw size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => confirmDelete(q)}
                                title="Delete permanently"
                                className="p-1 bg-[#dc3232] hover:bg-[#b32d2e] text-white rounded transition-colors shadow-2xs cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          ) : (
                            <>
                              <Link
                                href={`/edu-admin/questions/edit/${q._id}`}
                                title="Edit Question"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#00a0d2] hover:bg-[#008ebb] text-white rounded text-[11px] font-medium transition-colors shadow-2xs"
                              >
                                <Edit2 size={11} />
                                <span>Edit</span>
                              </Link>
                              <button
                                type="button"
                                onClick={() => confirmDelete(q)}
                                title="Move to Trash"
                                className="p-1 bg-[#dc3232] hover:bg-[#b32d2e] text-white rounded transition-colors shadow-2xs cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-2.5 bg-[#f6f7f7] border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <div>
            Showing page <strong className="text-slate-800">{pagination.page}</strong> of{' '}
            <strong className="text-slate-800">{pagination.pages}</strong> ({pagination.total?.toLocaleString() || 0} total questions)
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                className="p-1 bg-white hover:bg-slate-100 disabled:opacity-40 rounded border border-slate-300 transition-colors text-slate-700 shadow-2xs cursor-pointer"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="px-2 font-semibold text-slate-700 text-xs">{pagination.page}</span>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))
                }
                className="p-1 bg-white hover:bg-slate-100 disabled:opacity-40 rounded border border-slate-300 transition-colors text-slate-700 shadow-2xs cursor-pointer"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Excel Importer Modal */}
      <ExcelQuestionImportModal
        isOpen={excelModalOpen}
        onClose={() => setExcelModalOpen(false)}
        onSuccess={() => {
          fetchQuestions();
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={activeTab === 'trash' ? 'Permanently Delete Question?' : 'Move Question to Trash?'}
        itemName={itemToDelete?.content}
        description={
          activeTab === 'trash'
            ? 'Are you sure you want to permanently delete this question? This cannot be undone.'
            : 'Are you sure you want to move this question to trash? You can restore it later.'
        }
        confirmText={activeTab === 'trash' ? 'Delete Permanently' : 'Move to Trash'}
      />
    </div>
  );
}
