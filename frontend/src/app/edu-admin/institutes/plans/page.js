'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  PlusCircle,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Users,
  X,
  Edit2
} from 'lucide-react';
import AdminLoader from '@/components/admin/AdminLoader';

export default function InstituteCrmPlansPage() {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [planForm, setPlanForm] = useState({
    plan: '1_year_pro',
    durationMonths: 12,
    maxUsers: 10,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const fetchInstitutes = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/apis/v1/institutes?limit=50');
      const data = await res.json();
      if (data.success) {
        setInstitutes(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching institutes:', err);
    } finally {
      setLoading(false);
    }
  };

  const openPlanModal = (inst) => {
    setSelectedInstitute(inst);
    setPlanForm({
      plan: inst.subscription?.plan || '1_year_pro',
      durationMonths: 12,
      maxUsers: inst.subscription?.maxUsers || 5,
      isActive: inst.subscription?.isActive !== false,
    });
    setShowModal(true);
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    if (!selectedInstitute) return;
    setSaving(true);
    try {
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + parseInt(planForm.durationMonths));

      const payload = {
        subscription: {
          plan: planForm.plan,
          startDate,
          expiryDate,
          maxUsers: parseInt(planForm.maxUsers),
          isActive: planForm.isActive,
        },
      };

      const res = await fetch(`http://localhost:5001/apis/v1/institutes/${selectedInstitute._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchInstitutes();
      } else {
        alert(data.message || 'Failed to update subscription plan');
      }
    } catch (err) {
      console.error('Update plan error:', err);
      alert('Error updating CRM plan');
    } finally {
      setSaving(false);
    }
  };

  const plans = [
    {
      id: 'trial',
      name: '14-Day Free Trial',
      duration: '14 Days',
      users: '1 Admin + 1 Staff',
      leads: '50 Leads Limit',
      badge: 'bg-slate-100 text-slate-700',
    },
    {
      id: '6_months_starter',
      name: '6 Months Starter Plan',
      duration: '6 Months Validity',
      users: 'Up to 3 Staff Accounts',
      leads: '500 Leads / Month',
      badge: 'bg-blue-100 text-blue-800',
    },
    {
      id: '1_year_pro',
      name: '1 Year Pro Growth Plan',
      duration: '12 Months Validity',
      users: 'Up to 10 Staff Accounts',
      leads: 'Unlimited CRM Inquiries',
      badge: 'bg-purple-100 text-purple-800',
      popular: true,
    },
    {
      id: 'enterprise_custom',
      name: 'Custom Enterprise Plan',
      duration: 'Custom Validity',
      users: 'Unlimited Staff',
      leads: 'Dedicated Support & Webhooks',
      badge: 'bg-emerald-100 text-emerald-800',
    },
  ];

  const filteredInstitutes = institutes.filter((inst) => {
    const title = inst.name || inst.title || '';
    const matchesSearch = title.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-4 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Institutes CRM Plans & Validity
            </h1>
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full border border-purple-200">
              CRM Subscriptions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Grant and manage CRM panel validity for listed educational institutes (Months/Year subscriptions).
          </p>
        </div>
      </div>

      {/* Plan Tier Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`p-4 rounded-xl border bg-white shadow-sm flex flex-col justify-between relative ${
              p.popular ? 'border-purple-300 ring-2 ring-purple-100' : 'border-slate-200'
            }`}
          >
            {p.popular && (
              <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                Recommended
              </span>
            )}
            <div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${p.badge}`}>
                {p.name}
              </span>
              <h3 className="text-sm font-bold text-slate-800 mt-2">{p.duration}</h3>
              <ul className="text-xs text-slate-500 mt-3 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <Users size={13} className="text-slate-400" />
                  <span>{p.users}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>{p.leads}</span>
                </li>
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Institutes CRM Status Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-800">Institute Subscriptions Directory</h3>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search institute..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-56"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center">
            <AdminLoader
              text="Loading CRM Subscriptions..."
              subtext="Retrieving institute subscription plans and validity data"
              minHeight="min-h-[260px]"
            />
          </div>
        ) : filteredInstitutes.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Building2 size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No institutes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 w-12 text-center">#</th>
                  <th className="p-3.5 min-w-[240px]">Institute</th>
                  <th className="p-3.5 min-w-[140px]">Current Plan</th>
                  <th className="p-3.5">Validity Range</th>
                  <th className="p-3.5 text-center">Max Staff</th>
                  <th className="p-3.5 text-center">CRM Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInstitutes.map((inst, idx) => {
                  const name = inst.name || inst.title || 'Educational Institute';
                  const plan = inst.subscription?.plan || '1_year_pro';
                  const isActive = inst.subscription?.isActive !== false;
                  const maxUsers = inst.subscription?.maxUsers || 5;

                  return (
                    <tr key={inst._id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {inst.logo ? (
                              <img
                                src={inst.logo.startsWith('http') ? inst.logo : `http://localhost:5001${inst.logo}`}
                                alt={name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building2 size={16} className="text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 line-clamp-1">{name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              ID: {inst.sql_id || inst._id?.slice(-6)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 capitalize">
                          {plan.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Calendar size={13} className="text-slate-400" />
                          <span>1 Year (Auto-Renew)</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-semibold text-slate-700">
                        {maxUsers} Users
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {isActive ? 'Active' : 'Expired'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => openPlanModal(inst)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold border border-blue-200 transition-colors"
                        >
                          <Edit2 size={12} />
                          Assign Plan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign / Upgrade Plan Modal */}
      {showModal && selectedInstitute && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Assign CRM Subscription Plan</h3>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {selectedInstitute.name || selectedInstitute.title}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdatePlan} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select CRM Plan</label>
                <select
                  value={planForm.plan}
                  onChange={(e) => setPlanForm({ ...planForm, plan: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="trial">14-Day Free Trial</option>
                  <option value="6_months_starter">6 Months Starter Plan</option>
                  <option value="1_year_pro">1 Year Pro Growth Plan</option>
                  <option value="enterprise_custom">Custom Enterprise Plan</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Validity Duration
                  </label>
                  <select
                    value={planForm.durationMonths}
                    onChange={(e) => setPlanForm({ ...planForm, durationMonths: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="1">1 Month</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="12">1 Year (12 Months)</option>
                    <option value="24">2 Years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Max Staff Users
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={planForm.maxUsers}
                    onChange={(e) => setPlanForm({ ...planForm, maxUsers: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={planForm.isActive}
                  onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Activate CRM Panel Access Immediately
                </label>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  {saving ? 'Saving...' : 'Apply Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
