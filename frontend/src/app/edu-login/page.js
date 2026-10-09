'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { toast } from '@/context/ToastContext';
import { BACKEND_URL } from '@/utils/api';

export default function EduLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams?.get('expired') === '1';

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isInactiveError, setIsInactiveError] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
  });

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const clearErrors = () => {
    setErrorMsg('');
    setIsInactiveError(false);
    setFieldErrors({ name: '', email: '', password: '' });
  };

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

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
    if (errorMsg) setErrorMsg('');
  };

  const handleOfficialGoogleSignIn = () => {
    clearErrors();
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
                    const welcomeName = profile.name || profile.email.split('@')[0];
                    toast.success({
                      title: '🎉 Google Login Successful!',
                      message: `Welcome back, ${welcomeName}! All MCQs and AI Performance features unlocked.`,
                    });
                    if (data.data?.token) {
                      const loginResult = await signIn('credentials', {
                        authType: 'session-token',
                        rawToken: data.data.token,
                        redirect: false,
                      });

                      if (loginResult?.ok) {
                        setSuccessMsg('Google sign-in successful! Redirecting to panel...');
                        router.push('/edu-admin');
                        router.refresh();
                        return;
                      }
                    }
                    setSuccessMsg('Google sign-in successful! Redirecting...');
                    router.push('/edu-admin');
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
        });
        client.requestAccessToken();
        return;
      } catch (err) {
        console.error('Google client error, falling back:', err);
      }
    }

    // Fallback to NextAuth Google Provider
    signIn('google', { callbackUrl: '/edu-admin' }).catch(() => {
      setErrorMsg('Failed to initialize Google Sign In.');
      setIsGoogleLoading(false);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    setSuccessMsg('');

    const newErrors = {};

    if (isRegisterMode && !name.trim()) {
      newErrors.name = 'Please enter your full name';
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
      else if (newErrors.email && emailRef.current) emailRef.current.focus();
      else if (newErrors.password && passwordRef.current) passwordRef.current.focus();
      return;
    }

    setIsLoading(true);

    try {
      if (isRegisterMode) {
        // Handle User Registration via /apis/v1/auth/register
        const res = await fetch(`${BACKEND_URL}/apis/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          const successText = data.message || 'Account registered successfully! Your account is currently inactive pending administrator approval.';
          setSuccessMsg(successText);
          toast.success({
            title: '🎉 Registration Successful!',
            message: successText,
          });
          setName('');
          setPassword('');
          setIsRegisterMode(false);
        } else {
          const errMsg = data.message || 'Registration failed. Please check your details.';
          setErrorMsg(errMsg);
          toast.error(errMsg);
          if (data.message?.toLowerCase().includes('email')) {
            setFieldErrors((prev) => ({ ...prev, email: data.message }));
            emailRef.current?.focus();
          }
        }
      } else {
        // Handle NextAuth Sign In with Credentials
        const result = await signIn('credentials', {
          email: email.trim(),
          password,
          redirect: false,
        });

        if (result?.ok) {
          setSuccessMsg('Login successful! Redirecting to panel...');
          toast.success({
            title: '🎉 Login Successful!',
            message: 'Welcome back! Opening admin dashboard.',
          });
          router.push('/edu-admin');
          router.refresh();
        } else {
          const err = result?.error || 'Invalid email or password';
          const isInactive =
            err.toLowerCase().includes('inactive') ||
            err.toLowerCase().includes('pending') ||
            err.toLowerCase().includes('deactivated') ||
            err.toLowerCase().includes('approval');

          setIsInactiveError(isInactive);
          setErrorMsg(err);
          toast.error(err);

          if (isInactive) {
            setFieldErrors({
              email: 'Account is deactivated or pending approval',
              password: '',
              name: '',
            });
            emailRef.current?.focus();
          } else {
            setFieldErrors({
              email: 'Please check your email address',
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

  const currentYear = new Date().getFullYear();

  const getInputStyle = (hasError) =>
    `w-full bg-zinc-950/90 text-slate-100 placeholder-slate-400 text-xs sm:text-sm pl-9 pr-3 py-2 rounded-lg border transition-all duration-200 shadow-inner ${hasError
      ? 'border-red-500 ring-2 ring-red-500/30 bg-red-950/20 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none'
      : 'border-zinc-700/80 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
    }`;

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
          <h2 className="text-base sm:text-lg font-bold text-center mb-0.5 text-white">
            {isRegisterMode ? 'Create Account' : 'Portal Login'}
          </h2>
          <p className="text-[11px] text-slate-400 text-center mb-3">
            {isRegisterMode
              ? 'Register for Education Masters access'
              : 'Sign in with your email and password'}
          </p>

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
              <span>Sign in with Google</span>
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
                <p className="font-bold text-amber-300">Account Pending</p>
                <p className="mt-0.5 text-[10.5px] text-amber-200/90 leading-tight">
                  Your account is pending administrator approval.
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
            )}

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
                  className={
                    getInputStyle(Boolean(fieldErrors.password)) +
                    ' pr-9'
                  }
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
        </div>
      </div>

      {/* Footer pinned at bottom with zero overflow */}
      <div className="text-center py-1 text-[10px] text-slate-400 space-y-0.5 z-10 w-full shrink-0">
        <p>©{currentYear} Education Masters • <span className="font-semibold text-slate-300">DigitArtTech</span></p>
      </div>
    </div>
  );
}
