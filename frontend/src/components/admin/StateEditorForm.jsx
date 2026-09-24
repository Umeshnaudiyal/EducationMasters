'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Trash2,
  Globe,
  Landmark,
  FileText,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import JoditEditorWrapper from '@/components/admin/JoditEditorWrapper';
import MediaLibraryModal from '@/components/admin/MediaLibraryModal';
import { getImageUrl } from '@/utils/image';
import { getAuthToken } from '@/utils/auth';
import { cleanHtmlContent } from '@/utils/cleanHtml';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export default function StateEditorForm({ stateId = null, isEdit = false }) {
  const router = useRouter();
  const { data: session } = useSession();

  // Loading & Saving States
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [serverMessage, setServerMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  const [formErrors, setFormErrors] = useState({});

  // Active Tab for Rich Text Editors: 'description_en' | 'description_hi' | 'job_description'
  const [activeContentTab, setActiveContentTab] = useState('description_en');
  // Active Tab for SEO: 'en' | 'hi'
  const [activeSeoTab, setActiveSeoTab] = useState('en');
  const [isSeoOpen, setIsSeoOpen] = useState(true);

  // Media Library Modal
  const [mediaModalOpen, setMediaModalOpen] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    state_number: '',
    capital: '',
    governor: '',
    chief_minister: '',
    land_area: '',
    population: '',
    image: '',
    about_state: '',
    description: '',
    description_hi: '',
    job_description: '',
    seo: {
      allow_indexing: true,
      meta_title: '',
      meta_keywords: '',
      meta_description: '',
    },
    seo_hi: {
      meta_title: '',
      meta_keywords: '',
      meta_description: '',
    },
  });

  const [isCustomSlug, setIsCustomSlug] = useState(false);

  // Token retrieval helper
  const getActiveToken = useCallback(() => {
    return getAuthToken(session);
  }, [session]);

  // Slugify Helper
  const slugify = (text) => {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Fetch State Details for Editing
  useEffect(() => {
    if (!isEdit || !stateId) return;

    let isMounted = true;
    const fetchStateData = async () => {
      try {
        setInitialLoading(true);
        const token = getActiveToken();
        const res = await fetch(`${BACKEND_URL}/apis/v1/states/${stateId}`, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();

        if (isMounted && data.success && data.data) {
          const item = data.data;
          setFormData({
            name: item.name || '',
            slug: item.slug || '',
            state_number: item.state_number || '',
            capital: item.capital || '',
            governor: item.governor || '',
            chief_minister: item.chief_minister || '',
            land_area: item.land_area || '',
            population: item.population || '',
            image: item.image || '',
            about_state: cleanHtmlContent(item.about_state || ''),
            description: cleanHtmlContent(item.description || ''),
            description_hi: cleanHtmlContent(item.description_hi || ''),
            job_description: cleanHtmlContent(item.job_description || ''),
            seo: {
              allow_indexing: item.seo?.allow_indexing ?? true,
              meta_title: item.seo?.meta_title || '',
              meta_keywords: item.seo?.meta_keywords || '',
              meta_description: item.seo?.meta_description || '',
            },
            seo_hi: {
              meta_title: item.seo_hi?.meta_title || '',
              meta_keywords: item.seo_hi?.meta_keywords || '',
              meta_description: item.seo_hi?.meta_description || '',
            },
          });
          setIsCustomSlug(true);
        } else if (isMounted) {
          setServerMessage({ type: 'error', text: data.message || 'Failed to load state details' });
        }
      } catch (err) {
        console.error('Error fetching state:', err);
        if (isMounted) {
          setServerMessage({ type: 'error', text: 'Error connecting to server. Please try again.' });
        }
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };

    fetchStateData();
    return () => {
      isMounted = false;
    };
  }, [isEdit, stateId, getActiveToken]);

  // Handle Input Changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'name' && !isCustomSlug) {
        updated.slug = slugify(value);
      }
      return updated;
    });

    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Handle SEO Changes
  const handleSeoChange = (lang, field, value) => {
    setFormData((prev) => {
      if (lang === 'en') {
        return {
          ...prev,
          seo: {
            ...prev.seo,
            [field]: value,
          },
        };
      } else {
        return {
          ...prev,
          seo_hi: {
            ...prev.seo_hi,
            [field]: value,
          },
        };
      }
    });
  };

  // Select Image from Media Library
  const handleImageSelect = (mediaItem) => {
    if (!mediaItem) return;
    const imgUrl =
      mediaItem.file ||
      mediaItem.url ||
      mediaItem.img_url ||
      (mediaItem.path && mediaItem.name ? `${mediaItem.path.replace(/\/$/, '')}/${mediaItem.name}` : mediaItem.path) ||
      '';
    handleInputChange('image', imgUrl);
    setMediaModalOpen(false);
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setServerMessage(null);

    // Validation
    const errors = {};
    if (!formData.name?.trim()) {
      errors.name = 'State name is required';
    }
    if (!formData.slug?.trim()) {
      errors.slug = 'State slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug.trim())) {
      errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setServerMessage({ type: 'error', text: 'Please correct the highlighted errors before saving.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setSaving(true);
      const token = getActiveToken();
      const endpoint = isEdit
        ? `${BACKEND_URL}/apis/v1/states/${stateId}`
        : `${BACKEND_URL}/apis/v1/states`;
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        description: cleanHtmlContent(formData.description),
        description_hi: cleanHtmlContent(formData.description_hi),
        job_description: cleanHtmlContent(formData.job_description),
        about_state: cleanHtmlContent(formData.about_state),
      };

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setServerMessage({
          type: 'success',
          text: isEdit ? 'State updated successfully!' : 'State created successfully!',
        });
        setTimeout(() => {
          router.push('/edu-admin/states');
        }, 1000);
      } else {
        setServerMessage({
          type: 'error',
          text: data.message || (isEdit ? 'Failed to update state' : 'Failed to create state'),
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error saving state:', err);
      setServerMessage({ type: 'error', text: 'Network error occurred. Please try again.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="w-full bg-white rounded-xl p-12 border border-slate-200 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#2271b1] animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading state data...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 pb-16">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/edu-admin/states"
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
            title="Back to States list"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Landmark size={20} className="text-[#2271b1]" />
              <span>{isEdit ? `Edit State: ${formData.name || 'Untitled'}` : 'Add New State'}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit ? 'Update administrative details, descriptions, and SEO configuration.' : 'Create a new state with administrative attributes, rich content, and SEO metadata.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/edu-admin/states"
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{saving ? 'Saving...' : isEdit ? 'Update State' : 'Publish State'}</span>
          </button>
        </div>
      </div>

      {/* Server Alerts */}
      {serverMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs sm:text-sm animate-in fade-in duration-200 ${
            serverMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {serverMessage.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="font-medium">{serverMessage.text}</div>
        </div>
      )}

      {/* Main Grid: Card 1 - Basic & Admin Info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex items-center gap-2">
          <Landmark size={15} className="text-[#2271b1]" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            General &amp; Administrative Details
          </h2>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Row 1: Name & Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                State Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g. Uttarakhand, Maharashtra, Assam..."
                className={`w-full px-3.5 py-2 text-xs sm:text-sm bg-white border rounded-lg focus:outline-none transition-colors ${
                  formErrors.name
                    ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-400'
                    : 'border-slate-300 focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]'
                }`}
              />
              {formErrors.name && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Slug <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => {
                    setIsCustomSlug(true);
                    handleInputChange('slug', e.target.value);
                  }}
                  placeholder="e.g. uttarakhand, maharashtra, assam..."
                  className={`w-full px-3.5 py-2 text-xs sm:text-sm bg-white border rounded-lg font-mono focus:outline-none transition-colors ${
                    formErrors.slug
                      ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-400'
                      : 'border-slate-300 focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]'
                  }`}
                />
              </div>
              {formErrors.slug && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{formErrors.slug}</p>
              )}
            </div>
          </div>

          {/* Row 2: State No, Capital, Governor, Chief Minister */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                State Number
              </label>
              <input
                type="text"
                value={formData.state_number}
                onChange={(e) => handleInputChange('state_number', e.target.value)}
                placeholder="e.g. 1st State, 05, etc."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">The state order/number</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Capital
              </label>
              <input
                type="text"
                value={formData.capital}
                onChange={(e) => handleInputChange('capital', e.target.value)}
                placeholder="e.g. Dehradun / Gairsain"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">The primary capital</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Governor
              </label>
              <input
                type="text"
                value={formData.governor}
                onChange={(e) => handleInputChange('governor', e.target.value)}
                placeholder="Current Governor Name"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Honourable Governor</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chief Minister
              </label>
              <input
                type="text"
                value={formData.chief_minister}
                onChange={(e) => handleInputChange('chief_minister', e.target.value)}
                placeholder="Current Chief Minister"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Current Head of Govt</span>
            </div>
          </div>

          {/* Row 3: Land Area, Population, Featured Image */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Land Area
              </label>
              <input
                type="text"
                value={formData.land_area}
                onChange={(e) => handleInputChange('land_area', e.target.value)}
                placeholder="e.g. 53,483 km²"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Geographical area</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Population
              </label>
              <input
                type="text"
                value={formData.population}
                onChange={(e) => handleInputChange('population', e.target.value)}
                placeholder="e.g. 10.1 Million"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Estimated population</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Featured Image / Emblem / Map
              </label>
              <div className="flex items-center gap-3">
                {formData.image ? (
                  <div className="relative w-14 h-14 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden shrink-0 shadow-2xs group">
                    <img
                      src={getImageUrl(formData.image)}
                      alt="State thumbnail"
                      className="w-full h-full object-contain p-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleInputChange('image', '')}
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <ImageIcon size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMediaModalOpen(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <ImageIcon size={13} />
                    <span>{formData.image ? 'Change Image' : 'Select Image'}</span>
                  </button>
                  {formData.image && (
                    <span className="text-[10px] text-slate-400 truncate block mt-1">
                      {formData.image}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: About State Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              About State (Short Overview / Key Highlights)
            </label>
            <textarea
              rows={3}
              value={formData.about_state}
              onChange={(e) => handleInputChange('about_state', e.target.value)}
              placeholder="Key facts, geographic importance, history, and brief summary about this state..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] focus:outline-none resize-y"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Card 2 - Rich Text Editors for Descriptions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-[#2271b1]" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              State Content &amp; Descriptions
            </h2>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveContentTab('description_en')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeContentTab === 'description_en'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🇬🇧</span>
              <span>English Description</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveContentTab('description_hi')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeContentTab === 'description_hi'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🇮🇳</span>
              <span>Hindi Description</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveContentTab('job_description')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeContentTab === 'job_description'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>💼</span>
              <span>Job Description</span>
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {/* Tab 1: English Description */}
          {activeContentTab === 'description_en' && (
            <div className="space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  State Description (English Content)
                </label>
                <span className="text-[11px] text-slate-400">
                  Full rich article / guide displayed on the state portal in English.
                </span>
              </div>
              <div className="w-full">
                <JoditEditorWrapper
                  value={formData.description}
                  onChange={(val) => handleInputChange('description', val)}
                  height={450}
                  placeholder="Compose detailed state history, geography, economy, culture, and educational resources in English..."
                />
              </div>
            </div>
          )}

          {/* Tab 2: Hindi Description */}
          {activeContentTab === 'description_hi' && (
            <div className="space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  State Description (Hindi Content)
                </label>
                <span className="text-[11px] text-slate-400">
                  Full rich article / guide displayed on the state portal in Hindi.
                </span>
              </div>
              <div className="w-full">
                <JoditEditorWrapper
                  value={formData.description_hi}
                  onChange={(val) => handleInputChange('description_hi', val)}
                  height={450}
                  placeholder="राज्य का इतिहास, भूगोल, सामान्य ज्ञान और प्रतियोगी परीक्षाओं की जानकारी हिन्दी में लिखें..."
                />
              </div>
            </div>
          )}

          {/* Tab 3: Job Description */}
          {activeContentTab === 'job_description' && (
            <div className="space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  State Job Description &amp; Employment Guidelines
                </label>
                <span className="text-[11px] text-slate-400">
                  Specific state govt job opportunities, PSC notifications, and recruitment guidelines.
                </span>
              </div>
              <div className="w-full">
                <JoditEditorWrapper
                  value={formData.job_description}
                  onChange={(val) => handleInputChange('job_description', val)}
                  height={450}
                  placeholder="Write details regarding State Govt Jobs, PSC, Police Bharti, Teacher eligibility, and recruitment updates..."
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Card 3 - SEO Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div
          onClick={() => setIsSeoOpen(!isSeoOpen)}
          className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Globe size={15} className="text-[#2271b1]" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Search Engine Optimization (SEO)
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Manage meta tags &amp; search indexing
            </span>
            {isSeoOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
          </div>
        </div>

        {isSeoOpen && (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Language Sub-Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setActiveSeoTab('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeSeoTab === 'en'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>🇬🇧</span>
                <span>English SEO</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSeoTab('hi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeSeoTab === 'hi'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>🇮🇳</span>
                <span>Hindi SEO</span>
              </button>
            </div>

            {/* English SEO Fields */}
            {activeSeoTab === 'en' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allow_indexing_en"
                    checked={formData.seo?.allow_indexing ?? true}
                    onChange={(e) => handleSeoChange('en', 'allow_indexing', e.target.checked)}
                    className="w-4 h-4 text-[#2271b1] rounded border-slate-300 focus:ring-[#2271b1] cursor-pointer"
                  />
                  <label htmlFor="allow_indexing_en" className="text-xs font-semibold text-slate-800 cursor-pointer">
                    Allow search engines to index this state page (index, follow)
                  </label>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Meta Title (English)</label>
                    <span className="text-[10px] text-slate-400">
                      {(formData.seo?.meta_title || '').length} / 60 chars
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.seo?.meta_title || ''}
                    onChange={(e) => handleSeoChange('en', 'meta_title', e.target.value)}
                    placeholder="e.g. Uttarakhand GK, Govt Jobs & Mock Test Series - Education Masters"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meta Keywords (English)
                  </label>
                  <input
                    type="text"
                    value={formData.seo?.meta_keywords || ''}
                    onChange={(e) => handleSeoChange('en', 'meta_keywords', e.target.value)}
                    placeholder="e.g. uttarakhand gk, uttarakhand govt jobs, ukpsc mcq, uksssc"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Comma-separated keyword list</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Meta Description (English)</label>
                    <span className="text-[10px] text-slate-400">
                      {(formData.seo?.meta_description || '').length} / 160 chars
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={formData.seo?.meta_description || ''}
                    onChange={(e) => handleSeoChange('en', 'meta_description', e.target.value)}
                    placeholder="Brief description for search engine snippet..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* Hindi SEO Fields */}
            {activeSeoTab === 'hi' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Meta Title (Hindi)</label>
                    <span className="text-[10px] text-slate-400">
                      {(formData.seo_hi?.meta_title || '').length} / 60 chars
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.seo_hi?.meta_title || ''}
                    onChange={(e) => handleSeoChange('hi', 'meta_title', e.target.value)}
                    placeholder="e.g. उत्तराखंड सामान्य ज्ञान, सरकारी नौकरी एवं मॉक टेस्ट"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meta Keywords (Hindi)
                  </label>
                  <input
                    type="text"
                    value={formData.seo_hi?.meta_keywords || ''}
                    onChange={(e) => handleSeoChange('hi', 'meta_keywords', e.target.value)}
                    placeholder="e.g. उत्तराखंड जीके, यूकेपीएससी, उत्तराखंड जॉब्स"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">अल्पविराम द्वारा अलग किए गए कीवर्ड्स</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Meta Description (Hindi)</label>
                    <span className="text-[10px] text-slate-400">
                      {(formData.seo_hi?.meta_description || '').length} / 160 chars
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={formData.seo_hi?.meta_description || ''}
                    onChange={(e) => handleSeoChange('hi', 'meta_description', e.target.value)}
                    placeholder="सर्च इंजन स्निपेट के लिए विवरण..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <Link
          href="/edu-admin/states"
          className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          Back to States List
        </Link>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="px-5 py-2.5 bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          <span>{saving ? 'Saving State...' : isEdit ? 'Update State Data' : 'Save & Publish State'}</span>
        </button>
      </div>

      {/* Media Library Modal */}
      {mediaModalOpen && (
        <MediaLibraryModal
          isOpen={mediaModalOpen}
          onClose={() => setMediaModalOpen(false)}
          onSelect={handleImageSelect}
          targetType="featured"
        />
      )}
    </div>
  );
}
