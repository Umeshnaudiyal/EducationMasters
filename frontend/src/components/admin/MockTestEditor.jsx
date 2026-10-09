'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  BookOpen,
  Search,
  Filter,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Sparkles,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import JoditEditorWrapper from './JoditEditorWrapper';
import { getAuthToken } from '@/utils/auth';
import { slugify } from '@/utils/slug';
import { cleanHtmlContent, stripHtmlToPlainText } from '@/utils/cleanHtml';
import { toast } from '@/context/ToastContext';
import { BACKEND_URL } from '@/utils/api';

const API_BASE = BACKEND_URL;

export default function MockTestEditor({ seriesId, initialTest = null, isEdit = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const initialTab = searchParams.get('tab') === 'questions' ? 'questions' : 'settings';
  const [activeTab, setActiveTab] = useState(initialTab); // 'settings' | 'questions'

  const [saving, setSaving] = useState(false);
  const [serverMessage, setServerMessage] = useState(null);

  // Input Refs for smooth error scrolling & focus
  const titleRef = useRef(null);
  const slugRef = useRef(null);
  const durationRef = useRef(null);
  const totalMarksRef = useRef(null);

  // Series details
  const [series, setSeries] = useState(null);

  // Dropdown filter data
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [states, setStates] = useState([]);
  const [exams, setExams] = useState([]);

  // Test Details Form State
  const [formData, setFormData] = useState({
    title: initialTest?.title || '',
    slug: initialTest?.slug || '',
    test_type: initialTest?.test_type || 'full_length',
    is_paid: initialTest?.is_paid !== undefined ? Boolean(initialTest.is_paid) : true,
    duration_minutes: initialTest?.duration_minutes || 60,
    total_marks: initialTest?.total_marks || 100,
    pass_marks: initialTest?.pass_marks || 35,
    negative_marking: initialTest?.negative_marking !== undefined ? initialTest.negative_marking : 0.25,
    marks_per_question: initialTest?.marks_per_question || 1,
    medium: initialTest?.medium || 'Bilingual',
    instructions: initialTest?.instructions || `<h4>General Instructions:</h4>
<ul>
  <li>The clock will be set at the server. The countdown timer at the top right corner of the screen will display the remaining time available for you to complete the examination.</li>
  <li>Each correct answer carries 1 mark (or specified marks).</li>
  <li>Negative marking will be applicable for wrong answers as indicated.</li>
  <li>Do not refresh the page during the test.</li>
</ul>`,
    status: initialTest?.status || 'Published',
    order: initialTest?.order || 0,
    seo: {
      allow_indexing: initialTest?.seo?.allow_indexing ?? true,
      meta_title: initialTest?.seo?.meta_title || '',
      meta_keywords: initialTest?.seo?.meta_keywords || '',
      meta_description: initialTest?.seo?.meta_description || '',
    },
  });

  const [formErrors, setFormErrors] = useState({});

  // Question Allocator State (holds full question objects for allocated questions)
  const [allocatedQuestions, setAllocatedQuestions] = useState(
    Array.isArray(initialTest?.questions) ? initialTest.questions.filter(Boolean) : []
  );

  // Active language view tab in allocated questions pane: 'all' | 'Hindi' | 'English'
  const [allocatedLanguageTab, setAllocatedLanguageTab] = useState('all');

  // Computed language counts for allocated questions
  const hindiAllocated = allocatedQuestions
    .filter(Boolean)
    .filter((q) => (q.language || '').toLowerCase() === 'hindi');
  const englishAllocated = allocatedQuestions
    .filter(Boolean)
    .filter((q) => (q.language || '').toLowerCase() === 'english');
  const otherAllocated = allocatedQuestions
    .filter(Boolean)
    .filter((q) => {
      const l = (q.language || '').toLowerCase();
      return l !== 'hindi' && l !== 'english';
    });

  // Sync state whenever initialTest changes/loads
  useEffect(() => {
    if (initialTest) {
      setFormData({
        title: initialTest.title || '',
        slug: initialTest.slug || '',
        test_type: initialTest.test_type || 'full_length',
        is_paid: initialTest.is_paid !== undefined ? Boolean(initialTest.is_paid) : true,
        duration_minutes: initialTest.duration_minutes || 60,
        total_marks: initialTest.total_marks || 100,
        pass_marks: initialTest.pass_marks || 35,
        negative_marking: initialTest.negative_marking !== undefined ? initialTest.negative_marking : 0.25,
        marks_per_question: initialTest.marks_per_question || 1,
        medium: initialTest.medium || 'Bilingual',
        instructions: initialTest.instructions || '',
        status: initialTest.status || 'Published',
        order: initialTest.order || 0,
        seo: {
          allow_indexing: initialTest?.seo?.allow_indexing ?? true,
          meta_title: initialTest?.seo?.meta_title || '',
          meta_keywords: initialTest?.seo?.meta_keywords || '',
          meta_description: initialTest?.seo?.meta_description || '',
        },
      });

      if (Array.isArray(initialTest.questions)) {
        setAllocatedQuestions(initialTest.questions.filter(Boolean));
      }
    }
  }, [initialTest]);

  // Main Question Bank Browsing State
  const [bankQuestions, setBankQuestions] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankTotal, setBankTotal] = useState(0);
  const [bankPage, setBankPage] = useState(1);
  const bankLimit = 15;

  // Question Bank Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [activeFilterSearch, setActiveFilterSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [filterMedium, setFilterMedium] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [filterExam, setFilterExam] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');

  // Batch selection for current bank page
  const [selectedBankIds, setSelectedBankIds] = useState([]);

  // Fetch series details & filter options
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        if (seriesId) {
          const res = await fetch(`${API_BASE}/apis/v1/mock-test-series/${seriesId}`);
          const data = await res.json();
          if (data.success) setSeries(data.data);
        }

        const [subsRes, statesRes, examsRes] = await Promise.all([
          fetch(`${API_BASE}/apis/v1/subjects?limit=100`),
          fetch(`${API_BASE}/apis/v1/states?limit=100`),
          fetch(`${API_BASE}/apis/v1/exams?limit=100`),
        ]);

        const subsData = await subsRes.json();
        const statesData = await statesRes.json();
        const examsData = await examsRes.json();

        if (subsData.success) setSubjects(subsData.data || []);
        if (statesData.success) setStates(statesData.data || []);
        if (examsData.success) setExams(examsData.data || []);
      } catch (err) {
        console.error('Error fetching meta:', err);
      }
    };
    fetchMeta();
  }, [seriesId]);

  // Fetch topics when subject changes
  useEffect(() => {
    if (filterSubject && filterSubject !== 'all') {
      const fetchTopics = async () => {
        try {
          const res = await fetch(`${API_BASE}/apis/v1/topics?subject=${filterSubject}&limit=100`);
          const data = await res.json();
          if (data.success) setTopics(data.data || []);
        } catch (err) {
          console.error('Failed to load topics:', err);
        }
      };
      fetchTopics();
    } else {
      setTopics([]);
      setFilterTopic('all');
    }
  }, [filterSubject]);

  // Fetch Main Question Bank questions with filters
  const fetchBankQuestions = useCallback(async () => {
    try {
      setBankLoading(true);
      const params = new URLSearchParams({
        page: String(bankPage),
        limit: String(bankLimit),
        status: 'published',
      });

      if (activeFilterSearch) params.set('search', activeFilterSearch);
      if (filterSubject && filterSubject !== 'all') params.set('subject', filterSubject);
      if (filterTopic && filterTopic !== 'all') params.set('topic', filterTopic);
      if (filterMedium && filterMedium !== 'all') params.set('medium', filterMedium);
      if (filterState && filterState !== 'all') params.set('state', filterState);
      if (filterExam && filterExam !== 'all') params.set('exam', filterExam);
      if (filterLevel && filterLevel !== 'all') params.set('level', filterLevel);

      const res = await fetch(`${API_BASE}/apis/v1/questions?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setBankQuestions(data.data || []);
        setBankTotal(data.total || 0);
      } else {
        setBankQuestions([]);
        setBankTotal(0);
      }
    } catch (err) {
      console.error('Error fetching question bank:', err);
    } finally {
      setBankLoading(false);
    }
  }, [bankPage, activeFilterSearch, filterSubject, filterTopic, filterMedium, filterState, filterExam, filterLevel]);

  useEffect(() => {
    fetchBankQuestions();
  }, [fetchBankQuestions]);

  const handleBankSearchSubmit = (e) => {
    e.preventDefault();
    setActiveFilterSearch(filterSearch.trim());
    setBankPage(1);
  };

  const handleClearFilters = () => {
    setFilterSearch('');
    setActiveFilterSearch('');
    setFilterSubject('all');
    setFilterTopic('all');
    setFilterMedium('all');
    setFilterState('all');
    setFilterExam('all');
    setFilterLevel('all');
    setBankPage(1);
  };

  // Question Allocation Handlers
  const isQuestionAllocated = (qId) => {
    if (!qId) return false;
    return allocatedQuestions.filter(Boolean).some((q) => {
      const id = q._id ? String(q._id) : String(q);
      return id === String(qId);
    });
  };

  const addQuestionToTest = (question) => {
    if (!question || !question._id || isQuestionAllocated(question._id)) return;
    setAllocatedQuestions((prev) => [...prev.filter(Boolean), question]);
  };

  const removeQuestionFromTest = (qId) => {
    setAllocatedQuestions((prev) =>
      prev.filter(Boolean).filter((q) => (q._id ? String(q._id) !== String(qId) : String(q) !== String(qId)))
    );
  };

  const addBatchSelectedQuestions = () => {
    const toAdd = bankQuestions.filter((q) => selectedBankIds.includes(q._id) && !isQuestionAllocated(q._id));
    setAllocatedQuestions((prev) => [...prev.filter(Boolean), ...toAdd]);
    setSelectedBankIds([]);
  };

  const toggleSelectAllBankPage = (e) => {
    if (e.target.checked) {
      const pageIds = bankQuestions.map((q) => q._id);
      setSelectedBankIds(pageIds);
    } else {
      setSelectedBankIds([]);
    }
  };

  const toggleSelectBankItem = (id) => {
    setSelectedBankIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const moveQuestion = (fromIndex, toIndex) => {
    const validAllocated = allocatedQuestions.filter(Boolean);
    if (toIndex < 0 || toIndex >= validAllocated.length) return;
    setAllocatedQuestions(() => {
      const next = [...validAllocated];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const clearAllAllocated = () => {
    if (allocatedQuestions.length === 0) return;
    if (window.confirm('Are you sure you want to remove all allocated questions from this test?')) {
      setAllocatedQuestions([]);
    }
  };

  const clearLanguageAllocated = (lang) => {
    if (window.confirm(`Are you sure you want to remove all ${lang} questions from this test?`)) {
      setAllocatedQuestions((prev) =>
        prev.filter(Boolean).filter((q) => (q.language || '').toLowerCase() !== lang.toLowerCase())
      );
    }
  };

  const groupQuestionsByLanguage = () => {
    const valid = allocatedQuestions.filter(Boolean);
    const hindi = valid.filter((q) => (q.language || '').toLowerCase() === 'hindi');
    const english = valid.filter((q) => (q.language || '').toLowerCase() === 'english');
    const others = valid.filter((q) => {
      const l = (q.language || '').toLowerCase();
      return l !== 'hindi' && l !== 'english';
    });
    setAllocatedQuestions([...hindi, ...english, ...others]);
  };

  // Auto-calculate total marks when questions or marks_per_question changes
  const marksPerQ = Number(formData.marks_per_question) || 1;
  const calculatedMarks = allocatedQuestions.filter(Boolean).length * marksPerQ;

  // Submit Test Save
  const handleSaveTest = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setServerMessage(null);

    const errors = {};
    let firstErrorRef = null;

    if (!formData.title?.trim()) {
      errors.title = 'Test title is required';
      firstErrorRef = titleRef;
    }
    if (!formData.slug?.trim()) {
      errors.slug = 'Valid URL slug is required';
      firstErrorRef = firstErrorRef || slugRef;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (activeTab !== 'settings') setActiveTab('settings');
      setTimeout(() => {
        if (firstErrorRef?.current) {
          firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstErrorRef.current.focus();
        }
      }, 50);
      setServerMessage({ type: 'error', text: 'Please fill in required fields in the Test Settings tab.' });
      return;
    }

    try {
      setSaving(true);
      const token = getAuthToken(session);

      const questionIds = allocatedQuestions
        .filter(Boolean)
        .map((q) => (q._id ? String(q._id) : String(q)))
        .filter((id) => /^[0-9a-fA-F]{24}$/.test(id));

      const finalSeriesId = seriesId || initialTest?.series?._id || initialTest?.series;

      const payload = {
        ...formData,
        series: finalSeriesId,
        title: formData.title.trim(),
        slug: slugify(formData.slug),
        instructions: cleanHtmlContent(formData.instructions || ''),
        questions: questionIds,
        total_questions: questionIds.length,
        total_marks: Number(formData.total_marks) || (questionIds.length * marksPerQ) || 100,
        seo: {
          allow_indexing: formData.seo?.allow_indexing ?? true,
          meta_title: stripHtmlToPlainText(formData.seo?.meta_title || formData.title.trim()),
          meta_keywords: stripHtmlToPlainText(formData.seo?.meta_keywords || ''),
          meta_description: stripHtmlToPlainText(formData.seo?.meta_description || ''),
        },
      };

      const url = isEdit
        ? `${API_BASE}/apis/v1/mock-tests/${initialTest._id}`
        : `${API_BASE}/apis/v1/mock-tests`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const msg = isEdit ? 'Test updated and questions synced successfully.' : 'Test created and questions allocated successfully.';
        setServerMessage({
          type: 'success',
          text: msg,
        });
        toast.success(msg);
        setTimeout(() => {
          router.push(`/edu-admin/mock-tests/${seriesId}/tests`);
        }, 800);
      } else {
        if (data.errors) {
          setFormErrors(data.errors);
          if (activeTab !== 'settings') setActiveTab('settings');
          setTimeout(() => {
            if (data.errors.slug && slugRef.current) {
              slugRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
              slugRef.current.focus();
            } else if (data.errors.title && titleRef.current) {
              titleRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
              titleRef.current.focus();
            }
          }, 50);
        }
        const errMsg = data.message || 'Failed to save mock test.';
        setServerMessage({ type: 'error', text: errMsg });
        toast.error(errMsg);
      }
    } catch (err) {
      console.error('Save test error:', err);
      const errMsg = 'Network error occurred while saving test.';
      setServerMessage({ type: 'error', text: errMsg });
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const bankTotalPages = Math.ceil(bankTotal / bankLimit) || 1;

  // Filter allocated questions based on selected language tab
  const displayedAllocatedQuestions =
    allocatedLanguageTab === 'all'
      ? allocatedQuestions.filter(Boolean)
      : allocatedLanguageTab === 'Hindi'
      ? hindiAllocated
      : englishAllocated;

  return (
    <div className="space-y-6 w-full font-sans text-slate-800 pb-24">
      {/* Toast Alert */}
      {serverMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2.5 border animate-in slide-in-from-top-2 ${
            serverMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {serverMessage.type === 'error' ? (
            <AlertCircle size={15} className="text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          )}
          <span>{serverMessage.text}</span>
          <button
            type="button"
            onClick={() => setServerMessage(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:px-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/edu-admin/mock-tests/${seriesId}/tests`}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-[#2271b1] border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform text-slate-500 group-hover:text-[#2271b1]" />
            <span>Back to Series Tests</span>
          </Link>

          <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{isEdit ? 'Edit Mock Test' : 'Create New Mock Test'}</span>
            </h1>
            <p className="text-[11px] text-slate-500 truncate max-w-md">
              Series: <span className="font-semibold text-slate-700">{series?.title || 'Mock Series'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Link
            href={`/edu-admin/mock-tests/${seriesId}/tests`}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs cursor-pointer"
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={handleSaveTest}
            disabled={saving}
            className="px-5 py-2 bg-[#2271b1] hover:bg-[#135e96] active:bg-[#0a4b78] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-2"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            <span>{isEdit ? 'Save Changes' : 'Create & Save Test'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-6 pt-3 rounded-t-2xl shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'border-[#2271b1] text-[#2271b1]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings size={16} />
          <span>Step 1: Test Details &amp; Rules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('questions')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'questions'
              ? 'border-[#2271b1] text-[#2271b1]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen size={16} />
          <span>Step 2: Allocate Questions from Bank</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-[#2271b1]">
            {allocatedQuestions.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 border-t-0 rounded-b-2xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-800">
                Test Title <span className="text-rose-500">*</span>
              </label>
              <input
                ref={titleRef}
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    title: e.target.value,
                    slug: !isEdit ? slugify(e.target.value) : prev.slug,
                  }));
                  if (formErrors.title) setFormErrors((p) => ({ ...p, title: null }));
                }}
                placeholder="e.g. SSC CGL 2024 Tier 1 Full Length Mock Test 1"
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl text-slate-800 outline-none transition-all ${
                  formErrors.title
                    ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200'
                    : 'border-slate-300 focus:border-[#2271b1]'
                }`}
              />
              {formErrors.title && (
                <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle size={12} /> {formErrors.title}
                </p>
              )}
            </div>

            {/* Slug */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-800">
                URL Slug <span className="text-rose-500">*</span>
              </label>
              <input
                ref={slugRef}
                type="text"
                value={formData.slug}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }));
                  if (formErrors.slug) setFormErrors((p) => ({ ...p, slug: null }));
                }}
                placeholder="e.g. ssc-cgl-tier-1-mock-test-1"
                className={`w-full px-3.5 py-2 text-xs bg-white border font-mono rounded-xl text-slate-800 outline-none transition-all ${
                  formErrors.slug
                    ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200'
                    : 'border-slate-300 focus:border-[#2271b1]'
                }`}
              />
              {formErrors.slug && (
                <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle size={12} /> {formErrors.slug}
                </p>
              )}
            </div>

            {/* Test Type */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-800">
                Test Type
              </label>
              <select
                value={formData.test_type}
                onChange={(e) => setFormData((prev) => ({ ...prev, test_type: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 focus:border-[#2271b1] rounded-lg text-slate-800 outline-none"
              >
                <option value="full_length">Full Length Mock Test</option>
                <option value="sectional">Sectional Test</option>
                <option value="chapter">Chapter Test</option>
                <option value="previous_year">Previous Year Paper</option>
                <option value="live">Live Mock Test</option>
                <option value="mini">Mini Mock Test</option>
              </select>
            </div>

            {/* Access Type: Paid vs Free */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-800">
                Access Type (Paid / Free)
              </label>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="access_type"
                    checked={!formData.is_paid}
                    onChange={() => setFormData((prev) => ({ ...prev, is_paid: false }))}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">100% Free Practice Test</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="access_type"
                    checked={formData.is_paid}
                    onChange={() => setFormData((prev) => ({ ...prev, is_paid: true }))}
                    className="text-[#2271b1] focus:ring-[#2271b1]"
                  />
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Locked (Paid Pass Required)</span>
                </label>
              </div>
            </div>

            {/* Medium / Language */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-800">
                Test Medium / Language
              </label>
              <select
                value={formData.medium}
                onChange={(e) => setFormData((prev) => ({ ...prev, medium: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 focus:border-[#2271b1] rounded-lg text-slate-800 outline-none font-semibold"
              >
                <option value="Bilingual">Bilingual (Hindi &amp; English)</option>
                <option value="English">English Only</option>
                <option value="Hindi">Hindi Only</option>
              </select>
              <p className="text-[10px] text-slate-500">
                {formData.medium === 'Bilingual'
                  ? 'Students can switch between Hindi and English during test taking.'
                  : `Test will be presented strictly in ${formData.medium}.`}
              </p>
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-800">
                Duration (Minutes)
              </label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                placeholder="60"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 focus:border-[#2271b1] rounded-lg text-slate-800 outline-none"
              />
            </div>

            {/* Marks Per Question */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-800">
                Marks per Correct Question
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.marks_per_question}
                onChange={(e) => setFormData((prev) => ({ ...prev, marks_per_question: Math.max(0, Number(e.target.value) || 0) }))}
                placeholder="1"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 focus:border-[#2271b1] rounded-lg text-slate-800 outline-none"
              />
            </div>

            {/* Negative Marking */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-800">
                Negative Marking per Wrong Question
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={formData.negative_marking}
                onChange={(e) => setFormData((prev) => ({ ...prev, negative_marking: Math.max(0, Number(e.target.value) || 0) }))}
                placeholder="0 (or 0.25 / 0.5)"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 focus:border-[#2271b1] rounded-lg text-slate-800 outline-none"
              />
            </div>

            {/* Total Marks */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-800">
                Total Marks (Override or Calculated: {calculatedMarks})
              </label>
              <input
                type="number"
                value={formData.total_marks}
                onChange={(e) => setFormData((prev) => ({ ...prev, total_marks: Number(e.target.value) }))}
                placeholder="100"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 focus:border-[#2271b1] rounded-lg text-slate-800 outline-none"
              />
            </div>

            {/* Pass Marks */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-800">
                Pass Marks
              </label>
              <input
                type="number"
                value={formData.pass_marks}
                onChange={(e) => setFormData((prev) => ({ ...prev, pass_marks: Number(e.target.value) }))}
                placeholder="35"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 focus:border-[#2271b1] rounded-lg text-slate-800 outline-none"
              />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-800">
                Publish Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 focus:border-[#2271b1] rounded-lg text-slate-800 outline-none"
              >
                <option value="Published">Published (Live for test taking)</option>
                <option value="Draft">Draft (Hidden)</option>
              </select>
            </div>
          </div>

          {/* Test Instructions */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-800">
              Exam Instructions &amp; Guidelines (Displayed before student starts test)
            </label>
            <JoditEditorWrapper
              value={formData.instructions}
              onChange={(val) => setFormData((prev) => ({ ...prev, instructions: val }))}
              height={220}
              placeholder="Enter exam guidelines and instructions..."
            />
          </div>

          {/* Proceed Button to Step 2 */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Allocated Questions: <span className="font-bold text-slate-800">{allocatedQuestions.length}</span>
              {hindiAllocated.length > 0 && (
                <span className="ml-2 font-semibold text-amber-700">({hindiAllocated.length} Hindi)</span>
              )}
              {englishAllocated.length > 0 && (
                <span className="ml-1 font-semibold text-blue-700">({englishAllocated.length} English)</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('questions')}
              className="px-5 py-2.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-2"
            >
              <span>Proceed to Allocate Questions ({allocatedQuestions.length})</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Question Allocation (Connecting to 11,000+ Main Question Bank) */}
      {activeTab === 'questions' && (
        <div className="bg-white border border-slate-200 border-t-0 rounded-b-2xl p-4 sm:p-6 shadow-xs space-y-5">
          {/* Sticky Allocation Status Bar with Language Breakdown */}
          <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 border border-blue-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#2271b1] text-white rounded-xl shadow-xs shrink-0">
                <FileCheck size={20} />
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Allocated: <span className="text-[#2271b1] text-base">{allocatedQuestions.length} Questions</span>
                  </h3>
                  {/* Language Badges Breakdown */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 text-xs font-bold rounded-md border border-amber-300">
                    <span>🇮🇳 {hindiAllocated.length} Hindi</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-900 text-xs font-bold rounded-md border border-blue-300">
                    <span>🇬🇧 {englishAllocated.length} English</span>
                  </span>
                  {otherAllocated.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-md border border-slate-300">
                      <span>{otherAllocated.length} Other</span>
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 flex flex-wrap items-center gap-2 pt-0.5">
                  <span>Total Marks: <strong className="text-slate-800">{calculatedMarks}</strong></span>
                  <span>•</span>
                  <span>Duration: <strong className="text-slate-800">{formData.duration_minutes} Mins</strong></span>
                  {formData.medium === 'Bilingual' && (
                    <>
                      <span>•</span>
                      {hindiAllocated.length > 0 && englishAllocated.length > 0 && hindiAllocated.length === englishAllocated.length ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Balanced Bilingual Set ({hindiAllocated.length} each)
                        </span>
                      ) : hindiAllocated.length > 0 && englishAllocated.length > 0 ? (
                        <span className="text-amber-700 font-medium">
                          Note: {hindiAllocated.length} Hindi vs {englishAllocated.length} English
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">
                          (Allocate both Hindi &amp; English questions for bilingual test takers)
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearAllAllocated}
                disabled={allocatedQuestions.length === 0}
                className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleSaveTest}
                disabled={saving}
                className="px-4 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                <span>Save Test ({allocatedQuestions.length} Qs)</span>
              </button>
            </div>
          </div>

          {/* Dual-Pane Question Allocator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT PANE: 11,000+ Main Question Bank (7 Cols) */}
            <div className="lg:col-span-7 space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen size={16} className="text-[#2271b1]" />
                    <span>Main Question Bank ({bankTotal.toLocaleString()} available)</span>
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">
                    Filter by Subject, Topic, Language, State, Exam &amp; add questions to this test.
                  </p>
                </div>

                {selectedBankIds.length > 0 && (
                  <button
                    type="button"
                    onClick={addBatchSelectedQuestions}
                    className="px-3 py-1 bg-[#2271b1] text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>Add Selected ({selectedBankIds.length})</span>
                  </button>
                )}
              </div>

              {/* Multi-Filter Toolbar */}
              <div className="space-y-2.5 bg-white p-3 rounded-lg border border-slate-200">
                {/* Search Bar */}
                <form onSubmit={handleBankSearchSubmit} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      placeholder="Search question content / keywords..."
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#2271b1] text-white rounded text-xs font-semibold cursor-pointer"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs cursor-pointer"
                    title="Reset All Filters"
                  >
                    Reset
                  </button>
                </form>

                {/* Quick One-Click Language Filter Selector */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                    Target Language:
                  </span>
                  {[
                    { id: 'all', label: 'All Languages' },
                    { id: 'Hindi', label: '🇮🇳 Hindi Questions' },
                    { id: 'English', label: '🇬🇧 English Questions' },
                    { id: 'Bilingual', label: 'Bilingual' },
                  ].map((langTab) => {
                    const isActive = filterMedium === langTab.id;
                    return (
                      <button
                        key={langTab.id}
                        type="button"
                        onClick={() => {
                          setFilterMedium(langTab.id);
                          setBankPage(1);
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          isActive
                            ? langTab.id === 'Hindi'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : langTab.id === 'English'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-slate-800 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {langTab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Dropdowns Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                  {/* Subject */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Subject</label>
                    <select
                      value={filterSubject}
                      onChange={(e) => {
                        setFilterSubject(e.target.value);
                        setBankPage(1);
                      }}
                      className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded text-slate-700 outline-none"
                    >
                      <option value="all">All Subjects</option>
                      {subjects.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Topic */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Topic</label>
                    <select
                      value={filterTopic}
                      disabled={topics.length === 0}
                      onChange={(e) => {
                        setFilterTopic(e.target.value);
                        setBankPage(1);
                      }}
                      className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded text-slate-700 outline-none disabled:opacity-50"
                    >
                      <option value="all">All Topics</option>
                      {topics.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">State</label>
                    <select
                      value={filterState}
                      onChange={(e) => {
                        setFilterState(e.target.value);
                        setBankPage(1);
                      }}
                      className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded text-slate-700 outline-none"
                    >
                      <option value="all">All States</option>
                      {states.map((st) => (
                        <option key={st._id} value={st._id}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Exam */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Exam</label>
                    <select
                      value={filterExam}
                      onChange={(e) => {
                        setFilterExam(e.target.value);
                        setBankPage(1);
                      }}
                      className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded text-slate-700 outline-none"
                    >
                      <option value="all">All Exams</option>
                      {exams.map((ex) => (
                        <option key={ex._id} value={ex._id}>
                          {ex.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Level */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Difficulty Level</label>
                    <select
                      value={filterLevel}
                      onChange={(e) => {
                        setFilterLevel(e.target.value);
                        setBankPage(1);
                      }}
                      className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded text-slate-700 outline-none"
                    >
                      <option value="all">All Levels</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Select All Bar */}
              <div className="flex items-center justify-between px-1 text-xs text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    onChange={toggleSelectAllBankPage}
                    checked={bankQuestions.length > 0 && selectedBankIds.length === bankQuestions.length}
                    className="rounded border-slate-300 text-[#2271b1]"
                  />
                  <span>Select All on this Page</span>
                </label>
                <span>
                  Showing {bankQuestions.length > 0 ? (bankPage - 1) * bankLimit + 1 : 0}-
                  {Math.min(bankPage * bankLimit, bankTotal)} of {bankTotal}
                </span>
              </div>

              {/* Questions Stream */}
              {bankLoading ? (
                <div className="py-16 text-center bg-white rounded-xl border border-slate-200">
                  <Loader2 size={20} className="animate-spin text-[#2271b1] mx-auto mb-1.5" />
                  <p className="text-xs text-slate-500">Loading questions from Question Bank...</p>
                </div>
              ) : bankQuestions.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-xl border border-slate-200 space-y-1">
                  <p className="text-xs font-bold text-slate-700">No questions found matching filters</p>
                  <p className="text-[11px] text-slate-400">Try changing or clearing your filter selection.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {bankQuestions.map((q) => {
                    const isAllocated = isQuestionAllocated(q._id);
                    const isChecked = selectedBankIds.includes(q._id);
                    const isHindi = (q.language || '').toLowerCase() === 'hindi';

                    return (
                      <div
                        key={q._id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isAllocated
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : isChecked
                            ? 'bg-blue-50/40 border-blue-300'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            disabled={isAllocated}
                            checked={isChecked}
                            onChange={() => toggleSelectBankItem(q._id)}
                            className="rounded border-slate-300 text-[#2271b1] mt-1 shrink-0 disabled:opacity-30"
                          />

                          <div className="flex-1 min-w-0 space-y-1.5">
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              {/* Prominent Language Tag */}
                              <span
                                className={`px-2 py-0.5 font-bold rounded border ${
                                  isHindi
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-blue-100 text-blue-900 border-blue-300'
                                }`}
                              >
                                {isHindi ? '🇮🇳 Hindi' : '🇬🇧 English'}
                              </span>

                              {q.subject_name && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded">
                                  {q.subject_name}
                                </span>
                              )}
                              {q.state_name && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded">
                                  {q.state_name}
                                </span>
                              )}
                              {q.level && (
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-semibold rounded">
                                  {typeof q.level === 'object' ? q.level.name : q.level}
                                </span>
                              )}
                            </div>

                            {/* Content */}
                            <div className="text-xs font-semibold text-slate-800 line-clamp-3">
                              {stripHtmlToPlainText(q.content)}
                            </div>

                            {/* Options Preview */}
                            {Array.isArray(q.options) && q.options.length > 0 && (
                              <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                                {q.options.slice(0, 4).map((opt, oIdx) => (
                                  <div
                                    key={oIdx}
                                    className={`px-2 py-0.5 rounded truncate ${
                                      opt.is_correct || opt.text === q.correct_answer
                                        ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                                        : 'bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                    <span className="font-bold mr-1">{String.fromCharCode(65 + oIdx)}.</span>
                                    <span>{stripHtmlToPlainText(opt.text)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Add / Added Button */}
                          <div className="shrink-0 self-center">
                            {isAllocated ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold">
                                <Check size={12} />
                                <span>Added</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addQuestionToTest(q)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-[#2271b1] text-[#2271b1] hover:text-white border border-[#2271b1] rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                              >
                                <Plus size={12} />
                                <span>Add</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination for Bank */}
              {bankTotalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
                  <span>
                    Page {bankPage} of {bankTotalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={bankPage <= 1}
                      onClick={() => setBankPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={bankPage >= bankTotalPages}
                      onClick={() => setBankPage((p) => Math.min(bankTotalPages, p + 1))}
                      className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT PANE: Language-Distinguished Allocated Questions in this Test (5 Cols) */}
            <div className="lg:col-span-5 space-y-4 border border-blue-200 rounded-xl p-4 bg-white shadow-2xs">
              <div className="border-b border-slate-200 pb-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>Allocated in Test ({allocatedQuestions.length})</span>
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500">
                      Questions partitioned by language for this exam session.
                    </p>
                  </div>

                  <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {calculatedMarks} Marks
                  </div>
                </div>

                {/* Segmented Language Tabs for Allocated Pane */}
                <div className="flex items-center justify-between gap-1.5 pt-1">
                  <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setAllocatedLanguageTab('all')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        allocatedLanguageTab === 'all'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({allocatedQuestions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllocatedLanguageTab('Hindi')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                        allocatedLanguageTab === 'Hindi'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-amber-800'
                      }`}
                    >
                      <span>🇮🇳 Hindi ({hindiAllocated.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllocatedLanguageTab('English')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                        allocatedLanguageTab === 'English'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-blue-800'
                      }`}
                    >
                      <span>🇬🇧 English ({englishAllocated.length})</span>
                    </button>
                  </div>

                  {/* Group / Reorder Tool */}
                  {allocatedQuestions.length > 1 && (
                    <button
                      type="button"
                      onClick={groupQuestionsByLanguage}
                      className="text-[10px] font-semibold text-[#2271b1] hover:underline cursor-pointer"
                      title="Group all Hindi questions together and English questions together"
                    >
                      Group by Language
                    </button>
                  )}
                </div>
              </div>

              {/* Language Specific Quick Actions when in Hindi or English tab */}
              {allocatedLanguageTab === 'Hindi' && hindiAllocated.length > 0 && (
                <div className="flex items-center justify-between text-xs bg-amber-50/70 border border-amber-200 px-3 py-1.5 rounded-lg text-amber-900">
                  <span className="font-semibold text-[11px]">
                    Viewing {hindiAllocated.length} Hindi Questions
                  </span>
                  <button
                    type="button"
                    onClick={() => clearLanguageAllocated('Hindi')}
                    className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Clear Hindi Questions
                  </button>
                </div>
              )}

              {allocatedLanguageTab === 'English' && englishAllocated.length > 0 && (
                <div className="flex items-center justify-between text-xs bg-blue-50/70 border border-blue-200 px-3 py-1.5 rounded-lg text-blue-900">
                  <span className="font-semibold text-[11px]">
                    Viewing {englishAllocated.length} English Questions
                  </span>
                  <button
                    type="button"
                    onClick={() => clearLanguageAllocated('English')}
                    className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Clear English Questions
                  </button>
                </div>
              )}

              {/* Allocated List */}
              {displayedAllocatedQuestions.length === 0 ? (
                <div className="py-20 text-center space-y-2 border-2 border-dashed border-slate-200 rounded-xl p-4">
                  <HelpCircle size={32} className="text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    {allocatedLanguageTab === 'all'
                      ? 'No Questions Allocated Yet'
                      : `No ${allocatedLanguageTab} Questions Allocated`}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {allocatedLanguageTab === 'all'
                      ? 'Filter questions from the left panel and click "Add" to add them to this test.'
                      : `Select "${allocatedLanguageTab}" in the left question bank filter and add ${allocatedLanguageTab} questions.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {displayedAllocatedQuestions.map((q, idx) => {
                    const qId = q._id || q;
                    const content = q.content || `Question ID: ${qId}`;
                    const isHindi = (q.language || '').toLowerCase() === 'hindi';
                    const overallIndex = allocatedQuestions.findIndex(
                      (aq) => (aq._id ? String(aq._id) : String(aq)) === String(qId)
                    );

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-2 hover:border-slate-300 transition-colors group"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="font-bold text-xs text-[#2271b1] bg-white px-2 py-0.5 rounded border border-blue-100 shrink-0">
                            {allocatedLanguageTab === 'Hindi'
                              ? `H${idx + 1}`
                              : allocatedLanguageTab === 'English'
                              ? `E${idx + 1}`
                              : `Q${idx + 1}`}
                          </span>
                          <div className="min-w-0 space-y-1">
                            <div className="text-xs font-semibold text-slate-800 line-clamp-2">
                              {stripHtmlToPlainText(content)}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              {/* Explicit Language Badge */}
                              <span
                                className={`px-1.5 py-0.2 font-bold rounded border ${
                                  isHindi
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-blue-100 text-blue-900 border-blue-300'
                                }`}
                              >
                                {isHindi ? '🇮🇳 Hindi' : '🇬🇧 English'}
                              </span>

                              {q.subject_name && (
                                <span className="text-slate-500 font-medium truncate">
                                  {q.subject_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Order & Remove Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={overallIndex <= 0}
                            onClick={() => moveQuestion(overallIndex, overallIndex - 1)}
                            className="p-1 hover:bg-white text-slate-400 hover:text-slate-700 rounded disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            disabled={overallIndex >= allocatedQuestions.length - 1}
                            onClick={() => moveQuestion(overallIndex, overallIndex + 1)}
                            className="p-1 hover:bg-white text-slate-400 hover:text-slate-700 rounded disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeQuestionFromTest(qId)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded cursor-pointer ml-1"
                            title="Remove Question"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ChevronLeft size={15} />
              <span>Back to Test Details</span>
            </button>

            <button
              type="button"
              onClick={handleSaveTest}
              disabled={saving}
              className="px-6 py-2.5 bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center gap-2"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              <span>{isEdit ? 'Save Changes & Questions' : 'Publish Test with Allocated Questions'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
