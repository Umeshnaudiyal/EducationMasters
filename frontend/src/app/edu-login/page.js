'use client';

import { useState, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export default function EduLoginPage() {
  const router = useRouter();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
          setSuccessMsg(
            data.message ||
              'Account registered successfully! Your account is currently inactive pending administrator approval.'
          );
          setName('');
          setPassword('');
          setIsRegisterMode(false);
        } else {
          setErrorMsg(data.message || 'Registration failed. Please check your details.');
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
    `w-full bg-zinc-950/90 text-slate-100 placeholder-slate-400 text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded border transition-all duration-200 shadow-inner ${
      hasError
        ? 'border-red-500 ring-2 ring-red-500/30 bg-red-950/20 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none'
        : 'border-zinc-700/80 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
    }`;

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-950 font-sans text-white relative overflow-hidden select-none bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.75)), url('/login.webp')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Logo */}
        <div className="mb-6 flex flex-col items-center">
          <a href="/" title="Back to Home">
            <img
              src="/logo.webp"
              alt="Education Masters"
              className="h-16 sm:h-20 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform"
            />
          </a>
        </div>

        {/* Card Container */}
        <div className="w-full max-w-xs sm:max-w-sm bg-zinc-900/95 border border-zinc-800/90 p-6 sm:p-7 rounded-2xl shadow-2xl backdrop-blur-md">
          <h2 className="text-xl font-bold text-center mb-1 text-white">
            {isRegisterMode ? 'Create Account' : 'Portal Login'}
          </h2>
          <p className="text-xs text-slate-400 text-center mb-5">
            {isRegisterMode
              ? 'Register for Education Masters access'
              : 'Sign in with your email and password'}
          </p>

          {/* Inactive User Alert Card */}
          {isInactiveError && (
            <div className="mb-4 text-xs bg-amber-950/80 border border-amber-600/80 text-amber-200 p-3 rounded-lg flex items-start gap-2.5 animate-fadeIn">
              <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">Account Deactivated / Pending</p>
                <p className="mt-0.5 text-[11px] text-amber-200/90 leading-tight">
                  Your account is currently inactive or awaiting administrator approval. Please contact the site administrator.
                </p>
              </div>
            </div>
          )}

          {/* Standard Error Banner */}
          {errorMsg && !isInactiveError && (
            <div className="mb-4 text-xs bg-red-950/80 border border-red-600/80 text-red-200 p-3 rounded-lg flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-300">Authentication Failed</p>
                <p className="mt-0.5 text-[11px] text-red-200/90 leading-tight">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-4 text-xs bg-emerald-950/80 border border-emerald-600/80 text-emerald-200 p-3 rounded-lg flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-300">Success</p>
                <p className="mt-0.5 text-[11px] text-emerald-200/90 leading-tight">{successMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {isRegisterMode && (
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none text-xs">👤</span>
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
                  <p className="text-[11px] text-red-400 font-medium pl-1 flex items-center gap-1">
                    <AlertCircle size={11} />
                    <span>{fieldErrors.name}</span>
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 pointer-events-none text-xs">✉️</span>
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
                <p className="text-[11px] text-red-400 font-medium pl-1 flex items-center gap-1">
                  <AlertCircle size={11} />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 pointer-events-none text-xs">🔑</span>
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Password"
                  className={
                    getInputStyle(Boolean(fieldErrors.password)) +
                    ' pr-10'
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition focus:outline-none cursor-pointer p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-red-400 font-medium pl-1 flex items-center gap-1">
                  <AlertCircle size={11} />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            {!isRegisterMode && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
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
              className="w-full bg-[#65a30d] hover:bg-[#4d7c0f] active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg transition shadow-md hover:scale-[1.01] cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
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
          <div className="text-center pt-4 border-t border-zinc-800 mt-4">
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

        <div className="text-center pt-6 text-[10px] sm:text-xs text-slate-400 space-y-0.5 z-10 w-full">
          <p>©{currentYear} Education Masters</p>
          <p className="font-semibold text-slate-300">DigitArtTech</p>
        </div>
      </div>
    </div>
  );
}
