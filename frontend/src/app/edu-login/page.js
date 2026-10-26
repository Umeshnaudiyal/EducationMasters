'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  KeyRound,
  Phone,
  Mail,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { toast } from '@/context/ToastContext';
import { BACKEND_URL } from '@/utils/api';

export default function EduLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams?.get('expired') === '1';
  const callbackUrl = searchParams?.get('callbackUrl') || '/edu-admin';

  // Step 1 vs Step 2 (OTP Verification)
  const [step, setStep] = useState(1); // 1: Form, 2: OTP Verification

  // Mode: Login vs Register
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Loading & Alert States
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isInactiveError, setIsInactiveError] = useState(false);

  // OTP Verification States
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpUserId, setOtpUserId] = useState('');
  const [otpUserPhone, setOtpUserPhone] = useState('');
  const [otpUserEmail, setOtpUserEmail] = useState('');
  const [otpChannel, setOtpChannel] = useState('whatsapp'); // 'whatsapp' | 'email' | 'both'
  const [otpPreview, setOtpPreview] = useState('');
  const [resendTimer, setResendTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const otpInputRefs = useRef([]);

  // Superadmin Dynamic Settings
  const [authSettings, setAuthSettings] = useState({
    allowNewRegistrations: true,
    registrationClosedMessage: 'New registrations are currently closed. Please sign in.',
    googleNewUserPhoneVerification: true,
    existingUserPhoneVerification: true,
    manualRegistrationOtpMode: 'whatsapp',
    otpExpiryMinutes: 10,
  });

  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);

  const clearErrors = () => {
    setErrorMsg('');
    setIsInactiveError(false);
    setFieldErrors({ name: '', email: '', phone: '', password: '' });
  };

  // Fetch Superadmin Login Settings on mount
  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/apis/v1/auth/settings`);
        const json = await res.json();
        if (isMounted && res.ok && json.success && json.data) {
          setAuthSettings(json.data);
          if (json.data.manualRegistrationOtpMode) {
            setOtpChannel(json.data.manualRegistrationOtpMode);
          }
        }
      } catch (e) {
        // Fallback silently
      }
    };
    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isExpired && typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }, [isExpired]);

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

  // Resend OTP Countdown Timer
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

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
    if (errorMsg) setErrorMsg('');
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
    if (errorMsg) setErrorMsg('');
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setPhone(val);
    if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
    if (errorMsg) setErrorMsg('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
    if (errorMsg) setErrorMsg('');
  };

  // ----------------------------------------------------
  // 1. OFFICIAL GOOGLE AUTHENTICATION FLOW
  // ----------------------------------------------------
  const handleOfficialGoogleSignIn = () => {
    clearErrors();
    setSuccessMsg('');
    setIsGoogleLoading(true);

    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '1042397296894-v5b2gc22rpu2fk4mvcpbl2c4glfpnnqb.apps.googleusercontent.com';

    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              try {
                const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const profile = await profileRes.json();

                if (profile?.email) {
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
                    // Check if Second-Step Mobile/OTP Verification is requested by backend!
                    if (data.data?.requiresOtp) {
                      setOtpUserId(data.data.userId || '');
                      setOtpUserEmail(profile.email || '');
                      const recPhone = data.data.phone || phone || '';
                      setOtpUserPhone(recPhone);
                      if (recPhone) setPhone(recPhone);
                      if (data.data.otpChannel) setOtpChannel(data.data.otpChannel);
                      if (data.data.otpPreview) setOtpPreview(data.data.otpPreview);

                      setStep(2);
                      setResendTimer(45);
                      setCanResend(false);
                      setOtpDigits(['', '', '', '', '', '']);
                      setSuccessMsg('');
                      toast.info({
                        title: 'Mobile Verification Required',
                        message: data.message || 'Please complete second-step verification to continue.',
                      });
                      return;
                    }

                    // Direct Token Session Injection
                    if (data.data?.token) {
                      const loginResult = await signIn('credentials', {
                        authType: 'session-token',
                        rawToken: data.data.token,
                        redirect: false,
                      });

                      if (loginResult?.ok) {
                        const welcomeName = data.data.user?.name || profile.name || 'Admin';
                        toast.success({
                          title: '🎉 Google Login Successful!',
                          message: `Welcome back, ${welcomeName}! Opening dashboard...`,
                        });
                        setSuccessMsg('Google sign-in successful! Redirecting to panel...');
                        router.push(callbackUrl);
                        router.refresh();
                        return;
                      }
                    }

                    setSuccessMsg('Google sign-in successful! Redirecting...');
                    router.push(callbackUrl);
                    router.refresh();
                  } else {
                    const errMsg = data.message || 'Google authentication failed on server.';
                    setErrorMsg(errMsg);
                    toast.error(errMsg);
                  }
                } else {
                  setErrorMsg('Failed to obtain Google email profile.');
                  toast.error('Failed to obtain Google email profile.');
                }
              } catch (err) {
                setErrorMsg('Error retrieving Google profile.');
                toast.error('Error retrieving Google profile.');
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
        console.error('Google client error, falling back:', err);
      }
    }

    // Fallback to NextAuth Google Provider
    signIn('google', { callbackUrl }).catch(() => {
      setErrorMsg('Failed to initialize Google Sign In.');
      setIsGoogleLoading(false);
    });
  };

  // ----------------------------------------------------
  // 2. NORMAL REGISTRATION / LOGIN SUBMIT
  // ----------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    setSuccessMsg('');

    const newErrors = {};

    if (isRegisterMode) {
      if (authSettings.allowNewRegistrations === false) {
        const closedMsg = authSettings.registrationClosedMessage || 'New registrations are currently closed.';
        setErrorMsg(closedMsg);
        toast.warning({ title: 'Registration Paused', message: closedMsg });
        return;
      }

      if (!name.trim()) {
        newErrors.name = 'Please enter your full name';
      }

      const otpMode = authSettings.manualRegistrationOtpMode || 'whatsapp';
      const cleanPhone = phone.replace(/[^0-9]/g, '');

      if ((otpMode === 'whatsapp' || otpMode === 'both') && (!cleanPhone || cleanPhone.length < 10)) {
        newErrors.phone = 'Please enter a valid 10-digit mobile number';
      }
    }

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Please enter your password';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      if (newErrors.name && nameRef.current) nameRef.current.focus();
      else if (newErrors.phone && phoneRef.current) phoneRef.current.focus();
      else if (newErrors.email && emailRef.current) emailRef.current.focus();
      else if (newErrors.password && passwordRef.current) passwordRef.current.focus();
      return;
    }

    setIsLoading(true);

    try {
      if (isRegisterMode) {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const otpMode = authSettings.manualRegistrationOtpMode || 'whatsapp';

        const res = await fetch(`${BACKEND_URL}/apis/v1/auth/register-with-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: cleanPhone || '',
            password,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          // Direct sign-in without OTP (Mode: 'none')
          if (!data.data?.requiresOtp && data.data?.token) {
            const loginResult = await signIn('credentials', {
              authType: 'session-token',
              rawToken: data.data.token,
              redirect: false,
            });

            if (loginResult?.ok) {
              setSuccessMsg('Account created successfully! Opening panel...');
              toast.success({
                title: '🎉 Registration Successful!',
                message: 'Account activated! Welcome to Education Masters.',
              });
              router.push(callbackUrl);
              router.refresh();
              return;
            }
          }

          // OTP required (Modes: 'whatsapp' | 'email' | 'both')
          const channel = data.data?.otpChannel || otpMode;
          setOtpChannel(channel);
          setOtpUserId(data.data?.userId || '');
          setOtpUserEmail(email.trim());
          setOtpUserPhone(cleanPhone || '');
          if (data.data?.otpPreview) setOtpPreview(data.data.otpPreview);

          setStep(2);
          setResendTimer(45);
          setCanResend(false);
          setOtpDigits(['', '', '', '', '', '']);
          toast.info({
            title: channel === 'both' ? 'Dual Verification Sent' : channel === 'email' ? 'Email OTP Sent' : 'WhatsApp OTP Sent',
            message: data.message || 'Please verify code to activate account.',
          });
        } else {
          const errMsg = data.message || 'Registration failed. Please check your details.';
          setErrorMsg(errMsg);
          toast.error(errMsg);
        }
      } else {
        // Handle NextAuth Sign In with Credentials
        const result = await signIn('credentials', {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });

        if (result?.ok) {
          setSuccessMsg('Login successful! Redirecting to panel...');
          toast.success({
            title: '🎉 Login Successful!',
            message: 'Welcome back! Opening admin dashboard.',
          });
          router.push(callbackUrl);
          router.refresh();
        } else {
          const err = result?.error || 'Invalid email or password';
          const isInactiveOrOtp =
            err.toLowerCase().includes('inactive') ||
            err.toLowerCase().includes('pending') ||
            err.toLowerCase().includes('deactivated') ||
            err.toLowerCase().includes('second-step') ||
            err.toLowerCase().includes('verification') ||
            err.toLowerCase().includes('phone number') ||
            err.toLowerCase().includes('otp');

          if (isInactiveOrOtp) {
            setErrorMsg(err);
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
                if (otpData.data?.otpChannel) setOtpChannel(otpData.data.otpChannel);
                if (otpData.data?.otpPreview) setOtpPreview(otpData.data.otpPreview);
                setStep(2);
                setResendTimer(45);
                setCanResend(false);
                setOtpDigits(['', '', '', '', '', '']);
                toast.info({
                  title: 'Verification Required',
                  message: otpData.message || 'Please enter the verification code sent to continue.',
                });
                return;
              }
            } catch (e) {}
          }

          setIsInactiveError(isInactiveOrOtp);
          setErrorMsg(err);
          toast.error(err);

          if (isInactiveOrOtp) {
            setFieldErrors({
              email: 'Account requires verification or admin approval',
              phone: '',
              password: '',
              name: '',
            });
            emailRef.current?.focus();
          } else {
            setFieldErrors({
              email: 'Please check your email address',
              phone: '',
              password: 'Or verify your password',
              name: '',
            });
            passwordRef.current?.focus();
          }
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Unable to connect to authentication server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // 3. STEP 2: PHONE & OTP VERIFICATION HANDLERS
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
    clearErrors();

    const cleanPhone = String(phone || otpUserPhone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsOtpLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: otpUserId,
          phone: cleanPhone,
          email: otpUserEmail,
          channel: otpChannel || 'whatsapp',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOtpUserPhone(cleanPhone);
        setPhone(cleanPhone);
        if (data.data?.userId) setOtpUserId(data.data.userId);
        if (data.data?.otpChannel) setOtpChannel(data.data.otpChannel);
        if (data.data?.otpPreview) setOtpPreview(data.data.otpPreview);
        setResendTimer(45);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);
        setSuccessMsg(`OTP sent to +91 ${cleanPhone.slice(-4).padStart(cleanPhone.length, 'X')}`);
        toast.info({
          title: 'Verification Code Sent',
          message: data.message || `OTP sent to +91 ${cleanPhone.slice(-4).padStart(cleanPhone.length, 'X')}`,
        });
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      } else {
        const errMsg = data.message || 'Failed to dispatch verification OTP.';
        setErrorMsg(errMsg);
        toast.error(errMsg);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Unable to connect to server.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    clearErrors();
    setIsOtpLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: otpUserId,
          phone: otpUserPhone,
          email: otpUserEmail,
          channel: otpChannel,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'A new verification code has been dispatched.');
        if (data.data?.otpPreview) setOtpPreview(data.data.otpPreview);
        if (data.data?.otpChannel) setOtpChannel(data.data.otpChannel);
        setResendTimer(45);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
        toast.info({
          title: 'OTP Resent',
          message: data.message || 'New verification code sent.',
        });
      } else {
        const errMsg = data.message || 'Failed to resend OTP.';
        setErrorMsg(errMsg);
        toast.error(errMsg);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error requesting OTP resend.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    clearErrors();

    const fullOtp = otpDigits.join('').trim();
    if (fullOtp.length < 6) {
      setErrorMsg('Please enter all 6 digits of the OTP code.');
      return;
    }

    setIsOtpLoading(true);

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
        setSuccessMsg('Account verified! Opening admin dashboard...');
        toast.success({
          title: '🎉 Verification Successful!',
          message: 'Account verified successfully. Welcome to Education Masters!',
        });

        setTimeout(() => {
          router.push(callbackUrl);
          router.refresh();
        }, 500);
      } else {
        const err = result?.error || 'Invalid or expired OTP code. Please try again.';
        setErrorMsg(err);
        toast.error(err);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  const getInputStyle = (hasError) =>
    `w-full bg-zinc-950/90 text-slate-100 placeholder-slate-400 text-xs sm:text-sm pl-9 pr-3 py-2 rounded-lg border transition-all duration-200 shadow-inner ${
      hasError
        ? 'border-red-500 ring-2 ring-red-500/30 bg-red-950/20 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none'
        : 'border-zinc-700/80 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
    }`;

  const needsPhoneInput = otpChannel !== 'email' && (!otpUserPhone || otpUserPhone.length < 10);

  return (
    <div
      className="h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-between items-center py-3 px-3 sm:py-5 sm:px-4 bg-zinc-950 font-sans text-white relative overflow-hidden select-none bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url('/login.webp')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Logo */}
        <div className="mb-2.5 sm:mb-3 flex flex-col items-center">
          <Link href="/" title="Back to Home">
            <img
              src="/logo.webp"
              alt="Education Masters"
              className="h-9 sm:h-12 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform"
            />
          </Link>
        </div>

        {/* Card Container */}
        <div className="w-full max-w-[340px] sm:max-w-sm bg-zinc-900/95 border border-zinc-800/90 p-4 sm:p-5 rounded-2xl shadow-2xl backdrop-blur-md">

          {/* ============================================================ */}
          {/* STEP 1: LOGIN / REGISTRATION FORM */}
          {/* ============================================================ */}
          {step === 1 && (
            <>
              <h2 className="text-base sm:text-lg font-bold text-center mb-0.5 text-white">
                {isRegisterMode ? 'Create Account' : 'Portal Login'}
              </h2>
              <p className="text-[11px] text-slate-400 text-center mb-3">
                {isRegisterMode
                  ? 'Register for Education Masters access'
                  : 'Sign in with your email and password'}
              </p>

              {/* Registration Paused Warning Banner */}
              {isRegisterMode && authSettings.allowNewRegistrations === false ? (
                <div className="mb-3 text-xs bg-amber-950/80 border border-amber-600/80 text-amber-200 p-3 rounded-xl flex flex-col gap-2 animate-fadeIn">
                  <div className="flex items-start gap-2">
                    <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-300">Registration Temporarily Paused</p>
                      <p className="mt-0.5 text-[11px] text-amber-200/90 leading-tight">
                        {authSettings.registrationClosedMessage || 'New registrations are currently closed by administrator.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(false);
                      clearErrors();
                    }}
                    className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                  >
                    Switch to Portal Sign In
                  </button>
                </div>
              ) : (
                <>
                  {/* Official Google Sign-In Button */}
                  <div className="mb-2.5">
                    <button
                      type="button"
                      onClick={handleOfficialGoogleSignIn}
                      disabled={isGoogleLoading || isLoading}
                      className="w-full py-2 px-3 rounded-xl border border-zinc-700 bg-zinc-950/80 hover:bg-zinc-800 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-150 disabled:opacity-60 cursor-pointer"
                    >
                      {isGoogleLoading ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                        {isRegisterMode ? 'Sign up with Google' : 'Sign in with Google'}
                      </span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="relative flex items-center justify-center my-2.5">
                    <div className="w-full border-t border-zinc-700/80" />
                    <span className="absolute bg-zinc-900 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      or with email
                    </span>
                  </div>

                  {/* Expired Session Alert Card */}
                  {isExpired && !errorMsg && !successMsg && (
                    <div className="mb-2.5 text-xs bg-amber-950/80 border border-amber-500/80 text-amber-200 p-2.5 rounded-lg flex items-start gap-2 animate-fadeIn">
                      <Clock size={15} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-300">Session Expired</p>
                        <p className="mt-0.5 text-[10.5px] text-amber-200/90 leading-tight">
                          Please sign in with your credentials to start your session.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Inactive User Alert Card */}
                  {isInactiveError && (
                    <div className="mb-2.5 text-xs bg-amber-950/80 border border-amber-600/80 text-amber-200 p-2.5 rounded-lg flex items-start gap-2 animate-fadeIn">
                      <ShieldAlert size={15} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-300">Account Pending Verification</p>
                        <p className="mt-0.5 text-[10.5px] text-amber-200/90 leading-tight">
                          Account requires phone verification or administrator approval.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Standard Error Banner */}
                  {errorMsg && !isInactiveError && (
                    <div className="mb-2.5 text-xs bg-red-950/80 border border-red-600/80 text-red-200 p-2 rounded-lg flex items-start gap-2 animate-fadeIn">
                      <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-red-200/90 leading-tight">{errorMsg}</p>
                    </div>
                  )}

                  {/* Success Banner */}
                  {successMsg && (
                    <div className="mb-2.5 text-xs bg-emerald-950/80 border border-emerald-600/80 text-emerald-200 p-2 rounded-lg flex items-start gap-2 animate-fadeIn">
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-emerald-200/90 leading-tight">{successMsg}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} noValidate className="space-y-2.5">
                    {isRegisterMode && (
                      <>
                        {/* Name Field */}
                        <div className="space-y-1">
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-slate-400 pointer-events-none text-xs">👤</span>
                            <input
                              ref={nameRef}
                              type="text"
                              required
                              value={name}
                              onChange={handleNameChange}
                              placeholder="Full Name"
                              className={getInputStyle(Boolean(fieldErrors.name))}
                            />
                          </div>
                          {fieldErrors.name && (
                            <p className="text-[10.5px] text-red-400 font-medium pl-1 flex items-center gap-1">
                              <AlertCircle size={10} />
                              <span>{fieldErrors.name}</span>
                            </p>
                          )}
                        </div>

                        {/* Phone Field */}
                        <div className="space-y-1">
                          <div className="relative flex items-center">
                            <div className="absolute left-3 flex items-center gap-1 text-slate-400 pointer-events-none text-xs pr-1 border-r border-zinc-700">
                              <Phone size={12} />
                              <span>+91</span>
                            </div>
                            <input
                              ref={phoneRef}
                              type="tel"
                              maxLength={10}
                              value={phone}
                              onChange={handlePhoneChange}
                              placeholder="10-digit mobile number"
                              className={getInputStyle(Boolean(fieldErrors.phone)) + ' pl-17'}
                            />
                          </div>
                          {fieldErrors.phone && (
                            <p className="text-[10.5px] text-red-400 font-medium pl-1 flex items-center gap-1">
                              <AlertCircle size={10} />
                              <span>{fieldErrors.phone}</span>
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Email Field */}
                    <div className="space-y-1">
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-slate-400 pointer-events-none text-xs">✉️</span>
                        <input
                          ref={emailRef}
                          type="email"
                          required
                          value={email}
                          onChange={handleEmailChange}
                          placeholder="Email address"
                          className={getInputStyle(Boolean(fieldErrors.email))}
                        />
                      </div>
                      {fieldErrors.email && (
                        <p className="text-[10.5px] text-red-400 font-medium pl-1 flex items-center gap-1">
                          <AlertCircle size={10} />
                          <span>{fieldErrors.email}</span>
                        </p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1">
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-slate-400 pointer-events-none text-xs">🔑</span>
                        <input
                          ref={passwordRef}
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={handlePasswordChange}
                          placeholder="Password"
                          className={getInputStyle(Boolean(fieldErrors.password)) + ' pr-9'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 text-slate-400 hover:text-slate-200 transition focus:outline-none cursor-pointer p-0.5"
                          title={showPassword ? 'Hide password' : 'Show password'}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {fieldErrors.password && (
                        <p className="text-[10.5px] text-red-400 font-medium pl-1 flex items-center gap-1">
                          <AlertCircle size={10} />
                          <span>{fieldErrors.password}</span>
                        </p>
                      )}
                    </div>

                    {!isRegisterMode && (
                      <div className="flex items-center justify-between pt-0.5">
                        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-600 text-emerald-500 focus:ring-0 cursor-pointer"
                          />
                          <span>Remember me</span>
                        </label>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#65a30d] hover:bg-[#4d7c0f] active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer disabled:opacity-50 mt-1 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : isRegisterMode ? (
                        'Register Account'
                      ) : (
                        'Login to Portal'
                      )}
                    </button>
                  </form>
                </>
              )}

              {/* Toggle Mode */}
              <div className="text-center pt-2.5 border-t border-zinc-800 mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    clearErrors();
                    setSuccessMsg('');
                  }}
                  className="text-xs text-slate-300 hover:text-white hover:underline transition bg-transparent border-none cursor-pointer"
                >
                  {isRegisterMode ? 'Already have an account? Login' : "Don't have an account? Register"}
                </button>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* STEP 2: PHONE & 6-DIGIT OTP VERIFICATION SCREEN */}
          {/* ============================================================ */}
          {step === 2 && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="text-center space-y-1.5">
                <div className="w-11 h-11 mx-auto rounded-2xl bg-zinc-800/90 text-emerald-400 border border-zinc-700/80 flex items-center justify-center shadow-inner">
                  {otpChannel === 'email' ? (
                    <Mail className="w-5 h-5 text-emerald-400" />
                  ) : otpChannel === 'both' ? (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <Mail className="w-4 h-4 text-blue-400" />
                    </div>
                  ) : (
                    <KeyRound className="w-5 h-5 text-emerald-400" />
                  )}
                </div>

                <h3 className="text-base font-bold text-white tracking-tight">
                  {otpChannel === 'email'
                    ? 'Verify Email OTP'
                    : otpChannel === 'both'
                    ? 'Dual Verification (WhatsApp & Email)'
                    : (otpUserPhone && otpUserPhone.length >= 10
                      ? 'Verify WhatsApp OTP'
                      : 'Mobile Verification')}
                </h3>

                <p className="text-[11.5px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  {otpChannel === 'email'
                    ? 'Please enter the 6-digit code sent to your email address:'
                    : otpChannel === 'both'
                    ? 'Enter the 6-digit verification code sent to WhatsApp and Email:'
                    : (otpUserPhone && otpUserPhone.length >= 10
                      ? 'Please enter the 6-digit code sent to your WhatsApp number:'
                      : 'Provide your 10-digit mobile number to receive your activation code:')}
                </p>

                {/* Target badge */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
                  {otpChannel === 'email' ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-zinc-800/80 rounded-full text-[11px] font-semibold text-slate-300 border border-zinc-700">
                      <Mail size={12} className="text-emerald-400" />
                      <span>{otpUserEmail}</span>
                    </div>
                  ) : otpChannel === 'both' ? (
                    <>
                      {otpUserPhone && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800/80 text-emerald-300 rounded-full text-[11px] font-semibold border border-zinc-700">
                          <Phone size={11} className="text-emerald-400" />
                          <span>+91 {otpUserPhone}</span>
                        </div>
                      )}
                      {otpUserEmail && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800/80 text-blue-300 rounded-full text-[11px] font-semibold border border-zinc-700">
                          <Mail size={11} className="text-blue-400" />
                          <span>{otpUserEmail}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    otpUserPhone && otpUserPhone.length >= 10 && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-zinc-800/80 rounded-full text-[11px] font-semibold text-slate-300 border border-zinc-700">
                        <Phone size={12} className="text-emerald-400" />
                        <span>+91 {otpUserPhone}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpUserPhone('');
                            setOtpDigits(['', '', '', '', '', '']);
                            setOtpPreview('');
                          }}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer ml-1"
                        >
                          (Change)
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Error / Success Banners */}
              {errorMsg && (
                <div className="text-xs bg-red-950/80 border border-red-600/80 text-red-200 p-2 rounded-lg flex items-start gap-2 animate-fadeIn">
                  <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-200/90 leading-tight">{errorMsg}</p>
                </div>
              )}

              {successMsg && (
                <div className="text-xs bg-emerald-950/80 border border-emerald-600/80 text-emerald-200 p-2 rounded-lg flex items-start gap-2 animate-fadeIn">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-emerald-200/90 leading-tight">{successMsg}</p>
                </div>
              )}

              {/* Mode A: Enter Mobile Number (if needed) */}
              {needsPhoneInput ? (
                <form onSubmit={handleSendStep2PhoneOtp} className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-300">
                      10-Digit Mobile Number
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center gap-1 text-slate-400 pointer-events-none text-xs pr-1 border-r border-zinc-700">
                        <Phone size={13} />
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        required
                        autoFocus
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Enter mobile number"
                        className="w-full bg-zinc-950/90 text-slate-100 placeholder-slate-400 text-xs sm:text-sm pl-17 pr-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-inner font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isOtpLoading || phone.replace(/[^0-9]/g, '').length < 10}
                    className="w-full bg-[#65a30d] hover:bg-[#4d7c0f] active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isOtpLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <span>Send Verification Code</span>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        clearErrors();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Back to Login</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Mode B: Enter 6-Digit OTP */
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  {/* Dev OTP Preview */}
                  {otpPreview && (
                    <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-600/70 text-amber-200 text-xs flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1">
                        <Zap size={13} className="text-amber-400" /> Dev OTP:
                      </span>
                      <span className="font-mono font-bold text-xs bg-amber-900/80 text-amber-100 px-2 py-0.5 rounded border border-amber-500">
                        {otpPreview}
                      </span>
                    </div>
                  )}

                  {/* 6 Digit Inputs */}
                  <div className="flex justify-center gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
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
                        className="w-10 h-11 sm:w-11 sm:h-12 text-center text-lg font-black rounded-xl border border-zinc-700 bg-zinc-950 text-white focus:bg-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none transition-all shadow-inner"
                      />
                    ))}
                  </div>

                  {/* Resend & Timer */}
                  <div className="flex items-center justify-between text-xs pt-1 px-1">
                    <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {resendTimer > 0 ? (
                        <span>Resend in <strong className="text-slate-200">{resendTimer}s</strong></span>
                      ) : (
                        <span>Didn&apos;t receive code?</span>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={!canResend || isOtpLoading}
                      className={`text-[11px] font-semibold transition cursor-pointer ${
                        canResend
                          ? 'text-emerald-400 hover:text-emerald-300 underline'
                          : 'text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Resend OTP
                    </button>
                  </div>

                  {/* Verify Action */}
                  <button
                    type="submit"
                    disabled={isOtpLoading}
                    className="w-full bg-[#65a30d] hover:bg-[#4d7c0f] active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  >
                    {isOtpLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-white" />
                        <span>Verify &amp; Enter Portal</span>
                      </>
                    )}
                  </button>

                  {/* Back to Login */}
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        clearErrors();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Back to Login</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Footer pinned at bottom with zero overflow */}
      <div className="text-center py-1 text-[10px] text-slate-400 space-y-0.5 z-10 w-full shrink-0">
        <p>©{currentYear} Education Masters • <span className="font-semibold text-slate-300">DigitArtTech</span></p>
      </div>
    </div>
  );
}
