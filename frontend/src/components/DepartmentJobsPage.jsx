'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import LiveTicker from '@/components/LiveTicker';
import Footer from '@/components/Footer';
import { getImageUrl } from '@/utils/image';
import { API_BASE } from '@/utils/api';
import {
  ChevronRight,
  ChevronLeft,
  X,
  Building2,
  Calendar,
  Briefcase,
  ExternalLink,
} from 'lucide-react';

const LIMIT = 12;

const DEFAULT_EXPIRING_JOBS = [
  {
    id: 1,
    title: 'RRB Paramedical CEN 05/2026 Recruitment for 101 Posts',
    slug: 'rrb-paramedical-cen-05-2026-recruitment',
    lastDate: 'Oct 14',
    category: 'Railway',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 2,
    title: 'UKSSSC PA and Steno Recruitment 2026 for 101 Personal Assistant Posts',
    slug: 'uksssc-pa-steno-recruitment-2026',
    lastDate: 'Oct 14',
    category: 'Jobs',
    image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 3,
    title: 'RRB Paramedical CEN 05/2026 Recruitment Notification Released',
    slug: 'rrb-paramedical-cen-05-2026-notification',
    lastDate: 'Oct 14',
    category: 'Jobs',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 4,
    title: 'CSIR NEERI Recruitment 2026 for 13 Technical Assistant Posts',
    slug: 'csir-neeri-recruitment-2026',
    lastDate: 'Oct 15',
    category: 'Jobs',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 5,
    title: 'UPSC Recruitment 2026 for 13 Law Officer, JTO and Other Posts',
    slug: 'upsc-recruitment-2026-law-officer',
    lastDate: 'Oct 16',
    category: 'UPSC',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 6,
    title: 'UUHF Dean Recruitment 2026 Notification Out',
    slug: 'uuhf-dean-recruitment-2026',
    lastDate: 'Oct 17',
    category: 'Jobs',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=80',
  },
];

export default function DepartmentJobsPage({ deptSlug }) {
  const [department, setDepartment] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [expiringJobs, setExpiringJobs] = useState(DEFAULT_EXPIRING_JOBS);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [sidebarTab, setSidebarTab] = useState('expiring');
  const [showLeftAd, setShowLeftAd] = useState(true);

  // Derive department display name
  const rawDeptName = department?.name || deptSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const deptName = rawDeptName === 'Army' ? 'Army' : rawDeptName;

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchDeptData = async () => {
      try {
        setLoading(true);

        // Fetch department metadata
        const deptRes = await fetch(`${API_BASE}/departments/${encodeURIComponent(deptSlug)}`);
        const deptJson = await deptRes.json();
        if (deptJson.success && deptJson.data) {
          setDepartment(deptJson.data);
        }

        // Fetch jobs for this department
        const jobsRes = await fetch(
          `${API_BASE}/jobs?department=${encodeURIComponent(deptSlug)}&page=${page}&limit=${LIMIT}`
        );
        const jobsJson = await jobsRes.json();
        if (jobsJson.success && Array.isArray(jobsJson.data)) {
          setJobs(jobsJson.data);
          setTotalPages(jobsJson.pages || 1);
          setTotalJobs(jobsJson.total || 0);
        } else {
          setJobs([]);
        }
      } catch (err) {
        console.error('Error fetching department jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchExpiring = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/expiring-soon?limit=6`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped = json.data.map((item, idx) => ({
            id: item._id || idx,
            title: item.title,
            slug: item.slug || `job-${idx}`,
            lastDate: item.app_ends
              ? new Date(item.app_ends).toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                })
              : 'Oct 14',
            category: item.department?.name || item.categories?.[0]?.name || 'Jobs',
            image: getImageUrl(
              item.featured_media,
              DEFAULT_EXPIRING_JOBS[idx % DEFAULT_EXPIRING_JOBS.length].image
            ),
          }));
          setExpiringJobs(mapped);
        }
      } catch (e) {
        console.warn('Error fetching expiring jobs:', e);
      }
    };

    fetchDeptData();
    fetchExpiring();
  }, [deptSlug, page]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Active';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const startItem = totalJobs === 0 ? 0 : (page - 1) * LIMIT + 1;
  const endItem = Math.min(page * LIMIT, totalJobs);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 font-sans">
      <Header />
      <LiveTicker />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          
          {/* ================= LEFT SKYSCRAPER AD CONTAINER ================= */}
          {showLeftAd && (
            <aside className="hidden xl:block xl:col-span-2 sticky top-20 self-start z-10">
              <div className="w-[160px] mx-auto bg-slate-900 text-white rounded overflow-hidden shadow-sm relative group">
                <button
                  onClick={() => setShowLeftAd(false)}
                  className="absolute top-1 right-1 text-slate-400 hover:text-white z-10 bg-black/40 p-0.5 rounded cursor-pointer"
                  title="Close Ad"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="p-3 text-center border-b border-slate-800">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                    Sponsored Ad
                  </span>
                </div>
                <div className="p-4 space-y-3 text-center">
                  <p className="text-xs font-semibold leading-snug text-slate-100">
                    Latest {deptName} Exam &amp; Career Updates 2026
                  </p>
                  <div className="w-full h-44 bg-gradient-to-b from-blue-950 to-slate-900 rounded flex items-center justify-center border border-blue-900/50 p-2">
                    <span className="text-[11px] text-blue-200 font-medium leading-tight">
                      100% Verified {deptName} Job Alerts
                    </span>
                  </div>
                  <a
                    href="https://educationmasters.in"
                    target="_blank"
                    rel="noreferrer"
                    className="block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-2 rounded transition"
                  >
                    Explore Updates
                  </a>
                </div>
              </div>
            </aside>
          )}

          {/* ================= CENTER MAIN DEPARTMENT JOBS SECTION ================= */}
          <section
            className={`col-span-1 ${
              showLeftAd ? 'lg:col-span-8 xl:col-span-7' : 'lg:col-span-8 xl:col-span-9'
            } space-y-4 min-w-0`}
          >
            {/* Top Breadcrumbs */}
            <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1 overflow-x-auto whitespace-nowrap">
              <Link href="/" className="hover:text-blue-600 font-normal">
                Home
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <Link href="/departments" className="hover:text-blue-600 font-normal">
                Departments
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-slate-700 font-medium">{deptName}</span>
            </nav>

            {/* Page Header */}
            <div className="border-b border-slate-200 pb-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {deptName} Jobs
              </h1>
            </div>

            {/* Loading State Skeleton */}
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="bg-white p-4 border-b border-slate-200 animate-pulse flex flex-col sm:flex-row gap-4"
                  >
                    <div className="w-full sm:w-72 h-44 bg-slate-200 rounded shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-4 bg-slate-200 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              /* Empty State */
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center space-y-3 my-4">
                <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">
                  No active job recruitments found for {deptName}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  There are currently no active vacancies published under {deptName}. Check out all government jobs or explore other departments.
                </p>
                <Link
                  href="/jobs"
                  className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition"
                >
                  View All Government Jobs &rarr;
                </Link>
              </div>
            ) : (
              /* ================= JOBS LIST ARTICLES (MATCHING SCREENSHOT) ================= */
              <div className="divide-y divide-slate-200">
                {jobs.map((job) => {
                  const mediaUrl = getImageUrl(job.featured_media, '/job-search.png');
                  const authorName =
                    job.author?.name || job.author?.nicename || 'Nandini';
                  const locationName =
                    job.state?.name || (job.state ? String(job.state) : 'All India');
                  const publishDateStr = formatDate(job.created_at || job.createdAt);
                  const lastDateStr = job.app_ends
                    ? formatDate(job.app_ends)
                    : job.last_date
                    ? formatDate(job.last_date)
                    : 'Apply Now!!';
                  const excerpt =
                    job.description?.replace(/<[^>]*>?/gm, '').slice(0, 190) ||
                    `The ${job.title} notification has been officially released. Check complete eligibility, dates, and online application details.`;

                  return (
                    <article
                      key={job._id}
                      className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 sm:gap-5 group"
                    >
                      {/* Left Thumbnail Image */}
                      <div className="w-full sm:w-72 h-44 sm:h-44 border border-slate-200 rounded-xs overflow-hidden bg-slate-50 shrink-0 relative">
                        <img
                          src={mediaUrl}
                          alt={job.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            if (!e.currentTarget.dataset.fallback) {
                              e.currentTarget.dataset.fallback = 'true';
                              e.currentTarget.src = '/job-search.png';
                            }
                          }}
                        />
                      </div>

                      {/* Right Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <Link href={`/job/${job.slug || job._id}`}>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                              {job.title}
                            </h2>
                          </Link>

                          {/* Meta Information Line */}
                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500 font-medium mt-1">
                            <span>
                              By{' '}
                              <Link
                                href={`/author/${job.author?.nicename || job.author?.name || 'admin'}`}
                                className="text-slate-700 font-medium hover:text-blue-600 hover:underline"
                              >
                                {authorName}
                              </Link>
                            </span>
                            <span>|</span>
                            <span>
                              In <strong className="text-slate-800 font-medium">{job.department?.name || job.dept || deptName}</strong>
                            </span>
                            <span>|</span>
                            <span>{publishDateStr}</span>
                            <span>|</span>
                            <span>{locationName}</span>
                          </div>

                          {/* Excerpt Snippet */}
                          <p className="text-xs sm:text-sm text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                            {excerpt} ...
                          </p>
                        </div>

                        {/* Bottom Last Date Line */}
                        <div className="mt-3 text-xs text-slate-700 font-medium">
                          <span>Last Date: </span>
                          <span className="font-semibold text-slate-900">{lastDateStr}</span>
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
                  Showing {startItem} to {endItem} of {totalJobs} results
                </div>

                <div className="inline-flex items-center rounded-md border border-slate-200 bg-white overflow-hidden text-xs sm:text-sm shadow-xs">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="px-3 py-2 border-r border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <span className="px-3 py-2 font-bold text-slate-700 bg-slate-50">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="px-3 py-2 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ================= RIGHT SIDEBAR WIDGET ================= */}
          <aside className="col-span-1 lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20 self-start z-10 space-y-4 max-h-none lg:max-h-[calc(100vh-5.5rem)] overflow-visible lg:overflow-y-auto mt-6 lg:mt-0">
            <div className="bg-[#f8f9fa] border border-slate-200 rounded-lg p-3.5 shadow-2xs">
              
              {/* Tab Header - 2 Equal 50% Tabs */}
              <div className="flex border-b border-slate-200 -mx-3.5 -mt-3.5 mb-3.5 bg-[#e9ecef]/50 rounded-t-lg overflow-hidden">
                <button
                  onClick={() => setSidebarTab('expiring')}
                  className={`flex-1 py-3 px-2 text-center text-xs sm:text-sm transition cursor-pointer ${
                    sidebarTab === 'expiring'
                      ? 'bg-[#e9ecef] text-slate-900 border-r border-slate-200 font-bold'
                      : 'bg-white/60 text-[#2563eb] hover:bg-white border-r border-slate-200 font-semibold'
                  }`}
                >
                  Jobs Expiring Soon
                </button>
                <button
                  onClick={() => setSidebarTab('mcq')}
                  className={`flex-1 py-3 px-2 text-center text-xs sm:text-sm transition cursor-pointer ${
                    sidebarTab === 'mcq'
                      ? 'bg-[#e9ecef] text-slate-900 font-bold'
                      : 'bg-white/60 text-[#2563eb] hover:bg-white font-semibold'
                  }`}
                >
                  MCQ Questions
                </button>
              </div>

              {sidebarTab === 'expiring' ? (
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-2 px-0.5">
                    <span className="font-normal text-slate-600">
                      11 Jobs are expiring in 30 Days
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <Link
                        href="/jobs-expiring-in-30-days"
                        className="text-[#2563eb] font-medium hover:underline"
                      >
                        View All
                      </Link>
                      <span className="bg-[#2563eb] text-white text-[11px] font-semibold px-2 py-0.5 rounded flex items-center space-x-1">
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                        </svg>
                        <span>Jobs</span>
                      </span>
                    </div>
                  </div>
                  <hr className="border-slate-200 mb-3.5" />

                  {/* Expiring Jobs List Rows */}
                  <div className="space-y-3">
                    {expiringJobs.slice(0, 6).map((job, idx) => (
                      <div key={job.id || idx}>
                        <Link
                          href={`/job/${job.slug}`}
                          className="flex items-start space-x-3 group block transition"
                        >
                          <div className="w-[95px] h-[65px] shrink-0 rounded border border-slate-200 overflow-hidden bg-white">
                            <img
                              src={job.image}
                              alt={job.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              onError={(e) => {
                                if (!e.currentTarget.dataset.fallback) {
                                  e.currentTarget.dataset.fallback = 'true';
                                  e.currentTarget.src = '/logo.webp';
                                } else {
                                  e.currentTarget.style.display = 'none';
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="text-xs sm:text-sm font-normal text-slate-900 group-hover:text-blue-600 line-clamp-2 leading-snug">
                              {job.title}
                            </h4>
                            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                              <span className="text-slate-500 font-normal">
                                Last Date:{' '}
                                <span className="text-slate-600">
                                  {job.lastDate}
                                </span>
                              </span>
                              <span className="text-[#2563eb] font-medium truncate max-w-[80px]">
                                {job.category}
                              </span>
                            </div>
                          </div>
                        </Link>
                        {idx < 5 && <hr className="border-slate-200/80 my-3" />}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* MCQ Tab Content */
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-2 px-0.5">
                    <span className="font-normal text-slate-600">
                      Daily Practice Questions
                    </span>
                    <Link
                      href="/mcq-questions"
                      className="text-[#2563eb] font-medium hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <hr className="border-slate-200 mb-3.5" />

                  <div className="space-y-3 text-xs">
                    <div className="py-2 border-b border-slate-200 space-y-1">
                      <span className="text-[10px] font-semibold text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded">
                        Defence &amp; Armed Forces
                      </span>
                      <p className="font-medium text-slate-800 leading-snug">
                        Where is the headquarters of the Indian Army located?
                      </p>
                    </div>
                    <div className="py-2 border-b border-slate-200 space-y-1">
                      <span className="text-[10px] font-semibold text-amber-600 uppercase bg-amber-50 px-1.5 py-0.5 rounded">
                        Current Affairs
                      </span>
                      <p className="font-medium text-slate-800 leading-snug">
                        Who is the current Chief of the Army Staff of India?
                      </p>
                    </div>
                    <div className="py-2 space-y-1">
                      <span className="text-[10px] font-semibold text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded">
                        General Science
                      </span>
                      <p className="font-medium text-slate-800 leading-snug">
                        Which missile system is developed jointly by DRDO and Russia?
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Social Channel Join Banner */}
            <div className="bg-[#e6f7ef] border border-[#a3e6c5] rounded-lg p-3 text-center space-y-1.5">
              <p className="text-xs font-semibold text-emerald-900">
                सरकारी नौकरियों और {deptName} अपडेट्स के लिए हमारे ग्रुप्स से जुड़ें:
              </p>
              <div className="flex items-center justify-center space-x-2 pt-1">
                <a
                  href="https://whatsapp.com/channel/0029Vb6sjZz0wajwDXcd5B0U"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold px-3 py-1.5 rounded flex items-center space-x-1 shadow-2xs transition"
                >
                  <span>WhatsApp</span>
                </a>
                <a
                  href="https://t.me/educationmastersin"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-semibold px-3 py-1.5 rounded flex items-center space-x-1 shadow-2xs transition"
                >
                  <span>Telegram</span>
                </a>
              </div>
            </div>
          </aside>

        </div>
      </main>

      <Footer />
    </div>
  );
}
