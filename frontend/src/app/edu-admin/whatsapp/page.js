'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Smartphone,
  RefreshCw,
  Plus,
  Trash2,
  PowerOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  ShieldCheck,
  QrCode,
  Loader2,
  Activity,
  Layers,
  ChevronRight,
  Filter,
  Search,
  ExternalLink,
  MessageSquare,
  X,
  Copy,
  Check,
  Sliders,
  Settings,
} from 'lucide-react';
import { BACKEND_URL } from '@/utils/api';

const WhatsAppIcon = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`shrink-0 ${className}`}
  >
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.19.53-1.06 1.04-1.46 1.1-.38.07-.86.1-2.49-.58-1.97-.82-3.23-2.83-3.33-2.96-.1-.14-.8-1.07-.8-2.04s.51-1.45.69-1.65c.19-.19.41-.24.55-.24.14 0 .28 0 .4.01.13.01.3.05.47.45.17.41.6 1.45.65 1.55.05.1.09.22.02.35-.07.14-.11.22-.21.35-.11.12-.23.28-.33.37-.11.11-.23.23-.1.45.13.22.58.96 1.25 1.56.86.77 1.59 1.01 1.81 1.12.22.11.35.1.48-.05.14-.14.58-.68.74-.91.16-.23.32-.19.53-.11.22.08 1.39.66 1.63.78.24.12.4.18.46.28.06.1.06.6-.13 1.13z" />
  </svg>
);

export default function WhatsAppIntegrationPage() {
  const { data: session } = useSession();

  // Pool State
  const [poolStatus, setPoolStatus] = useState(null);
  const [loadingPool, setLoadingPool] = useState(true);
  const [poolError, setPoolError] = useState(null);

  // New Worker Modal
  const [showNewWorkerModal, setShowNewWorkerModal] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [creatingWorker, setCreatingWorker] = useState(false);

  // Enlarge QR Modal
  const [qrModalSession, setQrModalSession] = useState(null);

  // Action Loading States per session: { [sessionId]: 'reconnecting' | 'disconnecting' | 'deleting' }
  const [actionLoading, setActionLoading] = useState({});

  // Simulator State (Test OTP & Verify)
  const [testPhone, setTestPhone] = useState('');
  const [testSelectedSession, setTestSelectedSession] = useState('');
  const [sendingTestOtp, setSendingTestOtp] = useState(false);
  const [testOtpResult, setTestOtpResult] = useState(null);

  const [verifyOtpInput, setVerifyOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  // Audit Logs State
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPages, setLogsPages] = useState(1);
  const [logsStatusFilter, setLogsStatusFilter] = useState('ALL');
  const [logsSearch, setLogsSearch] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Notification Banner
  const [toast, setToast] = useState(null);
  const showToast = (type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 5000);
  };

  const getAuthHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (session?.user?.accessToken) {
      headers['Authorization'] = `Bearer ${session.user.accessToken}`;
    }
    return headers;
  }, [session]);

  // Fetch Pool Status
  const fetchPoolStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/whatsapp/pool-status`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPoolStatus(json.data);
        setPoolError(null);
      } else {
        setPoolError(json.message || 'Failed to fetch WhatsApp pool status.');
      }
    } catch (err) {
      setPoolError(err.message || 'Could not connect to WhatsApp pool service.');
    } finally {
      setLoadingPool(false);
    }
  }, [getAuthHeaders]);

  // Fetch Logs
  const fetchLogs = useCallback(
    async (page = 1) => {
      try {
        setLoadingLogs(true);
        const params = new URLSearchParams({
          page: String(page),
          limit: '10',
          channel: 'WHATSAPP',
        });
        if (logsStatusFilter !== 'ALL') params.append('status', logsStatusFilter);
        if (logsSearch.trim()) params.append('search', logsSearch.trim());

        const res = await fetch(`${BACKEND_URL}/apis/v1/whatsapp/logs?${params.toString()}`, {
          headers: getAuthHeaders(),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setLogs(json.data || []);
          setLogsTotal(json.total || 0);
          setLogsPage(json.page || 1);
          setLogsPages(json.pages || 1);
        }
      } catch (err) {
        console.error('Error fetching logs:', err);
      } finally {
        setLoadingLogs(false);
      }
    },
    [getAuthHeaders, logsStatusFilter, logsSearch]
  );

  // Initial mount & recurring polling (every 6 seconds for live socket QR & status updates)
  useEffect(() => {
    fetchPoolStatus();
    fetchLogs(1);
    const interval = setInterval(() => {
      fetchPoolStatus();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchPoolStatus, fetchLogs]);

  // Create Worker Session
  const handleCreateWorker = async (e) => {
    e.preventDefault();
    if (!newWorkerName.trim()) return;
    try {
      setCreatingWorker(true);
      const res = await fetch(`${BACKEND_URL}/apis/v1/whatsapp/sessions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newWorkerName.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast('success', 'Worker Created', `Session ${json.data.name} initialized. Ready to scan QR code.`);
        setShowNewWorkerModal(false);
        setNewWorkerName('');
        fetchPoolStatus();
      } else {
        showToast('error', 'Creation Failed', json.message || 'Could not create session');
      }
    } catch (err) {
      showToast('error', 'Error', err.message || 'Failed to create worker');
    } finally {
      setCreatingWorker(false);
    }
  };

  // Reconnect / Initialize worker
  const handleInitWorker = async (sessionId, forceFresh = false) => {
    try {
      setActionLoading((prev) => ({ ...prev, [sessionId]: 'reconnecting' }));
      const res = await fetch(`${BACKEND_URL}/apis/v1/whatsapp/sessions/${sessionId}/init`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ forceFresh }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast('success', 'Worker Initialized', 'Generating live QR code for connection...');
        fetchPoolStatus();
      } else {
        showToast('error', 'Initialization Failed', json.message || 'Error initializing socket');
      }
    } catch (err) {
      showToast('error', 'Error', err.message || 'Socket init error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [sessionId]: null }));
    }
  };

  // Disconnect worker permanently from device & server folder
  const handleDisconnectWorker = async (sessionId) => {
    if (
      !window.confirm(
        `Are you sure you want to disconnect session [${sessionId}]? This will permanently unlink WhatsApp from your device and remove session files from the server.`
      )
    ) {
      return;
    }
    try {
      setActionLoading((prev) => ({ ...prev, [sessionId]: 'disconnecting' }));
      const res = await fetch(`${BACKEND_URL}/apis/v1/whatsapp/sessions/${sessionId}/disconnect`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ purge: true }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast('info', 'Worker Disconnected', `Session [${sessionId}] unlinked from device and credentials purged.`);
        fetchPoolStatus();
      } else {
        showToast('error', 'Disconnect Failed', json.message);
      }
    } catch (err) {
      showToast('error', 'Error', err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [sessionId]: null }));
    }
  };

  // Delete worker
  const handleDeleteWorker = async (sessionId, sessionName) => {
    if (!window.confirm(`Are you sure you want to delete worker "${sessionName}"? Saved credentials will be purged.`)) {
      return;
    }
    try {
      setActionLoading((prev) => ({ ...prev, [sessionId]: 'deleting' }));
      const res = await fetch(`${BACKEND_URL}/apis/v1/whatsapp/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast('success', 'Worker Deleted', `Worker ${sessionName} removed from pool.`);
        if (qrModalSession?.sessionId === sessionId) setQrModalSession(null);
        fetchPoolStatus();
      } else {
        showToast('error', 'Delete Failed', json.message);
      }
    } catch (err) {
      showToast('error', 'Error', err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [sessionId]: null }));
    }
  };

  // Send Test OTP
  const handleSendTestOtp = async (e) => {
    e.preventDefault();
    if (!testPhone.trim()) return;
    try {
      setSendingTestOtp(true);
      setTestOtpResult(null);
      setVerifyResult(null);

      const res = await fetch(`${BACKEND_URL}/apis/v1/whatsapp/send-otp`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          phone: testPhone.trim(),
          sessionId: testSelectedSession || null,
        }),
      });
      const json = await res.json();
      setTestOtpResult(json);
      if (json.success) {
        const workerLabel =
          typeof json.data?.workerUsed === 'object'
            ? json.data.workerUsed?.name || json.data.workerUsed?.sessionId || 'active'
            : json.data?.workerUsed || 'active';
        showToast('success', 'OTP Dispatched', `WhatsApp OTP sent via worker [${workerLabel}].`);
        fetchLogs(1);
        fetchPoolStatus();
      } else {
        showToast('error', 'OTP Delivery Failed', json.message);
      }
    } catch (err) {
      setTestOtpResult({ success: false, message: err.message || 'Failed to dispatch OTP.' });
    } finally {
      setSendingTestOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!verifyOtpInput.trim() || !testPhone.trim()) return;
    try {
      setVerifyingOtp(true);
      setVerifyResult(null);

      const res = await fetch(`${BACKEND_URL}/apis/v1/whatsapp/verify-otp`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          phone: testPhone.trim(),
          otp: verifyOtpInput.trim(),
        }),
      });
      const json = await res.json();
      setVerifyResult(json);
      if (json.success) {
        showToast('success', 'OTP Verified', 'OTP verified successfully!');
        fetchLogs(1);
      } else {
        showToast('error', 'Verification Failed', json.message);
      }
    } catch (err) {
      setVerifyResult({ success: false, message: err.message || 'Verification request failed.' });
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Metrics calculations
  const totalSent = useMemo(() => {
    if (!poolStatus?.sessions) return 0;
    return poolStatus.sessions.reduce((acc, s) => acc + (s.messagesSent || 0), 0);
  }, [poolStatus]);

  const poolHealth = useMemo(() => {
    if (!poolStatus || poolStatus.totalWorkers === 0) return 0;
    return Math.round((poolStatus.connectedWorkers / poolStatus.totalWorkers) * 100);
  }, [poolStatus]);

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 z-50 fixed top-4 right-4 max-w-md ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : toast.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-blue-50 border-blue-300 text-blue-950'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Activity className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs sm:text-sm font-bold">{toast.title}</p>
              <p className="text-xs opacity-90">{toast.message}</p>
            </div>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-700 p-1">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <WhatsAppIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  WhatsApp Integration
                </h1>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                  Baileys Pool Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage pooled Baileys multi-device socket workers for load balancing, high-availability OTP delivery, and auto-failover.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchPoolStatus}
            disabled={loadingPool}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60"
          >
            <RefreshCw size={14} className={loadingPool ? 'animate-spin text-emerald-600' : ''} />
            <span>Refresh Pool</span>
          </button>

          <Link
            href="/edu-admin/settings"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Settings size={14} />
            <span>Portal Settings</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowNewWorkerModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Worker Session</span>
          </button>
        </div>
      </div>

      {/* Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pool Health */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Overall Pool Health
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{poolHealth}%</span>
              <span className="text-xs text-slate-500 font-medium">Availability</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden max-w-[120px]">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${poolHealth}%` }}
              />
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Activity size={22} />
          </div>
        </div>

        {/* Connected Workers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Connected Workers
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600">
                {poolStatus?.connectedWorkers ?? 0}
              </span>
              <span className="text-xs text-slate-400 font-bold">
                / {poolStatus?.totalWorkers ?? 0} instances
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {poolStatus?.qrPendingWorkers ? (
                <span className="text-amber-600 font-bold">
                  {poolStatus.qrPendingWorkers} awaiting QR scan
                </span>
              ) : (
                'All sockets ready for dispatch'
              )}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers size={22} />
          </div>
        </div>

        {/* Total Dispatches */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Dispatches
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalSent}</span>
              <span className="text-xs text-slate-500 font-medium">Messages &amp; OTPs</span>
            </div>
            <p className="text-[11px] text-slate-500">Pooled load distribution</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Send size={22} />
          </div>
        </div>

        {/* Active Worker Phone */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Primary Sender Line
            </span>
            <p className="text-sm font-black text-slate-800 truncate max-w-[140px]">
              {(() => {
                const phone = poolStatus?.sessions?.find((s) => s.status === 'CONNECTED')?.phone;
                if (!phone) return 'No active session';
                const clean = String(phone).trim().replace(/^\++/, '');
                return clean ? `+${clean}` : 'No active session';
              })()}
            </p>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  poolStatus?.overallStatus === 'CONNECTED'
                    ? 'bg-emerald-500 animate-pulse'
                    : poolStatus?.overallStatus === 'SCAN_QR'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-[11px] font-bold text-slate-600">
                {poolStatus?.overallStatus || 'DISCONNECTED'}
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Smartphone size={22} />
          </div>
        </div>
      </div>

      {/* Main Grid: Workers Cards (Left 65%) + Simulator (Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Worker Pool Sessions Section */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Pooled Worker Instances</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                {poolStatus?.sessions?.length || 0}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Requests automatically rotate to the least-busy active worker
            </span>
          </div>

          {loadingPool && !poolStatus ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">Connecting to WhatsApp Pooling Engine...</p>
            </div>
          ) : !poolStatus?.sessions || poolStatus.sessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto font-bold">
                <WhatsAppIcon size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">No WhatsApp Workers Registered Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Create your first worker instance to generate a QR code. Scan it with WhatsApp to enable automated OTPs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewWorkerModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
              >
                <Plus size={15} />
                <span>Initialize First Worker</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {poolStatus.sessions.map((worker) => {
                const isConnected = worker.status === 'CONNECTED';
                const isScanQR = worker.status === 'SCAN_QR';
                const isConnecting = worker.status === 'CONNECTING';
                const currentAction = actionLoading[worker.sessionId];

                return (
                  <div
                    key={worker.sessionId}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between"
                  >
                    {/* Worker Header */}
                    <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{worker.name}</h3>
                          {worker.isDefault && (
                            <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[10px] font-extrabold rounded-md border border-blue-200">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 truncate max-w-[180px]">
                          {worker.sessionId}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          isConnected
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isScanQR
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : isConnecting
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isConnected
                              ? 'bg-emerald-500 animate-pulse'
                              : isScanQR
                              ? 'bg-amber-500'
                              : isConnecting
                              ? 'bg-blue-500 animate-ping'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span>{worker.status}</span>
                      </span>
                    </div>

                    {/* Worker Body */}
                    <div className="p-4 space-y-3 flex-1">
                      {/* If Connected */}
                      {isConnected ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                            <span className="text-slate-600 font-medium">Linked Phone:</span>
                            <span className="font-bold text-emerald-900">
                              {worker.phone
                                ? `+${String(worker.phone).trim().replace(/^\++/, '')}`
                                : 'Ready'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                            <span>Dispatched Messages:</span>
                            <span className="font-bold text-slate-800">{worker.messagesSent || 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                            <span>Connected Since:</span>
                            <span className="font-medium">
                              {worker.lastConnectedAt
                                ? new Date(worker.lastConnectedAt).toLocaleTimeString()
                                : 'Active'}
                            </span>
                          </div>
                        </div>
                      ) : isScanQR && worker.qrCode ? (
                        <div className="text-center space-y-2">
                          <div
                            onClick={() => setQrModalSession(worker)}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-200 inline-block cursor-pointer hover:border-emerald-500 transition group relative"
                            title="Click to enlarge QR code"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={worker.qrCode}
                              alt="Scan WhatsApp QR"
                              className="w-36 h-36 mx-auto object-contain rounded-lg"
                            />
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center text-white text-xs font-bold gap-1 backdrop-blur-xs">
                              <QrCode size={16} />
                              <span>Enlarge</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Scan with <strong>WhatsApp &gt; Linked Devices</strong>
                          </p>
                        </div>
                      ) : (
                        <div className="py-6 text-center space-y-2">
                          <PowerOff size={24} className="text-slate-300 mx-auto" />
                          <p className="text-xs text-slate-500 font-medium">
                            Socket disconnected. Reconnect to generate a new QR code.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Worker Footer Actions */}
                    <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {!isConnected && (
                          <button
                            type="button"
                            onClick={() => handleInitWorker(worker.sessionId)}
                            disabled={Boolean(currentAction)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                          >
                            {currentAction === 'reconnecting' ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <RefreshCw size={12} />
                            )}
                            <span>{isScanQR ? 'Refresh QR' : 'Connect'}</span>
                          </button>
                        )}

                        {isConnected && (
                          <button
                            type="button"
                            onClick={() => handleDisconnectWorker(worker.sessionId)}
                            disabled={Boolean(currentAction)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                          >
                            {currentAction === 'disconnecting' ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <PowerOff size={12} />
                            )}
                            <span>Disconnect</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteWorker(worker.sessionId, worker.name)}
                        disabled={Boolean(currentAction)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Session"
                      >
                        {currentAction === 'deleting' ? (
                          <Loader2 size={14} className="animate-spin text-rose-600" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Simulator & Diagnostic Testing Suite */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    OTP Delivery Simulator
                  </h3>
                  <p className="text-[11px] text-slate-500">Test live pool dispatch and verification</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Step 1: Send OTP Form */}
              <form onSubmit={handleSendTestOtp} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Recipient Phone Number
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-2 rounded-lg border border-slate-200">
                      +
                    </span>
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="919876543210 (with country code)"
                      className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 placeholder:text-slate-400 font-medium"
                      required
                    />
                  </div>
                  <span className="text-[10.5px] text-slate-400 mt-1 block">
                    e.g. 919876543210 for India, 12025550123 for US
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Worker Routing
                  </label>
                  <select
                    value={testSelectedSession}
                    onChange={(e) => setTestSelectedSession(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="">Auto: Round-Robin Pool (Recommended)</option>
                    {poolStatus?.sessions?.map((s) => (
                      <option key={s.sessionId} value={s.sessionId}>
                        {s.name} ({s.status})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={sendingTestOtp || !testPhone}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {sendingTestOtp ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  <span>{sendingTestOtp ? 'Dispatching via Socket...' : 'Dispatch Test WhatsApp OTP'}</span>
                </button>
              </form>

              {/* Step 1 Feedback Banner */}
              {testOtpResult && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1.5 animate-in fade-in duration-150 ${
                    testOtpResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {testOtpResult.success ? (
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    ) : (
                      <AlertCircle size={14} className="text-rose-600" />
                    )}
                    <span>{testOtpResult.message}</span>
                  </div>

                  {testOtpResult.data && (
                    <div className="p-2 rounded-lg bg-white/80 border border-emerald-200/50 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Worker Session:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {typeof testOtpResult.data.workerUsed === 'object'
                            ? testOtpResult.data.workerUsed?.name || testOtpResult.data.workerUsed?.sessionId || 'Active Worker'
                            : testOtpResult.data.workerUsed || 'Active Worker'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Generated OTP:</span>
                        <span className="font-mono font-black text-emerald-700 text-xs tracking-wider">
                          {testOtpResult.data.otp}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Verify OTP Form */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <label className="block text-[11px] font-bold text-slate-700">
                  Verify Received OTP Code
                </label>
                <form onSubmit={handleVerifyOtp} className="space-y-2.5">
                  <input
                    type="text"
                    maxLength={6}
                    value={verifyOtpInput}
                    onChange={(e) => setVerifyOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP code"
                    className="w-full text-center text-base tracking-[0.3em] font-mono font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 placeholder:text-slate-400"
                  />

                  <button
                    type="submit"
                    disabled={verifyingOtp || verifyOtpInput.length !== 6 || !testPhone}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {verifyingOtp ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={13} />
                    )}
                    <span>{verifyingOtp ? 'Verifying...' : 'Verify OTP Code'}</span>
                  </button>
                </form>

                {/* Verification Result Feedback */}
                {verifyResult && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                      verifyResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    {verifyResult.success ? (
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle size={15} className="text-rose-600 shrink-0" />
                    )}
                    <span>{verifyResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Logs Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock size={16} className="text-emerald-600" />
              <span>WhatsApp OTP &amp; Message Dispatch Logs</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live audit trail of OTP codes dispatched through the worker pool.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={logsStatusFilter}
              onChange={(e) => {
                setLogsStatusFilter(e.target.value);
                setLogsPage(1);
              }}
              className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="DELIVERED">Delivered</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
              <option value="EXPIRED">Expired</option>
              <option value="FAILED">Failed</option>
            </select>

            <button
              type="button"
              onClick={() => fetchLogs(logsPage)}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw size={13} className={loadingLogs ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">OTP Code</th>
                <th className="py-3 px-4">Worker Instance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Dispatched At</th>
                <th className="py-3 px-4">Verified At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingLogs && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <Loader2 size={18} className="animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading dispatch logs...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No WhatsApp logs found for this filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  return (
                    <tr key={log._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        +{String(log.recipient || '').replace(/^\++/, '')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                          {log.otp}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {log.sessionId || log.metadata?.sessionId || log.metadata?.workerName || 'pool_auto'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                            log.status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : log.status === 'DELIVERED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : log.status === 'EXPIRED'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : log.status === 'FAILED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              log.status === 'VERIFIED'
                                ? 'bg-emerald-500'
                                : log.status === 'DELIVERED'
                                ? 'bg-blue-500'
                                : log.status === 'EXPIRED'
                                ? 'bg-amber-500'
                                : log.status === 'FAILED'
                                ? 'bg-rose-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          <span>{log.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {log.verifiedAt ? (
                          <span className="text-emerald-700 font-bold">
                            {new Date(log.verifiedAt).toLocaleTimeString()}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Logs Pagination Footer */}
        {logsPages > 1 && (
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {logsPage} of {logsPages} ({logsTotal} logs)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={logsPage <= 1}
                onClick={() => fetchLogs(logsPage - 1)}
                className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={logsPage >= logsPages}
                onClick={() => fetchLogs(logsPage + 1)}
                className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL: CREATE WORKER SESSION */}
      {/* ============================================================ */}
      {showNewWorkerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="absolute inset-0"
            onClick={() => setShowNewWorkerModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add New WhatsApp Worker</h3>
                  <p className="text-[11px] text-slate-500">Expands Baileys connection pool capacity</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewWorkerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Worker Name / Label
                </label>
                <input
                  type="text"
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="e.g. Worker 2 - Admissions OTP"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <span className="text-[10.5px] text-slate-400 mt-1 block">
                  A new multi-device authentication folder will be created. A QR code will be generated immediately for linking.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewWorkerModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingWorker || !newWorkerName.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {creatingWorker ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  <span>{creatingWorker ? 'Spawning Worker...' : 'Create Worker Instance'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ENLARGE QR CODE */}
      {/* ============================================================ */}
      {qrModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="absolute inset-0" onClick={() => setQrModalSession(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150 p-6 text-center space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-sm font-bold text-slate-900">{qrModalSession.name}</h3>
                <span className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Awaiting Device Scan
                </span>
              </div>
              <button
                type="button"
                onClick={() => setQrModalSession(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 bg-white rounded-2xl border-2 border-emerald-500 shadow-md inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrModalSession.qrCode}
                alt="Enlarged QR Code"
                className="w-56 h-56 mx-auto object-contain rounded-lg"
              />
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <p className="font-bold text-slate-800">How to Connect:</p>
              <ol className="text-[11px] text-slate-500 list-decimal list-inside space-y-0.5 text-left">
                <li>Open WhatsApp on your phone</li>
                <li>Tap <strong>Settings</strong> or <strong>Menu &gt; Linked Devices</strong></li>
                <li>Tap <strong>Link a Device</strong> and point your camera at this screen</li>
              </ol>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  handleInitWorker(qrModalSession.sessionId, true);
                  setQrModalSession(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Regenerate QR
              </button>
              <button
                type="button"
                onClick={() => setQrModalSession(null)}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
