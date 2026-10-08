'use client';

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  AnimatedUser,
  AnimatedPhone,
  AnimatedMail,
  AnimatedSend,
  AnimatedCheckCircle,
} from './AnimatedIcons';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function SubscriptionBanner({
  title = 'Get Latest Update (like G.K, Latest Job, Exam Alert, Study Material, Previous year papers etc)',
  subtitle = 'on your Email and Whatsapp',
  interest = 'All Updates (GK, Jobs, Exams, Study Material)',
  variant = 'dark', // 'dark' | 'card' | 'minimal'
  className = '',
}) {
  const { showToast } = useToast();

  const containerRef = useRef(null);
  const illuRef = useRef(null);
  const textRef = useRef(null);
  const formRef = useRef(null);
  const buttonRef = useRef(null);

  // Field element refs for GSAP shake animation
  const nameBoxRef = useRef(null);
  const whatsappBoxRef = useRef(null);
  const emailBoxRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    email: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    whatsapp: '',
    email: '',
  });

  const [touched, setTouched] = useState({
    name: false,
    whatsapp: false,
    email: false,
  });

  const [status, setStatus] = useState({
    loading: false,
    success: false,
    error: '',
    message: '',
  });

  // Validation helper
  const validateField = (name, value) => {
    const val = (value || '').trim();

    if (name === 'name') {
      if (!val) return 'Full name is required';
      if (val.length < 2) return 'Min 2 characters required';
      return '';
    }

    if (name === 'whatsapp') {
      if (!val) return 'WhatsApp number is required';
      const cleanPhone = val.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return 'Mobile number must be exactly 10 digits';
      }
      return '';
    }

    if (name === 'email') {
      if (!val) return 'Email address is required';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        return 'Enter a valid email address';
      }
      return '';
    }

    return '';
  };

  // GSAP Shake animation for invalid fields
  const shakeElement = (element) => {
    if (!element) return;
    gsap.fromTo(
      element,
      { x: -5 },
      {
        x: 5,
        duration: 0.08,
        repeat: 4,
        yoyo: true,
        ease: 'power1.inOut',
        clearProps: 'x',
      }
    );
  };

  // GSAP Scroll Slide-To-Show & Ambient Floating Animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Slide in left column from Left
            if (illuRef.current && textRef.current) {
              gsap.fromTo(
                [illuRef.current, textRef.current],
                { x: -30, opacity: 0 },
                {
                  x: 0,
                  opacity: 1,
                  stagger: 0.1,
                  duration: 0.5,
                  ease: 'power3.out',
                  clearProps: 'transform,opacity',
                }
              );
            }

            // Slide in form from Right
            if (formRef.current) {
              gsap.fromTo(
                formRef.current,
                { x: 30, opacity: 0 },
                {
                  x: 0,
                  opacity: 1,
                  duration: 0.5,
                  ease: 'power3.out',
                  clearProps: 'transform,opacity',
                }
              );
            }

            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Subtle ambient floating animation for character & mail illustration
    if (illuRef.current) {
      gsap.to(illuRef.current, {
        y: -4,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }

    return () => observer.disconnect();
  }, []);

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Mobile/WhatsApp: Only allow numeric digits and enforce max 10 characters
    if (name === 'whatsapp') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Dynamically clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (status.error) {
      setStatus((prev) => ({ ...prev, error: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errorMsg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all as touched
    setTouched({ name: true, whatsapp: true, email: true });

    // Validate all required fields
    const nameError = validateField('name', formData.name);
    const whatsappError = validateField('whatsapp', formData.whatsapp);
    const emailError = validateField('email', formData.email);

    const validationErrors = {
      name: nameError,
      whatsapp: whatsappError,
      email: emailError,
    };

    setErrors(validationErrors);

    // If any field has validation error, shake the invalid field(s) & stop
    if (nameError || whatsappError || emailError) {
      if (nameError && nameBoxRef.current) shakeElement(nameBoxRef.current);
      if (whatsappError && whatsappBoxRef.current) shakeElement(whatsappBoxRef.current);
      if (emailError && emailBoxRef.current) shakeElement(emailBoxRef.current);

      setStatus({
        loading: false,
        success: false,
        error: '',
        message: '',
      });
      return;
    }

    setStatus({ loading: true, error: '', success: false, message: '' });

    try {
      const baseUrl = typeof window !== 'undefined'
        ? ''
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001');
      const cleanMobile = formData.whatsapp.replace(/\D/g, '').slice(0, 10);

      const res = await fetch(`${baseUrl}/apis/v1/subscribers/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: cleanMobile,
          whatsapp: cleanMobile,
          email: formData.email.trim().toLowerCase(),
          interest,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const subscriberName = formData.name.trim();

        // 1. Trigger Universal Right-Side Professional Animated Toast
        showToast({
          type: 'success',
          title: '🎉 Subscription Confirmed!',
          message: `Welcome, ${subscriberName}! You'll now receive timely GK, job alerts, and study notes on Email & WhatsApp.`,
          badge: 'Active',
          duration: 6000,
        });

        // 2. Update inline banner status
        setStatus({
          loading: false,
          success: true,
          error: '',
          message: data.message || 'Successfully subscribed to updates!',
        });

        // 3. Clear form inputs and errors
        setFormData({ name: '', whatsapp: '', email: '' });
        setErrors({ name: '', whatsapp: '', email: '' });
        setTouched({ name: false, whatsapp: false, email: false });
      } else {
        // Handle field-specific unique/conflict errors from backend
        if (data.field) {
          setErrors((prev) => ({ ...prev, [data.field]: data.message }));
          if (data.field === 'email' && emailBoxRef.current) shakeElement(emailBoxRef.current);
          if (data.field === 'whatsapp' && whatsappBoxRef.current) shakeElement(whatsappBoxRef.current);
          if (data.field === 'name' && nameBoxRef.current) shakeElement(nameBoxRef.current);
        }
        throw new Error(data.message || 'Subscription failed. Please try again.');
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to connect. Please try again later.';
      setStatus({
        loading: false,
        success: false,
        error: '',
        message: '',
      });

      // Show professional right-side error toast
      showToast({
        type: 'error',
        title: 'Subscription Alert',
        message: errorMsg,
        duration: 5000,
      });
    }
  };

  return (
    <section
      ref={containerRef}
      className={`w-full relative bg-[#1c2c3d] text-white border-y border-slate-700/60 shadow-inner ${
        variant === 'card'
          ? 'rounded-2xl border border-slate-700 shadow-2xl max-w-7xl mx-auto my-6 overflow-hidden'
          : ''
      } ${className}`}
    >
      {/* Ambient background glow & glass highlights */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,#38bdf8,transparent)]" />
      <div className="absolute right-0 bottom-0 w-80 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 relative z-10">
        {status.success ? (
          /* Success State */
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-5 py-3.5 text-center sm:text-left transition-all shadow-lg shadow-emerald-950/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <AnimatedCheckCircle size={22} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-200 flex items-center gap-1.5 justify-center sm:justify-start">
                  <span>🎉</span> {status.message}
                </p>
                <p className="text-xs text-emerald-300/80 mt-0.5">
                  You will now receive timely alerts, study notes &amp; exam updates directly.
                </p>
              </div>
            </div>
            <button
              onClick={() => setStatus({ loading: false, success: false, error: '', message: '' })}
              className="text-xs font-medium text-emerald-300 hover:text-white bg-emerald-900/50 hover:bg-emerald-800/70 px-4 py-2 rounded-lg border border-emerald-500/40 transition-all cursor-pointer hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              Subscribe another
            </button>
          </div>
        ) : (
          /* Main Form Layout */
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4 lg:gap-6">
            {/* Left Column: Vector Illustration + Text Headlines */}
            <div className="flex items-center gap-3 sm:gap-3.5 shrink-0 w-full lg:w-auto">
              {/* Envelope & Girl Graphic (Compact Vector Illustration with GSAP float) */}
              <div
                ref={illuRef}
                className="hidden sm:flex items-center justify-center shrink-0 w-20 h-14 lg:w-24 lg:h-16"
              >
                <svg
                  viewBox="0 0 160 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full drop-shadow-md"
                >
                  {/* Envelope Base */}
                  <rect
                    x="8"
                    y="24"
                    width="85"
                    height="58"
                    rx="5"
                    fill="#f8fafc"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  />

                  {/* Flap & Fold Lines */}
                  <path
                    d="M9 25 L50.5 58 L92 25"
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="#f1f5f9"
                  />
                  <path
                    d="M9 81 L38 52"
                    stroke="#e2e8f0"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M92 81 L63 52"
                    stroke="#e2e8f0"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />

                  {/* Gold Button Seal */}
                  <circle
                    cx="50.5"
                    cy="58"
                    r="7"
                    fill="#f59e0b"
                    stroke="#d97706"
                    strokeWidth="1.2"
                  />
                  <circle cx="50.5" cy="58" r="3.5" fill="#fef08a" />

                  {/* Notification stamp */}
                  <rect
                    x="16"
                    y="70"
                    width="14"
                    height="3"
                    rx="1.5"
                    fill="#38bdf8"
                  />
                  <rect
                    x="16"
                    y="75"
                    width="8"
                    height="2"
                    rx="1"
                    fill="#94a3b8"
                  />

                  {/* Girl Character */}
                  {/* Hair */}
                  <path
                    d="M120 28 C120 20, 134 16, 137 25 C141 28, 147 34, 144 42 C140 45, 133 43, 129 40 C127 42, 123 44, 120 40 C117 35, 118 30, 120 28 Z"
                    fill="#0f172a"
                  />
                  <path
                    d="M137 24 C145 22, 151 28, 149 37 C147 42, 143 44, 139 40"
                    fill="#0f172a"
                  />

                  {/* Face */}
                  <circle cx="127" cy="32" r="5.5" fill="#fcd34d" />

                  {/* Yellow Shirt */}
                  <path
                    d="M122 38 L133 38 L136 58 L119 58 Z"
                    fill="#f59e0b"
                  />

                  {/* Left Arm holding Envelope */}
                  <path
                    d="M122 41 L96 49 L98 52 L124 44 Z"
                    fill="#fcd34d"
                  />
                  <path
                    d="M122 39 L118 46 L124 47 Z"
                    fill="#f59e0b"
                  />
                  <circle cx="95" cy="50" r="2.5" fill="#fcd34d" />

                  {/* Navy Trousers */}
                  <path
                    d="M121 58 L125 86 L122 86 L118 58 Z"
                    fill="#0f172a"
                  />
                  <path
                    d="M134 58 L130 86 L133 86 L136 58 Z"
                    fill="#0f172a"
                  />

                  {/* Shoes */}
                  <ellipse
                    cx="123"
                    cy="87"
                    rx="3"
                    ry="1.5"
                    fill="#334155"
                  />
                  <ellipse
                    cx="132"
                    cy="87"
                    rx="3"
                    ry="1.5"
                    fill="#334155"
                  />
                </svg>
              </div>

              {/* Title & Subtitle */}
              <div ref={textRef} className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug">
                  {title}
                </h3>
                <p className="text-xs text-slate-300">
                  on your{' '}
                  <strong className="text-white font-bold">Email</strong> and{' '}
                  <strong className="text-white font-bold">Whatsapp</strong>
                </p>
              </div>
            </div>

            {/* Right Column: Inline Inputs with In-Field Validation Errors */}
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2.5 w-full lg:w-auto flex-1 lg:max-w-2xl justify-end"
            >
              {/* 1. Name Input */}
              <div
                ref={nameBoxRef}
                className="sub-input-box group relative flex-1 min-w-[130px]"
              >
                <div className="relative">
                  <div
                    className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${
                      errors.name
                        ? 'text-rose-500'
                        : 'text-slate-400 group-focus-within:text-emerald-600'
                    }`}
                  >
                    <AnimatedUser size={15} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter full name *"
                    aria-required="true"
                    aria-invalid={!!errors.name}
                    className={`w-full text-slate-900 placeholder:text-slate-400 text-xs rounded-md pl-8 pr-3 py-2 border outline-none transition-all shadow-xs ${
                      errors.name
                        ? 'bg-rose-50/95 border-rose-500 text-rose-950 focus:ring-2 focus:ring-rose-400/40'
                        : 'bg-white border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                {/* In-field error message */}
                {errors.name && (
                  <div className="flex items-center gap-1 text-[11px] font-medium text-rose-300 mt-1 pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <AlertCircle size={11} className="shrink-0 text-rose-400" />
                    <span className="leading-tight">{errors.name}</span>
                  </div>
                )}
              </div>

              {/* 2. WhatsApp Number Input */}
              <div
                ref={whatsappBoxRef}
                className="sub-input-box group relative flex-1 min-w-[145px]"
              >
                <div className="relative">
                  <div
                    className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${
                      errors.whatsapp
                        ? 'text-rose-500'
                        : 'text-slate-400 group-focus-within:text-emerald-600'
                    }`}
                  >
                    <AnimatedPhone size={15} />
                  </div>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={10}
                    inputMode="numeric"
                    placeholder="10-digit Mobile *"
                    aria-required="true"
                    aria-invalid={!!errors.whatsapp}
                    className={`w-full text-slate-900 placeholder:text-slate-400 text-xs rounded-md pl-8 pr-3 py-2 border outline-none transition-all shadow-xs ${
                      errors.whatsapp
                        ? 'bg-rose-50/95 border-rose-500 text-rose-950 focus:ring-2 focus:ring-rose-400/40'
                        : 'bg-white border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                {/* In-field error message */}
                {errors.whatsapp && (
                  <div className="flex items-center gap-1 text-[11px] font-medium text-rose-300 mt-1 pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <AlertCircle size={11} className="shrink-0 text-rose-400" />
                    <span className="leading-tight">{errors.whatsapp}</span>
                  </div>
                )}
              </div>

              {/* 3. Email Input */}
              <div
                ref={emailBoxRef}
                className="sub-input-box group relative flex-1 min-w-[145px]"
              >
                <div className="relative">
                  <div
                    className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${
                      errors.email
                        ? 'text-rose-500'
                        : 'text-slate-400 group-focus-within:text-emerald-600'
                    }`}
                  >
                    <AnimatedMail size={15} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter email *"
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    className={`w-full text-slate-900 placeholder:text-slate-400 text-xs rounded-md pl-8 pr-3 py-2 border outline-none transition-all shadow-xs ${
                      errors.email
                        ? 'bg-rose-50/95 border-rose-500 text-rose-950 focus:ring-2 focus:ring-rose-400/40'
                        : 'bg-white border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                {/* In-field error message */}
                {errors.email && (
                  <div className="flex items-center gap-1 text-[11px] font-medium text-rose-300 mt-1 pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <AlertCircle size={11} className="shrink-0 text-rose-400" />
                    <span className="leading-tight">{errors.email}</span>
                  </div>
                )}
              </div>

              {/* Subscribe Button (Green with hover micro-animation) */}
              <div className="shrink-0">
                <button
                  ref={buttonRef}
                  type="submit"
                  disabled={status.loading}
                  className="w-full sm:w-auto group relative overflow-hidden bg-[#15803d] hover:bg-[#166534] active:scale-95 disabled:opacity-60 text-white font-medium text-xs px-5 py-2 rounded-md transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer min-h-[34px]"
                >
                  {status.loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Subscribing...</span>
                    </>
                  ) : (
                    <>
                      <span>Subscribe</span>
                      <AnimatedSend
                        size={14}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
