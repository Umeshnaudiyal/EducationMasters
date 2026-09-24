'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import LiveTicker from '@/components/LiveTicker';
import Footer from '@/components/Footer';
import { STATES_LIST } from '@/utils/mcqTaxonomies';
import { MapPin, Search, Landmark, ArrowRight, BookOpen, Briefcase, GraduationCap } from 'lucide-react';

export default function StatesIndexPage() {
  const [search, setSearch] = useState('');

  const filteredStates = useMemo(() => {
    if (!search) return STATES_LIST;
    return STATES_LIST.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans selection:bg-orange-600 selection:text-white">
      <Header />
      <LiveTicker />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Breadcrumb */}
        <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
          <Link href="/" className="hover:text-orange-600 text-orange-600 underline">
            Home
          </Link>
          <span>›</span>
          <span className="text-slate-900 font-bold">State Government Portals</span>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-orange-50 text-orange-700 border border-orange-200 font-bold text-xs px-3 py-1 rounded-full">
              🏛️ All India State Government Portals
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore State-Wise Government Jobs, GK Questions &amp; Exam Portals
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            Select your state to access live recruitment notices, State Public Service Commission (PSC) updates, Police recruitment, Teacher Eligibility Tests (TET), and 1000+ state-wise General Knowledge MCQs.
          </p>

          {/* Search Box */}
          <div className="relative max-w-md pt-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 mt-1" size={16} />
            <input
              type="text"
              placeholder="Search by state name (e.g. Andhra Pradesh, Bihar, Rajasthan)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
            />
          </div>
        </div>

        {/* State Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredStates.map((st) => (
            <Link
              key={st.slug}
              href={`/state/${st.slug}/`}
              className="p-4 bg-white hover:bg-orange-50/40 border border-slate-200/80 hover:border-orange-300 rounded-2xl shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Landmark size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                    {st.name}
                  </h2>
                  <span className="text-[10.5px] text-slate-500 block">
                    Jobs, GK &amp; MCQs
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-orange-600">
                <span>View State Portal</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
