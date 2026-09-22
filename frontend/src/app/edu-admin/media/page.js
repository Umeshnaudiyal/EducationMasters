'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Image as ImageIcon,
  UploadCloud,
  Grid,
  List,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  PlusCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import AdminLoader from '@/components/admin/AdminLoader';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

// Consistent unique key helper
const getMediaKey = (item, idx) => {
  if (item._id) return String(item._id);
  if (item.sql_id) return `sql_${item.sql_id}`;
  if (item.file) return `file_${item.file}`;
  return `media_idx_${idx}`;
};

// Memoized Grid Card Component with rock-solid fixed aspect ratio (Zero Layout Shift)
const MediaGridCard = memo(function MediaGridCard({
  item,
  idx,
  isSelected,
  bulkMode,
  onOpenDetails,
  onToggleSelect,
}) {
  const [imgError, setImgError] = useState(false);
  const fullUrl = imgError ? '/logo.webp' : getImageUrl(item);
  const name = item.name || `Asset #${idx + 1}`;
  const hasAlt = Boolean(item.alt && String(item.alt).trim());

  return (
    <div
      onClick={() => onOpenDetails(item, idx)}
      className={`relative aspect-square bg-slate-100 rounded border overflow-hidden cursor-pointer select-none box-border ${
        isSelected
          ? 'border-[#2271b1] ring-2 ring-[#2271b1] ring-inset shadow-xs'
          : 'border-slate-300 hover:border-[#2271b1] hover:ring-2 hover:ring-[#2271b1] hover:ring-inset'
      }`}
    >
      <img
        src={fullUrl}
        alt={item.alt ? String(item.alt) : name}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover block pointer-events-none"
        onError={() => setImgError(true)}
      />

      {/* Bulk Select Checkbox */}
      {bulkMode && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(item._id || item.sql_id || idx);
          }}
          className="absolute top-1.5 left-1.5 z-20"
        >
          <div
            className={`w-4 h-4 rounded flex items-center justify-center shadow-xs ${
              isSelected
                ? 'bg-[#2271b1] text-white'
                : 'bg-white border border-slate-400 text-transparent hover:border-[#2271b1]'
            }`}
          >
            <Check size={10} strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Alt Tag Indicator Badge */}
      {hasAlt && (
        <div
          title={`Alt text: ${String(item.alt)}`}
          className="absolute bottom-1 right-1 z-10 bg-black/70 text-white text-[9px] font-mono font-bold px-1 py-0.5 rounded leading-none pointer-events-none"
        >
          ALT
        </div>
      )}
    </div>
  );
});

export default function MediaLibraryPage() {
  const { data: session } = useSession();
  const isAuthor = session?.user?.role?.toLowerCase() === 'author' || session?.user?.role?.toLowerCase() === 'writer';

  const searchParams = useSearchParams();
  const [mediaList, setMediaList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Bulk Selection
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    item: null,
    isBulk: false,
    isLoading: false,
  });

  // Selected Media for Details Modal
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [modalImgError, setModalImgError] = useState(false);

  // Editable Form Fields in Details Modal
  const [formAlt, setFormAlt] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [copiedId, setCopiedId] = useState(null);

  const saveTimeoutRef = useRef(null);
  const selectedMediaRef = useRef(null);
  selectedMediaRef.current = selectedMedia;

  // Check query param for upload action
  useEffect(() => {
    if (searchParams.get('action') === 'upload') {
      setShowUploadModal(true);
    }
  }, [searchParams]);

  const token =
    session?.user?.accessToken ||
    (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  // Fetch Media List with Deduplication
  const fetchMedia = async (pageNum = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const queryParams = new URLSearchParams({
        page: pageNum,
        limit: 48,
        search: search.trim(),
        type: selectedType !== 'all' ? selectedType : '',
        date: selectedDate !== 'all' ? selectedDate : '',
      });

      const res = await fetch(`${BACKEND_URL}/apis/v1/media?${queryParams}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();

      if (data.success && data.data) {
        const incoming = Array.isArray(data.data) ? data.data : [];
        if (append) {
          setMediaList((prev) => {
            const seen = new Set(prev.map((m) => String(m._id || m.sql_id || m.file)));
            const uniqueNew = incoming.filter(
              (m) => !seen.has(String(m._id || m.sql_id || m.file))
            );
            return [...prev, ...uniqueNew];
          });
        } else {
          setMediaList(incoming);
        }
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching media:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMedia(1, false);
    setPage(1);
  }, [search, selectedType, selectedDate]);

  // Open Details Modal
  const openMediaDetails = useCallback(
    (item, idx) => {
      if (!item) return;

      if (bulkMode) {
        const id = item._id || item.sql_id || idx;
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
        return;
      }

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      const resolvedIndex =
        idx !== undefined && idx >= 0
          ? idx
          : mediaList.findIndex(
              (m) => String(m._id || m.sql_id) === String(item._id || item.sql_id)
            );

      setSelectedMedia(item);
      setSelectedIndex(resolvedIndex >= 0 ? resolvedIndex : 0);
      setModalImgError(false);

      setFormAlt(item.alt ? String(item.alt) : item.name ? String(item.name) : '');
      setFormTitle(item.name ? String(item.name) : '');
      setFormCaption(item.caption ? String(item.caption) : '');
      setFormDescription(item.description ? String(item.description) : '');
      setSaveStatus('idle');
    },
    [bulkMode, mediaList]
  );

  const closeMediaDetails = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSelectedMedia(null);
    setSelectedIndex(-1);
    setSaveStatus('idle');
    setModalImgError(false);
  }, []);

  // Navigate Previous / Next media in modal safely
  const navigateMedia = useCallback(
    (direction) => {
      if (mediaList.length === 0) return;
      let newIndex = selectedIndex + direction;
      if (newIndex < 0) newIndex = mediaList.length - 1;
      if (newIndex >= mediaList.length) newIndex = 0;

      const nextItem = mediaList[newIndex];
      if (nextItem) {
        openMediaDetails(nextItem, newIndex);
      }
    },
    [mediaList, selectedIndex, openMediaDetails]
  );

  // Keyboard navigation inside modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedMedia) return;
      if (e.key === 'Escape') {
        closeMediaDetails();
      } else if (e.key === 'ArrowLeft' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        navigateMedia(-1);
      } else if (e.key === 'ArrowRight' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        navigateMedia(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, navigateMedia, closeMediaDetails]);

  // Debounced Auto-Save & Manual Save to Backend
  const saveMediaMetadata = useCallback(async (updatedFields) => {
    if (isAuthor) return;
    const currentMedia = selectedMediaRef.current;
    const mediaId = currentMedia?._id || currentMedia?.sql_id;
    if (!mediaId) return;

    try {
      setSaveStatus('saving');
      const res = await fetch(`${BACKEND_URL}/apis/v1/media/${mediaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updatedFields),
      });

      const resData = await res.json();
      if (resData.success) {
        setSaveStatus('saved');
        setMediaList((prev) =>
          prev.map((m) =>
            String(m._id || m.sql_id) === String(mediaId) ? { ...m, ...updatedFields } : m
          )
        );
        setSelectedMedia((prev) => (prev ? { ...prev, ...updatedFields } : prev));

        setTimeout(() => {
          setSaveStatus((curr) => (curr === 'saved' ? 'idle' : curr));
        }, 2500);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('Failed to update media details:', err);
      setSaveStatus('error');
    }
  }, [isAuthor, token]);

  const triggerAutoSave = (fieldUpdate) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveMediaMetadata(fieldUpdate);
    }, 450);
  };

  const handleAltChange = (val) => {
    setFormAlt(val);
    triggerAutoSave({ alt: val });
  };

  const handleTitleChange = (val) => {
    setFormTitle(val);
    triggerAutoSave({ name: val });
  };

  const handleCaptionChange = (val) => {
    setFormCaption(val);
    triggerAutoSave({ caption: val });
  };

  const handleDescriptionChange = (val) => {
    setFormDescription(val);
    triggerAutoSave({ description: val });
  };

  const handleManualSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveMediaMetadata({
      alt: formAlt,
      name: formTitle,
      caption: formCaption,
      description: formDescription,
    });
  };

  // Open Delete Modal
  const openDeleteModal = (mediaItem, e) => {
    if (e) e.stopPropagation();
    const itemToDelete = mediaItem || selectedMedia;
    if (!itemToDelete) return;
    setDeleteModal({
      isOpen: true,
      item: itemToDelete,
      isBulk: false,
      isLoading: false,
    });
  };

  const handleConfirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));
    try {
      if (deleteModal.isBulk) {
        const count = selectedIds.size;
        for (const id of selectedIds) {
          await fetch(`${BACKEND_URL}/apis/v1/media/${id}`, {
            method: 'DELETE',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
        }
        setMediaList((prev) =>
          prev.filter((m) => !selectedIds.has(m._id || m.sql_id))
        );
        setTotal((prev) => Math.max(0, prev - count));
        setSelectedIds(new Set());
        setBulkMode(false);
      } else if (deleteModal.item) {
        const deleteId = deleteModal.item._id || deleteModal.item.sql_id;
        const res = await fetch(`${BACKEND_URL}/apis/v1/media/${deleteId}`, {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
        if (data.success) {
          setMediaList((prev) =>
            prev.filter((m) => String(m._id || m.sql_id) !== String(deleteId))
          );
          setTotal((prev) => Math.max(0, prev - 1));

          if (String(selectedMedia?._id || selectedMedia?.sql_id) === String(deleteId)) {
            if (mediaList.length > 1) {
              navigateMedia(1);
            } else {
              closeMediaDetails();
            }
          }
        }
      }
      setDeleteModal({ isOpen: false, item: null, isBulk: false, isLoading: false });
    } catch (err) {
      console.error('Failed to delete media:', err);
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Upload Logic
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let firstUploaded = null;

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('image', files[i]);
        const res = await fetch(`${BACKEND_URL}/apis/v1/media/upload`, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.data) {
          if (!firstUploaded) firstUploaded = data.data;
          setMediaList((prev) => [data.data, ...prev]);
          setTotal((prev) => prev + 1);
        }
      }
      setShowUploadModal(false);
      if (firstUploaded) {
        openMediaDetails(firstUploaded, 0);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload file(s)');
    } finally {
      setUploading(false);
    }
  };

  // Copy URL to clipboard
  const copyToClipboard = (url, id, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download Media File
  const handleDownload = (item, e) => {
    if (e) e.stopPropagation();
    const url = getImageUrl(item);
    const link = document.createElement('a');
    link.href = url;
    link.download = item.name || 'media-download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk Selection Handlers
  const toggleSelectId = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllOnPage = () => {
    if (selectedIds.size === mediaList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(mediaList.map((m) => m._id || m.sql_id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setDeleteModal({
      isOpen: true,
      item: null,
      isBulk: true,
      isLoading: false,
    });
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMedia(nextPage, true);
  };

  return (
    <div className="space-y-3 w-full min-w-0 select-none font-sans text-slate-800">
      {/* Page Header: Title + Add New Button + Bulk Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Media Library</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {total.toLocaleString()} items
            </span>
          </h1>
          <button
            onClick={() => setShowUploadModal(!showUploadModal)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#2271b1] bg-white hover:bg-blue-50 border border-[#2271b1] rounded shadow-2xs transition-colors cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>{showUploadModal ? 'Close Upload' : 'Add New'}</span>
          </button>
        </div>

        {/* Right Header: Bulk Actions & Refresh */}
        <div className="flex items-center gap-2">
          {!isAuthor && (
            bulkMode ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded px-2.5 py-1">
                <span className="text-xs text-slate-700 font-medium">
                  {selectedIds.size} selected
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllOnPage}
                  className="text-xs text-[#2271b1] hover:underline cursor-pointer"
                >
                  {selectedIds.size === mediaList.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0 || bulkDeleting}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                >
                  {bulkDeleting ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  <span>Delete Selected</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBulkMode(false);
                    setSelectedIds(new Set());
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 ml-1 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setBulkMode(true)}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs text-slate-700 font-medium shadow-2xs transition-colors cursor-pointer"
              >
                Bulk Select
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => fetchMedia(1, false)}
            title="Refresh Library"
            className="p-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Upload Dropzone Area */}
      {showUploadModal && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFileUpload(e.dataTransfer.files);
          }}
          className={`p-6 border-2 border-dashed rounded-lg text-center transition-all bg-white shadow-2xs ${
            dragOver ? 'border-[#2271b1] bg-blue-50/50' : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <div className="max-w-md mx-auto space-y-2.5">
            <UploadCloud size={36} className="mx-auto text-[#2271b1]" />
            <p className="text-xs font-semibold text-slate-800">
              Drop files anywhere to upload or click below
            </p>
            <p className="text-[11px] text-slate-500">
              Supports JPG, PNG, WEBP, GIF, SVG, and PDF documents. Max file size: 50MB.
            </p>
            <div>
              <label className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-semibold rounded cursor-pointer transition-colors shadow-2xs">
                {uploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={14} />
                    <span>Select Files</span>
                  </>
                )}
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  disabled={uploading}
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar & Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-2.5 rounded border border-slate-300 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Grid / List View Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#2271b1] shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Grid View"
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-[#2271b1] shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="List View"
            >
              <List size={15} />
            </button>
          </div>

          {/* Media Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:border-[#2271b1]"
          >
            <option value="all">All media items</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
          </select>

          {/* Date Filter */}
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:border-[#2271b1]"
          >
            <option value="all">All dates</option>
            <option value="2026/09">September 2026</option>
            <option value="2026/08">August 2026</option>
            <option value="2026/07">July 2026</option>
            <option value="2026">Year 2026</option>
            <option value="2025">Year 2025</option>
            <option value="2024">Year 2024</option>
            <option value="2023">Year 2023</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Search:</span>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, alt, or file..."
              className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-[#2271b1] w-48 sm:w-64 shadow-2xs pr-6"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Media Content Display */}
      {loading && mediaList.length === 0 ? (
        <div className="bg-white rounded border border-slate-300 p-12">
          <AdminLoader
            text="Loading media library from database..."
            subtext="Fetching 12,000+ media assets and metadata"
          />
        </div>
      ) : mediaList.length === 0 ? (
        <div className="bg-white rounded border border-slate-300 p-12 text-center shadow-2xs">
          <ImageIcon size={44} className="mx-auto text-slate-300 mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No media items found</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {search ? 'No items match your search query.' : 'Upload images or banners to get started.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW: SOLID FIXED-DIMENSION TILES (ZERO LAYOUT SHIFT) */
        <div className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 bg-white p-3 rounded border border-slate-300 shadow-2xs min-h-[260px]">
            {mediaList.map((item, idx) => {
              const itemKey = getMediaKey(item, idx);
              const isSelected = selectedIds.has(item._id || item.sql_id || idx);

              return (
                <MediaGridCard
                  key={itemKey}
                  item={item}
                  idx={idx}
                  isSelected={isSelected}
                  bulkMode={bulkMode}
                  onOpenDetails={openMediaDetails}
                  onToggleSelect={toggleSelectId}
                />
              );
            })}

            {/* Smooth Skeleton Placeholders during Loading More to guarantee zero layout shift */}
            {loadingMore &&
              Array.from({ length: 8 }).map((_, sIdx) => (
                <div
                  key={`load-skeleton-${sIdx}`}
                  className="relative aspect-square bg-slate-200/70 rounded border border-slate-300 animate-pulse flex items-center justify-center text-slate-400"
                >
                  <ImageIcon size={18} className="opacity-30" />
                </div>
              ))}
          </div>

          {/* Load More Bar */}
          {mediaList.length < total && (
            <div className="flex flex-col items-center justify-center py-3 gap-1.5 text-xs text-slate-500">
              <span className="font-medium">
                Showing {mediaList.length} of {total.toLocaleString()} media items
              </span>
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-5 py-2 bg-white hover:bg-blue-50 border border-[#2271b1] text-[#2271b1] rounded text-xs font-bold shadow-2xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Loading more media...</span>
                  </>
                ) : (
                  <span>Load more media</span>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-4">
          <div className="bg-white rounded border border-slate-300 shadow-2xs overflow-x-auto min-h-[260px]">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#f6f7f7] text-slate-800 font-semibold border-b border-slate-300">
                <tr>
                  {bulkMode && (
                    <th className="p-2.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === mediaList.length && mediaList.length > 0}
                        onChange={handleSelectAllOnPage}
                        className="rounded text-[#2271b1]"
                      />
                    </th>
                  )}
                  <th className="p-2.5 w-12 text-center">#</th>
                  <th className="p-2.5">File & Title</th>
                  <th className="p-2.5 w-56">Alt Tag</th>
                  <th className="p-2.5">Size</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {mediaList.map((item, idx) => {
                  const fullUrl = getImageUrl(item);
                  const name = item.name || `Asset #${idx + 1}`;
                  const isSelected = selectedIds.has(item._id || item.sql_id || idx);
                  const itemKey = getMediaKey(item, idx);

                  return (
                    <tr
                      key={itemKey}
                      onClick={() => openMediaDetails(item, idx)}
                      className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/80' : ''
                      }`}
                    >
                      {bulkMode && (
                        <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectId(item._id || item.sql_id || idx)}
                            className="rounded text-[#2271b1]"
                          />
                        </td>
                      )}
                      <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-10 rounded bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center shadow-2xs">
                            <img
                              src={fullUrl}
                              alt={name}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                if (!e.currentTarget.dataset.fallback) {
                                  e.currentTarget.dataset.fallback = 'true';
                                  e.currentTarget.src = '/logo.webp';
                                } else {
                                  e.currentTarget.style.display = 'none';
                                }
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#0073aa] hover:underline truncate">
                              {name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              {item.file || ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-2.5">
                        {item.alt ? (
                          <span
                            className="inline-block max-w-[220px] truncate text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                            title={String(item.alt)}
                          >
                            {String(item.alt)}
                          </span>
                        ) : (
                          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px] font-medium flex items-center gap-1 w-fit">
                            <AlertTriangle size={11} /> Missing Alt Tag
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-600 font-mono">{item.size || '100 KB'}</td>
                      <td className="p-2.5 text-slate-500 whitespace-nowrap">
                        {item.created_at || 'Recently'}
                      </td>
                      <td className="p-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openMediaDetails(item, idx)}
                            className="p-1 text-slate-500 hover:text-[#2271b1] hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Edit Details & Alt Tag"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => copyToClipboard(fullUrl, item._id || idx, e)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Copy URL"
                          >
                            {copiedId === (item._id || idx) ? (
                              <Check size={14} className="text-emerald-600" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                          {!isAuthor && (
                            <button
                              type="button"
                              onClick={(e) => openDeleteModal(item, e)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Delete Permanently"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Load More Bar */}
          {mediaList.length < total && (
            <div className="flex flex-col items-center justify-center py-3 gap-1.5 text-xs text-slate-500">
              <span className="font-medium">
                Showing {mediaList.length} of {total.toLocaleString()} media items
              </span>
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-5 py-2 bg-white hover:bg-blue-50 border border-[#2271b1] text-[#2271b1] rounded text-xs font-bold shadow-2xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Loading more media...</span>
                  </>
                ) : (
                  <span>Load more media</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* WORDPRESS-STYLE ATTACHMENT DETAILS & ALT TAG EDITING MODAL */}
      {/* ========================================================================= */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-slate-300 max-w-5xl w-full h-[92vh] max-h-[860px] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Top Header with Prev/Next Navigation */}
            <div className="px-4 py-2.5 bg-[#f6f7f7] border-b border-slate-300 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Attachment Details</span>
                  {selectedIndex !== -1 && (
                    <span className="text-xs font-normal text-slate-500">
                      ({selectedIndex + 1} of {mediaList.length})
                    </span>
                  )}
                </h3>

                {/* Auto-save status feedback */}
                {saveStatus === 'saving' && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium animate-pulse">
                    <Loader2 size={11} className="animate-spin" /> Saving changes...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                    <CheckCircle2 size={11} /> Saved to database
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="inline-flex items-center gap-1 text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-medium border border-rose-200">
                    <AlertTriangle size={11} /> Failed to save
                  </span>
                )}
              </div>

              {/* Navigation & Close Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => navigateMedia(-1)}
                  disabled={mediaList.length <= 1}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors disabled:opacity-30 cursor-pointer"
                  title="Previous image (← Left Arrow)"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => navigateMedia(1)}
                  disabled={mediaList.length <= 1}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors disabled:opacity-30 cursor-pointer"
                  title="Next image (→ Right Arrow)"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="h-4 w-px bg-slate-300 mx-1" />
                <button
                  type="button"
                  onClick={closeMediaDetails}
                  className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Modal Body: Left Preview & Specs + Right Form Fields */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-white">
              {/* Left Column: Media Preview, Action Bar, and Technical Specs */}
              <div className="flex-1 bg-slate-100/70 p-4 sm:p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto custom-scrollbar">
                {/* Image Display */}
                <div className="w-full flex-1 flex items-center justify-center min-h-[220px] max-h-[380px] p-2 bg-white rounded-lg border border-slate-200 shadow-inner">
                  <img
                    src={modalImgError ? '/logo.webp' : getImageUrl(selectedMedia)}
                    alt={formAlt || selectedMedia.name || 'Media preview'}
                    className="max-w-full max-h-[360px] object-contain rounded"
                    onError={() => setModalImgError(true)}
                  />
                </div>

                {/* Quick Action Toolbar underneath preview */}
                <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-3">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={getImageUrl(selectedMedia)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs font-medium text-slate-700 shadow-2xs transition-colors"
                    >
                      <ExternalLink size={12} />
                      <span>Full Size</span>
                    </a>
                    <button
                      type="button"
                      onClick={(e) => handleDownload(selectedMedia, e)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs font-medium text-slate-700 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download size={12} />
                      <span>Download</span>
                    </button>
                  </div>

                  {!isAuthor && (
                    <button
                      type="button"
                      onClick={(e) => openDeleteModal(selectedMedia, e)}
                      className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 hover:underline font-medium cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Delete permanently</span>
                    </button>
                  )}
                </div>

                {/* Technical Metadata Box */}
                <div className="w-full mt-3 p-3 bg-white rounded border border-slate-200 text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-2 shadow-2xs">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">
                      File Name
                    </span>
                    <span
                      className="font-semibold text-slate-800 truncate block"
                      title={selectedMedia.file || selectedMedia.name}
                    >
                      {selectedMedia.file ? selectedMedia.file.split('/').pop() : (selectedMedia.name || 'Untitled')}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">
                      File Type
                    </span>
                    <span className="font-semibold text-slate-800 uppercase">
                      {selectedMedia.type ? selectedMedia.type.replace('.', '') : 'Image'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">
                      File Size
                    </span>
                    <span className="font-semibold text-slate-800">
                      {selectedMedia.size || '180 KB'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">
                      Uploaded On
                    </span>
                    <span className="font-semibold text-slate-800">
                      {selectedMedia.created_at
                        ? String(selectedMedia.created_at).slice(0, 10)
                        : 'September 2026'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Editable Fields (Alt Text, Title, Caption, Description, URL) */}
              <div className="w-full md:w-[380px] lg:w-[420px] p-4 sm:p-5 overflow-y-auto custom-scrollbar flex flex-col justify-between bg-white text-xs">
                <div className="space-y-4">
                  {/* Alternative Text (Alt Text) - High Priority */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>Alternative Text (Alt Tag)</span>
                        <span className="text-[10px] font-bold text-[#2271b1] bg-blue-50 px-1.5 py-0.2 rounded">
                          SEO & Accessibility
                        </span>
                      </label>
                    </div>
                    <textarea
                      rows={2}
                      value={formAlt}
                      readOnly={isAuthor}
                      onChange={(e) => !isAuthor && handleAltChange(e.target.value)}
                      placeholder="Describe the purpose or content of the image..."
                      className={`w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none shadow-2xs resize-none ${
                        isAuthor ? 'bg-slate-50 cursor-not-allowed' : 'bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]'
                      }`}
                    />
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Search engines use this text to understand image contents and index them in Google Images.
                    </p>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Title</label>
                    <input
                      type="text"
                      value={formTitle}
                      readOnly={isAuthor}
                      onChange={(e) => !isAuthor && handleTitleChange(e.target.value)}
                      placeholder="Image Title..."
                      className={`w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none shadow-2xs ${
                        isAuthor ? 'bg-slate-50 cursor-not-allowed' : 'bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]'
                      }`}
                    />
                  </div>

                  {/* Caption */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Caption</label>
                    <textarea
                      rows={2}
                      value={formCaption}
                      readOnly={isAuthor}
                      onChange={(e) => !isAuthor && handleCaptionChange(e.target.value)}
                      placeholder="Optional caption displayed under the image..."
                      className={`w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none shadow-2xs resize-none ${
                        isAuthor ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
                      }`}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      readOnly={isAuthor}
                      onChange={(e) => !isAuthor && handleDescriptionChange(e.target.value)}
                      placeholder="Detailed notes or description..."
                      className={`w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none shadow-2xs resize-none ${
                        isAuthor ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
                      }`}
                    />
                  </div>

                  {/* File URL with Direct Copy */}
                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-semibold text-slate-700 block">File URL</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={getImageUrl(selectedMedia)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-[11px] font-mono text-slate-600 select-all focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={(e) =>
                          copyToClipboard(getImageUrl(selectedMedia), 'modal-url', e)
                        }
                        className="px-3 bg-[#2271b1] hover:bg-[#135e96] text-white rounded text-xs font-semibold flex items-center justify-center shrink-0 shadow-2xs transition-colors cursor-pointer"
                      >
                        {copiedId === 'modal-url' ? (
                          <span className="inline-flex items-center gap-1">
                            <Check size={13} />
                            <span>Copied</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Copy size={13} />
                            <span>Copy</span>
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer with Manual Save Changes Button */}
                <div className="border-t border-slate-200 pt-4 mt-4 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    {isAuthor ? 'Read-Only (Author View)' : 'Changes auto-save automatically.'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={closeMediaDetails}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    {!isAuthor && (
                      <button
                        type="button"
                        onClick={handleManualSave}
                        disabled={saveStatus === 'saving'}
                        className="px-4 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {saveStatus === 'saving' ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : saveStatus === 'saved' ? (
                          <>
                            <Check size={13} />
                            <span>Saved!</span>
                          </>
                        ) : (
                          <span>Save Changes</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Reusable Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        isLoading={deleteModal.isLoading}
        itemName={deleteModal.item ? (deleteModal.item.name || deleteModal.item.file) : deleteModal.isBulk ? `${selectedIds.size} media files` : ''}
        type="danger"
        title={deleteModal.isBulk ? 'Permanently Delete Selected Media?' : 'Permanently Delete Media?'}
        description={
          deleteModal.isBulk
            ? `Are you sure you want to permanently delete ${selectedIds.size} media files? This action cannot be undone.`
            : `Are you sure you want to permanently delete "${deleteModal.item?.name || 'this media file'}"? This action cannot be undone.`
        }
        confirmText="Delete Media"
        onConfirm={handleConfirmDelete}
        onClose={() =>
          setDeleteModal({ isOpen: false, item: null, isBulk: false, isLoading: false })
        }
      />
    </div>
  );
}
