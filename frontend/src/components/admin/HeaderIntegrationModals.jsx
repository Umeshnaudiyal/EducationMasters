'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Send,
  ExternalLink,
  Shield,
  Smartphone,
  Mail,
  Loader2,
  Clock,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { BACKEND_URL } from '@/utils/api';

const WhatsAppIcon = ({ size = 20, className = '' }) => (
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

/**
 * WhatsApp Integration Modal
 */
export function WhatsAppHeaderDrawer({ isOpen, onClose, onRefreshStatus }) {
  const [loading, setLoading] = useState(false);
  const [poolData, setPoolData] = useState(null);
  const [testPhone, setTestPhone] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [reloadingQR, setReloadingQR] = useState(false);

  const fetchPool = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/apis/v1/whatsapp/pool-status`);
      const json = await res.json();
      if (json.success && json.data) {
        setPoolData(json.data);
      }
    } catch (err) {
      console.error('Failed to load WhatsApp pool status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPool();
      const interval = setInterval(fetchPool, 4000);
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearInterval(interval);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, fetchPool, onClose]);

  const handleSendTestOTP = async (e) => {
    e.preventDefault();
    if (!testPhone.trim()) return;
    try {
      setTestSending(true);
      setTestResult(null);
      const res = await fetch(`${BACKEND_URL}/apis/v1/whatsapp/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setTestResult({
          type: 'success',
          message: json.message || `Test OTP dispatched to ${testPhone}!`,
          otp: json.data?.otp,
        });
        if (onRefreshStatus) onRefreshStatus();
      } else {
        setTestResult({ type: 'error', message: json.message || 'Failed to dispatch WhatsApp OTP' });
      }
    } catch (err) {
      setTestResult({ type: 'error', message: err.message || 'Network error sending OTP' });
    } finally {
      setTestSending(false);
    }
  };

  const handleReloadQR = async (sessionId = 'primary') => {
    try {
      setReloadingQR(true);
      const res = await fetch(`${BACKEND_URL}/apis/v1/whatsapp/sessions/${sessionId}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceFresh: true }),
      });
      const json = await res.json();
      await fetchPool();
      if (onRefreshStatus) onRefreshStatus();
    } catch (err) {
      console.error('Failed to reload QR:', err);
    } finally {
      setReloadingQR(false);
    }
  };

  const handleDisconnect = async () => {
    const targetSessionId = activeWorker?.sessionId || 'primary';
    if (
      !window.confirm(
        'Are you sure you want to disconnect? This will permanently unlink WhatsApp from your device and remove session files from the server.'
      )
    ) {
      return;
    }
    try {
      setDisconnecting(true);
      await fetch(`${BACKEND_URL}/apis/v1/whatsapp/sessions/${targetSessionId}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purge: true }),
      });
      await fetchPool();
      if (onRefreshStatus) onRefreshStatus();
      // Immediately request a fresh QR code so the user can scan to reconnect if needed
      await handleReloadQR(targetSessionId);
    } catch (err) {
      console.error('Failed to disconnect WhatsApp:', err);
    } finally {
      setDisconnecting(false);
    }
  };

  if (!isOpen) return null;

  const activeWorker = poolData?.sessions?.find((s) => s.status === 'CONNECTED');
  const qrWorker = poolData?.sessions?.find((s) => s.status === 'SCAN_QR' && s.qrCode);
  const isConnected = poolData?.overallStatus === 'CONNECTED';
  const isScanQr = poolData?.overallStatus === 'SCAN_QR';

  const formatPhone = (p) => {
    if (!p) return '';
    const clean = String(p).trim().replace(/^\++/, '');
    return clean ? `+${clean}` : '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative w-full max-w-[620px] bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-7.5 border border-slate-100 z-10 animate-in zoom-in-95 duration-150 space-y-4 max-h-[92vh] min-h-[460px] flex flex-col justify-between overflow-y-auto no-scrollbar hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="space-y-4">
          {/* Header matching user design */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                <WhatsAppIcon size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-[17px] font-bold text-slate-900 tracking-tight">
                    WhatsApp Integration
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold tracking-wide border ${
                      isConnected
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isScanQr
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConnected
                          ? 'bg-emerald-500 animate-pulse'
                          : isScanQr
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span>{isConnected ? 'Connected' : isScanQr ? 'Scan QR Required' : 'Disconnected'}</span>
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-500 mt-0.5">
                  Baileys socket connection pooling for high-availability OTP delivery across the portal.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer shrink-0"
            >
              <X size={15} />
            </button>
          </div>

          {/* Status Card Banner */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isConnected
                    ? 'bg-emerald-500 animate-pulse'
                    : isScanQr
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  {isConnected
                    ? 'Connected & Ready'
                    : isScanQr
                    ? 'Waiting for WhatsApp QR Scan'
                    : 'Worker Offline'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isConnected && activeWorker?.phone
                    ? `Active sender: ${formatPhone(activeWorker.phone)} (${activeWorker.name || 'Primary OTP Dispatcher'})`
                    : isScanQr
                    ? 'Point your phone camera to link your WhatsApp account.'
                    : 'No active connection found. Generate QR below.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {isConnected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs"
                  title="Unlink device & permanently remove session folder"
                >
                  {disconnecting ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <LogOut size={12} />
                  )}
                  <span>{disconnecting ? 'Disconnecting...' : 'Disconnect'}</span>
                </button>
              )}

              <label className="flex items-center gap-2 text-[11.5px] font-medium text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Enable WhatsApp</span>
              </label>
            </div>
          </div>

          {/* Security / Info Banner */}
          <div className="py-2.5 px-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-2.5 text-[11px] text-slate-600 leading-normal">
            <Shield size={14} className="text-emerald-600 shrink-0" />
            <span>
              WhatsApp messages are sent through end-to-end encrypted multi-device sockets with automated session isolation.
            </span>
          </div>

          {/* Live QR Section when not connected */}
          {!isConnected && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white text-center space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-300 pb-1.5 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <QrCode size={14} />
                  <span>Scan QR Code with WhatsApp</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleReloadQR(qrWorker?.sessionId || 'primary')}
                  disabled={reloadingQR}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] font-medium transition cursor-pointer disabled:opacity-50 active:scale-95"
                  title="Reload & generate a fresh QR code"
                >
                  <RefreshCw size={11} className={reloadingQR ? 'animate-spin text-emerald-400' : ''} />
                  <span>{reloadingQR ? 'Reloading...' : 'Reload QR'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-300">
                Open WhatsApp on your phone &gt; Settings &gt; <strong>Linked Devices</strong> &gt; <strong>Link a Device</strong>
              </p>

              {qrWorker?.qrCode ? (
                <div className="relative inline-block">
                  <div className="p-2.5 bg-white rounded-xl inline-block shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrWorker.qrCode}
                      alt="WhatsApp QR Code"
                      className="w-40 h-40 object-contain mx-auto rounded-lg"
                    />
                  </div>
                  {reloadingQR && (
                    <div className="absolute inset-0 bg-slate-950/70 rounded-xl flex items-center justify-center backdrop-blur-xs">
                      <div className="flex items-center gap-2 text-white text-xs font-semibold">
                        <Loader2 size={16} className="animate-spin text-emerald-400" />
                        <span>Generating fresh QR...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 px-4 bg-slate-800/80 rounded-xl border border-slate-700/60 flex flex-col items-center justify-center space-y-2">
                  <QrCode size={36} className="text-slate-400" />
                  <p className="text-[11.5px] text-slate-300 max-w-xs">
                    No active QR code. Click below to initialize socket and generate a live QR.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleReloadQR('primary')}
                    disabled={reloadingQR}
                    className="mt-1 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md active:scale-95"
                  >
                    <RefreshCw size={12} className={reloadingQR ? 'animate-spin' : ''} />
                    <span>{reloadingQR ? 'Generating QR...' : 'Generate Live QR Code'}</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-emerald-400 font-medium">
                <Clock size={11} className="animate-spin" />
                <span>Live multi-device socket ready • Automatically updates upon scan</span>
              </div>
            </div>
          )}

          {/* Test OTP Simulator */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <Send size={12} className="text-emerald-600" />
                <span>Send Quick Diagnostic WhatsApp OTP</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">10 Min Expiry</span>
            </div>

            <form onSubmit={handleSendTestOTP} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 919876543210 (with country code)"
                className="flex-1 text-[11.5px] py-2 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 placeholder:text-slate-400 font-medium"
                required
              />
              <button
                type="submit"
                disabled={testSending || !testPhone.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11.5px] font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {testSending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                <span>{testSending ? 'Sending...' : 'Send Test OTP'}</span>
              </button>
            </form>

            {testResult && (
              <div
                className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between ${
                  testResult.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {testResult.type === 'success' ? (
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={13} className="text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
                {testResult.otp && (
                  <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    {testResult.otp}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-1">
          <Link
            href="/edu-admin/whatsapp"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition"
          >
            <span>Open Dedicated WhatsApp Manager &amp; Pool</span>
            <ExternalLink size={12} />
          </Link>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11.5px] font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs"
              >
                {disconnecting ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                <span>{disconnecting ? 'Disconnecting...' : 'Disconnect'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleReloadQR(qrWorker?.sessionId || 'primary')}
                disabled={reloadingQR}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs active:scale-95"
              >
                <RefreshCw size={12} className={reloadingQR ? 'animate-spin' : ''} />
                <span>{reloadingQR ? 'Reloading...' : 'Reload QR'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-slate-200 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Global SMTP Settings Modal - Exact Match to Screenshot 2
 */
export function SmtpHeaderDrawer({ isOpen, onClose, onRefreshStatus }) {
  const [provider, setProvider] = useState('Gmail');
  const [senderEmail, setSenderEmail] = useState('info@educationmasters.in');
  const [fromName, setFromName] = useState('Education Masters');
  const [appPassword, setAppPassword] = useState('');
  const [replyToEmail, setReplyToEmail] = useState('info@educationmasters.in');
  const [enableSmtp, setEnableSmtp] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loadingConfig, setLoadingConfig] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [hasStoredPassword, setHasStoredPassword] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState('UNCONFIGURED');

  // Load existing SMTP settings on open
  const fetchSmtpConfig = useCallback(async () => {
    try {
      setLoadingConfig(true);
      const res = await fetch(`${BACKEND_URL}/apis/v1/settings`);
      const json = await res.json();
      if (json.success && json.data?.smtp) {
        const s = json.data.smtp;
        setSenderEmail(s.user || s.fromEmail || '');
        setFromName(s.fromName || 'Education Masters');
        setReplyToEmail(s.fromEmail || s.user || '');
        setEnableSmtp(s.isConfigured !== false);
        setHasStoredPassword(Boolean(s.hasPassword));
        setSmtpStatus(s.status || 'UNCONFIGURED');
      }
    } catch (err) {
      console.error('Failed to load SMTP settings:', err);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSmtpConfig();
    }
  }, [isOpen, fetchSmtpConfig]);

  // Provider Default Details
  const providerDefaults = {
    Gmail: {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      text: 'smtp.gmail.com / port 465 / secure TLS',
    },
    'Outlook / Office 365': {
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      text: 'smtp.office365.com / port 587 / STARTTLS',
    },
    'Custom SMTP': {
      host: 'mail.educationmasters.in',
      port: 587,
      secure: false,
      text: 'Custom Host / Port 587 or 465',
    },
    SendGrid: {
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      text: 'smtp.sendgrid.net / port 587 / API Key',
    },
    'Amazon SES': {
      host: 'email-smtp.us-east-1.amazonaws.com',
      port: 465,
      secure: true,
      text: 'email-smtp / port 465 / secure TLS',
    },
  };

  // STRICT: Connected ONLY when both email/user and password are confirmed stored AND status is CONNECTED
  const isConnected = Boolean(
    smtpStatus === 'CONNECTED' &&
    senderEmail.trim() !== '' &&
    (appPassword.trim() !== '' || hasStoredPassword)
  );

  const handleTestConnection = async () => {
    if (!senderEmail.trim() || (!appPassword.trim() && !hasStoredPassword)) {
      setDiagnosticResult({
        type: 'error',
        message: 'Both Sender Email and App Password must be provided and stored to test Nodemailer connection.',
      });
      return;
    }

    try {
      setTestingConnection(true);
      setDiagnosticResult(null);
      const activeDef = providerDefaults[provider] || providerDefaults.Gmail;
      const res = await fetch(`${BACKEND_URL}/apis/v1/smtp/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp: {
            host: activeDef.host,
            port: activeDef.port,
            user: senderEmail.trim(),
            pass: appPassword.trim() || undefined,
            secure: activeDef.secure,
            fromName,
            fromEmail: replyToEmail.trim() || senderEmail.trim(),
          },
        }),
      });
      const json = await res.json();
      if (json.success && json.status === 'CONNECTED') {
        setSmtpStatus('CONNECTED');
        setDiagnosticResult({
          type: 'success',
          message: json.message || 'Nodemailer SMTP handshake verified successfully!',
        });
        if (onRefreshStatus) onRefreshStatus();
      } else {
        setSmtpStatus(json.status || 'ERROR');
        setDiagnosticResult({
          type: 'error',
          message: json.message || 'SMTP Connection authentication failed',
        });
      }
    } catch (err) {
      setDiagnosticResult({ type: 'error', message: err.message || 'Connection test error' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveSmtp = async (e) => {
    if (e) e.preventDefault();
    try {
      setSavingSmtp(true);
      setDiagnosticResult(null);
      const activeDef = providerDefaults[provider] || providerDefaults.Gmail;

      const res = await fetch(`${BACKEND_URL}/apis/v1/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp: {
            host: activeDef.host,
            port: activeDef.port,
            user: senderEmail.trim(),
            pass: appPassword.trim() || undefined,
            secure: activeDef.secure,
            fromName,
            fromEmail: replyToEmail.trim() || senderEmail.trim(),
            isConfigured: enableSmtp,
          },
        }),
      });

      const json = await res.json();
      if (json.success) {
        const savedSmtp = json.data?.smtp;
        const hasCreds = Boolean(savedSmtp?.user && (savedSmtp?.hasPassword || savedSmtp?.pass));
        const connectedNow = Boolean(hasCreds && savedSmtp?.status === 'CONNECTED');
        setSmtpStatus(savedSmtp?.status || 'UNCONFIGURED');
        if (appPassword.trim()) {
          setHasStoredPassword(true);
          setAppPassword('');
        }

        setDiagnosticResult({
          type: connectedNow ? 'success' : (savedSmtp?.status === 'ERROR' ? 'error' : 'warning'),
          message: connectedNow
            ? 'SMTP credentials stored and Nodemailer connection verified!'
            : savedSmtp?.status === 'ERROR'
            ? `Saved, but authentication failed: ${savedSmtp?.lastError || 'Invalid credentials'}`
            : 'SMTP settings saved. To connect, please store valid email and password.',
        });
        if (onRefreshStatus) onRefreshStatus();
        if (connectedNow) {
          setTimeout(() => onClose(), 1400);
        }
      } else {
        setDiagnosticResult({
          type: 'error',
          message: json.message || 'Failed to save SMTP settings',
        });
      }
    } catch (err) {
      setDiagnosticResult({ type: 'error', message: err.message || 'Save error' });
    } finally {
      setSavingSmtp(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative w-full max-w-[620px] bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-7.5 border border-slate-100 z-10 animate-in zoom-in-95 duration-150 space-y-4 max-h-[92vh] min-h-[460px] flex flex-col justify-between overflow-y-auto no-scrollbar hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="space-y-4">
          {/* Header - Matches Screenshot 2 */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <Mail size={20} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-[17px] font-bold text-slate-900 tracking-tight">
                    SMTP Settings
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold tracking-wide border ${
                      isConnected
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    <span>{isConnected ? 'Connected' : 'Offline / Untested'}</span>
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-500 mt-0.5">
                  Configure the sender email for your own panel. These settings apply only to your account.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer shrink-0"
            >
              <X size={15} />
            </button>
          </div>

          {/* Top Status Banner - Matches Screenshot 2 */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isConnected
                    ? 'Your outgoing mail will use this verified sender account.'
                    : hasStoredPassword
                    ? 'Credentials stored. Click "Test Connection" to verify.'
                    : 'Configure both email and password below to enable outgoing mail.'}
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 text-[11.5px] font-medium text-slate-800 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={enableSmtp}
                onChange={(e) => setEnableSmtp(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>Enable SMTP</span>
            </label>
          </div>

          {/* Review Helper Box - Matches Screenshot 2 */}
          <div className="py-2.5 px-3.5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center gap-2.5 text-[11px] text-slate-600 leading-normal">
            <Shield size={14} className="text-blue-500 shrink-0" />
            <span>Review or update the SMTP details used for transactional mail and alerts.</span>
          </div>

          {/* Diagnostic Alert Result */}
          {diagnosticResult && (
            <div
              className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between ${
                diagnosticResult.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : diagnosticResult.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {diagnosticResult.type === 'success' ? (
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                ) : diagnosticResult.type === 'warning' ? (
                  <AlertCircle size={13} className="text-amber-600 shrink-0" />
                ) : (
                  <AlertCircle size={13} className="text-rose-600 shrink-0" />
                )}
                <span>{diagnosticResult.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setDiagnosticResult(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Form Inputs (2-Column Layout - Exact match to Screenshot 2) */}
          <form id="smtp-modal-form" onSubmit={handleSaveSmtp} className="space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Column 1 */}
              <div className="space-y-3">
                {/* SMTP Provider */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    SMTP provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full text-[11.5px] py-2 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                  >
                    <option value="Gmail">Gmail</option>
                    <option value="Outlook / Office 365">Outlook / Office 365</option>
                    <option value="Custom SMTP">Custom SMTP</option>
                    <option value="SendGrid">SendGrid</option>
                    <option value="Amazon SES">Amazon SES</option>
                  </select>
                </div>

                {/* App Password */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1 flex items-center justify-between">
                    <span>App password</span>
                    {hasStoredPassword && (
                      <span className="text-[10px] text-emerald-600 font-normal">● Password Stored</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={appPassword}
                      onChange={(e) => setAppPassword(e.target.value)}
                      placeholder={hasStoredPassword ? '••••••••••••• (Stored)' : 'Enter app password'}
                      className="w-full text-[11.5px] py-2 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 pr-9 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>

                {/* Reply-to Email */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Reply-to email
                  </label>
                  <input
                    type="email"
                    value={replyToEmail}
                    onChange={(e) => setReplyToEmail(e.target.value)}
                    placeholder="info@educationmasters.in"
                    className="w-full text-[11.5px] py-2 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-3">
                {/* Sender Email */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Sender email
                  </label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full text-[11.5px] py-2 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                  />
                </div>

                {/* From Name */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    From name
                  </label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="Education Masters"
                    className="w-full text-[11.5px] py-2 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                  />
                </div>

                {/* Provider Defaults Box - Dashed Blue */}
                <div className="p-3 rounded-2xl border border-dashed border-blue-200 bg-blue-50/30 space-y-0.5">
                  <span className="block text-[11px] font-bold text-blue-600">
                    {provider} defaults
                  </span>
                  <span className="block text-[10.5px] text-slate-500 font-mono">
                    {providerDefaults[provider]?.text || 'smtp.gmail.com / port 465 / secure TLS'}
                  </span>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Actions Footer - Matches Screenshot 2 */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11.5px] font-semibold transition cursor-pointer disabled:opacity-50"
          >
            {testingConnection ? (
              <Loader2 size={12} className="animate-spin text-blue-600" />
            ) : (
              <RefreshCw size={12} />
            )}
            <span>{testingConnection ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-slate-200 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="smtp-modal-form"
              disabled={savingSmtp}
              className="px-5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[11.5px] font-semibold shadow-md shadow-blue-600/25 transition cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
            >
              {savingSmtp ? <Loader2 size={12} className="animate-spin" /> : null}
              <span>{savingSmtp ? 'Saving...' : 'Save SMTP'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
