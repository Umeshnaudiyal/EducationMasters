'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Clock,
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';
import { getAuthToken } from '@/utils/auth';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function SeriesTestsManagePage() {
  const params = useParams();
  const seriesId = params?.id;
  const { data: session } = useSession();

  const [series, setSeries] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusTab, setStatusTab] = useState('all'); // 'all' | 'free' | 'paid'

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const [serverMessage, setServerMessage] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null, isLoading: false, isBulk: false });

  // Fetch Series & Tests
  const fetchData = useCallback(async () => {
    if (!seriesId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/apis/v1/mock-test-series/${seriesId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setSeries(data.data);
        setTests(data.data.tests || []);
      } else {
        setServerMessage({ type: 'error', text: data.message || 'Failed to load test series.' });
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setServerMessage({ type: 'error', text: 'Network error loading test series.' });
    } finally {
      setLoading(false);
    }
  }, [seriesId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Bulk selection
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredTests.map((t) => t._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkApply = async () => {
    if (!bulkAction) {
      setServerMessage({ type: 'error', text: 'Please select a bulk action.' });
      return;
    }
    if (selectedIds.length === 0) {
      setServerMessage({ type: 'error', text: 'Please select at least one test.' });
      return;
    }

    if (bulkAction === 'delete') {
      setDeleteModal({ isOpen: true, item: null, isBulk: true, isLoading: false });
      return;
    }

    try {
      setBulkLoading(true);
      const token = getAuthToken(session);
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`${API_BASE}/apis/v1/mock-tests/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              status: bulkAction === 'publish' ? 'Published' : 'Draft',
            }),
          })
        )
      );
      setServerMessage({ type: 'success', text: `Updated ${selectedIds.length} tests successfully.` });
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      console.error('Bulk update error:', err);
      setServerMessage({ type: 'error', text: 'Error applying bulk action.' });
    } finally {
      setBulkLoading(false);
    }
  };

  // Delete handler
  const handleDeleteTest = async () => {
    try {
      setDeleteModal((prev) => ({ ...prev, isLoading: true }));
      const token = getAuthToken(session);

      if (deleteModal.isBulk) {
        await Promise.all(
          selectedIds.map((id) =>
            fetch(`${API_BASE}/apis/v1/mock-tests/${id}`, {
              method: 'DELETE',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
          )
        );
        setServerMessage({ type: 'success', text: `${selectedIds.length} tests deleted successfully.` });
        setSelectedIds([]);
      } else if (deleteModal.item) {
        const res = await fetch(`${API_BASE}/apis/v1/mock-tests/${deleteModal.item._id}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setServerMessage({ type: 'success', text: `Test "${deleteModal.item.title}" deleted successfully.` });
        } else {
          setServerMessage({ type: 'error', text: data.message || 'Failed to delete test.' });
        }
      }
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      setServerMessage({ type: 'error', text: 'Error connecting to server during test deletion.' });
    } finally {
      setDeleteModal({ isOpen: false, item: null, isLoading: false, isBulk: false });
    }
  };

  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      !activeSearch.trim() ||
      t.title.toLowerCase().includes(activeSearch.toLowerCase()) ||
      (t.slug && t.slug.toLowerCase().includes(activeSearch.toLowerCase()));
    const matchesType = typeFilter === 'all' || t.test_type === typeFilter;
    const matchesStatus =
      statusTab === 'all' ||
      (statusTab === 'free' && (!t.is_paid || t.is_free)) ||
      (statusTab === 'paid' && (t.is_paid && !t.is_free));
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalQuestionsSum = tests.reduce((acc, t) => acc + (t.total_questions || 0), 0);
  const freeTestsCount = tests.filter((t) => !t.is_paid || t.is_free).length;
  const paidTestsCount = tests.length - freeTestsCount;

  const tabs = [
    { key: 'all', label: 'All Tests', count: tests.length },
    { key: 'free', label: 'Free Tests', count: freeTestsCount },
    { key: 'paid', label: 'Paid Tests', count: paidTestsCount },
  ];

  return (
    <div className="w-full space-y-3 font-sans select-none text-slate-800 pb-20">
      {/* Toast */}
      {serverMessage && (
        <div
          className={`p-2.5 rounded border text-xs flex items-start gap-2 animate-in fade-in duration-200 ${
            serverMessage.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-emerald-50 border-emerald-300 text-emerald-800'
          }`}
        >
          {serverMessage.type === 'error' ? (
            <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 font-medium">{serverMessage.text}</span>
          <button
            type="button"
            onClick={() => setServerMessage(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/edu-admin/mock-tests"
          className="hover:text-[#2271b1] flex items-center gap-1 font-medium transition-colors"
        >
          <ArrowLeft size={13} />
          <span>All Mock Test Series</span>
        </Link>
        <span>/</span>
        <span className="font-bold text-slate-800 truncate max-w-sm">
          {series?.title || 'Series'}
        </span>
      </div>

      {/* Top Header matching reference screenshot */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Tests ({tests.length})
        </h1>
        <Link
          href={`/edu-admin/mock-tests/${seriesId}/tests/create`}
          className="px-2.5 py-1 text-xs font-semibold text-[#2271b1] border border-[#2271b1] rounded hover:bg-[#2271b1] hover:text-white transition-colors flex items-center gap-1 bg-white shadow-2xs"
        >
          <Plus size={13} />
          <span>Add New Test</span>
        </Link>
        <Link
          href={`/mock-test/${series?.slug}`}
          target="_blank"
          className="px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-300 rounded hover:bg-slate-100 transition-colors flex items-center gap-1 bg-white shadow-2xs ml-auto sm:ml-0"
        >
          <ExternalLink size={13} className="text-slate-500" />
          <span>Public Series Page</span>
        </Link>
      </div>

      {/* Status Filter Counts Tabs */}
      <div className="flex items-center gap-2 text-xs text-slate-600 border-b border-slate-200 pb-2">
        {tabs.map((tab, idx) => {
          const isActive = statusTab === tab.key;
          return (
            <React.Fragment key={tab.key}>
              <button
                type="button"
                onClick={() => setStatusTab(tab.key)}
                className={`hover:text-[#2271b1] transition-colors flex items-center gap-1 cursor-pointer ${
                  isActive ? 'text-[#2271b1] font-bold' : 'text-slate-600'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-slate-400 font-normal">({tab.count})</span>
              </button>
              {idx < tabs.length - 1 && <span className="text-slate-300">|</span>}
            </React.Fragment>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Left: Bulk Actions & Test Type Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:border-[#2271b1]"
          >
            <option value="">Bulk Actions</option>
            <option value="publish">Mark Published</option>
            <option value="draft">Move to Draft</option>
            <option value="delete">Delete Permanently</option>
          </select>

          <button
            type="button"
            onClick={handleBulkApply}
            disabled={bulkLoading || selectedIds.length === 0}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 border border-slate-300 rounded text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            {bulkLoading ? 'Applying...' : 'Apply'}
          </button>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:border-[#2271b1]"
          >
            <option value="all">All Test Types</option>
            <option value="full_length">Full Length Test</option>
            <option value="sectional">Sectional Test</option>
            <option value="chapter">Chapter Test</option>
            <option value="previous_year">Previous Year Paper</option>
            <option value="live">Live Test</option>
          </select>
        </div>

        {/* Right: Search Input & Button */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setActiveSearch(search.trim());
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tests..."
            className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2271b1] w-48 sm:w-56"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-medium whitespace-nowrap transition-colors shadow-2xs cursor-pointer"
          >
            Search Tests
          </button>
        </form>
      </div>

      {/* Tests Table */}
      <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-[#2271b1]" />
              <span className="text-xs font-semibold">Loading child tests...</span>
            </div>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Layers size={32} className="mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700 text-sm">No Tests Found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {activeSearch || typeFilter !== 'all'
                ? 'Try clearing the search or filter.'
                : 'Click "+ Add New Test" to create your first test and allocate questions.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                  <th className="p-3 w-8 text-center">
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={filteredTests.length > 0 && selectedIds.length === filteredTests.length}
                      className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                    />
                  </th>
                  <th className="p-3 min-w-[240px]">Test Title</th>
                  <th className="p-3 text-center min-w-[110px]">Type</th>
                  <th className="p-3 text-center min-w-[100px]">Questions</th>
                  <th className="p-3 text-center min-w-[90px]">Duration</th>
                  <th className="p-3 text-center min-w-[90px]">Marks</th>
                  <th className="p-3 text-center min-w-[100px]">Tier</th>
                  <th className="p-3 text-center min-w-[90px]">Language</th>
                  <th className="p-3 text-center min-w-[90px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredTests.map((test) => {
                  const isSelected = selectedIds.includes(test._id);
                  const isPaid = test.is_paid && !test.is_free;

                  return (
                    <tr
                      key={test._id}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isSelected ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(test._id)}
                          className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                        />
                      </td>

                      <td className="p-3 font-medium">
                        <Link
                          href={`/edu-admin/mock-tests/${seriesId}/tests/${test._id}/edit`}
                          className="font-bold text-slate-900 hover:text-[#2271b1] text-xs transition-colors line-clamp-1"
                        >
                          {test.title}
                        </Link>

                        {/* Inline Actions */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-1">
                          <Link
                            href={`/edu-admin/mock-tests/${seriesId}/tests/${test._id}/edit`}
                            className="text-[#0073aa] hover:underline font-normal"
                          >
                            Edit & Allocate Questions
                          </Link>
                          <span>|</span>
                          <Link
                            href={`/mock-test/${series?.slug}/${test.slug}`}
                            target="_blank"
                            className="text-[#0073aa] hover:underline font-normal flex items-center gap-0.5"
                          >
                            <span>Attempt Test</span>
                            <ExternalLink size={10} />
                          </Link>
                          <span>|</span>
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ isOpen: true, item: test, isLoading: false, isBulk: false })}
                            className="text-rose-600 hover:underline font-normal cursor-pointer"
                          >
                            Trash
                          </button>
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <span className="capitalize px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium text-slate-700">
                          {test.test_type?.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <Link
                          href={`/edu-admin/mock-tests/${seriesId}/tests/${test._id}/edit?tab=questions`}
                          className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
                        >
                          <BookOpen size={11} className="text-[#2271b1]" />
                          <span>{test.total_questions || 0}</span>
                        </Link>
                      </td>

                      <td className="p-3 text-center text-slate-600 font-medium">
                        {test.duration_minutes || 60} mins
                      </td>

                      <td className="p-3 text-center text-slate-600 font-medium">
                        {test.total_marks || 100} M
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPaid ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isPaid ? 'PAID' : 'FREE'}
                        </span>
                      </td>

                      <td className="p-3 text-center text-slate-600">
                        {test.medium || 'Bilingual'}
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            (test.status || '').toLowerCase().includes('pub')
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {test.status || 'Published'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null, isLoading: false, isBulk: false })}
        onConfirm={handleDeleteTest}
        title={deleteModal.isBulk ? `Delete ${selectedIds.length} Tests?` : `Delete "${deleteModal.item?.title}"?`}
        message="This will delete the selected mock test(s). Questions in the question bank will remain intact."
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
