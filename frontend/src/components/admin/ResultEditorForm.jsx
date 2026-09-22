'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  Globe,
  Sparkles,
  Search as SearchIcon,
  CheckCircle2,
} from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import JoditEditorWrapper from '@/components/admin/JoditEditorWrapper';
import MediaLibraryModal from '@/components/admin/MediaLibraryModal';
import AdminLoader from '@/components/admin/AdminLoader';
import SearchableSelectPanel from '@/components/admin/SearchableSelectPanel';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

const RESULT_STATUS_OPTIONS = [
  'Declared / Out',
  'Announced',
  'Provisional Merit List',
  'Final Selection List',
  'Scorecard Available',
  'Cut-Off Marks Released',
  'Waiting List Out',
  'Interview List Released',
  'Document Verification List',
];

export default function ResultEditorForm({ slugOrId = null, isEdit = false }) {
  const router = useRouter();
  const { data: session } = useSession();

  // Input References for Smooth Scrolling on Validation Errors
  const titleRef = useRef(null);
  const slugRef = useRef(null);
  const postNameRef = useRef(null);
  const downUrlRef = useRef(null);
  const downloadInstructionsRef = useRef(null);
  const importantInstructionsRef = useRef(null);
  const metaTitleRef = useRef(null);
  const metaDescriptionRef = useRef(null);

  // Field-specific validation errors
  const [errors, setErrors] = useState({});

  // Clear a specific field error when user interacts with it
  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Smooth scroll and focus on invalid field
  const scrollToField = (field) => {
    if (field === 'title' && titleRef.current) {
      titleRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = titleRef.current.querySelector('input') || titleRef.current;
      input?.focus?.();
    } else if (field === 'slug' && slugRef.current) {
      slugRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = slugRef.current.querySelector('input') || slugRef.current;
      input?.focus?.();
    } else if (field === 'postName' && postNameRef.current) {
      postNameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = postNameRef.current.querySelector('input') || postNameRef.current;
      input?.focus?.();
    } else if (field === 'downUrl' && downUrlRef.current) {
      downUrlRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = downUrlRef.current.querySelector('input') || downUrlRef.current;
      input?.focus?.();
    } else if (field === 'downloadInstructions' && downloadInstructionsRef.current) {
      downloadInstructionsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (field === 'importantInstructions' && importantInstructionsRef.current) {
      importantInstructionsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (field === 'metaTitle' && metaTitleRef.current) {
      setCollapseSEO(false);
      metaTitleRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = metaTitleRef.current.querySelector('input') || metaTitleRef.current;
      input?.focus?.();
    } else if (field === 'metaDescription' && metaDescriptionRef.current) {
      setCollapseSEO(false);
      metaDescriptionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const textarea = metaDescriptionRef.current.querySelector('textarea') || metaDescriptionRef.current;
      textarea?.focus?.();
    }
  };

  // Helper to safely strip HTML for length & empty checks
  const cleanHtmlContent = (html) => {
    if (!html) return '';
    return html.replace(/<p><br><\/p>|<p><\/p>/g, '').trim();
  };

  // Helper to format date strings for input[type="date"]
  const formatInputDate = (dStr) => {
    if (!dStr || dStr === '0000-00-00' || dStr === 'null') return '';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr.slice(0, 10);
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  // Client-side Form Validation
  const validateForm = () => {
    const newErrors = {};

    if (!title || !title.trim()) {
      newErrors.title = 'Result post title is required. Please enter a title.';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long.';
    }

    if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      newErrors.slug = 'Slug must only contain lowercase alphanumeric characters and single hyphens.';
    }

    if (!postName || !postName.trim()) {
      newErrors.postName = 'Job Post Name (Name of Exam) is required.';
    }

    if (!downUrl || !downUrl.trim()) {
      newErrors.downUrl = 'Result Download URL is required.';
    }

    const strippedDown = (downloadInstructions || '').replace(/<[^>]*>/g, '').trim();
    if (!downloadInstructions || !downloadInstructions.trim() || strippedDown === '') {
      newErrors.downloadInstructions = 'Download Instructions are required.';
    }

    const strippedImpl = (importantInstructions || '').replace(/<[^>]*>/g, '').trim();
    if (!importantInstructions || !importantInstructions.trim() || strippedImpl === '') {
      newErrors.importantInstructions = 'Important Instructions are required.';
    }

    if (!metaTitle || !metaTitle.trim()) {
      newErrors.metaTitle = 'SEO Meta Title is required.';
    }

    if (!metaDescription || !metaDescription.trim()) {
      newErrors.metaDescription = 'SEO Meta Description is required.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstField = Object.keys(newErrors)[0];
      scrollToField(firstField);
      return false;
    }
    return true;
  };

  // Primary Fields
  const isAuthor = session?.user?.role?.toLowerCase() === 'author' || session?.user?.role?.toLowerCase() === 'writer';
  const [actualId, setActualId] = useState(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(Boolean(slugOrId));
  const [status, setStatus] = useState('publish');

  // Sync default status for author
  useEffect(() => {
    if (isAuthor && status === 'publish') {
      setStatus('pending');
    }
  }, [isAuthor, status]);

  // Result Specific Form Fields
  const [postName, setPostName] = useState('');
  const [deptName, setDeptName] = useState('');
  const [desigName, setDesigName] = useState('');
  const [resultStatus, setResultStatus] = useState('Declared / Out');
  const [examDate, setExamDate] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [downUrl, setDownUrl] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [jobUrl, setJobUrl] = useState('');

  // Rich Text Editors
  const [description, setDescription] = useState('');
  const [downloadInstructions, setDownloadInstructions] = useState('');
  const [importantInstructions, setImportantInstructions] = useState('');
  const [faqContent, setFaqContent] = useState('');

  // Right Sidebar State
  const [featuredMedia, setFeaturedMedia] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('— Please Choose —');
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [selectedState, setSelectedState] = useState('-- All India --');

  // Dynamic Lists loaded from Database
  const [departmentList, setDepartmentList] = useState([]);
  const [countryList, setCountryList] = useState([]);
  const [stateList, setStateList] = useState([]);

  // SEO Fields (Right Sidebar)
  const [allowIndexing, setAllowIndexing] = useState(true);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // Accordion Toggles
  const [collapsePublish, setCollapsePublish] = useState(false);
  const [collapseSEO, setCollapseSEO] = useState(false);
  const [collapseFeatured, setCollapseFeatured] = useState(false);
  const [collapseDepartment, setCollapseDepartment] = useState(false);
  const [collapseCountry, setCollapseCountry] = useState(false);
  const [collapseState, setCollapseState] = useState(false);

  // Media Library Modal
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaModalTarget, setMediaModalTarget] = useState('featured');

  // Status & Notifications
  const [fetchingResult, setFetchingResult] = useState(Boolean(slugOrId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  // Fetch Departments, Countries, and States
  useEffect(() => {
    fetch(`${BACKEND_URL}/apis/v1/departments?all=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setDepartmentList(data.data);
        }
      })
      .catch((err) => console.error('Failed to load departments:', err));

    fetch(`${BACKEND_URL}/apis/v1/countries?all=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setCountryList(data.data);
        }
      })
      .catch((err) => console.error('Failed to load countries:', err));

    fetch(`${BACKEND_URL}/apis/v1/states`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setStateList(data.data);
        }
      })
      .catch((err) => console.error('Failed to load states:', err));
  }, []);

  // Fetch Result Post if Editing
  useEffect(() => {
    if (slugOrId) {
      const fetchResultData = async () => {
        try {
          setFetchingResult(true);
          const endpoint = `${BACKEND_URL}/apis/v1/results/${slugOrId}`;
          const res = await fetch(endpoint);
          const data = await res.json();
          if (data.success && data.data) {
            const r = data.data;
            setActualId(r._id);
            setTitle(r.title || '');
            setSlug(r.slug || slugOrId || '');
            setIsCustomSlug(true);
            const loadedStatus =
              r.status === 'publish' || r.status === 'published' || r.status === 'active'
                ? 'publish'
                : r.status || 'draft';
            setStatus(isAuthor && loadedStatus === 'publish' ? 'pending' : loadedStatus);

            // Form Fields
            setPostName(r.post || r.title || '');
            setDeptName(r.dept || (typeof r.department === 'string' ? r.department : r.department?.name) || '');
            setDesigName(r.desig || '');
            setResultStatus(r.result_status || 'Declared / Out');
            setExamDate(formatInputDate(r.exam_date));
            setReleaseDate(formatInputDate(r.result_date || r.exam_rdate));
            setDownUrl(r.down_url || '');
            setSiteUrl(r.site_url || '');
            setJobUrl(r.job_url || '');

            // Rich Text Content
            setDescription(r.description || '');
            setDownloadInstructions(r.inst_down || '');
            setImportantInstructions(r.inst_impl || '');
            setFaqContent(r.faq_content || r.faqs || '');

            // SEO Metadata
            setMetaTitle(r.metadata?.m_title || r.title || '');
            setMetaDescription(r.metadata?.m_desc || '');
            setAllowIndexing(r.metadata?.robots !== 0);

            // Featured Media
            if (r.featured_media) {
              setFeaturedMedia(r.featured_media);
            }

            // Department, Country & State Dropdowns
            if (r.department) {
              setSelectedDepartment(typeof r.department === 'object' ? r.department.name : r.department);
            } else if (r.dept) {
              setSelectedDepartment(r.dept);
            }

            if (r.country) {
              setSelectedCountry(typeof r.country === 'object' ? r.country.name : r.country);
            }

            if (r.state) {
              setSelectedState(typeof r.state === 'object' ? r.state.name : r.state);
            }
          }
        } catch (err) {
          console.error('Failed to load result post:', err);
        } finally {
          setFetchingResult(false);
        }
      };
      fetchResultData();
    } else {
      setFetchingResult(false);
    }
  }, [slugOrId]);

  // Handle Media Selection
  const handleMediaSelected = (mediaItem) => {
    setFeaturedMedia(mediaItem);
  };

  // Form Submission
  const handleSave = async (submitStatus = status) => {
    if (!validateForm()) {
      showToast('Please resolve highlighted errors before saving.', 'error');
      return;
    }

    // Coerce status for authors
    let finalStatus = submitStatus;
    if (isAuthor && (finalStatus === 'publish' || finalStatus === 'published' || finalStatus === 'active')) {
      finalStatus = 'pending';
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        status: finalStatus,
        post: postName || title.trim(),
        dept: deptName,
        desig: desigName,
        result_status: resultStatus,
        exam_date: examDate,
        exam_rdate: releaseDate,
        result_date: releaseDate,
        down_url: downUrl,
        site_url: siteUrl,
        job_url: jobUrl,
        description,
        inst_down: downloadInstructions,
        inst_impl: importantInstructions,
        faq_content: faqContent,
        featured_media: featuredMedia?._id || undefined,
        department: selectedDepartment === '— Please Choose —' ? null : selectedDepartment,
        country: selectedCountry || 'India',
        state: selectedState === '-- All India --' ? null : selectedState,
        metadata: {
          m_title: metaTitle || title,
          m_desc: metaDescription,
          robots: allowIndexing ? 1 : 0,
        },
        ...(isEditing ? {} : { author: session?.user?.id || undefined }),
      };

      const endpoint = targetId
        ? `${BACKEND_URL}/apis/v1/results/${targetId}`
        : `${BACKEND_URL}/apis/v1/results`;

      const method = targetId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setErrors({});
        showToast(`Result post ${targetId ? 'updated' : 'created'} successfully!`, 'success');
        setTimeout(() => router.push('/edu-admin/results'), 1200);
      } else {
        const serverErrors = data.errors || {};
        if (Object.keys(serverErrors).length > 0) {
          setErrors(serverErrors);
          const firstField = Object.keys(serverErrors)[0];
          scrollToField(firstField);
          showToast(data.message || 'Please fix the highlighted errors.', 'error');
        } else {
          showToast(data.message || 'Failed to save result. Please try again.', 'error');
        }
      }
    } catch (err) {
      showToast(err.message || 'An error occurred while saving.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3.5 w-full select-none font-sans text-slate-800">
      {/* Toast Alert */}
      {toast.message && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded shadow-xl text-xs font-semibold flex items-center gap-2 border animate-in slide-in-from-top-2 ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header: Back Button + Add a New Job Result / Edit */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push('/edu-admin/results')}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-medium shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-normal text-slate-900 tracking-tight">
            {isEdit || slugOrId ? 'Edit Job Result' : 'Add a New Job Result'}
          </h1>
        </div>
      </div>

      {/* If Fetching Result Data */}
      {fetchingResult ? (
        <div className="bg-white border border-slate-300 rounded p-12 shadow-2xs">
          <AdminLoader
            text="Loading Job Result Post Details..."
            subtext="Retrieving examination dates, merit lists, and result links"
          />
        </div>
      ) : (
        /* Main Grid: Left Form (70-75%) + Right Sidebar Panels (25-30%) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* Left Column (8.5 cols) */}
          <div className="lg:col-span-8 space-y-3.5">
            {/* Top Title Input */}
            <div className="space-y-1">
              <div
                ref={titleRef}
                className={`bg-white border rounded shadow-2xs transition-all duration-200 ${
                  errors.title
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                    : 'border-slate-300 focus-within:border-[#2271b1]'
                }`}
              >
                <input
                  type="text"
                  required
                  placeholder="Enter Result Post Title Here"
                  value={title}
                  onChange={(e) => {
                    clearError('title');
                    const newTitle = e.target.value;
                    setTitle(newTitle);
                    if (!metaTitle) setMetaTitle(newTitle);
                    if (!isCustomSlug) {
                      const autoSlug = newTitle
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '');
                      setSlug(autoSlug);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-transparent text-base font-semibold text-slate-900 placeholder-slate-400 focus:outline-none rounded"
                />
              </div>
              {errors.title && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium px-1 animate-in fade-in-50">
                  <AlertCircle size={13} className="shrink-0 text-rose-500" />
                  <span>{errors.title}</span>
                </div>
              )}
            </div>

            {/* Permalink / URL Slug Input Box */}
            <div className="space-y-1">
              <div
                ref={slugRef}
                className={`bg-white border rounded px-3.5 py-2 flex flex-wrap items-center gap-2 text-xs shadow-2xs transition-all duration-200 ${
                  errors.slug
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                    : 'border-slate-300'
                }`}
              >
                <span className="font-semibold text-slate-700 shrink-0">Permalink:</span>
                <span className="text-slate-400 font-mono select-all shrink-0 hidden sm:inline">
                  https://educationmasters.in/result/
                </span>
                <div className="flex-1 min-w-[200px] flex items-center gap-1.5">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      clearError('slug');
                      setIsCustomSlug(true);
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9\-]/g, '-')
                          .replace(/-+/g, '-')
                      );
                    }}
                    placeholder="custom-result-slug"
                    className="w-full px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-[#2271b1] shadow-2xs"
                  />
                  {slug && (
                    <button
                      type="button"
                      onClick={() => window.open(`/result/${slug}`, '_blank')}
                      className="text-xs text-[#2271b1] hover:text-[#135e96] font-semibold hover:underline flex items-center gap-1 shrink-0 px-1 cursor-pointer"
                      title="View Live Result Page"
                    >
                      <span>View</span>
                      <ExternalLink size={12} />
                    </button>
                  )}
                </div>
              </div>
              {errors.slug && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium px-1 animate-in fade-in-50">
                  <AlertCircle size={13} className="shrink-0 text-rose-500" />
                  <span>{errors.slug}</span>
                </div>
              )}
            </div>

            {/* Result Key Fields Container */}
            <div className="bg-white border border-slate-300 rounded p-4 shadow-2xs space-y-3.5">
              {/* Row 1: Job Post Name & Department Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Job Post Name (Name of Exam) <span className="text-rose-500">*</span>
                  </label>
                  <div ref={postNameRef}>
                    <input
                      type="text"
                      value={postName}
                      onChange={(e) => {
                        clearError('postName');
                        setPostName(e.target.value);
                      }}
                      placeholder="Enter the name of result posts/examination"
                      className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-200 ${
                        errors.postName
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                          : 'border-slate-300 focus:border-[#2271b1]'
                      }`}
                    />
                  </div>
                  {errors.postName && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-1 animate-in fade-in-50">
                      <AlertCircle size={13} className="shrink-0 text-rose-500" />
                      <span>{errors.postName}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department Name
                  </label>
                  <input
                    type="text"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    placeholder="Enter the name of Department"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2271b1]"
                  />
                </div>
              </div>

              {/* Row 2: Post Name (Designation) & Result Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Post Name (Designation)
                  </label>
                  <input
                    type="text"
                    value={desigName}
                    onChange={(e) => setDesigName(e.target.value)}
                    placeholder="Enter the designation"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2271b1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Result Status
                  </label>
                  <select
                    value={resultStatus}
                    onChange={(e) => setResultStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                  >
                    {RESULT_STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Result Examination Date & Result Release Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Result Examination Date
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Result Release Date
                  </label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                  />
                </div>
              </div>

              {/* Row 4: Result Download URL & Official Website URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Result Download URL <span className="text-rose-500">*</span>
                  </label>
                  <div ref={downUrlRef}>
                    <input
                      type="text"
                      value={downUrl}
                      onChange={(e) => {
                        clearError('downUrl');
                        setDownUrl(e.target.value);
                      }}
                      placeholder="Enter the result download URL"
                      className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-200 ${
                        errors.downUrl
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                          : 'border-slate-300 focus:border-[#2271b1]'
                      }`}
                    />
                  </div>
                  {errors.downUrl && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-1 animate-in fade-in-50">
                      <AlertCircle size={13} className="shrink-0 text-rose-500" />
                      <span>{errors.downUrl}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Website URL
                  </label>
                  <input
                    type="text"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    placeholder="Enter the official website URL"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2271b1]"
                  />
                </div>
              </div>

              {/* Row 5: Linked Job Post URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Job Post URL to which this Result Post is linked
                </label>
                <input
                  type="text"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="Enter the Job Post URL"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2271b1]"
                />
              </div>
            </div>

            {/* 1. Full-Width Description Rich Text Editor */}
            <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden">
              <div className="bg-[#f6f7f7] border-b border-slate-300 px-3.5 py-2">
                <h3 className="text-xs font-bold text-slate-800">Description</h3>
              </div>
              <div className="p-0.5 bg-white">
                <JoditEditorWrapper
                  value={description}
                  onChange={(newVal) => setDescription(newVal)}
                  height={220}
                  placeholder="Enter full result details, examination overview, and summary..."
                />
              </div>
            </div>

            {/* 2. Side-by-Side Rich Text Editors (Download Instructions & Important Instructions) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Left: Download Instructions */}
              <div className="space-y-1">
                <div
                  ref={downloadInstructionsRef}
                  className={`bg-white border rounded shadow-2xs overflow-hidden transition-all duration-200 ${
                    errors.downloadInstructions
                      ? 'border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-300'
                  }`}
                >
                  <div className="bg-[#f6f7f7] border-b border-slate-300 px-3 py-2 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800">
                      Download Instructions <span className="text-rose-500">*</span>
                    </h3>
                    {errors.downloadInstructions && (
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                        Required
                      </span>
                    )}
                  </div>
                  <div className="p-0.5 bg-white">
                    <JoditEditorWrapper
                      value={downloadInstructions}
                      onChange={(newVal) => {
                        clearError('downloadInstructions');
                        setDownloadInstructions(newVal);
                      }}
                      height={240}
                      placeholder="Enter step-by-step instructions to check / download the result..."
                    />
                  </div>
                </div>
                {errors.downloadInstructions && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium px-1 animate-in fade-in-50">
                    <AlertCircle size={13} className="shrink-0 text-rose-500" />
                    <span>{errors.downloadInstructions}</span>
                  </div>
                )}
              </div>

              {/* Right: Important Instructions */}
              <div className="space-y-1">
                <div
                  ref={importantInstructionsRef}
                  className={`bg-white border rounded shadow-2xs overflow-hidden transition-all duration-200 ${
                    errors.importantInstructions
                      ? 'border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-300'
                  }`}
                >
                  <div className="bg-[#f6f7f7] border-b border-slate-300 px-3 py-2 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800">
                      Important Instructions <span className="text-rose-500">*</span>
                    </h3>
                    {errors.importantInstructions && (
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                        Required
                      </span>
                    )}
                  </div>
                  <div className="p-0.5 bg-white">
                    <JoditEditorWrapper
                      value={importantInstructions}
                      onChange={(newVal) => {
                        clearError('importantInstructions');
                        setImportantInstructions(newVal);
                      }}
                      height={240}
                      placeholder="Enter cut-off details, tie-breaking rules, merit selection guidelines..."
                    />
                  </div>
                </div>
                {errors.importantInstructions && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium px-1 animate-in fade-in-50">
                    <AlertCircle size={13} className="shrink-0 text-rose-500" />
                    <span>{errors.importantInstructions}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Full-Width FAQ Section Rich Text Editor */}
            <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden">
              <div className="bg-[#f6f7f7] border-b border-slate-300 px-3.5 py-2">
                <h3 className="text-xs font-bold text-slate-800">FAQ Section</h3>
              </div>
              <div className="p-0.5 bg-white">
                <JoditEditorWrapper
                  value={faqContent}
                  onChange={(newVal) => setFaqContent(newVal)}
                  height={220}
                  placeholder="Enter Frequently Asked Questions and answers about this result..."
                />
              </div>
            </div>
          </div>

          {/* Right Column / Sidebar (3.5 - 4 cols) */}
          <div className="lg:col-span-4 space-y-3.5">
            {/* Panel 1: Publish Box */}
            <div className="bg-white border border-slate-300 rounded shadow-2xs">
              <div
                onClick={() => setCollapsePublish(!collapsePublish)}
                className="px-3.5 py-2 bg-[#f6f7f7] border-b border-slate-300 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <span className="text-xs font-bold text-slate-800">Publish</span>
                {collapsePublish ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </div>

              {!collapsePublish && (
                <div className="p-3.5 space-y-3 bg-white">
                  {/* Save Draft & Preview */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSave('draft')}
                      disabled={isSubmitting}
                      className="px-3 py-1 bg-white hover:bg-slate-50 text-[#2271b1] border border-[#2271b1] rounded text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (slugOrId || actualId) {
                          window.open(`/result/${slug || slugOrId}`, '_blank');
                        } else {
                          showToast('Preview available after saving');
                        }
                      }}
                      className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-normal transition-colors shadow-2xs cursor-pointer"
                    >
                      Preview
                    </button>
                  </div>

                  {/* Status selector */}
                  <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-200 pt-2">
                    <span>📌 Status:</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:border-[#2271b1]"
                    >
                      {!isAuthor && <option value="publish">Published</option>}
                      <option value="pending">Pending Review</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  {/* Submit / Publish Button */}
                  <div className="border-t border-slate-200 pt-2.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSave(status)}
                      disabled={isSubmitting}
                      className="w-full py-2 bg-[#28a745] hover:bg-[#218838] text-white rounded text-xs font-bold transition-all shadow-2xs active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      <span>
                        {isSubmitting
                          ? 'Saving Result Post...'
                          : isAuthor
                          ? status === 'draft'
                            ? 'Save Draft'
                            : 'Submit for Review'
                          : isEdit || slugOrId
                          ? 'Update Result Post'
                          : status === 'draft'
                          ? 'Save Draft'
                          : 'Publish Result Post'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Panel 2: SEO Settings (Right Side, Beautiful & Clean, No Meta Keywords) */}
            <div
              className={`bg-white border rounded shadow-2xs transition-all duration-200 ${
                errors.metaTitle || errors.metaDescription
                  ? 'border-rose-400 ring-1 ring-rose-400/30'
                  : 'border-slate-300'
              }`}
            >
              <div
                onClick={() => setCollapseSEO(!collapseSEO)}
                className="px-3.5 py-2.5 bg-[#f6f7f7] border-b border-slate-300 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Globe size={14} className="text-[#2271b1]" />
                  <span className="text-xs font-bold text-slate-800">SEO Settings</span>
                  {(errors.metaTitle || errors.metaDescription) && (
                    <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-rose-200">
                      <AlertCircle size={10} />
                      Missing
                    </span>
                  )}
                </div>
                <button type="button" className="text-slate-600 hover:text-slate-900">
                  {collapseSEO ? <Plus size={14} /> : <Minus size={14} />}
                </button>
              </div>

              {!collapseSEO && (
                <div className="p-3.5 space-y-3.5 bg-white text-xs">
                  {/* Google SERP Live Snippet Preview */}
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                        <Sparkles size={11} className="text-amber-500" />
                        <span>Google Search Preview</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate font-mono">
                      https://educationmasters.in/result/{slug || 'result-slug'}
                    </div>
                    <div className="text-xs font-medium text-[#1a0dab] line-clamp-1 hover:underline cursor-pointer">
                      {metaTitle || title || 'Post Title will appear here | Education Masters'}
                    </div>
                    <div className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {metaDescription || 'Meta description preview will be displayed here as it appears on Google search results...'}
                    </div>
                  </div>

                  {/* Allow Indexing */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-700 font-medium">Search Engine Indexing:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowIndexing}
                        onChange={(e) => setAllowIndexing(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#2271b1]"></div>
                      <span className="ml-1.5 text-2xs font-semibold text-slate-600">
                        {allowIndexing ? 'Index' : 'Noindex'}
                      </span>
                    </label>
                  </div>

                  {/* Meta Title */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-700">
                        Meta Title <span className="text-rose-500">*</span>
                      </label>
                      <span
                        className={`text-[10px] font-mono ${
                          metaTitle.length >= 40 && metaTitle.length <= 60
                            ? 'text-emerald-600 font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        {metaTitle.length}/60
                      </span>
                    </div>
                    <div ref={metaTitleRef}>
                      <input
                        type="text"
                        value={metaTitle}
                        onChange={(e) => {
                          clearError('metaTitle');
                          setMetaTitle(e.target.value);
                        }}
                        placeholder="Enter SEO Meta Title"
                        className={`w-full px-2.5 py-1.5 bg-white border rounded text-xs text-slate-800 focus:outline-none transition-all duration-200 ${
                          errors.metaTitle
                            ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                            : 'border-slate-300 focus:border-[#2271b1]'
                        }`}
                      />
                    </div>
                    {errors.metaTitle && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-1 animate-in fade-in-50">
                        <AlertCircle size={13} className="shrink-0 text-rose-500" />
                        <span>{errors.metaTitle}</span>
                      </div>
                    )}
                  </div>

                  {/* Meta Description */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-700">
                        Meta Description <span className="text-rose-500">*</span>
                      </label>
                      <span
                        className={`text-[10px] font-mono ${
                          metaDescription.length >= 120 && metaDescription.length <= 160
                            ? 'text-emerald-600 font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        {metaDescription.length}/160
                      </span>
                    </div>
                    <div ref={metaDescriptionRef}>
                      <textarea
                        rows={3}
                        value={metaDescription}
                        onChange={(e) => {
                          clearError('metaDescription');
                          setMetaDescription(e.target.value);
                        }}
                        placeholder="Enter SEO Meta Description snippet..."
                        className={`w-full px-2.5 py-1.5 bg-white border rounded text-xs text-slate-800 focus:outline-none resize-y transition-all duration-200 ${
                          errors.metaDescription
                            ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                            : 'border-slate-300 focus:border-[#2271b1]'
                        }`}
                      />
                    </div>
                    {errors.metaDescription && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-1 animate-in fade-in-50">
                        <AlertCircle size={13} className="shrink-0 text-rose-500" />
                        <span>{errors.metaDescription}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Panel 3: Featured Image */}
            <div className="bg-white border border-slate-300 rounded shadow-2xs">
              <div
                onClick={() => setCollapseFeatured(!collapseFeatured)}
                className="px-3.5 py-2 bg-[#f6f7f7] border-b border-slate-300 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <span className="text-xs font-bold text-slate-800">Featured Image</span>
                {collapseFeatured ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </div>

              {!collapseFeatured && (
                <div className="p-3 bg-white">
                  {featuredMedia ? (
                    <div className="space-y-2">
                      <div className="w-full h-32 rounded bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative shadow-2xs">
                        <img
                          src={getImageUrl(featuredMedia)}
                          alt="Featured"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFeaturedMedia(null)}
                        className="text-xs text-rose-600 hover:text-rose-800 hover:underline block cursor-pointer"
                      >
                        Remove featured image
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setMediaModalTarget('featured');
                        setShowMediaModal(true);
                      }}
                      className="text-xs text-[#2271b1] hover:text-[#135e96] hover:underline cursor-pointer"
                    >
                      Set Featured Image
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Panel 4: Department */}
            <SearchableSelectPanel
              title="Department"
              endpoint="/apis/v1/departments"
              selectedValue={selectedDepartment}
              onSelect={(val) => {
                setSelectedDepartment(val);
                if (val !== '— Please Choose —' && !deptName) {
                  setDeptName(val);
                }
              }}
              defaultOption={{ label: '— Please Choose —', value: '— Please Choose —' }}
              emptyMessage="No departments found"
            />

            {/* Panel 5: Country */}
            <SearchableSelectPanel
              title="Country"
              endpoint="/apis/v1/countries"
              selectedValue={selectedCountry}
              onSelect={(val) => {
                setSelectedCountry(val);
                setSelectedState(val === 'India' ? '-- All India --' : `-- All ${val} --`);
              }}
              defaultOption={{ label: 'India', value: 'India' }}
              emptyMessage="No countries found"
            />

            {/* Panel 6: State */}
            <SearchableSelectPanel
              title="State"
              endpoint="/apis/v1/states"
              selectedValue={selectedState}
              onSelect={(val) => setSelectedState(val)}
              defaultOption={{
                label: selectedCountry === 'India' ? '— All India —' : `— All ${selectedCountry || 'Country'} —`,
                value: selectedCountry === 'India' ? '-- All India --' : `-- All ${selectedCountry || 'Country'} --`,
              }}
              extraParams={{ country: selectedCountry }}
              dependency={selectedCountry}
              emptyMessage={`No states found for ${selectedCountry || 'selected country'}`}
            />
          </div>
        </div>
      )}

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSelect={handleMediaSelected}
        targetType={mediaModalTarget}
      />
    </div>
  );
}
