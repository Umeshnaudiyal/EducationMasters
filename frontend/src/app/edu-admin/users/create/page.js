'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Check,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import AdminLoader from '@/components/admin/AdminLoader';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export default function AddNewUserPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const userRole = (session?.user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const [formData, setFormData] = useState({
    name: '',
    nicename: '',
    email: '',
    phone: '',
    role: 'author', // Default: Writer
    gender: 'Male',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Field refs for auto-focus & smooth scrolling
  const nameRef = useRef(null);
  const nicenameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const roleRef = useRef(null);
  const genderRef = useRef(null);
  const passwordRef = useRef(null);

  const fieldRefs = {
    name: nameRef,
    nicename: nicenameRef,
    username: nicenameRef,
    email: emailRef,
    phone: phoneRef,
    role: roleRef,
    gender: genderRef,
    password: passwordRef,
  };

  const fieldOrder = [
    'name',
    'nicename',
    'email',
    'phone',
    'role',
    'gender',
    'password',
  ];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Field level validator
  const validateField = (fieldName, value, allValues = formData) => {
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
  const validateForm = (data = formData) => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name] || (name === 'nicename' && errors['username'])) {
      const err = validateField(name, value, { ...formData, [name]: value });
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
    const err = validateField(name, value, formData);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Client-Side Validation
    const formErrors = validateForm(formData);
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
      setSubmitting(true);

      const headers = { 'Content-Type': 'application/json' };
      if (session?.user?.accessToken) {
        headers['Authorization'] = `Bearer ${session.user.accessToken}`;
      }

      const res = await fetch(`${BACKEND_URL}/apis/v1/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: formData.name.trim(),
          nicename: formData.nicename.trim() || undefined,
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          role: formData.role,
          gender: formData.gender,
          password: formData.password.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast('User created successfully!', 'success');
        setErrors({});
        setTimeout(() => {
          router.push('/edu-admin/users');
        }, 1000);
      } else {
        if (data.errors && typeof data.errors === 'object') {
          const normalized = normalizeServerErrors(data.errors);
          setErrors(normalized);
          focusFirstInvalidField(normalized);
          showToast(data.message || Object.values(normalized)[0] || 'Validation error from server', 'error');
        } else {
          const errMsg = data.message || 'Failed to create user';
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
      console.error('Error creating user:', err);
      showToast('An unexpected server error occurred', 'error');
    } finally {
      setSubmitting(false);
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

  const passwordStrength = getPasswordStrength(formData.password);

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

  if (status === 'loading') {
    return <AdminLoader />;
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
            You do not have administrative permissions to create new user accounts. Please contact an administrator.
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

  return (
    <div className="w-full space-y-4 font-sans select-none text-slate-800 pb-16">
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New User</h1>
      </div>

      <p className="text-xs text-slate-500">
        Create a brand new user and add it to this site
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

      {/* Form Content (Full Width 2-Column Responsive Layout) */}
      <form onSubmit={handleSubmit} noValidate className="w-full bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-7 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 w-full">
          {/* Column 1: Name Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              name="name"
              required
              value={formData.name}
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

          {/* Column 2: Username Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Username
            </label>
            <input
              ref={nicenameRef}
              type="text"
              name="nicename"
              value={formData.nicename}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. johndoe (optional)"
              className={getInputClass('nicename')}
            />
            <ErrorText fieldName="nicename" />
            <p className="text-[11px] text-slate-500">
              Unique handle for profile url. Leave blank to auto-generate from name.
            </p>
          </div>

          {/* Column 1: Email Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              ref={emailRef}
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. user@educationmasters.in"
              className={getInputClass('email')}
            />
            <ErrorText fieldName="email" />
            <p className="text-[11px] text-slate-500">
              The &quot;email&quot; address of the user. It must be unique.
            </p>
          </div>

          {/* Column 2: Phone Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Phone
            </label>
            <input
              ref={phoneRef}
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. +91 9876543210"
              className={getInputClass('phone')}
            />
            <ErrorText fieldName="phone" />
            <p className="text-[11px] text-slate-500">
              Contact phone number of the user (7-15 digits).
            </p>
          </div>

          {/* Column 1: User Role Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              User Role
            </label>
            <select
              ref={roleRef}
              name="role"
              value={formData.role}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClass('role') + ' cursor-pointer'}
            >
              <option value="author">Writer</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="user">End User</option>
              <option value="institute_admin">Institute Admin</option>
            </select>
            <ErrorText fieldName="role" />
            <p className="text-[11px] text-slate-500">
              Role decides how and what a user will perform action on the panel.
            </p>
          </div>

          {/* Column 2: User Gender */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              User Gender
            </label>
            <select
              ref={genderRef}
              name="gender"
              value={formData.gender}
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
              Gender of the user.
            </p>
          </div>

          {/* Full Width / Col 1: Password Field */}
          <div className="col-span-1 md:col-span-2 space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-800">
              Password <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative w-full max-w-xl">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Leave empty for default initial password (EduPass@123456)"
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
            {formData.password && (
              <div className="max-w-xl space-y-1 pt-1">
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
              You can enter a custom password (min. 6 characters) or leave it blank to assign the default initial password.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-50 text-white text-xs font-semibold rounded shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Creating User...</span>
              </>
            ) : (
              <span>Create User</span>
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
    </div>
  );
}
