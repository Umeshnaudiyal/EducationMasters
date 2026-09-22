'use client';

import { ChevronRight, Radio, Bell } from 'lucide-react';

const TICKER_ITEMS = [
  {
    tag: 'Update',
    tagStyle: 'bg-blue-50 text-blue-700 border-blue-100',
    text: 'New 30 MCQs added for General Knowledge & Current Affairs',
    href: '/general-knowledge/mcq-questions',
  },
  {
    tag: 'Admit Card',
    tagStyle: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    text: 'UPSC IAS Prelims official admit card released - download now',
    href: '/admit-cards',
  },
  {
    tag: 'Result',
    tagStyle: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    text: 'SBI PO 2026 Mains result & merit list uploaded',
    href: '/results',
  },
  {
    tag: 'Dates',
    tagStyle: 'bg-amber-50 text-amber-800 border-amber-100',
    text: 'Railway RRB NTPC CBT-2 exam dates & intimation slip live',
    href: '/jobs',
  },
  {
    tag: 'Registration',
    tagStyle: 'bg-rose-50 text-rose-700 border-rose-100',
    text: 'Indian Army Agniveer 2026 online registration open',
    href: '/jobs',
  }
];

export default function LiveTicker() {
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
            {TICKER_ITEMS.concat(TICKER_ITEMS).map((item, index) => (
              <a
                key={index}
                href={item.href || '#'}
                className="group flex items-center gap-2 text-xs font-semibold text-slate-600 transition-colors hover:text-[#0b66c3]"
              >
                <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold ${item.tagStyle}`}>
                  {item.tag}
                </span>
                <span>{item.text}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-[#0b66c3]" />
              </a>
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
          animation: ticker-scroll 40s linear infinite;
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
