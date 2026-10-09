'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  CreditCard,
  Check,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  RefreshCw,
  Search,
  Copy,
  Layers,
  Zap,
  Tag,
  ShieldCheck,
  Eye,
  CheckCheck,
} from 'lucide-react';
import { getAuthToken } from '@/utils/auth';
import { slugify } from '@/utils/slug';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { toast } from '@/context/ToastContext';
import { BACKEND_URL } from '@/utils/api';

const API_BASE = BACKEND_URL;

export default function MockTestPlansManagePage() {
  const { data: session } = useSession();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverMessage, setServerMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    tagline: '',
    price: 299,
    original_price: 599,
    validity: '1 Year',
    validity_days: 365,
    is_free: false,
    is_popular: true,
    badge: 'MOST POPULAR',
    features: [
      'Access to All Full Length & Sectional Tests',
      'Detailed Step-by-Step Solutions',
      'All India Rank & Percentile Report',
      'Unlimited Re-attempts & Deep Analytics',
    ],
    button_text: 'Select ₹299 Plan',
    status: 'active',
    order: 0,
  });

  const [formErrors, setFormErrors] = useState({});

  // Input Refs for client-side error scrolling & focusing
  const nameRef = useRef(null);
  const slugRef = useRef(null);
  const priceRef = useRef(null);
  const validityRef = useRef(null);

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null, isLoading: false });

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken(session);
      const res = await fetch(`${API_BASE}/apis/v1/mock-test-plans/admin/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setPlans(data.data || []);
      } else {
        setPlans([]);
      }
    } catch (err) {
      console.error('Fetch plans error:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormErrors({});
    setFormData({
      name: '',
      slug: '',
      tagline: 'Full access to mock tests with solutions and analytics.',
      price: 299,
      original_price: 599,
      validity: '1 Year',
      validity_days: 365,
      is_free: false,
      is_popular: false,
      badge: 'POPULAR PASS',
      features: [
        'Access to All Full Length & Sectional Tests',
        'Detailed Step-by-Step Solutions',
        'All India Rank & Percentile Report',
        'Unlimited Re-attempts & Deep Analytics',
      ],
      button_text: 'Select ₹299 Plan',
      status: 'active',
      order: 0,
    });
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setFormErrors({});
    setFormData({
      name: plan.name || '',
      slug: plan.slug || '',
      tagline: plan.tagline || '',
      price: plan.price ?? 0,
      original_price: plan.original_price ?? 0,
      validity: plan.validity || '1 Year',
      validity_days: plan.validity_days || 365,
      is_free: Boolean(plan.is_free),
      is_popular: Boolean(plan.is_popular),
      badge: plan.badge || '',
      features: Array.isArray(plan.features) && plan.features.length > 0 ? plan.features : [''],
      button_text: plan.button_text || 'Select Plan',
      status: plan.status || 'active',
      order: plan.order ?? 0,
    });
    setIsFormOpen(true);
  };

  // Duplicate Plan
  const handleDuplicate = (plan) => {
    setEditingPlan(null);
    setFormErrors({});
    setFormData({
      name: `${plan.name} (Copy)`,
      slug: `${plan.slug}-copy`,
      tagline: plan.tagline || '',
      price: plan.price ?? 0,
      original_price: plan.original_price ?? 0,
      validity: plan.validity || '1 Year',
      validity_days: plan.validity_days || 365,
      is_free: Boolean(plan.is_free),
      is_popular: false,
      badge: plan.badge || '',
      features: Array.isArray(plan.features) ? [...plan.features] : [],
      button_text: plan.button_text || 'Select Plan',
      status: 'active',
      order: (plan.order || 0) + 1,
    });
    setIsFormOpen(true);
  };

  // Handle Field Changes
  const handleFieldChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'price') {
        const numPrice = Number(value);
        if (numPrice === 0) {
          next.is_free = true;
          if (!prev.button_text || prev.button_text.includes('₹')) {
            next.button_text = 'Select Free Plan';
          }
          if (!prev.badge || prev.badge === 'POPULAR PASS' || prev.badge === 'MOST POPULAR') {
            next.badge = '100% FREE';
          }
        } else {
          next.is_free = false;
          if (next.button_text === 'Select Free Plan') {
            next.button_text = `Select ₹${numPrice} Plan`;
          }
        }
      }
      return next;
    });

    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Features list handlers
  const addFeature = () => {
    setFormData((prev) => ({ ...prev, features: [...prev.features, ''] }));
  };

  const updateFeature = (index, value) => {
    setFormData((prev) => {
      const next = [...prev.features];
      next[index] = value;
      return { ...prev, features: next };
    });
  };

  const removeFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // Client-side Validation with Ref Scrolling
  const validateForm = () => {
    const errors = {};
    let firstErrorRef = null;

    if (!formData.name?.trim()) {
      errors.name = 'Plan Name is required';
      firstErrorRef = nameRef;
    }

    if (!formData.slug?.trim()) {
      errors.slug = 'Plan URL Slug is required';
      firstErrorRef = firstErrorRef || slugRef;
    }

    if (formData.price === undefined || formData.price === null || formData.price === '') {
      errors.price = 'Price is required (0 for Free)';
      firstErrorRef = firstErrorRef || priceRef;
    }

    if (!formData.validity?.trim()) {
      errors.validity = 'Validity label is required (e.g. 1 Year, 6 Months)';
      firstErrorRef = firstErrorRef || validityRef;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (firstErrorRef?.current) {
        firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorRef.current.focus();
      }
      setServerMessage({
        type: 'error',
        text: 'Please fill in all required fields marked in red.',
      });
      return false;
    }

    return true;
  };

  // Save Plan
  const handleSavePlan = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setServerMessage(null);

    if (!validateForm()) return;

    try {
      setSaving(true);
      const token = getAuthToken(session);
      const url = editingPlan
        ? `${API_BASE}/apis/v1/mock-test-plans/${editingPlan._id}`
        : `${API_BASE}/apis/v1/mock-test-plans`;
      const method = editingPlan ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        name: formData.name.trim(),
        slug: slugify(formData.slug),
        price: Number(formData.price) || 0,
        original_price: Number(formData.original_price) || 0,
        validity_days: Number(formData.validity_days) || 365,
        features: formData.features.filter((f) => f && f.trim()),
      };

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
        const msg = editingPlan ? 'Plan updated successfully.' : 'Plan created successfully.';
        setServerMessage({
          type: 'success',
          text: msg,
        });
        toast.success(msg);
        setIsFormOpen(false);
        fetchPlans();
      } else {
        if (data.errors) {
          setFormErrors(data.errors);
          if (data.errors.slug && slugRef.current) {
            slugRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            slugRef.current.focus();
          } else if (data.errors.name && nameRef.current) {
            nameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            nameRef.current.focus();
          }
        }
        const errMsg = data.message || 'Failed to save plan. Please check the form.';
        setServerMessage({
          type: 'error',
          text: errMsg,
        });
        toast.error(errMsg);
      }
    } catch (err) {
      console.error('Save plan error:', err);
      const errMsg = 'Network error occurred while saving plan.';
      setServerMessage({ type: 'error', text: errMsg });
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  // Toggle status directly
  const handleToggleStatus = async (plan) => {
    const newStatus = plan.status === 'active' ? 'inactive' : 'active';
    try {
      const token = getAuthToken(session);
      const res = await fetch(`${API_BASE}/apis/v1/mock-test-plans/${plan._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPlans((prev) =>
          prev.map((p) => (p._id === plan._id ? { ...p, status: newStatus } : p))
        );
        const msg = `Plan status set to ${newStatus}.`;
        setServerMessage({
          type: 'success',
          text: msg,
        });
        toast.success(msg);
      }
    } catch (err) {
      console.error('Status toggle error:', err);
      toast.error('Failed to toggle status');
    }
  };

  // Delete Plan
  const handleDeletePlan = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal((prev) => ({ ...prev, isLoading: true }));
      const token = getAuthToken(session);
      const res = await fetch(`${API_BASE}/apis/v1/mock-test-plans/${deleteModal.item._id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setServerMessage({ type: 'success', text: 'Plan deleted successfully.' });
        toast.success('Plan deleted successfully.');
        fetchPlans();
      } else {
        const errMsg = data.message || 'Failed to delete plan.';
        setServerMessage({ type: 'error', text: errMsg });
        toast.error(errMsg);
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Error deleting plan.');
    } finally {
      setDeleteModal({ isOpen: false, item: null, isLoading: false });
    }
  };

  // Filtered plans
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      !searchQuery ||
      plan.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.tagline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.badge?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || plan.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate discount percentage
  const discountPercent =
    formData.original_price > formData.price
      ? Math.round(((formData.original_price - formData.price) / formData.original_price) * 100)
      : 0;

  return (
    <div className="space-y-6 w-full font-sans text-slate-800 pb-24">
      {/* Toast Alert */}
      {serverMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2.5 border animate-in slide-in-from-top-2 ${
            serverMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {serverMessage.type === 'error' ? (
            <AlertCircle size={15} className="text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          )}
          <span>{serverMessage.text}</span>
          <button
            type="button"
            onClick={() => setServerMessage(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/edu-admin/mock-tests" className="hover:text-[#2271b1] flex items-center gap-1 font-semibold">
              <ArrowLeft size={13} />
              <span>Mock Tests Hub</span>
            </Link>
            <span>/</span>
            <span className="text-[#2271b1] font-semibold">Master Pricing Plans</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="text-[#2271b1]" size={24} />
            <span>Master Pricing Plans & Passes Pool</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create and maintain reusable subscription passes (Free, Pro, Premium) available to attach to any Mock Test Series.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchPlans}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Master Plan</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plans by name or badge..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#2271b1] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({plans.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'active'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({plans.filter((p) => p.status === 'active').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactive ({plans.filter((p) => p.status === 'inactive').length})
            </button>
          </div>
        </div>
      </div>

      {/* Plans Grid (Live Cards Matching Reference UI) */}
      {loading ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
          <Loader2 size={24} className="animate-spin text-[#2271b1] mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">Loading master pricing plans...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <CreditCard size={36} className="text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {plans.length === 0 ? 'No Master Plans Created Yet' : 'No Plans Found Matching Filters'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {plans.length === 0
              ? 'Create standard plan tiers (Free Demo, 1 Year Pass, 2 Years Pass) to easily attach to series.'
              : 'Try changing your search query or status filter.'}
          </p>
          {plans.length === 0 && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2271b1] text-white text-xs font-semibold rounded-xl hover:bg-[#135e96] cursor-pointer"
            >
              <Plus size={14} />
              <span>Create First Plan</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-5 items-stretch">
          {filteredPlans.map((plan) => {
            const isPopular = plan.is_popular;
            const isFree = plan.is_free || Number(plan.price) === 0;
            const isActive = plan.status === 'active';

            return (
              <div
                key={plan._id}
                className={`w-full sm:w-[290px] max-w-[300px] rounded-3xl border-2 p-5 flex flex-col justify-between relative transition-all duration-300 shadow-xs hover:shadow-xl bg-white ${
                  !isActive
                    ? 'opacity-65 border-dashed border-slate-300'
                    : isPopular
                    ? 'border-amber-400 ring-4 ring-amber-400/15'
                    : isFree
                    ? 'border-emerald-400 ring-2 ring-emerald-400/10'
                    : 'border-purple-400 ring-2 ring-purple-400/10'
                }`}
              >
                {/* Top Badge */}
                {plan.badge && (
                  <span
                    className={`absolute -top-3 right-6 px-3 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm ${
                      isPopular
                        ? 'bg-amber-500 text-white'
                        : isFree
                        ? 'bg-emerald-500 text-white'
                        : 'bg-purple-600 text-white'
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}

                <div className="space-y-3.5">
                  {/* Status Indicator & Plan Name Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wider ${
                        isFree
                          ? 'bg-emerald-50 text-emerald-700'
                          : isPopular
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {plan.name}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(plan)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title="Click to toggle active status"
                    >
                      {isActive ? '● Active' : '○ Inactive'}
                    </button>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-1 text-slate-900 font-extrabold">
                      <span className="text-2xl sm:text-3xl">
                        {isFree ? 'FREE' : `₹${plan.price}`}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        / {plan.validity}
                      </span>
                    </div>

                    {plan.original_price > plan.price && (
                      <div className="flex items-center gap-2 text-xs mt-0.5">
                        <span className="text-slate-400 line-through text-[11px]">
                          ₹{plan.original_price}
                        </span>
                        <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded font-bold text-[9px]">
                          SAVE {Math.round(((plan.original_price - plan.price) / plan.original_price) * 100)}%
                        </span>
                      </div>
                    )}

                    {plan.tagline && (
                      <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
                        {plan.tagline}
                      </p>
                    )}
                  </div>

                  {/* Features Checklist */}
                  <div className="space-y-2 pt-2.5 border-t border-slate-100">
                    {(plan.features || []).map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                        <div
                          className={`p-0.5 rounded-full mt-0.5 shrink-0 ${
                            isFree
                              ? 'bg-emerald-100 text-emerald-600'
                              : isPopular
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          <Check size={10} className="stroke-[3]" />
                        </div>
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom CTA & Admin Controls */}
                <div className="pt-5 space-y-2.5">
                  <div
                    className={`w-full py-2 rounded-xl text-center text-xs font-bold text-white shadow-xs select-none ${
                      isPopular
                        ? 'bg-amber-600'
                        : isFree
                        ? 'bg-emerald-600'
                        : 'bg-slate-900'
                    }`}
                  >
                    {plan.button_text || 'Select Plan'}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[10px] text-slate-400 font-mono">
                      /{plan.slug}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDuplicate(plan)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                        title="Duplicate Plan"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(plan)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                      >
                        <Edit2 size={11} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteModal({ isOpen: true, item: plan, isLoading: false })}
                        className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete Plan"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Professional Plan Form Modal with Live Real-Time Card Preview */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full p-5 sm:p-7 shadow-2xl my-auto space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="text-[#2271b1]" size={20} />
                  <span>{editingPlan ? 'Edit Pricing Plan' : 'Create Master Pricing Plan'}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure plan settings with live side-by-side visual preview.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Left Inputs + Right Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form Fields */}
              <form onSubmit={handleSavePlan} className="lg:col-span-7 space-y-4 text-xs">
                {/* Plan Name & Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800">
                      Plan Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      ref={nameRef}
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        handleFieldChange('name', e.target.value);
                        if (!editingPlan) handleFieldChange('slug', slugify(e.target.value));
                      }}
                      placeholder="e.g. Pro Plan, 1 Year Pass"
                      className={`w-full p-2.5 bg-white border rounded-xl outline-none transition-all ${
                        formErrors.name
                          ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200'
                          : 'border-slate-300 focus:border-[#2271b1]'
                      }`}
                    />
                    {formErrors.name && (
                      <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                        <AlertCircle size={11} /> {formErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800">
                      URL Slug <span className="text-rose-500">*</span>
                    </label>
                    <input
                      ref={slugRef}
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleFieldChange('slug', slugify(e.target.value))}
                      placeholder="e.g. pro-plan"
                      className={`w-full p-2.5 bg-white border font-mono rounded-xl outline-none transition-all ${
                        formErrors.slug
                          ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200'
                          : 'border-slate-300 focus:border-[#2271b1]'
                      }`}
                    />
                    {formErrors.slug && (
                      <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                        <AlertCircle size={11} /> {formErrors.slug}
                      </p>
                    )}
                  </div>
                </div>

                {/* Badge & Presets */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 flex items-center justify-between">
                    <span>Badge / Highlight Tag</span>
                    <span className="text-[10px] text-slate-400">Presets below:</span>
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => handleFieldChange('badge', e.target.value)}
                    placeholder="e.g. MOST POPULAR, 100% FREE, BEST VALUE"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-[#2271b1]"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['100% FREE', 'MOST POPULAR', 'BEST VALUE', 'LIMITED OFFER', 'RECOMMENDED'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => handleFieldChange('badge', b)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold rounded-md transition-colors cursor-pointer"
                      >
                        + {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price, Original Price & Validity */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800">
                      Price (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      ref={priceRef}
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleFieldChange('price', Number(e.target.value))}
                      placeholder="0"
                      className={`w-full p-2.5 bg-white border font-bold rounded-xl outline-none transition-all ${
                        formErrors.price
                          ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200'
                          : 'border-slate-300 focus:border-[#2271b1]'
                      }`}
                    />
                    {formErrors.price && (
                      <p className="text-[11px] text-rose-600 font-semibold">{formErrors.price}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800">Original Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.original_price}
                      onChange={(e) => handleFieldChange('original_price', Number(e.target.value))}
                      placeholder="0"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-[#2271b1]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800">
                      Validity <span className="text-rose-500">*</span>
                    </label>
                    <input
                      ref={validityRef}
                      type="text"
                      value={formData.validity}
                      onChange={(e) => handleFieldChange('validity', e.target.value)}
                      placeholder="1 Year, 6 Months"
                      className={`w-full p-2.5 bg-white border rounded-xl outline-none transition-all ${
                        formErrors.validity
                          ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-200'
                          : 'border-slate-300 focus:border-[#2271b1]'
                      }`}
                    />
                    {formErrors.validity && (
                      <p className="text-[11px] text-rose-600 font-semibold">{formErrors.validity}</p>
                    )}
                  </div>
                </div>

                {/* Validity in Days & Order */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800">Validity in Days</label>
                    <input
                      type="number"
                      value={formData.validity_days}
                      onChange={(e) => handleFieldChange('validity_days', Number(e.target.value))}
                      placeholder="365"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-[#2271b1]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800">Display Order</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => handleFieldChange('order', Number(e.target.value))}
                      placeholder="0"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-[#2271b1]"
                    />
                  </div>
                </div>

                {/* Tagline */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-800">Tagline Description</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => handleFieldChange('tagline', e.target.value)}
                    placeholder="Short summary under price (e.g. Full 1 year access to all mock tests)"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-[#2271b1]"
                  />
                </div>

                {/* Features Checklist */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <CheckCheck size={14} className="text-[#2271b1]" />
                      <span>Plan Features Checklist</span>
                    </label>
                    <button
                      type="button"
                      onClick={addFeature}
                      className="text-[#2271b1] font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus size={13} />
                      <span>Add Feature</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {formData.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 w-4">{idx + 1}.</span>
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) => updateFeature(idx, e.target.value)}
                          placeholder="Feature item description..."
                          className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:border-[#2271b1] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeFeature(idx)}
                          className="text-slate-400 hover:text-rose-500 font-bold p-1 cursor-pointer"
                          title="Remove feature"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Button Text */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-800">Button Call-To-Action Text</label>
                  <input
                    type="text"
                    value={formData.button_text}
                    onChange={(e) => handleFieldChange('button_text', e.target.value)}
                    placeholder="e.g. Select ₹299 Plan, Get Started Free"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-[#2271b1]"
                  />
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap items-center gap-5 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.is_popular}
                      onChange={(e) => handleFieldChange('is_popular', e.target.checked)}
                      className="rounded border-slate-300 text-amber-500 w-4 h-4"
                    />
                    <span>Highlight as Most Popular</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.status === 'active'}
                      onChange={(e) => handleFieldChange('status', e.target.checked ? 'active' : 'inactive')}
                      className="rounded border-slate-300 text-emerald-600 w-4 h-4"
                    />
                    <span>Active Status</span>
                  </label>
                </div>
              </form>

              {/* Right Column: Live Card Preview */}
              <div className="lg:col-span-5 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3 sticky top-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Eye size={14} className="text-[#2271b1]" />
                    <span>Live Student View Preview</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    Real-time
                  </span>
                </div>

                {/* Live Card */}
                <div
                  className={`rounded-3xl border-2 p-5 flex flex-col justify-between relative transition-all duration-300 shadow-md bg-white ${
                    formData.is_popular
                      ? 'border-amber-400 ring-4 ring-amber-400/15'
                      : formData.is_free || Number(formData.price) === 0
                      ? 'border-emerald-400 ring-2 ring-emerald-400/10'
                      : 'border-purple-500 ring-2 ring-purple-500/10'
                  }`}
                >
                  {/* Top Badge */}
                  {formData.badge && (
                    <span
                      className={`absolute -top-3 right-6 px-3.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider shadow-xs ${
                        formData.is_popular
                          ? 'bg-amber-500 text-white'
                          : formData.is_free || Number(formData.price) === 0
                          ? 'bg-emerald-500 text-white'
                          : 'bg-purple-600 text-white'
                      }`}
                    >
                      {formData.badge}
                    </span>
                  )}

                  <div className="space-y-3">
                    {/* Plan Name Pill */}
                    <span
                      className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wider ${
                        formData.is_free || Number(formData.price) === 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : formData.is_popular
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {formData.name || 'Plan Name'}
                    </span>

                    {/* Price */}
                    <div>
                      <div className="flex items-baseline gap-1 text-slate-900 font-extrabold">
                        <span className="text-3xl">
                          {formData.is_free || Number(formData.price) === 0 ? 'FREE' : `₹${formData.price || 0}`}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          / {formData.validity || '1 Year'}
                        </span>
                      </div>

                      {discountPercent > 0 && (
                        <div className="flex items-center gap-1.5 text-xs mt-0.5">
                          <span className="text-slate-400 line-through text-[11px]">
                            ₹{formData.original_price}
                          </span>
                          <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded font-bold text-[9px]">
                            SAVE {discountPercent}%
                          </span>
                        </div>
                      )}

                      {formData.tagline && (
                        <p className="text-[11px] text-slate-500 mt-1.5 font-medium leading-relaxed">
                          {formData.tagline}
                        </p>
                      )}
                    </div>

                    {/* Features Checklist */}
                    <div className="space-y-2 pt-2.5 border-t border-slate-100">
                      {formData.features.filter((f) => f && f.trim()).length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No features added yet</p>
                      ) : (
                        formData.features
                          .filter((f) => f && f.trim())
                          .map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-700 font-medium">
                              <div
                                className={`p-0.5 rounded-full mt-0.5 shrink-0 ${
                                  formData.is_free || Number(formData.price) === 0
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : formData.is_popular
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-purple-100 text-purple-700'
                                }`}
                              >
                                <Check size={10} className="stroke-[3]" />
                              </div>
                              <span className="leading-tight">{feat}</span>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Button */}
                  <div className="pt-4">
                    <div
                      className={`w-full py-2 rounded-xl text-center text-xs font-bold text-white shadow-xs ${
                        formData.is_popular
                          ? 'bg-amber-600'
                          : formData.is_free || Number(formData.price) === 0
                          ? 'bg-emerald-600'
                          : 'bg-slate-900'
                      }`}
                    >
                      {formData.button_text || 'Select Plan'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePlan}
                disabled={saving}
                className="px-6 py-2 bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                <span>{editingPlan ? 'Update Plan' : 'Save Plan to Pool'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null, isLoading: false })}
        onConfirm={handleDeletePlan}
        title={`Delete plan "${deleteModal.item?.name}"?`}
        message="Are you sure you want to delete this pricing plan from the master pool?"
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
