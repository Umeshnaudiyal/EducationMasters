'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthModal } from '@/context/AuthModalContext';
import { useToast } from '@/context/ToastContext';
import {
  X,
  Sparkles,
  Brain,
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Target,
  BarChart3,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Printer,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  AnimatedSparkles,
  AnimatedZap,
  AnimatedClock,
  AnimatedShieldCheck,
  AnimatedAward,
  AnimatedAiEye,
  AnimatedBrain,
  AnimatedRotateCcw,
} from '@/components/AnimatedIcons';

export default function EduAiAnalysisModal({
  isOpen,
  onClose,
  questions = [],
  userAnswers = {},
  stopwatchSeconds = 0,
  taxonomy = {},
  onJumpToQuestion,
}) {
  const { data: session } = useSession();
  const { openAuthModal } = useAuthModal();
  const { showToast } = useToast();

  const [analyzing, setAnalyzing] = useState(true);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [activeTab, setActiveTab] = useState('subjects'); // 'subjects' | 'insights' | 'matrix'

  // Registered users and 1-question minimum protection
  useEffect(() => {
    if (isOpen) {
      const answeredCount = Object.keys(userAnswers || {}).length;
      if (answeredCount === 0) {
        onClose?.();
        showToast({
          type: 'info',
          title: 'Answer a Question First',
          message: 'Please attempt at least 1 question below before running AI diagnostics.',
          duration: 5000,
        });
        return;
      }

      if (!session?.user) {
        onClose?.();
        openAuthModal({
          mode: 'register',
          mandatory: true,
          preventClose: true,
          title: '🧠 Free Sign In Required',
          subtitle: 'Edu AI diagnostics is available for registered students. Create a free account or log in to view detailed accuracy & speed analytics.',
        });
        showToast({
          type: 'info',
          title: 'Free Sign In Required',
          message: 'Please sign in or create a free account to access Edu AI Performance Analysis.',
          duration: 5000,
        });
      }
    }
  }, [isOpen, session, userAnswers, onClose, openAuthModal, showToast]);

  // Scanning steps for the loader
  const scanningSteps = [
    { label: 'Analyzing question accuracy & timestamps...', icon: Clock },
    { label: 'Categorizing questions by subject domain...', icon: Layers },
    { label: 'Calculating accuracy & speed matrix...', icon: BarChart3 },
    { label: 'Generating personalized recommendations...', icon: Brain },
  ];

  // Snappy 2.2s Animated Scanner on open
  useEffect(() => {
    if (!isOpen) return;

    setAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStep(0);

    const startTime = Date.now();
    const duration = 2200; // 2.2 seconds (snappy & high-tech)

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(Math.round((elapsed / duration) * 100), 100);
      setAnalysisProgress(progress);

      if (progress < 25) setAnalysisStep(0);
      else if (progress < 55) setAnalysisStep(1);
      else if (progress < 85) setAnalysisStep(2);
      else setAnalysisStep(3);

      if (elapsed >= duration) {
        clearInterval(interval);
        setAnalyzing(false);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Comprehensive Subject-Wise & Overall Performance Analytics Calculation
  const analyticsData = useMemo(() => {
    const total = questions.length;
    let attempted = 0;
    let correct = 0;
    let incorrect = 0;

    // Subject Grouping
    const subjectMap = {};

    questions.forEach((q, idx) => {
      const qId = q._id || q.sql_id || idx;
      const userSelected = userAnswers[qId];
      const isAttempted = userSelected !== undefined;

      // Extract correct answer index
      let correctIndex = -1;
      if (Array.isArray(q.options)) {
        correctIndex = q.options.findIndex((opt) => opt.is_correct);
      }
      if (correctIndex === -1 && q.correct_answer) {
        const match = String(q.correct_answer).match(/Option\s*([0-9]+)/i);
        if (match) correctIndex = parseInt(match[1], 10) - 1;
        else if (['A', 'B', 'C', 'D'].includes(String(q.correct_answer).trim().toUpperCase())) {
          correctIndex = String(q.correct_answer).trim().toUpperCase().charCodeAt(0) - 65;
        }
      }

      const isCorrect = isAttempted && userSelected === correctIndex;
      const isIncorrect = isAttempted && !isCorrect;

      if (isAttempted) {
        attempted += 1;
        if (isCorrect) correct += 1;
        else incorrect += 1;
      }

      // Determine subject name dynamically
      let subj =
        q.subject_name ||
        q.subject?.name ||
        q.topic_name ||
        q.topic?.name ||
        q.category ||
        '';

      if (!subj || subj.trim() === '') {
        const text = (q.question_text || q.question || '').toLowerCase();
        if (text.includes('constitution') || text.includes('article') || text.includes('president') || text.includes('parliament') || text.includes('court') || text.includes('amendment')) {
          subj = 'Indian Polity';
        } else if (text.includes('river') || text.includes('mountain') || text.includes('climate') || text.includes('soil') || text.includes('capital') || text.includes('ocean')) {
          subj = 'Geography';
        } else if (text.includes('king') || text.includes('dynasty') || text.includes('war') || text.includes('century') || text.includes('movement') || text.includes('mughal') || text.includes('british')) {
          subj = 'History';
        } else if (text.includes('gravity') || text.includes('chemical') || text.includes('cell') || text.includes('energy') || text.includes('vitamin') || text.includes('acid') || text.includes('physics') || text.includes('biology')) {
          subj = 'General Science';
        } else if (text.includes('gdp') || text.includes('bank') || text.includes('inflation') || text.includes('budget') || text.includes('rbi') || text.includes('tax') || text.includes('economy')) {
          subj = 'Economy';
        } else if (text.includes('ratio') || text.includes('speed') || text.includes('percentage') || text.includes('number') || text.includes('triangle') || text.includes('equation')) {
          subj = 'Quantitative Maths';
        } else if (text.includes('pattern') || text.includes('series') || text.includes('analogy') || text.includes('blood') || text.includes('direction')) {
          subj = 'Reasoning';
        } else {
          subj = taxonomy.name ? `${taxonomy.name}` : 'General Studies';
        }
      }

      if (!subjectMap[subj]) {
        subjectMap[subj] = {
          name: subj,
          total: 0,
          attempted: 0,
          correct: 0,
          incorrect: 0,
          questions: [],
        };
      }

      subjectMap[subj].total += 1;
      if (isAttempted) {
        subjectMap[subj].attempted += 1;
        if (isCorrect) subjectMap[subj].correct += 1;
        else subjectMap[subj].incorrect += 1;
      }
      subjectMap[subj].questions.push({
        index: idx + 1,
        id: qId,
        isAttempted,
        isCorrect,
        isIncorrect,
      });
    });

    const subjectsList = Object.values(subjectMap).map((s) => {
      const accuracy = s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0;
      const coverage = s.total > 0 ? Math.round((s.attempted / s.total) * 100) : 0;
      
      let status = 'Unattempted';
      let statusColor = 'text-slate-500 bg-slate-100 border-slate-200';

      if (s.attempted > 0) {
        if (accuracy >= 80) {
          status = 'Mastered';
          statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
        } else if (accuracy >= 60) {
          status = 'Proficient';
          statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
        } else if (accuracy >= 40) {
          status = 'Needs Focus';
          statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
        } else {
          status = 'Needs Practice';
          statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
        }
      }

      return {
        ...s,
        accuracy,
        coverage,
        status,
        statusColor,
      };
    });

    subjectsList.sort((a, b) => b.total - a.total);

    const overallAccuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const unattempted = total - attempted;
    const avgTimePerQuestion = attempted > 0 ? (stopwatchSeconds / attempted).toFixed(1) : 0;

    // AI Performance Rating (Concise verdicts)
    let aiGrade = 'Beginner';
    let aiGradeColor = 'from-slate-700 to-slate-900';
    let aiVerdict = 'Attempt more questions for deeper insights.';

    if (attempted > 0) {
      if (overallAccuracy >= 85 && attempted >= total * 0.3) {
        aiGrade = 'A+ Master';
        aiGradeColor = 'from-emerald-600 via-teal-600 to-emerald-800';
        aiVerdict = 'Exceptional accuracy & concept mastery.';
      } else if (overallAccuracy >= 70) {
        aiGrade = 'A Proficient';
        aiGradeColor = 'from-blue-600 via-indigo-600 to-blue-800';
        aiVerdict = 'Strong core knowledge. Minor review needed.';
      } else if (overallAccuracy >= 50) {
        aiGrade = 'B Intermediate';
        aiGradeColor = 'from-indigo-600 via-purple-600 to-indigo-800';
        aiVerdict = 'Good start. Focus on weak subjects.';
      } else if (overallAccuracy >= 35) {
        aiGrade = 'C Developing';
        aiGradeColor = 'from-amber-600 via-orange-600 to-amber-800';
        aiVerdict = 'Moderate accuracy. Review solutions.';
      } else {
        aiGrade = 'Needs Practice';
        aiGradeColor = 'from-rose-600 via-red-600 to-rose-800';
        aiVerdict = 'Review step-by-step explanations.';
      }
    }

    const attemptedSubjects = subjectsList.filter((s) => s.attempted > 0);
    const strongestSubject =
      attemptedSubjects.length > 0
        ? [...attemptedSubjects].sort((a, b) => b.accuracy - a.accuracy)[0]
        : null;
    const weakestSubject =
      attemptedSubjects.length > 0
        ? [...attemptedSubjects].sort((a, b) => a.accuracy - b.accuracy)[0]
        : null;

    return {
      total,
      attempted,
      correct,
      incorrect,
      unattempted,
      overallAccuracy,
      avgTimePerQuestion,
      aiGrade,
      aiGradeColor,
      aiVerdict,
      subjectsList,
      strongestSubject,
      weakestSubject,
    };
  }, [questions, userAnswers, stopwatchSeconds, taxonomy]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const handleReAnalyze = () => {
    setAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStep(0);
    const startTime = Date.now();
    const duration = 2000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(Math.round((elapsed / duration) * 100), 100);
      setAnalysisProgress(progress);
      if (progress < 25) setAnalysisStep(0);
      else if (progress < 50) setAnalysisStep(1);
      else if (progress < 75) setAnalysisStep(2);
      else setAnalysisStep(3);

      if (elapsed >= duration) {
        clearInterval(interval);
        setAnalyzing(false);
      }
    }, 40);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* Background Click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Analysis Modal Card */}
      <div className="relative w-full max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between border-b border-indigo-900/50 shrink-0">
          
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-900/40 rounded-[10px] flex items-center justify-center">
                <AnimatedBrain size={16} className="text-blue-300" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-base font-bold tracking-tight text-white truncate">
                  Edu AI Diagnostics
                </h3>
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-blue-500/30 text-blue-300 border border-blue-400/30 leading-none shrink-0">
                  AI 3.5
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-blue-200/80 font-normal truncate">
                {taxonomy.name || 'MCQ Practice'} • Analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!analyzing && (
              <button
                type="button"
                onClick={handleReAnalyze}
                title="Re-run AI Analysis"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer hidden sm:flex items-center gap-1 text-xs font-semibold"
              >
                <AnimatedRotateCcw size={13} className="text-white" />
                <span>Re-run</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-center"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 bg-slate-50/50 space-y-4 custom-scrollbar">
          
          {/* ========================================================================= */}
          {/* 1. SNAPPY EDU AI SCANNING & LOADING STATE (2.2 SECONDS) */}
          {/* ========================================================================= */}
          {analyzing ? (
            <div className="py-8 sm:py-12 px-3 flex flex-col items-center justify-center text-center space-y-5 animate-in fade-in duration-200">
              
              {/* Radar Animation */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-400/40 animate-[spin_6s_linear_infinite]" />
                <div className="absolute inset-2 rounded-full border-2 border-blue-500/20 animate-[spin_3s_linear_infinite_reverse]" />
                <div className="absolute inset-3 rounded-full bg-blue-600/20 animate-pulse backdrop-blur-xs" />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md flex items-center justify-center text-white z-10">
                  <Brain className="w-6 h-6 animate-bounce" />
                </div>
              </div>

              {/* Progress & Live AI Step */}
              <div className="max-w-sm w-full space-y-3">
                <div className="space-y-1">
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                    <span>Evaluating Performance...</span>
                  </h4>
                  <p className="text-xs text-slate-500 font-medium h-5">
                    {scanningSteps[analysisStep]?.label}
                  </p>
                </div>

                {/* Progress Bar with Percentage */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-100 ease-out"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-400 px-0.5">
                    <span>Neural Scan</span>
                    <span className="text-blue-600 font-mono">{analysisProgress}%</span>
                  </div>
                </div>

                {/* Concise Step Pills */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {['Accuracy', 'Subjects', 'Speed', 'Insights'].map((stepName, i) => (
                    <div
                      key={stepName}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border text-center transition-all ${
                        analysisStep >= i
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-400 opacity-60'
                      }`}
                    >
                      {stepName}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            /* ========================================================================= */
            /* 2. CONCISE & VISUAL PERFORMANCE DASHBOARD */
            /* ========================================================================= */
            <div className="space-y-3.5 animate-in fade-in duration-200">
              
              {/* Executive Overview Banner */}
              <div className={`rounded-2xl p-4 sm:p-5 bg-gradient-to-r ${analyticsData.aiGradeColor} text-white shadow-md flex items-center justify-between gap-4 relative overflow-hidden`}>
                
                <div className="relative z-10 space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider text-white border border-white/30 flex items-center gap-1">
                      <Award size={12} className="text-amber-300" />
                      <span>{analyticsData.aiGrade}</span>
                    </span>
                    <span className="text-[11px] text-white/80 font-medium truncate">
                      {analyticsData.attempted}/{analyticsData.total} Qs Attempted
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
                    {analyticsData.aiVerdict}
                  </h3>

                  <div className="text-[11px] text-white/90 flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
                    {analyticsData.strongestSubject && (
                      <span className="truncate">
                        🎯 <strong>Best:</strong> {analyticsData.strongestSubject.name} ({analyticsData.strongestSubject.accuracy}%)
                      </span>
                    )}
                    {analyticsData.weakestSubject && analyticsData.weakestSubject.name !== analyticsData.strongestSubject?.name && (
                      <span className="truncate">
                        ⚠️ <strong>Review:</strong> {analyticsData.weakestSubject.name} ({analyticsData.weakestSubject.accuracy}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Score & Accuracy Badges */}
                <div className="relative z-10 flex items-center gap-2 shrink-0">
                  <div className="p-2 sm:p-3 bg-white/15 backdrop-blur-md rounded-xl border border-white/20 text-center min-w-[65px] sm:min-w-[80px]">
                    <span className="text-[9px] font-bold uppercase text-white/80 block">Accuracy</span>
                    <span className="text-lg sm:text-2xl font-black text-white">{analyticsData.overallAccuracy}%</span>
                  </div>

                  <div className="p-2 sm:p-3 bg-white/15 backdrop-blur-md rounded-xl border border-white/20 text-center min-w-[65px] sm:min-w-[80px]">
                    <span className="text-[9px] font-bold uppercase text-white/80 block">Score</span>
                    <span className="text-lg sm:text-2xl font-black text-amber-300">
                      {analyticsData.correct}/{analyticsData.attempted}
                    </span>
                  </div>
                </div>

              </div>

              {/* 4 Vital Metric Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Correct</span>
                    <span className="text-lg font-black text-emerald-600">{analyticsData.correct}</span>
                  </div>
                  <CheckCircle2 size={18} className="text-emerald-500" />
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Mistakes</span>
                    <span className="text-lg font-black text-rose-600">{analyticsData.incorrect}</span>
                  </div>
                  <XCircle size={18} className="text-rose-500" />
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Avg Pace</span>
                    <span className="text-lg font-black text-blue-600">{analyticsData.avgTimePerQuestion}s</span>
                  </div>
                  <Clock size={18} className="text-blue-500" />
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Skipped</span>
                    <span className="text-lg font-black text-slate-600">{analyticsData.unattempted}</span>
                  </div>
                  <HelpCircle size={18} className="text-slate-400" />
                </div>

              </div>

              {/* Segmented Tab Bar */}
              <div className="flex p-1 bg-slate-200/70 rounded-xl max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('subjects')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'subjects'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 size={13} />
                  <span>Subjects</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('insights')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'insights'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles size={13} />
                  <span>AI Plan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('matrix')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'matrix'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers size={13} />
                  <span>Questions</span>
                </button>
              </div>

              {/* ================================================================= */}
              {/* TAB 1: SUBJECT-WISE PERFORMANCE & ACCURACY GRAPH */}
              {/* ================================================================= */}
              {activeTab === 'subjects' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-1 border-b border-slate-100">
                    <span>Subject Domain Breakdown</span>
                    <span className="text-[11px] text-slate-500 font-medium">Accuracy %</span>
                  </div>

                  <div className="space-y-2">
                    {analyticsData.subjectsList.map((subj) => (
                      <div key={subj.name} className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-800 truncate pr-2">{subj.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${subj.statusColor}`}>
                              {subj.status}
                            </span>
                            <span className="font-mono font-black text-slate-900 text-xs">
                              {subj.accuracy}%
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-300"
                            style={{ width: `${(subj.correct / subj.total) * 100}%` }}
                          />
                          <div
                            className="bg-rose-500 h-full transition-all duration-300"
                            style={{ width: `${(subj.incorrect / subj.total) * 100}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>✓ {subj.correct} correct • ✗ {subj.incorrect} wrong</span>
                          <span>{subj.attempted}/{subj.total} answered</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* TAB 2: AI STRATEGIC INSIGHTS & STUDY PLAN (CONCISE) */}
              {/* ================================================================= */}
              {activeTab === 'insights' && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    
                    {/* Strengths */}
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                        <span>Core Strengths</span>
                      </div>
                      <ul className="space-y-1 text-xs text-emerald-950">
                        {analyticsData.strongestSubject && (
                          <li>• High accuracy in <strong>{analyticsData.strongestSubject.name}</strong> ({analyticsData.strongestSubject.accuracy}%).</li>
                        )}
                        <li>• Quick decision speed (~<strong>{analyticsData.avgTimePerQuestion}s/Q</strong>).</li>
                      </ul>
                    </div>

                    {/* Improvement Focus */}
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                        <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                        <span>Revision Priority</span>
                      </div>
                      <ul className="space-y-1 text-xs text-amber-950">
                        {analyticsData.weakestSubject ? (
                          <li>• Revise <strong>{analyticsData.weakestSubject.name}</strong> ({analyticsData.weakestSubject.incorrect} mistakes).</li>
                        ) : null}
                        <li>• Check explanations for all {analyticsData.incorrect} mistakes.</li>
                      </ul>
                    </div>

                  </div>

                  {/* 3 Quick Action Steps */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-1.5">
                    <span className="text-xs font-bold text-slate-800 block">Recommended Action:</span>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="p-2 rounded-lg bg-blue-50 text-[11px] font-semibold text-blue-700 border border-blue-200">
                        1. Review Mistakes
                      </div>
                      <div className="p-2 rounded-lg bg-indigo-50 text-[11px] font-semibold text-indigo-700 border border-indigo-200">
                        2. Re-Test Weak Area
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                        3. Track Score Gain
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* TAB 3: INTERACTIVE QUESTION MATRIX GRID (JUMP TO REVIEW) */}
              {/* ================================================================= */}
              {activeTab === 'matrix' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 border-b border-slate-100">
                    <span>Tap question to jump &amp; review</span>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-emerald-600">● Correct ({analyticsData.correct})</span>
                      <span className="text-rose-600">● Wrong ({analyticsData.incorrect})</span>
                    </div>
                  </div>

                  {/* Matrix grid */}
                  <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-1.5">
                    {questions.map((q, idx) => {
                      const qId = q._id || q.sql_id || idx;
                      const selected = userAnswers[qId];
                      const isAttempted = selected !== undefined;

                      let correctIndex = -1;
                      if (Array.isArray(q.options)) {
                        correctIndex = q.options.findIndex((opt) => opt.is_correct);
                      }
                      if (correctIndex === -1 && q.correct_answer) {
                        const match = String(q.correct_answer).match(/Option\s*([0-9]+)/i);
                        if (match) correctIndex = parseInt(match[1], 10) - 1;
                        else if (['A', 'B', 'C', 'D'].includes(String(q.correct_answer).trim().toUpperCase())) {
                          correctIndex = String(q.correct_answer).trim().toUpperCase().charCodeAt(0) - 65;
                        }
                      }

                      const isCorrect = isAttempted && selected === correctIndex;
                      const isIncorrect = isAttempted && !isCorrect;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            onClose();
                            if (onJumpToQuestion) onJumpToQuestion(idx);
                          }}
                          className={`p-2 rounded-lg font-mono font-bold text-xs border transition-transform active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
                            isCorrect
                              ? 'bg-emerald-500 border-emerald-600 text-white shadow-2xs'
                              : isIncorrect
                                ? 'bg-rose-500 border-rose-600 text-white shadow-2xs'
                                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                          }`}
                          title={`Question ${idx + 1}`}
                        >
                          <span>Q{idx + 1}</span>
                          <span className="text-[9px] opacity-80">
                            {isCorrect ? '✓' : isIncorrect ? '✗' : '—'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-slate-400 font-medium truncate hidden sm:inline">
            Edu AI Performance Diagnostics
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition items-center gap-1.5 cursor-pointer"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-sm transition cursor-pointer text-center"
            >
              Back to Practice
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
