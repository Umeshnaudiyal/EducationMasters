'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  X,
  Lock,
  Check,
  Zap,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Trophy,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  User,
  ArrowRight,
} from 'lucide-react';
import { toast } from '@/context/ToastContext';
import { getBackendUrl } from '@/utils/api';
import { loadRazorpayScript } from '@/utils/razorpay';

const API_BASE = getBackendUrl();

const DEFAULT_PLANS = [
  {
    id: 'plan_1_month',
    name: '1 Month Pass',
    price: 99,
    original_price: 199,
    validity: '1 Month',
    validity_days: 30,
    is_popular: false,
    tagline: 'Ideal for last-minute revision & quick test practice',
    features: [
      'Access to All Tests in This Series',
      'Instant All-India Rank & Percentile',
      'Detailed Step-by-Step Solutions',
      'Hindi & English Medium Support',
    ],
  },
  {
    id: 'plan_1_year',
    name: '1 Year Pro Pass',
    price: 199,
    original_price: 499,
    validity: '1 Year',
    validity_days: 365,
    is_popular: true,
    badge: 'MOST POPULAR',
    tagline: 'Best value for complete year-long exam preparation',
    features: [
      'Unlimited Access to All Mock Tests',
      'Previous Year Questions (PYPs) Included',
      'Real Exam CBT Interface & Timer',
      'Detailed Performance Analytics & Rank',
      'Valid for 365 Days',
    ],
  },
  {
    id: 'plan_2_years',
    name: '2 Years Ultimate Pass',
    price: 349,
    original_price: 899,
    validity: '2 Years',
    validity_days: 730,
    is_popular: false,
    badge: 'BEST VALUE',
    tagline: 'Long-term complete access for multiple exam attempts',
    features: [
      'All Future Test Updates & Additions',
      'All Full-Length & Sectional Papers',
      'Comprehensive Solution PDFs & Explanations',
      'Priority Support & Rank Leaderboard',
      'Valid for 2 Full Years',
    ],
  },
];

export default function UnlockPassModal({
  isOpen,
  onClose,
  series,
  targetTest,
  onSuccess,
}) {
  const { data: session } = useSession();

  // Pick plans from series or default
  const availablePlans =
    Array.isArray(series?.plans) && series.plans.length > 0
      ? series.plans
      : DEFAULT_PLANS;

  const [selectedPlan, setSelectedPlan] = useState(
    availablePlans.find((p) => p.is_popular) || availablePlans[0]
  );
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Sync user info from session when opened
  useEffect(() => {
    if (session?.user) {
      if (session.user.name) setUserName(session.user.name);
      if (session.user.email) setUserEmail(session.user.email);
    }
  }, [session, isOpen]);

  // Keep selected plan valid
  useEffect(() => {
    if (availablePlans.length > 0 && !selectedPlan) {
      setSelectedPlan(availablePlans.find((p) => p.is_popular) || availablePlans[0]);
    }
  }, [availablePlans, selectedPlan]);

  // Reset states on open/close
  useEffect(() => {
    if (!isOpen) {
      setErrorMsg('');
      setPaymentSuccess(false);
      setLoading(false);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleProceedPayment = async () => {
    try {
      setErrorMsg('');
      setLoading(true);

      const emailToUse = (userEmail || session?.user?.email || '').trim();
      const nameToUse = (userName || session?.user?.name || 'Aspirant').trim();
      const phoneToUse = userPhone.trim();

      if (!emailToUse) {
        setErrorMsg('Please enter your email address to receive pass access');
        setLoading(false);
        return;
      }

      // 1. Create order on backend
      const res = await fetch(`${API_BASE}/apis/v1/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.user?.token ? { Authorization: `Bearer ${session.user.token}` } : {}),
        },
        body: JSON.stringify({
          plan: selectedPlan,
          seriesId: series?._id || null,
          seriesTitle: series?.title || '',
          userName: nameToUse,
          userEmail: emailToUse,
          userPhone: phoneToUse,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create payment order');
      }

      // Handle Free Plan / Direct Activation
      if (data.data?.isFree || Number(selectedPlan.price) === 0) {
        setPaymentSuccess(true);
        if (onSuccess) {
          onSuccess(data.data);
        }
        setLoading(false);
        return;
      }

      const orderData = data.data;

      // 2. Load Razorpay JS SDK
      const isSdkLoaded = await loadRazorpayScript();
      if (!isSdkLoaded) {
        throw new Error('Could not load Razorpay SDK. Please check your internet connection.');
      }

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Education Masters',
        description: `${selectedPlan.name} • ${series?.title || 'Mock Test Pass'}`,
        image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            setLoading(true);
            const verifyRes = await fetch(`${API_BASE}/apis/v1/payments/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(session?.user?.token ? { Authorization: `Bearer ${session.user.token}` } : {}),
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: selectedPlan,
                userEmail: emailToUse,
                userName: nameToUse,
                userId: session?.user?.id || session?.user?._id,
                seriesId: series?._id,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setPaymentSuccess(true);
              toast.success({
                title: '🎉 Pass Unlocked Successfully!',
                message: `Your ${selectedPlan.name} is now active! All tests unlocked.`,
              });
              if (onSuccess) {
                onSuccess(verifyData.data);
              }
            } else {
              const errMsg = verifyData.message || 'Payment verification failed. Please contact support.';
              setErrorMsg(errMsg);
              toast.error(errMsg);
            }
          } catch (vErr) {
            console.error('Payment verification error:', vErr);
            const errMsg = 'Payment verification failed. Please contact support.';
            setErrorMsg(errMsg);
            toast.error(errMsg);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: nameToUse,
          email: emailToUse,
          contact: phoneToUse,
        },
        theme: {
          color: '#00c5d2',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        setErrorMsg(response.error?.description || 'Payment was unsuccessful or cancelled.');
        setLoading(false);
      });

      razorpay.open();
      setLoading(false);
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMsg(err.message || 'An error occurred during checkout');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Modal Top Header Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
              <Sparkles size={11} className="fill-slate-950" />
              <span>TEST PASS PRO</span>
            </span>
            <span className="text-xs text-slate-300 font-medium">100% Instant Access</span>
          </div>

          <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
            Unlock Full Access Pass
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            {targetTest?.title ? (
              <>
                Unlock <strong className="text-white">{targetTest.title}</strong> and all other tests in{' '}
                <strong className="text-amber-300">{series?.title || 'this test series'}</strong>.
              </>
            ) : (
              <>
                Get unlimited access to all full-length tests, previous year papers, and live All-India rankings for{' '}
                <strong className="text-amber-300">{series?.title || 'this series'}</strong>.
              </>
            )}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* SUCCESS STATE */}
          {paymentSuccess ? (
            <div className="py-8 px-4 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 border-2 border-emerald-300 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 size={36} strokeWidth={2.5} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-extrabold text-slate-900">
                  🎉 Pass Activated Successfully!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Your <strong className="text-slate-900">{selectedPlan.name}</strong> is now active. All paid tests, previous year papers, and full explanations are now unlocked.
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.location.reload();
                  }}
                  className="px-8 py-3 bg-[#00c5d2] hover:bg-[#00b0bd] text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
                >
                  Start Practicing Tests
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Error Banner if any */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. SELECT PLAN SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-500 fill-amber-500" />
                    <span>Select Your Preferred Plan</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">All plans include solutions</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {availablePlans.map((plan, idx) => {
                    const planKey = plan._id ? String(plan._id) : (plan.id || `${plan.name}_${plan.price}_${idx}`);
                    const selectedKey = selectedPlan?._id ? String(selectedPlan._id) : (selectedPlan?.id || `${selectedPlan?.name}_${selectedPlan?.price}_${availablePlans.indexOf(selectedPlan)}`);
                    const isSelected = Boolean(selectedPlan && (planKey === selectedKey || (plan.name === selectedPlan.name && Number(plan.price) === Number(selectedPlan.price))));
                    const isFree = plan.is_free || Number(plan.price) === 0;

                    return (
                      <button
                        key={planKey}
                        type="button"
                        onClick={() => setSelectedPlan(plan)}
                        className={`group relative p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#00c5d2] bg-gradient-to-b from-cyan-50/80 via-cyan-50/30 to-white ring-4 ring-[#00c5d2]/20 shadow-md scale-[1.02] -translate-y-0.5'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                        }`}
                      >
                        {/* Top Ribbon Badge */}
                        {plan.badge && (plan.badge !== '100% FREE' || isFree) && (
                          <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-full uppercase tracking-wider shadow-2xs">
                            {plan.badge}
                          </span>
                        )}

                        <div className="space-y-1 w-full">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                              {plan.name}
                            </h5>

                            {/* Radio Selection Checkmark */}
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                isSelected
                                  ? 'bg-[#00c5d2] text-white shadow-xs scale-105'
                                  : 'border-2 border-slate-300 group-hover:border-slate-400'
                              }`}
                            >
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                          </div>

                          <span className="text-[11px] text-slate-500 font-medium block">
                            Validity: {plan.validity || `${plan.validity_days || 365} Days`}
                          </span>
                        </div>

                        <div className="pt-3.5 flex items-baseline gap-1.5 border-t border-slate-100 mt-2">
                          <span className="text-xl sm:text-2xl font-black text-slate-900">
                            {isFree ? 'FREE' : `₹${plan.price}`}
                          </span>
                          {plan.original_price > plan.price && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{plan.original_price}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. PLAN FEATURES LIST */}
              {selectedPlan && (
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-xs font-bold text-slate-800">
                      What&apos;s Included in {selectedPlan.name}:
                    </span>
                    <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Instant Activation
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    {(selectedPlan.features && selectedPlan.features.length > 0
                      ? selectedPlan.features
                      : [
                          'Access to all tests in this series',
                          'Full bilingual solutions (Hindi & English)',
                          'Real CBT exam timer & interface',
                          'All-India live rank & percentile',
                        ]
                    ).map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-1.5">
                        <Check size={13} className="text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} />
                        <span className="text-slate-700">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. CANDIDATE CONTACT DETAILS (IF NOT LOGGED IN OR TO CONFIRM) */}
              <div className="space-y-2.5 pt-1">
                <label className="text-xs font-bold text-slate-900 block">
                  Candidate Account Details:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs text-slate-800 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c5d2]"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Email Address (for pass access)"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs text-slate-800 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c5d2]"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 4. TRUST BADGES & CHECKOUT BUTTON */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleProceedPayment}
                  className="w-full py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-[#00c5d2] hover:to-[#00a8cc] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Initializing Secure Razorpay Checkout...</span>
                    </>
                  ) : Number(selectedPlan.price) === 0 ? (
                    <>
                      <span>Activate Free Pass Now</span>
                      <ArrowRight size={16} />
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>Pay ₹{selectedPlan.price} &amp; Unlock Pass</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span>256-Bit Razorpay Secured</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CreditCard size={14} className="text-slate-400" />
                    <span>UPI • Cards • NetBanking • Wallets</span>
                  </span>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
