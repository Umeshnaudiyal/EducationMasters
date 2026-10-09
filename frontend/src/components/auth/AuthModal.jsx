'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import {
  AnimatedUser,
  AnimatedMail,
  AnimatedPhone,
  AnimatedLock,
  AnimatedShieldCheck,
  AnimatedKeyRound,
  AnimatedArrowRight,
  AnimatedZap,
  AnimatedLogIn,
  AnimatedSparkles,
  AnimatedCheckCircle,
} from '@/components/AnimatedIcons';
import { useAuthModal } from '@/context/AuthModalContext';
import { useToast } from '@/context/ToastContext';
import { BACKEND_URL } from '@/utils/api';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode, setAuthModalMode, modalOptions } = useAuthModal();
  const { showToast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();

  const isMandatory = Boolean(modalOptions?.mandatory || modalOptions?.preventClose);

  // Mode & Step
  const [tab, setTab] = useState(authModalMode || 'register'); // 'register' | 'login'
  const [step, setStep] = useState(1); // 1: Form / Official Google, 2: Phone & OTP Verification

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Google Auth Extra State
  const [googleUser, setGoogleUser] = useState(null);
  const [isGoogleFlow, setIsGoogleFlow] = useState(false);

  // OTP State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpUserId, setOtpUserId] = useState('');
  const [otpUserPhone, setOtpUserPhone] = useState('');
  const [otpUserEmail, setOtpUserEmail] = useState('');
  const [otpPreview, setOtpPreview] = useState('');
  const [resendTimer, setResendTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Refs for OTP input boxes
  const otpInputRefs = useRef([]);

  // Prevent Escape key from closing if mandatory
  useEffect(() => {
    if (!isAuthModalOpen || !isMandatory) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isAuthModalOpen, isMandatory]);

  // Load Google Identity Services script on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('google-client-script')) return;

    const script = document.createElement('script');
    script.id = 'google-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  // Sync tab with context mode when opened
  useEffect(() => {
    if (isAuthModalOpen) {
      setTab(authModalMode || 'register');
      setStep(1);
      setErrorMsg('');
      setSuccessMsg('');
      setInfoMsg('');
      setIsLoading(false);
      setIsGoogleLoading(false);
      setOtpDigits(['', '', '', '', '', '']);
    }
  }, [isAuthModalOpen, authModalMode]);

  // Resend Countdown Timer
  useEffect(() => {
    let timer = null;
    if (step === 2 && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, resendTimer]);

  if (!isAuthModalOpen) return null;

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setInfoMsg('');
  };

  // ----------------------------------------------------
  // 1. OFFICIAL GOOGLE AUTHENTICATION FLOW
  // ----------------------------------------------------
  const handleOfficialGoogleSignIn = () => {
    clearMessages();
    setIsGoogleLoading(true);

    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '1042397296894-v5b2gc22rpu2fk4mvcpbl2c4glfpnnqb.apps.googleusercontent.com';

    // 1. Try Google Identity Services OAuth popup if loaded
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              try {
                // Fetch profile directly from Google
                const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const profile = await profileRes.json();

                if (profile?.email) {
                  // Forward authenticated Google profile to backend
                  const res = await fetch(`${BACKEND_URL}/apis/v1/auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: profile.email.toLowerCase().trim(),
                      name: profile.name || profile.email.split('@')[0],
                      google_id: profile.sub,
                      image: profile.picture || '',
                    }),
                  });

                  const data = await res.json();

                  if (res.ok && data.success) {
                    // Direct login session establishment
                    if (data.data?.token) {
                      const loginResult = await signIn('credentials', {
                        authType: 'session-token',
                        rawToken: data.data.token,
                        redirect: false,
                      });

                      if (loginResult?.ok) {
                        const userName = data.data.user?.name || profile.name || 'Student';
                        setSuccessMsg(`Google sign-in successful! Welcome back, ${userName}.`);
                        showToast({
                          type: 'success',
                          title: '🎉 Google Login Successful!',
                          message: `Welcome back, ${userName}! All MCQs and AI Performance features unlocked.`,
                          duration: 6000,
                        });

                        setTimeout(() => {
                          closeAuthModal(true);
                          router.refresh();
                          if (modalOptions?.onSuccess) modalOptions.onSuccess();
                        }, 600);
                        return;
                      }
                    }

                    // If OTP is requested (e.g. for new Google users or unverified accounts)
                    if (data.data?.requiresOtp) {
                      setGoogleUser({
                        email: profile.email,
                        name: profile.name,
                        google_id: profile.sub,
                      });
                      setIsGoogleFlow(true);
                      setOtpUserId(data.data?.userId || '');
                      setOtpUserEmail(profile.email);
                      const receivedPhone = data.data?.phone || phone || '';
                      setOtpUserPhone(receivedPhone);
                      if (receivedPhone) setPhone(receivedPhone);
                      if (data.data?.otpPreview) setOtpPreview(data.data.otpPreview);

                      setStep(2);
                      setResendTimer(45);
                      setCanResend(false);
                      setInfoMsg(data.message || 'Please verify mobile number to activate account.');
                      showToast({
                        type: 'info',
                        title: 'Mobile Verification Required',
                        message: data.message || 'Please verify your mobile number to complete registration.',
                      });
                    }
                  } else {
                    const err = data.message || 'Google authentication failed.';
                    setErrorMsg(err);
                    showToast({
                      type: 'error',
                      title: 'Google Sign-In Failed',
                      message: err,
                    });
                  }
                }
              } catch (err) {
                const msg = 'Error retrieving Google user info. Please use email registration.';
                setErrorMsg(msg);
                showToast({
                  type: 'error',
                  title: 'Google Auth Error',
                  message: msg,
                });
              } finally {
                setIsGoogleLoading(false);
              }
            } else {
              setIsGoogleLoading(false);
            }
          },
          error_callback: () => {
            setIsGoogleLoading(false);
            setErrorMsg('Google Sign-In popup was closed.');
          },
        });

        client.requestAccessToken();
        return;
      } catch (err) {
        console.error('Google OAuth init error:', err);
      }
    }

    // Fallback: NextAuth standard Google redirect/popup
    signIn('google', { redirect: false })
      .catch(() => {
        setErrorMsg('Google Sign-In is initializing. You can sign up instantly using the form below.');
      })
      .finally(() => {
        setIsGoogleLoading(false);
      });
  };

  // ----------------------------------------------------
  // 2. NORMAL REGISTRATION / LOGIN SUBMIT
  // ----------------------------------------------------
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (tab === 'register') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        setErrorMsg('Please enter a valid 10-digit mobile number for OTP verification.');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/apis/v1/auth/register-with-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: cleanPhone,
            password,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setOtpUserId(data.data?.userId || '');
          setOtpUserEmail(email.trim());
          setOtpUserPhone(cleanPhone);
          if (data.data?.otpPreview) setOtpPreview(data.data.otpPreview);

          setStep(2);
          setResendTimer(45);
          setCanResend(false);
          setInfoMsg(data.message || `OTP sent to +91 ${cleanPhone}. Please verify to activate your account.`);
          showToast({
            type: 'info',
            title: 'OTP Verification Sent',
            message: `A 6-digit code has been sent to +91 ${cleanPhone}.`,
          });
        } else {
          const is409 = res.status === 409 || data.message?.toLowerCase().includes('already exists') || data.message?.toLowerCase().includes('already registered');
          if (is409) {
            const conflictMsg = data.message || 'An account with this email or phone already exists. Please log in.';
            setErrorMsg(conflictMsg);
            showToast({
              type: 'warning',
              title: 'Account Already Exists (409)',
              message: conflictMsg,
              duration: 6000,
            });
            // Auto switch to login tab with email preserved
            setTab('login');
          } else {
            const err = data.message || 'Registration failed. Please check your details.';
            setErrorMsg(err);
            showToast({
              type: 'error',
              title: 'Registration Error',
              message: err,
            });
          }
        }
      } catch (err) {
        const errText = err.message || 'Unable to reach server. Please try again.';
        setErrorMsg(errText);
        showToast({
          type: 'error',
          title: 'Connection Error',
          message: errText,
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!email.trim()) {
        setErrorMsg('Please enter your email address.');
        return;
      }
      if (!password) {
        setErrorMsg('Please enter your password.');
        return;
      }

      setIsLoading(true);
      try {
        const result = await signIn('credentials', {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });

        if (result?.ok) {
          setSuccessMsg('Login successful! Welcome back.');
          showToast({
            type: 'success',
            title: '🎉 Welcome Back!',
            message: 'Login successful! Enjoy unlimited practice and AI features.',
            duration: 5000,
          });

          setTimeout(() => {
            closeAuthModal(true);
            router.refresh();
            if (modalOptions?.onSuccess) modalOptions.onSuccess();
          }, 600);
        } else {
          const errText = result?.error || 'Invalid email or password';
          const isInactive =
            errText.toLowerCase().includes('inactive') ||
            errText.toLowerCase().includes('pending') ||
            errText.toLowerCase().includes('phone number') ||
            errText.toLowerCase().includes('otp');

          if (isInactive) {
            setErrorMsg(errText);
            setInfoMsg('Account is pending verification. Requesting OTP verification...');

            try {
              const otpReq = await fetch(`${BACKEND_URL}/apis/v1/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
              });
              const otpData = await otpReq.json();
              if (otpReq.ok && otpData.success) {
                setOtpUserId(otpData.data?.userId || '');
                setOtpUserPhone(otpData.data?.phone || '');
                setOtpUserEmail(email.trim());
                if (otpData.data?.otpPreview) setOtpPreview(otpData.data.otpPreview);
                setStep(2);
                setResendTimer(45);
                setCanResend(false);
              }
            } catch (e) { }
          } else {
            setErrorMsg(errText);
            showToast({
              type: 'error',
              title: 'Login Failed',
              message: errText,
            });
          }
        }
      } catch (err) {
        const errText = err.message || 'Login failed. Please check your credentials.';
        setErrorMsg(errText);
        showToast({
          type: 'error',
          title: 'Login Error',
          message: errText,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ----------------------------------------------------
  // 3. STEP 2: OTP VERIFICATION & ACCOUNT ACTIVATION
  // ----------------------------------------------------
  const handleOtpDigitChange = (index, value) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    }
  };

  const handleSendStep2PhoneOtp = async (e) => {
    if (e) e.preventDefault();
    clearMessages();

    const cleanPhone = String(phone || otpUserPhone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: otpUserId,
          phone: cleanPhone,
          email: otpUserEmail,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOtpUserPhone(cleanPhone);
        setPhone(cleanPhone);
        if (data.data?.userId) setOtpUserId(data.data.userId);
        if (data.data?.otpPreview) setOtpPreview(data.data.otpPreview);
        setResendTimer(45);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);
        setInfoMsg(`OTP code sent successfully to +91 ${cleanPhone.slice(-4).padStart(cleanPhone.length, 'X')}`);
        showToast({
          type: 'info',
          title: 'Verification Code Sent',
          message: `OTP sent to +91 ${cleanPhone.slice(-4).padStart(cleanPhone.length, 'X')}`,
        });
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      } else {
        const is409 = res.status === 409 || data.message?.includes('already registered') || data.message?.includes('already exists');
        if (is409) {
          setErrorMsg(data.message || 'This mobile number is already registered.');
          showToast({
            type: 'warning',
            title: 'Mobile Conflict (409)',
            message: data.message || 'This mobile number is already linked to another account.',
          });
        } else {
          const err = data.message || 'Failed to send OTP. Please check your mobile number.';
          setErrorMsg(err);
          showToast({
            type: 'error',
            title: 'OTP Send Error',
            message: err,
          });
        }
      }
    } catch (err) {
      const errText = err.message || 'Unable to connect to server.';
      setErrorMsg(errText);
      showToast({
        type: 'error',
        title: 'Connection Error',
        message: errText,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    clearMessages();
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: otpUserId,
          phone: otpUserPhone,
          email: otpUserEmail,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setInfoMsg(`A new OTP has been sent to +91 ${otpUserPhone.slice(-4).padStart(otpUserPhone.length, 'X')}`);
        if (data.data?.otpPreview) setOtpPreview(data.data.otpPreview);
        setResendTimer(45);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
        showToast({
          type: 'info',
          title: 'OTP Resent',
          message: `New code sent to +91 ${otpUserPhone.slice(-4).padStart(otpUserPhone.length, 'X')}`,
        });
      } else {
        const err = data.message || 'Failed to resend OTP. Please try again.';
        setErrorMsg(err);
        showToast({
          type: 'error',
          title: 'Resend Failed',
          message: err,
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error requesting OTP resend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    clearMessages();

    const fullOtp = otpDigits.join('').trim();
    if (fullOtp.length < 6) {
      setErrorMsg('Please enter all 6 digits of the OTP code.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        authType: 'otp-verify',
        userId: otpUserId,
        phone: otpUserPhone,
        email: otpUserEmail,
        otp: fullOtp,
        redirect: false,
      });

      if (result?.ok) {
        setSuccessMsg('Phone verified & Account Activated! Welcome to Education Masters.');
        showToast({
          type: 'success',
          title: '🎉 Account Activated!',
          message: 'Phone verified successfully. Welcome to Education Masters!',
          duration: 6000,
        });

        setTimeout(() => {
          closeAuthModal(true);
          router.refresh();
          if (modalOptions?.onSuccess) modalOptions.onSuccess();
        }, 600);
      } else {
        const err = result?.error || 'Invalid or expired OTP. Please try again.';
        setErrorMsg(err);
        showToast({
          type: 'error',
          title: 'Verification Error',
          message: err,
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">

      {/* Background Click to Dismiss (Only if not mandatory/locked) */}
      <div
        className="absolute inset-0"
        onClick={isMandatory ? undefined : () => closeAuthModal(false)}
      />

      {/* Main Modal Card (Sleek, perfectly proportioned, and responsive) */}
      <div className="relative w-full max-w-[440px] sm:max-w-[480px] bg-white rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.35),0_0_0_1px_rgba(226,232,240,0.9)] flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-hidden z-10 animate-in zoom-in-95 duration-200">

        {/* Header Section (Fixed at Top, Never Scrolls Away) */}
        <div className="relative px-5 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-xs shrink-0 z-20">
          <div className="flex items-center">
            <img
              src="/logo.webp"
              alt="Education Masters"
              className="h-7.5 sm:h-8.5 w-auto object-contain hover:scale-102 transition-transform duration-200"
            />
          </div>

          {/* Locked Badge if Mandatory, or Close Button if Normal */}
          {isMandatory ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-900 rounded-full border border-amber-300/80 text-xs font-bold tracking-tight shadow-2xs">
              <AnimatedLock size={12} className="text-amber-600 shrink-0" />
              <span>Free Sign In Required</span>
            </div>
          ) : (
            <button
              onClick={() => closeAuthModal(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-all duration-150 cursor-pointer flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 flex-1 overflow-y-auto overscroll-contain space-y-3 sm:space-y-3.5 no-scrollbar">

          {/* Mandatory Lock Context Banner with Feature Value Pills */}
          {isMandatory && (
            <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-50/95 via-indigo-50/80 to-blue-50/95 border border-blue-200/90 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <div className="w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25 mt-0.5">
                  <AnimatedSparkles size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-extrabold text-blue-950 leading-tight">
                    {modalOptions?.title || '🔐 Free Sign In Required'}
                  </p>
                  <p className="text-[11px] sm:text-xs text-blue-900/85 leading-relaxed mt-0.5">
                    {modalOptions?.subtitle || 'Please create a free account or log in to continue practicing questions and access Edu AI Analytics.'}
                  </p>
                </div>
              </div>

              {/* Instant Benefit Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-blue-200/70">
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-blue-800 bg-white/90 px-2 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                  <AnimatedZap size={11} className="text-blue-600" /> Unlimited MCQs
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-indigo-800 bg-white/90 px-2 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                  <AnimatedSparkles size={11} className="text-indigo-600" /> AI Diagnostics
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-white/90 px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                  <AnimatedCheckCircle size={11} className="text-emerald-600" /> 100% Free
                </span>
              </div>
            </div>
          )}

          {/* Notification / Alert Banners */}
          {errorMsg && (
            <div className="p-2.5 sm:p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 leading-snug">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <AnimatedShieldCheck size={15} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{infoMsg}</div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: REGISTRATION / LOGIN + GOOGLE AUTH */}
          {/* ============================================================ */}
          {step === 1 && (
            <div className="space-y-3 sm:space-y-3.5">

              {/* Segmented Tab Switcher */}
              <div className="flex p-1 bg-slate-100/90 rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    clearMessages();
                  }}
                  className={`group flex-1 py-2 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${tab === 'register'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <AnimatedUser size={15} className={tab === 'register' ? 'text-blue-600' : 'text-slate-400'} />
                  <span>Create Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    clearMessages();
                  }}
                  className={`group flex-1 py-2 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${tab === 'login'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <AnimatedLogIn size={15} className={tab === 'login' ? 'text-blue-600' : 'text-slate-400'} />
                  <span>Sign In</span>
                </button>
              </div>

              {/* Official Google Sign-In Button */}
              <div>
                <button
                  type="button"
                  onClick={handleOfficialGoogleSignIn}
                  disabled={isGoogleLoading || isLoading}
                  className="group w-full py-2.5 sm:py-3 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 active:scale-[0.99] text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs transition-all duration-150 disabled:opacity-60 cursor-pointer"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  ) : (
                    <svg className="w-4.5 h-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>
                    {tab === 'register' ? 'Sign up with Google (Fast & Free)' : 'Sign in with Google'}
                  </span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-3.5 sm:my-4 py-0.5">
                <div className="w-full border-t border-slate-200" />
                <span className="absolute bg-white px-3 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                  or with email
                </span>
              </div>

              {/* Main Form */}
              <form onSubmit={handleFormSubmit} className="space-y-2.5 sm:space-y-3">

                {tab === 'register' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {/* Full Name */}
                      <div className="space-y-1">
                        <label className="block text-[11.5px] sm:text-xs font-bold text-slate-700">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="group relative flex items-center">
                          <div className="absolute left-3 flex items-center justify-center text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                            <AnimatedUser size={15} />
                          </div>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Rahul Sharma"
                            className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm pl-9 pr-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all font-medium"
                          />
                        </div>
                      </div>

                      {/* Mobile Number */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11.5px] sm:text-xs font-bold text-slate-700">
                            Mobile Number <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[9.5px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                            Requires OTP
                          </span>
                        </div>
                        <div className="group relative flex items-center">
                          <div className="absolute left-3 flex items-center gap-1 text-xs font-bold text-slate-600 pr-1.5 border-r border-slate-200 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                            <AnimatedPhone size={13} />
                            <span>+91</span>
                          </div>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="98765 43210"
                            className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm pl-18 pr-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1">
                      <label className="block text-[11.5px] sm:text-xs font-bold text-slate-700">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="group relative flex items-center">
                        <div className="absolute left-3 flex items-center justify-center text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                          <AnimatedMail size={15} />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm pl-9 pr-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all font-medium"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* Login Tab: Email Address */
                  <div className="space-y-1">
                    <label className="block text-[11.5px] sm:text-xs font-bold text-slate-700">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative flex items-center">
                      <div className="absolute left-3 flex items-center justify-center text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                        <AnimatedMail size={15} />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm pl-9 pr-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* Password Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11.5px] sm:text-xs font-bold text-slate-700">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    {tab === 'login' && (
                      <button
                        type="button"
                        onClick={() => alert('Please contact administrator to reset password or sign in with Google.')}
                        className="text-[10.5px] sm:text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="group relative flex items-center">
                    <div className="absolute left-3 flex items-center justify-center text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                      <AnimatedLock size={15} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={tab === 'register' ? 'Create password (min 6 chars)' : 'Enter your password'}
                      className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm pl-9 pr-9 py-2 sm:py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 active:scale-90 transition p-1 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Disclaimer Note */}
                {tab === 'register' && (
                  <p className="text-[10.5px] sm:text-[11px] text-slate-500 leading-snug pt-0.5">
                    By signing up, you agree to Education Masters Terms. In Step 2, a 6-digit OTP verifies and activates your account.
                  </p>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="group w-full py-2.5 sm:py-3 px-5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-60 cursor-pointer mt-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{tab === 'register' ? 'Creating Account...' : 'Signing In...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{tab === 'register' ? 'Continue & Send OTP' : 'Sign In to Portal'}</span>
                      <AnimatedArrowRight size={15} className="text-white group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

              </form>

            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: PHONE & 6-DIGIT OTP VERIFICATION SCREEN */}
          {/* ============================================================ */}
          {step === 2 && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200 flex-1 flex flex-col justify-center">

              <div className="text-center space-y-2">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-2xs">
                  <AnimatedKeyRound size={24} className="text-blue-600" />
                </div>
                <h4 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  {otpUserPhone && otpUserPhone.length >= 10
                    ? 'Verify OTP to Activate Account'
                    : 'Mobile Number Verification'}
                </h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                  {otpUserPhone && otpUserPhone.length >= 10
                    ? 'Please enter the 6-digit verification code sent to your mobile number:'
                    : 'Please provide your 10-digit mobile number to receive your one-time activation code:'}
                </p>
                {otpUserPhone && otpUserPhone.length >= 10 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-800 border border-slate-200">
                    <AnimatedPhone size={13} className="text-blue-600" />
                    <span>+91 {otpUserPhone}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpUserPhone('');
                        setOtpDigits(['', '', '', '', '', '']);
                        setOtpPreview('');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline font-bold cursor-pointer ml-1"
                    >
                      (Change)
                    </button>
                  </div>
                )}
              </div>

              {/* If Phone Number has not been entered / OTP not yet sent */}
              {(!otpUserPhone || otpUserPhone.length < 10) ? (
                <form onSubmit={handleSendStep2PhoneOtp} className="space-y-3.5 max-w-sm mx-auto w-full">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-slate-800">
                      10-Digit Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative flex items-center">
                      <div className="absolute left-3.5 flex items-center gap-1 text-xs font-bold text-slate-600 pr-2 border-r border-slate-200 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                        <AnimatedPhone size={14} />
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        autoFocus
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="98765 43210"
                        className="w-full bg-slate-50/90 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 text-sm pl-19 pr-3.5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || phone.replace(/[^0-9]/g, '').length < 10}
                    className="group w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition duration-150 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Verification OTP</span>
                        <AnimatedArrowRight size={16} className="text-white group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        clearMessages();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Registration / Login</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* 6-Digit OTP Form */
                <div className="max-w-sm mx-auto w-full space-y-3.5">
                  {/* Dev Preview Helper Badge */}
                  {otpPreview && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between shadow-2xs">
                      <span className="font-semibold flex items-center gap-1.5">
                        <AnimatedZap size={14} className="text-amber-500" /> Dev OTP:
                      </span>
                      <span className="font-mono font-black text-xs sm:text-sm tracking-widest bg-amber-200/80 text-amber-950 px-2.5 py-0.5 rounded border border-amber-300">
                        {otpPreview}
                      </span>
                    </div>
                  )}

                  <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                    <div>
                      <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => (otpInputRefs.current[idx] = el)}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="one-time-code"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            autoFocus={idx === 0}
                            className="w-10 h-12 sm:w-12 sm:h-13 text-center text-lg sm:text-xl font-black rounded-xl border border-slate-300 bg-slate-50/90 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all shadow-inner"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Inactive Notice Warning Box */}
                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-snug flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Notice:</span> Account activates automatically upon OTP verification.
                      </div>
                    </div>

                    {/* Resend & Timer */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium text-xs">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {resendTimer > 0 ? (
                          <span>Resend in <strong className="text-slate-700">{resendTimer}s</strong></span>
                        ) : (
                          <span>Didn&apos;t get code?</span>
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={!canResend || isLoading}
                        className={`text-xs font-bold transition cursor-pointer ${canResend
                          ? 'text-blue-600 hover:text-blue-800 underline'
                          : 'text-slate-400 cursor-not-allowed'
                          }`}
                      >
                        Resend OTP
                      </button>
                    </div>

                    {/* Verify Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition duration-150 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Verifying OTP...</span>
                        </>
                      ) : (
                        <>
                          <AnimatedShieldCheck size={18} className="text-white" />
                          <span>Verify OTP &amp; Access Portal</span>
                        </>
                      )}
                    </button>

                    {/* Back to Step 1 */}
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          clearMessages();
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Registration / Login</span>
                      </button>
                    </div>

                  </form>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Fixed Footer Section (Always Visible at Bottom, Never Cutoff) */}
        <div className="px-5 sm:px-6 py-3 sm:py-3 bg-slate-50/95 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0 z-20">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <AnimatedShieldCheck size={14} className="text-emerald-600" />
            <span>256-Bit SSL Encrypted</span>
          </span>
          <span className="font-medium text-slate-400">© {new Date().getFullYear()} Education Masters</span>
        </div>

      </div>

    </div>
  );
}
