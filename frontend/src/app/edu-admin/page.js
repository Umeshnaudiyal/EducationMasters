'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Briefcase,
  FileText,
  CheckSquare,
  Users,
  Server,
  MessageSquare,
  Share2,
  Clock,
  ArrowRight,
  Building2,
  Tv
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const userRole = (session?.user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const options = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setCurrentTime(now.toLocaleString('en-US', options));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BACKEND_URL}/apis/v1/stats/dashboard`);
        const data = await res.json();
        if (data.success && data.data) {
          setStats(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = stats?.cards || {
    jobs: { total: 1096, change: '+7% from last week' },
    blogs: { total: 2905, change: '+0% from last week' },
    mcqs: { total: 11353, change: '+0% from last week' },
    users: { total: 5073, change: '+3% from last week' },
  };

  return (
    <div className="space-y-4 w-full">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            Hi, {session?.user?.name || session?.user?.nicename || 'Umeshnauriyal0007'}.
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Here's what's happening with your portal today.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-md text-slate-600 text-xs font-mono shadow-sm shrink-0">
          <Clock size={13} className="text-blue-600" />
          <span>{currentTime || 'Thu, 17 Sep, 2026 | 01:25:45 pm'}</span>
        </div>
      </div>

      {/* 4 Stat Overview Cards - Crisp White matching Screenshot #1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Job Posts Card */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm relative overflow-hidden flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Job Posts
            </span>
            <div className="text-2xl font-black text-cyan-600">
              {cards.jobs.total?.toLocaleString()}
            </div>
            <p className="text-[10px] font-medium text-emerald-600">
              {cards.jobs.change}
            </p>
          </div>
          <div className="w-11 h-11 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-md">
            <Briefcase size={20} />
          </div>
        </div>

        {/* Blog Posts Card */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm relative overflow-hidden flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Blog Posts
            </span>
            <div className="text-2xl font-black text-pink-500">
              {cards.blogs.total?.toLocaleString()}
            </div>
            <p className="text-[10px] font-medium text-slate-400">
              {cards.blogs.change}
            </p>
          </div>
          <div className="w-11 h-11 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-md">
            <FileText size={20} />
          </div>
        </div>

        {/* MCQ's Card */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm relative overflow-hidden flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              MCQ's
            </span>
            <div className="text-2xl font-black text-emerald-600">
              {cards.mcqs.total?.toLocaleString()}
            </div>
            <p className="text-[10px] font-medium text-slate-400">
              {cards.mcqs.change}
            </p>
          </div>
          <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
            <CheckSquare size={20} />
          </div>
        </div>

        {/* Total Users Card */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm relative overflow-hidden flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Users
            </span>
            <div className="text-2xl font-black text-amber-500">
              {cards.users.total?.toLocaleString()}
            </div>
            <p className="text-[10px] font-medium text-slate-400">
              {cards.users.change}
            </p>
          </div>
          <div className="w-11 h-11 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
            <Users size={20} />
          </div>
        </div>
      </div>

      {/* Main Grid: Posts Overview Chart + Right Status Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left Column (8 cols): Posts Overview Dual-Curve Chart */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Posts Overview</h2>
              <p className="text-[11px] text-slate-400">Weekly job recruitments & article publish activity</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1 text-cyan-600">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                <span>Job Posts</span>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Blog Posts</span>
              </div>
            </div>
          </div>

          {/* Interactive Dual-Curve SVG Graph */}
          <div className="w-full h-56 relative select-none">
            <svg viewBox="0 0 700 220" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="cyanGradLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="amberGradLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="20" x2="680" y2="20" stroke="#E2E8F0" strokeDasharray="3 3" />
              <line x1="40" y1="65" x2="680" y2="65" stroke="#E2E8F0" strokeDasharray="3 3" />
              <line x1="40" y1="110" x2="680" y2="110" stroke="#E2E8F0" strokeDasharray="3 3" />
              <line x1="40" y1="155" x2="680" y2="155" stroke="#E2E8F0" strokeDasharray="3 3" />
              <line x1="40" y1="190" x2="680" y2="190" stroke="#CBD5E1" />

              {/* Y-axis Labels */}
              <text x="25" y="24" fill="#94A3B8" fontSize="10" textAnchor="end">30</text>
              <text x="25" y="69" fill="#94A3B8" fontSize="10" textAnchor="end">25</text>
              <text x="25" y="114" fill="#94A3B8" fontSize="10" textAnchor="end">20</text>
              <text x="25" y="159" fill="#94A3B8" fontSize="10" textAnchor="end">10</text>
              <text x="25" y="194" fill="#94A3B8" fontSize="10" textAnchor="end">0</text>

              {/* Jobs Curve Fill & Path */}
              <path
                d="M 60,180 C 120,30 180,30 240,95 C 300,140 360,60 420,80 C 480,160 540,140 600,115 C 640,105 660,95 680,100 L 680,190 L 60,190 Z"
                fill="url(#cyanGradLight)"
              />
              <path
                d="M 60,180 C 120,30 180,30 240,95 C 300,140 360,60 420,80 C 480,160 540,140 600,115 C 640,105 660,95 680,100"
                fill="none"
                stroke="#06B6D4"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Blogs Curve Fill & Path */}
              <path
                d="M 60,185 C 120,95 180,75 240,105 C 300,125 360,135 420,115 C 480,95 540,135 600,150 C 640,160 660,165 680,160 L 680,190 L 60,190 Z"
                fill="url(#amberGradLight)"
              />
              <path
                d="M 60,185 C 120,95 180,75 240,105 C 300,125 360,135 420,115 C 480,95 540,135 600,150 C 640,160 660,165 680,160"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* X-axis Day Labels */}
              <text x="60" y="208" fill="#94A3B8" fontSize="11" textAnchor="middle">Mo</text>
              <text x="160" y="208" fill="#94A3B8" fontSize="11" textAnchor="middle">Tu</text>
              <text x="260" y="208" fill="#94A3B8" fontSize="11" textAnchor="middle">We</text>
              <text x="360" y="208" fill="#94A3B8" fontSize="11" textAnchor="middle">Th</text>
              <text x="460" y="208" fill="#94A3B8" fontSize="11" textAnchor="middle">Fr</text>
              <text x="560" y="208" fill="#94A3B8" fontSize="11" textAnchor="middle">Sa</text>
              <text x="660" y="208" fill="#94A3B8" fontSize="11" textAnchor="middle">Su</text>
            </svg>
          </div>
        </div>

        {/* Right Column (4 cols): System Widgets */}
        <div className="lg:col-span-4 space-y-3">
          {/* Version Info */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                System Framework
              </span>
              <div className="text-lg font-bold text-slate-800 mt-0.5">9.52.21</div>
              <p className="text-[10px] text-slate-400">Node v22 & Next.js 16</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow">
              <Tv size={20} />
            </div>
          </div>

          {/* Comments Widget */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Comments
              </span>
              <div className="text-lg font-bold text-slate-800 mt-0.5">00.00</div>
              <p className="text-[10px] text-slate-400">0.0% from last week</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow">
              <MessageSquare size={20} />
            </div>
          </div>

          {/* Total Shares Widget */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Shares
              </span>
              <div className="text-lg font-bold text-slate-800 mt-0.5">00.00</div>
              <p className="text-[10px] text-slate-400">0.0% from last week</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow">
              <Share2 size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
        {isAdmin ? (
          <Link
            href="/edu-admin/users"
            className="bg-white border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  Manage Roles & Users
                </h3>
                <p className="text-[11px] text-slate-400">5,000+ portal users, authors & institutes</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </Link>
        ) : (
          <Link
            href="/edu-admin/profile"
            className="bg-white border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  My Profile
                </h3>
                <p className="text-[11px] text-slate-400">View & update your author profile and credentials</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </Link>
        )}

        <Link
          href="/edu-admin/institutes"
          className="bg-white border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between hover:border-cyan-500 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 group-hover:text-cyan-600 transition-colors">
                Institutes & CRM Plans
              </h3>
              <p className="text-[11px] text-slate-400">Configure 898 institutes and subscription validity</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/edu-admin/posts/create?type=article"
          className="bg-white border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between hover:border-purple-500 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                Publish New Article
              </h3>
              <p className="text-[11px] text-slate-400">Create blog with complete SEO metadata tags</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Footer Branding */}
      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-1">
        <p>EMP, © 2026 Education Masters | AdxVenture</p>
        <p className="text-slate-400">by Robin Tomar</p>
      </div>
    </div>
  );
}
