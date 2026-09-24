'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Radio, Bell } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/apis/v1`
  : 'http://localhost:5001/apis/v1';

const DEFAULT_TICKER_ITEMS = [
  {
    tag: 'Admit Card',
    tagStyle: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    text: 'UPSC IAS Prelims official admit card released - download now',
    href: '/admit-cards',
  },
  {
    tag: 'Result',
    tagStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    text: 'SBI PO 2026 Mains result & merit list uploaded',
    href: '/results',
  },
  {
    tag: 'Job',
    tagStyle: 'bg-blue-50 text-blue-700 border-blue-200',
    text: 'Railway RRB NTPC CBT-2 exam dates & recruitment notification',
    href: '/jobs',
  },
  {
    tag: 'Update',
    tagStyle: 'bg-purple-50 text-purple-700 border-purple-200',
    text: 'New 30 MCQs added for General Knowledge & Current Affairs',
    href: '/general-knowledge/mcq-questions',
  },
];

export default function LiveTicker() {
  const [tickerItems, setTickerItems] = useState(DEFAULT_TICKER_ITEMS);

  useEffect(() => {
    let isMounted = true;

    async function fetchDynamicUpdates() {
      try {
        const [admitRes, resultRes, jobRes] = await Promise.allSettled([
          fetch(`${API_BASE}/admit-cards?limit=4`).then((r) => r.json()),
          fetch(`${API_BASE}/results?limit=4`).then((r) => r.json()),
          fetch(`${API_BASE}/jobs?limit=4`).then((r) => r.json()),
        ]);

        const admitCards =
          admitRes.status === 'fulfilled' && admitRes.value?.success && Array.isArray(admitRes.value?.data)
            ? admitRes.value.data
            : [];

        const results =
          resultRes.status === 'fulfilled' && resultRes.value?.success && Array.isArray(resultRes.value?.data)
            ? resultRes.value.data
            : [];

        const jobs =
          jobRes.status === 'fulfilled' && jobRes.value?.success && Array.isArray(jobRes.value?.data)
            ? jobRes.value.data
            : [];

        const interleaved = [];
        const maxLen = Math.max(admitCards.length, results.length, jobs.length);

        for (let i = 0; i < maxLen; i++) {
          if (admitCards[i]) {
            interleaved.push({
              tag: 'Admit Card',
              tagStyle: 'bg-cyan-50 text-cyan-700 border-cyan-200',
              text: admitCards[i].title,
              href: `/admit-card/${admitCards[i].slug || admitCards[i]._id}`,
            });
          }
          if (results[i]) {
            interleaved.push({
              tag: 'Result',
              tagStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              text: results[i].title,
              href: `/result/${results[i].slug || results[i]._id}`,
            });
          }
          if (jobs[i]) {
            interleaved.push({
              tag: 'Job',
              tagStyle: 'bg-blue-50 text-blue-700 border-blue-200',
              text: jobs[i].title,
              href: `/job/${jobs[i].slug || jobs[i]._id}`,
            });
          }
        }

        if (interleaved.length > 0 && isMounted) {
          setTickerItems(interleaved);
        }
      } catch (err) {
        console.error('Error fetching live ticker updates:', err);
      }
    }

    fetchDynamicUpdates();

    return () => {
      isMounted = false;
    };
  }, []);

  // Duplicate the items for seamless infinite looping
  const displayItems = tickerItems.length > 0 ? tickerItems.concat(tickerItems) : [];

  return (
    <div className="relative overflow-hidden border-b border-slate-200 bg-white text-slate-800">
      <div className="mx-auto flex max-w-7xl items-center gap-3 pl-4 pr-0 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-2 border-r border-slate-200 py-2.5 pr-3 sm:pr-4">
          <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <span className="live-ping absolute h-2.5 w-2.5 rounded-full bg-rose-400 opacity-70" />
            <Radio className="relative h-3.5 w-3.5" />
          </span>
          <span className="hidden text-xs font-extrabold text-slate-900 sm:inline">
            Live Updates
          </span>
          <span className="text-xs font-extrabold text-slate-900 sm:hidden">
            Live
          </span>
        </div>

        <div className="ticker-mask flex-1 overflow-hidden py-2.5">
          <div className="ticker-track flex w-max items-center gap-7 whitespace-nowrap">
            {displayItems.map((item, index) => (
              <Link
                key={`${item.href}-${index}`}
                href={item.href || '#'}
                className="group flex items-center gap-2 text-xs font-semibold text-slate-600 transition-colors hover:text-[#0b66c3]"
              >
                <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold ${item.tagStyle}`}>
                  {item.tag}
                </span>
                <span>{item.text}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-[#0b66c3]" />
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-2 border-l border-slate-200 py-2.5 pl-4 text-xs font-bold text-slate-500 lg:flex">
          <Bell className="h-3.5 w-3.5 text-[#0b66c3]" />
          <span>Verified notices</span>
        </div>
      </div>

      <style>{`
        .ticker-track {
          animation: ticker-scroll 45s linear infinite;
        }
        .ticker-mask:hover .ticker-track {
          animation-play-state: paused;
        }
        .ticker-mask {
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0,
            black 24px,
            black calc(100% - 24px),
            transparent 100%
          );
          mask-image: linear-gradient(
            to right,
            transparent 0,
            black 24px,
            black calc(100% - 24px),
            transparent 100%
          );
        }
        .live-ping {
          animation: live-ping-pulse 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes live-ping-pulse {
          0% { transform: scale(1); opacity: 0.7; }
          75%, 100% { transform: scale(2.1); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ticker-track { animation: none; }
          .live-ping { animation: none; }
        }
      `}</style>
    </div>
  );
}
