'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  Flag,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Loader2,
  Trophy,
  Globe,
  Languages,
  Filter,
  ShieldCheck,
  FileText,
  User,
  CheckSquare,
  Square,
  Info,
  Lock,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LeaderboardView from '@/components/mock-test/LeaderboardView';
import UnlockPassModal from '@/components/mock-test/UnlockPassModal';
import { stripHtmlToPlainText } from '@/utils/cleanHtml';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function MockTestTakingEnginePage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const seriesSlug = unwrappedParams.slug;
  const testSlug = unwrappedParams.testSlug;

  const { data: session } = useSession();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [userHasActivePass, setUserHasActivePass] = useState(false);

  // Instructions & Exam Start State
  const [hasStartedExam, setHasStartedExam] = useState(false);
  const [agreedToDeclaration, setAgreedToDeclaration] = useState(false);

  // Language session state: 'Hindi' | 'English' (Default is specific to candidate's preference, NEVER mixed)
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [solutionLangFilter, setSolutionLangFilter] = useState('English');

  // Test session state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedOptionIndex }
  const [markedForReview, setMarkedForReview] = useState(new Set()); // Set of questionIds
  const [visited, setVisited] = useState(new Set([0])); // Set of question indices in current language view

  // Timer
  const [timeLeft, setTimeLeft] = useState(3600);
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [resultTab, setResultTab] = useState('scorecard'); // 'scorecard' | 'leaderboard' | 'solutions'

  // Student name for guest
  const [guestName, setGuestName] = useState('Student Aspirant');

  // Fetch Test with populated questions
  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/v1/mock-tests/${testSlug}`);
        const data = await res.json();
        if (data.success && data.data) {
          const testData = data.data;
          setTest(testData);
          setTimeLeft((testData.duration_minutes || 60) * 60);

          const rawQs = testData.questions || [];
          const hasHindi = rawQs.some((q) => (q.language || '').toLowerCase() === 'hindi');
          const hasEnglish = rawQs.some((q) => (q.language || '').toLowerCase() === 'english');

          // Choose initial language
          if (testData.medium === 'Hindi' && hasHindi) {
            setSelectedLanguage('Hindi');
            setSolutionLangFilter('Hindi');
          } else if (hasEnglish) {
            setSelectedLanguage('English');
            setSolutionLangFilter('English');
          } else if (hasHindi) {
            setSelectedLanguage('Hindi');
            setSolutionLangFilter('Hindi');
          } else {
            setSelectedLanguage('English');
            setSolutionLangFilter('English');
          }
        } else {
          setError(data.message || 'Mock test not found');
        }
      } catch (err) {
        console.error('Fetch test error:', err);
        setError('Failed to load mock test');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [testSlug]);

  // Check real-time pass status for user
  useEffect(() => {
    const checkPassStatus = async () => {
      const userEmail = session?.user?.email;
      const userId = session?.user?.id || session?.user?._id;
      if (!userEmail && !userId) return;

      try {
        const res = await fetch(
          `${API_BASE}/api/v1/payments/user-status?email=${encodeURIComponent(userEmail || '')}&userId=${userId || ''}`
        );
        const data = await res.json();
        if (data.success && data.data?.hasPass) {
          setUserHasActivePass(true);
        }
      } catch (e) {
        console.error('Pass status error:', e);
      }
    };
    checkPassStatus();
  }, [session]);

  const userRole = (session?.user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const isFree = !test?.is_paid || test?.is_free;
  const hasSubscription = Boolean(
    (session?.user?.subscription?.isActive &&
      session?.user?.subscription?.plan &&
      session?.user?.subscription?.plan !== 'free') ||
      userHasActivePass
  );
  const isUnlocked = isFree || isAdmin || hasSubscription;

  // Derived questions partitioned by student's active language session
  const rawQuestions = test?.questions || [];
  const hindiQuestions = rawQuestions.filter((q) => (q.language || '').toLowerCase() === 'hindi');
  const englishQuestions = rawQuestions.filter((q) => (q.language || '').toLowerCase() === 'english');
  const hasMultipleLanguages = hindiQuestions.length > 0 && englishQuestions.length > 0;

  // Active question set strictly scoped to the selected language
  const questionsToRender =
    selectedLanguage.toLowerCase() === 'hindi'
      ? hindiQuestions.length > 0
        ? hindiQuestions
        : rawQuestions
      : englishQuestions.length > 0
      ? englishQuestions
      : rawQuestions;

  const currentQ = questionsToRender[currentIndex] || questionsToRender[0];

  // Timer countdown: ONLY active when test has actually been started by candidate
  useEffect(() => {
    if (!hasStartedExam || isTestSubmitted || !test || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStartedExam, isTestSubmitted, test, timeLeft]);

  // Track visited questions within current language view
  const goToQuestion = (index) => {
    if (index < 0 || index >= questionsToRender.length) return;
    setCurrentIndex(index);
    setVisited((prev) => new Set([...prev, index]));
  };

  // Language switch handler
  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    setSolutionLangFilter(lang);
    setCurrentIndex(0);
    setVisited(new Set([0]));
  };

  // Option selection
  const handleSelectOption = (optionIndex) => {
    if (isTestSubmitted || !currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ._id]: optionIndex,
    }));
  };

  // Clear current response
  const handleClearResponse = () => {
    if (isTestSubmitted || !currentQ) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQ._id];
      return next;
    });
  };

  // Mark for review & next
  const handleMarkForReviewAndNext = () => {
    if (!currentQ) return;
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      next.add(currentQ._id);
      return next;
    });
    if (currentIndex < questionsToRender.length - 1) {
      goToQuestion(currentIndex + 1);
    }
  };

  // Save & Next
  const handleSaveAndNext = () => {
    if (currentIndex < questionsToRender.length - 1) {
      goToQuestion(currentIndex + 1);
    }
  };

  // Format timer HH:MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs > 0 ? `${hrs}:` : ''}${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    if (isTestSubmitted || !test) return;
    try {
      setSubmitting(true);
      setShowSubmitConfirm(false);

      const totalTimeSpent = (test.duration_minutes || 60) * 60 - timeLeft;

      // Submit responses strictly for the questions in candidate's language section
      const targetQuestions = questionsToRender.length > 0 ? questionsToRender : rawQuestions;
      const responsesPayload = targetQuestions.map((q) => ({
        question_id: q._id,
        selected_option_index: answers[q._id] !== undefined ? answers[q._id] : null,
        is_marked_for_review: markedForReview.has(q._id),
      }));

      const res = await fetch(`${API_BASE}/api/v1/mock-tests/${test._id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: responsesPayload,
          time_spent_seconds: totalTimeSpent,
          user_name: session?.user?.name || guestName,
          user_email: session?.user?.email || '',
          attempted_language: selectedLanguage,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setEvaluationResult(data.data);
        setIsTestSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Submit test error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-300">Loading Assessment Environment...</p>
      </div>
    );
  }

  // Error state
  if (error || !test) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 space-y-4">
        <AlertCircle size={48} className="text-rose-500" />
        <h2 className="text-xl font-bold text-slate-800">{error || 'Test not found'}</h2>
        <Link
          href={`/mock-test/${seriesSlug}`}
          className="px-5 py-2.5 bg-[#2271b1] text-white text-xs font-bold rounded-xl"
        >
          Back to Series
        </Link>
      </div>
    );
  }

  // Empty questions
  if (!test.questions || test.questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 space-y-4">
        <BookOpen size={48} className="text-slate-400" />
        <h2 className="text-xl font-bold text-slate-800">No Questions Allocated in this Test Yet</h2>
        <p className="text-xs text-slate-500">The administrator is currently allocating questions from the question bank.</p>
        <Link
          href={`/mock-test/${seriesSlug}`}
          className="px-5 py-2.5 bg-[#2271b1] text-white text-xs font-bold rounded-xl"
        >
          Back to Series
        </Link>
      </div>
    );
  }

  // Question counts breakdown for active language set
  const totalQ = questionsToRender.length;
  const answeredCount = questionsToRender.filter((q) => answers[q._id] !== undefined).length;
  const markedCount = questionsToRender.filter((q) => markedForReview.has(q._id)).length;
  const visitedInCurrentViewCount = questionsToRender.filter((_, idx) => visited.has(idx)).length;
  const unattemptedCount = Math.max(0, visitedInCurrentViewCount - answeredCount);
  const notVisitedCount = Math.max(0, totalQ - visitedInCurrentViewCount);

  // Re-attempt handler
  const handleReAttempt = () => {
    setIsTestSubmitted(false);
    setHasStartedExam(false);
    setAgreedToDeclaration(false);
    setEvaluationResult(null);
    setAnswers({});
    setMarkedForReview(new Set());
    setVisited(new Set([0]));
    setCurrentIndex(0);
    setTimeLeft((test?.duration_minutes || 60) * 60);
    setResultTab('scorecard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter solutions list by selected solution language tab
  const displayedSolutions = rawQuestions.filter((q) => {
    if (solutionLangFilter === 'all') return true;
    return (q.language || '').toLowerCase() === solutionLangFilter.toLowerCase();
  });

  // Candidate identifiers
  const candidateName = session?.user?.name || guestName;
  const candidateEmail = session?.user?.email || 'Registered Candidate';

  // =========================================================================
  // VIEW 1: PRE-EXAM INSTRUCTIONS & LANGUAGE SELECTION WINDOW (TCS/NTA CBT STYLE)
  // =========================================================================
  if (!hasStartedExam && !isTestSubmitted) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] text-slate-800 flex flex-col font-sans">
        {/* Top Assessment Header */}
        <header className="bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-8 py-3.5 shadow-md shrink-0">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href={`/mock-test/${seriesSlug}`}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
                title="Back to Series"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {test.title}
                  </h1>
                  <span className="hidden sm:inline-block px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded border border-blue-400/30 uppercase">
                    {test.test_type?.replace('_', ' ') || 'CBT EXAM'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Online Assessment System • Candidate Instructions Window
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs">
              <Clock size={15} className="text-emerald-400" />
              <span>Duration: <strong className="text-white">{test.duration_minutes || 60} Minutes</strong></span>
            </div>
          </div>
        </header>

        {/* Main Instructions Container */}
        <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Comprehensive Instructions & Language Picker */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Pass Required Banner if paid and not unlocked */}
              {!isUnlocked && (
                <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-2xs">
                      <Lock size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <span>Pass Required To Take This Mock Test</span>
                        <span className="px-2 py-0.2 bg-amber-200 text-amber-900 rounded-full text-[10px] uppercase font-bold">Premium</span>
                      </h4>
                      <p className="text-slate-600 text-xs mt-0.5">
                        This test is part of the premium series. Please unlock the pass to attempt this test, view step-by-step solutions, and get your live All-India Rank.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPassModalOpen(true)}
                    className="shrink-0 px-5 py-2.5 bg-slate-900 hover:bg-[#00c5d2] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Lock size={13} />
                    <span>Unlock Pass</span>
                  </button>
                </div>
              )}

              {/* Card 1: Exam Overview & Specifications */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText size={18} className="text-[#2271b1]" />
                  <h2 className="text-base font-bold text-slate-900">
                    General Examination Instructions
                  </h2>
                </div>

                {/* Exam Key Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-blue-50/60 border border-blue-100 p-3 rounded-xl">
                    <span className="text-slate-500 block text-[11px]">Total Time</span>
                    <strong className="text-slate-900 text-sm font-bold">{test.duration_minutes || 60} Mins</strong>
                  </div>
                  <div className="bg-purple-50/60 border border-purple-100 p-3 rounded-xl">
                    <span className="text-slate-500 block text-[11px]">Section Questions</span>
                    <strong className="text-slate-900 text-sm font-bold">
                      {selectedLanguage === 'Hindi' && hindiQuestions.length > 0
                        ? hindiQuestions.length
                        : englishQuestions.length > 0
                        ? englishQuestions.length
                        : rawQuestions.length} Questions
                    </strong>
                  </div>
                  <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl">
                    <span className="text-slate-500 block text-[11px]">Marks per Correct</span>
                    <strong className="text-emerald-700 text-sm font-bold">+{test.marks_per_question ?? 1} Mark</strong>
                  </div>
                  <div className="bg-rose-50/60 border border-rose-100 p-3 rounded-xl">
                    <span className="text-slate-500 block text-[11px]">Negative Marking</span>
                    <strong className="text-rose-700 text-sm font-bold">
                      {Number(test.negative_marking) > 0 ? `-${test.negative_marking}` : '0 (None)'}
                    </strong>
                  </div>
                </div>

                {/* Rich Guidelines Content */}
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2.5 pt-1">
                  <p>
                    1. The examination will automatically submit when the countdown timer reaches zero.
                  </p>
                  <p>
                    2. You can navigate to any question at any time by clicking on its number on the Question Palette on the right.
                  </p>
                  <p>
                    3. Clicking on <strong>Save &amp; Next</strong> saves your answer for the current question and automatically moves to the next question.
                  </p>
                  <p>
                    4. Clicking on <strong>Mark for Review &amp; Next</strong> marks the question for your review so you can recheck it before final submission.
                  </p>
                </div>
              </div>

              {/* Card 2: Question Palette Color Codes Legend */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3.5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Info size={18} className="text-[#2271b1]" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Navigating to a Question &amp; Palette Legend
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0">
                      01
                    </span>
                    <span className="text-slate-700 font-medium">You have not visited the question yet.</span>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="w-8 h-8 rounded-lg bg-rose-500 text-white font-bold flex items-center justify-center shrink-0">
                      02
                    </span>
                    <span className="text-rose-900 font-medium">You have not answered the question.</span>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500 text-white font-bold flex items-center justify-center shrink-0">
                      03
                    </span>
                    <span className="text-emerald-900 font-medium">You have answered the question.</span>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                    <span className="w-8 h-8 rounded-lg bg-purple-500 text-white font-bold flex items-center justify-center shrink-0">
                      04
                    </span>
                    <span className="text-purple-900 font-medium">You have marked question for review.</span>
                  </div>
                </div>
              </div>

              {/* Card 3: EXAM MEDIUM / LANGUAGE SELECTION */}
              <div className="bg-white rounded-2xl border-2 border-[#2271b1]/30 p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Globe size={18} className="text-[#2271b1]" />
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Choose Your Examination Medium / Language
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-[#2271b1] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    Mandatory Step
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  Please select your preferred language medium for this examination session. Only questions in your chosen medium will appear during the test.
                </p>

                {/* Medium Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Hindi Option */}
                  {hindiQuestions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleLanguageChange('Hindi')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between group ${
                        selectedLanguage === 'Hindi'
                          ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-200 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0">🇮🇳</span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            Hindi Medium (हिंदी माध्यम)
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {hindiQuestions.length} Distinct Questions
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedLanguage === 'Hindi'
                            ? 'border-amber-500 bg-amber-500 text-white'
                            : 'border-slate-300 group-hover:border-slate-400'
                        }`}
                      >
                        {selectedLanguage === 'Hindi' && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  )}

                  {/* English Option */}
                  {englishQuestions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleLanguageChange('English')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between group ${
                        selectedLanguage === 'English'
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-200 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0">🇬🇧</span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            English Medium
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {englishQuestions.length} Distinct Questions
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedLanguage === 'English'
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 group-hover:border-slate-400'
                        }`}
                      >
                        {selectedLanguage === 'English' && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>
                    Current Selection: <strong className="text-slate-900">{selectedLanguage === 'Hindi' ? '🇮🇳 Hindi' : '🇬🇧 English'}</strong> ({questionsToRender.length} Questions). You will only be presented with {selectedLanguage} questions.
                  </span>
                </div>
              </div>

              {/* Card 4: Declaration & Undertaking */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Candidate Declaration
                  </h3>
                </div>

                <label className="flex items-start gap-3 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={agreedToDeclaration}
                    onChange={(e) => setAgreedToDeclaration(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#2271b1] focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    I have read and understood all instructions. All computer hardware, browser tabs, and network connections allotted to me are in proper working condition. I agree that in case of not adhering to instructions, my assessment may be disqualified.
                  </span>
                </label>
              </div>
            </div>

            {/* Right 4 Cols: Candidate Profile & Start CTA Sidebar */}
            <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
              {/* Candidate Info Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-[#2271b1] border-2 border-blue-200 flex items-center justify-center font-black text-xl mx-auto shadow-xs">
                  {candidateName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 truncate">{candidateName}</h3>
                  <p className="text-xs text-slate-500 truncate">{candidateEmail}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-left">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-slate-400 block">Exam Language</span>
                    <strong className="text-slate-800 font-bold">
                      {selectedLanguage === 'Hindi' ? '🇮🇳 Hindi' : '🇬🇧 English'}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-slate-400 block">Total Qs</span>
                    <strong className="text-slate-800 font-bold">{questionsToRender.length} Qs</strong>
                  </div>
                </div>
              </div>

              {/* Start Test Action Box */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-md space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    {isUnlocked ? 'Ready to Begin?' : 'Subscription Pass Required'}
                  </span>
                  <h4 className="text-sm font-bold">
                    {isUnlocked ? 'Start Timed Examination' : 'Unlock Pass to Start Test'}
                  </h4>
                  <p className="text-xs text-slate-300">
                    {isUnlocked
                      ? 'Timer starts immediately upon clicking begin.'
                      : 'Unlock pass to attempt questions and see live rankings.'}
                  </p>
                </div>

                {isUnlocked ? (
                  <>
                    <button
                      type="button"
                      disabled={!agreedToDeclaration}
                      onClick={() => {
                        setHasStartedExam(true);
                        setTimeLeft((test.duration_minutes || 60) * 60);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-full py-3.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                        agreedToDeclaration
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-[1.01] active:scale-[0.99] ring-2 ring-emerald-300'
                          : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <span>I am ready to begin</span>
                      <ArrowRight size={16} />
                    </button>

                    {!agreedToDeclaration && (
                      <p className="text-[11px] text-amber-300 text-center">
                        * Please check the declaration box to enable the start button.
                      </p>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsPassModalOpen(true)}
                    className="w-full py-3.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 ring-2 ring-amber-300/60 hover:scale-[1.01]"
                  >
                    <Lock size={15} />
                    <span>Unlock Pass to Start Test</span>
                    <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Unlock Pass & Plans Popup Modal */}
        <UnlockPassModal
          isOpen={isPassModalOpen}
          onClose={() => setIsPassModalOpen(false)}
          series={test?.series}
          targetTest={test}
          onSuccess={() => {
            setUserHasActivePass(true);
          }}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE TEST SIMULATOR & POST-SUBMIT RESULTS
  // =========================================================================
  return (
    <div className={`min-h-screen ${isTestSubmitted ? 'bg-[#f8fafc]' : 'lg:h-screen lg:overflow-hidden bg-[#f1f5f9]'} flex flex-col font-sans text-slate-800 select-none`}>
      {/* Top CBT Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-3 sm:px-6 h-16 shrink-0 sticky top-0 z-40 shadow-md flex items-center">
        <div className="max-w-[1680px] w-full mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Exit & Test Title */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <Link
              href={`/mock-test/${seriesSlug}`}
              className="text-slate-400 hover:text-white p-1.5 sm:p-2 rounded-xl hover:bg-slate-800 transition-colors shrink-0"
              title="Exit Test"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-base font-bold text-white truncate max-w-[140px] sm:max-w-md">
                  {test.title}
                </h1>
                <span className="hidden md:inline-block px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-md border border-slate-700 uppercase">
                  {test.test_type?.replace('_', ' ') || 'CBT TEST'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                Medium: <span className="text-white font-semibold">{selectedLanguage === 'Hindi' ? '🇮🇳 Hindi' : '🇬🇧 English'}</span> • Total: <span className="text-slate-200 font-semibold">{totalQ} Qs</span> • Marks: <span className="text-slate-200 font-semibold">{totalQ * (test.marks_per_question ?? 1)}</span>
              </p>
            </div>
          </div>

          {/* Center: Live Language Switcher between Hindi and English if both are allocated */}
          {!isTestSubmitted && hasMultipleLanguages && (
            <div className="hidden sm:flex items-center bg-slate-800/95 p-1 rounded-xl border border-slate-700 text-xs shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
                <Globe size={13} className="text-blue-400" />
                <span className="hidden lg:inline">Medium:</span>
              </span>
              <button
                type="button"
                onClick={() => handleLanguageChange('Hindi')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedLanguage === 'Hindi'
                    ? 'bg-amber-500 text-white shadow-xs ring-1 ring-amber-300'
                    : 'text-slate-300 hover:text-amber-400'
                }`}
              >
                <span>🇮🇳 Hindi ({hindiQuestions.length})</span>
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('English')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedLanguage === 'English'
                    ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-300'
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                <span>🇬🇧 English ({englishQuestions.length})</span>
              </button>
            </div>
          )}

          {/* Right: Timer & Submit */}
          {!isTestSubmitted ? (
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Countdown Timer */}
              <div
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold shadow-xs transition-colors ${
                  timeLeft <= 300
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : 'bg-slate-800 text-emerald-400 border border-slate-700'
                }`}
              >
                <Clock size={15} className={timeLeft <= 300 ? 'text-rose-400' : 'text-emerald-400'} />
                <span>{formatTime(timeLeft)}</span>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send size={13} />
                <span className="hidden sm:inline">Submit Test</span>
                <span className="sm:hidden">Submit</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReAttempt}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Re-Attempt</span>
              </button>
              <Link
                href={`/mock-test/${seriesSlug}`}
                className="px-3.5 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-bold rounded-xl transition-colors"
              >
                All Tests
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Screen: If Submitted, show Result Scorecard & Leaderboard; else show Live Question Simulator */}
      {isTestSubmitted && evaluationResult ? (
        /* SCORECARD, LEADERBOARD & SOLUTIONS VIEW (WIDE FULL SCREEN WIDTH) */
        <main className="max-w-[1520px] mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Result Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setResultTab('scorecard')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  resultTab === 'scorecard'
                    ? 'bg-[#2271b1] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Award size={15} />
                <span>Scorecard &amp; Summary</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  router.push(`/leaderboard?test=${test?._id || ''}&series=${test?.series?._id || test?.series || seriesSlug || ''}&medium=${selectedLanguage}`);
                }}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer bg-white text-slate-700 hover:bg-amber-50 hover:text-amber-800 border border-slate-200"
              >
                <Trophy size={15} className="text-amber-500" />
                <span>Live Leaderboard</span>
                <ArrowRight size={13} className="text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => setResultTab('solutions')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  resultTab === 'solutions'
                    ? 'bg-[#2271b1] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <BookOpen size={15} />
                <span>Detailed Solutions</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {evaluationResult.language && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold rounded-full">
                  <Globe size={12} />
                  <span>Medium: {evaluationResult.language}</span>
                </span>
              )}
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Score Saved</span>
              </span>
            </div>
          </div>

          {/* TAB 1: SCORECARD & OVERVIEW (CLEAN, MODERN, UNIFIED) */}
          {resultTab === 'scorecard' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 text-center max-w-4xl mx-auto">
                <div className="inline-flex p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl shadow-xs">
                  <Award size={36} />
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                    Test Completed Successfully!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Your attempt for <strong className="text-slate-800">{test?.title}</strong> in <strong className="text-slate-800">{selectedLanguage} medium</strong> has been evaluated &amp; recorded.
                  </p>
                </div>

                {/* Unified Performance Panel */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x divide-slate-200 text-center">
                  <div className="sm:px-4 space-y-0.5">
                    <span className="text-xs text-slate-500 font-bold block">Your Score</span>
                    <div className="text-2xl sm:text-3xl font-black text-[#2271b1]">
                      {evaluationResult.score} <span className="text-xs text-slate-400 font-normal">/ {evaluationResult.max_score}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold block">{evaluationResult.percentage || Math.round((evaluationResult.score / (evaluationResult.max_score || 1)) * 100)}% Marks</span>
                  </div>

                  <div className="sm:px-4 space-y-0.5">
                    <span className="text-xs text-slate-500 font-bold block">Estimated Rank</span>
                    <div className="text-2xl sm:text-3xl font-black text-amber-600">
                      #{evaluationResult.rank || 1}
                      <span className="text-xs text-slate-400 font-normal"> / {evaluationResult.total_participants || 1}</span>
                    </div>
                    <span className="text-[11px] text-amber-700 font-bold bg-amber-100/80 px-2 py-0.5 rounded-full inline-block">
                      Top {Math.max(0.1, Number((( (evaluationResult.rank || 1) / (evaluationResult.total_participants || 1) ) * 100).toFixed(1)))}%
                    </span>
                  </div>

                  <div className="sm:px-4 space-y-0.5">
                    <span className="text-xs text-slate-500 font-bold block">Accuracy</span>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                      {evaluationResult.accuracy}%
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold block">{evaluationResult.total_correct} of {evaluationResult.total_questions} Correct</span>
                  </div>

                  <div className="sm:px-4 space-y-0.5">
                    <span className="text-xs text-slate-500 font-bold block">Time Spent</span>
                    <div className="text-2xl sm:text-3xl font-black text-slate-800">
                      {formatTime(evaluationResult.time_spent_seconds || 0)}
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Total Duration</span>
                  </div>
                </div>

                {/* Secondary Stats Strip */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Correct: <b className="text-emerald-700">{evaluationResult.total_correct}</b></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    <span>Incorrect: <b className="text-rose-700">{evaluationResult.total_incorrect}</b></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                    <span>Unattempted: <b className="text-slate-700">{evaluationResult.total_unattempted}</b></span>
                  </div>
                </div>

                {/* Action CTA Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      router.push(`/leaderboard?test=${test?._id || ''}&series=${test?.series?._id || test?.series || seriesSlug || ''}&medium=${selectedLanguage}`);
                    }}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trophy size={15} />
                    <span>View Rank on Leaderboard</span>
                    <ArrowRight size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setResultTab('solutions')}
                    className="px-5 py-2.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen size={15} />
                    <span>Review Step-by-Step Solutions</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReAttempt}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw size={15} />
                    <span>Re-Attempt Test</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE LEADERBOARD (WIDE FULL WIDTH FALLBACK) */}
          {resultTab === 'leaderboard' && (
            <div className="space-y-4 w-full">
              <LeaderboardView
                testId={test._id}
                title={`${test.title} - Test Leaderboard`}
                currentUser={session?.user}
                initialLanguage={selectedLanguage}
              />
            </div>
          )}

          {/* TAB 3: STEP-BY-STEP SOLUTIONS (RENDERED ONLY WHEN USER CHOOSES SOLUTIONS) */}
          {resultTab === 'solutions' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-[#2271b1]" />
                    <h3 className="text-lg font-bold text-slate-900">
                      Step-by-Step Solutions &amp; Explanations
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">
                    Showing {displayedSolutions.length} Questions
                  </span>
                </div>

                {/* Solutions Language Filter */}
                {hasMultipleLanguages && (
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                      <Filter size={13} className="text-slate-400" />
                      <span>Filter Medium:</span>
                    </span>
                    <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setSolutionLangFilter('Hindi')}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                          solutionLangFilter === 'Hindi'
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-amber-800'
                        }`}
                      >
                        <span>🇮🇳 Hindi ({hindiQuestions.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolutionLangFilter('English')}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                          solutionLangFilter === 'English'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-blue-800'
                        }`}
                      >
                        <span>🇬🇧 English ({englishQuestions.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolutionLangFilter('all')}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                          solutionLangFilter === 'all'
                            ? 'bg-slate-800 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All ({rawQuestions.length})
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {displayedSolutions.map((q, idx) => {
                  const resp = (evaluationResult.responses || []).find((r) => String(r.question_id) === String(q._id)) || {};
                  const isCorrect = resp.is_correct;
                  const isAttempted = resp.is_attempted;
                  const selectedOpt = resp.selected_option_index;
                  const correctOpt = resp.correct_option_index;
                  const isHindi = (q.language || '').toLowerCase() === 'hindi';

                  return (
                    <div
                      key={q._id}
                      className={`p-5 rounded-2xl border space-y-3 ${
                        !isAttempted
                          ? 'border-slate-200 bg-slate-50/50'
                          : isCorrect
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-rose-200 bg-rose-50/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-800">
                            {solutionLangFilter === 'Hindi'
                              ? `H${idx + 1}`
                              : solutionLangFilter === 'English'
                              ? `E${idx + 1}`
                              : `Q${idx + 1}`}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              isHindi
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-blue-50 text-blue-900 border-blue-300'
                            }`}
                          >
                            {isHindi ? '🇮🇳 Hindi' : '🇬🇧 English'}
                          </span>

                          {q.subject_name && (
                            <span className="text-[11px] font-semibold text-[#2271b1] bg-blue-50 px-2 py-0.5 rounded">
                              {q.subject_name}
                            </span>
                          )}
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            !isAttempted
                              ? 'bg-slate-200 text-slate-700'
                              : isCorrect
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {!isAttempted
                            ? 'Unattempted'
                            : isCorrect
                            ? `Correct (+${test.marks_per_question ?? 1})`
                            : Number(test.negative_marking) > 0
                            ? `Incorrect (-${test.negative_marking})`
                            : 'Incorrect (0)'}
                        </span>
                      </div>

                      {/* Question Content */}
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                        {stripHtmlToPlainText(q.content)}
                      </div>

                      {/* Options Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {(q.options || []).map((opt, oIdx) => {
                          const isChosen = selectedOpt === oIdx;
                          const isTheCorrectOne = opt.is_correct || opt.text === q.correct_answer || correctOpt === oIdx;

                          return (
                            <div
                              key={oIdx}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                                isTheCorrectOne
                                  ? 'border-emerald-400 bg-emerald-50 text-emerald-900 font-bold'
                                  : isChosen
                                  ? 'border-rose-300 bg-rose-50 text-rose-900'
                                  : 'border-slate-200 bg-white text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                                <span className="truncate">{stripHtmlToPlainText(opt.text)}</span>
                              </div>

                              {isTheCorrectOne && (
                                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded shrink-0">
                                  Correct Answer
                                </span>
                              )}
                              {isChosen && !isTheCorrectOne && (
                                <span className="text-[10px] font-black uppercase text-rose-700 bg-rose-100 px-2 py-0.5 rounded shrink-0">
                                  Your Choice
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Solution / Explanation */}
                      {q.ans_info && (
                        <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-xs space-y-1">
                          <span className="font-bold text-[#2271b1] block">Explanation:</span>
                          <p className="text-slate-700 leading-relaxed">
                            {stripHtmlToPlainText(q.ans_info)}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      ) : (
        /* LIVE TEST ENGINE (DESKTOP FULL HEIGHT WORKSPACE) */
        <main className="max-w-[1680px] mx-auto w-full p-3 sm:p-5 flex-1 lg:h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch lg:overflow-hidden">
          {/* LEFT COLUMN: Main Question Interface (8 cols in lg, 9 cols in xl) */}
          <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-full overflow-hidden">
            {/* Question Header Bar */}
            <div className="px-4 sm:px-7 py-3 sm:py-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 sm:gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 bg-[#2271b1] text-white font-black text-xs sm:text-sm rounded-xl shadow-xs">
                  Question {currentIndex + 1} of {totalQ}
                </span>

                {/* Question Language Badge */}
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                    (currentQ?.language || selectedLanguage).toLowerCase() === 'hindi'
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-blue-50 text-blue-900 border-blue-300'
                  }`}
                >
                  {(currentQ?.language || selectedLanguage).toLowerCase() === 'hindi' ? '🇮🇳 Hindi' : '🇬🇧 English'}
                </span>

                {currentQ?.subject_name && (
                  <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-lg">
                    {currentQ.subject_name}
                  </span>
                )}
              </div>

              {/* Mobile Language Switcher */}
              {hasMultipleLanguages && (
                <div className="flex sm:hidden items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('Hindi')}
                    className={`px-2 py-0.5 rounded ${selectedLanguage === 'Hindi' ? 'bg-amber-500 text-white' : 'text-slate-600'}`}
                  >
                    Hindi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('English')}
                    className={`px-2 py-0.5 rounded ${selectedLanguage === 'English' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
                  >
                    English
                  </button>
                </div>
              )}

              {/* Marks Info */}
              <div className="text-xs text-slate-600 font-bold flex items-center gap-2 sm:gap-3 bg-white px-3 py-1 rounded-xl border border-slate-200">
                <span className="text-emerald-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  +{test.marks_per_question ?? 1} Mark
                </span>
                <span className="text-slate-300">|</span>
                {Number(test.negative_marking) > 0 ? (
                  <span className="text-rose-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                    -{test.negative_marking} Negative
                  </span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
                    No Negative
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable Question Content & Options */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
              {/* Question Text */}
              <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed tracking-normal">
                {stripHtmlToPlainText(currentQ?.content || '')}
              </div>

              {/* Options List */}
              <div className="space-y-3.5 pt-2">
                {(currentQ?.options || []).map((opt, oIdx) => {
                  const isSelected = answers[currentQ._id] === oIdx;

                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleSelectOption(oIdx)}
                      className={`p-4 sm:p-4.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 group ${
                        isSelected
                          ? 'border-[#2271b1] bg-blue-50/50 shadow-xs ring-2 ring-blue-100'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Radio Circle */}
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'border-[#2271b1] bg-[#2271b1]' : 'border-slate-300 group-hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>

                      {/* Option Letter Tag */}
                      <div
                        className={`w-7 h-7 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-[#2271b1] text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </div>

                      {/* Option Text */}
                      <div className="text-sm sm:text-base font-semibold text-slate-800 leading-normal flex-1">
                        {stripHtmlToPlainText(opt.text)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Toolbar */}
            <div className="p-4 sm:p-5 bg-slate-50/90 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearResponse}
                  className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Clear Response
                </button>

                <button
                  type="button"
                  onClick={handleMarkForReviewAndNext}
                  className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Flag size={14} />
                  <span>Mark for Review &amp; Next</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => goToQuestion(currentIndex - 1)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndNext}
                  className="px-6 py-2.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>Save &amp; Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Question Palette & Navigation (4 cols in lg, 3 cols in xl) */}
          <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-full overflow-hidden">
            {/* Candidate / Exam Header */}
            <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2271b1] flex items-center justify-center font-black text-sm shrink-0 border border-blue-200">
                  {candidateName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-slate-900 truncate">{candidateName}</h3>
                  <p className="text-[11px] text-slate-500 truncate">Candidate Portal</p>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                  selectedLanguage === 'Hindi'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-blue-100 text-blue-900 border-blue-300'
                }`}
              >
                {selectedLanguage === 'Hindi' ? '🇮🇳 Hindi Section' : '🇬🇧 English Section'}
              </span>
            </div>

            {/* Status Legend */}
            <div className="p-4 bg-slate-50/40 border-b border-slate-100 shrink-0">
              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 p-2 rounded-xl">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    {answeredCount}
                  </span>
                  <span className="truncate">Answered</span>
                </div>

                <div className="flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200/80 p-2 rounded-xl">
                  <span className="w-6 h-6 rounded-lg bg-rose-500 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    {unattemptedCount}
                  </span>
                  <span className="truncate">Not Answered</span>
                </div>

                <div className="flex items-center gap-2 bg-purple-50 text-purple-800 border border-purple-200/80 p-2 rounded-xl">
                  <span className="w-6 h-6 rounded-lg bg-purple-500 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    {markedCount}
                  </span>
                  <span className="truncate">Marked</span>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 text-slate-700 border border-slate-200 p-2 rounded-xl">
                  <span className="w-6 h-6 rounded-lg bg-slate-300 text-slate-800 font-black text-[11px] flex items-center justify-center shrink-0">
                    {notVisitedCount}
                  </span>
                  <span className="truncate">Not Visited</span>
                </div>
              </div>
            </div>

            {/* Scrollable Question Matrix */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Question Palette ({selectedLanguage})
                </h3>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {totalQ} Questions
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 pt-1">
                {questionsToRender.map((q, idx) => {
                  const isAnswered = answers[q._id] !== undefined;
                  const isMarked = markedForReview.has(q._id);
                  const isCurrent = currentIndex === idx;
                  const isVisited = visited.has(idx);

                  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                  if (isAnswered && isMarked) {
                    colorClass = 'bg-purple-600 text-white border-purple-700 ring-2 ring-emerald-400';
                  } else if (isAnswered) {
                    colorClass = 'bg-emerald-500 text-white border-emerald-600 shadow-2xs';
                  } else if (isMarked) {
                    colorClass = 'bg-purple-500 text-white border-purple-600';
                  } else if (isVisited) {
                    colorClass = 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200';
                  }

                  return (
                    <button
                      key={q._id}
                      type="button"
                      onClick={() => goToQuestion(idx)}
                      className={`h-11 rounded-xl text-xs sm:text-sm font-black border transition-all cursor-pointer flex items-center justify-center ${colorClass} ${
                        isCurrent ? 'ring-3 ring-[#2271b1] scale-105 shadow-sm font-black' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Final Submit CTA */}
            <div className="p-4 bg-slate-50/90 border-t border-slate-200/80 shrink-0">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send size={15} />
                <span>Submit Final Test</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Send size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Are you sure you want to submit?</h3>
              <p className="text-xs text-slate-500">
                You have answered <span className="font-bold text-emerald-600">{answeredCount}</span> of <span className="font-bold text-slate-700">{totalQ}</span> questions in your <strong className="text-slate-800">{selectedLanguage}</strong> session.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Answered</span>
                <span className="font-black text-emerald-600 text-base">{answeredCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Unanswered</span>
                <span className="font-black text-rose-500 text-base">{unattemptedCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Marked</span>
                <span className="font-black text-purple-600 text-base">{markedCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Resume Test
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : null}
                <span>Yes, Submit Test</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
