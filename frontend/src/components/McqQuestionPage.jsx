'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import LiveTicker from '@/components/LiveTicker';
import Footer from '@/components/Footer';
import { useAuthModal } from '@/context/AuthModalContext';
import { useToast } from '@/context/ToastContext';
import { getImageUrl } from '@/utils/image';
import {
  SUBJECTS_LIST,
  STATES_LIST,
  EXAMS_LIST,
  getTaxonomyInfo,
} from '@/utils/mcqTaxonomies';
import EduAiAnalysisModal from '@/components/EduAiAnalysisModal';
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Share2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  BookOpen,
  Send,
  MessageCircle,
  Globe,
  Briefcase,
  Layers,
  Sparkles,
  Search,
  X,
  RotateCcw,
  Trophy,
  Award,
  HelpCircle,
  Timer,
  Play,
  Pause,
  Flame,
  Filter,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  Lightbulb,
  MessageSquare,
  Bookmark,
  BookmarkCheck,
  Check,
  Copy,
} from 'lucide-react';
import {
  AnimatedClock,
  AnimatedZap,
  AnimatedSparkles,
  AnimatedCheckCircle,
  AnimatedAward,
  AnimatedAiEye,
  AnimatedBrain,
  AnimatedRotateCcw,
} from '@/components/AnimatedIcons';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

const DISCOVER_TAGS = [
  { name: 'Educational Resources', icon: '📰' },
  { name: 'Primary & Secondary Schooling (K-12)', icon: '📰' },
  { name: 'Fun & Trivia', icon: '📰' },
  { name: 'Knowledge Management', icon: '📚' },
  { name: 'Competitive Exam Prep', icon: '🎯' },
  { name: 'Current Affairs 2026', icon: '⚡' },
];

const MOBILE_QUICK_TOPICS = [
  { name: 'All GK', slug: 'general-knowledge', type: 'subject', icon: '⚡' },
  { name: 'History', slug: 'history', type: 'subject', icon: '📜' },
  { name: 'Geography', slug: 'geography', type: 'subject', icon: '🌍' },
  { name: 'Polity', slug: 'polity', type: 'subject', icon: '⚖️' },
  { name: 'Science', slug: 'science', type: 'subject', icon: '🔬' },
  { name: 'Hindi', slug: 'hindi', type: 'subject', icon: '🔤' },
  { name: 'English', slug: 'english', type: 'subject', icon: '📖' },
  { name: 'Mathematics', slug: 'mathematics', type: 'subject', icon: '🔢' },
  { name: 'Computer', slug: 'computer', type: 'subject', icon: '💻' },
  { name: 'Economics', slug: 'economics', type: 'subject', icon: '📊' },
  { name: 'States GK (32)', type: 'open_tab', tab: 'state', icon: '🏛️' },
  { name: 'Govt Exams (14)', type: 'open_tab', tab: 'exam', icon: '🎯' },
];

const formatShortDate = (dateStr) => {
  if (!dateStr) return 'Sep 25';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

export default function McqQuestionPage({
  initialSlug = 'general-knowledge',
  initialSubjectName = 'General Knowledge',
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { openAuthModal } = useAuthModal();
  const { showToast } = useToast();

  const currentPageParam = parseInt(searchParams.get('page') || '1', 10);
  const langParam = searchParams.get('lang') || 'English';

  const [currentSlug, setCurrentSlug] = useState(initialSlug);
  const [taxonomy, setTaxonomy] = useState(() => getTaxonomyInfo(initialSlug));
  const [language, setLanguage] = useState(langParam);
  const [page, setPage] = useState(currentPageParam);
  const [pageSize] = useState(28);

  const [questions, setQuestions] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expiringJobs, setExpiringJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [rightTab, setRightTab] = useState('expiring');

  const [openSubjects, setOpenSubjects] = useState(false);
  const [openStates, setOpenStates] = useState(false);
  const [openExams, setOpenExams] = useState(false);
  const [showMoreIntro, setShowMoreIntro] = useState(false);

  const [subjectSearch, setSubjectSearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [examSearch, setExamSearch] = useState('');

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return SUBJECTS_LIST;
    const q = subjectSearch.toLowerCase().trim();
    return SUBJECTS_LIST.filter((s) => s.name.toLowerCase().includes(q));
  }, [subjectSearch]);

  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return STATES_LIST;
    const q = stateSearch.toLowerCase().trim();
    return STATES_LIST.filter((s) => s.name.toLowerCase().includes(q));
  }, [stateSearch]);

  const filteredExams = useMemo(() => {
    if (!examSearch.trim()) return EXAMS_LIST;
    const q = examSearch.toLowerCase().trim();
    return EXAMS_LIST.filter((e) => e.name.toLowerCase().includes(q));
  }, [examSearch]);

  const [userAnswers, setUserAnswers] = useState({});
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [savedQuestions, setSavedQuestions] = useState({});
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [activeDiscussQuestion, setActiveDiscussQuestion] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [questionComments, setQuestionComments] = useState({});
  const [shareUrl, setShareUrl] = useState('');

  // ⏱️ Practice Stopwatch State
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [isStopwatchPaused, setIsStopwatchPaused] = useState(false);

  // 📱 Mobile Filter Drawer State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [mobileFilterTab, setMobileFilterTab] = useState('subject'); // 'subject' | 'state' | 'exam'
  const [mobileFilterSearch, setMobileFilterSearch] = useState('');

  // Load saved bookmarks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('saved_mcqs');
      if (saved) setSavedQuestions(JSON.parse(saved));
    } catch (err) {}
  }, []);

  // Handle ESC key to exit Fullscreen Mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreenMode) {
        setIsFullscreenMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenMode]);

  // Lock body scroll when mobile filter drawer or fullscreen mode is open
  useEffect(() => {
    if (isMobileFilterOpen || isFullscreenMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileFilterOpen, isFullscreenMode]);

  // Mobile Filter Search compute
  const mobileFilteredItems = useMemo(() => {
    let sourceList = SUBJECTS_LIST;
    if (mobileFilterTab === 'state') sourceList = STATES_LIST;
    else if (mobileFilterTab === 'exam') sourceList = EXAMS_LIST;

    if (!mobileFilterSearch.trim()) return sourceList;
    const q = mobileFilterSearch.toLowerCase().trim();
    return sourceList.filter((item) => item.name.toLowerCase().includes(q));
  }, [mobileFilterTab, mobileFilterSearch]);

  // 🧠 Edu AI Performance Analysis Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Jump to specific question from AI Matrix Grid
  const handleJumpToQuestion = (idx) => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(`question-box-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-blue-500/50', 'bg-blue-50/50', 'rounded-2xl', 'transition-all', 'duration-500');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-blue-500/50', 'bg-blue-50/50', 'rounded-2xl');
      }, 2500);
    }
  };

  // Stopwatch ticking interval
  useEffect(() => {
    let interval = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStopwatchRunning]);

  // Format stopwatch MM:SS or HH:MM:SS
  const formatStopwatchTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Toggle Pause/Resume
  const handleToggleStopwatch = () => {
    if (isStopwatchRunning) {
      setIsStopwatchRunning(false);
      setIsStopwatchPaused(true);
    } else {
      if (stats.attempted > 0 || stopwatchSeconds > 0) {
        setIsStopwatchRunning(true);
        setIsStopwatchPaused(false);
      }
    }
  };

  // Hydration-safe share URL resolution
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, [currentSlug, page]);

  // Reactive sync when route parameter or initialSlug changes
  useEffect(() => {
    if (initialSlug && initialSlug !== currentSlug) {
      setCurrentSlug(initialSlug);
      setPage(1);
    }
  }, [initialSlug]);

  // Update taxonomy dynamically whenever slug changes
  useEffect(() => {
    const tax = getTaxonomyInfo(currentSlug);
    setTaxonomy(tax);
  }, [currentSlug]);

  // Dynamic Browser Tab Title & Meta SEO Update
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const qCountPrefix = totalQuestions > 0 ? `${totalQuestions}+ ` : '3800+ ';
      document.title = `${qCountPrefix}${taxonomy.name} Questions | GK Questions MCQ | gk mcq questions with answers in ${language}`;

      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', taxonomy.description);

      // Update canonical link
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      const canonicalUrl = taxonomy.type === 'state'
        ? `https://educationmasters.in/state/${currentSlug}/mcq-questions/`
        : `https://educationmasters.in/${currentSlug}/mcq-questions/`;
      canonical.setAttribute('href', canonicalUrl);
    }
  }, [taxonomy, currentSlug, totalQuestions, language]);

  const handleSelectTaxonomy = (targetSlug, targetType) => {
    setIsMobileFilterOpen(false);
    if (targetSlug === currentSlug) return;
    setCurrentSlug(targetSlug);
    setPage(1);
    setUserAnswers({});
    setRevealedAnswers({});
    const targetTax = getTaxonomyInfo(targetSlug);
    const type = targetType || targetTax.type;
    if (type === 'state') {
      router.push(`/state/${targetSlug}/mcq-questions`);
    } else {
      router.push(`/${targetSlug}/mcq-questions`);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
        });

        // Pass appropriate filter based on whether it's an exam, state, or subject
        if (taxonomy.type === 'exam') {
          queryParams.set('exam', taxonomy.rawName || taxonomy.slug);
        } else if (taxonomy.type === 'state') {
          queryParams.set('state', taxonomy.rawName || taxonomy.slug);
        } else {
          queryParams.set('subject', taxonomy.slug);
        }

        if (language && language !== 'all') {
          queryParams.set('language', language);
        }

        const res = await fetch(`${BACKEND_URL}/apis/v1/questions?${queryParams.toString()}`);
        const data = await res.json();

        if (isMounted && data.success) {
          setQuestions(data.data || []);
          const total = data.pagination?.total || data.counts?.all || 0;
          setTotalQuestions(total);
          setTotalPages(data.pagination?.pages || Math.ceil(total / pageSize) || 1);
        }
      } catch (err) {
        console.error('Error loading questions:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchQuestions();
    return () => {
      isMounted = false;
    };
  }, [taxonomy, currentSlug, page, language, pageSize]);

  useEffect(() => {
    let isMounted = true;
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/apis/v1/jobs/expiring-soon?limit=6`);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setExpiringJobs(data.data);
        } else {
          const fallbackRes = await fetch(`${BACKEND_URL}/apis/v1/jobs?limit=6&status=publish`);
          const fallbackData = await fallbackRes.json();
          if (isMounted && fallbackData.success) {
            setExpiringJobs(fallbackData.data || []);
          }
        }
      } catch (err) {
        console.error('Error loading sidebar jobs:', err);
      } finally {
        if (isMounted) setLoadingJobs(false);
      }
    };
    fetchJobs();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 180, behavior: 'smooth' });
    }
  };

  const handleSelectOption = (questionId, optionIndex) => {
    // Check if user is answering a new question for the first time
    const isNewAnswer = userAnswers[questionId] === undefined;
    const currentAttemptedCount = Object.keys(userAnswers).length;

    // If user has answered 3 questions and attempts to answer the 4th question while unauthenticated:
    if (isNewAnswer && currentAttemptedCount >= 3 && !session?.user) {
      openAuthModal({
        mode: 'register',
        mandatory: true,
        preventClose: true,
        title: '🔐 Free Sign In Required',
        subtitle: 'Please create a free account or sign in to continue practicing unlimited questions and access Edu AI Analytics.',
      });
      showToast({
        type: 'info',
        title: 'Free Sign In Required',
        message: 'Please sign in or create a free account to continue practicing.',
        duration: 5000,
      });
      return;
    }

    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));

    // ⏱️ Auto-start stopwatch as soon as user answers their first question!
    if (!isStopwatchRunning && !isStopwatchPaused) {
      setIsStopwatchRunning(true);
    }
  };

  const handleOpenAiAnalysis = () => {
    // 1. Must answer at least 1 question first
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount === 0) {
      showToast({
        type: 'info',
        title: 'Answer a Question First',
        message: 'Please answer at least 1 question below to generate your personalized AI Performance Analysis & accuracy graph.',
        duration: 5000,
      });
      return;
    }

    // 2. Must be registered / logged in
    if (!session?.user) {
      openAuthModal({
        mode: 'register',
        mandatory: true,
        preventClose: true,
        title: '🧠 Free Sign In Required',
        subtitle: 'Edu AI Subject Diagnostics & Accuracy Graph is available for registered students. Create a free account or log in to view in-depth performance analytics.',
      });
      showToast({
        type: 'info',
        title: 'Free Sign In Required',
        message: 'Please sign in or create a free account to view AI Performance Analysis.',
        duration: 5000,
      });
      return;
    }

    // 3. Open AI Analysis modal
    setIsAiModalOpen(true);
  };

  const toggleViewAnswer = (questionId) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const toggleSaveQuestion = (questionId) => {
    setSavedQuestions((prev) => {
      const isSaved = !prev[questionId];
      const next = { ...prev, [questionId]: isSaved };
      try {
        localStorage.setItem('saved_mcqs', JSON.stringify(next));
      } catch (err) {}
      showToast({
        type: 'success',
        title: isSaved ? '🔖 Question Saved' : 'Removed from Saved',
        message: isSaved ? 'Question bookmarked for quick revision.' : 'Question removed from bookmarks.',
        duration: 3000,
      });
      return next;
    });
  };

  const handleAddComment = (questionId) => {
    if (!newCommentText.trim()) return;
    const commentObj = {
      id: Date.now(),
      author: session?.user?.name || 'Student',
      text: newCommentText.trim(),
      time: 'Just now',
    };
    setQuestionComments((prev) => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), commentObj],
    }));
    setNewCommentText('');
    showToast({
      type: 'success',
      title: 'Comment Added',
      message: 'Your discussion note has been posted.',
      duration: 3000,
    });
  };

  // Live Performance & Stats Calculation (Correct, Incorrect, Percentage, Result)
  const stats = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let attempted = 0;

    questions.forEach((q, idx) => {
      const qId = q._id || q.sql_id || idx;
      const selected = userAnswers[qId];

      if (selected !== undefined) {
        attempted += 1;
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

        if (selected === correctIndex) {
          correct += 1;
        } else {
          incorrect += 1;
        }
      }
    });

    const total = questions.length;
    const percentage = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const progressPercent = total > 0 ? Math.round((attempted / total) * 100) : 0;

    let resultText = 'Ready to Start';
    let resultColor = 'text-slate-700 bg-slate-50 border-slate-200';
    let resultBadge = 'bg-slate-200 text-slate-700';
    let resultIcon = '🎯';

    if (attempted > 0) {
      if (percentage >= 80) {
        resultText = 'Excellent (A+)';
        resultColor = 'text-emerald-800 bg-emerald-50/80 border-emerald-300';
        resultBadge = 'bg-emerald-600 text-white';
        resultIcon = '🏆';
      } else if (percentage >= 60) {
        resultText = 'Good Job (B)';
        resultColor = 'text-blue-800 bg-blue-50/80 border-blue-300';
        resultBadge = 'bg-blue-600 text-white';
        resultIcon = '⭐';
      } else if (percentage >= 40) {
        resultText = 'Average (C)';
        resultColor = 'text-amber-800 bg-amber-50/80 border-amber-300';
        resultBadge = 'bg-amber-600 text-white';
        resultIcon = '📈';
      } else {
        resultText = 'Needs Practice';
        resultColor = 'text-rose-800 bg-rose-50/80 border-rose-300';
        resultBadge = 'bg-rose-600 text-white';
        resultIcon = '💪';
      }
    }

    return {
      correct,
      incorrect,
      attempted,
      total,
      unattempted: total - attempted,
      percentage,
      progressPercent,
      resultText,
      resultColor,
      resultBadge,
      resultIcon,
    };
  }, [questions, userAnswers]);

  // Auto-stop stopwatch when all questions on the page are completed
  useEffect(() => {
    if (questions.length > 0 && stats.attempted === stats.total && isStopwatchRunning) {
      setIsStopwatchRunning(false);
    }
  }, [stats.attempted, stats.total, questions.length, isStopwatchRunning]);

  const allRevealed = useMemo(() => {
    if (questions.length === 0) return false;
    return questions.every((q, idx) => {
      const qId = q._id || q.sql_id || idx;
      return !!revealedAnswers[qId];
    });
  }, [questions, revealedAnswers]);

  const handleToggleAllAnswers = () => {
    if (allRevealed) {
      setRevealedAnswers({});
    } else {
      const allTrue = {};
      questions.forEach((q, idx) => {
        const qId = q._id || q.sql_id || idx;
        allTrue[qId] = true;
      });
      setRevealedAnswers(allTrue);
    }
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setRevealedAnswers({});
    setStopwatchSeconds(0);
    setIsStopwatchRunning(false);
    setIsStopwatchPaused(false);
  };

  const handleShareClick = (platform) => {
    const fallbackUrl = taxonomy.type === 'state'
      ? `https://educationmasters.in/state/${currentSlug}/mcq-questions/`
      : `https://educationmasters.in/${currentSlug}/mcq-questions/`;
    const targetUrl = shareUrl || (typeof window !== 'undefined' ? window.location.href : fallbackUrl);
    const titleText = `${totalQuestions || 3800}+ ${taxonomy.name} MCQ Questions with Answers | Education Masters`;

    let shareLink = '';
    switch (platform) {
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent(titleText)}`;
        break;
      case 'whatsapp':
        shareLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${titleText} ${targetUrl}`)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetUrl)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(targetUrl)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent(titleText)}`;
        break;
      case 'reddit':
        shareLink = `https://reddit.com/submit?url=${encodeURIComponent(targetUrl)}&title=${encodeURIComponent(titleText)}`;
        break;
      default:
        break;
    }
    if (shareLink && typeof window !== 'undefined') {
      window.open(shareLink, '_blank', 'noopener,noreferrer');
    }
  };

  const getPaginationItems = (current, total) => {
    if (total <= 9) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, 6, '...', total - 1, total];
    }
    if (current >= total - 3) {
      return [1, 2, '...', total - 5, total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 2, current - 1, current, current + 1, current + 2, '...', total];
  };

  const startItem = totalQuestions === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalQuestions);

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900">
      {/* 1. Header & Live Ticker */}
      <Header />
      <LiveTicker />

      {/* 2. Main Page Layout with Skyscraper Sidebar & 3-Column Content */}
      <div className="max-w-[1550px] mx-auto px-3 sm:px-4 py-6 flex-1 w-full bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ============================================================== */}
          {/* LEFT COLUMN: Sidebar Navigation with Instant Search & Accordions */}
          {/* ============================================================== */}
          <aside className="hidden lg:block lg:col-span-3 space-y-3 sticky top-20 self-start">

            {/* Accordion 1: Subjectwise MCQ (Professional Light Grayish Theme) */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden transition-all">
              <div
                onClick={() => setOpenSubjects(!openSubjects)}
                className={`bg-slate-100 hover:bg-slate-200/80 text-slate-800 px-3.5 py-2.5 font-bold text-xs sm:text-sm flex items-center justify-between cursor-pointer transition select-none ${openSubjects ? 'border-b border-slate-200' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-white text-slate-600 flex items-center justify-center border border-slate-300/80 shadow-2xs">
                    <BookOpen size={13} className="text-slate-600" />
                  </div>
                  <span className="tracking-wide text-slate-800 font-bold">Subjectwise MCQ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-bold bg-white text-slate-700 border border-slate-300 px-2 py-0.5 rounded leading-none shadow-2xs">
                    {filteredSubjects.length !== SUBJECTS_LIST.length
                      ? `${filteredSubjects.length}/${SUBJECTS_LIST.length}`
                      : SUBJECTS_LIST.length}
                  </span>
                  {openSubjects ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                </div>
              </div>
              {openSubjects && (
                <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100 text-xs font-semibold bg-slate-50/40 custom-scrollbar">
                  {/* Search Bar */}
                  <div className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs p-1.5 border-b border-slate-200">
                    <div className="relative flex items-center">
                      <Search size={12} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={subjectSearch}
                        onChange={(e) => setSubjectSearch(e.target.value)}
                        placeholder="Search subjects..."
                        className="w-full pl-7 pr-6 py-1 text-xs bg-white text-slate-800 placeholder-slate-400 border border-slate-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      {subjectSearch && (
                        <button
                          onClick={() => setSubjectSearch('')}
                          className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                          title="Clear search"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List items */}
                  {filteredSubjects.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500 font-medium">
                      No subjects found
                    </div>
                  ) : (
                    filteredSubjects.map((sub) => {
                      const isSelected = taxonomy.type === 'subject' && currentSlug === sub.slug;
                      return (
                        <Link
                          key={sub.slug}
                          href={`/${sub.slug}/mcq-questions`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleSelectTaxonomy(sub.slug);
                          }}
                          className={`w-full text-left px-3.5 py-2 transition flex items-center justify-between cursor-pointer ${isSelected
                              ? 'bg-blue-50/90 text-blue-900 font-bold border-l-4 border-blue-600 pl-3.5 shadow-2xs'
                              : 'text-slate-700 hover:bg-slate-100/80 hover:text-blue-700 hover:pl-4 font-medium'
                            }`}
                        >
                          <span>{sub.name}</span>
                          {isSelected && <ChevronRight size={13} className="text-blue-600 shrink-0" />}
                        </Link>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Accordion 2: Statewise Preparation (Professional Light Grayish Theme) */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden transition-all">
              <div
                onClick={() => setOpenStates(!openStates)}
                className={`bg-slate-100 hover:bg-slate-200/80 text-slate-800 px-3.5 py-2.5 font-bold text-xs sm:text-sm flex items-center justify-between cursor-pointer transition select-none ${openStates ? 'border-b border-slate-200' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-white text-slate-600 flex items-center justify-center border border-slate-300/80 shadow-2xs">
                    <Layers size={13} className="text-slate-600" />
                  </div>
                  <span className="tracking-wide text-slate-800 font-bold">Statewise Preparation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-bold bg-white text-slate-700 border border-slate-300 px-2 py-0.5 rounded leading-none shadow-2xs">
                    {filteredStates.length !== STATES_LIST.length
                      ? `${filteredStates.length}/${STATES_LIST.length}`
                      : STATES_LIST.length}
                  </span>
                  {openStates ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                </div>
              </div>
              {openStates && (
                <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100 text-xs font-semibold bg-slate-50/40 custom-scrollbar">
                  {/* Search Bar */}
                  <div className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs p-1.5 border-b border-slate-200">
                    <div className="relative flex items-center">
                      <Search size={12} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={stateSearch}
                        onChange={(e) => setStateSearch(e.target.value)}
                        placeholder="Search states..."
                        className="w-full pl-7 pr-6 py-1 text-xs bg-white text-slate-800 placeholder-slate-400 border border-slate-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      {stateSearch && (
                        <button
                          onClick={() => setStateSearch('')}
                          className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                          title="Clear search"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List items */}
                  {filteredStates.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500 font-medium">
                      No states found
                    </div>
                  ) : (
                    filteredStates.map((st) => {
                      const isSelected = taxonomy.type === 'state' && currentSlug === st.slug;
                      return (
                        <Link
                          key={st.slug}
                          href={`/state/${st.slug}/mcq-questions`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleSelectTaxonomy(st.slug, 'state');
                          }}
                          className={`w-full text-left px-3.5 py-2 transition flex items-center justify-between cursor-pointer ${isSelected
                              ? 'bg-blue-50/90 text-blue-900 font-bold border-l-4 border-blue-600 pl-3.5 shadow-2xs'
                              : 'text-slate-700 hover:bg-slate-100/80 hover:text-blue-700 hover:pl-4 font-medium'
                            }`}
                        >
                          <span>{st.name}</span>
                          {isSelected && <ChevronRight size={13} className="text-blue-600 shrink-0" />}
                        </Link>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Accordion 3: Govt. Examwise MCQ (Professional Light Grayish Theme) */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden transition-all">
              <div
                onClick={() => setOpenExams(!openExams)}
                className={`bg-slate-100 hover:bg-slate-200/80 text-slate-800 px-3.5 py-2.5 font-bold text-xs sm:text-sm flex items-center justify-between cursor-pointer transition select-none ${openExams ? 'border-b border-slate-200' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-white text-slate-600 flex items-center justify-center border border-slate-300/80 shadow-2xs">
                    <Sparkles size={13} className="text-slate-600" />
                  </div>
                  <span className="tracking-wide text-slate-800 font-bold">Govt. Examwise MCQ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-bold bg-white text-slate-700 border border-slate-300 px-2 py-0.5 rounded leading-none shadow-2xs">
                    {filteredExams.length !== EXAMS_LIST.length
                      ? `${filteredExams.length}/${EXAMS_LIST.length}`
                      : EXAMS_LIST.length}
                  </span>
                  {openExams ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                </div>
              </div>
              {openExams && (
                <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100 text-xs font-semibold bg-slate-50/40 custom-scrollbar">
                  {/* Search Bar */}
                  <div className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs p-1.5 border-b border-slate-200">
                    <div className="relative flex items-center">
                      <Search size={12} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={examSearch}
                        onChange={(e) => setExamSearch(e.target.value)}
                        placeholder="Search exams..."
                        className="w-full pl-7 pr-6 py-1 text-xs bg-white text-slate-800 placeholder-slate-400 border border-slate-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      {examSearch && (
                        <button
                          onClick={() => setExamSearch('')}
                          className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                          title="Clear search"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List items */}
                  {filteredExams.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500 font-medium">
                      No exams found
                    </div>
                  ) : (
                    filteredExams.map((ex) => {
                      const isSelected = taxonomy.type === 'exam' && currentSlug === ex.slug;
                      return (
                        <Link
                          key={ex.slug}
                          href={`/${ex.slug}/mcq-questions`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleSelectTaxonomy(ex.slug);
                          }}
                          className={`w-full text-left px-3.5 py-2 transition flex items-center justify-between cursor-pointer ${isSelected
                              ? 'bg-blue-50/90 text-blue-900 font-bold border-l-4 border-blue-600 pl-3.5 shadow-2xs'
                              : 'text-slate-700 hover:bg-slate-100/80 hover:text-blue-700 hover:pl-4 font-medium'
                            }`}
                        >
                          <span>{ex.name}</span>
                          {isSelected && <ChevronRight size={13} className="text-blue-600 shrink-0" />}
                        </Link>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* ============================================================== */}
          {/* CENTER COLUMN: Perfectly Placed Breadcrumbs + Beautiful Content */}
          {/* ============================================================== */}
          <main className="col-span-1 lg:col-span-6 xl:col-span-6 space-y-4">

            {/* Dynamic Breadcrumbs Tailored for Exams / States / Subjects */}
            <div className="text-xs text-slate-500 mb-1 flex items-center justify-between gap-2 font-medium overflow-x-auto whitespace-nowrap scrollbar-none">
              <div className="flex items-center gap-1.5 min-w-0">
                <Link href="/" className="hover:text-blue-600 text-blue-600 underline">
                  Home
                </Link>
                <span>›</span>
                <Link href={taxonomy.breadcrumbCatLink || '/mcq-questions'} className="hover:text-blue-600 text-slate-500">
                  {taxonomy.breadcrumbCategory}
                </Link>
                <span>›</span>
                <span className="text-slate-800 font-bold truncate">{taxonomy.name}</span>
              </div>

              {/* Language Switcher Badge (Aligned cleanly in breadcrumb header row) */}
              <button
                type="button"
                onClick={() => setLanguage(language === 'English' ? 'Hindi' : 'English')}
                className="shrink-0 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded border border-blue-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
              >
                <Globe size={13} className="text-blue-600" />
                <span>{language === 'English' ? 'हिन्दी' : 'English'}</span>
              </button>
            </div>

            {/* Top Title Header */}
            <div className="border-b border-slate-200 pb-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
                {totalQuestions > 0 ? `${totalQuestions}+` : '3800+'}{' '}
                {taxonomy.name} Questions | GK Questions MCQ | gk mcq questions with answers in {language}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
                {taxonomy.subtitle} in {language}
              </p>

              {/* Social Share Bar (Hydration-Safe Click Handlers) */}
              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100 flex-wrap">
                <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
                  <Share2 size={13} className="text-blue-600" /> Share:
                </span>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={() => handleShareClick('telegram')}
                  className="group inline-flex items-center justify-center h-7 px-2 rounded-full bg-[#0088cc] hover:bg-[#0077b5] text-white transition-all duration-300 ease-out shadow-2xs hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 cursor-pointer text-xs font-medium"
                  title="Share on Telegram"
                >
                  <Send size={12} className="-ml-0.5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                  <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[11px] transition-all duration-300 ease-out group-hover:max-w-20 group-hover:opacity-100 group-hover:ml-1">
                    Telegram
                  </span>
                </button>

                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={() => handleShareClick('whatsapp')}
                  className="group inline-flex items-center justify-center h-7 px-2 rounded-full bg-[#25D366] hover:bg-[#1eb956] text-white transition-all duration-300 ease-out shadow-2xs hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 cursor-pointer text-xs font-medium"
                  title="Share on WhatsApp"
                >
                  <MessageCircle size={13} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
                  <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[11px] transition-all duration-300 ease-out group-hover:max-w-20 group-hover:opacity-100 group-hover:ml-1">
                    WhatsApp
                  </span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={() => handleShareClick('facebook')}
                  className="group inline-flex items-center justify-center h-7 px-2 rounded-full bg-[#1877F2] hover:bg-[#166fe5] text-white transition-all duration-300 ease-out shadow-2xs hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 cursor-pointer text-xs font-medium"
                  title="Share on Facebook"
                >
                  <svg className="w-3.5 h-3.5 fill-current shrink-0 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.12 8.44 9.88v-6.99H7.9v-2.89h2.54V9.8c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.89h-2.34V21.9C18.34 21.12 22 16.99 22 12z" />
                  </svg>
                  <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[11px] transition-all duration-300 ease-out group-hover:max-w-20 group-hover:opacity-100 group-hover:ml-1">
                    Facebook
                  </span>
                </button>

                {/* LinkedIn */}
                <button
                  type="button"
                  onClick={() => handleShareClick('linkedin')}
                  className="group inline-flex items-center justify-center h-7 px-2 rounded-full bg-[#0A66C2] hover:bg-[#084e96] text-white transition-all duration-300 ease-out shadow-2xs hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 cursor-pointer text-xs font-medium"
                  title="Share on LinkedIn"
                >
                  <svg className="w-3 h-3 fill-current shrink-0 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.66a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
                  </svg>
                  <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[11px] transition-all duration-300 ease-out group-hover:max-w-20 group-hover:opacity-100 group-hover:ml-1">
                    LinkedIn
                  </span>
                </button>

                {/* Twitter / X */}
                <button
                  type="button"
                  onClick={() => handleShareClick('twitter')}
                  className="group inline-flex items-center justify-center h-7 px-2 rounded-full bg-slate-900 hover:bg-black text-white transition-all duration-300 ease-out shadow-2xs hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 cursor-pointer text-xs font-medium"
                  title="Share on X"
                >
                  <svg className="w-3 h-3 fill-current shrink-0 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[11px] transition-all duration-300 ease-out group-hover:max-w-20 group-hover:opacity-100 group-hover:ml-1">
                    Twitter
                  </span>
                </button>

                {/* Reddit */}
                <button
                  type="button"
                  onClick={() => handleShareClick('reddit')}
                  className="group inline-flex items-center justify-center h-7 px-2 rounded-full bg-[#FF4500] hover:bg-[#e03d00] text-white transition-all duration-300 ease-out shadow-2xs hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 cursor-pointer text-xs font-medium"
                  title="Share on Reddit"
                >
                  <svg className="w-3.5 h-3.5 fill-current shrink-0 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                  </svg>
                  <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[11px] transition-all duration-300 ease-out group-hover:max-w-20 group-hover:opacity-100 group-hover:ml-1">
                    Reddit
                  </span>
                </button>
              </div>
            </div>

            {/* Dynamic Intro / SEO Callout Box with High Contrast */}
            <div className="bg-[#f8fafc] border-l-4 border-blue-600 border-y border-r border-slate-200 rounded p-4 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2 mb-4 shadow-2xs">
              <p className="font-semibold text-slate-900 text-sm sm:text-base">
                <span className="text-blue-600 underline cursor-pointer">{taxonomy.name}</span>{' '}
                Questions with Answers in {language} – Best for Competitive Exams{' '}
                <span className="inline-block bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded ml-1">
                  {taxonomy.tag}
                </span>
              </p>
              <p className="text-slate-600 font-normal">
                {taxonomy.description} Test your preparation, practice solved objective questions, and improve your accuracy for competitive examinations.
              </p>
              {showMoreIntro && (
                <div className="pt-2 border-t border-slate-200 text-slate-600 space-y-1.5 animate-in fade-in">
                  <p>
                    All multiple choice questions feature verified answers, detailed step-by-step explanations, and
                    important reference notes. Test your knowledge, track accuracy, and boost your exam scores today.
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowMoreIntro(!showMoreIntro)}
                className="text-blue-600 font-semibold hover:underline cursor-pointer inline-block text-xs"
              >
                {showMoreIntro ? 'Show less' : 'Show more...'}
              </button>
            </div>

            {/* Loading Indicator */}
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs sm:text-sm text-slate-600 font-medium">Loading {taxonomy.name} questions...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <BookOpen size={36} className="mx-auto text-slate-400" />
                <h3 className="font-bold text-slate-800 text-base sm:text-lg">No questions found for {taxonomy.name}</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Try selecting another category from the left menu or switching the language filter.
                </p>
              </div>
            ) : (
              /* MCQ Questions List with Dynamic Performance Header & In-Feed Ad Spacing */
              <div className="space-y-6">

                {/* ======================================================= */}
                {/* LIVE MCQ PERFORMANCE SCORECARD & STOPWATCH HEADER */}
                {/* ======================================================= */}
                <div className="sticky top-14 sm:top-16 z-20 bg-white/95 backdrop-blur-xs rounded-xl border border-slate-200 shadow-2xs p-2 sm:p-3 mb-4 transition-all duration-150 select-none w-full box-border transform-none">
                  {/* Top Bar with Title, Stopwatch & Action Controls */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5 sm:gap-2 pb-1.5 sm:pb-2 border-b border-slate-100">
                    
                    {/* Left: Title & Attempted Count Badge + Mobile Action Buttons */}
                    <div className="flex items-center justify-between md:justify-start gap-1.5 sm:gap-2.5 w-full md:w-auto">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs shrink-0">
                          <Sparkles size={13} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1 sm:gap-1.5">
                            <span className="truncate">Live Scorecard</span>
                            <span className="text-[10px] sm:text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 sm:px-2 py-0.2 rounded-full whitespace-nowrap">
                              {stats.attempted}/{stats.total}
                            </span>
                          </h3>
                          <p className="text-[10px] text-slate-500 font-normal hidden md:block">
                            Instant accuracy, score evaluation &amp; speed analytics
                          </p>
                        </div>
                      </div>

                      {/* Mobile Top Controls: Topics Button + Fullscreen Button + Reset Button */}
                      <div className="flex md:hidden items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setMobileFilterTab(taxonomy.type === 'state' ? 'state' : taxonomy.type === 'exam' ? 'exam' : 'subject');
                            setMobileFilterSearch('');
                            setIsMobileFilterOpen(true);
                          }}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded-lg border border-blue-200 flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs shrink-0"
                        >
                          <Filter size={11} className="text-blue-600 shrink-0" />
                          <span>Topics</span>
                          <ChevronDown size={11} className="text-blue-500 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsFullscreenMode(true)}
                          className="p-1 sm:p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs shrink-0"
                          title="Fullscreen Focus Mode"
                        >
                          <Maximize2 size={13} className="text-slate-700" />
                        </button>

                        <button
                          type="button"
                          onClick={handleResetQuiz}
                          disabled={stats.attempted === 0 && stopwatchSeconds === 0}
                          className="p-1 sm:px-2 sm:py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] sm:text-xs font-bold rounded-lg border border-rose-200 transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title="Reset answers & restart stopwatch"
                        >
                          <AnimatedRotateCcw size={12} className="text-rose-600 shrink-0" />
                          <span className="hidden sm:inline">Reset</span>
                        </button>
                      </div>
                    </div>

                    {/* Right: Stopwatch & AI Analysis, Fullscreen & Desktop Reset */}
                    <div className="grid grid-cols-2 md:flex md:items-center gap-1.5 sm:gap-2 w-full md:w-auto">
                      
                      {/* 1. ⏱️ Live Stopwatch Pill */}
                      <div
                        className={`flex items-center justify-between md:justify-start gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border text-[11px] sm:text-xs font-semibold transition-all duration-200 shadow-2xs ${
                          isStopwatchRunning
                            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900 ring-1 ring-emerald-400/50'
                            : isStopwatchPaused
                              ? 'bg-amber-50/90 border-amber-300 text-amber-900 ring-1 ring-amber-400/50'
                              : stats.attempted > 0 && stats.attempted === stats.total
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <AnimatedClock
                            size={12}
                            className={
                              isStopwatchRunning
                                ? 'text-emerald-600'
                                : isStopwatchPaused
                                  ? 'text-amber-600'
                                  : 'text-slate-500'
                            }
                          />
                          <span className="font-mono text-xs sm:text-sm font-black tracking-tight">
                            {formatStopwatchTime(stopwatchSeconds)}
                          </span>
                        </div>

                        {/* Stopwatch State Indicator & Pause/Resume Controls */}
                        {isStopwatchRunning ? (
                          <div className="flex items-center gap-1 border-l border-emerald-300/80 pl-1">
                            <span className="flex h-1.5 w-1.5 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            <button
                              type="button"
                              onClick={handleToggleStopwatch}
                              title="Pause Stopwatch"
                              className="p-0.5 hover:bg-emerald-200/70 rounded text-emerald-800 transition cursor-pointer"
                            >
                              <Pause size={10} />
                            </button>
                          </div>
                        ) : isStopwatchPaused ? (
                          <div className="flex items-center gap-1 border-l border-amber-300/80 pl-1">
                            <span className="text-[9px] sm:text-[10px] text-amber-700 font-bold">
                              Paused
                            </span>
                            <button
                              type="button"
                              onClick={handleToggleStopwatch}
                              title="Resume Stopwatch"
                              className="p-0.5 hover:bg-amber-200/70 rounded text-amber-800 transition cursor-pointer"
                            >
                              <Play size={10} />
                            </button>
                          </div>
                        ) : stats.attempted > 0 && stats.attempted === stats.total ? (
                          <span className="text-[9px] sm:text-[10px] text-indigo-700 font-bold border-l border-indigo-200 pl-1">
                            🏆 Done
                          </span>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] text-slate-400 border-l border-slate-200 pl-1">
                            Timer
                          </span>
                        )}
                      </div>

                      {/* 2. 🧠 Edu AI Performance Button */}
                      <button
                        type="button"
                        onClick={handleOpenAiAnalysis}
                        className="group relative px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 active:scale-95 text-white text-[11px] sm:text-xs font-extrabold rounded-lg border border-blue-500/40 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        title="Edu AI Performance, Accuracy Graph & Speed Diagnostics"
                      >
                        <AnimatedAiEye size={13} className="text-white shrink-0" />
                        <span className="font-bold text-[11px] sm:text-xs whitespace-nowrap">AI Analysis</span>
                      </button>

                      {/* 3. ⛶ Fullscreen Focus Mode Button */}
                      <button
                        type="button"
                        onClick={() => setIsFullscreenMode(true)}
                        className="hidden md:flex group px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 transition-all duration-200 items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 shrink-0"
                        title="Open Fullscreen Focus Mode (Esc to exit)"
                      >
                        <Maximize2 size={13} className="text-slate-700 group-hover:scale-110 transition-transform" />
                        <span>Fullscreen</span>
                      </button>

                      {/* 4. ↺ Reset Button for Desktop */}
                      <button
                        type="button"
                        onClick={handleResetQuiz}
                        disabled={stats.attempted === 0 && stopwatchSeconds === 0}
                        className="hidden md:flex group px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold rounded-lg border border-rose-200 transition-all duration-200 items-center gap-1 cursor-pointer shadow-2xs active:scale-95 shrink-0"
                        title="Reset answers & restart stopwatch"
                      >
                        <AnimatedRotateCcw size={13} className="text-rose-600 group-hover:text-rose-700" />
                        <span>Reset</span>
                      </button>

                    </div>
                  </div>

                  {/* Compact High-Density Metric Cards Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2.5 pt-1.5">
                    
                    {/* 1. Correct Stat Card (Compact, No redundant subtext) */}
                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 flex flex-col justify-between shadow-2xs hover:bg-emerald-50 transition">
                      <div className="flex items-center justify-between text-emerald-800 text-[10px] sm:text-xs font-semibold">
                        <span>Correct</span>
                        <CheckCircle2 size={12} className="text-emerald-600" />
                      </div>
                      <div className="mt-0 flex items-baseline gap-1">
                        <span className="text-base sm:text-xl font-black text-emerald-700 tracking-tight">
                          {stats.correct}
                        </span>
                        <span className="text-[9px] sm:text-[11px] text-emerald-600 font-medium">answers</span>
                      </div>
                    </div>

                    {/* 2. Incorrect Stat Card (Compact, No redundant subtext) */}
                    <div className="bg-rose-50/60 border border-rose-200/80 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 flex flex-col justify-between shadow-2xs hover:bg-rose-50 transition">
                      <div className="flex items-center justify-between text-rose-800 text-[10px] sm:text-xs font-semibold">
                        <span>Incorrect</span>
                        <XCircle size={12} className="text-rose-600" />
                      </div>
                      <div className="mt-0 flex items-baseline gap-1">
                        <span className="text-base sm:text-xl font-black text-rose-700 tracking-tight">
                          {stats.incorrect}
                        </span>
                        <span className="text-[9px] sm:text-[11px] text-rose-600 font-medium">mistakes</span>
                      </div>
                    </div>

                    {/* 3. Accuracy Stat Card (Desktop Only - hidden on mobile) */}
                    <div className="hidden lg:flex bg-blue-50/60 border border-blue-200/80 rounded-lg px-3 py-2 flex-col justify-between shadow-2xs hover:bg-blue-50 transition">
                      <div className="flex items-center justify-between text-blue-800 text-[11px] sm:text-xs font-semibold">
                        <span>Accuracy</span>
                        <span className="text-xs font-extrabold text-blue-700">%</span>
                      </div>
                      <div className="mt-0.5 flex items-baseline gap-1">
                        <span className="text-lg sm:text-xl font-black text-blue-700 tracking-tight">
                          {stats.percentage}%
                        </span>
                      </div>
                      <div className="mt-1 w-full bg-blue-200/60 rounded-full h-1 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* 4. Result & Performance Card (Desktop Only - hidden on mobile) */}
                    <div className={`hidden lg:flex rounded-lg px-3 py-2 border flex-col justify-between shadow-2xs transition ${stats.resultColor}`}>
                      <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold">
                        <span>Performance</span>
                        <span className="text-xs">{stats.resultIcon}</span>
                      </div>
                      <div className="mt-0.5 flex items-baseline justify-between gap-1">
                        <span className="text-xs sm:text-sm font-black tracking-tight leading-tight truncate">
                          {stats.resultText}
                        </span>
                        {stats.attempted > 0 && stopwatchSeconds > 0 && (
                          <span className="font-mono text-[9px] font-bold opacity-80 shrink-0">
                            ~{Math.max(1, Math.round(stopwatchSeconds / stats.attempted))}s/Q
                          </span>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Overall Test Completion Progress Bar */}
                  <div className="mt-1.5 pt-1 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px] sm:text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="font-semibold text-slate-700 shrink-0 text-[10px] sm:text-[11px]">Progress:</span>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/80">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${stats.progressPercent}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-bold text-slate-700 text-[10px] sm:text-[11px] shrink-0">{stats.progressPercent}% Completed</span>
                  </div>
                </div>

                {questions.map((q, idx) => {
                  const qId = q._id || q.sql_id || idx;
                  const questionNum = (page - 1) * pageSize + idx + 1;
                  const selectedOpt = userAnswers[qId];
                  const isRevealed = !!revealedAnswers[qId];

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

                  // In-Feed Ad after #3, then every 7 questions (#10, #17, #24...)
                  const showAdAfter = (idx + 1 === 3) || (idx + 1 > 3 && (idx + 1 - 3) % 7 === 0);

                  return (
                    <React.Fragment key={qId}>
                      {/* Single Question Box with Clean Layout (No bottom border) */}
                      <div id={`question-box-${idx}`} className="space-y-3 pb-4 p-1 rounded-xl transition-colors duration-300">
                        {/* Question Title */}
                        <div className="flex items-start gap-2">
                          <h2 className="text-sm sm:text-[16px] font-bold text-slate-900 leading-snug">
                            <span className="text-slate-900 mr-1.5">{questionNum}.</span>
                            {q.content || 'Question content'}
                          </h2>
                        </div>

                        {/* 2-Column Options Grid with Subtle, Professional Borders */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 pt-0.5">
                          {Array.isArray(q.options) &&
                            q.options.slice(0, 4).map((opt, optIdx) => {
                              const letter = String.fromCharCode(65 + optIdx);
                              const isChecked = selectedOpt === optIdx;
                              const isAnswered = selectedOpt !== undefined;
                              const isOptionCorrect = optIdx === correctIndex;
                              const showCorrectHighlight = (isAnswered || isRevealed) && isOptionCorrect;
                              const showWrongHighlight = isAnswered && isChecked && !isOptionCorrect;

                              return (
                                <label
                                  key={optIdx}
                                  onClick={() => handleSelectOption(qId, optIdx)}
                                  className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition select-none ${
                                    showCorrectHighlight
                                      ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-semibold'
                                      : showWrongHighlight
                                        ? 'bg-rose-50/80 border-rose-300 text-rose-950 font-semibold'
                                        : isChecked
                                          ? 'bg-blue-50/50 border-blue-500 text-blue-950 font-medium shadow-2xs'
                                          : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50/70 font-normal'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <input
                                      type="radio"
                                      name={`question-opt-${qId}`}
                                      checked={isChecked}
                                      onChange={() => handleSelectOption(qId, optIdx)}
                                      className="accent-blue-600 w-4 h-4 cursor-pointer shrink-0"
                                    />
                                    <span className="min-w-0 break-words leading-tight">
                                      <strong className="mr-1 text-slate-900 font-bold">{letter}.</strong>
                                      {opt.text}
                                    </span>
                                  </div>

                                  {/* Visual status indicators - ONLY visible when user clicks View Answer */}
                                  {showCorrectHighlight && (
                                    <span className="shrink-0 text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                                      ✓ Correct
                                    </span>
                                  )}
                                  {showWrongHighlight && (
                                    <span className="shrink-0 text-[11px] font-bold text-rose-700 flex items-center gap-1 bg-rose-100/90 px-2 py-0.5 rounded-md">
                                      ✕ Wrong
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                        </div>

                        {/* View Answer / Action Bar */}
                        <div className="flex items-center justify-between pt-0.5">
                          <button
                            type="button"
                            onClick={() => toggleViewAnswer(qId)}
                            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition cursor-pointer py-1 group"
                          >
                            {isRevealed ? (
                              <>
                                <EyeOff size={14} className="group-hover:scale-110 transition-transform" />
                                <span>Hide Answer</span>
                              </>
                            ) : (
                              <>
                                <Eye size={14} className="group-hover:scale-110 transition-transform" />
                                <span>View Answer</span>
                              </>
                            )}
                          </button>

                          {q.examination_names && q.examination_names.length > 0 && (
                            <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md border border-slate-200">
                              {q.examination_names[0]}
                            </span>
                          )}
                        </div>

                        {/* Collapsible Answer & Explanation Box (Only shown when user clicks View Answer) */}
                        {isRevealed && (
                          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs sm:text-sm text-emerald-950 space-y-1.5 animate-in fade-in duration-200">
                            <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                              <span>
                                Correct Answer: Option{' '}
                                {correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : 'N/A'}{' '}
                                {correctIndex >= 0 && q.options?.[correctIndex]?.text
                                  ? `(${q.options[correctIndex].text})`
                                  : ''}
                              </span>
                            </div>
                            {q.ans_info && (
                              <p className="text-slate-700 text-xs sm:text-sm pl-6 pt-1.5 border-t border-emerald-200/70 leading-relaxed font-normal">
                                <strong className="text-emerald-950 font-semibold">Explanation:</strong> {q.ans_info}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ======================================================= */}
                      {/* IN-FEED AD SPACE (After Question #3, #10, #17, #24...)  */}
                      {/* ======================================================= */}
                      {showAdAfter && (
                        <div className="my-5 p-4 bg-[#f8fafc] rounded-lg border border-slate-200 space-y-3 shadow-2xs">
                          {/* Top "Discover more" Row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-2xs">
                              Discover more
                            </span>
                            {DISCOVER_TAGS.slice(0, 3).map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-white px-2.5 py-1 rounded border border-blue-200 hover:bg-blue-50 transition cursor-pointer"
                              >
                                <span>{tag.icon}</span>
                                <span>{tag.name}</span>
                              </span>
                            ))}
                          </div>

                          {/* Sponsored Mockup Banner */}
                          <div className="p-3 bg-white rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                                EM
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-xs sm:text-sm">
                                  Practice 15,000+ Free Mock Tests & Quizzes
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Instant score analysis, all-India rank & detailed solutions.
                                </p>
                              </div>
                            </div>
                            <Link
                              href="/mock-test"
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition shadow-xs shrink-0 self-start sm:self-auto inline-block"
                            >
                              Start Free Test
                            </Link>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* ============================================================== */}
            {/* HIGH-CONTRAST PROFESSIONAL PAGINATION BAR                      */}
            {/* ============================================================== */}
            {totalPages > 1 && (
              <div className="pt-6 pb-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Left Result Counter text */}
                <div className="text-xs sm:text-sm text-slate-500 font-medium">
                  Showing {startItem} to {endItem} of {totalQuestions} results
                </div>

                {/* Right Pagination Button Group */}
                <div className="inline-flex items-center rounded-md border border-slate-200 bg-white overflow-hidden text-xs sm:text-sm shadow-xs">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed border-r border-slate-200 transition font-medium"
                    title="Previous page"
                  >
                    ‹
                  </button>

                  {getPaginationItems(page, totalPages).map((item, index) => {
                    if (item === '...') {
                      return (
                        <span
                          key={`dots-${index}`}
                          className="px-3 py-1.5 text-slate-400 border-r border-slate-200 font-medium select-none"
                        >
                          ...
                        </span>
                      );
                    }

                    const isCurrent = item === page;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handlePageChange(item)}
                        className={`px-3 py-1.5 transition border-r border-slate-200 last:border-r-0 font-medium ${isCurrent
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-blue-600 hover:bg-slate-50'
                          }`}
                      >
                        {item}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition font-medium"
                    title="Next page"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: Tabbed Sidebar with Visible Images               */}
          {/* ============================================================== */}
          <aside className="col-span-1 lg:col-span-3 space-y-6 sticky top-20">
            <div className="bg-[#f0f2f5] border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
              {/* Tabs matching Syllabus Page */}
              <div className="flex items-center bg-[#e4e7ec] border-b border-slate-300">
                <button
                  type="button"
                  onClick={() => setRightTab('expiring')}
                  className={`flex-1 py-3.5 px-3 text-center text-xs sm:text-sm whitespace-nowrap transition ${rightTab === 'expiring'
                      ? 'bg-[#f0f2f5] text-slate-900 rounded-tl-lg font-medium'
                      : 'text-blue-600 hover:text-blue-700 font-medium'
                    }`}
                >
                  Jobs Expiring Soon
                </button>
                <button
                  type="button"
                  onClick={() => setRightTab('mcq')}
                  className={`flex-1 py-3.5 px-3 text-center text-xs sm:text-sm whitespace-nowrap transition ${rightTab === 'mcq'
                      ? 'bg-[#f0f2f5] text-slate-900 rounded-tr-lg font-medium'
                      : 'text-blue-600 hover:text-blue-700 font-medium'
                    }`}
                >
                  Discover More
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4 bg-[#f0f2f5]">
                {rightTab === 'expiring' ? (
                  <div>
                    {/* Subheader */}
                    <div className="flex items-center justify-between text-[11px] sm:text-xs mb-3 pb-2.5 border-b border-slate-300 gap-1.5">
                      <span className="text-slate-700 font-normal whitespace-nowrap">
                        {expiringJobs.length > 0 ? `${expiringJobs.length} Jobs are expiring soon` : '28 Jobs are expiring in 30 Days'}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link href="/jobs-expiring-in-30-days" className="text-blue-600 font-normal hover:underline whitespace-nowrap text-[11px] sm:text-xs">
                          View All
                        </Link>
                        <span className="bg-blue-600 text-white text-[10px] sm:text-[11px] font-normal px-1.5 py-0.5 rounded inline-flex items-center gap-1 leading-none whitespace-nowrap shadow-2xs">
                          <span>📰</span>
                          <span>Jobs</span>
                        </span>
                      </div>
                    </div>

                    {/* Jobs List with PROPER VISIBLE RECTANGULAR THUMBNAILS */}
                    {loadingJobs ? (
                      <div className="py-8 text-center text-xs text-slate-500 font-medium">Loading latest jobs...</div>
                    ) : expiringJobs.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 font-medium">No recent jobs available</div>
                    ) : (
                      <div className="divide-y divide-slate-300">
                        {expiringJobs.map((item) => {
                          const miniMediaUrl = getImageUrl(item.featured_media || item.image);

                          return (
                            <Link
                              key={item._id || item.slug}
                              href={`/job/${item.slug || item._id}`}
                              className="py-3.5 first:pt-1 last:pb-1 flex items-start gap-3 group transition block"
                            >
                              {/* Large visible thumbnail container */}
                              <div className="w-24 sm:w-28 h-16 sm:h-18 bg-white rounded border border-slate-300 overflow-hidden shrink-0 shadow-2xs">
                                <img
                                  src={miniMediaUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    if (!e.currentTarget.dataset.fallback) {
                                      e.currentTarget.dataset.fallback = 'true';
                                      e.currentTarget.src = '/job-search.png';
                                    } else {
                                      e.currentTarget.style.display = 'none';
                                    }
                                  }}
                                />
                              </div>

                              {/* Job Details */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between h-16 sm:h-18">
                                <h4 className="text-xs sm:text-sm font-normal text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                  {item.title}
                                </h4>
                                <div className="text-xs text-slate-500 font-normal flex items-center justify-between mt-auto">
                                  <span>Last Date: {formatShortDate(item.app_ends || item.dates?.last_date)}</span>
                                  <span className="text-blue-600 font-semibold text-[11px]">Jobs</span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Discover More Tab Content */
                  <div className="space-y-2 py-1">
                    <div className="divide-y divide-slate-200 text-xs font-semibold">
                      {[
                        { label: 'Education Resources', href: '/category/education' },
                        { label: 'General Knowledge Hub', href: '/general-knowledge/mcq-questions' },
                        { label: 'Government Exam Syllabus', href: '/syllabus' },
                        { label: 'Current Affairs & Articles', href: '/articles' },
                        { label: 'Online Typing Speed Test', href: '/typing-test' },
                        { label: 'Mock Test Series 2026', href: '/mock-test' },
                      ].map((item, i) => (
                        <Link
                          key={i}
                          href={item.href}
                          className="py-2.5 px-2 flex items-center justify-between text-slate-700 hover:text-blue-600 hover:bg-white/60 transition rounded"
                        >
                          <span>{item.label}</span>
                          <ChevronRight size={13} className="text-slate-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sponsored Helicopter Banner matching Syllabus Page */}
            <div className="bg-[#e7f9ee] border border-[#a3e6be] rounded border-dashed p-4 text-center relative overflow-hidden shadow-2xs">
              <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider mb-1.5">
                Sponsored Banner
              </div>
              <h4 className="font-bold text-slate-800 text-xs">
                Book a Helicopter in Greece
              </h4>
              <p className="text-[11px] text-slate-600 mt-1">
                Luxury charters &amp; private flight tours available online.
              </p>
              <button
                type="button"
                className="mt-3 bg-black hover:bg-zinc-800 text-white font-bold text-xs px-4 py-1.5 rounded transition shadow-2xs"
              >
                Book Now
              </button>
            </div>
          </aside>

        </div>
      </div>

      {/* 3. Footer */}
      <Footer />

      {/* 📱 Mobile Floating Topic/Filter Trigger (Always available under thumb as user scrolls) */}
      <div className="fixed bottom-5 right-4 z-40 lg:hidden">
        <button
          type="button"
          onClick={() => {
            setMobileFilterTab(taxonomy.type === 'state' ? 'state' : taxonomy.type === 'exam' ? 'exam' : 'subject');
            setMobileFilterSearch('');
            setIsMobileFilterOpen(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-full shadow-xl flex items-center gap-2 border border-white/20 transition-all cursor-pointer ring-2 ring-blue-400/30"
        >
          <SlidersHorizontal size={14} className="text-white" />
          <span>74 Topics</span>
          <span className="bg-white/25 text-white text-[10px] px-1.5 py-0.5 rounded-full">▾</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 📱 MOBILE FILTER DRAWER / BOTTOM SHEET MODAL (Mobile Only)     */}
      {/* ============================================================== */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop with Blur */}
          <div
            onClick={() => setIsMobileFilterOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Bottom Sheet Modal Container */}
          <div className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[88vh] h-[85vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-300 overflow-hidden border-t border-slate-200">
            {/* Top Drag Handle */}
            <div className="pt-2.5 pb-1 flex justify-center">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Modal Header */}
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <SlidersHorizontal size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Select Topic or Exam
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    74 Total Categories • 3800+ Questions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Segmented Category Filter Tabs */}
            <div className="p-3 bg-slate-50/80 border-b border-slate-200 space-y-2.5">
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setMobileFilterTab('subject');
                    setMobileFilterSearch('');
                  }}
                  className={`py-2 px-1 text-center rounded-lg text-xs transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer ${
                    mobileFilterTab === 'subject'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 font-semibold hover:bg-white/50'
                  }`}
                >
                  <BookOpen size={13} className="shrink-0" />
                  <span className="truncate">Subjects ({SUBJECTS_LIST.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileFilterTab('state');
                    setMobileFilterSearch('');
                  }}
                  className={`py-2 px-1 text-center rounded-lg text-xs transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer ${
                    mobileFilterTab === 'state'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 font-semibold hover:bg-white/50'
                  }`}
                >
                  <Layers size={13} className="shrink-0" />
                  <span className="truncate">States ({STATES_LIST.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileFilterTab('exam');
                    setMobileFilterSearch('');
                  }}
                  className={`py-2 px-1 text-center rounded-lg text-xs transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer ${
                    mobileFilterTab === 'exam'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 font-semibold hover:bg-white/50'
                  }`}
                >
                  <Sparkles size={13} className="shrink-0" />
                  <span className="truncate">Exams ({EXAMS_LIST.length})</span>
                </button>
              </div>

              {/* Instant Search Bar */}
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={mobileFilterSearch}
                  onChange={(e) => setMobileFilterSearch(e.target.value)}
                  placeholder={
                    mobileFilterTab === 'subject'
                      ? 'Search from 28 subjects (History, Science, Maths...)'
                      : mobileFilterTab === 'state'
                        ? 'Search from 32 states (UP, Bihar, Uttarakhand...)'
                        : 'Search from 14 exams (IAS, PCS, SSC, CTET...)'
                  }
                  className="w-full pl-9 pr-8 py-2 text-xs bg-white text-slate-800 placeholder-slate-400 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />
                {mobileFilterSearch && (
                  <button
                    type="button"
                    onClick={() => setMobileFilterSearch('')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50/30">
              <div className="text-[11px] font-bold text-slate-500 px-1 flex items-center justify-between">
                <span>
                  {mobileFilterTab === 'subject'
                    ? `Available Subjects (${mobileFilteredItems.length})`
                    : mobileFilterTab === 'state'
                      ? `State GK Tests (${mobileFilteredItems.length})`
                      : `Govt. Exam Quizzes (${mobileFilteredItems.length})`}
                </span>
                {mobileFilterSearch && (
                  <span className="text-blue-600 font-semibold">Filtered results</span>
                )}
              </div>

              {mobileFilteredItems.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Search size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No matching items found</p>
                  <p className="text-[11px] text-slate-500">Try typing a different keyword</p>
                  <button
                    type="button"
                    onClick={() => setMobileFilterSearch('')}
                    className="mt-2 text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mobileFilteredItems.map((item) => {
                    const isSelected =
                      currentSlug === item.slug &&
                      ((mobileFilterTab === 'state' && taxonomy.type === 'state') ||
                        (mobileFilterTab === 'exam' && taxonomy.type === 'exam') ||
                        (mobileFilterTab === 'subject' && taxonomy.type === 'subject'));

                    return (
                      <button
                        key={item.slug}
                        type="button"
                        onClick={() => handleSelectTaxonomy(item.slug, mobileFilterTab || item.category)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 active:scale-[0.98] cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-600 ring-1 ring-blue-600 text-blue-900 shadow-2xs font-bold'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold border ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {mobileFilterTab === 'state' ? '🏛️' : mobileFilterTab === 'exam' ? '🎯' : '📚'}
                          </div>
                          <div className="min-w-0">
                            <span className={`block text-xs sm:text-sm truncate ${isSelected ? 'font-bold text-blue-900' : 'font-semibold text-slate-800'}`}>
                              {item.name}
                            </span>
                            <span className="block text-[10px] text-slate-500 font-normal truncate">
                              {item.fullExamName || (mobileFilterTab === 'state' ? `${item.name} GK Questions` : `${item.name} Multiple Choice Questions`)}
                            </span>
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="flex items-center gap-1 shrink-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                            <CheckCircle2 size={11} />
                            <span>Active</span>
                          </div>
                        ) : (
                          <ChevronRight size={14} className="text-slate-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Sticky Action Footer */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Active Selection</span>
                <span className="text-xs font-bold text-slate-900 truncate block">
                  {taxonomy.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-black active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Edu AI Performance & Subject-Wise Analysis Modal */}
      <EduAiAnalysisModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        questions={questions}
        userAnswers={userAnswers}
        stopwatchSeconds={stopwatchSeconds}
        taxonomy={taxonomy}
        onJumpToQuestion={handleJumpToQuestion}
      />

      {/* ============================================================== */}
      {/* 🖥️ DEDICATED FULLSCREEN MCQ FOCUS MODE (DISTRACTION-FREE)     */}
      {/* ============================================================== */}
      {isFullscreenMode && (
        <div className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col animate-in fade-in duration-200">
          {/* Top Sticky Header */}
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
            <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3">
              {/* Left info */}
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  EM
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-xs sm:text-base font-black text-slate-900 truncate tracking-tight">
                      {taxonomy.name} Focus
                    </h1>
                    <span className="text-[9px] sm:text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 sm:px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      {stats.attempted}/{stats.total}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block font-medium">
                    Distraction-Free Practice • Press <kbd className="font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-bold">Esc</kbd> to exit
                  </p>
                </div>
              </div>

              {/* Center Live Score Colorful Pills */}
              <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200 text-xs font-semibold">
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-600" /> {stats.correct} Correct
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-bold flex items-center gap-1">
                  <XCircle size={12} className="text-rose-600" /> {stats.incorrect} Incorrect
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                  {stats.percentage}% Accuracy
                </span>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Stopwatch Pill */}
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 shadow-2xs">
                  <AnimatedClock size={12} className="text-blue-600" />
                  <span>{formatStopwatchTime(stopwatchSeconds)}</span>
                </div>

                {/* AI Analysis */}
                <button
                  type="button"
                  onClick={handleOpenAiAnalysis}
                  className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <AnimatedAiEye size={13} className="text-white shrink-0" />
                  <span className="hidden sm:inline">AI Analysis</span>
                </button>

                {/* Exit Fullscreen Button */}
                <button
                  type="button"
                  onClick={() => setIsFullscreenMode(false)}
                  className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-slate-900 hover:bg-black active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-xs cursor-pointer"
                  title="Exit Fullscreen Mode (Esc)"
                >
                  <Minimize2 size={13} />
                  <span>Exit<span className="hidden sm:inline"> Focus</span></span>
                </button>
              </div>
            </div>

            {/* Top Slim Progress Bar */}
            <div className="w-full bg-slate-100 h-1 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>
          </header>

          {/* Scrollable Questions Body */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
              {questions.map((q, idx) => {
                const qId = q._id || q.sql_id || idx;
                const questionNum = (page - 1) * pageSize + idx + 1;
                const selectedOpt = userAnswers[qId];
                const isRevealed = !!revealedAnswers[qId];

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

                return (
                  <div
                    key={qId}
                    id={`fullscreen-q-${idx}`}
                    className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all duration-200 p-4 sm:p-7 space-y-3.5 sm:space-y-4.5"
                  >
                    {/* Question Header */}
                    <div className="flex items-start gap-2.5 sm:gap-3.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                        {questionNum}
                      </div>
                      <h2 className="text-sm sm:text-lg font-bold text-slate-900 leading-snug pt-0.5">
                        {q.content || 'Question content'}
                      </h2>
                    </div>

                    {/* Options */}
                    <div className="space-y-2 sm:space-y-2.5 pt-1">
                      {Array.isArray(q.options) &&
                        q.options.slice(0, 4).map((opt, optIdx) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isChecked = selectedOpt === optIdx;
                          const isAnswered = selectedOpt !== undefined;
                          const isOptionCorrect = optIdx === correctIndex;
                          const showCorrectHighlight = (isAnswered || isRevealed) && isOptionCorrect;
                          const showWrongHighlight = isAnswered && isChecked && !isOptionCorrect;

                          return (
                            <label
                              key={optIdx}
                              onClick={() => handleSelectOption(qId, optIdx)}
                              className={`flex items-center justify-between gap-2.5 sm:gap-3.5 px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all duration-150 select-none ${
                                showCorrectHighlight
                                  ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-semibold shadow-2xs'
                                  : showWrongHighlight
                                    ? 'bg-rose-50/90 border-rose-300 text-rose-950 font-semibold shadow-2xs'
                                    : isChecked
                                      ? 'bg-blue-50/60 border-blue-500 text-blue-950 font-semibold shadow-2xs'
                                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-800 font-normal'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                                <span
                                  className={`font-black text-xs sm:text-sm shrink-0 ${
                                    showCorrectHighlight
                                      ? 'text-emerald-800'
                                      : showWrongHighlight
                                        ? 'text-rose-800'
                                        : isChecked
                                          ? 'text-blue-700'
                                          : 'text-slate-900'
                                  }`}
                                >
                                  {letter})
                                </span>

                                <div
                                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                                    showCorrectHighlight
                                      ? 'border-emerald-600 bg-emerald-600'
                                      : showWrongHighlight
                                        ? 'border-rose-500 bg-rose-500'
                                        : isChecked
                                          ? 'border-blue-600 bg-blue-600'
                                          : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {(isChecked || showCorrectHighlight || showWrongHighlight) && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  )}
                                </div>

                                <span className="min-w-0 break-words leading-relaxed">
                                  {opt.text}
                                </span>
                              </div>

                              {showCorrectHighlight && (
                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                              )}
                              {showWrongHighlight && (
                                <XCircle size={16} className="text-rose-600 shrink-0" />
                              )}
                            </label>
                          );
                        })}
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-between pt-2 sm:pt-2.5 border-t border-slate-100 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => toggleViewAnswer(qId)}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Lightbulb size={13} className="text-white shrink-0" />
                          <span>{isRevealed ? 'Hide Answer' : 'View Answer'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveDiscussQuestion({ ...q, questionNum, qId, correctIndex })}
                          className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 text-xs font-semibold rounded-xl border border-slate-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                        >
                          <MessageSquare size={13} className="text-slate-500 shrink-0" />
                          <span>Discuss</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSaveQuestion(qId)}
                          className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 ${
                            savedQuestions[qId]
                              ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          {savedQuestions[qId] ? (
                            <>
                              <BookmarkCheck size={13} className="text-amber-600 shrink-0" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <Bookmark size={13} className="text-slate-500 shrink-0" />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                      </div>

                      {q.examination_names && q.examination_names.length > 0 && (
                        <span className="text-[11px] sm:text-xs font-semibold bg-slate-50 text-slate-600 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-200">
                          {q.examination_names[0]}
                        </span>
                      )}
                    </div>

                    {/* Explanation Box */}
                    {isRevealed && (
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm text-emerald-950 space-y-1.5 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs sm:text-sm">
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          <span>
                            Correct Answer: Option{' '}
                            {correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : 'N/A'}{' '}
                            {correctIndex >= 0 && q.options?.[correctIndex]?.text
                              ? `(${q.options[correctIndex].text})`
                              : ''}
                          </span>
                        </div>
                        {q.ans_info && (
                          <p className="text-slate-700 text-xs sm:text-sm pl-6 pt-1.5 border-t border-emerald-200/70 leading-relaxed font-normal">
                            <strong className="text-emerald-950 font-semibold">Explanation:</strong> {q.ans_info}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 💬 QUESTION DISCUSSION & COMMUNITY NOTES MODAL                 */}
      {/* ============================================================== */}
      {activeDiscussQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div
            onClick={() => setActiveDiscussQuestion(null)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 z-10 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  {activeDiscussQuestion.questionNum}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Question Discussion &amp; Notes
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Student insights, shortcuts &amp; doubts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDiscussQuestion(null)}
                className="w-7 h-7 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
              {/* Question preview */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                {activeDiscussQuestion.content}
              </div>

              {/* Verified Explanation Note */}
              {activeDiscussQuestion.ans_info && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs sm:text-sm space-y-1">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Verified Solution &amp; Key Concept:
                  </span>
                  <p className="text-slate-700 font-normal leading-relaxed pl-5">
                    {activeDiscussQuestion.ans_info}
                  </p>
                </div>
              )}

              {/* Community Discussion Notes */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-blue-600" />
                  Discussion Comments ({questionComments[activeDiscussQuestion.qId]?.length || 0})
                </h4>

                {(!questionComments[activeDiscussQuestion.qId] || questionComments[activeDiscussQuestion.qId].length === 0) ? (
                  <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No comments yet. Have a doubt or a shortcut method? Post below!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {questionComments[activeDiscussQuestion.qId].map((c) => (
                      <div key={c.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="font-bold text-slate-900">{c.author}</span>
                          <span className="text-[10px] text-slate-400">{c.time}</span>
                        </div>
                        <p className="text-slate-700">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment box */}
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddComment(activeDiscussQuestion.qId);
                    }}
                    placeholder="Ask a question or share a tip..."
                    className="flex-1 px-3.5 py-2 text-xs bg-white text-slate-800 placeholder-slate-400 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddComment(activeDiscussQuestion.qId)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
