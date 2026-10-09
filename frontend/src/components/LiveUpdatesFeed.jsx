'use client';

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import Link from 'next/link';
import { Briefcase, Award, BarChart3, ArrowUpRight } from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import { API_BASE } from '@/utils/api';

const SUBJECT_MCQS = [
  { name: 'Maths', prefix: 'Math', accent: 's', image: '/maths.png', href: '/mathematics/mcq-questions' },
  { name: 'History', prefix: 'Histor', accent: 'y', image: '/history.png', href: '/history/mcq-questions' },
  { name: 'Agriculture', prefix: 'Agri', accent: 'culture', image: '/agriculture.png', href: '/agriculture/mcq-questions' },
  { name: 'English', prefix: 'Engl', accent: 'ish', image: '/english.png', href: '/english/mcq-questions' },
  { name: 'Economics', prefix: 'Economi', accent: 'cs', image: '/economics.png', href: '/economics/mcq-questions' },
  { name: 'Geography', prefix: 'Geogra', accent: 'phy', image: '/geography.png', href: '/geography/mcq-questions' },
  { name: 'G.K.', prefix: 'G.', accent: 'K.', image: '/gk.png', href: '/general-knowledge/mcq-questions' },
  { name: 'Computer', prefix: 'Compu', accent: 'ter', image: '/computer.png', href: '/computer/mcq-questions' },
  { name: 'Science', prefix: 'Sci', accent: 'ence', image: '/science.png', href: '/science/mcq-questions' },
  { name: 'Politics', prefix: 'Poli', accent: 'tics', image: '/politics.png', href: '/polity/mcq-questions' },
  { name: 'Sociology', prefix: 'Sociolo', accent: 'gy', image: '/sociology.png', href: '/sociology/mcq-questions' },
  { name: 'Humanities', prefix: 'Humani', accent: 'ties', image: '/humanities.png', href: '/humanities/mcq-questions' },
  { name: 'Reasoning', prefix: 'Reason', accent: 'ing', image: '/reasoning.png', href: '/reasoning/mcq-questions' },
  { name: 'Hindi', prefix: 'Hin', accent: 'di', image: '/hindi.png', href: '/hindi/mcq-questions' },
  { name: 'Philosophy', prefix: 'Philoso', accent: 'phy', image: '/philosophy.png', href: '/philosophy/mcq-questions' },
  { name: 'Current Affair', prefix: 'Current ', accent: 'Affair', image: '/ca.png', href: '/current-affairs/mcq-questions' },
];

export default function LiveUpdatesFeed() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const feedRef = useRef(null);

  useEffect(() => {
    fetchJobsData();
  }, []);

  useEffect(() => {
    if (!loading && allJobs.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              gsap.fromTo(
                '.job-feed-item',
                { y: 25, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  stagger: 0.05,
                  duration: 0.45,
                  ease: 'power3.out',
                  clearProps: 'transform,opacity',
                }
              );
              observer.disconnect();
            }
          });
        },
        { threshold: 0.1 }
      );

      if (feedRef.current) {
        observer.observe(feedRef.current);
      }

      return () => observer.disconnect();
    }
  }, [loading, allJobs]);

  useEffect(() => {
    // Observer for Subject MCQs
    const mcqObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.fromTo(
              '.mcq-item-card',
              { y: 30, opacity: 0, scale: 0.92 },
              {
                y: 0,
                opacity: 1,
                scale: 1,
                stagger: 0.03,
                duration: 0.45,
                ease: 'back.out(1.3)',
                clearProps: 'transform,opacity',
              }
            );
            mcqObserver.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    const mcqContainer = document.querySelector('#subject-mcqs-container');
    if (mcqContainer) {
      mcqObserver.observe(mcqContainer);
    }

    return () => mcqObserver.disconnect();
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
    <section ref={feedRef} id="updates" className="pt-8 pb-4 bg-white relative">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* ==================================================== */}
        {/* LEADERBOARD AD BANNER 1 */}
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
        {/* SECTION 2: Latest Sarkaari Naukri (Govt. Jobs) 2026 */}
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
                  className="job-feed-item bg-white border-b border-slate-200 pb-3 flex items-start gap-3.5 group hover:bg-slate-50/80 p-2.5 rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
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
                    <Link href={`/job/${item.slug || item._id}`}>
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h3>
                    </Link>

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
        {/* LEADERBOARD AD BANNER 2 */}
        {/* ==================================================== */}
        <div className="w-full bg-[#e7f9ee] border border-[#a3e6be] rounded-xl border-dashed p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <span className="bg-emerald-600 text-white font-extrabold text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded shrink-0">SPONSORED</span>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-base">BOOK A HELICOPTER IN GREECE</h4>
              <p className="text-[11px] sm:text-xs text-slate-600">Luxury charters & private flight tours available online across Greek Islands.</p>
            </div>
          </div>
          <button className="bg-black hover:bg-zinc-800 text-white text-xs font-bold px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg transition uppercase shrink-0 cursor-pointer">
            Book Now
          </button>
        </div>

        {/* ==================================================== */}
        {/* SECTION 3: Subject Wise MCQ General Knowledge */}
        {/* ==================================================== */}
        <div id="subject-mcqs-container" className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">

          <div className="text-center space-y-1.5 mb-8">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1a4a75] tracking-tight">
              Subject Wise MCQ General Knowledge
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Test your General Knowledge with our Subject wise MCQ GK Questions with answer
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
            {SUBJECT_MCQS.map((sub) => (
              <Link
                key={sub.name}
                href={sub.href}
                className="mcq-item-card bg-white border border-slate-200/80 hover:border-blue-400 rounded-xl p-3 sm:p-3.5 flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-105 group no-underline"
              >
                {/* Circular image avatar */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden flex items-center justify-center bg-slate-50 border border-slate-200/70 shadow-2xs mb-2.5 group-hover:scale-110 transition-transform duration-300">
                  <img
                    src={sub.image}
                    alt={sub.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <span className="text-xs sm:text-[13px] font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors leading-snug">
                  {sub.prefix}
                  <span className="text-[#e11d48]">{sub.accent}</span>
                </span>
              </Link>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
