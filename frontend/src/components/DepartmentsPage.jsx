'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import LiveTicker from '@/components/LiveTicker';
import Footer from '@/components/Footer';
import { getImageUrl } from '@/utils/image';
import {
  Search,
  Building2,
  ChevronRight,
  X,
  Sparkles,
  ArrowRight,
  Layers,
  GraduationCap,
  Flame,
  CheckCircle2,
  Share2,
  ExternalLink,
  BookOpen,
  Briefcase,
  FileText,
  Compass,
  Trophy,
  Award,
  Zap,
  Shield,
} from 'lucide-react';
import { API_BASE } from '@/utils/api';

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

// Contextual Tag Pills (matching live Education Masters tags banner)
const TAG_PILLS = [
  { label: '📰 नोट्स पढ़ें', href: '/articles' },
  { label: '📖 टीचिंग सामग्री लें', href: '/categories' },
  { label: '📝 तैयारी करें', href: '/syllabus' },
  { label: '🏫 स्कूल खोजें', href: '/institutes' },
  { label: '💳 खाता खोलें', href: '/department/bank/jobs' },
  { label: '📦 एक्सपोर्ट करें', href: '/jobs' },
  { label: '🏷️ लोन ऑफ़र तुलना करें', href: '/jobs' },
  { label: '🏦 Bank', href: '/department/bank/jobs' },
  { label: '❓ क्विज़ खेलें', href: '/mock-tests' },
  { label: '🧠 मनोविज्ञान सीखें', href: '/mcq-questions' },
];

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sidebarTab, setSidebarTab] = useState('expiring');
  const [expiringJobs, setExpiringJobs] = useState(DEFAULT_EXPIRING_JOBS);
  const [expiringJobsCount, setExpiringJobsCount] = useState(11);

  // Fetch departments from backend API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/departments?all=true`);
        const json = await res.json();

        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const list = json.data.map((item) => ({
            id: item._id,
            name: item.name,
            slug: item.slug || item.name.toLowerCase().replace(/\s+/g, '-'),
            image: item.image || null,
            description: item.description || '',
          }));

          // Sort alphabetically by name
          list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
          setDepartments(list);
        }
      } catch (err) {
        console.error('Error loading departments:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSidebarJobs = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/expiring-soon?limit=8`);
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
          setExpiringJobsCount(json.total || mapped.length || 11);
        }
      } catch (e) {
        console.warn('Sidebar jobs fetch fallback:', e);
      }
    };

    fetchDepartments();
    fetchSidebarJobs();
  }, []);

  // Filter departments by search query and category filters
  const filteredDepartments = useMemo(() => {
    let list = departments;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.slug.toLowerCase().includes(q) ||
          (d.description || '').toLowerCase().includes(q)
      );
    }

    if (activeFilter !== 'all') {
      const f = activeFilter.toLowerCase();
      if (f === 'defence') {
        list = list.filter((d) =>
          /army|airforce|navy|defence|aft|police|crpf|bsf|cisf/i.test(d.name + ' ' + d.slug)
        );
      } else if (f === 'banking') {
        list = list.filter((d) =>
          /bank|rbi|sbi|ibps|cbhfl|finance/i.test(d.name + ' ' + d.slug)
        );
      } else if (f === 'psc') {
        list = list.filter((d) =>
          /psc|upsc|bpsc|appsc|ukpsc|cgpsc|mppsc|hpsc/i.test(d.name + ' ' + d.slug)
        );
      } else if (f === 'railway') {
        list = list.filter((d) =>
          /railway|rrb|irctc|metro/i.test(d.name + ' ' + d.slug)
        );
      }
    }

    return list;
  }, [departments, searchQuery, activeFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 font-sans">
      <Header />
      <LiveTicker />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          
          {/* ================= LEFT MAIN DEPARTMENTS SECTION ================= */}
          <section className="col-span-1 lg:col-span-8 xl:col-span-9 space-y-4 min-w-0">
            
            {/* Top Breadcrumbs */}
            <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1 overflow-x-auto whitespace-nowrap">
              <Link href="/" className="hover:text-blue-600 font-normal">
                Home
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-slate-700 font-medium">Departments</span>
            </nav>

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Departments
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Explore government departments, recruitment commissions &amp; public sector undertakings
                </p>
              </div>

              {/* Real-time Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search departments..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {[
                { id: 'all', label: `All Departments (${departments.length})` },
                { id: 'defence', label: 'Defence & Armed Forces' },
                { id: 'banking', label: 'Banking & Financial' },
                { id: 'psc', label: 'UPSC & State PSCs' },
                { id: 'railway', label: 'Railways & Transport' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all text-xs cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Loading State Skeleton */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 animate-pulse space-y-2"
                  >
                    <div className="w-full aspect-[16/10] bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : filteredDepartments.length === 0 ? (
              /* Empty State */
              <div className="py-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-slate-700 font-semibold text-sm">
                  No departments found matching &quot;{searchQuery}&quot;
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Reset search &amp; filters
                </button>
              </div>
            ) : (
              /* ================= DEPARTMENTS 4-COLUMN GRID ================= */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4 pt-1">
                {filteredDepartments.map((dept, index) => {
                  const imageUrl = dept.image ? getImageUrl(dept.image) : null;
                  const isEighth = index === 7;

                  return (
                    <React.Fragment key={dept.id || dept.slug}>
                      <Link
                        href={`/department/${dept.slug}/jobs`}
                        className="group flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs hover:shadow-md hover:border-blue-400 transition-all duration-200 transform hover:-translate-y-0.5"
                      >
                        {/* Top Thumbnail Image or "No Image" Placeholder */}
                        <div className="relative w-full aspect-[16/10] bg-slate-100 overflow-hidden flex items-center justify-center">
                          {imageUrl ? (
                            <>
                              <img
                                src={imageUrl}
                                alt={dept.name}
                                className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.nextSibling) {
                                    e.currentTarget.nextSibling.style.display = 'flex';
                                  }
                                }}
                              />
                              <div className="w-full h-full bg-[#e2e4e8] hidden items-center justify-center">
                                <span className="text-slate-400 font-bold text-sm tracking-wide select-none">
                                  No Image
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-[#e2e4e8] flex items-center justify-center">
                              <span className="text-slate-400 font-bold text-sm tracking-wide select-none">
                                No Image
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card Bottom Title */}
                        <div className="p-2.5 sm:p-3 bg-white border-t border-slate-100 flex items-center justify-between min-h-[46px]">
                          <span
                            className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition truncate"
                            title={dept.name}
                          >
                            {dept.name}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0 ml-1" />
                        </div>
                      </Link>

                      {/* Mid-Grid Contextual Tag Pills Banner (inserted after row 2 / 8 items) */}
                      {isEighth && (
                        <div className="col-span-2 sm:col-span-3 md:col-span-4 my-2 p-2.5 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="bg-slate-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-2xs">
                              ज़्यादा जानें
                            </span>
                            {TAG_PILLS.map((pill, pIdx) => (
                              <Link
                                key={pIdx}
                                href={pill.href}
                                className="bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-medium px-2.5 py-1 rounded-full border border-slate-200 transition-colors shadow-2xs"
                              >
                                {pill.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* Bottom SEO Summary Box */}
            <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600 leading-relaxed">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                Explore Government Departments &amp; Recruitment Boards Across India
              </h3>
              <p>
                Stay updated with the latest recruitment notifications, vacancy updates, syllabus, eligibility criteria, and exam patterns across all premier central and state government departments. From Public Service Commissions (UPSC, BPSC, APPSC, UKPSC) to Defence (Army, Navy, Airforce), Banking (SBI, IBPS, RBI, Bank PO), Railways, Public Sector Undertakings (PSUs), and state boards, find comprehensive career guidance and direct application details.
              </p>
            </div>
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
                      {expiringJobsCount} Jobs are expiring in 30 Days
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
                        Indian Polity
                      </span>
                      <p className="font-medium text-slate-800 leading-snug">
                        Who presides over the joint sitting of the Parliament in India?
                      </p>
                    </div>
                    <div className="py-2 border-b border-slate-200 space-y-1">
                      <span className="text-[10px] font-semibold text-amber-600 uppercase bg-amber-50 px-1.5 py-0.5 rounded">
                        Current Affairs
                      </span>
                      <p className="font-medium text-slate-800 leading-snug">
                        Which state government recently launched the Youth Employment Scheme?
                      </p>
                    </div>
                    <div className="py-2 space-y-1">
                      <span className="text-[10px] font-semibold text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded">
                        General Science
                      </span>
                      <p className="font-medium text-slate-800 leading-snug">
                        What is the SI unit of electric current intensity?
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Social Channel Join Banner */}
            <div className="bg-[#e6f7ef] border border-[#a3e6c5] rounded-lg p-3 text-center space-y-1.5">
              <p className="text-xs font-semibold text-emerald-900">
                सरकारी नौकरियों और Department अपडेट्स के लिए हमारे ग्रुप्स से जुड़ें:
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
