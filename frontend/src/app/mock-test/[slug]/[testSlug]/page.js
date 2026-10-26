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
  Menu,
  AlertTriangle,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LeaderboardView from '@/components/mock-test/LeaderboardView';
import UnlockPassModal from '@/components/mock-test/UnlockPassModal';
import { useAuthModal } from '@/context/AuthModalContext';
import { stripHtmlToPlainText } from '@/utils/cleanHtml';
import { toast } from '@/context/ToastContext';
import { BACKEND_URL } from '@/utils/api';

export default function MockTestTakingEnginePage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const seriesSlug = unwrappedParams.slug;
  const testSlug = unwrappedParams.testSlug;

  const { data: session } = useSession();
  const { openAuthModal } = useAuthModal();
  const isAuthenticated = Boolean(session?.user);
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
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);
  const [resultTab, setResultTab] = useState('scorecard'); // 'scorecard' | 'leaderboard' | 'solutions'

  // Student name for guest
  const [guestName, setGuestName] = useState('Student Aspirant');

  // Fetch Test with populated questions
  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BACKEND_URL}/apis/v1/mock-tests/${testSlug}`);
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
          `${BACKEND_URL}/apis/v1/payments/user-status?email=${encodeURIComponent(userEmail || '')}&userId=${userId || ''}`
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
  // Both free and paid mock tests require authenticated login first
  const isUnlocked = isAuthenticated && (isFree || isAdmin || hasSubscription);

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

  // Lock body scroll during active exam session so the simulator covers the whole screen without page scroll
  useEffect(() => {
    if (hasStartedExam && !isTestSubmitted) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [hasStartedExam, isTestSubmitted]);

  // Intercept browser back button while exam is active to prevent navigating back to instructions
  useEffect(() => {
    if (!hasStartedExam || isTestSubmitted) return;

    window.history.pushState({ inExam: true }, '');

    const handlePopState = () => {
      window.history.pushState({ inExam: true }, '');
      setShowExitConfirmModal(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasStartedExam, isTestSubmitted]);

  // Track visited questions within current language view
  const goToQuestion = (index) => {
    if (index < 0 || index >= questionsToRender.length) return;
    setCurrentIndex(index);
    setVisited((prev) => new Set([...prev, index]));
    setIsMobilePaletteOpen(false);
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

      const res = await fetch(`${BACKEND_URL}/apis/v1/mock-tests/${test._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.user?.token ? { Authorization: `Bearer ${session.user.token}` } : {}),
        },
        body: JSON.stringify({
          responses: responsesPayload,
          time_spent_seconds: totalTimeSpent,
          user_id: session?.user?.id || session?.user?._id || '',
          user_name: session?.user?.name || guestName,
          user_email: session?.user?.email || '',
          attempted_language: selectedLanguage,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setEvaluationResult(data.data);
        setIsTestSubmitted(true);
        toast.success({
          title: '🎉 Test Submitted Successfully!',
          message: `Your score: ${data.data.score || 0}/${data.data.total_marks || 0} (${data.data.percentage || 0}%). Solutions & analytics ready!`,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast.error(data.message || 'Failed to submit test. Please try again.');
      }
    } catch (err) {
      console.error('Submit test error:', err);
      toast.error('Network error during test submission.');
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
        <header className="bg-slate-900 text-white border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 shadow-md shrink-0">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link
                href={`/mock-test/${seriesSlug}`}
                className="text-slate-400 hover:text-white p-1.5 sm:p-2 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                title="Back to Series"
              >
                <ArrowLeft size={17} />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-xs sm:text-base font-bold text-white tracking-tight truncate max-w-[180px] min-[360px]:max-w-[240px] sm:max-w-none">
                    {test.title}
                  </h1>
                  <span className="hidden sm:inline-block px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded border border-blue-400/30 uppercase shrink-0">
                    {test.test_type?.replace('_', ' ') || 'CBT EXAM'}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                  Instructions Window
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 bg-slate-800/90 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg border border-slate-700 text-[11px] sm:text-xs shrink-0">
              <Clock size={13} className="text-emerald-400 shrink-0" />
              <span><strong className="text-white">{test.duration_minutes || 60}m</strong><span className="hidden sm:inline text-slate-300 font-medium"> ({test.duration_minutes || 60} Mins)</span></span>
            </div>
          </div>
        </header>

        {/* Main Instructions Container */}
        <main className="max-w-6xl mx-auto w-full p-2.5 sm:p-5 lg:p-7 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-start">
            {/* Left 8 Cols: Comprehensive Instructions & Language Picker */}
            <div className="lg:col-span-8 space-y-6">

              {/* If user is not authenticated: Show Login Required Banner */}
              {!isAuthenticated ? (
                <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Lock size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <span>Login Required to Take This Test</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] uppercase font-bold">
                          {isFree ? 'Free Test' : 'Pass Required'}
                        </span>
                      </h4>
                      <p className="text-slate-600 text-xs mt-0.5">
                        {isFree
                          ? 'This is a Free Mock Test. Please sign in or create an account to start this test, record your score, and view full bilingual solutions.'
                          : 'Please log in to your account first so your pass can be linked and verified before starting.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      openAuthModal({
                        mode: 'login',
                        title: isFree ? '🔐 Login Required to Start Free Test' : '🔐 Login Required to Access Test',
                        subtitle: isFree
                          ? 'Please sign in or create an account to begin this free assessment and record your performance.'
                          : 'Please log in to your account first so your pass can be linked and verified.',
                      })
                    }
                    className="shrink-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Lock size={13} />
                    <span>{isFree ? 'Login to Start Test' : 'Login to Unlock Pass'}</span>
                  </button>
                </div>
              ) : !isUnlocked ? (
                /* Pass Required Banner if logged in but paid and not unlocked */
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
              ) : null}

              {/* Card 1: Exam Overview & Specifications */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <FileText size={17} className="text-[#2271b1]" />
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    General Examination Instructions
                  </h2>
                </div>

                {/* Exam Key Metrics Strip (Sleek, Compact, Less Boxes) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50/90 p-2 sm:p-2.5 rounded-lg border border-slate-200">
                  <div className="p-1 sm:p-1.5 text-center">
                    <span className="text-slate-500 block text-[10px] sm:text-[11px] font-medium">Total Time</span>
                    <strong className="text-slate-900 text-xs sm:text-sm font-bold">{test.duration_minutes || 60} Mins</strong>
                  </div>
                  <div className="p-1 sm:p-1.5 text-center">
                    <span className="text-slate-500 block text-[10px] sm:text-[11px] font-medium">Questions</span>
                    <strong className="text-slate-900 text-xs sm:text-sm font-bold">
                      {selectedLanguage === 'Hindi' && hindiQuestions.length > 0
                        ? hindiQuestions.length
                        : englishQuestions.length > 0
                          ? englishQuestions.length
                          : rawQuestions.length} Total
                    </strong>
                  </div>
                  <div className="p-1 sm:p-1.5 text-center">
                    <span className="text-slate-500 block text-[10px] sm:text-[11px] font-medium">Marks / Correct</span>
                    <strong className="text-emerald-700 text-xs sm:text-sm font-bold">+{test.marks_per_question ?? 1} Mark</strong>
                  </div>
                  <div className="p-1 sm:p-1.5 text-center">
                    <span className="text-slate-500 block text-[10px] sm:text-[11px] font-medium">Negative Marking</span>
                    <strong className="text-rose-700 text-xs sm:text-sm font-bold">
                      {Number(test.negative_marking) > 0 ? `-${test.negative_marking}` : '0 (None)'}
                    </strong>
                  </div>
                </div>

                {/* Rich Guidelines Content */}
                <div className="text-xs text-slate-700 leading-relaxed space-y-1.5 pt-0.5">
                  <p>
                    1. The examination will automatically submit when the countdown timer reaches zero.
                  </p>
                  <p>
                    2. You can navigate to any question at any time by clicking on its number on the Question Palette.
                  </p>
                  <p>
                    3. Clicking on <strong>Save &amp; Next</strong> saves your answer for the current question and moves forward.
                  </p>
                  <p>
                    4. Clicking on <strong>Mark for Review &amp; Next</strong> marks the question for rechecking before final submission.
                  </p>
                </div>
              </div>

              {/* Card 2: Question Palette Color Codes Legend */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-5 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <Info size={17} className="text-[#2271b1]" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Navigating to a Question &amp; Palette Legend
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-slate-200 text-slate-700 font-bold text-[10px] sm:text-[11px] flex items-center justify-center shrink-0">
                      01
                    </span>
                    <span className="text-slate-700 text-[11px] truncate">Not visited yet</span>
                  </div>

                  <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-rose-50 border border-rose-200">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-rose-500 text-white font-bold text-[10px] sm:text-[11px] flex items-center justify-center shrink-0">
                      02
                    </span>
                    <span className="text-rose-900 text-[11px] truncate">Not answered</span>
                  </div>

                  <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-emerald-500 text-white font-bold text-[10px] sm:text-[11px] flex items-center justify-center shrink-0">
                      03
                    </span>
                    <span className="text-emerald-900 text-[11px] truncate">Answered</span>
                  </div>

                  <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-purple-50 border border-purple-200">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-purple-500 text-white font-bold text-[10px] sm:text-[11px] flex items-center justify-center shrink-0">
                      04
                    </span>
                    <span className="text-purple-900 text-[11px] truncate">Marked for review</span>
                  </div>
                </div>
              </div>

              {/* Card 3: EXAM MEDIUM / LANGUAGE SELECTION */}
              <div className="bg-white rounded-xl border border-sky-300/80 p-3.5 sm:p-5 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Globe size={17} className="text-[#2271b1]" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      Choose Your Examination Medium / Language
                    </h3>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#2271b1] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Mandatory
                  </span>
                </div>

                <p className="text-[11px] sm:text-xs text-slate-600">
                  Select your preferred language medium for this test session. Only questions in your chosen medium will appear.
                </p>

                {/* Medium Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                  {/* Hindi Option */}
                  {hindiQuestions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleLanguageChange('Hindi')}
                      className={`p-2.5 sm:p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between group ${selectedLanguage === 'Hindi'
                          ? 'border-amber-500 bg-amber-50/70 ring-1 ring-amber-300 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">🇮🇳</span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            Hindi Medium (हिंदी)
                          </h4>
                          <p className="text-[10.5px] text-slate-500 font-medium">
                            {hindiQuestions.length} Questions
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 ${selectedLanguage === 'Hindi'
                            ? 'border-amber-500 bg-amber-500 text-white'
                            : 'border-slate-300 group-hover:border-slate-400'
                          }`}
                      >
                        {selectedLanguage === 'Hindi' && <Check size={11} strokeWidth={3} />}
                      </div>
                    </button>
                  )}

                  {/* English Option */}
                  {englishQuestions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleLanguageChange('English')}
                      className={`p-2.5 sm:p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between group ${selectedLanguage === 'English'
                          ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-300 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">🇬🇧</span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            English Medium
                          </h4>
                          <p className="text-[10.5px] text-slate-500 font-medium">
                            {englishQuestions.length} Questions
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 ${selectedLanguage === 'English'
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 group-hover:border-slate-400'
                          }`}
                      >
                        {selectedLanguage === 'English' && <Check size={11} strokeWidth={3} />}
                      </div>
                    </button>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 p-2 sm:p-2.5 rounded-lg text-[11px] sm:text-xs text-slate-600 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>
                    Selected: <strong className="text-slate-900">{selectedLanguage === 'Hindi' ? '🇮🇳 Hindi' : '🇬🇧 English'}</strong> ({questionsToRender.length} Questions)
                  </span>
                </div>
              </div>

              {/* Card 4: Declaration & Undertaking */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <ShieldCheck size={17} className="text-emerald-600" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Candidate Declaration
                  </h3>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={agreedToDeclaration}
                    onChange={(e) => setAgreedToDeclaration(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#2271b1] focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-[11px] sm:text-xs text-slate-700 leading-relaxed font-medium">
                    I have read and understood all instructions. All computer hardware, browser tabs, and network connections allotted to me are in proper working condition. I agree that in case of not adhering to instructions, my assessment may be disqualified.
                  </span>
                </label>
              </div>
            </div>

            {/* Right 4 Cols: Candidate Profile & Start CTA Sidebar */}
            <div className="lg:col-span-4 space-y-3.5 lg:sticky lg:top-20">
              {/* Candidate Info Card */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-5 shadow-2xs text-center space-y-2.5">
                {!isAuthenticated ? (
                  <>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center font-black text-lg mx-auto shadow-2xs">
                      <User size={22} className="text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">Guest Visitor</h3>
                      <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Authentication Required</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openAuthModal({
                          mode: 'login',
                          title: '🔐 Login to Candidate Portal',
                          subtitle: 'Sign in to access mock tests, track real-time scorecards, and unlock test passes.',
                        })
                      }
                      className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition cursor-pointer border border-blue-200"
                    >
                      Sign In / Register
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-100 text-[#2271b1] border border-blue-200 flex items-center justify-center font-black text-base mx-auto shadow-2xs">
                      {candidateName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{candidateName}</h3>
                      <p className="text-[11px] text-slate-500 truncate">{candidateEmail}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10.5px] text-left">
                      <div className="bg-slate-50 p-1.5 sm:p-2 rounded-md">
                        <span className="text-slate-400 block">Exam Language</span>
                        <strong className="text-slate-800 font-bold">
                          {selectedLanguage === 'Hindi' ? '🇮🇳 Hindi' : '🇬🇧 English'}
                        </strong>
                      </div>
                      <div className="bg-slate-50 p-1.5 sm:p-2 rounded-md">
                        <span className="text-slate-400 block">Total Qs</span>
                        <strong className="text-slate-800 font-bold">{questionsToRender.length} Qs</strong>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Start Test Action Box */}
              <div className="bg-slate-900 rounded-xl p-3.5 sm:p-4 text-white shadow-xs space-y-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    {!isAuthenticated
                      ? 'Login Required'
                      : isUnlocked
                        ? 'Ready to Begin?'
                        : 'Subscription Pass Required'}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold">
                    {!isAuthenticated
                      ? isFree
                        ? 'Sign In to Start Free Test'
                        : 'Sign In to Unlock Pass'
                      : isUnlocked
                        ? 'Start Timed Examination'
                        : 'Unlock Pass to Start Test'}
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    {!isAuthenticated
                      ? 'Sign in or create a free account to attempt this test.'
                      : isUnlocked
                        ? 'Timer starts immediately upon clicking begin.'
                        : 'Unlock pass to attempt questions and see live rankings.'}
                  </p>
                </div>

                {!isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() =>
                      openAuthModal({
                        mode: 'login',
                        title: isFree ? '🔐 Login Required to Start Free Test' : '🔐 Login Required to Access Test',
                        subtitle: isFree
                          ? 'Please sign in or create an account to begin this free assessment.'
                          : 'Please log in to your account first.',
                      })
                    }
                    className="w-full py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Lock size={14} />
                    <span>{isFree ? 'Login to Start Test' : 'Login to Unlock Pass'}</span>
                    <ArrowRight size={14} />
                  </button>
                ) : isUnlocked ? (
                  <>
                    <button
                      type="button"
                      disabled={!agreedToDeclaration}
                      onClick={() => {
                        setHasStartedExam(true);
                        setTimeLeft((test.duration_minutes || 60) * 60);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-full py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${agreedToDeclaration
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.99]'
                          : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                        }`}
                    >
                      <span>I am ready to begin</span>
                      <ArrowRight size={15} />
                    </button>

                    {!agreedToDeclaration && (
                      <p className="text-[10px] text-amber-300 text-center">
                        * Please check the declaration box to enable start.
                      </p>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsPassModalOpen(true)}
                    className="w-full py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer bg-amber-500 hover:bg-amber-600 text-slate-950"
                  >
                    <Lock size={14} />
                    <span>Unlock Pass to Start Test</span>
                    <ArrowRight size={14} />
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
    <div className={`w-full ${isTestSubmitted ? 'min-h-screen bg-[#f8fafc]' : 'fixed inset-0 z-30 bg-white sm:bg-[#f1f5f9] overflow-hidden'} flex flex-col font-sans text-slate-800 select-none`}>
      {/* Top CBT Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-2.5 sm:px-6 h-13 sm:h-16 shrink-0 z-40 shadow-md flex items-center">
        <div className="max-w-[1680px] w-full mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Left: Exit & Test Title */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            {!isTestSubmitted ? (
              <button
                type="button"
                onClick={() => setShowExitConfirmModal(true)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                title="Exit Examination"
                aria-label="Exit Examination"
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <Link
                href={`/mock-test/${seriesSlug}`}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                title="Back to Series"
              >
                <ArrowLeft size={16} />
              </Link>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-2">
                <h1 className="text-xs sm:text-base font-bold text-white truncate max-w-[110px] min-[360px]:max-w-[140px] sm:max-w-md">
                  {test.title}
                </h1>
                <span className="hidden md:inline-block px-1.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded border border-slate-700 uppercase shrink-0">
                  {test.test_type?.replace('_', ' ') || 'CBT'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                <span className="sm:hidden font-medium text-slate-300">{selectedLanguage} • Q {currentIndex + 1}/{totalQ}</span>
                <span className="hidden sm:inline">Medium: <span className="text-white font-semibold">{selectedLanguage === 'Hindi' ? '🇮🇳 Hindi' : '🇬🇧 English'}</span> • Total: <span className="text-slate-200 font-semibold">{totalQ} Qs</span> • Marks: <span className="text-slate-200 font-semibold">{totalQ * (test.marks_per_question ?? 1)}</span></span>
              </p>
            </div>
          </div>

          {/* Center: Selected Medium Indicator (Informational Badge, No Toggle) */}
          <div className="hidden sm:flex items-center bg-slate-800/90 px-3 py-1 rounded-lg border border-slate-700/80 text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Globe size={13} className="text-sky-400" />
              <span>{selectedLanguage === 'Hindi' ? '🇮🇳 Hindi Medium' : '🇬🇧 English Medium'}</span>
            </span>
          </div>

          {/* Right: Hamburger Toggle (Mobile), Timer & Submit */}
          {!isTestSubmitted ? (
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Countdown Timer */}
              <div
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-mono text-xs sm:text-sm font-bold shadow-xs transition-colors ${timeLeft <= 300
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : 'bg-slate-800 text-emerald-400 border border-slate-700'
                  }`}
              >
                <Clock size={13} className={timeLeft <= 300 ? 'text-rose-400' : 'text-emerald-400'} />
                <span>{formatTime(timeLeft)}</span>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                className="px-2.5 sm:px-4 py-1 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1"
              >
                <Send size={12} />
                <span className="hidden sm:inline">Submit Test</span>
                <span className="sm:hidden">Submit</span>
              </button>

              {/* Mobile Hamburger Trigger for Question Palette Sidebar */}
              <button
                type="button"
                onClick={() => setIsMobilePaletteOpen(true)}
                className="lg:hidden p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 hover:text-white rounded-lg border border-slate-700 cursor-pointer shrink-0 transition-colors flex items-center justify-center"
                aria-label="Open Question Palette Sidebar"
                title="Question Palette"
              >
                <Menu size={18} />
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
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${resultTab === 'scorecard'
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
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${resultTab === 'solutions'
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
              <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-7 shadow-xs space-y-4 sm:space-y-6 text-center max-w-4xl mx-auto">
                <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-xl shadow-2xs">
                  <Award size={32} />
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Test Completed Successfully!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Your attempt for <strong className="text-slate-800">{test?.title}</strong> in <strong className="text-slate-800">{selectedLanguage} medium</strong> has been evaluated &amp; recorded.
                  </p>
                </div>

                {/* Unified Performance Panel */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-0 sm:divide-x divide-slate-200 text-center">
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
                      Top {Math.max(0.1, Number((((evaluationResult.rank || 1) / (evaluationResult.total_participants || 1)) * 100).toFixed(1)))}%
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
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-7 shadow-xs space-y-4 sm:space-y-6">
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
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${solutionLangFilter === 'Hindi'
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-amber-800'
                          }`}
                      >
                        <span>🇮🇳 Hindi ({hindiQuestions.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolutionLangFilter('English')}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${solutionLangFilter === 'English'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-blue-800'
                          }`}
                      >
                        <span>🇬🇧 English ({englishQuestions.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSolutionLangFilter('all')}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer ${solutionLangFilter === 'all'
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
                      className={`p-5 rounded-2xl border space-y-3 ${!isAttempted
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
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${isHindi
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
                          className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${!isAttempted
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
                              className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${isTheCorrectOne
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
        /* LIVE TEST ENGINE (DESKTOP FULL HEIGHT WORKSPACE, MOBILE FULL HEIGHT OPTIMIZED) */
        <main className="max-w-[1680px] mx-auto w-full p-0 sm:p-4 md:p-5 flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-0 sm:gap-5 items-stretch overflow-hidden">
          {/* LEFT COLUMN: Main Question Interface (8 cols in lg, 9 cols in xl) */}
          <div className="flex-1 min-h-0 lg:col-span-8 xl:col-span-9 bg-white sm:rounded-xl sm:border border-slate-200/90 shadow-2xs flex flex-col h-full overflow-hidden">
            {/* Question Header Bar */}
            <div className="px-2.5 sm:px-6 py-2 sm:py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-1.5 sm:gap-2 shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                {/* Mobile Hamburger Trigger for Palette Sidebar */}
                <button
                  type="button"
                  onClick={() => setIsMobilePaletteOpen(true)}
                  className="lg:hidden p-1 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer shrink-0 flex items-center justify-center transition-colors shadow-2xs"
                  title="Open Question Palette Sidebar"
                  aria-label="Open Question Palette Sidebar"
                >
                  <Menu size={14} />
                </button>

                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#2271b1] text-white font-bold text-[11px] sm:text-xs rounded-md shadow-2xs shrink-0">
                  Q {currentIndex + 1} of {totalQ}
                </span>

                {currentQ?.subject_name && (
                  <span className="text-[10.5px] sm:text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md truncate max-w-[120px] sm:max-w-[200px]">
                    {currentQ.subject_name}
                  </span>
                )}
              </div>

              {/* Marks Info */}
              <div className="text-[11px] sm:text-xs text-slate-600 font-semibold flex items-center gap-1.5 bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-slate-200 shrink-0">
                <span className="text-emerald-700 font-bold">+{test.marks_per_question ?? 1}</span>
                <span className="text-slate-300">|</span>
                <span className="text-rose-600 font-medium">
                  {Number(test.negative_marking) > 0 ? `-${test.negative_marking}` : '0'}
                </span>
              </div>
            </div>

            {/* Scrollable Question Content & Options */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-6 lg:p-7 space-y-3 sm:space-y-4">
              {/* Question Text */}
              <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug tracking-normal">
                {stripHtmlToPlainText(currentQ?.content || '')}
              </div>

              {/* Options List (Clean, Sleek, Less Boxes, Less Curved) */}
              <div className="space-y-2 sm:space-y-2.5 pt-1">
                {(currentQ?.options || []).map((opt, oIdx) => {
                  const isSelected = answers[currentQ._id] === oIdx;

                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleSelectOption(oIdx)}
                      className={`py-2.5 px-3 sm:py-3 sm:px-4 rounded-lg sm:rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 sm:gap-3.5 select-none ${isSelected
                          ? 'border-sky-500 bg-sky-50/70 text-sky-950 font-medium ring-1 ring-sky-300 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-800'
                        }`}
                    >
                      {/* Option Letter Tag */}
                      <div
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${isSelected
                            ? 'bg-sky-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </div>

                      {/* Option Text */}
                      <div className="text-xs sm:text-sm font-medium leading-normal flex-1">
                        {stripHtmlToPlainText(opt.text)}
                      </div>

                      {/* Selected Indicator */}
                      {isSelected && (
                        <Check size={14} className="text-sky-600 shrink-0" strokeWidth={2.5} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Toolbar (Responsive Single Row Pinned at Bottom) */}
            <div className="p-2 sm:p-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-1 sm:gap-2.5 shrink-0">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  disabled={answers[currentQ?._id] === undefined}
                  onClick={handleClearResponse}
                  className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[11px] sm:text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={handleMarkForReviewAndNext}
                  className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] sm:text-xs font-semibold cursor-pointer flex items-center gap-1"
                >
                  <Flag size={12} className="text-purple-600 shrink-0" />
                  <span className="hidden sm:inline">Mark for Review &amp; Next</span>
                  <span className="sm:hidden">Review</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => goToQuestion(currentIndex - 1)}
                  className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[11px] sm:text-xs font-semibold disabled:opacity-40 cursor-pointer flex items-center gap-0.5 sm:gap-1"
                >
                  <ChevronLeft size={14} className="shrink-0" />
                  <span className="hidden min-[360px]:inline sm:hidden">Prev</span>
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndNext}
                  className="px-3.5 py-1.5 sm:px-5 sm:py-2 bg-[#2271b1] hover:bg-[#135e96] text-white rounded-lg text-xs sm:text-sm font-bold shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <span>Save &amp; Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Question Palette & Navigation (Desktop Only - Mobile uses Sidebar Drawer) */}
          <div className="hidden lg:flex lg:col-span-4 xl:col-span-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex-col h-full overflow-hidden">
            {/* Candidate / Exam Header */}
            <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#2271b1] flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">
                  {candidateName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-slate-900 truncate">{candidateName}</h3>
                  <p className="text-[10px] text-slate-500 truncate">Candidate Portal</p>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${selectedLanguage === 'Hindi'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-blue-100 text-blue-900 border-blue-300'
                  }`}
              >
                {selectedLanguage === 'Hindi' ? '🇮🇳 Hindi' : '🇬🇧 English'}
              </span>
            </div>

            {/* Status Legend (Compact) */}
            <div className="p-2.5 sm:p-3 bg-slate-50/40 border-b border-slate-100 shrink-0">
              <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-semibold">
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 p-1.5 rounded-lg">
                  <span className="w-5 h-5 rounded bg-emerald-500 text-white font-bold text-[10.5px] flex items-center justify-center shrink-0">
                    {answeredCount}
                  </span>
                  <span className="truncate">Answered</span>
                </div>

                <div className="flex items-center gap-1.5 bg-rose-50 text-rose-800 border border-rose-200/80 p-1.5 rounded-lg">
                  <span className="w-5 h-5 rounded bg-rose-500 text-white font-bold text-[10.5px] flex items-center justify-center shrink-0">
                    {unattemptedCount}
                  </span>
                  <span className="truncate">Not Answered</span>
                </div>

                <div className="flex items-center gap-1.5 bg-purple-50 text-purple-800 border border-purple-200/80 p-1.5 rounded-lg">
                  <span className="w-5 h-5 rounded bg-purple-500 text-white font-bold text-[10.5px] flex items-center justify-center shrink-0">
                    {markedCount}
                  </span>
                  <span className="truncate">Marked</span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 p-1.5 rounded-lg">
                  <span className="w-5 h-5 rounded bg-slate-300 text-slate-800 font-bold text-[10.5px] flex items-center justify-center shrink-0">
                    {notVisitedCount}
                  </span>
                  <span className="truncate">Not Visited</span>
                </div>
              </div>
            </div>

            {/* Scrollable Question Matrix */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Palette ({selectedLanguage})
                </h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {totalQ} Qs
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-0.5">
                {questionsToRender.map((q, idx) => {
                  const isAnswered = answers[q._id] !== undefined;
                  const isMarked = markedForReview.has(q._id);
                  const isCurrent = currentIndex === idx;
                  const isVisited = visited.has(idx);

                  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                  if (isAnswered && isMarked) {
                    colorClass = 'bg-purple-600 text-white border-purple-700 ring-1 ring-emerald-400';
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
                      className={`h-8 sm:h-9 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center ${colorClass} ${isCurrent ? 'ring-2 ring-[#2271b1] scale-105 shadow-2xs font-black' : ''
                        }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Final Submit CTA */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send size={13} />
                <span>Submit Final Test</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Mobile Question Palette Slide-over Modal Drawer */}
      {isMobilePaletteOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobilePaletteOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          />

          {/* Drawer Panel */}
          <div className="relative w-[85%] max-w-[320px] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Candidate & Palette Header */}
            <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#2271b1] flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">
                  {candidateName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 truncate">{candidateName}</h3>
                  <p className="text-[10px] text-slate-500 truncate">Candidate Portal</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${selectedLanguage === 'Hindi'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-blue-100 text-blue-900 border-blue-300'
                    }`}
                >
                  {selectedLanguage === 'Hindi' ? '🇮🇳 Hindi' : '🇬🇧 English'}
                </span>
                <button
                  onClick={() => setIsMobilePaletteOpen(false)}
                  className="w-7 h-7 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center cursor-pointer transition"
                  aria-label="Close Palette"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Status Legend */}
            <div className="p-2.5 bg-slate-50/50 border-b border-slate-100 shrink-0">
              <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-semibold">
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 p-1.5 rounded-lg">
                  <span className="w-5 h-5 rounded bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {answeredCount}
                  </span>
                  <span className="truncate">Answered</span>
                </div>
                <div className="flex items-center gap-1.5 bg-rose-50 text-rose-800 border border-rose-200/80 p-1.5 rounded-lg">
                  <span className="w-5 h-5 rounded bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {unattemptedCount}
                  </span>
                  <span className="truncate">Not Answered</span>
                </div>
                <div className="flex items-center gap-1.5 bg-purple-50 text-purple-800 border border-purple-200/80 p-1.5 rounded-lg">
                  <span className="w-5 h-5 rounded bg-purple-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {markedCount}
                  </span>
                  <span className="truncate">Marked</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 p-1.5 rounded-lg">
                  <span className="w-5 h-5 rounded bg-slate-300 text-slate-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {notVisitedCount}
                  </span>
                  <span className="truncate">Not Visited</span>
                </div>
              </div>
            </div>

            {/* Questions Grid */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="grid grid-cols-5 gap-1.5">
                {questionsToRender.map((q, idx) => {
                  const isAnswered = answers[q._id] !== undefined;
                  const isMarked = markedForReview.has(q._id);
                  const isCurrent = currentIndex === idx;
                  const isVisited = visited.has(idx);

                  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (isAnswered && isMarked) {
                    colorClass = 'bg-purple-600 text-white border-purple-700';
                  } else if (isAnswered) {
                    colorClass = 'bg-emerald-500 text-white border-emerald-600';
                  } else if (isMarked) {
                    colorClass = 'bg-purple-500 text-white border-purple-600';
                  } else if (isVisited) {
                    colorClass = 'bg-rose-100 text-rose-800 border-rose-300';
                  }

                  return (
                    <button
                      key={q._id}
                      type="button"
                      onClick={() => goToQuestion(idx)}
                      className={`h-9 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center ${colorClass} ${isCurrent ? 'ring-2 ring-[#2271b1] scale-105 font-black shadow-2xs' : ''
                        }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-2.5 border-t border-slate-200 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsMobilePaletteOpen(false);
                  setShowSubmitConfirm(true);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send size={13} />
                <span>Submit Final Test</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-xl text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Send size={20} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Are you sure you want to submit?</h3>
              <p className="text-xs text-slate-500">
                You have answered <span className="font-bold text-emerald-600">{answeredCount}</span> of <span className="font-bold text-slate-700">{totalQ}</span> questions.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Answered</span>
                <span className="font-bold text-emerald-600 text-sm">{answeredCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Unanswered</span>
                <span className="font-bold text-rose-500 text-sm">{unattemptedCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Marked</span>
                <span className="font-bold text-purple-600 text-sm">{markedCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : null}
                <span>Yes, Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit / Return to Instructions Confirmation Modal */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-sm sm:max-w-md w-full space-y-4 shadow-2xl text-center border border-slate-100">
            {/* Warning Icon Badge */}
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle size={24} strokeWidth={2.2} />
            </div>

            {/* Title & Explanation */}
            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Cannot Return to Instructions
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your examination has already started and the timer is running. Returning to the instructions page is restricted. Leaving this test window will automatically submit your assessment.
              </p>
            </div>

            {/* Current Session Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-medium">Answered</span>
                <span className="font-bold text-emerald-600 text-sm">{answeredCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-medium">Unanswered</span>
                <span className="font-bold text-rose-500 text-sm">{unattemptedCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-medium">Time Left</span>
                <span className="font-bold text-slate-800 text-sm font-mono">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Professional Alert Notice */}
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-left leading-normal font-medium flex items-start gap-1.5">
              <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                To record your responses and view your scorecard, please complete your test or choose <strong>Submit &amp; Exit</strong>.
              </span>
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={async () => {
                  setShowExitConfirmModal(false);
                  await handleFinalSubmit();
                }}
                disabled={submitting}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : null}
                <span>Submit &amp; Exit Test</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExitConfirmModal(false)}
                className="w-full sm:w-auto flex-1 px-5 py-2.5 bg-[#2271b1] hover:bg-[#135e96] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs cursor-pointer transition flex items-center justify-center gap-1"
              >
                <ArrowRight size={14} className="rotate-180" />
                <span>Return to Test</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
