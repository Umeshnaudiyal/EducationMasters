'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  CreditCard,
  Check,
  Eye,
  Settings,
  ShieldCheck,
  CheckCheck,
  ExternalLink,
  Info,
} from 'lucide-react';
import JoditEditorWrapper from './JoditEditorWrapper';
import MediaLibraryModal from './MediaLibraryModal';
import { getImageUrl } from '@/utils/image';
import { getAuthToken } from '@/utils/auth';
import { slugify } from '@/utils/slug';
import { cleanHtmlContent, stripHtmlToPlainText } from '@/utils/cleanHtml';
import { toast } from '@/context/ToastContext';
import { BACKEND_URL } from '@/utils/api';

const API_BASE = BACKEND_URL;

export default function MockTestSeriesForm({ initialData = null, isEdit = false }) {
  const router = useRouter();
  const { data: session } = useSession();

  // Multi-Step Wizard: Step 1 = Details & Content, Step 2 = Assign Pricing Plans
  const [currentStep, setCurrentStep] = useState(1);

  const [saving, setSaving] = useState(false);
  const [serverMessage, setServerMessage] = useState(null);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [isSeoOpen, setIsSeoOpen] = useState(true);

  const [exams, setExams] = useState([]);
  const [categories, setCategories] = useState([]);

  // Master Plans from Database Pool
  const [availableMasterPlans, setAvailableMasterPlans] = useState([]);
  const [loadingMasterPlans, setLoadingMasterPlans] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    image: initialData?.image || '',
    examination: initialData?.examination?._id || initialData?.examination || '',
    category: initialData?.category?._id || initialData?.category || '',
    badge: initialData?.badge || 'Popular',
    top_description: initialData?.top_description || '',
    bottom_description: initialData?.bottom_description || '',
    highlights: initialData?.highlights && initialData.highlights.length > 0
      ? initialData.highlights
      : [
          '50+ High-Quality Mock Tests based on latest pattern',
          '10 Free Practice Tests with Instant Solutions',
          'Detailed Step-by-Step Hindi & English Solutions',
          'Real-Time All India Rank & Percentile Report',
          'Performance Weak-Area Analytics',
        ],
    plans: initialData?.plans || [],
    status: initialData?.status || 'Published',
    is_featured: initialData?.is_featured ?? false,
    order: initialData?.order ?? 0,
    seo: {
      allow_indexing: initialData?.seo?.allow_indexing ?? true,
      meta_title: initialData?.seo?.meta_title || '',
      meta_keywords: initialData?.seo?.meta_keywords || '',
      meta_description: initialData?.seo?.meta_description || '',
    },
  });

  const [formErrors, setFormErrors] = useState({});

  // Input Refs for Client-Side Error Scrolling & Auto-Focusing
  const titleRef = useRef(null);
  const slugRef = useRef(null);
  const examRef = useRef(null);
  const categoryRef = useRef(null);
  const topDescRef = useRef(null);
  const step2PlansRef = useRef(null);
  const stepperRef = useRef(null);

  // Fetch dropdowns and master plans pool
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingMasterPlans(true);
        const token = getAuthToken(session);
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

        const [examsRes, catsRes] = await Promise.all([
          fetch(`${API_BASE}/apis/v1/exams?limit=100`).catch(() => ({ json: () => ({ success: false }) })),
          fetch(`${API_BASE}/apis/v1/categories?limit=100`).catch(() => ({ json: () => ({ success: false }) })),
        ]);

        const examsData = await examsRes.json();
        const catsData = await catsRes.json();

        if (examsData.success) setExams(examsData.data || []);
        if (catsData.success) setCategories(catsData.data || []);

        let poolPlans = [];
        try {
          const plansRes = await fetch(`${API_BASE}/apis/v1/mock-test-plans/admin/all`, { headers: authHeaders });
          const plansData = await plansRes.json();
          if (plansData.success && Array.isArray(plansData.data)) {
            poolPlans = plansData.data;
          }
        } catch (err) {
          console.error('Error fetching admin plans:', err);
        }

        if (poolPlans.length === 0) {
          try {
            const fallbackRes = await fetch(`${API_BASE}/apis/v1/mock-test-plans`);
            const fallbackData = await fallbackRes.json();
            if (fallbackData.success && Array.isArray(fallbackData.data)) {
              poolPlans = fallbackData.data;
            }
          } catch (err) {
            console.error('Fallback plans error:', err);
          }
        }

        // Only use the Master Plans Pool
        setAvailableMasterPlans(poolPlans);

        // Pre-select plans for new series or keep existing
        if (!isEdit && (!formData.plans || formData.plans.length === 0)) {
          setFormData((prev) => ({
            ...prev,
            plans: poolPlans.filter((p) => p.status !== 'inactive'),
          }));
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoadingMasterPlans(false);
      }
    };

    fetchData();
  }, [isEdit, session]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSeoChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      seo: { ...prev.seo, [field]: value },
    }));
  };

  // Highlights handlers
  const addHighlight = () => {
    setFormData((prev) => ({
      ...prev,
      highlights: [...prev.highlights, ''],
    }));
  };

  const updateHighlight = (index, value) => {
    setFormData((prev) => {
      const next = [...prev.highlights];
      next[index] = value;
      return { ...prev, highlights: next };
    });
  };

  const removeHighlight = (index) => {
    setFormData((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
  };

  // Step 2: Plans Toggle & Selection Handlers
  const isPlanSelected = (plan) => {
    return formData.plans.some(
      (p) =>
        (p.slug && p.slug === plan.slug) ||
        (p.name && p.name.toLowerCase() === plan.name.toLowerCase()) ||
        (p._id && plan._id && String(p._id) === String(plan._id))
    );
  };

  const togglePlanSelection = (plan) => {
    setFormData((prev) => {
      const isSelected = prev.plans.some(
        (p) =>
          (p.slug && p.slug === plan.slug) ||
          (p.name && p.name.toLowerCase() === plan.name.toLowerCase()) ||
          (p._id && plan._id && String(p._id) === String(plan._id))
      );

      let nextPlans;
      if (isSelected) {
        nextPlans = prev.plans.filter(
          (p) =>
            !(
              (p.slug && p.slug === plan.slug) ||
              (p.name && p.name.toLowerCase() === plan.name.toLowerCase()) ||
              (p._id && plan._id && String(p._id) === String(plan._id))
            )
        );
      } else {
        nextPlans = [
          ...prev.plans,
          {
            name: plan.name,
            slug: plan.slug,
            price: Number(plan.price) || 0,
            original_price: Number(plan.original_price) || 0,
            validity: plan.validity || '1 Year',
            validity_days: Number(plan.validity_days) || 365,
            is_free: Boolean(plan.is_free) || Number(plan.price) === 0,
            is_popular: Boolean(plan.is_popular),
            badge: plan.badge || '',
            tagline: plan.tagline || '',
            features: Array.isArray(plan.features) ? [...plan.features] : [],
            button_text: plan.button_text || (Number(plan.price) === 0 ? 'Select Free Plan' : `Select ₹${plan.price} Plan`),
          },
        ];
      }

      return { ...prev, plans: nextPlans };
    });

    if (formErrors.plans) {
      setFormErrors((prev) => ({ ...prev, plans: null }));
    }
  };

  // Modify specific attached plan override
  const updateAttachedPlan = (pIndex, field, value) => {
    setFormData((prev) => {
      const nextPlans = [...prev.plans];
      nextPlans[pIndex] = { ...nextPlans[pIndex], [field]: value };
      if (field === 'price') {
        const num = Number(value);
        if (num === 0) {
          nextPlans[pIndex].is_free = true;
          if (!nextPlans[pIndex].button_text || nextPlans[pIndex].button_text.includes('₹')) {
            nextPlans[pIndex].button_text = 'Select Free Plan';
          }
        } else {
          nextPlans[pIndex].is_free = false;
          if (nextPlans[pIndex].button_text === 'Select Free Plan') {
            nextPlans[pIndex].button_text = `Select ₹${num} Plan`;
          }
        }
      }
      return { ...prev, plans: nextPlans };
    });
  };

  // Client Validation with Refs
  const validateStep1 = () => {
    const errors = {};
    let firstErrorRef = null;

    if (!formData.title?.trim()) {
      errors.title = 'Series Title is required';
      firstErrorRef = titleRef;
    }

    if (!formData.slug?.trim()) {
      errors.slug = 'Valid URL slug is required';
      firstErrorRef = firstErrorRef || slugRef;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (firstErrorRef?.current) {
        firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorRef.current.focus();
      }
      setServerMessage({
        type: 'error',
        text: 'Please fill in all required fields highlighted in red.',
      });
      return false;
    }

    return true;
  };

  // Navigation handlers
  const handleProceedToStep2 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Submit Handler
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setServerMessage(null);

    // Validate Step 1 fields first
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    // Validate Step 2 (Plans)
    if (!formData.plans || formData.plans.length === 0) {
      setFormErrors((prev) => ({
        ...prev,
        plans: 'Please select at least one pricing plan (e.g. Free Plan or Pro Pass) for this series.',
      }));
      setCurrentStep(2);
      if (step2PlansRef.current) {
        step2PlansRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setServerMessage({
        type: 'error',
        text: 'Please attach at least one pricing plan before publishing.',
      });
      return;
    }

    try {
      setSaving(true);
      const token = getAuthToken(session);

      const payload = {
        ...formData,
        title: formData.title.trim(),
        slug: slugify(formData.slug),
        top_description: cleanHtmlContent(formData.top_description || ''),
        bottom_description: cleanHtmlContent(formData.bottom_description || ''),
        highlights: formData.highlights.filter((h) => h && h.trim()),
        plans: formData.plans,
        seo: {
          allow_indexing: formData.seo.allow_indexing ?? true,
          meta_title: stripHtmlToPlainText(formData.seo.meta_title || formData.title.trim()),
          meta_keywords: stripHtmlToPlainText(formData.seo.meta_keywords || ''),
          meta_description: stripHtmlToPlainText(formData.seo.meta_description || formData.top_description || ''),
        },
      };

      const url = isEdit
        ? `${API_BASE}/apis/v1/mock-test-series/${initialData._id}`
        : `${API_BASE}/apis/v1/mock-test-series`;
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
        const msg = isEdit ? 'Mock test series updated successfully.' : 'Mock test series created successfully.';
        setServerMessage({
          type: 'success',
          text: msg,
        });
        toast.success(msg);
        setTimeout(() => {
          router.push('/edu-admin/mock-tests');
        }, 800);
      } else {
        // Handle Server and DB Validation Errors
        if (data.errors) {
          setFormErrors(data.errors);
          if (data.errors.slug) {
            setCurrentStep(1);
            if (slugRef.current) {
              slugRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
              slugRef.current.focus();
            }
          } else if (data.errors.title) {
            setCurrentStep(1);
            if (titleRef.current) {
              titleRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
              titleRef.current.focus();
            }
          }
        }
        const errMsg = data.message || 'Server error occurred while saving the series.';
        setServerMessage({
          type: 'error',
          text: errMsg,
        });
        toast.error(errMsg);
      }
    } catch (err) {
      console.error('Save series error:', err);
      const errMsg = 'Network connection error while saving mock test series.';
      setServerMessage({ type: 'error', text: errMsg });
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full font-sans text-slate-800 pb-28">
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
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
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

      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:px-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/edu-admin/mock-tests"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-[#2271b1] border border-slate-200 hover:border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform text-slate-500 group-hover:text-[#2271b1]" />
            <span>Back to Mock Tests</span>
          </Link>

          <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {isEdit ? 'Edit Mock Test Series' : 'Create Mock Test Series'}
            </h1>
            {formData.slug && (
              <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                /{formData.slug}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Link
            href="/edu-admin/mock-tests"
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs cursor-pointer"
          >
            Cancel
          </Link>

          {currentStep === 1 ? (
            <button
              type="button"
              onClick={handleProceedToStep2}
              className="px-5 py-2 bg-[#2271b1] hover:bg-[#135e96] active:bg-[#0a4b78] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-2"
            >
              <span>Next: Choose Plans</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-2 bg-[#2271b1] hover:bg-[#135e96] active:bg-[#0a4b78] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-2"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              <span>{isEdit ? 'Update Series' : 'Publish Series'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stepper Tabs Bar */}
      <div ref={stepperRef} className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentStep === 1
              ? 'bg-blue-50 text-[#2271b1] border border-blue-200 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
              currentStep === 1 ? 'bg-[#2271b1] text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            1
          </span>
          <span>Step 1: Series Details & Content</span>
        </button>

        <button
          type="button"
          onClick={handleProceedToStep2}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentStep === 2
              ? 'bg-blue-50 text-[#2271b1] border border-blue-200 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
              currentStep === 2 ? 'bg-[#2271b1] text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            2
          </span>
          <span>Step 2: Assign & Configure Plans</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#2271b1] border border-blue-200">
            {formData.plans.length} Selected
          </span>
        </button>
      </div>

      {/* STEP 1: SERIES DETAILS & CONTENT */}
      {currentStep === 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs space-y-7 animate-in fade-in duration-200">
          {/* Section 1: Overview Info */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-[#2271b1]" />
              <span>1. Series Overview & Identification</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Title */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-800">
                  Series Title <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={titleRef}
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    handleChange('title', e.target.value);
                    if (!isEdit) handleChange('slug', slugify(e.target.value));
                  }}
                  placeholder="e.g. SSC CGL 2024 Full Mock Test Series (Tier 1 & Tier 2)"
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
                  onChange={(e) => handleChange('slug', slugify(e.target.value))}
                  placeholder="e.g. ssc-cgl-mock-test-series"
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

              {/* Badge */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">
                  Featured Badge / Tagline
                </label>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => handleChange('badge', e.target.value)}
                  placeholder="e.g. Trending, Free Tests, Best Seller, New Pattern"
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 focus:border-[#2271b1] rounded-xl text-slate-800 outline-none"
                />
              </div>

              {/* Examination */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">
                  Exam / Target Examination
                </label>
                <select
                  ref={examRef}
                  value={formData.examination}
                  onChange={(e) => handleChange('examination', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 focus:border-[#2271b1] rounded-xl text-slate-800 outline-none"
                >
                  <option value="">Select Target Examination</option>
                  {exams.map((ex) => (
                    <option key={ex._id} value={ex._id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">
                  Category
                </label>
                <select
                  ref={categoryRef}
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 focus:border-[#2271b1] rounded-xl text-slate-800 outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Publish Status */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">
                  Publish Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 focus:border-[#2271b1] rounded-xl text-slate-800 outline-none"
                >
                  <option value="Published">Published (Live for Students)</option>
                  <option value="Draft">Draft (Hidden)</option>
                </select>
              </div>

              {/* Display Order */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => handleChange('order', Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 focus:border-[#2271b1] rounded-xl text-slate-800 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Banner Image */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon size={16} className="text-[#2271b1]" />
              <span>2. Featured Banner / Thumbnail</span>
            </h2>

            <div className="space-y-3">
              {formData.image ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleChange('image', '')}
                      className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Remove Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaModalOpen(true)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ImageIcon size={13} />
                      <span>Replace Image</span>
                    </button>
                  </div>

                  <div className="max-w-md rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                    <img
                      src={getImageUrl(formData.image, null)}
                      alt={formData.title}
                      className="w-full h-44 object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => setMediaModalOpen(true)}
                    className="px-4 py-2.5 bg-white hover:bg-blue-50 text-[#2271b1] border border-blue-200 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
                  >
                    <ImageIcon size={15} />
                    <span>Choose / Upload Series Banner</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Top Description */}
          <div className="space-y-2 pt-4 border-t border-slate-100" ref={topDescRef}>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers size={16} className="text-[#2271b1]" />
              <span>3. Top Overview Description</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              This overview is displayed at the very top of the series landing page right beneath the header and badge.
            </p>
            <JoditEditorWrapper
              value={formData.top_description}
              onChange={(val) => handleChange('top_description', val)}
              height={260}
              placeholder="Write a clear overview of what students will get in this mock test series..."
            />
          </div>

          {/* Section 4: Highlights Checklist */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>4. Key Highlights & Features (Checklist)</span>
              </h2>
              <button
                type="button"
                onClick={addHighlight}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-[#2271b1] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Highlight</span>
              </button>
            </div>

            <div className="space-y-2">
              {formData.highlights.map((h, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold w-5">{idx + 1}.</span>
                  <input
                    type="text"
                    value={h}
                    onChange={(e) => updateHighlight(idx, e.target.value)}
                    placeholder="e.g. 50 Total Mock Tests based on latest pattern"
                    className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-300 focus:border-[#2271b1] rounded-lg text-slate-800 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeHighlight(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove Highlight"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Bottom Description */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers size={16} className="text-[#2271b1]" />
              <span>5. Bottom Description, Syllabus Breakdown & FAQs</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Detailed syllabus breakdown, exam pattern, subject-wise weightage, and FAQs.
            </p>
            <JoditEditorWrapper
              value={formData.bottom_description}
              onChange={(val) => handleChange('bottom_description', val)}
              height={300}
              placeholder="Write detailed syllabus breakdown, exam pattern, subject weightage, FAQs..."
            />
          </div>

          {/* Section 6: SEO Tags */}
          <div className="pt-4 border-t border-slate-100">
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div
                onClick={() => setIsSeoOpen(!isSeoOpen)}
                className="px-4 py-3 bg-[#f8fafc] hover:bg-slate-100 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none transition-colors"
              >
                <span className="text-xs font-bold text-slate-800">6. SEO Tags & Search Metadata</span>
                <span className="text-slate-500 font-bold text-base">{isSeoOpen ? '−' : '+'}</span>
              </div>

              {isSeoOpen && (
                <div className="p-4 sm:p-5 space-y-4 bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="seo_indexing"
                      checked={formData.seo?.allow_indexing ?? true}
                      onChange={(e) => handleSeoChange('allow_indexing', e.target.checked)}
                      className="rounded border-slate-300 text-[#2271b1]"
                    />
                    <label htmlFor="seo_indexing" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Allow Search Engines to Index This Page
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">Meta Title</label>
                    <input
                      type="text"
                      value={formData.seo?.meta_title || ''}
                      onChange={(e) => handleSeoChange('meta_title', e.target.value)}
                      placeholder="Meta title for Google search snippet"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-[#2271b1] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">Meta Keywords</label>
                    <input
                      type="text"
                      value={formData.seo?.meta_keywords || ''}
                      onChange={(e) => handleSeoChange('meta_keywords', e.target.value)}
                      placeholder="keyword1, keyword2, test series, mock test"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-[#2271b1] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">Meta Description</label>
                    <textarea
                      rows={3}
                      value={formData.seo?.meta_description || ''}
                      onChange={(e) => handleSeoChange('meta_description', e.target.value)}
                      placeholder="Meta description snippet (160 characters recommended)"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-[#2271b1] outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action in Step 1 */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Link
              href="/edu-admin/mock-tests"
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs cursor-pointer"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={handleProceedToStep2}
              className="px-6 py-2.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center gap-2"
            >
              <span>Continue to Step 2: Assign Pricing Plans</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ASSIGN PRICING PLANS FROM CREATED MASTER POOL */}
      {currentStep === 2 && (
        <div ref={step2PlansRef} className="space-y-6 animate-in fade-in duration-200">
          {/* Information & Manage Banner */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CreditCard className="text-[#2271b1]" size={20} />
                <h2 className="text-base font-bold text-slate-900">
                  Select Created Pricing Plans & Passes for this Series
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Only the plans you select below will be offered to students for this Mock Test Series. You can manage or create more plans in the master pool.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/edu-admin/mock-tests/plans"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-[#2271b1] border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <span>Master Plans Manager</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>

          {/* Validation Error Alert on Step 2 */}
          {formErrors.plans && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800 font-semibold">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{formErrors.plans}</span>
            </div>
          )}

          {/* Pool Plans Selection Grid */}
          {loadingMasterPlans ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
              <Loader2 size={24} className="animate-spin text-[#2271b1] mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">Loading master plans pool...</p>
            </div>
          ) : availableMasterPlans.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <CreditCard size={36} className="text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Master Plans Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create pricing plans in the master pool to attach them to your mock test series.
              </p>
              <Link
                href="/edu-admin/mock-tests/plans"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2271b1] text-white text-xs font-semibold rounded-xl hover:bg-[#135e96]"
              >
                <Plus size={14} />
                <span>Create Master Plans</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700">
                  Available Master Plans Pool ({availableMasterPlans.length})
                </span>
                <span className="text-xs font-semibold text-[#2271b1]">
                  {formData.plans.length} of {availableMasterPlans.length} Attached to this Series
                </span>
              </div>

              <div className="flex flex-wrap gap-5 items-stretch">
                {availableMasterPlans.map((plan, pIdx) => {
                  const selected = isPlanSelected(plan);
                  const isPopular = plan.is_popular;
                  const isFree = plan.is_free || Number(plan.price) === 0;

                  return (
                    <div
                      key={plan._id || pIdx}
                      onClick={() => togglePlanSelection(plan)}
                      className={`w-full sm:w-[280px] max-w-[290px] rounded-3xl border-2 p-5 flex flex-col justify-between relative transition-all duration-200 cursor-pointer select-none bg-white ${
                        selected
                          ? isPopular
                            ? 'border-amber-400 ring-4 ring-amber-400/20 shadow-md scale-[1.01]'
                            : isFree
                            ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-md scale-[1.01]'
                            : 'border-purple-500 ring-4 ring-purple-500/20 shadow-md scale-[1.01]'
                          : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100 shadow-2xs'
                      }`}
                    >
                      {/* Top Right Selector Checkbox Badge */}
                      <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            selected
                              ? 'bg-[#2271b1] text-white shadow-xs ring-2 ring-white'
                              : 'border-2 border-slate-300 bg-white'
                          }`}
                        >
                          {selected && <Check size={12} className="stroke-[3]" />}
                        </div>
                      </div>

                      {/* Plan Badge */}
                      {plan.badge && (
                        <span
                          className={`absolute -top-3 left-4 px-3 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider shadow-xs ${
                            isPopular
                              ? 'bg-amber-500 text-white'
                              : isFree
                              ? 'bg-emerald-500 text-white'
                              : 'bg-purple-600 text-white'
                          }`}
                        >
                          {plan.badge}
                        </span>
                      )}

                      <div className="space-y-3 pt-0.5">
                        {/* Plan Name Pill */}
                        <div>
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wider ${
                              isFree
                                ? 'bg-emerald-50 text-emerald-700'
                                : isPopular
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-purple-50 text-purple-700'
                            }`}
                          >
                            {plan.name}
                          </span>
                        </div>

                        {/* Price & Validity */}
                        <div>
                          <div className="flex items-baseline gap-1 text-slate-900 font-extrabold">
                            <span className="text-2xl sm:text-3xl">
                              {isFree ? 'FREE' : `₹${plan.price}`}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              / {plan.validity || '1 Year'}
                            </span>
                          </div>

                          {plan.original_price > plan.price && (
                            <div className="text-[11px] text-slate-400 line-through mt-0.5">
                              Original: ₹{plan.original_price}
                            </div>
                          )}

                          {plan.tagline && (
                            <p className="text-[11px] text-slate-500 mt-1.5 font-medium leading-relaxed">
                              {plan.tagline}
                            </p>
                          )}
                        </div>

                        {/* Features Checklist */}
                        <div className="space-y-1.5 pt-2.5 border-t border-slate-100">
                          {(plan.features || []).map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-start gap-1.5 text-[11px] text-slate-700 font-medium">
                              <div
                                className={`p-0.5 rounded-full mt-0.5 shrink-0 ${
                                  isFree
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : isPopular
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-purple-100 text-purple-700'
                                }`}
                              >
                                <Check size={9} className="stroke-[3]" />
                              </div>
                              <span className="leading-tight">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Selection Toggle Button */}
                      <div className="pt-4 mt-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlanSelection(plan);
                          }}
                          className={`w-full py-2 rounded-xl text-center text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                            selected
                              ? 'bg-slate-900 text-white hover:bg-slate-800'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {selected ? (
                            <>
                              <CheckCircle2 size={13} className="text-emerald-400" />
                              <span>Attached</span>
                            </>
                          ) : (
                            <>
                              <Plus size={13} />
                              <span>Click to Attach</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Navigation in Step 2 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBackToStep1}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Step 1: Series Details</span>
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 bg-[#2271b1] hover:bg-[#135e96] active:bg-[#0a4b78] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              <span>{isEdit ? 'Save & Update Series' : 'Publish Mock Test Series'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelect={(media) => {
          const selectedUrl =
            media.url ||
            (media.path && media.name ? `${media.path}/${media.name}` : '') ||
            media.file ||
            getImageUrl(media, '');
          handleChange('image', selectedUrl);
          setMediaModalOpen(false);
        }}
      />
    </div>
  );
}
