import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import LiveTicker from '@/components/LiveTicker';
import Footer from '@/components/Footer';
import {
  ShieldAlert,
  FileText,
  AlertTriangle,
  Scale,
  ExternalLink,
  Lock,
  Mail,
  HelpCircle,
  Clock,
  BookOpen,
  CheckCircle2,
  Globe,
  Share2,
  Printer,
  ChevronRight,
  Info,
  Building2,
  ShieldCheck,
  Copyright,
  Send,
  AlertCircle,
  FileCheck2,
  Landmark,
  BadgeAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const metadata = {
  title: 'Disclaimer & DMCA Copyright Policy | Education Masters',
  description:
    'Official Disclaimer, DMCA Copyright Policy, and Non-Governmental Entity Notice for EducationMasters.in. Learn about our content sourcing, copyright removal process, and user advisory.',
  keywords:
    'Education Masters disclaimer, DMCA policy, copyright infringement, study material removal, non-government disclaimer, educational portal terms',
  alternates: {
    canonical: 'https://educationmasters.in/disclaimer/',
  },
  openGraph: {
    title: 'Disclaimer & DMCA Policy | Education Masters',
    description:
      'Official Disclaimer and Copyright Protection Guidelines for EducationMasters.in. Sourced educational data, DMCA notice submission, and platform advisories.',
    url: 'https://educationmasters.in/disclaimer/',
    siteName: 'Education Masters',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Disclaimer & DMCA Policy | Education Masters',
    description:
      'Official Disclaimer, DMCA Policy, and Educational Content Advisory for EducationMasters.in.',
  },
};

const SECTIONS = [
  { id: 'general-disclaimer', number: '1', title: 'General Disclaimer (DMCA)' },
  { id: 'public-domain', number: '2', title: 'Public Domain & 3rd Party Links' },
  { id: 'removal-process', number: '3', title: 'Copyright Removal Request (a)' },
  { id: 'claim-elements', number: '4', title: 'Required Claim Elements (b)' },
  { id: 'notice-submission', number: '5', title: 'Notice Submission Email (c)' },
  { id: 'response-sla', number: '6', title: 'Response Timeframe & SLA (d)' },
  { id: 'non-govt-entity', number: '7', title: 'Non-Governmental Entity Notice' },
  { id: 'exam-accuracy', number: '8', title: 'Exam Information Accuracy' },
  { id: 'ads-third-party', number: '9', title: 'Advertisements & External Links' },
  { id: 'liability', number: '10', title: 'Limitation of Liability' },
  { id: 'contact', number: '11', title: 'Grievance & Legal Contact' },
];

export default function DisclaimerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Disclaimer & DMCA Policy - Education Masters',
    description:
      'Official Disclaimer, DMCA Copyright Takedown Procedure, and Non-Governmental Notice of EducationMasters.in.',
    url: 'https://educationmasters.in/disclaimer/',
    publisher: {
      '@type': 'Organization',
      name: 'Education Masters',
      url: 'https://educationmasters.in',
      logo: 'https://educationmasters.in/logo.webp',
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
          <span className="text-slate-800 font-semibold">Disclaimer (DMCA)</span>
        </nav>

        {/* 2. Hero Header Banner */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 mb-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-50/70 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="relative z-10 space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold tracking-wide uppercase">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Official Legal Disclaimer &amp; DMCA Copyright Policy</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Disclaimer (DMCA)
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Last Updated: <strong>22nd Sep. 2026</strong></span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Jurisdiction: <strong>Republic of India</strong></span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status: In Effect</span>
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed pt-2">
              All data (Study Materials, logos, pictures, brands, media, and exam resources) presented on{' '}
              <strong className="text-slate-900">educationmasters.in</strong> are published strictly for educational, informational, and candidate awareness purposes. We respect intellectual property rights and operate under applicable digital copyright guidelines and safe harbor principles.
            </p>
          </div>
        </div>

        {/* 3. 2-Column Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Sticky Table of Contents Navigation (4 Cols) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Table of Contents</span>
                </h2>
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                  11 Clauses
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

              {/* Quick Legal Help Box */}
              <div className="mt-5 pt-4 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-4 rounded-b-2xl">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>DMCA Takedown Desk</span>
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-2.5">
                  Have a copyright infringement claim or urgent takedown request?
                </p>
                <a
                  href="mailto:contact@educationmasters.in"
                  className="inline-flex items-center justify-center w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition gap-1.5 shadow-2xs"
                >
                  <span>contact@educationmasters.in</span>
                </a>
              </div>
            </div>

            {/* DMCA Badge Card */}
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-emerald-400 bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">DMCA Compliant Portal</h4>
                  <p className="text-[11px] text-slate-300">Safe Harbor Protocol Active</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-3 pt-3 border-t border-slate-700/60">
                We strictly adhere to copyright protection policies, responding to all verified takedown notices within 2–3 business days.
              </p>
            </div>
          </aside>

          {/* Right Column: Structured Detailed Content Cards (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">

            {/* Section 1: General Disclaimer */}
            <section
              id="general-disclaimer"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  1
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Copyright className="w-5 h-5 text-blue-600" />
                  <span>General Disclaimer (DMCA)</span>
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                All the data (including Study Materials, logos, pictures, brand names, trademarks, and multimedia assets) shown on{' '}
                <strong className="text-slate-900">educationmasters.in</strong> are the exclusive property of their respective copyright and trademark owners. We do not claim any copyright, authorship, or exclusive ownership over the aforementioned third-party content.
              </p>

              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 text-xs sm:text-sm text-blue-900 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-blue-800">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Educational Fair Use &amp; Non-Commercial Repository</span>
                </div>
                <p className="text-blue-800/90 leading-relaxed">
                  Education Masters provides study notes, MCQs, syllabus breakdowns, and exam updates solely for the academic preparation, career advancement, and informational benefit of government job candidates across India.
                </p>
              </div>
            </section>

            {/* Section 2: Public Domain & Third Party Links */}
            <section
              id="public-domain"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  2
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <span>Public Domain Sourcing &amp; Third-Party Hosting Links</span>
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                All data, references, and study notes on <strong className="text-slate-900">educationmasters.in</strong> were collected and curated from different publicly accessible sources, official government career portals, gazettes, and websites considered to be in the public domain.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                All external download and resource links found on this portal are hosted on third-party cloud hosting servers and internet repositories (such as Uppit, ZippyShare, Mediafire, Datafilehost, JagranJosh, Google Drive, and official recruitment servers).
              </p>

              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs sm:text-sm text-amber-900 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>No Direct File Hosting Notice</span>
                </div>
                <p className="text-amber-800/90 leading-relaxed">
                  We do not host or store any unauthorized media or copyrighted files directly on our web servers. If a file is hosted on an external service, please contact the appropriate third-party hosting site directly for permanent file removal from their servers.
                </p>
              </div>
            </section>

            {/* Section 3: Copyright Removal Request (a) */}
            <section
              id="removal-process"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  3
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-blue-600" />
                  <span>(a.) Copyright Removal Request Process</span>
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                If your copyrighted material has been posted on <strong className="text-slate-900">educationmasters.in</strong> or if links to your copyrighted material are returned through our search engine and you want this material removed, you must provide a written communication that details the specific legal elements listed in Section 4.
              </p>

              {/* Statutory Legal Warning */}
              <div className="border-l-4 border-rose-500 bg-rose-50/60 p-4 rounded-r-xl space-y-2 text-rose-950">
                <div className="flex items-center gap-2 font-bold text-rose-900 text-xs sm:text-sm">
                  <BadgeAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Legal Liability Warning for Misrepresentation</span>
                </div>
                <p className="text-xs sm:text-sm text-rose-900/90 leading-relaxed">
                  Please be aware that you will be liable for damages (including legal costs and attorneys&apos; fees) if you knowingly misrepresent that material listed on our site is infringing upon your copyrights. We strongly suggest that you first consult an attorney or legal counsel for assistance before filing a formal notice.
                </p>
              </div>
            </section>

            {/* Section 4: Required Claim Elements (b) */}
            <section
              id="claim-elements"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  4
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-600" />
                  <span>(b.) Mandatory Elements for Infringement Claims</span>
                </h2>
              </div>

              <p className="text-sm text-slate-600">
                To ensure immediate and compliant processing under DMCA &amp; Indian Copyright Act provisions, your written notice must include all 6 required elements below:
              </p>

              <div className="space-y-3 pt-1">
                
                {/* Element 1 */}
                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Proof of Authority</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      Provide clear evidence and documentation establishing that you are the authorized person or legal representative acting on behalf of the owner of an exclusive right that is allegedly infringed.
                    </p>
                  </div>
                </div>

                {/* Element 2 */}
                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Sufficient Contact Information</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      Provide comprehensive contact details so our legal team may contact you, including your full legal name, physical mailing address, telephone number, and a valid corporate/official email address.
                    </p>
                  </div>
                </div>

                {/* Element 3 */}
                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Identification of Infringed Work &amp; Exact URLs</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      Identify in sufficient detail the copyrighted work claimed to have been infringed, including at least one search query or the exact web page URL(s) on <code className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono">educationmasters.in</code> where the material appears.
                    </p>
                  </div>
                </div>

                {/* Element 4 */}
                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Good Faith Statement</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      A formal statement confirming that: <em>&ldquo;The complaining party has a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.&rdquo;</em>
                    </p>
                  </div>
                </div>

                {/* Element 5 */}
                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    5
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Statement Under Penalty of Perjury</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      A statement confirming that: <em>&ldquo;The information in this notification is accurate, and under penalty of perjury, that the complaining party is authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.&rdquo;</em>
                    </p>
                  </div>
                </div>

                {/* Element 6 */}
                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    6
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Physical or Electronic Signature</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      Must be signed with a physical or electronic signature by the authorized person acting on behalf of the owner of the exclusive right that is allegedly infringed.
                    </p>
                  </div>
                </div>

              </div>
            </section>

            {/* Section 5: Notice Submission Email (c) */}
            <section
              id="notice-submission"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  5
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  <span>(c.) Notice Submission &amp; Official Address</span>
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                Please send the complete written infringement notice containing all required elements to our designated copyright and grievance desk via email:
              </p>

              {/* Email Callout Box */}
              <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border-2 border-blue-300/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-700">Official DMCA Grievance Email</div>
                  <div className="text-lg sm:text-xl font-extrabold text-blue-950 font-mono">contact@educationmasters.in</div>
                  <div className="text-[11px] text-slate-600">Subject Line: &ldquo;DMCA Takedown Request - [Specific Topic/URL]&rdquo;</div>
                </div>

                <a
                  href="mailto:contact@educationmasters.in?subject=DMCA%20Takedown%20Request%20-%20EducationMasters"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow flex items-center gap-1.5 shrink-0"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Notice Email</span>
                </a>
              </div>
            </section>

            {/* Section 6: Response SLA (d) */}
            <section
              id="response-sla"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  6
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>(d.) Response Timeframe &amp; Expedited Processing</span>
                </h2>
              </div>

              <div className="space-y-3 text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                <p>
                  Please allow <strong className="text-slate-900 font-semibold">2–3 business days</strong> (48 to 72 business hours) for an email response and content verification from our compliance team.
                </p>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs sm:text-sm text-slate-700 space-y-1">
                  <span className="font-bold text-slate-900">Important Advisory on 3rd Party Communications:</span>
                  <p className="text-slate-600 leading-relaxed">
                    Note that emailing your complaint to third parties, hosting providers, or our Internet Service Provider (ISP) will <em>not</em> expedite your request and may cause unnecessary administrative delays due to improper filing. Direct submission to our designated grievance email ensures immediate investigation and removal.
                  </p>
                </div>

                <p className="text-xs text-slate-500 italic pt-1">
                  Thanks for your cooperation in maintaining an ethical, legal, and student-first learning ecosystem.
                </p>
              </div>
            </section>

            {/* Section 7: Non-Governmental Entity Notice */}
            <section
              id="non-govt-entity"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-sm font-bold shrink-0">
                  7
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-amber-600" />
                  <span>Non-Governmental Entity &amp; Autonomous Notice</span>
                </h2>
              </div>

              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-xs sm:text-sm text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Official Statutory Disclaimer</span>
                </div>
                <p className="leading-relaxed">
                  <strong>EducationMasters.in</strong> is an independent, privately managed educational and career resource portal. We are <strong>NOT</strong> affiliated, associated, authorized, endorsed by, or in any way officially connected with any government agency, ministry, department, or recruitment board of India (including UPSC, SSC, IBPS, State PSCs, NTA, CBSE, Indian Railways, or Defence Boards).
                </p>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                All government job notifications, admit card alerts, and examination results are compiled from publicly available official gazettes, press releases, and authorized departmental portals solely for candidate facilitation.
              </p>
            </section>

            {/* Section 8: Exam Information Accuracy */}
            <section
              id="exam-accuracy"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  8
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>Examination Information &amp; Student Advisory</span>
                </h2>
              </div>

              <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                <p>
                  While we take rigorous precautions to verify every date, syllabus point, eligibility criterion, and cut-off figure, government examination boards reserve the right to alter dates, cancel exams, or revise vacancies at any moment.
                </p>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700">
                  <strong className="text-slate-900 font-bold block mb-1">Student Candidate Advisory:</strong>
                  Candidates and aspirants are strongly advised to always cross-check and verify examination notifications, eligibility criteria, application fee payment details, and admit card download links directly with the respective official government board website before taking any financial or career decision.
                </div>
              </div>
            </section>

            {/* Section 9: Advertisements & External Links */}
            <section
              id="ads-third-party"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  9
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-blue-600" />
                  <span>Third-Party Advertisements &amp; External Links</span>
                </h2>
              </div>

              <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                <p>
                  <strong className="text-slate-900">EducationMasters.in</strong> may display third-party advertisements (such as Google AdSense, direct banners, and educational sponsorships) and contain hyperlinks to external third-party websites.
                </p>

                <p className="text-xs sm:text-sm text-slate-600">
                  We have no control over the content, privacy practices, terms, or services offered by external websites. Inclusion of any advertisement or outbound link does not constitute an endorsement, guarantee, or warranty of the products or claims made by external vendors.
                </p>
              </div>
            </section>

            {/* Section 10: Limitation of Liability */}
            <section
              id="liability"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  10
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-600" />
                  <span>Limitation of Liability &amp; No Warranty</span>
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                To the fullest extent permitted by applicable Indian laws, <strong className="text-slate-900">EducationMasters.in</strong>, its founders, operators, employees, and authors shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of your access to, use of, or inability to use this website, or any reliance placed upon the materials provided herein.
              </p>
            </section>

            {/* Section 11: Grievance Officer & Legal Contact */}
            <section
              id="contact"
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-24 space-y-5"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  11
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span>Grievance Officer &amp; Legal Communication</span>
                </h2>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">
                In accordance with the Information Technology Act, 2000 and Rules made thereunder, as well as digital copyright compliance standards, the contact details of our Grievance Desk are provided below:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                
                {/* Email Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wide">
                    <Mail className="w-4 h-4" />
                    <span>Official Email</span>
                  </div>
                  <a
                    href="mailto:contact@educationmasters.in"
                    className="text-sm font-bold text-slate-900 hover:text-blue-600 transition block font-mono"
                  >
                    contact@educationmasters.in
                  </a>
                  <p className="text-[11px] text-slate-500">
                    Expected response: 24 to 72 business hours
                  </p>
                </div>

                {/* Office Location Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wide">
                    <Building2 className="w-4 h-4" />
                    <span>Headquarters</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    Education Masters HQ
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Dehradun, Uttarakhand, Republic of India
                  </p>
                </div>

              </div>

              {/* Bottom Quick Links to other Legal Pages */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 font-medium">Related Legal Documents:</span>
                <div className="flex items-center gap-3">
                  <Link
                    href="/terms-of-service"
                    className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Terms of Service</span>
                    <ArrowRight className="w-3 h-3" />
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
