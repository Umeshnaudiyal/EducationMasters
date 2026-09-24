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
} from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import JoditEditorWrapper from '@/components/admin/JoditEditorWrapper';
import MediaLibraryModal from '@/components/admin/MediaLibraryModal';
import AdminLoader from '@/components/admin/AdminLoader';
import SearchableSelectPanel from '@/components/admin/SearchableSelectPanel';
import { getAuthToken } from '@/utils/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

const EXAM_MODES = [
  'Select Mode of Exam',
  'Online Examination (CBT)',
  'Offline Examination (OMR/Written)',
  'Computer Based Test (CBT)',
  'Written Examination',
  'Interview / Viva-Voce',
  'Physical Standard Test (PST) / PET',
  'Typing / Skill / Trade Test',
  'Combined Examination',
];

export default function AdmitCardEditorForm({ slugOrId = null, isEdit = false }) {
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

  // Client-side Form Validation
  const validateForm = () => {
    const newErrors = {};

    if (!title || !title.trim()) {
      newErrors.title = 'Admit Card post title is required. Please enter a title.';
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
      newErrors.downUrl = 'Admit Card Download URL is required.';
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

  // Form Fields (Matching Admit Card Reference Screenshot)
  const [postName, setPostName] = useState(''); // Job Post Name (Name of Exam)
  const [deptName, setDeptName] = useState(''); // Department Name (text)
  const [desigName, setDesigName] = useState(''); // Post Name (Designation)
  const [releaseDate, setReleaseDate] = useState(''); // Release Date
  const [examDate, setExamDate] = useState(''); // Job Examination Date
  const [examTime, setExamTime] = useState(''); // Examination Time
  const [examMode, setExamMode] = useState('Select Mode of Exam'); // Examination Mode
  const [downUrl, setDownUrl] = useState(''); // Admit Card Download URL
  const [siteUrl, setSiteUrl] = useState(''); // Official Website URL
  const [syllabusUrl, setSyllabusUrl] = useState(''); // Syllabus URL
  const [prevqpUrl, setPrevqpUrl] = useState(''); // Previous Year Question Paper URL
  const [jobUrl, setJobUrl] = useState(''); // Job Post URL to which this Admit Card is linked

  // Rich Text Editors (3 Dedicated Editors)
  const [jobDescription, setJobDescription] = useState(''); // Full Width Job Description
  const [downloadInstructions, setDownloadInstructions] = useState(''); // Download Instructions (Left)
  const [importantInstructions, setImportantInstructions] = useState(''); // Important Instructions (Right)

  // Right Sidebar State
  const [featuredMedia, setFeaturedMedia] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('— Please Choose —');
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [selectedState, setSelectedState] = useState('-- All India --');

  // Dynamic Lists loaded from Database
  const [departmentList, setDepartmentList] = useState([]);
  const [countryList, setCountryList] = useState([]);
  const [stateList, setStateList] = useState([]);

  // SEO Fields
  const [allowIndexing, setAllowIndexing] = useState(true);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // Accordion Toggles
  const [collapseSEO, setCollapseSEO] = useState(false);
  const [collapsePublish, setCollapsePublish] = useState(false);
  const [collapseFeatured, setCollapseFeatured] = useState(false);
  const [collapseDepartment, setCollapseDepartment] = useState(false);
  const [collapseCountry, setCollapseCountry] = useState(false);
  const [collapseState, setCollapseState] = useState(false);

  // Media Library Modal
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaModalTarget, setMediaModalTarget] = useState('featured');

  // Status & Notifications
  const [fetchingAdmitCard, setFetchingAdmitCard] = useState(Boolean(slugOrId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  // Helper date formatter for HTML date inputs (YYYY-MM-DD)
  const formatInputDate = (d) => {
    if (!d) return '';
    if (d.includes('T')) return d.split('T')[0];
    if (d.includes(' ')) return d.split(' ')[0];
    return d;
  };

  // 1. Fetch Dynamic Departments, Countries, and States
  useEffect(() => {
    fetch(`${BACKEND_URL}/apis/v1/departments`)
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

  // 2. Fetch Admit Card Data if Editing
  useEffect(() => {
    if (slugOrId) {
      const fetchAdmitCardData = async () => {
        try {
          setFetchingAdmitCard(true);
          const endpoint = `${BACKEND_URL}/apis/v1/admit-cards/${slugOrId}`;
          const res = await fetch(endpoint);
          const data = await res.json();
          if (data.success && data.data) {
            const a = data.data;
            setActualId(a._id);
            setTitle(a.title || '');
            setSlug(a.slug || slugOrId || '');
            setIsCustomSlug(true);
            const loadedStatus =
              a.status === 'publish' || a.status === 'published' || a.status === 'active'
                ? 'publish'
                : a.status || 'draft';
            setStatus(isAuthor && loadedStatus === 'publish' ? 'pending' : loadedStatus);

            // Form Fields
            setPostName(a.post || a.title || '');
            setDeptName(a.dept || (typeof a.department === 'string' ? a.department : a.department?.name) || '');
            setDesigName(a.desig || '');
            setReleaseDate(formatInputDate(a.exam_rdate));
            setExamDate(formatInputDate(a.exam_date));
            setExamTime(a.exam_time || '');
            setExamMode(a.exam_mode || 'Select Mode of Exam');
            setDownUrl(a.down_url || '');
            setSiteUrl(a.site_url || '');
            setSyllabusUrl(a.syllabus_url || '');
            setPrevqpUrl(a.prevqp_url || '');
            setJobUrl(a.job_url || '');

            // Rich Text Editors
            setJobDescription(a.description || '');
            setDownloadInstructions(a.inst_down || '');
            setImportantInstructions(a.inst_impl || '');

            // SEO Metadata
            setMetaTitle(a.metadata?.m_title || a.title || '');
            setMetaKeywords(a.metadata?.m_keys || '');
            setMetaDescription(a.metadata?.m_desc || '');
            setAllowIndexing(a.metadata?.robots !== 0);

            // Featured Media
            if (a.featured_media) {
              setFeaturedMedia(a.featured_media);
            }

            // Department, Country & State Dropdowns
            if (a.department) {
              setSelectedDepartment(typeof a.department === 'object' ? a.department.name : a.department);
            } else if (a.dept) {
              setSelectedDepartment(a.dept);
            }

            if (a.country) {
              setSelectedCountry(typeof a.country === 'object' ? a.country.name : a.country);
            }

            if (a.state) {
              setSelectedState(typeof a.state === 'object' ? a.state.name : a.state);
            }
          }
        } catch (err) {
          console.error('Failed to load admit card:', err);
        } finally {
          setFetchingAdmitCard(false);
        }
      };
      fetchAdmitCardData();
    } else {
      setFetchingAdmitCard(false);
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
      const targetId = actualId || slugOrId;
      const isEditing = Boolean(targetId || isEdit);

      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        status: finalStatus,
        post: postName || title.trim(),
        dept: deptName,
        desig: desigName,
        exam_rdate: releaseDate,
        exam_date: examDate,
        exam_time: examTime,
        exam_mode: examMode === 'Select Mode of Exam' ? null : examMode,
        down_url: downUrl,
        site_url: siteUrl,
        syllabus_url: syllabusUrl,
        prevqp_url: prevqpUrl,
        job_url: jobUrl,
        description: jobDescription,
        inst_down: downloadInstructions,
        inst_impl: importantInstructions,
        featured_media: featuredMedia?._id || undefined,
        department: selectedDepartment === '— Please Choose —' ? null : selectedDepartment,
        country: selectedCountry || 'India',
        state: selectedState === '-- All India --' ? null : selectedState,
        metadata: {
          m_title: metaTitle || title,
          m_keys: metaKeywords,
          m_desc: metaDescription,
          robots: allowIndexing ? 1 : 0,
        },
        ...(isEditing ? {} : { author: session?.user?.id || undefined }),
      };

      const endpoint = targetId
        ? `${BACKEND_URL}/apis/v1/admit-cards/${targetId}`
        : `${BACKEND_URL}/apis/v1/admit-cards`;

      const method = targetId ? 'PUT' : 'POST';
      const token = getAuthToken(session);

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setErrors({});
        showToast(`Admit Card ${targetId ? 'updated' : 'created'} successfully!`, 'success');
        setTimeout(() => router.push('/edu-admin/admit-cards'), 1200);
      } else {
        const serverErrors = data.errors || {};
        if (Object.keys(serverErrors).length > 0) {
          setErrors(serverErrors);
          const firstField = Object.keys(serverErrors)[0];
          scrollToField(firstField);
          showToast(data.message || 'Please fix the highlighted errors.', 'error');
        } else {
          showToast(data.message || 'Failed to save admit card. Please try again.', 'error');
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

      {/* Top Header: Back Button + Add a New Job Admit Card / Edit */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push('/edu-admin/admit-cards')}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-medium shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-normal text-slate-900 tracking-tight">
            {isEdit || slugOrId ? 'Edit Job Admit Card' : 'Add a New Job Admit Card'}
          </h1>
        </div>
      </div>

      {/* If Fetching Admit Card Data */}
      {fetchingAdmitCard ? (
        <div className="bg-white border border-slate-300 rounded p-12 shadow-2xs">
          <AdminLoader
            text="Loading Admit Card Post Details..."
            subtext="Retrieving examination dates, instructions, and download links"
          />
        </div>
      ) : (
        /* Main Grid: Left Form (75%) + Right Sidebar Panels (25%) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* Left Column (9 cols) */}
          <div className="lg:col-span-9 space-y-3.5">
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
                  placeholder="Enter Admit Card Post Title Here"
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
                  https://educationmasters.in/admit-card/
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
                    placeholder="custom-admit-card-slug"
                    className="w-full px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-[#2271b1] shadow-2xs"
                  />
                  {slug && (
                    <button
                      type="button"
                      onClick={() => window.open(`/admit-card/${slug}`, '_blank')}
                      className="text-xs text-[#2271b1] hover:text-[#135e96] font-semibold hover:underline flex items-center gap-1 shrink-0 px-1 cursor-pointer"
                      title="View Live Admit Card Page"
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

            {/* Admit Card Key Fields Container */}
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
                      placeholder="Enter the name of job posts/examination"
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

              {/* Row 2: Post Name (Designation) & Release Date */}
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
                    Release Date
                  </label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                  />
                </div>
              </div>

              {/* Row 3: Job Examination Date & Examination Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Job Examination Date
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
                    Examination Time
                  </label>
                  <input
                    type="time"
                    value={examTime}
                    onChange={(e) => setExamTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                  />
                </div>
              </div>

              {/* Row 4: Examination Mode & Admit Card Download URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Examination Mode
                  </label>
                  <select
                    value={examMode}
                    onChange={(e) => setExamMode(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                  >
                    {EXAM_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Admit Card Download URL <span className="text-rose-500">*</span>
                  </label>
                  <div ref={downUrlRef}>
                    <input
                      type="text"
                      value={downUrl}
                      onChange={(e) => {
                        clearError('downUrl');
                        setDownUrl(e.target.value);
                      }}
                      placeholder="Enter the Admit Card Download URL"
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
              </div>

              {/* Row 5: Official Website URL & Syllabus URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Syllabus URL
                  </label>
                  <input
                    type="text"
                    value={syllabusUrl}
                    onChange={(e) => setSyllabusUrl(e.target.value)}
                    placeholder="Enter the syllabus URL"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2271b1]"
                  />
                </div>
              </div>

              {/* Row 6: Previous Year Question Paper URL & Linked Job Post URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Previous Year Question Paper URL
                  </label>
                  <input
                    type="text"
                    value={prevqpUrl}
                    onChange={(e) => setPrevqpUrl(e.target.value)}
                    placeholder="Enter the previous year question paper URL"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2271b1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Job Post URL to which this Admit Card Post to be linked
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
            </div>

            {/* 1. Full-Width Job Description Rich Text Editor */}
            <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden">
              <div className="bg-[#f6f7f7] border-b border-slate-300 px-3.5 py-2">
                <h3 className="text-xs font-bold text-slate-800">Job Description</h3>
              </div>
              <div className="p-0.5 bg-white">
                <JoditEditorWrapper
                  value={jobDescription}
                  onChange={(newVal) => setJobDescription(newVal)}
                  height={220}
                  placeholder="Enter full job description, exam overview, and details..."
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
                      height={250}
                      placeholder="Enter step-by-step instructions to download the admit card..."
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
                      height={250}
                      placeholder="Enter examination day guidelines, mandatory documents, and exam hall rules..."
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

            {/* SEO Tags Section Accordion */}
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
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800">SEO Tags Section</h3>
                  {(errors.metaTitle || errors.metaDescription) && (
                    <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-rose-200">
                      <AlertCircle size={10} />
                      Required Fields Missing
                    </span>
                  )}
                </div>
                <button type="button" className="text-slate-600 hover:text-slate-900">
                  {collapseSEO ? <Plus size={14} /> : <Minus size={14} />}
                </button>
              </div>

              {!collapseSEO && (
                <div className="p-3.5 space-y-3 bg-white">
                  {/* Allow Indexing */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-700 font-medium">Allow Indexing:</span>
                    <input
                      type="checkbox"
                      checked={allowIndexing}
                      onChange={(e) => setAllowIndexing(e.target.checked)}
                      className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                    />
                  </div>

                  {/* Meta Title */}
                  <div>
                    <label className="block text-xs text-slate-700 mb-1 font-semibold">
                      Meta Title <span className="text-rose-500">*</span>
                    </label>
                    <div ref={metaTitleRef}>
                      <input
                        type="text"
                        value={metaTitle}
                        onChange={(e) => {
                          clearError('metaTitle');
                          setMetaTitle(e.target.value);
                        }}
                        placeholder="Enter SEO Meta Title"
                        className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 focus:outline-none transition-all duration-200 ${
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

                  {/* Meta Keywords */}
                  <div>
                    <label className="block text-xs text-slate-700 mb-1 font-semibold">
                      Meta Keywords
                    </label>
                    <input
                      type="text"
                      value={metaKeywords}
                      onChange={(e) => setMetaKeywords(e.target.value)}
                      placeholder="e.g. admit card, hall ticket, exam date"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                    />
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="block text-xs text-slate-700 mb-1 font-semibold">
                      Meta Description <span className="text-rose-500">*</span>
                    </label>
                    <div ref={metaDescriptionRef}>
                      <textarea
                        rows={3}
                        value={metaDescription}
                        onChange={(e) => {
                          clearError('metaDescription');
                          setMetaDescription(e.target.value);
                        }}
                        placeholder="Enter SEO Meta Description"
                        className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 focus:outline-none resize-y transition-all duration-200 ${
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
          </div>

          {/* Right Sidebar Panels (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            {/* Panel 1: Publish */}
            <div className="bg-white border border-slate-300 rounded shadow-2xs">
              <div
                onClick={() => setCollapsePublish(!collapsePublish)}
                className="px-3.5 py-2 bg-[#f6f7f7] border-b border-slate-300 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <span className="text-xs font-bold text-slate-800">Publish</span>
                {collapsePublish ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </div>

              {!collapsePublish && (
                <div className="p-3 space-y-3 bg-white">
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
                          window.open(`/admit-card/${slug || slugOrId}`, '_blank');
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
                      className="px-4 py-1.5 bg-[#28a745] hover:bg-[#218838] text-white rounded text-xs font-bold transition-colors shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting
                        ? 'Submitting...'
                        : isAuthor
                        ? status === 'draft'
                          ? 'Save Draft'
                          : 'Submit for Review'
                        : isEdit || slugOrId
                        ? 'Update Admit Card'
                        : status === 'draft'
                        ? 'Save Draft'
                        : 'Publish Admit Card'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Panel 2: Featured Image */}
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

            {/* Panel 3: Department */}
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

            {/* Panel 4: Country */}
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

            {/* Panel 5: State */}
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
