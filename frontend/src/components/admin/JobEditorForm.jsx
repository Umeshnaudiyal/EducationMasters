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
  Loader2,
  Search,
  X,
  AlertCircle,
} from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import { cleanHtmlContent } from '@/utils/cleanHtml';
import JoditEditorWrapper from '@/components/admin/JoditEditorWrapper';
import MediaLibraryModal from '@/components/admin/MediaLibraryModal';
import AdminLoader from '@/components/admin/AdminLoader';
import SearchableSelectPanel from '@/components/admin/SearchableSelectPanel';
import { getAuthToken } from '@/utils/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export default function JobEditorForm({ slugOrId = null, isEdit = false }) {
  const router = useRouter();
  const { data: session } = useSession();

  // Input References for Smooth Scrolling on Validation Errors
  const titleRef = useRef(null);
  const slugRef = useRef(null);
  const postNameRef = useRef(null);
  const vacanciesRef = useRef(null);
  const appEndDateRef = useRef(null);
  const appUrlRef = useRef(null);
  const eligibilityRef = useRef(null);
  const applicationFeeRef = useRef(null);
  const payScaleRef = useRef(null);
  const descriptionRef = useRef(null);
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
    } else if (field === 'vacancies' && vacanciesRef.current) {
      vacanciesRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = vacanciesRef.current.querySelector('input') || vacanciesRef.current;
      input?.focus?.();
    } else if (field === 'appEndDate' && appEndDateRef.current) {
      appEndDateRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = appEndDateRef.current.querySelector('input') || appEndDateRef.current;
      input?.focus?.();
    } else if (field === 'appUrl' && appUrlRef.current) {
      appUrlRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = appUrlRef.current.querySelector('input') || appUrlRef.current;
      input?.focus?.();
    } else if (field === 'eligibility' && eligibilityRef.current) {
      eligibilityRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (field === 'applicationFee' && applicationFeeRef.current) {
      applicationFeeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (field === 'payScale' && payScaleRef.current) {
      payScaleRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (field === 'description' && descriptionRef.current) {
      descriptionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      newErrors.title = 'Job post title is required. Please enter a title.';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Job title must be at least 3 characters long.';
    }

    if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      newErrors.slug = 'Slug must only contain lowercase alphanumeric characters and single hyphens.';
    }

    if (!postName || !postName.trim()) {
      newErrors.postName = 'Job Post Name (Name of Exam) is required.';
    }

    if (!vacancies || !String(vacancies).trim()) {
      newErrors.vacancies = 'Number of Vacancies is required.';
    }

    if (!appEndDate || !appEndDate.trim()) {
      newErrors.appEndDate = 'Last Date of Application is required.';
    }

    if (!appUrl || !appUrl.trim()) {
      newErrors.appUrl = 'Job Application URL is required.';
    }

    const strippedEligibility = (eligibility || '').replace(/<[^>]*>/g, '').trim();
    if (!eligibility || !eligibility.trim() || strippedEligibility === '') {
      newErrors.eligibility = 'Eligibility Criteria is required.';
    }

    const strippedFee = (applicationFee || '').replace(/<[^>]*>/g, '').trim();
    if (!applicationFee || !applicationFee.trim() || strippedFee === '') {
      newErrors.applicationFee = 'Application Fee details are required.';
    }

    const strippedPay = (payScale || '').replace(/<[^>]*>/g, '').trim();
    if (!payScale || !payScale.trim() || strippedPay === '') {
      newErrors.payScale = 'Pay Scale (Salary Structure) is required.';
    }

    const strippedDesc = (jobDescription || '').replace(/<[^>]*>/g, '').trim();
    if (!jobDescription || !jobDescription.trim() || strippedDesc === '') {
      newErrors.description = 'Job Description content is required.';
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

  // Job Specific Form Fields (Matching Reference Screenshot)
  const [postName, setPostName] = useState(''); // Job Post Name (Name of Exam)
  const [deptName, setDeptName] = useState(''); // Department Name
  const [desigName, setDesigName] = useState(''); // Post Name (Designation)
  const [vacancies, setVacancies] = useState(''); // Number of Vacancies
  const [minAge, setMinAge] = useState(''); // Min Age
  const [maxAge, setMaxAge] = useState(''); // Max Age
  const [releasedDate, setReleasedDate] = useState(''); // Job Notification Released Date
  const [examDate, setExamDate] = useState(''); // Job Examination Date
  const [appStartDate, setAppStartDate] = useState(''); // Online Application Start Date
  const [appEndDate, setAppEndDate] = useState(''); // Last Date of Application
  const [appUrl, setAppUrl] = useState(''); // Job Application URL
  const [notiUrl, setNotiUrl] = useState(''); // Job Notification URL

  // Rich Text Editors
  const [eligibility, setEligibility] = useState(''); // Eligibility Criteria
  const [applicationFee, setApplicationFee] = useState(''); // Application Fee
  const [payScale, setPayScale] = useState(''); // Pay Scale (Salary Structure)
  const [jobDescription, setJobDescription] = useState(''); // Job Description

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
  const [fetchingJob, setFetchingJob] = useState(Boolean(slugOrId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  // Fetch Dynamic Stored Departments, Countries, and States
  useEffect(() => {
    // 1. Fetch Departments (all)
    fetch(`${BACKEND_URL}/apis/v1/departments?all=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setDepartmentList(data.data);
        }
      })
      .catch((err) => console.error('Failed to load departments:', err));

    // 2. Fetch Countries (all)
    fetch(`${BACKEND_URL}/apis/v1/countries?all=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setCountryList(data.data);
        }
      })
      .catch((err) => console.error('Failed to load countries:', err));

    // 3. Fetch States
    fetch(`${BACKEND_URL}/apis/v1/states`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setStateList(data.data);
        }
      })
      .catch((err) => console.error('Failed to load states:', err));
  }, []);

  // Fetch Job Data if Editing
  useEffect(() => {
    if (slugOrId) {
      const fetchJobData = async () => {
        try {
          setFetchingJob(true);
          const endpoint = `${BACKEND_URL}/apis/v1/jobs/${slugOrId}`;
          const res = await fetch(endpoint);
          const data = await res.json();
          if (data.success && data.data) {
            const j = data.data;
            setActualId(j._id);
            setTitle(j.title || '');
            setSlug(j.slug || slugOrId || '');
            setIsCustomSlug(true);
            setStatus(j.status === 'publish' || j.status === 'published' || j.status === 'active' ? 'publish' : j.status || 'draft');

            // Map Job Fields
            setPostName(j.post || j.name || j.title || '');
            setDeptName(j.dept || (typeof j.department === 'string' ? j.department : j.department?.name) || '');
            setDesigName(j.desig || '');
            setVacancies(j.posts || j.total_posts || '');
            setMinAge(j.min_age || j.age_limit?.min_age || '');
            setMaxAge(j.max_age || j.age_limit?.max_age || '');
            setReleasedDate(j.released || '');
            setExamDate(j.exam_date || j.dates?.exam_date || '');
            setAppStartDate(j.app_start || j.dates?.start_date || '');
            setAppEndDate(j.app_ends || j.dates?.last_date || '');
            setAppUrl(j.app_link || j.links?.down_url || '');
            setNotiUrl(j.noti_link || j.links?.site_url || '');

            // Rich Text Content (Eligibility, Application Fee, Pay Scale, Description)
            setEligibility(cleanHtmlContent(typeof j.eligibility === 'string' ? j.eligibility : ''));
            setApplicationFee(cleanHtmlContent(typeof j.fees === 'string' ? j.fees : (j.application_fee || j.fees?.fee_mode || '')));
            setPayScale(cleanHtmlContent(typeof j.salary === 'string' ? j.salary : (j.pay_scale || '')));
            setJobDescription(cleanHtmlContent(typeof j.description === 'string' ? j.description : (j.content || '')));

            // SEO Metadata
            setMetaTitle(j.metadata?.m_title || j.title || '');
            const loadedStatus = j.status === 'publish' || j.status === 'published' ? 'publish' : j.status || 'draft';
            setStatus(isAuthor && loadedStatus === 'publish' ? 'pending' : loadedStatus);
            setMetaKeywords(j.metadata?.m_keys || '');
            setMetaDescription(j.metadata?.m_desc || '');
            setAllowIndexing(j.metadata?.robots !== 0);

            // Featured Media
            if (j.featured_media) {
              setFeaturedMedia(j.featured_media);
            }

            // Department & State Dropdowns
            if (j.department) {
              setSelectedDepartment(typeof j.department === 'object' ? j.department.name : j.department);
            } else if (j.dept) {
              setSelectedDepartment(j.dept);
            }

            // Country & State Dropdowns
            if (j.country) {
              setSelectedCountry(typeof j.country === 'object' ? j.country.name : j.country);
            }
            if (j.state) {
              setSelectedState(typeof j.state === 'object' ? j.state.name : j.state);
            }
          }
        } catch (err) {
          console.error('Failed to load job data:', err);
          showToast('Failed to load job details', 'error');
        } finally {
          setFetchingJob(false);
        }
      };
      fetchJobData();
    } else {
      setFetchingJob(false);
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
    if (isAuthor && (finalStatus === 'publish' || finalStatus === 'published')) {
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
        dept: deptName || selectedDepartment,
        department: deptName || selectedDepartment,
        desig: desigName,
        posts: vacancies ? Number(vacancies) || vacancies : undefined,
        total_posts: vacancies,
        min_age: minAge ? Number(minAge) || minAge : undefined,
        max_age: maxAge ? Number(maxAge) || maxAge : undefined,
        released: releasedDate,
        exam_date: examDate,
        app_start: appStartDate,
        app_ends: appEndDate,
        app_link: appUrl,
        noti_link: notiUrl,
        eligibility,
        application_fee: applicationFee,
        fees: {
          fee_mode: applicationFee,
        },
        pay_scale: payScale,
        salary: payScale,
        description: jobDescription,
        dates: {
          start_date: appStartDate,
          last_date: appEndDate,
          exam_date: examDate,
        },
        links: {
          down_url: appUrl,
          site_url: notiUrl,
        },
        featured_media: featuredMedia?._id || undefined,
        image: featuredMedia?.file || featuredMedia?.url || undefined,
        metadata: {
          m_title: metaTitle || title,
          m_keys: metaKeywords,
          m_desc: metaDescription,
          robots: allowIndexing ? 1 : 0,
        },
        country: selectedCountry || 'India',
        state: selectedState === '-- All India --' ? null : selectedState,
        categories: ['Jobs'],
        ...(isEditing ? {} : { author: session?.user?.id || undefined }),
      };

      const endpoint = targetId
        ? `${BACKEND_URL}/apis/v1/jobs/${targetId}`
        : `${BACKEND_URL}/apis/v1/jobs`;

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
        showToast(`Job ${targetId ? 'updated' : 'created'} successfully!`, 'success');
        setTimeout(() => router.push('/edu-admin/jobs'), 1200);
      } else {
        const serverErrors = data.errors || {};
        if (Object.keys(serverErrors).length > 0) {
          setErrors(serverErrors);
          const firstField = Object.keys(serverErrors)[0];
          scrollToField(firstField);
          showToast(data.message || 'Please fix the highlighted errors.', 'error');
        } else {
          showToast(data.message || 'Failed to save job. Please try again.', 'error');
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

      {/* Top Header: Back Button + Add a New Job / Edit Job */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push('/edu-admin/jobs')}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-medium shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-normal text-slate-900 tracking-tight">
            {isEdit || slugOrId ? 'Edit Job' : 'Add a New Job'}
          </h1>
        </div>
      </div>

      {/* If Fetching Job Data */}
      {fetchingJob ? (
        <div className="bg-white border border-slate-300 rounded p-12 shadow-2xs">
          <AdminLoader
            text="Loading Job Post Details..."
            subtext="Retrieving recruitment dates, eligibility criteria, and vacancies"
          />
        </div>
      ) : (
        /* Main Grid: Left Form (75%) + Right Panels (25%) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* Left Column (9 cols) */}
          <div className="lg:col-span-9 space-y-3.5">
            {/* Top Post Title Input */}
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
                  placeholder="Enter Job Post Title Here"
                  value={title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setTitle(newTitle);
                    clearError('title');
                    if (!metaTitle) setMetaTitle(newTitle);
                    if (!isCustomSlug) {
                      const autoSlug = newTitle
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '');
                      setSlug(autoSlug);
                      clearError('slug');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-transparent text-base font-semibold text-slate-900 placeholder-slate-400 focus:outline-none rounded"
                />
              </div>
              {errors.title && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle size={13} className="shrink-0 text-rose-500" />
                  <span>{errors.title}</span>
                </p>
              )}
            </div>

            {/* Permalink / URL Slug Input Box */}
            <div className="space-y-1">
              <div
                ref={slugRef}
                className={`bg-white border rounded px-3.5 py-2 flex flex-wrap items-center gap-2 text-xs shadow-2xs transition-all duration-200 ${
                  errors.slug
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                    : 'border-slate-300 focus-within:border-[#2271b1]'
                }`}
              >
                <span className="font-semibold text-slate-700 shrink-0">Permalink:</span>
                <span className="text-slate-400 font-mono select-all shrink-0 hidden sm:inline">
                  https://educationmasters.in/
                </span>
                <div className="flex-1 min-w-[200px] flex items-center gap-1.5">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setIsCustomSlug(true);
                      clearError('slug');
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9\-]/g, '-')
                          .replace(/-+/g, '-')
                      );
                    }}
                    placeholder="custom-job-slug"
                    className="w-full px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-[#2271b1] shadow-2xs"
                  />
                  {slug && (
                    <button
                      type="button"
                      onClick={() => window.open(`/${slug}`, '_blank')}
                      className="text-xs text-[#2271b1] hover:text-[#135e96] font-semibold hover:underline flex items-center gap-1 shrink-0 px-1 cursor-pointer"
                      title="View Live Job Page"
                    >
                      <span>View</span>
                      <ExternalLink size={12} />
                    </button>
                  )}
                </div>
              </div>
              {errors.slug && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle size={13} className="shrink-0 text-rose-500" />
                  <span>{errors.slug}</span>
                </p>
              )}
            </div>

            {/* Job Key Fields Form Container */}
            <div className="bg-white border border-slate-300 rounded p-4 shadow-2xs space-y-3.5">
              {/* Row 1: Job Post Name & Department Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Job Post Name (Name of Exam) <span className="text-rose-500">*</span>
                  </label>
                  <div
                    ref={postNameRef}
                    className={`rounded transition-all duration-200 ${
                      errors.postName ? 'ring-2 ring-rose-500/20' : ''
                    }`}
                  >
                    <input
                      type="text"
                      value={postName}
                      onChange={(e) => {
                        setPostName(e.target.value);
                        clearError('postName');
                      }}
                      placeholder="Enter the name of job posts/examination"
                      className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${
                        errors.postName
                          ? 'border-rose-500 bg-rose-50/10'
                          : 'border-slate-300 focus:border-[#2271b1]'
                      }`}
                    />
                  </div>
                  {errors.postName && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in slide-in-from-top-1 duration-200">
                      <AlertCircle size={13} className="shrink-0 text-rose-500" />
                      <span>{errors.postName}</span>
                    </p>
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

              {/* Row 2: Post Name (Designation) & Number of Vacancies */}
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
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Number of Vacancies (Numeric Only) <span className="text-rose-500">*</span>
                  </label>
                  <div
                    ref={vacanciesRef}
                    className={`rounded transition-all duration-200 ${
                      errors.vacancies ? 'ring-2 ring-rose-500/20' : ''
                    }`}
                  >
                    <input
                      type="text"
                      value={vacancies}
                      onChange={(e) => {
                        setVacancies(e.target.value);
                        clearError('vacancies');
                      }}
                      placeholder="Enter Number of Vacancies"
                      className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${
                        errors.vacancies
                          ? 'border-rose-500 bg-rose-50/10'
                          : 'border-slate-300 focus:border-[#2271b1]'
                      }`}
                    />
                  </div>
                  {errors.vacancies && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in slide-in-from-top-1 duration-200">
                      <AlertCircle size={13} className="shrink-0 text-rose-500" />
                      <span>{errors.vacancies}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Min Age & Max Age */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Min. Age for Application (Numeric Only)
                  </label>
                  <input
                    type="number"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    placeholder="Enter the minimum age for job application"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2271b1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Max. Age for Application (Numeric Only)
                  </label>
                  <input
                    type="number"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    placeholder="Enter the maximum age for job application"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2271b1]"
                  />
                </div>
              </div>

              {/* Row 4: Notification Released Date & Examination Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Job Notification Released Date
                  </label>
                  <input
                    type="date"
                    value={releasedDate}
                    onChange={(e) => setReleasedDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                  />
                </div>
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
              </div>

              {/* Row 5: Online Application Start Date & Last Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Online Application Start Date
                  </label>
                  <input
                    type="date"
                    value={appStartDate}
                    onChange={(e) => setAppStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Last Date of Application <span className="text-rose-500">*</span>
                  </label>
                  <div
                    ref={appEndDateRef}
                    className={`rounded transition-all duration-200 ${
                      errors.appEndDate ? 'ring-2 ring-rose-500/20' : ''
                    }`}
                  >
                    <input
                      type="date"
                      value={appEndDate}
                      onChange={(e) => {
                        setAppEndDate(e.target.value);
                        clearError('appEndDate');
                      }}
                      className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 focus:outline-none transition-colors ${
                        errors.appEndDate
                          ? 'border-rose-500 bg-rose-50/10'
                          : 'border-slate-300 focus:border-[#2271b1]'
                      }`}
                    />
                  </div>
                  {errors.appEndDate && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in slide-in-from-top-1 duration-200">
                      <AlertCircle size={13} className="shrink-0 text-rose-500" />
                      <span>{errors.appEndDate}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Row 6: Job Application URL & Notification URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Job Application URL <span className="text-rose-500">*</span>
                  </label>
                  <div
                    ref={appUrlRef}
                    className={`rounded transition-all duration-200 ${
                      errors.appUrl ? 'ring-2 ring-rose-500/20' : ''
                    }`}
                  >
                    <input
                      type="text"
                      value={appUrl}
                      onChange={(e) => {
                        setAppUrl(e.target.value);
                        clearError('appUrl');
                      }}
                      placeholder="Enter the Job Application URL"
                      className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${
                        errors.appUrl
                          ? 'border-rose-500 bg-rose-50/10'
                          : 'border-slate-300 focus:border-[#2271b1]'
                      }`}
                    />
                  </div>
                  {errors.appUrl && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in slide-in-from-top-1 duration-200">
                      <AlertCircle size={13} className="shrink-0 text-rose-500" />
                      <span>{errors.appUrl}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Job Notification URL
                  </label>
                  <input
                    type="text"
                    value={notiUrl}
                    onChange={(e) => setNotiUrl(e.target.value)}
                    placeholder="Enter the Job Notification URL"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2271b1]"
                  />
                </div>
              </div>
            </div>

            {/* Row 7: Two Rich Text Editors (Eligibility Criteria & Application Fee) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Eligibility Criteria */}
              <div
                ref={eligibilityRef}
                className={`bg-white border rounded shadow-2xs overflow-hidden transition-all duration-200 ${
                  errors.eligibility
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-slate-300'
                }`}
              >
                <div className="bg-[#f6f7f7] border-b border-slate-300 px-3 py-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800">
                    Eligibility Criteria <span className="text-rose-500">*</span>
                  </h3>
                  {errors.eligibility && (
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                      Required
                    </span>
                  )}
                </div>
                <div className="p-0.5 bg-white">
                  <JoditEditorWrapper
                    value={eligibility}
                    onChange={(newVal) => {
                      setEligibility(newVal);
                      clearError('eligibility');
                    }}
                    height={250}
                    placeholder="Enter educational eligibility criteria..."
                  />
                </div>
                {errors.eligibility && (
                  <div className="px-3 py-1.5 bg-rose-50 border-t border-rose-200 flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in duration-200">
                    <AlertCircle size={13} className="shrink-0 text-rose-500" />
                    <span>{errors.eligibility}</span>
                  </div>
                )}
              </div>

              {/* Application Fee */}
              <div
                ref={applicationFeeRef}
                className={`bg-white border rounded shadow-2xs overflow-hidden transition-all duration-200 ${
                  errors.applicationFee
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-slate-300'
                }`}
              >
                <div className="bg-[#f6f7f7] border-b border-slate-300 px-3 py-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800">
                    Application Fee <span className="text-rose-500">*</span>
                  </h3>
                  {errors.applicationFee && (
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                      Required
                    </span>
                  )}
                </div>
                <div className="p-0.5 bg-white">
                  <JoditEditorWrapper
                    value={applicationFee}
                    onChange={(newVal) => {
                      setApplicationFee(newVal);
                      clearError('applicationFee');
                    }}
                    height={250}
                    placeholder="Enter category-wise application fee details..."
                  />
                </div>
                {errors.applicationFee && (
                  <div className="px-3 py-1.5 bg-rose-50 border-t border-rose-200 flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in duration-200">
                    <AlertCircle size={13} className="shrink-0 text-rose-500" />
                    <span>{errors.applicationFee}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Row 8: Two Rich Text Editors (Pay Scale & Job Description) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Pay Scale (Salary Structure) */}
              <div
                ref={payScaleRef}
                className={`bg-white border rounded shadow-2xs overflow-hidden transition-all duration-200 ${
                  errors.payScale
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-slate-300'
                }`}
              >
                <div className="bg-[#f6f7f7] border-b border-slate-300 px-3 py-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800">
                    Pay Scale (Salary Structure) <span className="text-rose-500">*</span>
                  </h3>
                  {errors.payScale && (
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                      Required
                    </span>
                  )}
                </div>
                <div className="p-0.5 bg-white">
                  <JoditEditorWrapper
                    value={payScale}
                    onChange={(newVal) => {
                      setPayScale(newVal);
                      clearError('payScale');
                    }}
                    height={250}
                    placeholder="Enter monthly salary / pay scale / allowances..."
                  />
                </div>
                {errors.payScale && (
                  <div className="px-3 py-1.5 bg-rose-50 border-t border-rose-200 flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in duration-200">
                    <AlertCircle size={13} className="shrink-0 text-rose-500" />
                    <span>{errors.payScale}</span>
                  </div>
                )}
              </div>

              {/* Job Description */}
              <div
                ref={descriptionRef}
                className={`bg-white border rounded shadow-2xs overflow-hidden transition-all duration-200 ${
                  errors.description
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-slate-300'
                }`}
              >
                <div className="bg-[#f6f7f7] border-b border-slate-300 px-3 py-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800">
                    Job Description <span className="text-rose-500">*</span>
                  </h3>
                  {errors.description && (
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                      Required
                    </span>
                  )}
                </div>
                <div className="p-0.5 bg-white">
                  <JoditEditorWrapper
                    value={jobDescription}
                    onChange={(newVal) => {
                      setJobDescription(newVal);
                      clearError('description');
                    }}
                    height={250}
                    placeholder="Enter full job details, selection process, syllabus..."
                  />
                </div>
                {errors.description && (
                  <div className="px-3 py-1.5 bg-rose-50 border-t border-rose-200 flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in duration-200">
                    <AlertCircle size={13} className="shrink-0 text-rose-500" />
                    <span>{errors.description}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Row 9: SEO Tags Section Accordion */}
            <div
              className={`bg-white border rounded shadow-2xs transition-all duration-200 ${
                errors.metaTitle || errors.metaDescription
                  ? 'border-rose-500 ring-2 ring-rose-500/20'
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
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
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
                  <div className="space-y-1">
                    <label className="block text-xs text-slate-700 font-semibold">
                      Meta Title <span className="text-rose-500">*</span>
                    </label>
                    <div
                      ref={metaTitleRef}
                      className={`rounded transition-all duration-200 ${
                        errors.metaTitle ? 'ring-2 ring-rose-500/20' : ''
                      }`}
                    >
                      <input
                        type="text"
                        value={metaTitle}
                        onChange={(e) => {
                          setMetaTitle(e.target.value);
                          clearError('metaTitle');
                        }}
                        placeholder="Enter SEO Meta Title"
                        className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 focus:outline-none transition-colors ${
                          errors.metaTitle
                            ? 'border-rose-500 bg-rose-50/10'
                            : 'border-slate-300 focus:border-[#2271b1]'
                        }`}
                      />
                    </div>
                    {errors.metaTitle && (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in slide-in-from-top-1 duration-200">
                        <AlertCircle size={13} className="shrink-0 text-rose-500" />
                        <span>{errors.metaTitle}</span>
                      </p>
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
                      placeholder="keyword1, keyword2, ..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                    />
                  </div>

                  {/* Meta Description */}
                  <div className="space-y-1">
                    <label className="block text-xs text-slate-700 font-semibold">
                      Meta Description <span className="text-rose-500">*</span>
                    </label>
                    <div
                      ref={metaDescriptionRef}
                      className={`rounded transition-all duration-200 ${
                        errors.metaDescription ? 'ring-2 ring-rose-500/20' : ''
                      }`}
                    >
                      <textarea
                        rows={3}
                        value={metaDescription}
                        onChange={(e) => {
                          setMetaDescription(e.target.value);
                          clearError('metaDescription');
                        }}
                        placeholder="Enter SEO Meta Description summary..."
                        className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 focus:outline-none transition-colors resize-y ${
                          errors.metaDescription
                            ? 'border-rose-500 bg-rose-50/10'
                            : 'border-slate-300 focus:border-[#2271b1]'
                        }`}
                      />
                    </div>
                    {errors.metaDescription && (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in slide-in-from-top-1 duration-200">
                        <AlertCircle size={13} className="shrink-0 text-rose-500" />
                        <span>{errors.metaDescription}</span>
                      </p>
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
                          window.open(`/${slug || slugOrId}`, '_blank');
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
                        ? 'Update Job Post'
                        : status === 'draft'
                        ? 'Save Draft'
                        : 'Publish Job Post'}
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

            {/* Panel 3: Categories removed as Jobs are automatically categorized */}

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

      {/* WordPress Style Media Library Modal */}
      <MediaLibraryModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSelect={handleMediaSelected}
        targetType={mediaModalTarget}
      />
    </div>
  );
}
