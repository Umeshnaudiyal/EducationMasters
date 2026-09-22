import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import LiveTicker from '@/components/LiveTicker';
import Footer from '@/components/Footer';
import {
  ShieldCheck,
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
  Flame,
} from 'lucide-react';

export const metadata = {
  title: 'Terms of Service & User Agreement | Education Masters',
  description:
    'Read the official Terms of Service and user agreement for EducationMasters.in. Understand our educational platform guidelines, non-governmental disclaimers, intellectual property policies, and user responsibilities.',
  keywords:
    'Education Masters terms of service, user agreement, terms and conditions, educational portal policy, legal disclaimer, website terms',
  alternates: {
    canonical: 'https://educationmasters.in/terms-of-service/',
  },
  openGraph: {
    title: 'Terms of Service | Education Masters',
    description:
      'Official Terms of Service and User Guidelines for EducationMasters.in. Read our platform purpose, content accuracy disclaimers, and user policies.',
    url: 'https://educationmasters.in/terms-of-service/',
    siteName: 'Education Masters',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | Education Masters',
    description:
      'Official Terms of Service and User Guidelines for EducationMasters.in.',
  },
};

const SECTIONS = [
  { id: 'purpose', number: '1', title: 'Purpose of the Website' },
  { id: 'user-responsibilities', number: '2', title: 'User Responsibilities' },
  { id: 'content-accuracy', number: '3', title: 'Content Accuracy' },
  { id: 'external-links', number: '4', title: 'External Links & Third Parties' },
  { id: 'intellectual-property', number: '5', title: 'Intellectual Property Rights' },
  { id: 'advertisements', number: '6', title: 'Advertisement and Affiliates' },
  { id: 'privacy', number: '7', title: 'Privacy & Data Protection' },
  { id: 'disclaimer', number: '8', title: 'Non-Governmental Disclaimer' },
  { id: 'liability', number: '9', title: 'Limitation of Liability' },
  { id: 'modifications', number: '10', title: 'Modifications to Terms' },
  { id: 'contact', number: '11', title: 'Contact Us & Grievances' },
];

export default function TermsOfServicePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms of Service - Education Masters',
    description:
      'Official Terms of Service, user agreement, and platform policies of EducationMasters.in.',
    url: 'https://educationmasters.in/terms-of-service/',
    publisher: {
      '@type': 'Organization',
      name: 'Education Masters',
      url: 'https://educationmasters.in',
      logo: 'https://educationmasters.in/logo.webp',
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 font-sans antialiased">
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
          <span className="text-slate-400">Legal & Policies</span>
          <span>›</span>
          <span className="text-slate-800 font-semibold">Terms of Service</span>
        </nav>

        {/* 2. Hero Header Banner */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 mb-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/60 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="relative z-10 space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-xs font-bold tracking-wide uppercase">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              <span>Legal Document & User Agreement</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Terms of Service
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Last Updated: <strong>15th Oct. 2026</strong></span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Applicable Jurisdiction: <strong>Republic of India</strong></span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status: Currently Active</span>
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed pt-2">
              Welcome to <strong>EducationMasters.in</strong>! These Terms of Service (&ldquo;Terms&rdquo;, &ldquo;Agreement&rdquo;) govern your access to and use of our website{' '}
              <Link href="/" className="text-blue-600 hover:underline font-medium">
                https://educationmasters.in
              </Link>{' '}
              (referred to as &ldquo;the Site&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). By accessing or using our website, you agree to be bound by these Terms. If you do not agree, please discontinue using our website immediately.
            </p>
          </div>
        </div>

        {/* 3. 2-Column Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR: Table of Contents & Trust Widgets */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-20 space-y-5">
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Table of Contents
                </h2>
              </div>

              <nav className="space-y-1">
                {SECTIONS.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/70 transition group"
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0 transition">
                      {sec.number}
                    </span>
                    <span className="truncate">{sec.title}</span>
                  </a>
                ))}
              </nav>
            </div>

            {/* Non-Governmental Advisory Badge */}
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 space-y-2 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Important Advisory</span>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-900/90">
                Education Masters is an independent informational and education platform. We do not represent any government authority. Always verify recruitment dates on official gazettes.
              </p>
            </div>

            {/* Quick Contact Box */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 text-xs space-y-2 shadow-xs">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Questions regarding Terms?</span>
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Contact our compliance desk at{' '}
                <a
                  href="mailto:contact@educationmasters.in"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  contact@educationmasters.in
                </a>
              </p>
            </div>
          </aside>

          {/* RIGHT MAIN CONTENT AREA: 11 Detailed Structured Sections */}
          <div className="col-span-1 lg:col-span-8 space-y-6">

            {/* Section 1: Purpose of the Website */}
            <section
              id="purpose"
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs scroll-mt-24 space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200">
                  1
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Purpose of the Website
                </h2>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-normal">
                <strong>EducationMasters.in</strong> is an educational and informational platform dedicated to providing students, job seekers, and educators with:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {[
                  'Latest updates on education news and circulars',
                  'Government and private job vacancy alerts',
                  'Exam notifications, admit cards & results',
                  'Subject-wise MCQs, syllabus & career guidance',
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-800 font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-blue-50/70 border-l-4 border-blue-600 rounded-r-lg text-xs text-blue-950 space-y-1">
                <p className="font-semibold">Informational Purpose Notice:</p>
                <p className="text-blue-900/90 leading-relaxed font-normal">
                  Our content is intended strictly for informational and preparation purposes only and should not be considered official or final unless verified from respective government or institutional sources.
                </p>
              </div>
            </section>

            {/* Section 2: User Responsibilities */}
            <section
              id="user-responsibilities"
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs scroll-mt-24 space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200">
                  2
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  User Responsibilities
                </h2>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-normal">
                By using our website, you expressly agree and undertake:
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                  <span>
                    <strong>Not to misuse the website:</strong> You shall not interfere with, disrupt, or attempt unauthorized access to our servers, database, or network architecture.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                  <span>
                    <strong>Not to post or share unauthorized material:</strong> Users must not post or share false, misleading, defamatory, or copyrighted content without explicit permission.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                  <span>
                    <strong>Compliance with Laws:</strong> To respect intellectual property and comply with all applicable Indian laws, including the Information Technology Act, 2000.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                  <span>
                    <strong>Personal Verification:</strong> Users are solely responsible for independently verifying any job notification, eligibility criterion, fee, or exam date before taking any financial or career decision.
                  </span>
                </li>
              </ul>
            </section>

            {/* Section 3: Content Accuracy */}
            <section
              id="content-accuracy"
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs scroll-mt-24 space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200">
                  3
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Content Accuracy
                </h2>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-normal">
                We strive to ensure that all information on EducationMasters.in is accurate, authentic, and up-to-date. However, because examination schedules and official guidelines are frequently amended by recruitment boards, we do not guarantee the completeness, reliability, or real-time accuracy of all posted data.
              </p>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Notice of Non-Liability: </span>
                EducationMasters.in and its authors will not be held liable for any loss, inadvertent error, or damage resulting from the use of or reliance on the published content.
              </div>
            </section>

            {/* Section 4: External Links */}
            <section
              id="external-links"
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs scroll-mt-24 space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200">
                  4
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  External Links
                </h2>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-normal">
                Our website may contain outbound links to third-party portals, government department sites, online application portals, and institutional servers for the convenience of candidates.
              </p>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                We do not control, monitor, or endorse the content, policies, security standards, or practices of any third-party websites. Users are strongly advised to review the terms and privacy policies of any external website before interacting with or submitting personal data to them.
              </p>
            </section>

            {/* Section 5: Intellectual Property Rights */}
            <section
              id="intellectual-property"
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs scroll-mt-24 space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200">
                  5
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Intellectual Property Rights
                </h2>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-normal">
                All original articles, guides, graphics, brand logos, practice quizzes, and editorial content published on EducationMasters.in are the intellectual property of Education Masters unless otherwise stated or attributed to public domain government notifications.
              </p>

              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>Strict Prohibition:</strong> Unauthorized copying, reproduction, automated scraping, or redistribution of our content for commercial purposes is strictly prohibited without prior written consent.
                </span>
              </div>
            </section>

            {/* Section 6: Advertisement and Affiliates */}
            <section
              id="advertisements"
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs scroll-mt-24 space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200">
                  6
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Advertisement and Affiliates
                </h2>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-normal">
                We may display programmatic advertisements (such as Google AdSense), sponsored links, or affiliate partner promotions to maintain our free educational infrastructure.
              </p>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                We are not responsible for any third-party offers, products, claims, or transactions conducted through these advertisements. Users should independently verify all claims and product specifications before engaging with third-party advertisers.
              </p>
            </section>

            {/* Section 7: Privacy */}
            <section
              id="privacy"
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs scroll-mt-24 space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200">
                  7
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Privacy
                </h2>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-normal">
                Your privacy and personal data security are of vital importance to us. Please refer to our comprehensive{' '}
                <Link href="/privacy-policy" className="text-blue-600 hover:underline font-semibold">
                  Privacy Policy
                </Link>{' '}
                to understand how we collect, process, store, and safeguard your data when using our website and services.
              </p>
            </section>

            {/* Section 8: Disclaimer */}
            <section
              id="disclaimer"
              className="bg-white border border-amber-200/90 rounded-2xl p-6 shadow-xs scroll-mt-24 space-y-4 hover:border-amber-300 transition bg-gradient-to-b from-white to-amber-50/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm border border-amber-300">
                  8
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Disclaimer
                </h2>
              </div>

              <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                <p className="font-medium text-slate-900">
                  EducationMasters.in does not represent, claim affiliation with, or endorse any government organization, department, or ministry.
                </p>
                <p className="text-xs sm:text-sm text-slate-600">
                  All educational content, employment alerts, syllabus outlines, and examination notifications published on this portal are collected and aggregated from official government portals, recruitment gazettes, employment news bulletins, and verified public sources for the educational benefit of candidates.
                </p>
              </div>
            </section>

            {/* Section 9: Limitation of Liability */}
            <section
              id="liability"
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs scroll-mt-24 space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200">
                  9
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Limitation of Liability
                </h2>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-normal">
                In no event shall <strong>EducationMasters.in</strong>, its editorial team, founders, partners, or affiliates be liable for any direct, indirect, incidental, consequential, special, or punitive damages arising out of your access to, reliance on, or inability to use this website.
              </p>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                This includes, without limitation, loss of employment opportunity, exam application delays, financial losses, or technical disruptions.
              </p>
            </section>

            {/* Section 10: Modifications to Terms */}
            <section
              id="modifications"
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs scroll-mt-24 space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200">
                  10
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Modifications to Terms
                </h2>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-normal">
                We reserve the right to review, modify, or update these Terms of Service at any time without prior individual notice.
              </p>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                The latest version will always be published on this page with an updated &ldquo;Last Updated&rdquo; timestamp. Your continued use of the website following the posting of any modifications signifies your binding acceptance of the updated Terms.
              </p>
            </section>

            {/* Section 11: Contact Us */}
            <section
              id="contact"
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs scroll-mt-24 space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200">
                  11
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Contact Us
                </h2>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-normal">
                If you have any questions, feedback, or legal inquiries regarding these Terms of Service, please reach out to us through the following channels:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Email Support</span>
                  </div>
                  <a
                    href="mailto:contact@educationmasters.in"
                    className="text-xs text-blue-600 hover:underline font-semibold block truncate"
                  >
                    contact@educationmasters.in
                  </a>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Contact Us Portal</span>
                  </div>
                  <Link
                    href="/contact-us"
                    className="text-xs text-blue-600 hover:underline font-semibold block truncate"
                  >
                    https://educationmasters.in/contact-us/
                  </Link>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-500 flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">Official URL:</span>
                <Link
                  href="/terms-of-service"
                  className="text-blue-600 hover:underline"
                >
                  https://educationmasters.in/terms-of-service/
                </Link>
              </div>
            </section>

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
