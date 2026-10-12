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
  AlertTriangle,
  Clock,
  CreditCard,
  CheckCircle2,
  Video,
  Images,
  Copy,
  Tag,
  Eye,
  HelpCircle,
} from 'lucide-react';
import MediaLibraryModal from '@/components/admin/MediaLibraryModal';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { getAuthToken } from '@/utils/auth';
import { getImageUrl } from '@/utils/image';
import { toast } from '@/context/ToastContext';
import { BACKEND_URL } from '@/utils/api';

const POPULAR_CATEGORIES = [
  'Coaching Institute',
  'Competitive Exam Coaching',
  'Training Academy',
  'Computer & IT Institute',
  'Degree College',
  'Skill Development Center',
  'Language & IELTS Institute',
  'Engineering & Medical Coaching',
];

const DEFAULT_SERVICES = [
  'Comprehensive Study Material & Notes',
  'Weekly Mock Tests & Performance Analysis',
  'One-on-One Doubt Clearing Sessions',
  'Experienced & Certified Faculty Guidance',
  'Career Counseling & Interview Preparation',
  'Flexible Morning & Evening Batches',
  'Hostel & PG Assistance',
  'Online / Hybrid Video Classes',
];

const DEFAULT_PAYMENT_MODES = [
  'Cash',
  'UPI / QR Code',
  'Debit Card',
  'Credit Card',
  'Net Banking',
  'Cheque / DD',
  'EMI / Installments',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_OPENING_HOURS = {
  Monday: { enabled: true, from: '08:30 AM', to: '08:30 PM', open24h: false },
  Tuesday: { enabled: true, from: '08:30 AM', to: '08:30 PM', open24h: false },
  Wednesday: { enabled: true, from: '08:30 AM', to: '08:30 PM', open24h: false },
  Thursday: { enabled: true, from: '08:30 AM', to: '08:30 PM', open24h: false },
  Friday: { enabled: true, from: '08:30 AM', to: '08:30 PM', open24h: false },
  Saturday: { enabled: true, from: '08:30 AM', to: '08:30 PM', open24h: false },
  Sunday: { enabled: false, from: '09:00 AM', to: '02:00 PM', open24h: false },
};

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
  const [video, setVideo] = useState(initialData?.video || '');
  const [category, setCategory] = useState(initialData?.category || 'Coaching Institute');
  const [customCategory, setCustomCategory] = useState(
    initialData?.category && !POPULAR_CATEGORIES.includes(initialData.category)
      ? initialData.category
      : ''
  );
  const [services, setServices] = useState(
    Array.isArray(initialData?.services) && initialData.services.length > 0
      ? initialData.services
      : (!isEdit ? DEFAULT_SERVICES.slice(0, 6) : [])
  );
  const [newServiceInput, setNewServiceInput] = useState('');
  const [paymentModes, setPaymentModes] = useState(
    Array.isArray(initialData?.paymentMode) && initialData.paymentMode.length > 0
      ? initialData.paymentMode
      : (!isEdit ? ['Cash', 'UPI / QR Code', 'Debit Card', 'Credit Card', 'Net Banking'] : [])
  );
  const [newPaymentModeInput, setNewPaymentModeInput] = useState('');
  const [gallery, setGallery] = useState(
    Array.isArray(initialData?.media)
      ? initialData.media
          .map((m) => (typeof m === 'object' && m ? (m.file || m.url || m.path) : m))
          .filter(Boolean)
      : []
  );
  const [openingHours, setOpeningHours] = useState(() => {
    if (initialData?.openingHours && typeof initialData.openingHours === 'object' && Object.keys(initialData.openingHours).length > 0) {
      const merged = { ...DEFAULT_OPENING_HOURS };
      DAYS.forEach((day) => {
        const d = initialData.openingHours[day];
        if (d && typeof d === 'object') {
          merged[day] = {
            enabled: d.enabled !== false,
            from: d.from || '08:30 AM',
            to: d.to || '08:30 PM',
            open24h: Boolean(d.open24h),
          };
        } else if (typeof d === 'string') {
          merged[day] = {
            enabled: !d.toLowerCase().includes('closed'),
            from: '08:30 AM',
            to: '08:30 PM',
            open24h: d.toLowerCase().includes('24'),
          };
        }
      });
      return merged;
    }
    return DEFAULT_OPENING_HOURS;
  });
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
  const [mediaTarget, setMediaTarget] = useState('cover'); // 'cover' | 'logo' | 'gallery'
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Error and Alert states
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [serverSuccess, setServerSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingDistricts, setFetchingDistricts] = useState(false);

  const showToast = (message, type = 'success') => {
    if (type === 'error') {
      toast.error(message);
    } else if (type === 'warning') {
      toast.warning(message);
    } else if (type === 'info') {
      toast.info(message);
    } else {
      toast.success(message);
    }
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
      setVideo(initialData.video || '');
      setLogo(initialData.logo || '');
      setCover(initialData.cover || '');

      const cat = initialData.category || 'Coaching Institute';
      if (POPULAR_CATEGORIES.includes(cat)) {
        setCategory(cat);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setCustomCategory(cat);
      }

      if (Array.isArray(initialData.services)) {
        setServices(initialData.services);
      }

      if (Array.isArray(initialData.paymentMode)) {
        setPaymentModes(initialData.paymentMode);
      }

      if (initialData.openingHours && typeof initialData.openingHours === 'object') {
        const merged = { ...DEFAULT_OPENING_HOURS };
        DAYS.forEach((day) => {
          const d = initialData.openingHours[day];
          if (d && typeof d === 'object') {
            merged[day] = {
              enabled: d.enabled !== false,
              from: d.from || '08:30 AM',
              to: d.to || '08:30 PM',
              open24h: Boolean(d.open24h),
            };
          } else if (typeof d === 'string') {
            merged[day] = {
              enabled: !d.toLowerCase().includes('closed'),
              from: '08:30 AM',
              to: '08:30 PM',
              open24h: d.toLowerCase().includes('24'),
            };
          }
        });
        setOpeningHours(merged);
      }

      if (Array.isArray(initialData.media)) {
        setGallery(
          initialData.media
            .map((m) => (typeof m === 'object' && m ? (m.file || m.url || m.path) : m))
            .filter(Boolean)
        );
      }

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
    } else if (mediaTarget === 'gallery') {
      if (url && !gallery.includes(url)) {
        setGallery((prev) => [...prev, url]);
      }
    }
    setMediaModalOpen(false);
  };

  // Gallery Helpers
  const removeGalleryImage = (idx) => {
    setGallery((prev) => prev.filter((_, i) => i !== idx));
  };

  // Services Helpers
  const toggleService = (item) => {
    setServices((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]
    );
  };

  const addCustomService = () => {
    const trimmed = newServiceInput.trim();
    if (!trimmed) return;
    if (!services.includes(trimmed)) {
      setServices((prev) => [...prev, trimmed]);
    }
    setNewServiceInput('');
  };

  const removeService = (item) => {
    setServices((prev) => prev.filter((s) => s !== item));
  };

  // Payment Modes Helpers
  const togglePaymentMode = (mode) => {
    setPaymentModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const addCustomPaymentMode = () => {
    const trimmed = newPaymentModeInput.trim();
    if (!trimmed) return;
    if (!paymentModes.includes(trimmed)) {
      setPaymentModes((prev) => [...prev, trimmed]);
    }
    setNewPaymentModeInput('');
  };

  const removePaymentMode = (mode) => {
    setPaymentModes((prev) => prev.filter((s) => s !== mode));
  };

  // Operating Hours Helpers
  const updateDayHours = (day, field, value) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || { enabled: true, from: '08:30 AM', to: '08:30 PM', open24h: false }),
        [field]: value,
      },
    }));
  };

  const applyHoursPreset = (type) => {
    if (type === 'standard') {
      setOpeningHours({
        Monday: { enabled: true, from: '08:30 AM', to: '08:30 PM', open24h: false },
        Tuesday: { enabled: true, from: '08:30 AM', to: '08:30 PM', open24h: false },
        Wednesday: { enabled: true, from: '08:30 AM', to: '08:30 PM', open24h: false },
        Thursday: { enabled: true, from: '08:30 AM', to: '08:30 PM', open24h: false },
        Friday: { enabled: true, from: '08:30 AM', to: '08:30 PM', open24h: false },
        Saturday: { enabled: true, from: '08:30 AM', to: '08:30 PM', open24h: false },
        Sunday: { enabled: false, from: '09:00 AM', to: '02:00 PM', open24h: false },
      });
    } else if (type === 'all7days') {
      const updated = {};
      DAYS.forEach((d) => {
        updated[d] = { enabled: true, from: '08:30 AM', to: '08:30 PM', open24h: false };
      });
      setOpeningHours(updated);
    } else if (type === '24x7') {
      const updated = {};
      DAYS.forEach((d) => {
        updated[d] = { enabled: true, from: '12:00 AM', to: '11:59 PM', open24h: true };
      });
      setOpeningHours(updated);
    } else if (type === 'corporate') {
      const updated = {};
      DAYS.forEach((d) => {
        if (d === 'Saturday' || d === 'Sunday') {
          updated[d] = { enabled: false, from: '09:00 AM', to: '06:00 PM', open24h: false };
        } else {
          updated[d] = { enabled: true, from: '09:00 AM', to: '06:00 PM', open24h: false };
        }
      });
      setOpeningHours(updated);
    }
  };

  const copyMondayToWeekdays = () => {
    const mon = openingHours.Monday || { enabled: true, from: '08:30 AM', to: '08:30 PM', open24h: false };
    setOpeningHours((prev) => ({
      ...prev,
      Tuesday: { ...mon },
      Wednesday: { ...mon },
      Thursday: { ...mon },
      Friday: { ...mon },
      Saturday: { ...mon },
    }));
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

      const resolvedCategory =
        category === 'Other' ? (customCategory.trim() || 'Coaching Institute') : category;

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
        video: video.trim(),
        category: resolvedCategory,
        services: services.map((s) => String(s).trim()).filter(Boolean),
        paymentMode: paymentModes.map((p) => String(p).trim()).filter(Boolean),
        openingHours,
        media: gallery,
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

              {/* Category / Institute Type */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Tag size={12} className="text-[#2271b1]" />
                    <span>Institute Category / Type</span>
                  </span>
                  <span className="text-[10.5px] text-slate-400 font-normal">Badge in profile</span>
                </label>
                <select
                  value={POPULAR_CATEGORIES.includes(category) ? category : 'Other'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Other') {
                      setCategory('Other');
                      if (!customCategory) setCustomCategory('');
                    } else {
                      setCategory(val);
                      setCustomCategory('');
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                >
                  {POPULAR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Other">Other / Custom Category...</option>
                </select>
                {category === 'Other' && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category (e.g. Polytechnic Institute)"
                    className="w-full mt-1.5 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                  />
                )}
              </div>

              {/* Campus Video Tour */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Video size={12} className="text-red-600" />
                    <span>Campus Video Tour</span>
                  </span>
                  <span className="text-[10.5px] text-slate-400 font-normal">YouTube / Embed URL</span>
                </label>
                <input
                  type="url"
                  value={video}
                  onChange={handleFieldChange('video', setVideo)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                />
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

          {/* Section 2: Services Offered */}
          <div className="bg-white border border-slate-200 rounded shadow-2xs p-5 space-y-4">
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>2. Services Offered</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select or add services provided to students (notes, test series, mentorship, batches).
                </p>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                {services.length} Selected
              </span>
            </div>

            {/* Popular Service Chips */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-600">
                Quick Add Popular Services:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_SERVICES.map((s) => {
                  const isSelected = services.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleService(s)}
                      className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-700 font-semibold shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isSelected ? <Check size={11} /> : <Plus size={11} />}
                      <span>{s}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Service Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newServiceInput}
                onChange={(e) => setNewServiceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomService();
                  }
                }}
                placeholder="Add custom service (e.g. Free Interview Mentorship)..."
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
              />
              <button
                type="button"
                onClick={addCustomService}
                className="px-3 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded text-xs font-semibold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus size={13} />
                <span>Add</span>
              </button>
            </div>

            {/* Selected Services Tags */}
            {services.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-700">Active Services:</span>
                  <button
                    type="button"
                    onClick={() => setServices([])}
                    className="text-[10.5px] text-red-600 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {services.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-md border border-emerald-200 group"
                    >
                      <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => removeService(item)}
                        className="text-emerald-600/70 hover:text-red-600 p-0.5 rounded cursor-pointer transition-colors"
                        title="Remove service"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Payment Modes Accepted */}
          <div className="bg-white border border-slate-200 rounded shadow-2xs p-5 space-y-4">
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <CreditCard size={16} className="text-emerald-600" />
                  <span>3. Payment Modes Accepted</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select payment methods accepted for admissions and course fees.
                </p>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                {paymentModes.length} Selected
              </span>
            </div>

            {/* Popular Payment Modes Toggles */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-600">
                Select Accepted Methods:
              </label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_PAYMENT_MODES.map((mode) => {
                  const isSelected = paymentModes.includes(mode);
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => togglePaymentMode(mode)}
                      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-700 font-semibold shadow-2xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      {isSelected ? <Check size={12} /> : <Plus size={12} />}
                      <span>{mode}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Payment Mode Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newPaymentModeInput}
                onChange={(e) => setNewPaymentModeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomPaymentMode();
                  }
                }}
                placeholder="Add custom payment mode (e.g. Demand Draft, Crypto)..."
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
              />
              <button
                type="button"
                onClick={addCustomPaymentMode}
                className="px-3 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded text-xs font-semibold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus size={13} />
                <span>Add</span>
              </button>
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

          {/* 2. Weekly Operating Hours Box */}
          <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
            <div className="bg-[#f6f7f7] border-b border-slate-200 px-3.5 py-2 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Clock size={13} className="text-[#2271b1]" />
                <span>Weekly Operating Hours</span>
              </span>
              <button
                type="button"
                onClick={copyMondayToWeekdays}
                className="text-[10.5px] text-[#2271b1] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                title="Copy Monday timings to Tue - Sat"
              >
                <Copy size={11} />
                <span>Copy Mon</span>
              </button>
            </div>

            <div className="p-3 space-y-2.5">
              {/* Presets Row */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-slate-400 font-medium mr-0.5">Presets:</span>
                <button
                  type="button"
                  onClick={() => applyHoursPreset('standard')}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => applyHoursPreset('all7days')}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                >
                  All 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => applyHoursPreset('24x7')}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                >
                  24x7
                </button>
              </div>

              {/* Days Schedule */}
              <div className="space-y-1.5 divide-y divide-slate-100 pt-0.5">
                {DAYS.map((day) => {
                  const dayData = openingHours[day] || { enabled: true, from: '08:30 AM', to: '08:30 PM', open24h: false };
                  return (
                    <div
                      key={day}
                      className={`pt-1.5 flex flex-col gap-1 p-1.5 rounded transition-colors ${
                        dayData.enabled ? 'bg-slate-50/70' : 'bg-red-50/30'
                      }`}
                    >
                      {/* Top row: Status toggle + Day Name + 24h checkbox */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateDayHours(day, 'enabled', !dayData.enabled)}
                            className={`w-12 py-0.5 text-[9.5px] font-bold rounded uppercase transition-colors text-center cursor-pointer ${
                              dayData.enabled
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-rose-600 text-white hover:bg-rose-700'
                            }`}
                          >
                            {dayData.enabled ? 'Open' : 'Closed'}
                          </button>
                          <span className="text-xs font-bold text-slate-800">{day}</span>
                        </div>

                        {dayData.enabled && (
                          <label className="inline-flex items-center gap-1 text-[10.5px] text-slate-600 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(dayData.open24h)}
                              onChange={(e) => updateDayHours(day, 'open24h', e.target.checked)}
                              className="rounded border-slate-300 text-blue-600 scale-90"
                            />
                            <span>24 Hours</span>
                          </label>
                        )}
                      </div>

                      {/* Bottom row: Time inputs if enabled and not 24h */}
                      {dayData.enabled && !dayData.open24h && (
                        <div className="flex items-center gap-1 pt-0.5">
                          <input
                            type="text"
                            value={dayData.from || ''}
                            onChange={(e) => updateDayHours(day, 'from', e.target.value)}
                            placeholder="08:30 AM"
                            className="flex-1 min-w-0 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[11px] text-slate-800 focus:outline-none focus:border-[#2271b1] text-center"
                          />
                          <span className="text-slate-400 text-[11px] font-semibold">–</span>
                          <input
                            type="text"
                            value={dayData.to || ''}
                            onChange={(e) => updateDayHours(day, 'to', e.target.value)}
                            placeholder="08:30 PM"
                            className="flex-1 min-w-0 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[11px] text-slate-800 focus:outline-none focus:border-[#2271b1] text-center"
                          />
                        </div>
                      )}

                      {!dayData.enabled && (
                        <span className="text-[10px] text-rose-500 font-semibold italic pl-1">
                          Closed all day
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Campus Photo Gallery Box */}
          <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
            <div className="bg-[#f6f7f7] border-b border-slate-200 px-3.5 py-2 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Images size={13} className="text-[#2271b1]" />
                <span>Campus Photo Gallery</span>
              </span>
              <span className="text-[10.5px] font-semibold text-[#2271b1] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {gallery.length} Photos
              </span>
            </div>

            <div className="p-3 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setMediaTarget('gallery');
                  setMediaModalOpen(true);
                }}
                className="w-full py-2 bg-white hover:bg-slate-50 text-slate-700 border-2 border-dashed border-slate-300 hover:border-[#2271b1] rounded text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus size={14} className="text-[#2271b1]" />
                <span>Add Gallery Photos</span>
              </button>

              {gallery.length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-xs space-y-1">
                  <ImageIcon size={22} className="mx-auto text-slate-300" />
                  <p>No campus photos added yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto custom-scrollbar p-1">
                  {gallery.map((imgUrl, idx) => {
                    const full = getImageUrl(imgUrl);
                    return (
                      <div
                        key={idx}
                        className="group relative h-20 bg-slate-100 rounded border border-slate-200 overflow-hidden shadow-2xs"
                      >
                        <img
                          src={full}
                          alt={`Campus ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
                          title="Remove Photo"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 3. Courses Box (Right-aligned Sidebar Meta Box) */}
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
