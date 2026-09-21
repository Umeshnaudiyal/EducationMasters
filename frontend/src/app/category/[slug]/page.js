'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import LiveTicker from '@/components/LiveTicker';
import Footer from '@/components/Footer';
import { getImageUrl } from '@/utils/image';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/apis/v1` : 'http://localhost:5001/apis/v1';
const LIMIT = 12;

const CATEGORY_MAP = {
  'current-affair': { title: 'Current Affair Posts', name: 'Current Affair', subtitle: 'Learn in detail about Current Affairs & Important Updates' },
  'current-affairs': { title: 'Current Affair Posts', name: 'Current Affair', subtitle: 'Learn in detail about Current Affairs & Important Updates' },
  'syllabus': { title: 'Syllabus Posts', name: 'Syllabus', subtitle: 'Latest Government Exam Syllabus, Exam Pattern & Subject Guide' },
  'articles': { title: 'Articles Posts', name: 'Articles', subtitle: 'Latest Educational Articles, Career Guidance & Exam Updates' },
  'article': { title: 'Articles Posts', name: 'Articles', subtitle: 'Latest Educational Articles, Career Guidance & Exam Updates' },
  'gk': { title: 'G.K. Posts', name: 'G.K.', subtitle: 'General Knowledge Questions, Notes & Daily GK Updates' },
  'general-knowledge': { title: 'General Knowledge Posts', name: 'General Knowledge', subtitle: 'Improve your General Knowledge for Govt Exams' },
  'defence': { title: 'Defence Posts', name: 'Defence', subtitle: 'Defence Preparation, Army, Navy, Airforce & CDS Updates' },
  'biography': { title: 'Biography Posts', name: 'Biography', subtitle: 'Read Inspiring Biographies of Famous Personalities' },
  'railway': { title: 'Railway Posts', name: 'Railway', subtitle: 'Learn in detail about Railway Recruitment & Exams' },
  'bank': { title: 'Bank Posts', name: 'Bank', subtitle: 'Bank Recruitment, PO, Clerk, SBI & IBPS Preparation' },
  'ssc': { title: 'SSC Posts', name: 'SSC', subtitle: 'SSC CGL, CHSL, MTS, CPO Exam Preparation & Updates' },
  'upsc': { title: 'UPSC Posts', name: 'UPSC', subtitle: 'UPSC Civil Services, IAS, IPS & State PSC Updates' },
  'funzone': { title: 'Funzone Posts', name: 'Funzone', subtitle: 'Improve your knowledge through interesting facts & puzzles' },
  'tips': { title: 'Tips Posts', name: 'Tips', subtitle: 'Exam preparation tips, strategies & career guidance' },
  'exam-tips': { title: 'Exam Tips Posts', name: 'Exam Tips', subtitle: 'Exam strategies, tips, and preparation guides' }
};

const getCategoryInfo = (slug) => {
  if (!slug) return { title: 'Articles Posts', name: 'Articles', subtitle: 'Explore latest educational articles and updates' };
  const lower = slug.toLowerCase();
  if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower];
  const words = lower.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    title: `${words} Posts`,
    name: words,
    subtitle: `Explore latest posts, updates, and resources in ${words}`
  };
};

export default function CategoryPage() {
  const params = useParams();
  const rawSlug = params?.slug || 'articles';
  const categorySlug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const categoryInfo = getCategoryInfo(categorySlug);

  const [items, setItems] = useState([]);
  const [expiringJobs, setExpiringJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [rightTab, setRightTab] = useState('expiring');

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCategoryPosts(page);
    fetchExpiringJobs();
  }, [categorySlug, page]);

  const fetchCategoryPosts = async (pageNum) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/blogs?category=${encodeURIComponent(categorySlug)}&page=${pageNum}&limit=${LIMIT}`);
      const data = await res.json();
      if (data.success && data.data) {
        setItems(data.data);
        setTotalPages(data.pages || 1);
        setTotalItems(data.total || 0);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Error fetching category posts:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiringJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/jobs/expiring-soon?limit=6`);
      const data = await res.json();
      if (data.success && data.data) {
        setExpiringJobs(data.data);
      }
    } catch (err) {
      console.error('Error fetching expiring jobs:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Sep 30, 2026';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return 'Sep 14';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getPaginationItems = (current, total) => {
    if (total <= 9) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, 6, '...', total - 1, total];
    }
    if (current >= total - 3) {
      return [1, 2, '...', total - 5, total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 2, current - 1, current, current + 1, current + 2, '...', total];
  };

  const startItem = totalItems === 0 ? 0 : (page - 1) * LIMIT + 1;
  const endItem = Math.min(page * LIMIT, totalItems);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans">
      <Header />
      <LiveTicker />

      <div className="max-w-[1550px] mx-auto px-3 sm:px-4 py-6 flex-1 w-full bg-white">

        {/* Responsive Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* 1. LEFT SKYSCRAPER AD CONTAINER */}
          <aside className="hidden xl:block xl:col-span-2 sticky top-20">
            <div className="bg-[#f8fafc] border border-slate-200 rounded-lg p-3 min-h-[600px] flex flex-col items-center justify-between text-center relative overflow-hidden group shadow-2xs">
              <div className="w-full flex items-center justify-between text-[10px] text-blue-700 font-bold uppercase tracking-wider">
                <span>Featured Partner</span>
                <span className="font-extrabold text-xs text-blue-900">Education</span>
              </div>

              <div className="my-auto space-y-4 px-1">
                <div className="w-20 h-20 bg-gradient-to-tr from-blue-700 to-cyan-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto shadow-md">
                  🎓
                </div>
                <h4 className="font-black text-slate-900 text-base leading-tight">
                  Learn from Top Industry Experts
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Future-ready programs with strong career placement assistance.
                </p>
                <a
                  href="/jobs"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2 rounded transition shadow uppercase"
                >
                  Apply Now
                </a>
              </div>

              <span className="text-[10px] text-slate-400">Sponsored Banner</span>
            </div>
          </aside>

          {/* 2. CENTER MAIN CONTENT STREAM */}
          <main className="col-span-1 lg:col-span-8 xl:col-span-7 space-y-4">

            {/* Breadcrumb - Perfectly Aligned Within Content Column */}
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5 font-medium overflow-x-auto whitespace-nowrap">
              <a href="/" className="hover:text-blue-600 text-blue-600 underline">Home</a>
              <span>›</span>
              <span className="text-slate-500">Categories</span>
              <span>›</span>
              <span className="text-slate-800 font-bold">Category: {categoryInfo.name}</span>
            </div>

            {/* Title Header */}
            <div className="border-b border-slate-200 pb-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {categoryInfo.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {categoryInfo.subtitle}
              </p>
            </div>

            {/* Articles List */}
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="bg-white p-4 border-b border-slate-200 animate-pulse flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-72 h-44 bg-slate-200 rounded shrink-0"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center space-y-3">
                <div className="text-3xl">📚</div>
                <h3 className="text-base font-semibold text-slate-800">No posts found in {categoryInfo.name}</h3>
                <p className="text-xs text-slate-500">Check back soon for new exam updates and educational guides.</p>
                <a href="/category/articles" className="inline-block text-xs font-semibold text-blue-600 hover:underline">
                  View All Educational Articles &rarr;
                </a>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {items.map((item) => {
                  const mediaUrl = getImageUrl(item.featured_media);

                  return (
                    <article
                      key={item._id}
                      className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 sm:gap-5 group"
                    >
                      {/* Left Thumbnail Image */}
                      <div className="w-full sm:w-72 h-44 sm:h-44 border border-slate-200 rounded-sm overflow-hidden bg-slate-50 shrink-0 relative">
                        <img
                          src={mediaUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            if (!e.currentTarget.dataset.fallback) {
                              e.currentTarget.dataset.fallback = 'true';
                              e.currentTarget.src = '/job-search.png';
                            } else {
                              e.currentTarget.style.display = 'none';
                            }
                          }}
                        />
                      </div>

                      {/* Right Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <a href={`/${item.slug || item._id}`}>
                            <h2 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                              {item.title}
                            </h2>
                          </a>

                          {/* Meta Information Line */}
                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500 font-medium mt-1.5">
                            <span>By <strong className="text-slate-700 font-medium">{item.author?.name || 'Mohit'}</strong></span>
                            <span>|</span>
                            <span>In <strong className="text-slate-800 font-medium">{item.categories?.[0]?.name || categoryInfo.name}</strong></span>
                            <span>|</span>
                            <span>{formatDate(item.created_at || item.createdAt)}</span>
                            <span>|</span>
                            <span>{item.state?.name || 'All India'}</span>
                          </div>

                          {/* Excerpt Snippet */}
                          <p className="text-xs sm:text-sm text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                            {item.description?.replace(/<[^>]*>?/gm, '') || item.content?.replace(/<[^>]*>?/gm, '').slice(0, 160) || `Read full guide, overview and details for ${item.title}.`}
                          </p>
                        </div>

                        {/* Bottom Category Tag */}
                        <div className="mt-4 text-xs text-slate-700 font-medium">
                          Category: <span className="text-blue-600 font-semibold">{item.categories?.[0]?.name || categoryInfo.name}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-6 pb-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs sm:text-sm text-slate-500 font-medium">
                  Showing {startItem} to {endItem} of {totalItems} results
                </div>

                <div className="inline-flex items-center rounded-md border border-slate-200 bg-white overflow-hidden text-xs sm:text-sm shadow-xs">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed border-r border-slate-200 transition font-medium"
                  >
                    ‹
                  </button>

                  {getPaginationItems(page, totalPages).map((item, index) => {
                    if (item === '...') {
                      return (
                        <span key={`dots-${index}`} className="px-3 py-1.5 text-slate-400 border-r border-slate-200 font-medium select-none">
                          ...
                        </span>
                      );
                    }

                    const isCurrent = item === page;
                    return (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={`px-3 py-1.5 transition border-r border-slate-200 last:border-r-0 ${isCurrent
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-blue-600 hover:bg-slate-50 font-medium'
                          }`}
                      >
                        {item}
                      </button>
                    );
                  })}

                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition font-medium"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}

          </main>

          {/* 3. RIGHT SIDEBAR WIDGET */}
          <aside className="col-span-1 lg:col-span-4 xl:col-span-3 space-y-6 sticky top-20">

            <div className="bg-[#f0f2f5] border border-slate-300 rounded-lg overflow-hidden shadow-2xs">

              <div className="flex items-center bg-[#e4e7ec] border-b border-slate-300">
                <button
                  onClick={() => setRightTab('expiring')}
                  className={`flex-1 py-3.5 px-3 text-center text-xs sm:text-sm whitespace-nowrap font-normal transition ${rightTab === 'expiring'
                      ? 'bg-[#f0f2f5] text-slate-900 rounded-tl-lg font-medium'
                      : 'text-blue-600 hover:text-blue-700 font-medium'
                    }`}
                >
                  Jobs Expiring Soon
                </button>
                <button
                  onClick={() => setRightTab('mcq')}
                  className={`flex-1 py-3.5 px-3 text-center text-xs sm:text-sm whitespace-nowrap font-normal transition ${rightTab === 'mcq'
                      ? 'bg-[#f0f2f5] text-slate-900 rounded-tr-lg font-medium'
                      : 'text-blue-600 hover:text-blue-700 font-medium'
                    }`}
                >
                  MCQ Questions
                </button>
              </div>

              <div className="p-4 bg-[#f0f2f5]">
                {rightTab === 'expiring' ? (
                  <div>
                    <div className="flex items-center justify-between text-[11px] sm:text-xs mb-3 pb-2.5 border-b border-slate-300 gap-1.5">
                      <span className="text-slate-700 font-normal whitespace-nowrap">
                        28 Jobs are expiring in 30 Days
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a href="/jobs" className="text-blue-600 font-normal hover:underline whitespace-nowrap text-[11px] sm:text-xs">
                          View All
                        </a>
                        <span className="bg-blue-600 text-white text-[10px] sm:text-[11px] font-normal px-1.5 py-0.5 rounded inline-flex items-center gap-1 leading-none whitespace-nowrap shadow-2xs">
                          <span>📰</span>
                          <span>Jobs</span>
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-300">
                      {expiringJobs.map((item) => {
                        const miniMediaUrl = getImageUrl(item.featured_media);

                        return (
                          <a
                            key={item._id}
                            href={`/job/${item.slug || item._id}`}
                            className="py-3.5 first:pt-1 last:pb-1 flex items-start gap-3.5 group transition"
                          >
                            <div className="w-28 sm:w-32 h-20 bg-white rounded border border-slate-300 overflow-hidden shrink-0 shadow-2xs">
                              <img
                                src={miniMediaUrl}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  if (!e.currentTarget.dataset.fallback) {
                                    e.currentTarget.dataset.fallback = 'true';
                                    e.currentTarget.src = '/job-search.png';
                                  } else {
                                    e.currentTarget.style.display = 'none';
                                  }
                                }}
                              />
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between h-20">
                              <h4 className="text-xs sm:text-sm font-normal text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                {item.title}
                              </h4>
                              <div className="text-xs text-slate-500 font-normal flex items-center justify-between mt-auto">
                                <span>Last Date: {formatShortDate(item.app_ends)}</span>
                                <span className="text-blue-600 font-semibold">Jobs</span>
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-600 py-8 text-center">
                    <p className="font-medium text-slate-800 text-base">1000+ Subject-Wise MCQs</p>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">Practice History, Polity, GK, and Current Affairs MCQs daily.</p>
                  </div>
                )}
              </div>

            </div>

            {/* Sponsored Helicopter Banner */}
            <div className="bg-[#e7f9ee] border border-[#a3e6be] rounded border-dashed p-4 text-center relative overflow-hidden">
              <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider mb-2">
                Sponsored Banner
              </div>
              <h4 className="font-bold text-slate-800 text-xs">
                Book a Helicopter in Greece
              </h4>
              <p className="text-[11px] text-slate-600 mt-1">
                Luxury charters & private flight tours available online.
              </p>
              <button className="mt-3 bg-black hover:bg-zinc-800 text-white font-bold text-xs px-4 py-1.5 rounded transition shadow-sm">
                Book Now
              </button>
            </div>

          </aside>

        </div>

      </div>

      <Footer />
    </div>
  );
}
