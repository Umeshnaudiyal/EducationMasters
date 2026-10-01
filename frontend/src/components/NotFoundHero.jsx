'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Home,
  ArrowLeft,
  Search,
  Sparkles,
  HelpCircle,
  BookOpen,
  GraduationCap,
  Award,
  ArrowRight,
  X
} from 'lucide-react';
import { fireConfetti } from '@/utils/confetti';

const MOTIVATIONAL_QUOTES = [
  "🎯 “Success is the sum of small efforts repeated day in and day out.” — Keep going!",
  "🚀 “Every wrong turn is just a revision question waiting to be mastered!”",
  "🌟 “AIR 1 wasn't built in a day. Let's redirect back to your preparation!”",
  "📚 “The syllabus is huge, but your determination is bigger. Don't lose focus!”",
  "💡 “Don't worry, even the hardest UPSC & SSC exams have grace marks!”"
];

export default function NotFoundHero() {
  const router = useRouter();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHoveredPortal, setIsHoveredPortal] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const heroRef = useRef(null);
  const inputRef = useRef(null);

  // 3D Parallax calculation on mouse move
  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x: x * 16, y: y * 16 });
  };

  const handlePortalClick = (e) => {
    fireConfetti(e?.clientX, e?.clientY);
    setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen h-screen w-full bg-[#050c18] bg-radial from-[#0c2340] via-[#081528] to-[#040a14] text-white flex flex-col justify-between items-center py-6 px-4 sm:px-6 lg:px-8 overflow-hidden selection:bg-blue-600 selection:text-white"
    >
      {/* 1. Blueprint Grid Background Layer */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />

      {/* 2. Ambient Glow Spheres */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-float-reverse" />

      {/* 3. Subtle Math & Academic Symbols in Backdrop */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-20 text-blue-300/40 font-mono font-bold">
        <span className="absolute top-8 left-[8%] text-lg sm:text-2xl animate-float-slow">∫ f(x)dx</span>
        <span className="absolute top-16 right-[10%] text-xl sm:text-3xl animate-float">π ≈ 3.14159</span>
        <span className="absolute top-1/2 left-[4%] text-base sm:text-xl animate-float-reverse">E = mc²</span>
        <span className="absolute bottom-16 right-[8%] text-lg sm:text-2xl animate-float-slow">Δ = b² - 4ac</span>
        <span className="absolute bottom-20 left-[12%] text-xl sm:text-3xl animate-float">∑ i=1..n</span>
        <span className="absolute top-12 left-[42%] text-sm sm:text-lg animate-float-reverse">sin²θ + cos²θ = 1</span>
        <span className="absolute bottom-10 right-[28%] text-base sm:text-xl animate-float">Ω • λ</span>
      </div>

      {/* TOP HEADER: LOGO AT TOP LEFT & ERROR BADGE AT TOP RIGHT */}
      <header className="relative z-20 w-full max-w-6xl flex items-center justify-between">
        {/* /logo.webp at top left */}
        <Link 
          href="/" 
          className="inline-block transition-transform duration-200 hover:scale-105 cursor-pointer"
          title="Return to Education Masters"
        >
          <img 
            src="/logo.webp" 
            alt="Education Masters" 
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all"
          />
        </Link>

        {/* Top Error 404 Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-400/40 text-blue-200 text-xs sm:text-sm font-semibold tracking-wide shadow-lg shadow-blue-950/60 backdrop-blur-md hover:border-blue-300 transition cursor-default">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block -ml-3.5" />
          <span className="text-amber-300 font-bold uppercase tracking-wider">ERROR 404</span>
          <span className="text-blue-400 hidden sm:inline">•</span>
          <span className="hidden sm:inline">Question Out Of Syllabus</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
      </header>

      {/* CENTERPIECE 404 INTERACTIVE EXPERIENCE */}
      <main className="relative max-w-3xl mx-auto w-full flex flex-col items-center text-center z-10 my-auto py-2">
        
        {/* 3D PARALLAX ANIMATED 404 ARTWORK */}
        <div
          className="relative select-none cursor-pointer transition-transform duration-200 ease-out"
          style={{
            transform: `perspective(1000px) rotateX(${-mousePos.y}deg) rotateY(${mousePos.x}deg)`,
          }}
          onClick={handlePortalClick}
          onMouseEnter={() => setIsHoveredPortal(true)}
          onMouseLeave={() => setIsHoveredPortal(false)}
          title="Click the Portal for positive exam energy!"
        >
          {/* Main 404 Container */}
          <div className="flex items-center justify-center gap-2 sm:gap-5 md:gap-7">
            
            {/* Left '4' */}
            <div className="relative font-black text-7xl sm:text-9xl md:text-[9.5rem] leading-none tracking-tighter">
              <span className="bg-gradient-to-br from-blue-400 via-indigo-300 to-blue-600 bg-clip-text text-transparent drop-shadow-[0_10px_35px_rgba(59,130,246,0.6)]">
                4
              </span>
              {/* Floating Academic Pen Badge */}
              <div className="absolute -top-3 -left-3 sm:-top-5 sm:-left-5 w-8 h-8 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 border-2 border-white/20 shadow-xl flex items-center justify-center transform -rotate-12 animate-float">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>

            {/* Center '0' - The Exam Wormhole / Radar Portal */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 flex items-center justify-center">
              
              {/* Outer Glowing Rings */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-400/40 animate-radar-sweep" />
              <div className="absolute inset-2 sm:inset-2.5 rounded-full border border-indigo-400/30 animate-pulse-glow" />
              <div className="absolute inset-4 sm:inset-5 rounded-full border border-amber-400/20" />

              {/* Portal Center Core */}
              <div className={`relative w-20 h-20 sm:w-26 sm:h-26 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-[#0f172a] via-[#1e1b4b] to-[#1e293b] border-2 ${isHoveredPortal ? 'border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.6)] scale-105' : 'border-blue-400/80 shadow-[0_0_40px_rgba(59,130,246,0.5)]'} transition-all duration-500 flex items-center justify-center overflow-hidden`}>
                
                {/* Radar Sweep Light */}
                <div 
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-400/20 to-amber-300/30 origin-center animate-radar-sweep pointer-events-none"
                  style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%)' }}
                />

                {/* Question mark that glows or turns into sparkles on hover */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center">
                  {isHoveredPortal ? (
                    <div className="transform scale-110 transition-all duration-300">
                      <Sparkles className="w-7 h-7 sm:w-10 sm:h-10 text-amber-300 animate-pulse" />
                      <span className="text-[8px] sm:text-[9px] font-bold text-amber-200 uppercase tracking-widest mt-0.5 block">
                        CLICK ME!
                      </span>
                    </div>
                  ) : (
                    <div className="transition-all duration-300">
                      <HelpCircle className="w-7 h-7 sm:w-10 sm:h-10 text-blue-300 animate-pulse" />
                      <span className="text-[7px] sm:text-[9px] font-mono text-blue-300/80 block mt-0.5">
                        LOST
                      </span>
                    </div>
                  )}
                </div>

                {/* Orbiting Satellite Book & Paper Airplane */}
                <div className="absolute w-full h-full animate-orbit pointer-events-none">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500/90 text-white flex items-center justify-center shadow-lg transform -translate-x-2 -translate-y-2">
                    <span className="text-[9px] sm:text-xs">✈️</span>
                  </div>
                </div>

                <div className="absolute w-full h-full animate-orbit-reverse pointer-events-none">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-lg transform translate-x-2 translate-y-2">
                    <span className="text-[9px] sm:text-xs">📝</span>
                  </div>
                </div>
              </div>

              {/* Floating Graduation Cap with swinging tassel over the '0' */}
              <div className="absolute -top-5 sm:-top-8 md:-top-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none animate-float">
                <div className="relative">
                  <GraduationCap className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 text-amber-400 drop-shadow-[0_8px_20px_rgba(245,158,11,0.5)] transform -rotate-6" />
                  {/* Tassel */}
                  <div className="absolute top-3.5 sm:top-5 right-1.5 sm:right-2.5 w-1 sm:w-1.5 h-4 sm:h-6 bg-amber-300 rounded-full shadow-md animate-tassel" />
                </div>
              </div>

              {/* Floating Cutoff Pill */}
              <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-blue-950/90 border border-blue-400/50 text-[8px] sm:text-[10px] font-mono text-blue-200 shadow-md whitespace-nowrap animate-float-reverse">
                Page Cutoff: 0.00%
              </div>
            </div>

            {/* Right '4' */}
            <div className="relative font-black text-7xl sm:text-9xl md:text-[9.5rem] leading-none tracking-tighter">
              <span className="bg-gradient-to-br from-indigo-300 via-blue-400 to-sky-500 bg-clip-text text-transparent drop-shadow-[0_10px_35px_rgba(59,130,246,0.6)]">
                4
              </span>
              {/* Floating Award / Medal Badge */}
              <div className="absolute -bottom-1.5 -right-2 sm:-bottom-3 sm:-right-4 w-8 h-8 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 border-2 border-white/20 shadow-xl flex items-center justify-center transform rotate-12 animate-float-reverse">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
              </div>
            </div>

          </div>

          <p className="text-[10px] sm:text-xs text-blue-300/70 mt-2.5 font-mono flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Interactive Portal • Click the Zero for Lucky Exam Confetti</span>
          </p>
        </div>

        {/* Motivational Quote Bar */}
        <div className="w-full max-w-lg mt-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-blue-950/70 border border-blue-500/30 backdrop-blur-md shadow-lg shadow-black/20 text-center transition-all duration-300">
          <p className="text-xs sm:text-sm text-blue-100 font-medium italic">
            {MOTIVATIONAL_QUOTES[quoteIndex]}
          </p>
        </div>

        {/* Headings */}
        <div className="mt-4 max-w-xl space-y-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
            Looks Like This Page{' '}
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
              Skipped The Exam!
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            The exam notification, admit card, or answer key you are searching for might have been relocated, rescheduled, or removed. Don&apos;t worry—your preparation continues right here!
          </p>
        </div>

        {/* INTEGRATED SEARCH BAR (CLEAN, NO TRENDING PILLS) */}
        <div className="w-full max-w-lg mt-5">
          <form onSubmit={handleSearchSubmit} className="relative group">
            <div
              className={`flex items-center gap-2.5 sm:gap-3 w-full bg-slate-900/90 border-2 ${
                isSearchFocused
                  ? 'border-blue-500 ring-4 ring-blue-500/20 bg-slate-900'
                  : 'border-blue-900/60 hover:border-blue-700/80'
              } rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 transition-all shadow-xl backdrop-blur-md`}
            >
              <Search className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isSearchFocused ? 'text-blue-400' : 'text-slate-400'}`} />
              
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search exams, admit cards, results, MCQs..."
                className="w-full bg-transparent text-white text-xs sm:text-sm font-medium placeholder-slate-400 focus:outline-none"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-white p-1 rounded-md transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* TWO PRIMARY ACTION BUTTONS ONLY */}
        <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full max-w-md">
          
          {/* 1. Return Home Button */}
          <Link
            href="/"
            className="shimmer-effect group relative inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_10px_25px_-5px_rgba(37,99,235,0.6)] hover:shadow-[0_15px_30px_-5px_rgba(37,99,235,0.8)] transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer flex-1 min-w-[150px]"
          >
            <Home className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>Return to Homepage</span>
          </Link>

          {/* 2. Previous Page Button */}
          <button
            onClick={handleBack}
            className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm text-slate-200 bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700/80 hover:border-slate-500 shadow-md backdrop-blur-md transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer flex-1 min-w-[140px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Page</span>
          </button>

        </div>

      </main>

      {/* FOOTER BAR */}
      <footer className="relative z-20 w-full max-w-5xl text-center py-2 text-[11px] sm:text-xs text-slate-400/80 font-medium">
        <span>© {new Date().getFullYear()} Education Masters • India&apos;s #1 Govt Job Prep Platform</span>
      </footer>

    </div>
  );
}
