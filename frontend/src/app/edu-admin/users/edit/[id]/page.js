'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Check,
  AlertCircle,
  RefreshCw,
  User as UserIcon,
  Image as ImageIcon,
  Eye,
  EyeOff,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import MediaLibraryModal from '@/components/admin/MediaLibraryModal';
import { getImageUrl } from '@/utils/image';
import AdminLoader from '@/components/admin/AdminLoader';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export default function EditUserPage({ params }) {
  const resolvedParams = use(params);
  const userId = resolvedParams?.id;

  const router = useRouter();
  const { data: session, status } = useSession();

  const userRole = (session?.user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const isLoadedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Field refs for auto-focus & smooth scrolling
  const nameRef = useRef(null);
  const nicenameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const genderRef = useRef(null);
  const roleRef = useRef(null);
  const activeRef = useRef(null);
  const websiteRef = useRef(null);
  const twitterRef = useRef(null);
  const facebookRef = useRef(null);
  const instagramRef = useRef(null);
  const linkedinRef = useRef(null);
  const youtubeRef = useRef(null);
  const passwordRef = useRef(null);
  const bioRef = useRef(null);
  const imageRef = useRef(null);

  const fieldRefs = {
    name: nameRef,
    nicename: nicenameRef,
    username: nicenameRef,
    email: emailRef,
    phone: phoneRef,
    gender: genderRef,
    role: roleRef,
    active: activeRef,
    website: websiteRef,
    twitter: twitterRef,
    facebook: facebookRef,
    instagram: instagramRef,
    linkedin: linkedinRef,
    youtube: youtubeRef,
    password: passwordRef,
    bio: bioRef,
    image: imageRef,
  };

  const fieldOrder = [
    'name',
    'nicename',
    'email',
    'phone',
    'gender',
    'role',
    'active',
    'website',
    'twitter',
    'facebook',
    'instagram',
    'linkedin',
    'youtube',
    'password',
    'bio',
    'image',
  ];

  const [user, setUser] = useState({
    name: '',
    nicename: '',
    gender: 'Male',
    email: '',
    phone: '',
    role: 'author',
    active: 1,
    image: '',
    website: '',
    twitter: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    bio: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Field level validator
  const validateField = (fieldName, value, allValues = user) => {
    switch (fieldName) {
      case 'name': {
        const v = String(value || '').trim();
        if (!v) return 'Name is required';
        if (v.length < 2) return 'Name must be at least 2 characters long';
        if (v.length > 100) return 'Name cannot exceed 100 characters';
        return '';
      }
      case 'nicename':
      case 'username': {
        const v = String(value || '').trim();
        if (v && !/^[a-zA-Z0-9_.-]+$/.test(v)) {
          return 'Username can only contain letters, numbers, hyphens, and underscores';
        }
        if (v.length > 100) return 'Username cannot exceed 100 characters';
        return '';
      }
      case 'email': {
        const v = String(value || '').trim();
        if (!v) return 'Email address is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(v)) return 'Please enter a valid email address (e.g. name@example.com)';
        if (v.length > 150) return 'Email cannot exceed 150 characters';
        return '';
      }
      case 'phone': {
        const v = String(value || '').trim();
        if (v && !/^[+]?[\d\s-]{7,15}$/.test(v)) {
          return 'Please enter a valid phone number (7-15 digits, optional + prefix)';
        }
        return '';
      }
      case 'password': {
        const v = String(value || '');
        if (v && v.length < 6) {
          return 'Password must be at least 6 characters long';
        }
        return '';
      }
      case 'website': {
        const v = String(value || '').trim();
        if (v && !/^(https?:\/\/)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})([/a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)*\/?$/i.test(v)) {
          return 'Please enter a valid website URL (e.g. https://example.com)';
        }
        return '';
      }
      case 'twitter': {
        const v = String(value || '').trim();
        if (v && !/^(https?:\/\/)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})([/a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)*\/?$/i.test(v)) {
          return 'Please enter a valid Twitter/X profile link (e.g. https://twitter.com/username)';
        }
        return '';
      }
      case 'facebook': {
        const v = String(value || '').trim();
        if (v && !/^(https?:\/\/)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})([/a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)*\/?$/i.test(v)) {
          return 'Please enter a valid Facebook profile link (e.g. https://facebook.com/username)';
        }
        return '';
      }
      case 'instagram': {
        const v = String(value || '').trim();
        if (v && !/^(https?:\/\/)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})([/a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)*\/?$/i.test(v)) {
          return 'Please enter a valid Instagram profile link (e.g. https://instagram.com/username)';
        }
        return '';
      }
      case 'linkedin': {
        const v = String(value || '').trim();
        if (v && !/^(https?:\/\/)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})([/a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)*\/?$/i.test(v)) {
          return 'Please enter a valid LinkedIn profile link (e.g. https://linkedin.com/in/username)';
        }
        return '';
      }
      case 'youtube': {
        const v = String(value || '').trim();
        if (v && !/^(https?:\/\/)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})([/a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)*\/?$/i.test(v)) {
          return 'Please enter a valid YouTube channel URL (e.g. https://youtube.com/@channel)';
        }
        return '';
      }
      case 'bio': {
        const v = String(value || '');
        if (v.length > 1500) {
          return 'Bio cannot exceed 1500 characters';
        }
        return '';
      }
      default:
        return '';
    }
  };

  const normalizeServerErrors = (serverErrors) => {
    if (!serverErrors || typeof serverErrors !== 'object') return {};
    const normalized = {};
    for (const [key, val] of Object.entries(serverErrors)) {
      const errorMsg = typeof val === 'string' ? val : val?.message || String(val);
      if (key === 'username') {
        normalized.nicename = errorMsg;
      } else if (key === 'user_email') {
        normalized.email = errorMsg;
      } else if (key === 'user_phone' || key === 'phoneNumber') {
        normalized.phone = errorMsg;
      } else if (key === 'pass' || key === 'newPassword') {
        normalized.password = errorMsg;
      } else {
        normalized[key] = errorMsg;
      }
    }
    return normalized;
  };

  // Full form validator
  const validateForm = (data = user) => {
    const newErrors = {};
    for (const field of fieldOrder) {
      const err = validateField(field, data[field], data);
      if (err) {
        newErrors[field] = err;
      }
    }
    return newErrors;
  };

  // Focus and scroll to first invalid ref
  const focusFirstInvalidField = (errs) => {
    for (const field of fieldOrder) {
      if ((errs[field] || (field === 'nicename' && errs['username'])) && fieldRefs[field]?.current) {
        fieldRefs[field].current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        fieldRefs[field].current.focus();
        break;
      }
    }
  };

  useEffect(() => {
    if (!userId || isLoadedRef.current || !isAdmin) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const headers = {};
        if (session?.user?.accessToken) {
          headers['Authorization'] = `Bearer ${session.user.accessToken}`;
        }
        if (session?.user?.id) {
          headers['x-user-id'] = session.user.id;
        }

        const res = await fetch(`${BACKEND_URL}/apis/v1/users/${userId}`, { headers });
        const data = await res.json();

        if (data.success && data.data) {
          const u = data.data;
          setUser({
            name: u.name || '',
            nicename: u.nicename || '',
            gender: u.gender || 'Male',
            email: u.email || '',
            phone: u.phone || '',
            role: u.role || 'author',
            active: u.active !== undefined ? u.active : 1,
            image: u.image || '',
            website: u.website || '',
            twitter: u.twitter || '',
            facebook: u.facebook || '',
            instagram: u.instagram || '',
            linkedin: u.linkedin || '',
            youtube: u.youtube || '',
            bio: u.bio || '',
            password: '',
          });
          isLoadedRef.current = true;
        } else {
          showToast(data.message || 'User not found', 'error');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        showToast('Failed to load user details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, session?.user?.accessToken, session?.user?.id, isAdmin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));

    if (errors[name] || (name === 'nicename' && errors['username'])) {
      const err = validateField(name, value, { ...user, [name]: value });
      setErrors((prev) => ({
        ...prev,
        [name]: err,
        ...(name === 'nicename' ? { username: '' } : {}),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value, user);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleMediaSelect = (mediaItem) => {
    if (mediaItem) {
      let selectedPath = '';
      if (typeof mediaItem === 'string') {
        selectedPath = mediaItem;
      } else if (mediaItem.file) {
        selectedPath = mediaItem.file;
      } else if (mediaItem.path && mediaItem.name) {
        const cleanPath = mediaItem.path.endsWith('/') ? mediaItem.path.slice(0, -1) : mediaItem.path;
        selectedPath = `${cleanPath}/${mediaItem.name}`;
      } else if (mediaItem.url) {
        selectedPath = mediaItem.url;
      } else {
        selectedPath = getImageUrl(mediaItem);
      }

      setUser((prev) => ({ ...prev, image: selectedPath }));
      if (errors.image) {
        setErrors((prev) => ({ ...prev, image: '' }));
      }
    }
    setShowMediaModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Client-Side Validation
    const formErrors = validateForm(user);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      const touchedMap = {};
      Object.keys(formErrors).forEach((k) => {
        touchedMap[k] = true;
      });
      setTouched((prev) => ({ ...prev, ...touchedMap }));

      focusFirstInvalidField(formErrors);
      showToast(Object.values(formErrors)[0] || 'Please fix the highlighted errors before submitting', 'error');
      return;
    }

    try {
      setSaving(true);
      const headers = { 'Content-Type': 'application/json' };
      if (session?.user?.accessToken) {
        headers['Authorization'] = `Bearer ${session.user.accessToken}`;
      }
      if (session?.user?.id) {
        headers['x-user-id'] = session.user.id;
      }

      const payload = {
        name: user.name.trim(),
        nicename: user.nicename.trim(),
        gender: user.gender,
        email: user.email.trim(),
        phone: user.phone ? user.phone.trim() : '',
        role: user.role,
        active: Number(user.active),
        image: user.image || '',
        website: user.website || '',
        twitter: user.twitter || '',
        facebook: user.facebook || '',
        instagram: user.instagram || '',
        linkedin: user.linkedin || '',
        youtube: user.youtube || '',
        bio: user.bio || '',
      };

      if (user.password && user.password.trim()) {
        payload.password = user.password.trim();
      }

      const res = await fetch(`${BACKEND_URL}/apis/v1/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('User updated successfully!', 'success');
        setUser((prev) => ({ ...prev, password: '' }));
        setErrors({});
      } else {
        if (data.errors && typeof data.errors === 'object') {
          const normalized = normalizeServerErrors(data.errors);
          setErrors(normalized);
          focusFirstInvalidField(normalized);
          showToast(data.message || Object.values(normalized)[0] || 'Validation error from server', 'error');
        } else {
          const errMsg = data.message || 'Failed to update user';
          const lowerMsg = errMsg.toLowerCase();
          const fallbackErrors = {};
          if (lowerMsg.includes('username') || lowerMsg.includes('nicename')) {
            fallbackErrors.nicename = errMsg;
          } else if (lowerMsg.includes('email')) {
            fallbackErrors.email = errMsg;
          } else if (lowerMsg.includes('name')) {
            fallbackErrors.name = errMsg;
          } else if (lowerMsg.includes('password')) {
            fallbackErrors.password = errMsg;
          } else if (lowerMsg.includes('phone')) {
            fallbackErrors.phone = errMsg;
          }

          if (Object.keys(fallbackErrors).length > 0) {
            setErrors(fallbackErrors);
            focusFirstInvalidField(fallbackErrors);
          }
          showToast(errMsg, 'error');
        }
      }
    } catch (err) {
      console.error('Error updating user:', err);
      showToast('An unexpected server error occurred', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return null;
    if (pass.length < 6) return { label: 'Too short (min 6 chars)', color: 'text-red-500', bar: 'w-1/4 bg-red-500' };
    if (pass.length < 8) return { label: 'Fair', color: 'text-amber-500', bar: 'w-2/4 bg-amber-500' };
    const hasNumber = /\d/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    if (hasNumber && hasSpecial) return { label: 'Strong', color: 'text-emerald-600', bar: 'w-full bg-emerald-500' };
    return { label: 'Good', color: 'text-blue-500', bar: 'w-3/4 bg-blue-500' };
  };

  const passwordStrength = getPasswordStrength(user.password);
  const previewUrl = user.image ? getImageUrl(user.image) : null;

  const getInputClass = (fieldName) => {
    const hasError = Boolean(errors[fieldName] || (fieldName === 'nicename' && errors['username']));
    return `w-full px-3 py-2 bg-white border rounded text-xs text-slate-800 transition-all ${
      hasError
        ? 'border-red-500 ring-2 ring-red-400/30 bg-red-50/20 focus:border-red-600 focus:ring-2 focus:ring-red-400 focus:outline-none'
        : 'border-slate-300 focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]'
    }`;
  };

  const ErrorText = ({ fieldName }) => {
    const msg = errors[fieldName] || (fieldName === 'nicename' ? errors['username'] : null);
    if (!msg) return null;
    return (
      <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-red-600 animate-fadeIn">
        <AlertCircle size={13} className="shrink-0 text-red-500" />
        <span>{msg}</span>
      </div>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="w-full py-16 flex items-center justify-center">
        <AdminLoader
          text="Loading User Profile..."
          subtext="Fetching user records, permissions, and roles"
          minHeight="min-h-[400px]"
        />
      </div>
    );
  }

  if (status === 'authenticated' && !isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="max-w-md w-full bg-white rounded-xl border border-red-100 shadow-sm p-8 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500 mb-4 shadow-2xs">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">Access Restricted</h1>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            You do not have administrative permissions to edit user accounts. Please contact an administrator.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/edu-admin"
              className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-semibold rounded shadow-2xs transition-colors"
            >
              Return to Dashboard
            </Link>
            <Link
              href="/edu-admin/profile"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300 transition-colors"
            >
              My Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const bioWordCount = user.bio ? user.bio.trim().split(/\s+/).filter(Boolean).length : 0;
  const bioCharCount = user.bio ? user.bio.length : 0;

  return (
    <div className="w-full space-y-4 font-sans select-none text-slate-800 pb-20">
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

      {/* Header with Aligned Back Button */}
      <div className="flex items-center gap-3">
        <Link
          href="/edu-admin/users"
          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-2xs"
        >
          <ArrowLeft size={13} />
          <span>Back</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit User</h1>
      </div>

      <p className="text-xs text-slate-500">
        Update user profile, credentials, role permissions, and contact details
      </p>

      {/* Form Error Banner if multiple validation errors exist */}
      {Object.keys(errors).length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Please correct the {Object.keys(errors).length} invalid field(s) below:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-red-600">
              {Object.entries(errors).map(([field, msg]) => (
                <li key={field}>
                  <strong className="capitalize">{field === 'nicename' ? 'Username' : field}</strong>: {msg}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Full-Width 2-Column Responsive Form */}
      <form onSubmit={handleSubmit} noValidate className="w-full bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-7 shadow-2xs">
        {/* Profile Picture Box (Full width row) */}
        <div className="flex flex-col sm:flex-row items-start gap-6 pb-6 border-b border-slate-100 w-full">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-lg bg-slate-100 border-2 border-slate-300 shrink-0 overflow-hidden flex items-center justify-center relative group shadow-2xs">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  if (!e.currentTarget.dataset.fallback) {
                    e.currentTarget.dataset.fallback = 'true';
                    e.currentTarget.src = '/logo.webp';
                  } else {
                    e.currentTarget.style.display = 'none';
                  }
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <UserIcon size={52} className="text-slate-400" />
              </div>
            )}
          </div>

          <div className="space-y-3 flex-1 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMediaModal(true)}
                className="px-3.5 py-1.5 bg-[#f0f0f1] hover:bg-[#dcdcde] text-[#2c3338] text-xs font-semibold rounded border border-[#8c8f94] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ImageIcon size={14} />
                <span>Choose File / Media</span>
              </button>

              {user.image && (
                <button
                  type="button"
                  onClick={() => {
                    setUser((prev) => ({ ...prev, image: '' }));
                    if (errors.image) setErrors((prev) => ({ ...prev, image: '' }));
                  }}
                  className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-red-200 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              Set the user profile picture (250x250 pixel)
            </p>

            <div className="pt-1 w-full max-w-2xl">
              <input
                ref={imageRef}
                type="text"
                name="image"
                value={user.image}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Or direct image URL (e.g., assets/img/... or https://...)"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 font-mono focus:outline-none focus:border-[#2271b1]"
              />
              <ErrorText fieldName="image" />
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Form Fields Grid (Spans whole width) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 w-full">
          {/* Column 1: Name* */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              name="name"
              required
              value={user.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. John Doe"
              className={getInputClass('name')}
            />
            <ErrorText fieldName="name" />
            <p className="text-[11px] text-slate-500">
              The name of user which will appear on your site.
            </p>
          </div>

          {/* Column 2: Username */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Username
            </label>
            <input
              ref={nicenameRef}
              type="text"
              name="nicename"
              value={user.nicename}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. johndoe"
              className={getInputClass('nicename')}
            />
            <ErrorText fieldName="nicename" />
            <p className="text-[11px] text-slate-500">
              The username is unique and is used to identify users on public url.
            </p>
          </div>

          {/* Column 1: Email* */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              ref={emailRef}
              type="email"
              name="email"
              required
              value={user.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. user@educationmasters.in"
              className={getInputClass('email')}
            />
            <ErrorText fieldName="email" />
            <p className="text-[11px] text-slate-500">
              The unique &quot;email&quot; address of the user.
            </p>
          </div>

          {/* Column 2: Phone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Phone
            </label>
            <input
              ref={phoneRef}
              type="tel"
              name="phone"
              value={user.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. +91 9876543210"
              className={getInputClass('phone')}
            />
            <ErrorText fieldName="phone" />
            <p className="text-[11px] text-slate-500">
              The unique &quot;phone&quot; number of the user (7-15 digits).
            </p>
          </div>

          {/* Column 1: User Gender */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              User Gender
            </label>
            <select
              ref={genderRef}
              name="gender"
              value={user.gender}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClass('gender') + ' cursor-pointer'}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <ErrorText fieldName="gender" />
            <p className="text-[11px] text-slate-500">
              The gender of the user.
            </p>
          </div>

          {/* Column 2: User Role* */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              User Role <span className="text-red-500">*</span>
            </label>
            <select
              ref={roleRef}
              name="role"
              value={user.role}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClass('role') + ' cursor-pointer'}
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="author">Writer</option>
              <option value="user">End User</option>
              <option value="institute_admin">Institute Admin</option>
            </select>
            <ErrorText fieldName="role" />
            <p className="text-[11px] text-slate-500">
              Role decides how and what a user will perform action on the panel.
            </p>
          </div>

          {/* Column 1: Status */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Status
            </label>
            <select
              ref={activeRef}
              name="active"
              value={user.active}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClass('active') + ' cursor-pointer'}
            >
              <option value={1}>Active</option>
              <option value={0}>Deactive</option>
            </select>
            <ErrorText fieldName="active" />
            <p className="text-[11px] text-slate-500">
              Status if whether user is active or deactivated.
            </p>
          </div>

          {/* Column 2: Website Link */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Website Link
            </label>
            <input
              ref={websiteRef}
              type="url"
              name="website"
              value={user.website}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://example.com"
              className={getInputClass('website')}
            />
            <ErrorText fieldName="website" />
            <p className="text-[11px] text-slate-500">
              User&apos;s website link.
            </p>
          </div>

          {/* Column 1: Twitter Profile */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Twitter Profile
            </label>
            <input
              ref={twitterRef}
              type="text"
              name="twitter"
              value={user.twitter}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://www.twitter.com/username"
              className={getInputClass('twitter')}
            />
            <ErrorText fieldName="twitter" />
            <p className="text-[11px] text-slate-500">
              https://www.twitter.com/ User&apos;s Twitter profile id.
            </p>
          </div>

          {/* Column 2: Facebook Profile */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Facebook Profile
            </label>
            <input
              ref={facebookRef}
              type="text"
              name="facebook"
              value={user.facebook}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://www.facebook.com/username"
              className={getInputClass('facebook')}
            />
            <ErrorText fieldName="facebook" />
            <p className="text-[11px] text-slate-500">
              https://www.facebook.com/ User&apos;s Facebook profile id.
            </p>
          </div>

          {/* Column 1: Instagram Profile */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Instagram Profile
            </label>
            <input
              ref={instagramRef}
              type="text"
              name="instagram"
              value={user.instagram}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://www.instagram.com/username"
              className={getInputClass('instagram')}
            />
            <ErrorText fieldName="instagram" />
            <p className="text-[11px] text-slate-500">
              https://www.instagram.com/ User&apos;s Instagram profile id.
            </p>
          </div>

          {/* Column 2: LinkedIn Profile */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              LinkedIn Profile
            </label>
            <input
              ref={linkedinRef}
              type="text"
              name="linkedin"
              value={user.linkedin}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://www.linkedin.com/in/username"
              className={getInputClass('linkedin')}
            />
            <ErrorText fieldName="linkedin" />
            <p className="text-[11px] text-slate-500">
              https://www.linkedin.com/in/ User&apos;s LinkedIn profile id.
            </p>
          </div>

          {/* Column 1: Youtube Channel ID */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Youtube Channel ID
            </label>
            <input
              ref={youtubeRef}
              type="text"
              name="youtube"
              value={user.youtube}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://www.youtube.com/channel/..."
              className={getInputClass('youtube')}
            />
            <ErrorText fieldName="youtube" />
            <p className="text-[11px] text-slate-500">
              https://www.youtube.com/channel/ User&apos;s Youtube channel id.
            </p>
          </div>

          {/* Column 2: Password (Optional for Admin Reset) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Set New Password <span className="text-slate-400 font-normal">(Leave blank to keep unchanged)</span>
            </label>
            <div className="relative w-full">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={user.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter new password"
                className={getInputClass('password') + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {/* Password strength indicator */}
            {user.password && (
              <div className="space-y-1 pt-1">
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${passwordStrength?.bar}`} />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Strength:</span>
                  <span className={`font-semibold ${passwordStrength?.color}`}>{passwordStrength?.label}</span>
                </div>
              </div>
            )}
            <ErrorText fieldName="password" />
            <p className="text-[11px] text-slate-500">
              Leave blank if you do not wish to change this user&apos;s password (min. 6 characters).
            </p>
          </div>

          {/* Full Width Row (Col-span-2): About Me */}
          <div className="col-span-1 md:col-span-2 space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-800">
                About Me
              </label>
              <span className={`text-[11px] ${bioCharCount > 1500 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                {bioWordCount} words ({bioCharCount} / 1500 chars)
              </span>
            </div>
            <textarea
              ref={bioRef}
              name="bio"
              rows={4}
              value={user.bio}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Optional bio or summary..."
              className={getInputClass('bio') + ' resize-y'}
            />
            <ErrorText fieldName="bio" />
            <p className="text-[11px] text-slate-500">
              Optional brief info about user in max. 250 words. If provided will be shown at author page.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-50 text-white text-xs font-semibold rounded shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Updating User...</span>
              </>
            ) : (
              <span>Update Profile</span>
            )}
          </button>

          <Link
            href="/edu-admin/users"
            className="px-5 py-2.5 bg-[#f0f0f1] hover:bg-[#dcdcde] text-[#2c3338] text-xs font-semibold rounded border border-[#8c8f94] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSelect={handleMediaSelect}
        targetType="featured"
      />
    </div>
  );
}
