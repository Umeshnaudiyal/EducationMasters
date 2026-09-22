'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Edit,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Briefcase
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export default function PostsManagementPage() {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [contentType, setContentType] = useState('all');

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page,
        limit: 12,
        search,
      });

      let endpoint = `${BACKEND_URL}/apis/v1/blogs?${queryParams}`;
      if (contentType === 'job') {
        endpoint = `${BACKEND_URL}/apis/v1/jobs?${queryParams}`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();

      if (data.success && data.data) {
        setPosts(data.data || []);
        setTotal(data.pagination?.total || 0);
        setPages(data.pagination?.pages || data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, contentType]);

  const typeTabs = [
    { key: 'all', label: 'All Content' },
    { key: 'article', label: 'Articles & Blogs' },
    { key: 'job', label: 'Job Posts' },
    { key: 'admit-card', label: 'Admit Cards' },
    { key: 'result', label: 'Results & Cut-offs' },
  ];

  const getStatusBadge = (status) => {
    const s = (status || 'published').toLowerCase();
    if (s === 'publish' || s === 'published' || s === 'active') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s === 'draft') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-4 w-full select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="text-blue-600" size={22} />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Posts & Content Management
            </h1>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            Manage articles, job recruitments, admit cards, exam results, and SEO metadata.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/edu-admin/posts/create?type=${contentType === 'job' ? 'job' : 'article'}`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Plus size={15} />
            <span>Add New {contentType === 'job' ? 'Job' : 'Article'}</span>
          </Link>
        </div>
      </div>

      {/* Content Type Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {typeTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setContentType(tab.key);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              contentType === tab.key
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchPosts();
          }}
          className="relative w-full sm:w-80"
        >
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </form>

        <span className="text-xs text-slate-500">
          Total items found: <strong className="text-slate-800">{total.toLocaleString()}</strong>
        </span>
      </div>

      {/* Posts Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Published Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-7 h-7 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
                      <span>Loading posts...</span>
                    </div>
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No posts found for the selected filter.
                  </td>
                </tr>
              ) : (
                posts.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    {/* Title */}
                    <td className="py-3 px-4 max-w-md">
                      <Link
                        href={`/${p.slug || p._id}`}
                        target="_blank"
                        title="Preview Content"
                        className="font-semibold text-slate-800 text-xs line-clamp-2 hover:text-blue-600 transition-colors block"
                      >
                        {p.title}
                      </Link>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">/{p.slug}</div>
                    </td>

                    {/* Author */}
                    <td className="py-3 px-4">
                      <span className="text-slate-700 font-medium">
                        {p.author?.name || p.author?.nicename || 'Admin'}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 text-[10px] font-semibold">
                        {p.categories?.[0]?.name || 'Articles'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {p.created_at ? p.created_at.slice(0, 10) : '2026-08-08'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                          p.status
                        )}`}
                      >
                        {p.status || 'Published'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/${p.slug}`}
                          target="_blank"
                          title="View Live"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <Link
                          href={`/edu-admin/posts/create?type=${contentType}&id=${p._id}`}
                          title="Edit Post"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        >
                          <Edit size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing Page <span className="font-bold text-slate-800">{page}</span> of{' '}
            <span className="font-bold text-slate-800">{pages}</span> (Total: {total.toLocaleString()} Posts)
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 rounded border border-slate-200 transition-colors text-slate-700 shadow-xs"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-mono px-2 font-bold text-slate-700">{page}</span>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="p-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 rounded border border-slate-200 transition-colors text-slate-700 shadow-xs"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
