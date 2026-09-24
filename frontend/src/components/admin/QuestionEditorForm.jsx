'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Trash2,
  ArrowLeft,
  Search,
  CheckSquare,
  Landmark,
  BookOpen,
  Plus,
  Minus,
} from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';
import { getAuthToken } from '@/utils/auth';

// Helper to parse the correct option index (0-indexed) from various data formats
const parseCorrectOptionIndex = (data) => {
  if (!data) return 0;

  // 1. If options array explicitly has is_correct === true on one of the items
  if (Array.isArray(data.options)) {
    const explicitIdx = data.options.findIndex(
      (o) => o && (o.is_correct === true || o.is_correct === 1 || o.is_correct === 'true')
    );
    if (explicitIdx !== -1) return explicitIdx;
  }

  // 2. Parse from correct_answer string (e.g. "Option 1", "Option 1 (A)", "Option A", "A", "1", "Option 2")
  const rawAnswer = String(data.correct_answer || '').trim();
  if (rawAnswer) {
    // Check if there is a number 1-6
    const numMatch = rawAnswer.match(/[1-6]/);
    if (numMatch) {
      return parseInt(numMatch[0], 10) - 1;
    }

    // Check if there is a letter A-F (e.g. "A", "Option A", "Option A (1)")
    const letterMatch = rawAnswer.match(/[A-Fa-f]/);
    if (letterMatch) {
      const idx = letterMatch[0].toUpperCase().charCodeAt(0) - 65;
      if (idx >= 0 && idx < 6) return idx;
    }
  }

  // 3. Fallback: Option 1 (index 0)
  return 0;
};

// Helper to construct a complete 6-option array with the correct option checked
const buildOptionsArray = (data) => {
  const correctIdx = parseCorrectOptionIndex(data);
  const existingOptions = data?.options || [];
  return [1, 2, 3, 4, 5, 6].map((idx) => {
    const found = existingOptions.find((o) => o && o.index === idx) || existingOptions[idx - 1];
    return {
      index: idx,
      text: found ? (found.text || '') : '',
      is_correct: idx - 1 === correctIdx,
    };
  });
};

export default function QuestionEditorForm({ initialData = null, isEdit = false }) {
  const router = useRouter();
  const { data: session } = useSession();

  const initialOptions = buildOptionsArray(initialData);
  const initialCorrectIdx = parseCorrectOptionIndex(initialData);

  // Form State
  const [formData, setFormData] = useState({
    type: { name: 'Objective', slug: 'objective' },
    language: 'Hindi',
    level: { name: 'Medium', slug: 'medium' },
    subject: '',
    subject_name: '',
    instruction: '',
    content: '',
    options: initialOptions,
    correct_answer: `Option ${initialCorrectIdx + 1}`,
    ans_info: '',
    marks: 1,
    negative: 0,
    state: '',
    state_name: '',
    district: '',
    district_name: '',
    city: '',
    examinations: [],
    examination_names: [],
    status: 'Published',
    ...initialData,
    options: initialOptions,
    correct_answer: `Option ${initialCorrectIdx + 1}`,
  });

  // Number of active visible options (4 by default, expandable to 5 or 6)
  const [visibleOptionsCount, setVisibleOptionsCount] = useState(4);

  // Dropdown list data
  const [subjects, setSubjects] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [exams, setExams] = useState([]);
  const [examSearch, setExamSearch] = useState('');

  // UI state
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load initial dropdown data
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [subRes, stRes, exRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/subjects?limit=100`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/states?all=true`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/exams?limit=100`),
        ]);

        const [subData, stData, exData] = await Promise.all([
          subRes.json(),
          stRes.json(),
          exRes.json(),
        ]);

        if (subData.success) setSubjects(subData.data || []);
        if (stData.success) setStates(stData.data || []);
        if (exData.success) setExams(exData.data || []);
      } catch (err) {
        console.error('Error loading dropdown data:', err);
      }
    };
    loadDropdowns();
  }, []);

  // Sync initialData if provided (e.g. edit mode)
  useEffect(() => {
    if (initialData) {
      const correctIdx = parseCorrectOptionIndex(initialData);
      const completeOptions = buildOptionsArray(initialData);

      // Check if Option 5 or 6 has text
      if (completeOptions[5].text) {
        setVisibleOptionsCount(6);
      } else if (completeOptions[4].text) {
        setVisibleOptionsCount(5);
      } else {
        setVisibleOptionsCount(4);
      }

      const stateId = initialData.state?._id
        ? String(initialData.state._id)
        : initialData.state
        ? String(initialData.state)
        : '';

      const districtId = initialData.district?._id
        ? String(initialData.district._id)
        : initialData.district
        ? String(initialData.district)
        : '';

      const rawExams = Array.isArray(initialData.examinations)
        ? initialData.examinations.map((e) =>
            typeof e === 'object' && e?._id ? String(e._id) : String(e)
          )
        : [];

      setFormData((prev) => ({
        ...prev,
        ...initialData,
        options: completeOptions,
        correct_answer: `Option ${correctIdx + 1}`,
        subject: initialData.subject?._id ? String(initialData.subject._id) : (initialData.subject || ''),
        state: stateId,
        district: districtId,
        examinations: rawExams,
      }));

      if (stateId) {
        fetchDistrictsForState(stateId, districtId);
      }
    }
  }, [initialData]);

  // Fetch districts when state changes
  const fetchDistrictsForState = async (stateId, keepDistrictId = null) => {
    if (!stateId) {
      setDistricts([]);
      return;
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/states/districts?stateId=${stateId}`
      );
      const data = await res.json();
      if (data.success) {
        const loadedDistricts = data.data || [];
        setDistricts(loadedDistricts);
        if (keepDistrictId) {
          const found = loadedDistricts.find((d) => String(d._id) === String(keepDistrictId));
          if (found) {
            setFormData((prev) => ({
              ...prev,
              district: String(found._id),
              district_name: found.name,
            }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching districts:', err);
    }
  };

  const handleStateChange = (stId) => {
    const selectedStateDoc = states.find((s) => String(s._id) === String(stId));
    setFormData((prev) => ({
      ...prev,
      state: stId,
      state_name: selectedStateDoc ? selectedStateDoc.name : '',
      district: '',
      district_name: '',
    }));
    fetchDistrictsForState(stId);
  };

  // Option text change
  const handleOptionChange = (idx, text) => {
    setFormData((prev) => {
      const nextOptions = [...prev.options];
      nextOptions[idx] = {
        ...nextOptions[idx],
        text,
      };
      return { ...prev, options: nextOptions };
    });

    if (errors.options) {
      setErrors((prev) => ({ ...prev, options: null }));
    }
  };

  // Set correct answer radio/dropdown
  const handleSetCorrectAnswer = (optionIndex) => {
    setFormData((prev) => {
      const nextOptions = prev.options.map((opt, i) => ({
        ...opt,
        is_correct: i === optionIndex,
      }));
      return {
        ...prev,
        options: nextOptions,
        correct_answer: `Option ${optionIndex + 1}`,
      };
    });

    if (errors.correct_answer) {
      setErrors((prev) => ({ ...prev, correct_answer: null }));
    }
  };

  // Toggle Exam checkbox
  const toggleExam = (examId) => {
    setFormData((prev) => {
      const examIdStr = String(examId);
      const exists = prev.examinations.some((id) => String(id) === examIdStr);
      const nextExams = exists
        ? prev.examinations.filter((id) => String(id) !== examIdStr)
        : [...prev.examinations, examIdStr];

      return {
        ...prev,
        examinations: nextExams,
      };
    });
  };

  // Form submit validation & handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMessage(null);

    // Client-side validations
    const formErrors = {};
    if (!formData.content?.trim()) {
      formErrors.content = 'Question content is required';
    }

    const validOptions = formData.options
      .slice(0, visibleOptionsCount)
      .filter((opt) => opt.text && opt.text.trim().length > 0);

    if (validOptions.length < 2) {
      formErrors.options = 'Please provide at least 2 non-empty options (e.g. Option 1 and Option 2)';
    }

    const hasCorrect = formData.options
      .slice(0, visibleOptionsCount)
      .some((opt) => opt.is_correct && opt.text && opt.text.trim().length > 0);

    if (!hasCorrect) {
      formErrors.correct_answer = 'Please select a valid option marked as the correct answer';
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setServerMessage({
        type: 'error',
        text: 'Please review and fix the highlighted fields.',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setSaving(true);
      const token = getAuthToken(session);

      const url = isEdit && initialData?._id
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/questions/${initialData._id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/questions`;

      const method = isEdit ? 'PUT' : 'POST';

      // Trim options to visible count
      const payload = {
        ...formData,
        options: formData.options.slice(0, visibleOptionsCount),
      };

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
        setServerMessage({
          type: 'success',
          text: isEdit ? 'Question updated successfully!' : 'Question published successfully!',
        });
        setTimeout(() => {
          router.push('/edu-admin/questions');
        }, 800);
      } else {
        if (data.errors) setErrors(data.errors);
        setServerMessage({
          type: 'error',
          text: data.message || 'Failed to save question. Please check form errors.',
        });
      }
    } catch (err) {
      console.error('Question save error:', err);
      setServerMessage({
        type: 'error',
        text: 'Network error communicating with server.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete handler for edit page
  const handleDelete = async () => {
    if (!initialData?._id) return;
    try {
      setIsDeleting(true);
      const token = getAuthToken(session);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/questions/${initialData._id}`,
        {
          method: 'DELETE',
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/edu-admin/questions');
      } else {
        setServerMessage({ type: 'error', text: data.message || 'Failed to delete question' });
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const filteredExams = exams.filter((ex) =>
    ex.name.toLowerCase().includes(examSearch.toLowerCase())
  );

  return (
    <div className="space-y-3 w-full select-none font-sans text-slate-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Link
            href="/edu-admin/questions"
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
            title="Back to Questions"
          >
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-xl font-normal text-slate-900 tracking-tight">
            {isEdit ? 'Edit Question' : 'Add New Question'}
          </h1>
        </div>

        <Link
          href="/edu-admin/questions"
          className="text-xs text-[#0073aa] hover:underline font-normal"
        >
          View all questions →
        </Link>
      </div>

      {/* Global Alert Notification Banner */}
      {serverMessage && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
            serverMessage.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-emerald-50 border-emerald-300 text-emerald-800'
          }`}
        >
          {serverMessage.type === 'error' ? (
            <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
          ) : (
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{serverMessage.text}</div>
        </div>
      )}

      {/* Main 2-Column Split Form Layout (Matching Screenshot 7) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Question Details & Options (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Question Details
            </h2>

            {/* Row 1: Type, Language, Difficulty, Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.type?.slug || 'objective'}
                  onChange={(e) => {
                    const slug = e.target.value;
                    const name = slug === 'objective' ? 'Objective' : 'Single Choice';
                    setFormData({ ...formData, type: { name, slug } });
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden text-slate-800"
                >
                  <option value="objective">Objective</option>
                  <option value="single-choice">Single Choice</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Language <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.language || 'Hindi'}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden text-slate-800"
                >
                  <option value="Hindi">Hindi</option>
                  <option value="English">English</option>
                  <option value="Bilingual">Bilingual</option>
                  <option value="Sanskrit">Sanskrit</option>
                </select>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Difficulty Level <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.level?.slug || 'medium'}
                  onChange={(e) => {
                    const slug = e.target.value;
                    const name = slug.charAt(0).toUpperCase() + slug.slice(1);
                    setFormData({ ...formData, level: { name, slug } });
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden text-slate-800"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.subject || ''}
                  onChange={(e) => {
                    const sId = e.target.value;
                    const found = subjects.find((s) => s._id === sId);
                    setFormData({
                      ...formData,
                      subject: sId,
                      subject_name: found ? found.name : '',
                    });
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden text-slate-800"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Directions / Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Directions
              </label>
              <textarea
                rows={2}
                value={formData.instruction || ''}
                onChange={(e) => setFormData({ ...formData, instruction: e.target.value })}
                placeholder="Optional instructions, reading comprehension passage, or note..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden text-slate-800 resize-y"
              />
            </div>

            {/* Question Content */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Question <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={formData.content || ''}
                onChange={(e) => {
                  setFormData({ ...formData, content: e.target.value });
                  if (errors.content) setErrors((prev) => ({ ...prev, content: null }));
                }}
                placeholder="Type your question content here..."
                className={`w-full px-3 py-2.5 text-xs bg-white border rounded transition-colors outline-hidden resize-y font-medium leading-relaxed ${
                  errors.content
                    ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-50/20 text-rose-900'
                    : 'border-slate-300 focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]'
                }`}
              />
              {errors.content && (
                <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{errors.content}</span>
                </p>
              )}
            </div>

            {/* Answer Options Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Answer Options
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Fill in the option descriptions and choose the correct answer.
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {visibleOptionsCount < 6 && (
                    <button
                      type="button"
                      onClick={() => setVisibleOptionsCount((c) => Math.min(6, c + 1))}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>Add Option {visibleOptionsCount + 1}</span>
                    </button>
                  )}
                  {visibleOptionsCount > 4 && (
                    <button
                      type="button"
                      onClick={() => setVisibleOptionsCount((c) => Math.max(4, c - 1))}
                      className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-rose-600 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Minus size={12} />
                      <span>Remove Option {visibleOptionsCount}</span>
                    </button>
                  )}
                </div>
              </div>

              {errors.options && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 rounded text-[11px] text-rose-700 flex items-center gap-1.5 font-medium">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{errors.options}</span>
                </div>
              )}

              {/* Options 1 to N */}
              <div className="space-y-3">
                {formData.options.slice(0, visibleOptionsCount).map((opt, idx) => {
                  const isCorrect = opt.is_correct;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border transition-all ${
                        isCorrect
                          ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-400/40'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>Option {idx + 1}</span>
                        </label>

                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="correctAnswerOption"
                            checked={isCorrect}
                            onChange={() => handleSetCorrectAnswer(idx)}
                            className="text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 w-3.5 h-3.5"
                          />
                          <span className={isCorrect ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                            {isCorrect ? '✓ Correct Answer' : 'Mark as Correct'}
                          </span>
                        </label>
                      </div>

                      <textarea
                        rows={2}
                        value={opt.text || ''}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Enter Option ${idx + 1} text...`}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:border-[#2271b1] outline-hidden text-slate-800 resize-y"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Correct Answer Dropdown (Matching Screenshot 7) */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correct Answer <span className="text-rose-500">*</span>
              </label>
              <select
                value={`Option ${(formData.options.findIndex((o) => o.is_correct) >= 0 ? formData.options.findIndex((o) => o.is_correct) : 0) + 1}`}
                onChange={(e) => {
                  const match = e.target.value.match(/\d+/);
                  if (match) {
                    handleSetCorrectAnswer(parseInt(match[0], 10) - 1);
                  }
                }}
                className={`w-full px-3 py-2 text-xs bg-white border rounded font-semibold text-emerald-800 transition-colors outline-hidden ${
                  errors.correct_answer
                    ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-50/20'
                    : 'border-slate-300 focus:border-[#2271b1]'
                }`}
              >
                {formData.options.slice(0, visibleOptionsCount).map((opt, idx) => (
                  <option key={idx} value={`Option ${idx + 1}`}>
                    Option {idx + 1} ({String.fromCharCode(65 + idx)})
                  </option>
                ))}
              </select>
              {errors.correct_answer && (
                <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{errors.correct_answer}</span>
                </p>
              )}
            </div>

            {/* Explanation / Solution Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Answer Explanation / Solution Notes
              </label>
              <textarea
                rows={3}
                value={formData.ans_info || ''}
                onChange={(e) => setFormData({ ...formData, ans_info: e.target.value })}
                placeholder="Detailed rationale, formulas, and explanations shown to students..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden text-slate-800 resize-y"
              />
            </div>

            {/* Marks & Negative Marks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Marks (+ Positive)
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={formData.marks}
                  onChange={(e) => setFormData({ ...formData, marks: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Negative Marks (- Penalty)
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={formData.negative}
                  onChange={(e) => setFormData({ ...formData, negative: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar Widgets (Publish, State, Examinations) (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Publish Widget Box */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Publish
              </h3>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Status
                </label>
                <select
                  value={formData.status || 'Published'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden text-slate-800 font-medium"
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending Review</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                {isEdit && (
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(true)}
                    className="text-rose-600 hover:text-rose-800 text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 size={13} />
                    <span>Move to Trash</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="ml-auto px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  <Save size={13} />
                  <span>{isEdit ? 'Update Question' : 'Save & Publish'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* State & Location Widget Box */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5">
              <Landmark size={14} className="text-[#2271b1]" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                State & Location
              </h3>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Select State
                </label>
                <select
                  value={formData.state || ''}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden text-slate-800"
                >
                  <option value="">National / All India (None)</option>
                  {states.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.state && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Select District
                  </label>
                  <select
                    value={formData.district || ''}
                    onChange={(e) => {
                      const dId = e.target.value;
                      const found = districts.find((d) => d._id === dId);
                      setFormData({
                        ...formData,
                        district: dId,
                        district_name: found ? found.name : '',
                      });
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden text-slate-800"
                  >
                    <option value="">All Districts</option>
                    {districts.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  City / Location Tag
                </label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Dehradun, Lucknow"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Select Examinations Widget Box (Matching Screenshot 7) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Select Examinations
              </h3>
              <span className="text-[10px] text-slate-500 font-bold">
                {formData.examinations.length} selected
              </span>
            </div>

            <div className="p-3 space-y-2 text-xs">
              {/* Exam search */}
              <div className="relative">
                <input
                  type="text"
                  value={examSearch}
                  onChange={(e) => setExamSearch(e.target.value)}
                  placeholder="Search exams..."
                  className="w-full pl-7 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded focus:border-[#2271b1] outline-hidden"
                />
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Scrollable Checkbox List */}
              <div className="max-h-48 overflow-y-auto custom-scrollbar border border-slate-200 rounded-lg p-2 space-y-1.5 bg-slate-50/50">
                {filteredExams.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-2">
                    No examinations found
                  </p>
                ) : (
                  filteredExams.map((ex) => {
                    const isChecked = formData.examinations.some(
                      (id) => String(id) === String(ex._id)
                    );
                    return (
                      <label
                        key={ex._id}
                        className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${
                          isChecked ? 'bg-blue-50/80 font-bold text-[#2271b1]' : 'hover:bg-white text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleExam(ex._id)}
                          className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                        />
                        <span className="text-[11px] truncate">{ex.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal for Edit Mode */}
      {isEdit && (
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDelete}
          isLoading={isDeleting}
          title="Move Question to Trash?"
          itemName={formData.content}
          description="Are you sure you want to move this question to trash? You can restore it later from the Trashed tab."
          confirmText="Move to Trash"
        />
      )}
    </div>
  );
}
