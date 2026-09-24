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
  Tv,
  Sparkles,
  Zap,
  RefreshCw,
  Award,
  TrendingUp,
  Plus,
  ExternalLink,
  Layers,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  Trash2,
  HelpCircle,
  BarChart3,
  PieChart,
  Database,
  Cpu,
  GraduationCap,
  Bell,
  Eye,
  Edit,
  ArrowUpRight,
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

// Default multi-timeframe activity data (7D, 30D, 1Y)
const DEFAULT_CHART_ACTIVITY = {
  '7d': {
    timeframe: '7d',
    title: 'Weekly job recruitments, editorial blogs & admit card releases',
    maxY: 30,
    yLabels: [30, 20, 10, 0],
    data: [
      { label: 'Mon', jobs: 12, blogs: 8, admitCards: 4 },
      { label: 'Tue', jobs: 28, blogs: 19, admitCards: 9 },
      { label: 'Wed', jobs: 16, blogs: 12, admitCards: 6 },
      { label: 'Thu', jobs: 23, blogs: 14, admitCards: 11 },
      { label: 'Fri', jobs: 18, blogs: 17, admitCards: 7 },
      { label: 'Sat', jobs: 13, blogs: 9, admitCards: 5 },
      { label: 'Sun', jobs: 15, blogs: 7, admitCards: 8 },
    ],
    metrics: [
      { title: 'Recruitment Peak', value: 'Tuesday (28 Posts)', color: 'text-cyan-700' },
      { title: 'Article Velocity', value: '19 Guides Published', color: 'text-pink-600' },
      { title: 'Weekly Throughput', value: '127 Total Items', color: 'text-purple-700' },
    ],
  },
  '30d': {
    timeframe: '30d',
    title: 'Monthly publishing distribution across 4-week cadence',
    maxY: 120,
    yLabels: [120, 80, 40, 0],
    data: [
      { label: 'Week 1', jobs: 74, blogs: 48, admitCards: 22 },
      { label: 'Week 2', jobs: 92, blogs: 65, admitCards: 38 },
      { label: 'Week 3', jobs: 114, blogs: 79, admitCards: 46 },
      { label: 'Week 4', jobs: 88, blogs: 58, admitCards: 31 },
      { label: 'Current', jobs: 104, blogs: 72, admitCards: 41 },
    ],
    metrics: [
      { title: '30-Day Peak Volume', value: 'Week 3 (114 Jobs)', color: 'text-cyan-700' },
      { title: 'Monthly Articles', value: '322 Guides Published', color: 'text-pink-600' },
      { title: '30-Day Throughput', value: '709 Total Items', color: 'text-purple-700' },
    ],
  },
  '1y': {
    timeframe: '1y',
    title: 'Annual recruitment cycles, exam season surges & editorial volume',
    maxY: 500,
    yLabels: [500, 350, 150, 0],
    data: [
      { label: 'Jan', jobs: 220, blogs: 140, admitCards: 65 },
      { label: 'Mar', jobs: 310, blogs: 210, admitCards: 110 },
      { label: 'May', jobs: 280, blogs: 195, admitCards: 95 },
      { label: 'Jul', jobs: 390, blogs: 260, admitCards: 150 },
      { label: 'Sep', jobs: 430, blogs: 290, admitCards: 185 },
      { label: 'Nov', jobs: 340, blogs: 240, admitCards: 130 },
      { label: 'Dec', jobs: 370, blogs: 275, admitCards: 145 },
    ],
    metrics: [
      { title: 'Annual Recruitment Peak', value: 'September (430 Jobs)', color: 'text-cyan-700' },
      { title: 'Annual Articles', value: '1,610 Guides Published', color: 'text-pink-600' },
      { title: 'Annual Throughput', value: '3,890 Total Items', color: 'text-purple-700' },
    ],
  },
};

// Smooth cubic Catmull-Rom / Bezier spline generator for SVG
function getSplinePath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  let path = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 >= points.length ? points.length - 1 : i + 2];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return path;
}

// Smooth area generator for SVG gradients
function getAreaPath(points, bottomY = 160) {
  if (!points || points.length === 0) return '';
  const linePath = getSplinePath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${last.x.toFixed(1)},${bottomY} L ${first.x.toFixed(1)},${bottomY} Z`;
}

// Vector Donut Slice SVG Path Generator
function getDonutSlicePath(cx, cy, rInner, rOuter, startAngle, endAngle) {
  if (endAngle <= startAngle) return '';
  const rad = Math.PI / 180;
  const startRad = (startAngle - 90) * rad;
  const endRad = (endAngle - 90) * rad;

  const x1Outer = cx + rOuter * Math.cos(startRad);
  const y1Outer = cy + rOuter * Math.sin(startRad);
  const x2Outer = cx + rOuter * Math.cos(endRad);
  const y2Outer = cy + rOuter * Math.sin(endRad);

  const x1Inner = cx + rInner * Math.cos(endRad);
  const y1Inner = cy + rInner * Math.sin(endRad);
  const x2Inner = cx + rInner * Math.cos(startRad);
  const y2Inner = cy + rInner * Math.sin(startRad);

  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${x1Outer.toFixed(2)} ${y1Outer.toFixed(2)} A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${x2Outer.toFixed(2)} ${y2Outer.toFixed(2)} L ${x1Inner.toFixed(2)} ${y1Inner.toFixed(2)} A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${x2Inner.toFixed(2)} ${y2Inner.toFixed(2)} Z`;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const userRole = (session?.user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all | jobs | blogs | admit-cards | results
  const [chartTimeframe, setChartTimeframe] = useState('7d'); // 7d | 30d | 1y
  const [hoveredPointIdx, setHoveredPointIdx] = useState(null);
  const [hoveredPieIndex, setHoveredPieIndex] = useState(null);
  const [cacheClearSuccess, setCacheClearSuccess] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  // Live Digital Clock
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

  // Fetch Dashboard Stats
  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`${BACKEND_URL}/apis/v1/stats/dashboard?t=${Date.now()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Quick In-Memory Cache Clear
  const handleClearCache = async () => {
    try {
      setIsClearingCache(true);
      const res = await fetch(`${BACKEND_URL}/apis/v1/stats/cache/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.user?.accessToken ? { Authorization: `Bearer ${session.user.accessToken}` } : {}),
        },
      });
      const data = await res.json();
      if (data.success) {
        setCacheClearSuccess(true);
        setTimeout(() => setCacheClearSuccess(false), 3500);
        fetchStats(true);
      }
    } catch (e) {
      console.error('Error clearing cache:', e);
    } finally {
      setIsClearingCache(false);
    }
  };

  const cards = stats?.cards || {
    jobs: { total: 1170, change: '+7% this week' },
    blogs: { total: 3011, change: '+12 this month' },
    mcqs: { total: 11359, change: '18 Subjects' },
    admitCards: { total: 540, change: 'Live Alerts' },
    results: { total: 490, change: 'Declared' },
    users: { total: 5075, change: '+3% this week' },
    institutes: { total: 898, change: 'Enrolled' },
    media: { total: 12243, change: 'Optimized' },
  };

  // Pie / Donut Chart Data Calculation
  const pieCategories = [
    {
      id: 'mcqs',
      label: 'MCQ Bank',
      value: cards.mcqs?.total || 11359,
      color: '#10B981', // Emerald
      hoverColor: '#059669',
      gradId: 'emeraldDonutGrad',
      gradFrom: '#34D399',
      gradTo: '#059669',
      href: '/edu-admin/questions',
      icon: CheckSquare,
    },
    {
      id: 'blogs',
      label: 'Articles',
      value: cards.blogs?.total || 3011,
      color: '#EC4899', // Pink
      hoverColor: '#DB2777',
      gradId: 'pinkDonutGrad',
      gradFrom: '#F472B6',
      gradTo: '#DB2777',
      href: '/edu-admin/blogs',
      icon: FileText,
    },
    {
      id: 'jobs',
      label: 'Govt. Jobs',
      value: cards.jobs?.total || 1170,
      color: '#06B6D4', // Cyan
      hoverColor: '#0891B2',
      gradId: 'cyanDonutGrad',
      gradFrom: '#22D3EE',
      gradTo: '#0891B2',
      href: '/edu-admin/jobs',
      icon: Briefcase,
    },
    {
      id: 'institutes',
      label: 'Institutes',
      value: cards.institutes?.total || 898,
      color: '#F59E0B', // Amber
      hoverColor: '#D97706',
      gradId: 'amberDonutGrad',
      gradFrom: '#FBBF24',
      gradTo: '#D97706',
      href: '/edu-admin/institutes',
      icon: Building2,
    },
    {
      id: 'admitCards',
      label: 'Admit Cards',
      value: cards.admitCards?.total || 540,
      color: '#A855F7', // Purple
      hoverColor: '#9333EA',
      gradId: 'purpleDonutGrad',
      gradFrom: '#C084FC',
      gradTo: '#9333EA',
      href: '/edu-admin/admit-cards',
      icon: Award,
    },
    {
      id: 'results',
      label: 'Exam Results',
      value: cards.results?.total || 490,
      color: '#3B82F6', // Blue
      hoverColor: '#2563EB',
      gradId: 'blueDonutGrad',
      gradFrom: '#60A5FA',
      gradTo: '#2563EB',
      href: '/edu-admin/results',
      icon: CheckCircle2,
    },
  ];

  const totalPieValue = pieCategories.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

  let curAngle = 0;
  const pieSlices = pieCategories.map((item) => {
    const fraction = totalPieValue > 0 ? item.value / totalPieValue : 0;
    const angleSpan = fraction * 360;
    const gap = angleSpan > 3 ? 1.5 : 0;
    const startAngle = curAngle + gap / 2;
    const endAngle = curAngle + angleSpan - gap / 2;
    curAngle += angleSpan;

    const percentage = (fraction * 100).toFixed(1);

    return {
      ...item,
      startAngle,
      endAngle,
      percentage,
      fraction,
    };
  });

  const recentJobs = stats?.recentJobs || [];
  const recentBlogs = stats?.recentBlogs || [];
  const recentAdmitCards = stats?.recentAdmitCards || [];
  const recentResults = stats?.recentResults || [];

  // Filtered unified recent posts
  const getUnifiedPosts = () => {
    const list = [];
    if (activeTab === 'all' || activeTab === 'jobs') {
      recentJobs.forEach((j) =>
        list.push({
          id: j._id,
          title: j.title,
          slug: j.slug,
          type: 'Job',
          typeBadge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          category: j.dept || j.state?.name || 'Recruitment',
          date: j.created_at || 'Recent',
          editUrl: `/edu-admin/jobs`,
          liveUrl: `/job/${j.slug}`,
          status: j.status || 'publish',
        })
      );
    }
    if (activeTab === 'all' || activeTab === 'blogs') {
      recentBlogs.forEach((b) =>
        list.push({
          id: b._id,
          title: b.title,
          slug: b.slug,
          type: 'Article',
          typeBadge: 'bg-pink-50 text-pink-700 border-pink-200',
          category: b.categories?.[0]?.name || 'Editorial',
          date: b.created_at || 'Recent',
          editUrl: `/edu-admin/blogs`,
          liveUrl: `/${b.slug}`,
          status: b.status || 'publish',
        })
      );
    }
    if (activeTab === 'all' || activeTab === 'admit-cards') {
      recentAdmitCards.forEach((a) =>
        list.push({
          id: a._id,
          title: a.title,
          slug: a.slug,
          type: 'Admit Card',
          typeBadge: 'bg-purple-50 text-purple-700 border-purple-200',
          category: a.exam_date ? `Exam: ${a.exam_date}` : 'Hall Ticket',
          date: a.created_at || 'Recent',
          editUrl: `/edu-admin/admit-cards`,
          liveUrl: `/admit-card/${a.slug}`,
          status: a.status || 'publish',
        })
      );
    }
    if (activeTab === 'all' || activeTab === 'results') {
      recentResults.forEach((r) =>
        list.push({
          id: r._id,
          title: r.title,
          slug: r.slug,
          type: 'Result',
          typeBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          category: r.result_date ? `Declared: ${r.result_date}` : 'Scorecard',
          date: r.created_at || 'Recent',
          editUrl: `/edu-admin/results`,
          liveUrl: `/result/${r.slug}`,
          status: r.status || 'publish',
        })
      );
    }
    return list.slice(0, 7);
  };

  const unifiedPosts = getUnifiedPosts();

  // Active chart activity configuration (7d, 30d, 1y)
  const activeActivity =
    stats?.chartActivity?.[chartTimeframe] ||
    DEFAULT_CHART_ACTIVITY[chartTimeframe] ||
    DEFAULT_CHART_ACTIVITY['7d'];

  const chartDataPoints = activeActivity.data || [];
  const chartMaxY = activeActivity.maxY || 30;
  const numPoints = chartDataPoints.length;

  const jobPoints = chartDataPoints.map((d, i) => ({
    x: 55 + (i / Math.max(1, numPoints - 1)) * 620,
    y: Math.max(20, Math.min(158, 160 - (d.jobs / chartMaxY) * 135)),
    val: d.jobs,
    label: d.label,
  }));

  const blogPoints = chartDataPoints.map((d, i) => ({
    x: 55 + (i / Math.max(1, numPoints - 1)) * 620,
    y: Math.max(20, Math.min(158, 160 - (d.blogs / chartMaxY) * 135)),
    val: d.blogs,
    label: d.label,
  }));

  const admitPoints = chartDataPoints.map((d, i) => ({
    x: 55 + (i / Math.max(1, numPoints - 1)) * 620,
    y: Math.max(20, Math.min(158, 160 - (d.admitCards / chartMaxY) * 135)),
    val: d.admitCards,
    label: d.label,
  }));

  const hoveredItem = hoveredPointIdx !== null ? chartDataPoints[hoveredPointIdx] : null;
  const hoveredJobPt = hoveredPointIdx !== null ? jobPoints[hoveredPointIdx] : null;
  const hoveredBlogPt = hoveredPointIdx !== null ? blogPoints[hoveredPointIdx] : null;
  const hoveredAdmitPt = hoveredPointIdx !== null ? admitPoints[hoveredPointIdx] : null;

  return (
    <div className="space-y-4 w-full font-sans text-slate-800 antialiased pb-6">

      {/* Embedded Global Keyframes for Ultra-Smooth Table & Chart Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dashboardRowIn {
          0% {
            opacity: 0;
            transform: translateX(-24px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes pieSweepIn {
          0% {
            opacity: 0;
            transform: translateX(-28px) rotate(-35deg) scale(0.92);
          }
          100% {
            opacity: 1;
            transform: translateX(0) rotate(0deg) scale(1);
          }
        }
        @keyframes pieLegendIn {
          0% {
            opacity: 0;
            transform: translateX(-20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes chartDrawLine {
          0% {
            stroke-dashoffset: 1000;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes wipeLeftToRight {
          0% {
            clip-path: inset(0 100% 0 0);
          }
          100% {
            clip-path: inset(0 0% 0 0);
          }
        }
        @keyframes laserScan {
          0% {
            transform: translateX(35px);
            opacity: 0;
          }
          10% {
            opacity: 0.85;
          }
          85% {
            opacity: 0.85;
          }
          100% {
            transform: translateX(685px);
            opacity: 0;
          }
        }
        @keyframes metricBadgeIn {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes beaconPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
      `}} />

      {/* 1. TOP HEADER & METRIC ACTION BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1e3a8a] to-[#2563eb] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
            {(session?.user?.name || session?.user?.nicename || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                Welcome back, {session?.user?.name || session?.user?.nicename || 'Administrator'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                {userRole === 'superadmin' ? 'Super Admin' : userRole === 'admin' ? 'Admin' : 'Staff'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Portal Online</span>
              </span>
              <span>•</span>
              <span>In-Memory RAM Cache Active (0.05ms)</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Clock */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Cache Status Badge / Clear Button */}
          <button
            type="button"
            onClick={handleClearCache}
            disabled={isClearingCache}
            title="Purge in-memory API cache"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            <Zap size={13} className={isClearingCache ? 'animate-spin text-amber-500' : 'text-amber-500'} />
            <span>{isClearingCache ? 'Purging...' : 'Purge Cache'}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'} />
            <span>Refresh</span>
          </button>

          {/* Quick Create Dropdown / Buttons */}
          <Link
            href="/edu-admin/jobs"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-bold transition shadow-xs"
          >
            <Plus size={13} />
            <span>Post Job</span>
          </Link>

          {/* Clock Pill */}
          <div className="hidden xl:flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 text-xs font-mono font-medium shadow-2xs">
            <Clock size={13} className="text-blue-600 shrink-0" />
            <span>{currentTime || 'Syncing...'}</span>
          </div>
        </div>
      </div>

      {/* Cache Cleared Notification Toast */}
      {cacheClearSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span className="font-semibold">In-Memory Cache Successfully Purged!</span>
            <span className="text-emerald-700">All live GET endpoints re-synchronized with MongoDB.</span>
          </div>
        </div>
      )}

      {/* 2. HIGH-DENSITY 6-KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Card 1: Govt Jobs */}
        <Link
          href="/edu-admin/jobs"
          className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:shadow-md hover:border-cyan-400 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Govt. Jobs</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Briefcase size={14} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 tracking-tight">{cards.jobs.total?.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold text-emerald-600">
              <TrendingUp size={11} />
              <span>{cards.jobs.change}</span>
            </div>
          </div>
        </Link>

        {/* Card 2: Blog Posts */}
        <Link
          href="/edu-admin/blogs"
          className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:shadow-md hover:border-pink-400 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Articles</span>
            <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText size={14} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 tracking-tight">{cards.blogs.total?.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold text-pink-600">
              <span>{cards.blogs.change}</span>
            </div>
          </div>
        </Link>

        {/* Card 3: MCQ Question Bank */}
        <Link
          href="/edu-admin/questions"
          className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">MCQ Bank</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckSquare size={14} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 tracking-tight">{cards.mcqs.total?.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold text-emerald-600">
              <span>18 Subject Taxonomies</span>
            </div>
          </div>
        </Link>

        {/* Card 4: Admit Cards & Results */}
        <Link
          href="/edu-admin/admit-cards"
          className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:shadow-md hover:border-purple-400 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Admit Cards</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award size={14} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 tracking-tight">{cards.admitCards.total?.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold text-purple-600">
              <span>Results: {cards.results.total?.toLocaleString()}</span>
            </div>
          </div>
        </Link>

        {/* Card 5: Total Users */}
        <Link
          href="/edu-admin/users"
          className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Portal Users</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={14} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 tracking-tight">{cards.users.total?.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold text-amber-600">
              <span>Active Sessions Tracked</span>
            </div>
          </div>
        </Link>

        {/* Card 6: RAM Cache Hit Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cache Rate</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap size={14} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-blue-600 tracking-tight">
              {stats?.cacheStats?.hitRate || '99.4%'}
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold text-slate-500 font-mono">
              <span>Avg Latency &lt; 1ms</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. ROW 1: ANALYTICS ROW - Publishing Activity Chart (8 cols) & Content Breakdown Pie Chart (4 cols) in the SAME ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">

        {/* ── LEFT: Publishing Activity Dynamic Multi-Curve Chart (8 cols) ── */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 size={15} className="text-blue-600" />
                    <span>Publishing &amp; Recruitment Activity</span>
                  </h2>
                  <p className="text-[11px] text-slate-500">{activeActivity.title}</p>
                </div>

                {/* Chart Legend & Filter */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <span className="flex items-center gap-1 text-cyan-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                      <span>Jobs</span>
                    </span>
                    <span className="flex items-center gap-1 text-pink-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                      <span>Blogs</span>
                    </span>
                    <span className="flex items-center gap-1 text-purple-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      <span>Admit Cards</span>
                    </span>
                  </div>

                  {/* 7D / 30D / 1Y Timeframe Toggles with Smooth Transitions */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold text-slate-600 border border-slate-200/50 shadow-2xs">
                    {['7d', '30d', '1y'].map((tf) => {
                      const isActive = chartTimeframe === tf;
                      return (
                        <button
                          key={tf}
                          type="button"
                          onClick={() => {
                            setChartTimeframe(tf);
                            setHoveredPointIdx(null);
                          }}
                          className={`px-3 py-1 rounded-md transition-all duration-200 cursor-pointer uppercase font-extrabold ${
                            isActive
                              ? 'bg-white text-blue-600 shadow-2xs ring-1 ring-slate-200 scale-[1.03]'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                          }`}
                        >
                          {tf}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SVG Interactive Chart Container */}
              <div className="w-full h-44 sm:h-52 relative select-none pt-2">
                {/* Floating Hover Tooltip */}
                {hoveredItem && hoveredJobPt && (
                  <div
                    style={{
                      left: `${Math.max(10, Math.min(90, (hoveredJobPt.x / 700) * 100))}%`,
                      top: '8px',
                      transform: 'translateX(-50%)',
                    }}
                    className="absolute pointer-events-none z-20 bg-slate-900/95 text-white backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xl border border-slate-700 text-[11px] whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1 flex items-center justify-between gap-3">
                      <span>{hoveredItem.label}</span>
                      <span className="text-[10px] text-blue-400 font-extrabold uppercase">
                        {chartTimeframe.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span>Jobs: <strong>{hoveredItem.jobs}</strong></span>
                      </span>
                      <span className="flex items-center gap-1 text-pink-300">
                        <span className="w-2 h-2 rounded-full bg-pink-400" />
                        <span>Blogs: <strong>{hoveredItem.blogs}</strong></span>
                      </span>
                      <span className="flex items-center gap-1 text-purple-300">
                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                        <span>Admit: <strong>{hoveredItem.admitCards}</strong></span>
                      </span>
                    </div>
                  </div>
                )}

                <svg key={`svg-chart-${chartTimeframe}`} viewBox="0 0 700 185" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.01" />
                    </linearGradient>
                    <linearGradient id="pinkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EC4899" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#EC4899" stopOpacity="0.01" />
                    </linearGradient>
                    <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A855F7" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#A855F7" stopOpacity="0.01" />
                    </linearGradient>

                    {/* Left-to-Right SVG ClipPath Reveal */}
                    <clipPath id={`chartWipeClip-${chartTimeframe}`}>
                      <rect x="0" y="0" width="700" height="185">
                        <animate
                          attributeName="width"
                          from="0"
                          to="700"
                          dur="0.95s"
                          fill="freeze"
                          calcMode="spline"
                          keySplines="0.16 1 0.3 1"
                          keyTimes="0; 1"
                        />
                      </rect>
                    </clipPath>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="35" y1="20" x2="685" y2="20" stroke="#F1F5F9" strokeDasharray="3 3" />
                  <line x1="35" y1="60" x2="685" y2="60" stroke="#F1F5F9" strokeDasharray="3 3" />
                  <line x1="35" y1="100" x2="685" y2="100" stroke="#F1F5F9" strokeDasharray="3 3" />
                  <line x1="35" y1="140" x2="685" y2="140" stroke="#F1F5F9" strokeDasharray="3 3" />
                  <line x1="35" y1="160" x2="685" y2="160" stroke="#CBD5E1" strokeWidth="1" />

                  {/* Y-axis Labels (Dynamic for 7D / 30D / 1Y) */}
                  <text x="25" y="24" fill="#94A3B8" fontSize="9" textAnchor="end" fontFamily="sans-serif">
                    {activeActivity.yLabels?.[0] || chartMaxY}
                  </text>
                  <text x="25" y="64" fill="#94A3B8" fontSize="9" textAnchor="end" fontFamily="sans-serif">
                    {activeActivity.yLabels?.[1] || Math.round(chartMaxY * 0.66)}
                  </text>
                  <text x="25" y="104" fill="#94A3B8" fontSize="9" textAnchor="end" fontFamily="sans-serif">
                    {activeActivity.yLabels?.[2] || Math.round(chartMaxY * 0.33)}
                  </text>
                  <text x="25" y="163" fill="#94A3B8" fontSize="9" textAnchor="end" fontFamily="sans-serif">
                    {activeActivity.yLabels?.[3] ?? 0}
                  </text>

                  {/* Left-to-Right Animated Curves Group */}
                  <g
                    clipPath={`url(#chartWipeClip-${chartTimeframe})`}
                    style={{
                      animation: 'wipeLeftToRight 0.95s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    }}
                  >
                    {/* 1. Cyan Curve (Jobs) with Left-to-Right Drawing */}
                    <path
                      d={getAreaPath(jobPoints, 160)}
                      fill="url(#cyanGrad)"
                    />
                    <path
                      d={getSplinePath(jobPoints)}
                      fill="none"
                      stroke="#06B6D4"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength="1000"
                      style={{
                        strokeDasharray: 1000,
                        strokeDashoffset: 1000,
                        animation: 'chartDrawLine 0.95s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                      }}
                    />

                    {/* 2. Pink Curve (Blogs) with Left-to-Right Drawing */}
                    <path
                      d={getAreaPath(blogPoints, 160)}
                      fill="url(#pinkGrad)"
                    />
                    <path
                      d={getSplinePath(blogPoints)}
                      fill="none"
                      stroke="#EC4899"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength="1000"
                      style={{
                        strokeDasharray: 1000,
                        strokeDashoffset: 1000,
                        animation: 'chartDrawLine 1.05s cubic-bezier(0.16, 1, 0.3, 1) 0.05s forwards',
                      }}
                    />

                    {/* 3. Purple Curve (Admit Cards) with Left-to-Right Drawing */}
                    <path
                      d={getAreaPath(admitPoints, 160)}
                      fill="url(#purpleGrad)"
                    />
                    <path
                      d={getSplinePath(admitPoints)}
                      fill="none"
                      stroke="#A855F7"
                      strokeWidth="1.8"
                      strokeDasharray="4 2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength="1000"
                      style={{
                        strokeDasharray: 1000,
                        strokeDashoffset: 1000,
                        animation: 'chartDrawLine 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards',
                      }}
                    />
                  </g>

                  {/* Left-to-Right Laser Scan Light Line */}
                  <line
                    key={`laser-${chartTimeframe}`}
                    x1="0"
                    y1="18"
                    x2="0"
                    y2="160"
                    stroke="#06B6D4"
                    strokeWidth="2"
                    style={{
                      animation: 'laserScan 0.95s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    }}
                  />

                  {/* Glowing Beacon Dots on the Latest Data Points */}
                  {jobPoints.length > 0 && (
                    <g
                      key={`beacons-${chartTimeframe}`}
                      style={{
                        animation: 'dashboardRowIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.85s forwards',
                        opacity: 0,
                      }}
                    >
                      {/* Jobs Beacon */}
                      <circle
                        cx={jobPoints[jobPoints.length - 1].x}
                        cy={jobPoints[jobPoints.length - 1].y}
                        r={6}
                        fill="#06B6D4"
                        className="animate-ping"
                        style={{
                          transformOrigin: `${jobPoints[jobPoints.length - 1].x}px ${jobPoints[jobPoints.length - 1].y}px`,
                          animationDuration: '2.5s',
                        }}
                      />
                      <circle
                        cx={jobPoints[jobPoints.length - 1].x}
                        cy={jobPoints[jobPoints.length - 1].y}
                        r={3.5}
                        fill="#06B6D4"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />

                      {/* Blogs Beacon */}
                      <circle
                        cx={blogPoints[blogPoints.length - 1].x}
                        cy={blogPoints[blogPoints.length - 1].y}
                        r={3.5}
                        fill="#EC4899"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />

                      {/* Admit Beacon */}
                      <circle
                        cx={admitPoints[admitPoints.length - 1].x}
                        cy={admitPoints[admitPoints.length - 1].y}
                        r={3}
                        fill="#A855F7"
                        stroke="#ffffff"
                        strokeWidth={1.8}
                      />
                    </g>
                  )}

                  {/* Vertical Guideline & Indicator Dots on Hover */}
                  {hoveredJobPt && (
                    <g className="transition-opacity duration-150">
                      <line
                        x1={hoveredJobPt.x}
                        y1={20}
                        x2={hoveredJobPt.x}
                        y2={160}
                        stroke="#3B82F6"
                        strokeDasharray="3 3"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={hoveredJobPt.x}
                        cy={hoveredJobPt.y}
                        r={5}
                        fill="#06B6D4"
                        stroke="#ffffff"
                        strokeWidth={2.5}
                      />
                      <circle
                        cx={hoveredBlogPt.x}
                        cy={hoveredBlogPt.y}
                        r={5}
                        fill="#EC4899"
                        stroke="#ffffff"
                        strokeWidth={2.5}
                      />
                      <circle
                        cx={hoveredAdmitPt.x}
                        cy={hoveredAdmitPt.y}
                        r={5}
                        fill="#A855F7"
                        stroke="#ffffff"
                        strokeWidth={2.5}
                      />
                    </g>
                  )}

                  {/* X-Axis Dynamic Labels */}
                  {chartDataPoints.map((d, i) => {
                    const x = 55 + (i / Math.max(1, numPoints - 1)) * 620;
                    const isHovered = hoveredPointIdx === i;
                    return (
                      <text
                        key={i}
                        x={x}
                        y="177"
                        fill={isHovered ? '#1E293B' : '#64748B'}
                        fontSize="10"
                        textAnchor="middle"
                        fontWeight={isHovered ? 'bold' : '600'}
                      >
                        {d.label}
                      </text>
                    );
                  })}

                  {/* Interactive Hitbox Rectangles */}
                  {chartDataPoints.map((d, i) => {
                    const x = 55 + (i / Math.max(1, numPoints - 1)) * 620;
                    const hitWidth = Math.max(30, 620 / numPoints);
                    return (
                      <rect
                        key={i}
                        x={x - hitWidth / 2}
                        y={15}
                        width={hitWidth}
                        height={160}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPointIdx(i)}
                        onMouseLeave={() => setHoveredPointIdx(null)}
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Quick Metrics Bar Under Chart (Dynamic per Timeframe with Staggered Entrance Animation) */}
            <div
              key={`metrics-bar-${chartTimeframe}`}
              className="grid grid-cols-3 gap-2 pt-3 mt-1 border-t border-slate-100 text-center"
            >
              {activeActivity.metrics?.map((metric, mIdx) => (
                <div
                  key={mIdx}
                  style={{
                    animation: 'metricBadgeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    animationDelay: `${mIdx * 60}ms`,
                    opacity: 0,
                  }}
                  className="bg-slate-50 hover:bg-slate-100/90 border border-slate-100 hover:border-slate-200 p-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-2xs cursor-default group"
                >
                  <span className="text-[10px] text-slate-500 font-medium block truncate group-hover:text-slate-700 transition-colors">
                    {metric.title}
                  </span>
                  <p className={`text-xs sm:text-sm font-extrabold mt-0.5 tracking-tight ${metric.color || 'text-slate-800'}`}>
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Animated Pie / Donut Chart Card (4 cols) ── */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs h-full flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <PieChart size={14} className="text-pink-600" />
                    <span>Content Share &amp; Breakdown</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">Proportional volume of portal resources</p>
                </div>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-mono shadow-2xs">
                  {totalPieValue.toLocaleString()} items
                </span>
              </div>

              {/* SVG Animated Donut with Interactive Center HUD */}
              <div className="relative flex items-center justify-center py-1">
                <div className="w-44 h-44 sm:w-48 sm:h-48 relative">
                  <svg
                    viewBox="0 0 220 220"
                    className="w-full h-full overflow-visible drop-shadow-xs transition-transform duration-500"
                    style={{
                      animation: 'pieSweepIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    }}
                  >
                    <defs>
                      {pieSlices.map((slice) => (
                        <linearGradient key={slice.gradId} id={slice.gradId} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={slice.gradFrom} />
                          <stop offset="100%" stopColor={slice.gradTo} />
                        </linearGradient>
                      ))}
                      <filter id="pieGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.35" />
                      </filter>
                    </defs>

                    {/* Outer subtle guide track */}
                    <circle cx="110" cy="110" r="88" fill="none" stroke="#F1F5F9" strokeWidth="1" />

                    {/* Animated Donut Slices */}
                    {pieSlices.map((slice, idx) => {
                      const isHovered = hoveredPieIndex === idx;
                      const rInner = isHovered ? 52 : 56;
                      const rOuter = isHovered ? 92 : 86;
                      const pathD = getDonutSlicePath(110, 110, rInner, rOuter, slice.startAngle, slice.endAngle);

                      return (
                        <path
                          key={slice.id}
                          d={pathD}
                          fill={`url(#${slice.gradId})`}
                          filter={isHovered ? 'url(#pieGlow)' : 'none'}
                          className="cursor-pointer transition-all duration-300 ease-out"
                          style={{
                            transformOrigin: '110px 110px',
                            transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                            opacity: hoveredPieIndex === null || isHovered ? 1 : 0.65,
                          }}
                          onMouseEnter={() => setHoveredPieIndex(idx)}
                          onMouseLeave={() => setHoveredPieIndex(null)}
                        />
                      );
                    })}
                  </svg>

                  {/* Center Dynamic HUD Info Display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2 select-none">
                    {hoveredPieIndex !== null && pieSlices[hoveredPieIndex] ? (
                      <div className="animate-in fade-in zoom-in-90 duration-150 flex flex-col items-center">
                        <span
                          className="text-[10px] font-black uppercase tracking-wider block truncate max-w-[95px]"
                          style={{ color: pieSlices[hoveredPieIndex].color }}
                        >
                          {pieSlices[hoveredPieIndex].label}
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5">
                          {pieSlices[hoveredPieIndex].value?.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-full mt-0.5 shadow-2xs">
                          {pieSlices[hoveredPieIndex].percentage}% Share
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center animate-in fade-in duration-200">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Total Assets
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5">
                          {totalPieValue.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          6 Taxonomies
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Legend Grid (Hovering syncs with Donut) */}
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 text-xs">
              {pieSlices.map((slice, idx) => {
                const isHovered = hoveredPieIndex === idx;
                return (
                  <Link
                    key={slice.id}
                    href={slice.href}
                    onMouseEnter={() => setHoveredPieIndex(idx)}
                    onMouseLeave={() => setHoveredPieIndex(null)}
                    style={{
                      animation: 'pieLegendIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                      animationDelay: `${idx * 45}ms`,
                      opacity: 0,
                    }}
                    className={`p-1.5 rounded-lg border transition-all duration-150 flex items-center justify-between gap-1 group no-underline ${
                      isHovered
                        ? 'bg-slate-100/90 border-slate-300 shadow-2xs scale-[1.02]'
                        : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-125"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="text-[11px] font-semibold text-slate-700 truncate group-hover:text-slate-900">
                        {slice.label}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-900 block font-mono leading-none">
                        {slice.value?.toLocaleString()}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400">
                        {slice.percentage}%
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* 4. ROW 2: LIVE STREAM & OPERATIONS ROW - Recent Posts Table (8 cols) & Tools/Health (4 cols) in the SAME ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">

        {/* ── LEFT: Live Unified Recent Posts & Items Stream Table (8 cols) ── */}
        <div className="lg:col-span-8 space-y-3.5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={15} className="text-blue-600" />
                  <span>Recent Content &amp; Updates Stream</span>
                </h2>
                <p className="text-[11px] text-slate-500">Live feed of items published across all categories</p>
              </div>

              {/* Tabs with Count Badges */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold overflow-x-auto custom-scrollbar">
                {[
                  { id: 'all', label: 'All', count: unifiedPosts.length },
                  { id: 'jobs', label: 'Jobs', count: cards.jobs?.total },
                  { id: 'blogs', label: 'Blogs', count: cards.blogs?.total },
                  { id: 'admit-cards', label: 'Admit Cards', count: cards.admitCards?.total },
                  { id: 'results', label: 'Results', count: cards.results?.total },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-2.5 py-1 rounded-md transition-all duration-200 cursor-pointer text-xs flex items-center gap-1.5 shrink-0 ${
                        isActive
                          ? 'bg-white text-blue-700 shadow-2xs font-bold scale-[1.02]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span
                          className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-mono ${
                            isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'bg-slate-200/70 text-slate-500'
                          }`}
                        >
                          {typeof tab.count === 'number'
                            ? tab.count > 999
                              ? `${(tab.count / 1000).toFixed(1)}k`
                              : tab.count
                            : tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Posts Table with Staggered Entrance and Hover Micro-Animations */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Title / Heading</th>
                    <th className="py-2.5 px-3">Category / Tag</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody key={activeTab} className="divide-y divide-slate-100">
                  {unifiedPosts.length > 0 ? (
                    unifiedPosts.map((item, idx) => (
                      <tr
                        key={`${activeTab}-${item.id || idx}`}
                        style={{
                          animation: 'dashboardRowIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                          animationDelay: `${idx * 40}ms`,
                          opacity: 0,
                        }}
                        className="group hover:bg-blue-50/50 transition-all duration-150 border-l-[3px] border-l-transparent hover:border-l-blue-600 cursor-default"
                      >
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-transform duration-150 inline-block group-hover:scale-105 shadow-2xs ${item.typeBadge}`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <Link
                            href={item.editUrl}
                            className="font-semibold text-slate-800 group-hover:text-blue-600 line-clamp-1 transition-colors"
                            title={item.title}
                          >
                            {item.title}
                          </Link>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-medium text-[11px]">
                          {item.category}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            <span>Published</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-right space-x-1.5">
                          <Link
                            href={item.editUrl}
                            className="inline-flex items-center p-1.5 rounded-md hover:bg-blue-100 hover:text-blue-700 text-slate-500 transition-all duration-150 shadow-2xs hover:scale-115"
                            title="Edit Item"
                          >
                            <Edit size={13} />
                          </Link>
                          <a
                            href={item.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center p-1.5 rounded-md hover:bg-blue-100 hover:text-blue-700 text-slate-500 transition-all duration-150 shadow-2xs hover:scale-115"
                            title="View Live Page"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 animate-in fade-in duration-200">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <Layers size={22} className="text-slate-300" />
                          <span className="text-xs font-semibold text-slate-500">No recent updates found</span>
                          <span className="text-[11px] text-slate-400">Items published under this category will appear here in real time.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Popular Exam Taxonomies (Aligned directly under Recent Updates stream) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap size={14} className="text-blue-600" />
                <span>Top Popular Categories &amp; Taxonomies</span>
              </h3>
              <span className="text-[10px] font-semibold text-slate-400">Resource Distribution &amp; Traffic</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs pt-1">
              {(stats?.topCategories && stats.topCategories.length > 0
                ? stats.topCategories.slice(0, 6).map((c, i) => {
                    const presets = [
                      { percent: '88%', barColor: 'from-cyan-500 to-blue-500' },
                      { percent: '76%', barColor: 'from-blue-600 to-indigo-600' },
                      { percent: '69%', barColor: 'from-indigo-500 to-purple-500' },
                      { percent: '58%', barColor: 'from-emerald-500 to-teal-500' },
                      { percent: '52%', barColor: 'from-amber-500 to-orange-500' },
                      { percent: '44%', barColor: 'from-pink-500 to-rose-500' },
                    ];
                    const preset = presets[i % presets.length];
                    return {
                      name: c.name,
                      slug: c.slug,
                      percent: preset.percent,
                      count: 'Live Taxonomy',
                      barColor: preset.barColor,
                    };
                  })
                : [
                    { name: 'Railway Recruitments', slug: 'railway', percent: '88%', count: '4,120 items', barColor: 'from-cyan-500 to-blue-500' },
                    { name: 'UPSC Civil Services', slug: 'upsc', percent: '76%', count: '3,890 items', barColor: 'from-blue-600 to-indigo-600' },
                    { name: 'SSC CGL / CHSL', slug: 'ssc', percent: '69%', count: '2,940 items', barColor: 'from-indigo-500 to-purple-500' },
                    { name: 'Defence & Police', slug: 'defence', percent: '58%', count: '2,410 items', barColor: 'from-emerald-500 to-teal-500' },
                    { name: 'Banking & IBPS', slug: 'bank', percent: '52%', count: '2,150 items', barColor: 'from-amber-500 to-orange-500' },
                    { name: 'State PSC Exams', slug: 'state-psc', percent: '44%', count: '1,958 items', barColor: 'from-pink-500 to-rose-500' },
                  ]
              ).map((c, i) => (
                <div key={i} className="p-2.5 bg-slate-50/80 hover:bg-slate-100/90 border border-slate-100 rounded-lg space-y-1.5 transition">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-800">{c.name}</span>
                    <span className="font-mono font-bold text-slate-500">{c.percent}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${c.barColor} transition-all duration-500`}
                      style={{ width: c.percent }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {c.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Quick Actions & System Server Health (4 cols) ── */}
        <div className="lg:col-span-4 space-y-3.5">

          {/* 1. Quick Publishing Actions Grid */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Quick Actions &amp; Tools</span>
              <Sparkles size={13} className="text-amber-500" />
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/edu-admin/jobs"
                className="p-2.5 bg-slate-50 hover:bg-cyan-50 border border-slate-200/80 hover:border-cyan-300 rounded-lg flex flex-col items-start gap-1 transition group no-underline"
              >
                <div className="p-1.5 rounded-md bg-cyan-100 text-cyan-700 group-hover:scale-105 transition-transform">
                  <Briefcase size={14} />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-cyan-700">Post Govt Job</span>
                <span className="text-[10px] text-slate-500">Recruitment notification</span>
              </Link>

              <Link
                href="/edu-admin/posts/create?type=article"
                className="p-2.5 bg-slate-50 hover:bg-pink-50 border border-slate-200/80 hover:border-pink-300 rounded-lg flex flex-col items-start gap-1 transition group no-underline"
              >
                <div className="p-1.5 rounded-md bg-pink-100 text-pink-700 group-hover:scale-105 transition-transform">
                  <FileText size={14} />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-pink-700">Write Article</span>
                <span className="text-[10px] text-slate-500">Blog with SEO tags</span>
              </Link>

              <Link
                href="/edu-admin/questions"
                className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 rounded-lg flex flex-col items-start gap-1 transition group no-underline"
              >
                <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700 group-hover:scale-105 transition-transform">
                  <CheckSquare size={14} />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Add MCQ</span>
                <span className="text-[10px] text-slate-500">Quiz &amp; mock questions</span>
              </Link>

              <Link
                href="/edu-admin/admit-cards"
                className="p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-200/80 hover:border-purple-300 rounded-lg flex flex-col items-start gap-1 transition group no-underline"
              >
                <div className="p-1.5 rounded-md bg-purple-100 text-purple-700 group-hover:scale-105 transition-transform">
                  <Award size={14} />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700">Admit Cards</span>
                <span className="text-[10px] text-slate-500">Exam hall tickets</span>
              </Link>

              <Link
                href="/edu-admin/results"
                className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 rounded-lg flex flex-col items-start gap-1 transition group no-underline"
              >
                <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700 group-hover:scale-105 transition-transform">
                  <CheckCircle2 size={14} />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Exam Results</span>
                <span className="text-[10px] text-slate-500">Scorecard alerts</span>
              </Link>

              <Link
                href="/edu-admin/media"
                className="p-2.5 bg-slate-50 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-300 rounded-lg flex flex-col items-start gap-1 transition group no-underline"
              >
                <div className="p-1.5 rounded-md bg-amber-100 text-amber-700 group-hover:scale-105 transition-transform">
                  <Database size={14} />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700">Media Library</span>
                <span className="text-[10px] text-slate-500">12,243 assets</span>
              </Link>
            </div>
          </div>

          {/* 2. System Architecture & RAM Health Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>System &amp; Server Health</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Healthy</span>
              </span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Cpu size={13} className="text-slate-400" />
                  <span>Runtime Engine</span>
                </span>
                <span className="font-bold text-slate-800">Node v22 &amp; Next.js 16</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Database size={13} className="text-slate-400" />
                  <span>Database</span>
                </span>
                <span className="font-bold text-slate-800">MongoDB Atlas Cluster</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Zap size={13} className="text-amber-500" />
                  <span>In-Memory Cache</span>
                </span>
                <span className="font-bold text-emerald-600">Active (0.05ms)</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Users size={13} className="text-slate-400" />
                  <span>Today User Logs</span>
                </span>
                <Link href="/edu-admin/users/logs" className="font-bold text-blue-600 hover:underline">
                  {cards.todayLogs ? `${cards.todayLogs} sessions` : 'View attendance'}
                </Link>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Build: v9.52.21 (Production)</span>
              <button
                onClick={handleClearCache}
                className="text-blue-600 hover:underline font-bold cursor-pointer"
              >
                Clear RAM Cache
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 4. FOOTER BRANDING BAR */}
      <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-1">
        <p className="font-medium">EMP © 2026 Education Masters | Powered by AdxVenture</p>
        <p className="text-slate-400 font-mono">Platform v9.52.21 • Stable Release</p>
      </div>

    </div>
  );
}
