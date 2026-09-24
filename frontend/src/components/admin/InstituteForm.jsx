'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Building2,
  Image as ImageIcon,
  MapPin,
  Phone,
  Mail,
  Globe,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  Upload,
  BookOpen,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Table,
  RotateCcw,
  RotateCw,
  X,
  Layers,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';
import MediaLibraryModal from '@/components/admin/MediaLibraryModal';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { getAuthToken } from '@/utils/auth';
import { getImageUrl } from '@/utils/image';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

const slugify = (text) => {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

function ImagePreviewBox({
  type = 'banner', // 'banner' | 'logo'
  url,
  onOpenModal,
  onRemove,
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [url]);

  const fullUrl = url ? getImageUrl(url) : null;
  const isBanner = type === 'banner';

  return (
    <div
      className={`relative w-full h-40 bg-[#f0f0f1] border-2 border-dashed border-slate-300 rounded overflow-hidden flex flex-col items-center justify-center text-slate-500 hover:border-[#2271b1] transition-colors group`}
    >
      {fullUrl && !imgError ? (
        <>
          <img
            src={fullUrl}
            alt={isBanner ? 'Banner Preview' : 'Logo Preview'}
            onError={() => setImgError(true)}
            className={`w-full h-full ${
              isBanner ? 'object-cover' : 'object-contain p-2 bg-white'
            }`}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onOpenModal}
              className="px-2.5 py-1 bg-white text-slate-800 rounded text-xs font-semibold hover:bg-slate-100 transition-colors shadow cursor-pointer"
            >
              Change
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors shadow cursor-pointer"
              title="Remove Image"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1.5 p-3 text-center">
          <ImageIcon size={26} className="text-slate-400" />
          <button
            type="button"
            onClick={onOpenModal}
            className="px-3 py-1 bg-[#2271b1] text-white rounded text-xs font-semibold hover:bg-[#135e96] transition-colors shadow-2xs cursor-pointer"
          >
            {isBanner ? 'Select Banner Cover' : 'Choose Logo'}
          </button>
          <span className="text-[10.5px] text-slate-400">
            {isBanner ? 'Recommended: 1200 x 400 px' : 'Max: 250 x 250 px'}
          </span>
        </div>
      )}
    </div>
  );
}

export default function InstituteForm({ initialData = null, isEdit = false }) {
  const router = useRouter();
  const { data: session } = useSession();

  // Form states
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [selectedState, setSelectedState] = useState(
    initialData?.state?._id || initialData?.state || ''
  );
  const [selectedDistrict, setSelectedDistrict] = useState(
    initialData?.district?._id || initialData?.district || ''
  );
  const [city, setCity] = useState(initialData?.city || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [gmap, setGmap] = useState(initialData?.gmap || '');
  const [logo, setLogo] = useState(initialData?.logo || '');
  const [cover, setCover] = useState(initialData?.cover || '');
  const [status, setStatus] = useState(
    initialData?.status === 'draft'
      ? 'draft'
      : initialData?.status === 'pending'
      ? 'pending'
      : 'publish'
  );
  const [isEditingStatus, setIsEditingStatus] = useState(false);

  // Dynamic lists from backend
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [allFacilities, setAllFacilities] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState(
    initialData?.courses?.map((c) => (typeof c === 'object' ? c._id : c)) || []
  );
  const [selectedFacilities, setSelectedFacilities] = useState(
    initialData?.facilities?.map((f) => (typeof f === 'object' ? f._id : f)) || []
  );

  // Search filter for courses multi-select in right sidebar
  const [courseSearch, setCourseSearch] = useState('');

  // Rich Text Editor State
  const editorRef = useRef(null);
  const [wordCount, setWordCount] = useState(0);

  // Media picker modal state
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState('cover'); // 'cover' | 'logo'
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Error and Alert states
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [serverSuccess, setServerSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingDistricts, setFetchingDistricts] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Initial population when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setSlug(initialData.slug || '');
      setWebsite(initialData.website || '');
      setPhone(initialData.phone || '');
      setEmail(initialData.email || '');
      setSelectedState(initialData.state?._id || initialData.state || '');
      setSelectedDistrict(initialData.district?._id || initialData.district || '');
      setCity(initialData.city || '');
      setAddress(initialData.address || '');
      setGmap(initialData.gmap || '');
      setLogo(initialData.logo || '');
      setCover(initialData.cover || '');
      setStatus(
        initialData.status === 'draft'
          ? 'draft'
          : initialData.status === 'pending'
          ? 'pending'
          : 'publish'
      );
      setSelectedCourses(
        initialData.courses?.map((c) => (typeof c === 'object' ? c._id : c)) || []
      );
      setSelectedFacilities(
        initialData.facilities?.map((f) => (typeof f === 'object' ? f._id : f)) || []
      );

      if (editorRef.current && initialData.about) {
        editorRef.current.innerHTML = initialData.about;
        updateWordCount();
      }
    }
  }, [initialData]);

  // Load States, Courses, Facilities on mount with error resilience
  useEffect(() => {
    const loadInitialOptions = async () => {
      try {
        const [resStates, resCourses, resFac] = await Promise.all([
          fetch(`${BACKEND_URL}/apis/v1/states`).catch(() => null),
          fetch(`${BACKEND_URL}/apis/v1/courses/all`).catch(() => null),
          fetch(`${BACKEND_URL}/apis/v1/facilities/all`).catch(() => null),
        ]);

        if (resStates && resStates.ok) {
          const dataStates = await resStates.json();
          if (dataStates.success) setStatesList(dataStates.data || []);
        }
        if (resCourses && resCourses.ok) {
          const dataCourses = await resCourses.json();
          if (dataCourses.success) setAllCourses(dataCourses.data || []);
        }
        if (resFac && resFac.ok) {
          const dataFac = await resFac.json();
          if (dataFac.success) setAllFacilities(dataFac.data || []);
        }
      } catch (err) {
        console.error('Error loading options:', err);
      }
    };

    loadInitialOptions();
  }, []);

  // Fetch districts whenever selected state changes
  useEffect(() => {
    if (!selectedState) {
      setDistrictsList([]);
      return;
    }

    const fetchDistricts = async () => {
      try {
        setFetchingDistricts(true);
        const res = await fetch(`${BACKEND_URL}/apis/v1/states/districts?stateId=${selectedState}`);
        if (!res.ok) throw new Error('Failed to load districts');
        const data = await res.json();
        if (data.success) {
          setDistrictsList(data.data || []);
        }
      } catch (err) {
        console.error('Error loading districts:', err);
      } finally {
        setFetchingDistricts(false);
      }
    };

    fetchDistricts();
  }, [selectedState]);

  // Helper to clear error when user types
  const handleFieldChange = (field, setter) => (e) => {
    setter(e.target.value);
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Update slug automatically when name changes (in create mode)
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (errors.name) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.name;
        return updated;
      });
    }
    if (!isEdit) {
      setSlug(slugify(val));
    }
  };

  // Rich Text Editor Commands
  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      updateWordCount();
    }
  };

  const updateWordCount = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  };

  // Media Selection Handler
  const handleMediaSelect = (mediaItem) => {
    if (!mediaItem) return;
    const url =
      mediaItem.file ||
      mediaItem.url ||
      mediaItem.img_url ||
      (mediaItem.path && mediaItem.name ? `${mediaItem.path.replace(/\/$/, '')}/${mediaItem.name}` : mediaItem.path) ||
      '';

    if (mediaTarget === 'cover') {
      setCover(url);
    } else if (mediaTarget === 'logo') {
      setLogo(url);
    }
    setMediaModalOpen(false);
  };

  // Toggle Course Selection
  const toggleCourse = (id) => {
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle Facility Selection
  const toggleFacility = (id) => {
    setSelectedFacilities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Client-side Form Validation
  const validateForm = () => {
    const newErrors = {};

    if (!name || !name.trim()) {
      newErrors.name = 'Institute Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Institute Name must be at least 2 characters';
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Please provide a valid email address';
      }
    }

    if (website && website.trim()) {
      try {
        const testUrl = website.startsWith('http://') || website.startsWith('https://')
          ? website
          : `https://${website}`;
        new URL(testUrl);
      } catch (e) {
        newErrors.website = 'Please provide a valid website URL';
      }
    }

    return newErrors;
  };

  // Handle Form Submit
  const handleSubmit = async (submitStatus = status) => {
    setServerError(null);
    setServerSuccess(null);

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      const firstError = Object.values(formErrors)[0];
      setServerError(firstError);
      showToast(firstError, 'error');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    try {
      setLoading(true);
      const aboutHtml = editorRef.current ? editorRef.current.innerHTML : '';

      const payload = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        website: website.trim(),
        phone: phone.trim(),
        email: email.trim(),
        state: selectedState || null,
        district: selectedDistrict || null,
        city: city.trim(),
        address: address.trim(),
        gmap: gmap.trim(),
        about: aboutHtml,
        logo: logo || null,
        cover: cover || null,
        status: submitStatus,
        courses: selectedCourses,
        facilities: selectedFacilities,
      };

      const url = isEdit
        ? `${BACKEND_URL}/apis/v1/institutes/${initialData?._id || initialData?.slug}`
        : `${BACKEND_URL}/apis/v1/institutes`;

      const method = isEdit ? 'PUT' : 'POST';
      const token = getAuthToken(session);

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
        setErrors({});
        setServerError(null);
        setServerSuccess(
          isEdit ? 'Institute updated successfully!' : 'Institute created successfully!'
        );
        showToast(
          isEdit ? 'Institute updated successfully!' : 'Institute created successfully!'
        );
        setTimeout(() => {
          router.push('/edu-admin/institutes');
        }, 800);
      } else {
        if (data.errors && typeof data.errors === 'object') {
          setErrors(data.errors);
        }
        const errorMsg = data.message || 'Operation failed. Please check form inputs.';
        setServerError(errorMsg);
        showToast(errorMsg, 'error');
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } catch (err) {
      console.error('Error saving institute:', err);
      const msg = err.message || 'Network error occurred while saving institute.';
      setServerError(msg);
      showToast(msg, 'error');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToTrash = () => {
    if (!initialData?._id) return;
    setDeleteModalOpen(true);
  };

  const handleConfirmTrash = async () => {
    if (!initialData?._id) return;
    try {
      setLoading(true);
      const token = getAuthToken(session);
      const res = await fetch(`${BACKEND_URL}/apis/v1/institutes/${initialData._id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.success) {
        showToast('Moved to trash');
        router.push('/edu-admin/institutes');
      } else {
        showToast(data.message || 'Failed to trash institute', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to trash institute', 'error');
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
    }
  };

  const filteredCourses = allCourses.filter((c) =>
    c.name.toLowerCase().includes(courseSearch.toLowerCase())
  );

  return (
    <div className="w-full font-sans text-slate-800 select-none pb-12">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-12 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded shadow-lg text-xs font-semibold transition-all ${
            toast.type === 'error'
              ? 'bg-red-600 text-white shadow-red-500/20'
              : 'bg-slate-800 text-white shadow-slate-900/20'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={16} />
          ) : (
            <Check size={16} className="text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Dismissible Alert Banner */}
      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r text-xs text-red-800 flex items-start justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span className="font-semibold">{serverError}</span>
          </div>
          <button
            type="button"
            onClick={() => setServerError(null)}
            className="text-red-500 hover:text-red-700 p-0.5 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {serverSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-r text-xs text-emerald-800 flex items-start justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-600 shrink-0" />
            <span className="font-semibold">{serverSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setServerSuccess(null)}
            className="text-emerald-500 hover:text-emerald-700 p-0.5 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <Link
            href="/edu-admin/institutes"
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded shadow-2xs transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Back to Institutes"
          >
            <ChevronLeft size={15} />
            <span>Back</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEdit ? 'Edit Institute' : 'Add Institute'}
          </h1>
        </div>

        <Link
          href="/edu-admin/institutes"
          className="text-xs text-[#2271b1] hover:underline flex items-center gap-1 font-medium"
        >
          <span>All Institutes</span>
        </Link>
      </div>

      {/* Main Grid: Form on Left, Publish + Courses + Facilities Sidebar on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Form: Basic Details, Logo/Banner, Description (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 rounded shadow-2xs p-5 space-y-5">
            {/* Section Step Header */}
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-sm font-bold text-slate-800">1. Basic Details</h2>
            </div>

            {/* Banner & Logo Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Banner Cover Box */}
              <div className="md:col-span-7 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Institute Banner / Cover
                </label>
                <ImagePreviewBox
                  type="banner"
                  url={cover}
                  onOpenModal={() => {
                    setMediaTarget('cover');
                    setMediaModalOpen(true);
                  }}
                  onRemove={() => setCover('')}
                />
              </div>

              {/* Logo Box */}
              <div className="md:col-span-5 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Select Institute Logo <span className="text-slate-400 font-normal">(Max: 250x250)</span>
                </label>
                <ImagePreviewBox
                  type="logo"
                  url={logo}
                  onOpenModal={() => {
                    setMediaTarget('logo');
                    setMediaModalOpen(true);
                  }}
                  onRemove={() => setLogo('')}
                />
              </div>
            </div>

            {/* Inputs Grid (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Institute Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Institute Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="e.g. SRI RAAM COMPUTER EDUCATION"
                  className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 focus:outline-none transition-colors ${
                    errors.name
                      ? 'border-red-500 focus:border-red-500 bg-red-50/20'
                      : 'border-slate-300 focus:border-[#2271b1]'
                  }`}
                  required
                />
                {errors.name && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium mt-0.5">
                    <AlertCircle size={11} />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Slug / URL Key */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Slug / URL Key <span className="text-slate-400 font-normal">(Auto-generated or custom)</span>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={handleFieldChange('slug', setSlug)}
                  placeholder="e.g. sri-raam-computer-education"
                  className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 focus:outline-none transition-colors font-mono ${
                    errors.slug
                      ? 'border-red-500 focus:border-red-500 bg-red-50/20'
                      : 'border-slate-300 focus:border-[#2271b1]'
                  }`}
                />
                {errors.slug && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium mt-0.5">
                    <AlertCircle size={11} />
                    <span>{errors.slug}</span>
                  </p>
                )}
              </div>

              {/* Website Link */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Website Link</label>
                <input
                  type="url"
                  value={website}
                  onChange={handleFieldChange('website', setWebsite)}
                  placeholder="https://www.srceducation.in/"
                  className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 focus:outline-none transition-colors ${
                    errors.website
                      ? 'border-red-500 focus:border-red-500 bg-red-50/20'
                      : 'border-slate-300 focus:border-[#2271b1]'
                  }`}
                />
                {errors.website && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium mt-0.5">
                    <AlertCircle size={11} />
                    <span>{errors.website}</span>
                  </p>
                )}
              </div>

              {/* Contact No */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Contact No.
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={handleFieldChange('phone', setPhone)}
                  placeholder="e.g. 9811651557"
                  className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 focus:outline-none transition-colors ${
                    errors.phone
                      ? 'border-red-500 focus:border-red-500 bg-red-50/20'
                      : 'border-slate-300 focus:border-[#2271b1]'
                  }`}
                />
                {errors.phone && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium mt-0.5">
                    <AlertCircle size={11} />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={handleFieldChange('email', setEmail)}
                  placeholder="info@srceducation.in"
                  className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 focus:outline-none transition-colors ${
                    errors.email
                      ? 'border-red-500 focus:border-red-500 bg-red-50/20'
                      : 'border-slate-300 focus:border-[#2271b1]'
                  }`}
                />
                {errors.email && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium mt-0.5">
                    <AlertCircle size={11} />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* State */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedDistrict('');
                    if (errors.state) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.state;
                        return copy;
                      });
                    }
                  }}
                  className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 focus:outline-none transition-colors ${
                    errors.state
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-300 focus:border-[#2271b1]'
                  }`}
                >
                  <option value="">Select State</option>
                  {statesList.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.name}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium mt-0.5">
                    <AlertCircle size={11} />
                    <span>{errors.state}</span>
                  </p>
                )}
              </div>

              {/* District */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  District
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    if (errors.district) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.district;
                        return copy;
                      });
                    }
                  }}
                  disabled={!selectedState || fetchingDistricts}
                  className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 focus:outline-none transition-colors disabled:bg-slate-100 ${
                    errors.district
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-300 focus:border-[#2271b1]'
                  }`}
                >
                  <option value="">
                    {fetchingDistricts ? 'Loading Districts...' : 'Select District'}
                  </option>
                  {districtsList.map((dt) => (
                    <option key={dt._id} value={dt._id}>
                      {dt.name}
                    </option>
                  ))}
                </select>
                {errors.district && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium mt-0.5">
                    <AlertCircle size={11} />
                    <span>{errors.district}</span>
                  </p>
                )}
              </div>

              {/* City */}
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={handleFieldChange('city', setCity)}
                  placeholder="New Delhi"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                />
              </div>

              {/* Institute Address */}
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Institute Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={handleFieldChange('address', setAddress)}
                  placeholder="B-33, Opp. Metro Pillar No. 43, Vikas Marg, Laxmi Nagar, New Delhi, Delhi 110092"
                  className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 focus:outline-none transition-colors ${
                    errors.address
                      ? 'border-red-500 focus:border-red-500 bg-red-50/20'
                      : 'border-slate-300 focus:border-[#2271b1]'
                  }`}
                />
                {errors.address && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium mt-0.5">
                    <AlertCircle size={11} />
                    <span>{errors.address}</span>
                  </p>
                )}
              </div>

              {/* Institute Google Map Location */}
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Institute's Google Map Location <span className="text-slate-400 font-normal">(Embed URL / Share Link)</span>
                </label>
                <input
                  type="text"
                  value={gmap}
                  onChange={handleFieldChange('gmap', setGmap)}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                />
              </div>
            </div>

            {/* Rich Text Editor for About / Description */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-slate-700">
                About / Institute Description
              </label>

              {/* Editor Toolbar */}
              <div className="border border-slate-300 rounded overflow-hidden bg-white">
                <div className="flex flex-wrap items-center gap-1 p-1.5 bg-[#f6f7f7] border-b border-slate-200 text-slate-700 text-xs">
                  <select
                    onChange={(e) => execCmd('formatBlock', e.target.value)}
                    className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[11px] text-slate-700"
                  >
                    <option value="p">Paragraph</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="h4">Heading 4</option>
                  </select>

                  <div className="h-4 w-[1px] bg-slate-300 mx-0.5" />

                  <button
                    type="button"
                    onClick={() => execCmd('bold')}
                    title="Bold (Ctrl+B)"
                    className="p-1 hover:bg-slate-200 rounded font-bold"
                  >
                    <Bold size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('italic')}
                    title="Italic (Ctrl+I)"
                    className="p-1 hover:bg-slate-200 rounded italic"
                  >
                    <Italic size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('underline')}
                    title="Underline (Ctrl+U)"
                    className="p-1 hover:bg-slate-200 rounded underline"
                  >
                    <Underline size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('strikeThrough')}
                    title="Strikethrough"
                    className="p-1 hover:bg-slate-200 rounded line-through"
                  >
                    <Strikethrough size={13} />
                  </button>

                  <div className="h-4 w-[1px] bg-slate-300 mx-0.5" />

                  <button
                    type="button"
                    onClick={() => execCmd('justifyLeft')}
                    title="Align Left"
                    className="p-1 hover:bg-slate-200 rounded"
                  >
                    <AlignLeft size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('justifyCenter')}
                    title="Align Center"
                    className="p-1 hover:bg-slate-200 rounded"
                  >
                    <AlignCenter size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('justifyRight')}
                    title="Align Right"
                    className="p-1 hover:bg-slate-200 rounded"
                  >
                    <AlignRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('justifyFull')}
                    title="Justify"
                    className="p-1 hover:bg-slate-200 rounded"
                  >
                    <AlignJustify size={13} />
                  </button>

                  <div className="h-4 w-[1px] bg-slate-300 mx-0.5" />

                  <button
                    type="button"
                    onClick={() => execCmd('insertUnorderedList')}
                    title="Bullet List"
                    className="p-1 hover:bg-slate-200 rounded"
                  >
                    <List size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('insertOrderedList')}
                    title="Numbered List"
                    className="p-1 hover:bg-slate-200 rounded"
                  >
                    <ListOrdered size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('Enter link URL:');
                      if (url) execCmd('createLink', url);
                    }}
                    title="Insert Link"
                    className="p-1 hover:bg-slate-200 rounded"
                  >
                    <LinkIcon size={13} />
                  </button>

                  <div className="h-4 w-[1px] bg-slate-300 mx-0.5" />

                  <button
                    type="button"
                    onClick={() => execCmd('undo')}
                    title="Undo"
                    className="p-1 hover:bg-slate-200 rounded"
                  >
                    <RotateCcw size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('redo')}
                    title="Redo"
                    className="p-1 hover:bg-slate-200 rounded"
                  >
                    <RotateCw size={13} />
                  </button>
                </div>

                {/* Editable Area */}
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={updateWordCount}
                  className="min-h-[180px] p-4 text-xs text-slate-800 focus:outline-none leading-relaxed prose prose-sm max-w-none"
                  placeholder="Describe the institute, achievements, courses offered, faculty, facilities, and history..."
                />

                {/* Word Count Footer */}
                <div className="px-3 py-1 bg-[#f6f7f7] border-t border-slate-200 text-[10.5px] text-slate-500 font-mono flex justify-between items-center">
                  <span>p</span>
                  <span>{wordCount} WORDS</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Publish Box + Courses Box + Facilities Box (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* 1. Publish Box */}
          <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
            <div className="bg-[#f6f7f7] border-b border-slate-200 px-3.5 py-2 font-bold text-xs text-slate-800">
              Publish
            </div>

            <div className="p-3.5 space-y-3">
              {/* Draft & Preview Buttons */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSubmit('draft')}
                  disabled={loading}
                  className="px-3 py-1.5 bg-[#f0f0f1] hover:bg-[#dcdcde] text-[#2c3338] text-xs font-semibold rounded border border-[#8c8f94] transition-colors flex-1"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (website) window.open(website.startsWith('http') ? website : `https://${website}`, '_blank');
                    else showToast('No website link provided', 'error');
                  }}
                  className="px-3 py-1.5 bg-[#f0f0f1] hover:bg-[#dcdcde] text-[#2c3338] text-xs font-semibold rounded border border-[#8c8f94] transition-colors flex items-center justify-center gap-1"
                >
                  <ExternalLink size={12} />
                  <span>Preview</span>
                </button>
              </div>

              {/* Status Section */}
              <div className="text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Status:</span>
                  <div className="flex items-center gap-1">
                    <span className="capitalize font-bold text-slate-900">
                      {status === 'publish' ? 'Published' : status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingStatus(!isEditingStatus)}
                      className="text-[#2271b1] hover:underline text-[11px] ml-1 font-medium"
                    >
                      {isEditingStatus ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                </div>

                {/* Status Dropdown if editing */}
                {isEditingStatus && (
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="publish">Published</option>
                      <option value="pending">Pending Review</option>
                      <option value="draft">Draft</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsEditingStatus(false)}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-xs font-semibold"
                    >
                      OK
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Box Footer (Move to Trash + Publish button) */}
            <div className="bg-[#f6f7f7] border-t border-slate-200 px-3.5 py-2.5 flex items-center justify-between">
              {isEdit ? (
                <button
                  type="button"
                  onClick={handleMoveToTrash}
                  className="text-xs text-red-600 hover:underline font-medium"
                >
                  Move to Trash
                </button>
              ) : (
                <Link
                  href="/edu-admin/institutes"
                  className="text-xs text-slate-500 hover:underline"
                >
                  Cancel
                </Link>
              )}

              <button
                type="button"
                onClick={() => handleSubmit('publish')}
                disabled={loading}
                className="px-4 py-1.5 bg-[#008a20] hover:bg-[#00701a] text-white text-xs font-bold rounded shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading && <RefreshCw size={12} className="animate-spin" />}
                <span>{isEdit ? 'Update' : 'Publish'}</span>
              </button>
            </div>
          </div>

          {/* 2. Courses Box (Right-aligned Sidebar Meta Box) */}
          <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
            <div className="bg-[#f6f7f7] border-b border-slate-200 px-3.5 py-2 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <BookOpen size={13} className="text-[#2271b1]" />
                <span>Courses Offered</span>
              </span>
              <span className="text-[10.5px] font-semibold text-[#2271b1] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {selectedCourses.length} Selected
              </span>
            </div>

            <div className="p-3 space-y-2.5">
              {/* Course Search Filter */}
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter courses..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs focus:outline-none focus:border-[#2271b1]"
                />
              </div>

              {/* Quick toggle clear / check */}
              {selectedCourses.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedCourses([])}
                    className="text-[10.5px] text-red-600 hover:underline"
                  >
                    Clear All ({selectedCourses.length})
                  </button>
                </div>
              )}

              {/* Scrollable Course Checklist */}
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded p-2 space-y-1 bg-slate-50 custom-scrollbar text-xs">
                {filteredCourses.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 text-xs">No courses match</div>
                ) : (
                  filteredCourses.slice(0, 100).map((c) => {
                    const isChecked = selectedCourses.includes(c._id);
                    return (
                      <label
                        key={c._id}
                        className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors select-none ${
                          isChecked
                            ? 'bg-blue-100/80 text-blue-900 font-medium'
                            : 'hover:bg-slate-200/60 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCourse(c._id)}
                          className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                        />
                        <span className="truncate">{c.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
              <div className="text-[10.5px] text-slate-400 text-right">
                Total: {allCourses.length} courses available
              </div>
            </div>
          </div>

          {/* 3. Facilities Box (Right-aligned Sidebar Meta Box) */}
          <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
            <div className="bg-[#f6f7f7] border-b border-slate-200 px-3.5 py-2 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Layers size={13} className="text-[#2271b1]" />
                <span>Campus Facilities</span>
              </span>
              <span className="text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {selectedFacilities.length} Selected
              </span>
            </div>

            <div className="p-3 space-y-1.5">
              {/* Quick toggle clear */}
              {selectedFacilities.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedFacilities([])}
                    className="text-[10.5px] text-red-600 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {/* Facilities Checklist */}
              <div className="space-y-1 max-h-56 overflow-y-auto custom-scrollbar border border-slate-200 rounded p-2 bg-slate-50 text-xs">
                {allFacilities.map((f) => {
                  const isChecked = selectedFacilities.includes(f._id);
                  return (
                    <label
                      key={f._id}
                      className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors select-none ${
                        isChecked
                          ? 'bg-emerald-100/80 text-emerald-900 font-medium'
                          : 'hover:bg-slate-200/60 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFacility(f._id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="truncate">{f.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Library Modal */}
      {mediaModalOpen && (
        <MediaLibraryModal
          isOpen={mediaModalOpen}
          onClose={() => setMediaModalOpen(false)}
          onSelect={handleMediaSelect}
          targetType={mediaTarget === 'logo' ? 'featured' : 'editor'}
        />
      )}

      {/* Reusable Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        isLoading={loading}
        itemName={name}
        title="Move Institute to Trash?"
        description="Are you sure you want to move this institute to trash? You can restore it later."
        confirmText="Move to Trash"
        onConfirm={handleConfirmTrash}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
