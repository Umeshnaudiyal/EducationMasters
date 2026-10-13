'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import LiveTicker from '@/components/LiveTicker';
import Footer from '@/components/Footer';
import {
  ShieldCheck,
  FileText,
  AlertCircle,
  Scale,
  ExternalLink,
  Mail,
  Clock,
  BookOpen,
  CheckCircle2,
  Globe,
  Share2,
  Printer,
  ChevronRight,
  Info,
  Building2,
  UserCheck,
  Sparkles,
  Award,
  Layers,
  SearchCheck,
  Newspaper,
  Check,
  Copy,
} from 'lucide-react';

const SECTIONS = [
  { id: 'editorial-mission', number: '1', title: 'Our Editorial Mission' },
  { id: 'content-sources', number: '2', title: 'Content Sources' },
  { id: 'editorial-independence', number: '3', title: 'Editorial Independence' },
  { id: 'corrections-updates', number: '4', title: 'Corrections & Updates' },
  { id: 'content-ownership', number: '5', title: 'Content Ownership' },
  { id: 'reader-feedback', number: '6', title: 'Reader Feedback' },
  { id: 'disclaimer', number: '7', title: 'Disclaimer' },
  { id: 'contact', number: '8', title: 'Contact' },
];

export default function EditorialPolicyPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white">
      <Header />
      <LiveTicker />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* 1. Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center space-x-2 text-xs text-slate-500 mb-6 font-medium"
        >
          <Link href="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <span>›</span>
          <span className="text-slate-400">Legal &amp; Policies</span>
          <span>›</span>
          <span className="text-slate-800 font-semibold">Editorial Policy</span>
        </nav>

        {/* 2. Hero Header Banner */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 mb-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/70 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Official Editorial Standards &amp; Integrity Policy</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Editorial Policy — EducationMasters.in
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Last Updated: <strong>15th Oct. 2025</strong></span>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Editorial Head: <strong>Vikash Sharma</strong></span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status: In Effect</span>
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed pt-2">
              Welcome to <strong className="text-slate-900">EducationMasters.in</strong>, your trusted source for authentic education news, job alerts, and exam updates. Our goal is to provide accurate, timely, and unbiased information to help students, job seekers, and learners stay informed.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2 print:hidden">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copied!' : 'Copy Policy Link'}</span>
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Policy</span>
              </button>
              <a
                href="mailto:editor@educationmasters.in?subject=Editorial%20Feedback%20/%20Inquiry"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Editorial Desk</span>
              </a>
            </div>
          </div>
        </div>

        {/* 3. 2-Column Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Sticky Table of Contents & Info Boxes (4 Cols) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Table of Contents</span>
                </h2>
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                  8 Sections
                </span>
              </div>

              <nav className="space-y-1">
                {SECTIONS.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="flex items-center justify-between text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50/70 px-3 py-2 rounded-lg transition group font-medium"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-500 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-[10px] font-bold shrink-0 transition">
                        {sec.number}
                      </span>
                      <span className="truncate">{sec.title}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0" />
                  </a>
                ))}
              </nav>

              {/* Quick Editorial Desk Contact Box */}
              <div className="mt-5 pt-4 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-4 rounded-b-2xl">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Editorial Desk Contact</span>
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-2.5">
                  Reach out directly to our editorial team for corrections, story pitches, or inquiries.
                </p>
                <div className="space-y-2">
                  <a
                    href="mailto:editor@educationmasters.in"
                    className="inline-flex items-center justify-center w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition gap-1.5 shadow-2xs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>editor@educationmasters.in</span>
                  </a>
                  <Link
                    href="/contact-us/"
                    className="inline-flex items-center justify-center w-full py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition gap-1"
                  >
                    <span>Visit Contact Us Page</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Editorial Independence Badge Card */}
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-blue-400 bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Journalistic Integrity</h4>
                  <p className="text-[11px] text-slate-300">100% Unbiased &amp; Independent</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-3 pt-3 border-t border-slate-700/60">
                Every report, notification, and recruitment update is rigorously checked against primary government gazettes and educational institutions before publication.
              </p>
            </div>

            {/* Related Policies Box */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Related Platform Policies
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link
                    href="/terms-of-service/"
                    className="flex items-center justify-between text-slate-600 hover:text-blue-600 py-1 transition group"
                  >
                    <span>Terms of Service</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy/"
                    className="flex items-center justify-between text-slate-600 hover:text-blue-600 py-1 transition group"
                  >
                    <span>Privacy Policy</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/disclaimer/"
                    className="flex items-center justify-between text-slate-600 hover:text-blue-600 py-1 transition group"
                  >
                    <span>Disclaimer (DMCA Policy)</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact-us/"
                    className="flex items-center justify-between text-slate-600 hover:text-blue-600 py-1 transition group"
                  >
                    <span>Contact Us</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </Link>
                </li>
              </ul>
            </div>
          </aside>

          {/* Right Column: Structured Detailed Content Cards (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">

            {/* Section 1: Our Editorial Mission */}
            <section
              id="editorial-mission"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  1
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span>Our Editorial Mission</span>
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                At <strong className="text-slate-900">EducationMasters.in</strong>, we believe in transparency, accuracy, and reliability. We aim to simplify complex education and career-related news into clear, easy-to-understand articles.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                Our editorial team follows strict guidelines to ensure every article meets the highest journalistic standards.
              </p>

              {/* Mission Pillars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-center">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                    ✓
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Transparency</h4>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Open content sourcing, cited official portals, and clear publication dates.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                    ✓
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Accuracy</h4>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Thorough verification against original gazettes and exam body notifications.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-center">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    ✓
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Reliability</h4>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Actionable, timely updates to guide students and job seekers with confidence.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2: Content Sources */}
            <section
              id="content-sources"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  2
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <SearchCheck className="w-5 h-5 text-blue-600" />
                  <span>Content Sources</span>
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                We publish information after verifying it through:
              </p>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Official Government Websites</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Direct verification from constitutional bodies and recruitment agencies like UPSC, SSC, NTA, State PSCs, RRB, and IBPS.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Press Releases from Educational Institutions</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Verified communications and admission notifications directly published by accredited central, state, and private universities and institutes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Trusted Public Sources and Media Partners</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Reputed national wire services, government press information bureaus (PIB), and verified academic circulars.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 text-xs sm:text-sm text-amber-900 flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="font-semibold">
                  No article is published without cross-checking the facts.
                </span>
              </div>
            </section>

            {/* Section 3: Editorial Independence */}
            <section
              id="editorial-independence"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  3
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-600" />
                  <span>Editorial Independence</span>
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                Our editorial team works independently. No advertiser, sponsor, or external partner influences our news coverage or editorial decisions.
              </p>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs sm:text-sm text-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Clear Commercial Transparency</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sponsored content (if any) is clearly labeled as <strong className="text-slate-900">“Sponsored”</strong> or <strong className="text-slate-900">“Advertisement.”</strong> Our readers always know when content is commercial versus independently reported.
                </p>
              </div>
            </section>

            {/* Section 4: Corrections & Updates */}
            <section
              id="corrections-updates"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  4
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Corrections &amp; Updates</span>
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                If any factual error is identified, we promptly verify and correct it. We maintain transparency in corrections by updating the content and noting the revision date.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200/80">
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-blue-900">Spot an error or outdated link?</h4>
                  <p className="text-xs text-blue-700">Readers can report errors directly to our editorial team.</p>
                </div>
                <a
                  href="mailto:editor@educationmasters.in?subject=Correction%20Request%20-%20EducationMasters.in"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shrink-0 shadow-2xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Report to editor@educationmasters.in</span>
                </a>
              </div>
            </section>

            {/* Section 5: Content Ownership */}
            <section
              id="content-ownership"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  5
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>Content Ownership</span>
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                All articles, graphics, and data published on this website are owned by <strong className="text-slate-900">EducationMasters.in</strong>.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-700">
                <p className="font-semibold text-slate-900">
                  Reproduction or redistribution without written permission is prohibited.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Excerpts and links may be shared for fair educational use provided full and clear credit is given to EducationMasters.in with appropriate and specific direction to the original content.
                </p>
              </div>
            </section>

            {/* Section 6: Reader Feedback */}
            <section
              id="reader-feedback"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  6
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <span>Reader Feedback</span>
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                We welcome reader participation. If you wish to suggest improvements or share feedback, please write to us at:
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <span className="text-xs text-slate-500 font-medium">Official Editorial Feedback Email:</span>
                  <a
                    href="mailto:editor@educationmasters.in"
                    className="block text-sm sm:text-base font-bold text-blue-600 hover:text-blue-800 hover:underline transition truncate"
                  >
                    editor@educationmasters.in
                  </a>
                </div>
              </div>
            </section>

            {/* Section 7: Disclaimer */}
            <section
              id="disclaimer"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  7
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span>Disclaimer</span>
                </h2>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-xs sm:text-sm text-amber-950">
                <p className="leading-relaxed">
                  <strong className="text-amber-900">EducationMasters.in</strong> is an independent educational news platform and not affiliated with any government body or recruitment agency.
                </p>
                <p className="leading-relaxed text-amber-800">
                  Information shared is collected from official and verified public sources only. Readers and candidates are encouraged to double-check official notifications before taking administrative or financial steps.
                </p>
              </div>
            </section>

            {/* Section 8: Contact */}
            <section
              id="contact"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  8
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>📌 Contact</span>
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                For editorial queries, please contact:
              </p>

              {/* Rich Contact Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/90 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    VS
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Editorial Head: Vikash Sharma
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Head of Editorial Standards &amp; Publishing</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <a
                    href="mailto:editor@educationmasters.in"
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition group"
                  >
                    <Mail className="w-4 h-4 text-blue-600 group-hover:scale-110 transition shrink-0" />
                    <div className="truncate text-xs">
                      <span className="block text-slate-400 font-medium">Email Desk</span>
                      <strong className="text-slate-800 group-hover:text-blue-600 transition truncate">
                        editor@educationmasters.in
                      </strong>
                    </div>
                  </a>

                  <Link
                    href="/contact-us/"
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition group"
                  >
                    <Globe className="w-4 h-4 text-blue-600 group-hover:scale-110 transition shrink-0" />
                    <div className="truncate text-xs">
                      <span className="block text-slate-400 font-medium">Contact Center</span>
                      <strong className="text-slate-800 group-hover:text-blue-600 transition truncate">
                        https://educationmasters.in/contact-us/
                      </strong>
                    </div>
                  </Link>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
