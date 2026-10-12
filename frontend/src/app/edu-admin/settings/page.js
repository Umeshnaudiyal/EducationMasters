'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Settings,
  Globe,
  Mail,
  Shield,
  Building2,
  Database,
  Save,
  Check,
  Server,
  Layers,
  Download,
  DownloadCloud,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Filter,
  Search,
  RefreshCw,
  FileJson,
  ShieldCheck,
  Calendar,
  Sparkles,
  CheckSquare,
  Square,
  Eye,
  X,
  ExternalLink,
  Lock,
  FileSpreadsheet,
  Users,
  Briefcase,
  FileText,
  Award,
  BookOpen,
  HelpCircle,
  Package,
  CreditCard,
  BarChart2,
  DollarSign,
  GraduationCap,
  Home,
  StickyNote,
  Folder,
  Landmark,
  Book,
  List,
  MapPin,
  Navigation,
  Tag,
  Image,
  Megaphone,
  Activity,
  ArrowDownToLine,
  FileCheck,
  CheckCheck,
  Archive,
  FileArchive,
  ChevronDown,
} from 'lucide-react';
import { BACKEND_URL } from '@/utils/api';

const ICON_MAP = {
  Users,
  Briefcase,
  FileText,
  Award,
  BookOpen,
  HelpCircle,
  Package,
  CheckSquare,
  CreditCard,
  BarChart2,
  DollarSign,
  Building2,
  GraduationCap,
  Home,
  StickyNote,
  Folder,
  Landmark,
  FileSpreadsheet,
  Book,
  List,
  Layers,
  MapPin,
  Navigation,
  Globe,
  Tag,
  Mail,
  Image,
  Megaphone,
  Activity,
  Server,
  Database,
  Archive,
};

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('general');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings Form State
  const [formData, setFormData] = useState({
    siteName: 'Education Masters',
    tagline: 'Leading Educational Hub & Admission Portal in India',
    adminEmail: 'info@educationmasters.in',
    contactPhone: '+91 98765 43210',
    metaTitle: 'Education Masters - Colleges, Courses, Exams & Jobs Portal',
    metaDescription:
      'Search best colleges, top universities, government job alerts, admit cards, results, and practice free online mock tests in India.',
    metaKeywords:
      'colleges, universities, govt jobs, admit cards, results, mock tests, education masters',
    allowIndexing: true,
    defaultTrialDays: 14,
    defaultMaxStaff: 5,
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
  });

  // Backup Engine State
  const [manifest, setManifest] = useState(null);
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [manifestError, setManifestError] = useState(null);
  const [selectedModels, setSelectedModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [downloadingKey, setDownloadingKey] = useState(null); // 'zip_all' | 'zip_selected' | 'json_all' | 'json_selected' | modelKey
  const [statusNotification, setStatusNotification] = useState(null);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);

  // Preview Modal State
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    modelKey: null,
    modelName: '',
    loading: false,
    data: null,
    meta: null,
    error: null,
  });

  // JSON / ZIP Validator State
  const [validatorResult, setValidatorResult] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const getAuthHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (session?.user?.accessToken) {
      headers['Authorization'] = `Bearer ${session.user.accessToken}`;
    }
    if (session?.user?.id) {
      headers['x-user-id'] = session.user.id;
    }
    if (session?.user?.email) {
      headers['x-user-email'] = session.user.email;
    }
    return headers;
  }, [session]);

  // Fetch Backup Manifest (Models, descriptions, and real-time counts)
  const fetchManifest = useCallback(async () => {
    try {
      setLoadingManifest(true);
      setManifestError(null);
      const res = await fetch(`${BACKEND_URL}/apis/v1/backup/manifest`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setManifest(json.data);
        // Default select all models
        setSelectedModels(json.data.models.map((m) => m.key));
      } else {
        setManifestError(json.message || 'Failed to load backup manifest.');
      }
    } catch (err) {
      setManifestError(err.message || 'Could not connect to backup service.');
    } finally {
      setLoadingManifest(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchManifest();
  }, [fetchManifest]);

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Trigger browser file download helper
  const triggerDownload = (blobData, filename) => {
    const url = window.URL.createObjectURL(blobData);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Download a single model's backup (JSON)
  const handleExportSingleModel = async (modelKey, modelName) => {
    try {
      setDownloadingKey(modelKey);
      setStatusNotification({
        type: 'info',
        title: `Generating Backup: ${modelName}`,
        message: 'Fetching records and packing JSON payload...',
      });

      const res = await fetch(`${BACKEND_URL}/apis/v1/backup/export/${modelKey}?download=true`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Export failed with HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const filename = `education_masters_${modelKey}_backup_${new Date().toISOString().slice(0, 10)}.json`;
      triggerDownload(blob, filename);

      setStatusNotification({
        type: 'success',
        title: 'Backup Downloaded Successfully',
        message: `${modelName} exported cleanly as ${filename}`,
      });
    } catch (err) {
      setStatusNotification({
        type: 'error',
        title: 'Export Failed',
        message: err.message || 'Could not download model backup.',
      });
    } finally {
      setDownloadingKey(null);
      setTimeout(() => setStatusNotification(null), 5000);
    }
  };

  // Download Partitioned ZIP Archive (Separate JSON file per model inside ZIP)
  const handleExportZip = async (isAll = false) => {
    const targetKeys = isAll ? 'all' : selectedModels;
    if (!isAll && selectedModels.length === 0) {
      alert('Please select at least one collection model to export.');
      return;
    }

    try {
      setDownloadingKey(isAll ? 'zip_all' : 'zip_selected');
      setStatusNotification({
        type: 'info',
        title: isAll
          ? 'Creating Full Partitioned ZIP Backup (29 Models)'
          : `Creating Partitioned ZIP Backup (${selectedModels.length} Models)`,
        message: 'Bundling individual model JSON files into high-compression ZIP archive...',
      });

      const endpoint = isAll
        ? `${BACKEND_URL}/apis/v1/backup/export-zip?all=true`
        : `${BACKEND_URL}/apis/v1/backup/export-zip?models=${encodeURIComponent(selectedModels.join(','))}`;

      const res = await fetch(endpoint, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`ZIP export failed with HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = isAll
        ? `education_masters_full_database_backup_${dateStr}.zip`
        : `education_masters_custom_backup_${selectedModels.length}_models_${dateStr}.zip`;

      triggerDownload(blob, filename);

      setStatusNotification({
        type: 'success',
        title: 'ZIP Archive Downloaded Successfully',
        message: `Saved ${filename} (${(blob.size / 1024 / 1024).toFixed(2)} MB) with partitioned model files!`,
      });
    } catch (err) {
      setStatusNotification({
        type: 'error',
        title: 'ZIP Backup Failed',
        message: err.message || 'Failed to generate partitioned ZIP backup.',
      });
    } finally {
      setDownloadingKey(null);
      setTimeout(() => setStatusNotification(null), 6000);
    }
  };

  // Download Bulk Single JSON
  const handleExportBulkJson = async (isAll = false) => {
    const targetKeys = isAll ? 'all' : selectedModels;
    if (!isAll && selectedModels.length === 0) {
      alert('Please select at least one collection model to export.');
      return;
    }

    try {
      setDownloadingKey(isAll ? 'json_all' : 'json_selected');
      setStatusNotification({
        type: 'info',
        title: isAll ? 'Packaging Entire Database JSON' : `Packaging ${selectedModels.length} Models JSON`,
        message: 'Aggregating records into single JSON file...',
      });

      const res = await fetch(`${BACKEND_URL}/apis/v1/backup/export-bulk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          models: isAll ? 'all' : selectedModels,
          download: 'true',
        }),
      });

      if (!res.ok) {
        throw new Error(`Bulk export failed with HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = isAll
        ? `education_masters_full_database_backup_${dateStr}.json`
        : `education_masters_custom_backup_${selectedModels.length}_models_${dateStr}.json`;

      triggerDownload(blob, filename);

      setStatusNotification({
        type: 'success',
        title: 'JSON Backup Ready',
        message: `Successfully saved ${filename} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`,
      });
    } catch (err) {
      setStatusNotification({
        type: 'error',
        title: 'JSON Backup Failed',
        message: err.message || 'Failed to generate bulk JSON file.',
      });
    } finally {
      setDownloadingKey(null);
      setTimeout(() => setStatusNotification(null), 6000);
    }
  };

  // Open Data Preview Modal for a specific model
  const handleOpenPreview = async (modelKey, modelName) => {
    setPreviewModal({
      isOpen: true,
      modelKey,
      modelName,
      loading: true,
      data: null,
      meta: null,
      error: null,
    });

    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/backup/export/${modelKey}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPreviewModal((prev) => ({
          ...prev,
          loading: false,
          meta: json.meta,
          data: json.data?.slice(0, 10) || [],
          totalCount: json.data?.length || 0,
        }));
      } else {
        setPreviewModal((prev) => ({
          ...prev,
          loading: false,
          error: json.message || 'Failed to fetch preview records.',
        }));
      }
    } catch (err) {
      setPreviewModal((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Network error fetching preview.',
      }));
    }
  };

  // Offline File Validator (Supports both .json and .zip via JSZip)
  const handleValidateBackupFile = async (file) => {
    if (!file) return;

    if (file.name.endsWith('.zip')) {
      try {
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(file);
        const fileNames = Object.keys(zip.files).filter((name) => !zip.files[name].dir);

        let manifestData = null;
        if (zip.file('manifest.json')) {
          const manifestText = await zip.file('manifest.json').async('text');
          manifestData = JSON.parse(manifestText);
        }

        const jsonFiles = fileNames.filter((f) => f.endsWith('.json') && f !== 'manifest.json');

        setValidatorResult({
          valid: true,
          fileName: file.name,
          fileSizeKb: Math.round(file.size / 1024),
          appName: manifestData?.meta?.appName || 'Education Masters',
          exportType: manifestData?.meta?.exportType || 'partitioned_zip_archive',
          exportedAt: manifestData?.meta?.exportedAt || 'Unknown',
          exportedBy: manifestData?.meta?.exportedBy || 'Admin',
          collectionsCount: jsonFiles.length,
          collectionsList: jsonFiles.map((f) => f.replace('.json', '')),
          totalDocuments: manifestData?.meta?.totalRecords || 'Available across files',
          isZip: true,
        });
      } catch (err) {
        setValidatorResult({
          valid: false,
          message: `Corrupted or invalid ZIP archive: ${err.message}`,
        });
      }
      return;
    }

    // JSON file handler
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const isBulk = Boolean(parsed.collections && parsed.meta);
        const isSingle = Boolean(parsed.data && parsed.meta?.modelKey);

        if (!isBulk && !isSingle) {
          setValidatorResult({
            valid: false,
            message: 'File is valid JSON, but does not match Education Masters backup schema format.',
          });
          return;
        }

        let totalDocs = 0;
        let collectionsFound = [];

        if (isBulk) {
          collectionsFound = Object.keys(parsed.collections);
          totalDocs = collectionsFound.reduce((sum, key) => sum + (parsed.collections[key]?.length || 0), 0);
        } else {
          collectionsFound = [parsed.meta.modelKey];
          totalDocs = parsed.data.length;
        }

        setValidatorResult({
          valid: true,
          fileName: file.name,
          fileSizeKb: Math.round(file.size / 1024),
          appName: parsed.meta?.appName || 'Education Masters',
          exportType: parsed.meta?.exportType || (isBulk ? 'full_database' : 'single_model'),
          exportedAt: parsed.meta?.exportedAt || 'Unknown',
          exportedBy: parsed.meta?.exportedBy || 'Unknown Admin',
          collectionsCount: collectionsFound.length,
          collectionsList: collectionsFound,
          totalDocuments: totalDocs,
          isZip: false,
        });
      } catch (err) {
        setValidatorResult({
          valid: false,
          message: `Invalid JSON File: ${err.message}`,
        });
      }
    };
    reader.readAsText(file);
  };

  // Toggle select individual model
  const toggleModelSelection = (key) => {
    setSelectedModels((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Select all / deselect all
  const toggleSelectAll = () => {
    if (!manifest) return;
    if (selectedModels.length === manifest.models.length) {
      setSelectedModels([]);
    } else {
      setSelectedModels(manifest.models.map((m) => m.key));
    }
  };

  // Select all models in a specific category
  const selectCategoryModels = (cat) => {
    if (!manifest) return;
    const catKeys = manifest.models
      .filter((m) => cat === 'ALL' || m.category === cat)
      .map((m) => m.key);

    const allInCatSelected = catKeys.every((k) => selectedModels.includes(k));

    if (allInCatSelected) {
      setSelectedModels((prev) => prev.filter((k) => !catKeys.includes(k)));
    } else {
      setSelectedModels((prev) => Array.from(new Set([...prev, ...catKeys])));
    }
  };

  // Categories list
  const categories = useMemo(() => {
    if (!manifest?.models) return ['ALL'];
    const set = new Set(manifest.models.map((m) => m.category));
    return ['ALL', ...Array.from(set)];
  }, [manifest]);

  // Selected records count calculation
  const selectedRecordsCount = useMemo(() => {
    if (!manifest?.models) return 0;
    return manifest.models
      .filter((m) => selectedModels.includes(m.key))
      .reduce((sum, m) => sum + (m.count || 0), 0);
  }, [manifest, selectedModels]);

  // Filtered models
  const filteredModels = useMemo(() => {
    if (!manifest?.models) return [];
    return manifest.models.filter((m) => {
      const matchCategory = categoryFilter === 'ALL' || m.category === categoryFilter;
      const matchSearch =
        !searchQuery.trim() ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [manifest, categoryFilter, searchQuery]);

  const tabs = [
    { id: 'general', label: 'General Portal', icon: Globe },
    { id: 'seo', label: 'SEO Defaults', icon: Layers },
    { id: 'crm', label: 'CRM & Institutes', icon: Building2 },
    {
      id: 'backups',
      label: 'Database & Backups',
      icon: Database,
      badge: manifest ? `${manifest.totalModels} Models` : null,
    },
    { id: 'system', label: 'System & Server Info', icon: Server },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Toast / Status Notification Alert */}
      {statusNotification && (
        <div
          className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-200 z-50 ${
            statusNotification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : statusNotification.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-blue-50 border-blue-300 text-blue-950'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {statusNotification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : statusNotification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs sm:text-sm font-bold">{statusNotification.title}</p>
              <p className="text-xs opacity-90">{statusNotification.message}</p>
            </div>
          </div>
          <button
            onClick={() => setStatusNotification(null)}
            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Portal Settings
            </h1>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
              Admin Configuration
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage global site preferences, selective database backups, ZIP partitioned archives, SEO tags, and CRM defaults.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Header Quick Download Split Button */}
          <div className="relative">
            <div className="inline-flex rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => handleExportZip(true)}
                disabled={downloadingKey !== null}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:scale-[0.98] text-white text-xs font-bold rounded-l-lg transition-all cursor-pointer disabled:opacity-60"
                title="Download complete database as a ZIP archive of partitioned JSON files"
              >
                {downloadingKey === 'zip_all' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileArchive size={14} />
                )}
                <span>
                  {downloadingKey === 'zip_all' ? 'Creating ZIP...' : 'Download Database (.ZIP)'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
                className="px-2 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-r-lg border-l border-indigo-500/50 transition cursor-pointer"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Dropdown Options */}
            {headerDropdownOpen && (
              <div
                className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setHeaderDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Database Backup Formats</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHeaderDropdownOpen(false);
                    handleExportZip(true);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 cursor-pointer"
                >
                  <FileArchive size={15} className="text-indigo-600" />
                  <div>
                    <span className="block font-bold">Partitioned ZIP Archive</span>
                    <span className="text-[10.5px] text-slate-400 font-normal">Separate JSON file per model in ZIP</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeaderDropdownOpen(false);
                    handleExportBulkJson(true);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 cursor-pointer"
                >
                  <FileJson size={15} className="text-blue-600" />
                  <div>
                    <span className="block font-bold">Single Combined JSON</span>
                    <span className="text-[10.5px] text-slate-400 font-normal">All 29 models in 1 master JSON file</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Save Changes Button */}
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            {savedSuccess ? <Check size={14} /> : <Save size={14} />}
            <span>{savedSuccess ? 'Settings Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
              {t.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* ============================================================ */}
        {/* TAB 1: GENERAL PORTAL */}
        {/* ============================================================ */}
        {activeTab === 'general' && (
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Globe size={16} className="text-blue-600" />
              <span>General Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Site Title</label>
                <input
                  type="text"
                  value={formData.siteName}
                  onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Administration Email
                </label>
                <input
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </form>
        )}

        {/* ============================================================ */}
        {/* TAB 2: SEO DEFAULTS */}
        {/* ============================================================ */}
        {activeTab === 'seo' && (
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Layers size={16} className="text-blue-600" />
              <span>Default SEO Metadata Configuration</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="indexing"
                  checked={formData.allowIndexing}
                  onChange={(e) => setFormData({ ...formData, allowIndexing: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="indexing"
                  className="text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Allow Search Engine Indexing (index, follow)
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Meta Title
                </label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Meta Keywords (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.metaKeywords}
                  onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Meta Description
                </label>
                <textarea
                  rows={3}
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </form>
        )}

        {/* ============================================================ */}
        {/* TAB 3: CRM & INSTITUTES */}
        {/* ============================================================ */}
        {activeTab === 'crm' && (
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Building2 size={16} className="text-blue-600" />
              <span>Institutes CRM Plan Defaults</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Trial Period (Days)
                </label>
                <input
                  type="number"
                  value={formData.defaultTrialDays}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultTrialDays: parseInt(e.target.value) || 0 })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Max Staff per Institute
                </label>
                <input
                  type="number"
                  value={formData.defaultMaxStaff}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultMaxStaff: parseInt(e.target.value) || 0 })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </form>
        )}

        {/* ============================================================ */}
        {/* TAB 4: DATABASE & BACKUPS (ZIP ARCHIVES & MULTI-SELECT SUITE) */}
        {/* ============================================================ */}
        {activeTab === 'backups' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Hero Database Management Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-5 sm:p-6 text-white shadow-lg border border-slate-800">
              <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      MongoDB Atlas Live
                    </span>
                    <span className="text-xs text-slate-300 font-medium">Production Database</span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                    Universal Data Backup &amp; Model Exporter
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Download full-database backups as a <strong>partitioned ZIP archive</strong> (separate clean JSON file for each model), or multi-select custom collections.
                  </p>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={fetchManifest}
                    disabled={loadingManifest}
                    className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/15 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={loadingManifest ? 'animate-spin' : ''} />
                    <span>Refresh Counts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportZip(true)}
                    disabled={downloadingKey !== null}
                    className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-500 active:scale-[0.98] text-xs sm:text-sm font-extrabold text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition cursor-pointer disabled:opacity-60"
                  >
                    {downloadingKey === 'zip_all' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <FileArchive size={16} />
                    )}
                    <span>
                      {downloadingKey === 'zip_all'
                        ? 'Creating Partitioned ZIP...'
                        : 'Download Complete Database (.ZIP Archive)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider">
                    Total Collections
                  </span>
                  <p className="text-lg sm:text-xl font-black text-white mt-0.5">
                    {manifest ? manifest.totalModels : '29'}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider">
                    Indexed Documents
                  </span>
                  <p className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5">
                    {manifest ? manifest.totalRecords.toLocaleString() : '65,000+'}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider">
                    Multi-Selected for Export
                  </span>
                  <p className="text-lg sm:text-xl font-black text-indigo-300 mt-0.5">
                    {selectedModels.length} of {manifest?.models?.length || 29} ({selectedRecordsCount.toLocaleString()} docs)
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider">
                    Partition Format
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-emerald-300 mt-1 flex items-center gap-1">
                    <FileArchive size={14} /> Partitioned .zip Files
                  </p>
                </div>
              </div>
            </div>

            {/* Multi-Select & Filter Toolbar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3.5 shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Search Box */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search specific models (e.g. jobs, mcqs, users, mock-tests)..."
                    className="w-full text-xs pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Multi-Select Action Group */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Select All Toggle */}
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {manifest && selectedModels.length === manifest.models.length ? (
                      <>
                        <CheckSquare size={14} className="text-blue-600" />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <Square size={14} className="text-slate-400" />
                        <span>Select All ({manifest?.models?.length || 29})</span>
                      </>
                    )}
                  </button>

                  {/* Multi-Select Download ZIP Button */}
                  <button
                    type="button"
                    onClick={() => handleExportZip(false)}
                    disabled={selectedModels.length === 0 || downloadingKey !== null}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {downloadingKey === 'zip_selected' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <FileArchive size={14} />
                    )}
                    <span>
                      Download Selected as ZIP ({selectedModels.length})
                    </span>
                  </button>

                  {/* Multi-Select Download Single JSON Button */}
                  <button
                    type="button"
                    onClick={() => handleExportBulkJson(false)}
                    disabled={selectedModels.length === 0 || downloadingKey !== null}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {downloadingKey === 'json_selected' ? (
                      <Loader2 size={14} className="animate-spin text-blue-600" />
                    ) : (
                      <FileJson size={14} className="text-blue-600" />
                    )}
                    <span>Combined JSON ({selectedModels.length})</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Pills with Select Entire Category Shortcut */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                  <Filter size={12} /> Filter:
                </span>
                {categories.map((cat) => {
                  const isSelected = categoryFilter === cat;
                  return (
                    <div key={cat} className="inline-flex items-center">
                      <button
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat === 'ALL' ? 'All Models' : cat}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error Message if Manifest Failed */}
            {manifestError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{manifestError}</span>
              </div>
            )}

            {/* Specific Models Grid */}
            {loadingManifest ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-600">Querying database collection manifests &amp; record counters...</p>
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 space-y-2">
                <Database className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No database models match your search.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('ALL');
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Clear search filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {filteredModels.map((item) => {
                  const IconComponent = ICON_MAP[item.icon] || Database;
                  const isSelected = selectedModels.includes(item.key);
                  const isDownloading = downloadingKey === item.key;

                  return (
                    <div
                      key={item.key}
                      className={`relative rounded-xl border p-4 transition-all duration-150 flex flex-col justify-between gap-3 bg-white ${
                        isSelected
                          ? 'border-blue-400 shadow-xs ring-2 ring-blue-100 bg-blue-50/10'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        {/* Top row: Checkbox, Icon, Category Badge & Count */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => toggleModelSelection(item.key)}
                              className="text-slate-400 hover:text-blue-600 transition cursor-pointer mt-0.5"
                              title="Toggle selection for batch download"
                            >
                              {isSelected ? (
                                <CheckSquare size={18} className="text-blue-600" />
                              ) : (
                                <Square size={18} />
                              )}
                            </button>

                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/80">
                              <IconComponent size={16} />
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-tight">
                                {item.name}
                              </h4>
                              <p className="text-[10.5px] font-mono text-slate-400 truncate">
                                {item.key}.json
                              </p>
                            </div>
                          </div>

                          {/* Records Count Pill */}
                          <span
                            className={`text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                              item.count > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {item.count.toLocaleString()} docs
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-[11.5px] text-slate-500 leading-snug mt-2.5 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {item.category}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Quick Preview Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(item.key, item.name)}
                            className="px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Preview live documents and schema"
                          >
                            <Eye size={12} />
                            <span>Preview</span>
                          </button>

                          {/* Download Single Model JSON Button */}
                          <button
                            type="button"
                            onClick={() => handleExportSingleModel(item.key, item.name)}
                            disabled={isDownloading}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-blue-600 active:scale-95 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer disabled:opacity-50"
                            title="Download standalone JSON file for this specific model"
                          >
                            {isDownloading ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Download size={12} />
                            )}
                            <span>{isDownloading ? 'Exporting...' : 'JSON'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Offline Backup File Inspector & ZIP/JSON Validator */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                    Backup Archive Inspector (.ZIP &amp; .JSON)
                  </h3>
                </div>
                <span className="text-[10.5px] font-bold text-slate-400">
                  Client-side Verification
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Drop any previously exported Education Masters backup file (<strong>.zip archive</strong> or <strong>.json</strong>) to verify its internal partitioned collection files, manifest integrity, and document counts safely offline.
              </p>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleValidateBackupFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  isDraggingFile
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FileArchive className="w-7 h-7 text-indigo-600" />
                  <FileJson className="w-7 h-7 text-blue-600" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  Drag and drop a <strong>.zip</strong> or <strong>.json</strong> backup file here, or{' '}
                  <label className="text-blue-600 hover:underline cursor-pointer">
                    browse files
                    <input
                      type="file"
                      accept=".zip,.json"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleValidateBackupFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports Partitioned Multi-Model ZIP Archives and Single/Combined JSON Exports
                </p>
              </div>

              {/* Validator Report Display */}
              {validatorResult && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in duration-150 ${
                    validatorResult.valid
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold flex items-center gap-1.5">
                      {validatorResult.valid ? (
                        <>
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          <span>
                            Valid {validatorResult.isZip ? 'Partitioned ZIP Archive' : 'JSON Backup'} Verified
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} className="text-rose-600" />
                          <span>Validation Warning</span>
                        </>
                      )}
                    </span>
                    <button
                      onClick={() => setValidatorResult(null)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {validatorResult.valid ? (
                    <div className="space-y-2 pt-1 font-medium">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <span className="text-[10px] uppercase text-emerald-800/70 font-bold block">File Name</span>
                          <span className="font-bold truncate block">{validatorResult.fileName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-emerald-800/70 font-bold block">Archive Format</span>
                          <span className="font-bold block capitalize">
                            {validatorResult.isZip ? 'ZIP (Partitioned Files)' : 'Single JSON'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-emerald-800/70 font-bold block">Partitioned Models</span>
                          <span className="font-bold block">{validatorResult.collectionsCount} Models</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-emerald-800/70 font-bold block">Total Documents</span>
                          <span className="font-bold block">
                            {typeof validatorResult.totalDocuments === 'number'
                              ? validatorResult.totalDocuments.toLocaleString()
                              : validatorResult.totalDocuments}
                          </span>
                        </div>
                      </div>

                      {validatorResult.collectionsList && (
                        <div className="pt-2 border-t border-emerald-200/60">
                          <span className="text-[10px] uppercase text-emerald-800/70 font-bold block mb-1">
                            Included Model Datasets:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {validatorResult.collectionsList.map((col) => (
                              <span
                                key={col}
                                className="px-2 py-0.5 bg-emerald-100/80 text-emerald-900 rounded font-mono text-[10.5px] border border-emerald-200"
                              >
                                {col}.json
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>{validatorResult.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: SYSTEM & SERVER INFO */}
        {/* ============================================================ */}
        {activeTab === 'system' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Server size={16} className="text-blue-600" />
              <span>System Environment &amp; Diagnostics</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Database Engine</span>
                <p className="text-sm font-bold text-slate-800">MongoDB Atlas</p>
                <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                  Connected &amp; Healthy
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">API Backend</span>
                <p className="text-sm font-bold text-slate-800">Node.js Express (ESM)</p>
                <span className="text-xs text-slate-500">Port: 5001 • REST v1</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Frontend Stack</span>
                <p className="text-sm font-bold text-slate-800">Next.js 14 (App Router)</p>
                <span className="text-xs text-slate-500">Tailwind CSS + Lucide Icons</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Archive Compression</span>
                <p className="text-sm font-bold text-slate-800">Partitioned ZIP Streamer</p>
                <span className="text-xs text-emerald-600 font-bold">Zlib Level 9 (Max)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* FLOATING MULTI-SELECT ACTION BAR (WHEN MODELS ARE SELECTED) */}
      {/* ============================================================ */}
      {activeTab === 'backups' && selectedModels.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 animate-in slide-in-from-bottom-3 duration-200">
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-2xl border border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 pl-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                {selectedModels.length}
              </div>
              <div className="text-xs font-bold leading-tight">
                <span>{selectedModels.length} Models Selected</span>
                <span className="text-[11px] text-slate-400 block font-normal">
                  ~{selectedRecordsCount.toLocaleString()} documents
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedModels([])}
                className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleExportZip(false)}
                disabled={downloadingKey !== null}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
              >
                {downloadingKey === 'zip_selected' ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <FileArchive size={13} />
                )}
                <span>Download ZIP</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportBulkJson(false)}
                disabled={downloadingKey !== null}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {downloadingKey === 'json_selected' ? (
                  <Loader2 size={13} className="animate-spin text-blue-400" />
                ) : (
                  <FileJson size={13} className="text-blue-400" />
                )}
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* QUICK PREVIEW MODAL */}
      {/* ============================================================ */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="absolute inset-0"
            onClick={() => setPreviewModal({ isOpen: false, modelKey: null, modelName: '', data: null })}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] z-10 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Eye size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {previewModal.modelName} — Dataset Preview
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Collection Key: <code className="text-blue-600">{previewModal.modelKey}.json</code> • Showing top records
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewModal({ isOpen: false, modelKey: null, modelName: '', data: null })}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              {previewModal.loading ? (
                <div className="py-12 text-center space-y-2">
                  <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-600">Fetching live schema and sample records...</p>
                </div>
              ) : previewModal.error ? (
                <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{previewModal.error}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 bg-slate-100 p-2.5 rounded-lg">
                    <span>Total Records Available: <strong className="text-slate-900">{previewModal.totalCount || 0}</strong></span>
                    <span>Preview Limit: 10 Records</span>
                  </div>

                  <div className="rounded-xl bg-slate-900 p-3.5 overflow-x-auto text-[11.5px] font-mono text-emerald-400 max-h-96">
                    <pre>{JSON.stringify(previewModal.data, null, 2)}</pre>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <button
                onClick={() => setPreviewModal({ isOpen: false, modelKey: null, modelName: '', data: null })}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Close Preview
              </button>

              <button
                onClick={() => {
                  const key = previewModal.modelKey;
                  const name = previewModal.modelName;
                  setPreviewModal({ isOpen: false, modelKey: null, modelName: '', data: null });
                  handleExportSingleModel(key, name);
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download size={13} />
                <span>Download {previewModal.modelKey}.json</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
