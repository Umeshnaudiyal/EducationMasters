'use client';

import { useState, useEffect } from 'react';
import { Briefcase, Award, BarChart3, ArrowUpRight } from 'lucide-react';
import { getImageUrl } from '@/utils/image';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/apis/v1` : 'http://localhost:5001/apis/v1';

const SUBJECT_MCQS = [
  { name: 'Maths', icon: '📐', href: '/jobs' },
  { name: 'History', icon: '📜', href: '/jobs' },
  { name: 'Agriculture', icon: '🌱', href: '/jobs' },
  { name: 'English', icon: '📖', href: '/jobs' },
  { name: 'Economics', icon: '🌐', href: '/jobs' },
  { name: 'Geography', icon: '🐯', href: '/jobs' },
  { name: 'G.K.', icon: '🔴', href: '/jobs' },
  { name: 'Computer', icon: '💻', href: '/jobs' },
  { name: 'Science', icon: '⚛️', href: '/jobs' },
  { name: 'Politics', icon: '🗳️', href: '/jobs' },
  { name: 'Sociology', icon: '📚', href: '/jobs' },
  { name: 'Humanities', icon: '🎨', href: '/jobs' },
  { name: 'Reasoning', icon: '💡', href: '/jobs' },
  { name: 'Hindi', icon: '🕉️', href: '/jobs' },
  { name: 'Philosophy', icon: '🧠', href: '/jobs' },
  { name: 'Current Affair', icon: '💡', href: '/jobs' }
];

export default function LiveUpdatesFeed() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobsData();
  }, []);

  const fetchJobsData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/jobs?limit=18`);
      const data = await res.json();
      if (data.success && data.data) {
        setJobs(data.data.slice(0, 9));
        setAllJobs(data.data.slice(0, 12));
      }
    } catch (err) {
      console.error('Error loading live jobs feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return 'Sep 10, 2026';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <section id="updates" className="py-12 bg-white relative">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">


        {/* ==================================================== */}
        {/* LEADERBOARD AD BANNER 1 (Image 2) */}
        {/* ==================================================== */}
        <div className="w-full bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md border border-purple-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-400 text-slate-900 rounded-full flex items-center justify-center font-black text-xl shadow shrink-0">
              AG
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 tracking-wider uppercase">www.addressguru.in</div>
              <h4 className="text-base sm:text-xl font-extrabold tracking-tight">FREE Classified INDIA — POST FREE AD</h4>
              <p className="text-xs text-purple-200">Search Just One Click Away. Post your business, education & job ads free online.</p>
            </div>
          </div>
          <a
            href="https://www.addressguru.in"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-full uppercase tracking-wider transition shrink-0 shadow no-underline"
          >
            Post Free Ad
          </a>
        </div>


        {/* ==================================================== */}
        {/* SECTION 2: Latest Sarkaari Naukri (Govt. Jobs) 2026 (Image 2) */}
        {/* ==================================================== */}
        <div className="space-y-6 pt-2">

          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Latest Sarkaari Naukri (Govt. Jobs) 2026
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-3xl mx-auto">
              Get the Latest Sarkar Naukari updates with officially online application link and Recruitment Notice 2026, vacancy and eligibility criteria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allJobs.map((item) => {
              const mediaUrl = getImageUrl(item.featured_media);

              return (
                <article
                  key={item._id}
                  className="bg-white border-b border-slate-200 pb-3 flex items-start gap-3.5 group hover:bg-slate-50/60 p-2 rounded transition"
                >
                  <div className="w-28 sm:w-32 h-20 bg-slate-100 rounded border border-slate-200 overflow-hidden shrink-0 relative">
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

                  <div className="flex-1 min-w-0 flex flex-col justify-between h-20">
                    <a href={`/job/${item.slug || item._id}`}>
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h3>
                    </a>

                    <div className="text-[11px] text-slate-500 font-normal flex items-center justify-between mt-auto pt-1 border-t border-slate-100">
                      <span>📅 {formatShortDate(item.created_at || item.createdAt)}</span>
                      <span className="text-blue-600 font-medium">{item.categories?.[0]?.name || 'Jobs'}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

        </div>


        {/* ==================================================== */}
        {/* LEADERBOARD AD BANNER 2 (Image 3) */}
        {/* ==================================================== */}
        <div className="w-full bg-[#e7f9ee] border border-[#a3e6be] rounded border-dashed p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-600 text-white font-extrabold text-xs px-2.5 py-1 rounded">SPONSORED</span>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">BOOK A HELICOPTER IN GREECE</h4>
              <p className="text-xs text-slate-600">Luxury charters & private flight tours available online across Greek Islands.</p>
            </div>
          </div>
          <button className="bg-black hover:bg-zinc-800 text-white text-xs font-bold px-5 py-2 rounded transition uppercase shrink-0">
            Book Now
          </button>
        </div>


        {/* ==================================================== */}
        {/* SECTION 3: Subject Wise MCQ General Knowledge (Image 3) */}
        {/* ==================================================== */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">

          <div className="text-center space-y-1 mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Subject Wise MCQ General Knowledge
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Test your General Knowledge with our Subject wise MCQ GK Questions with answer
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 sm:gap-6">
            {SUBJECT_MCQS.map((sub) => (
              <a
                key={sub.name}
                href={sub.href}
                className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-slate-50 transition group border border-slate-100 hover:border-slate-200 hover:shadow-md no-underline"
              >
                <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform shadow-2xs">
                  {sub.icon}
                </div>
                <span className="text-xs font-semibold text-[#e11d48] group-hover:text-blue-600 transition">
                  {sub.name}
                </span>
              </a>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
