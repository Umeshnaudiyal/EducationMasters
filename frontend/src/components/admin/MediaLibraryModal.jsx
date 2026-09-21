'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  X,
  Check,
  Search,
  Copy,
  CheckCheck,
  Trash2,
  Image as ImageIcon,
  FileText,
  Loader2,
} from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import AdminLoader from '@/components/admin/AdminLoader';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export default function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  targetType = 'editor', // 'editor' | 'featured'
}) {
  const [activeTab, setActiveTab] = useState('library'); // 'upload' | 'library'
  const [mediaList, setMediaList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Attachment Details Form State
  const [altText, setAltText] = useState('');
  const [titleText, setTitleText] = useState('');
  const [captionText, setCaptionText] = useState('');
  const [descText, setDescText] = useState('');
  const [copied, setCopied] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    item: null,
    isLoading: false,
  });

  // Drag and Drop state
  const [isDragging, setIsDragging] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Fetch Media List
  const fetchMedia = async (pageNum = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const queryParams = new URLSearchParams({
        page: pageNum,
        limit: 70,
        search: search.trim(),
        type: typeFilter !== 'all' ? typeFilter : '',
        date: dateFilter !== 'all' ? dateFilter : '',
      });

      const res = await fetch(`${BACKEND_URL}/apis/v1/media?${queryParams}`);
      const data = await res.json();

      if (data.success && data.data) {
        if (append) {
          setMediaList((prev) => [...prev, ...(data.data || [])]);
        } else {
          setMediaList(data.data || []);
          if (data.data.length > 0 && !selectedMedia) {
            handleSelect(data.data[0]);
          }
        }
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch media:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia(1, false);
      setPage(1);
    }
  }, [isOpen, search, typeFilter, dateFilter]);

  const handleSelect = (mediaItem) => {
    setSelectedMedia(mediaItem);
    setAltText(mediaItem.alt || mediaItem.name || '');
    setTitleText(mediaItem.name || '');
    setCaptionText(mediaItem.caption || '');
    setDescText(mediaItem.description || '');
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMedia(nextPage, true);
  };

  // Debounced auto-save attachment metadata to backend
  const triggerSaveMetadata = (updatedFields) => {
    if (!selectedMedia?._id) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSavingDetails(true);
        await fetch(`${BACKEND_URL}/apis/v1/media/${selectedMedia._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields),
        });
      } catch (err) {
        console.error('Failed to auto-save media details:', err);
      } finally {
        setSavingDetails(false);
      }
    }, 600);
  };

  const handleAltChange = (val) => {
    setAltText(val);
    triggerSaveMetadata({ alt: val });
  };

  const handleTitleChange = (val) => {
    setTitleText(val);
    triggerSaveMetadata({ name: val });
  };

  const handleCaptionChange = (val) => {
    setCaptionText(val);
    triggerSaveMetadata({ caption: val });
  };

  const handleDescChange = (val) => {
    setDescText(val);
    triggerSaveMetadata({ description: val });
  };

  // Upload Logic
  const processFiles = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    let lastUploaded = null;

    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await fetch(`${BACKEND_URL}/apis/v1/media/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.data) {
          lastUploaded = data.data;
          setMediaList((prev) => [data.data, ...prev]);
          setTotal((prev) => prev + 1);
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }

    setUploading(false);
    if (lastUploaded) {
      handleSelect(lastUploaded);
      setActiveTab('library');
    }
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    processFiles(files);
  };

  // Delete Media
  const openDeleteModal = (media) => {
    const item = media || selectedMedia;
    if (!item) return;
    setDeleteModal({
      isOpen: true,
      item,
      isLoading: false,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.item) return;
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));
    try {
      const deleteId = deleteModal.item._id || deleteModal.item.sql_id;
      await fetch(`${BACKEND_URL}/apis/v1/media/${deleteId}`, {
        method: 'DELETE',
      });
      setMediaList((prev) => prev.filter((m) => (m._id || m.sql_id) !== deleteId));
      setTotal((prev) => Math.max(0, prev - 1));
      if (selectedMedia && (selectedMedia._id || selectedMedia.sql_id) === deleteId) {
        setSelectedMedia(null);
      }
      setDeleteModal({ isOpen: false, item: null, isLoading: false });
    } catch (err) {
      console.error(err);
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Copy URL
  const handleCopyUrl = () => {
    if (!selectedMedia) return;
    const url = getImageUrl(selectedMedia);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Submit / Insert Selection
  const handleInsert = () => {
    if (!selectedMedia) return;
    if (onSelect) {
      onSelect({
        ...selectedMedia,
        alt: altText || selectedMedia.alt,
        caption: captionText || selectedMedia.caption,
        name: titleText || selectedMedia.name,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  const fullUrl = selectedMedia ? getImageUrl(selectedMedia) : '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 select-none font-sans text-slate-800 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-300 rounded shadow-2xl w-full max-w-6xl h-[92vh] max-h-[850px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Top Header: Title & WP Close Button */}
        <div className="px-4 py-2 bg-[#fcfcfc] border-b border-slate-300 flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{targetType === 'featured' ? 'Featured Image' : 'Media Library'}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 p-1 rounded transition-colors text-lg font-bold leading-none cursor-pointer"
            title="Close"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex items-center border-b border-slate-300 px-4 pt-1 gap-6 text-xs font-semibold text-slate-600 bg-[#f6f7f7] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-2 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'text-[#2271b1] border-b-2 border-[#2271b1] font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Upload files
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`pb-2 transition-colors cursor-pointer ${
              activeTab === 'library'
                ? 'text-[#2271b1] border-b-2 border-[#2271b1] font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Media Library
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
          {activeTab === 'upload' ? (
            /* Upload Files Tab (Drag & Drop Zone) */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex-1 flex flex-col items-center justify-center p-8 transition-colors ${
                isDragging ? 'bg-blue-50/70 border-2 border-dashed border-[#2271b1]' : 'bg-[#fcfcfc]'
              }`}
            >
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 max-w-lg w-full text-center bg-white shadow-2xs hover:border-[#2271b1] transition-colors">
                <Upload size={44} className="mx-auto text-slate-400 mb-3" />
                <h3 className="text-base font-semibold text-slate-800 mb-1">
                  Drop files anywhere to upload
                </h3>
                <p className="text-xs text-slate-500 mb-4">or</p>
                <label className="inline-flex items-center gap-2 px-5 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-bold rounded cursor-pointer transition-colors shadow-2xs active:scale-95">
                  {uploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Uploading Media...</span>
                    </>
                  ) : (
                    <span>Select Files</span>
                  )}
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    multiple
                    onChange={handleFileInputChange}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-4">
                  Maximum upload file size: 50 MB.
                </p>
              </div>
            </div>
          ) : (
            /* Media Library Tab */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Filter Toolbar matching Screenshot */}
              <div className="px-4 py-2 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white shrink-0">
                {/* Left Dropdown Filters */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-600 font-medium">Filter media:</span>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:border-[#2271b1] shadow-2xs"
                    >
                      <option value="all">All media items</option>
                      <option value="image">Images</option>
                      <option value="document">Documents</option>
                    </select>
                  </div>

                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:border-[#2271b1] shadow-2xs"
                  >
                    <option value="all">All dates</option>
                    <option value="2026/09">September 2026</option>
                    <option value="2026/08">August 2026</option>
                    <option value="2026/07">July 2026</option>
                    <option value="2026/06">June 2026</option>
                    <option value="2026">Year 2026</option>
                    <option value="2025">Year 2025</option>
                    <option value="2024">Year 2024</option>
                    <option value="2023">Year 2023</option>
                  </select>
                </div>

                {/* Right Search Input Box */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                  <span className="text-xs text-slate-600 font-medium">Search</span>
                  <div className="relative">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder=""
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] w-48 sm:w-56 shadow-2xs"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Split Body: Left Grid + Right Details Panel */}
              <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
                {/* Left Side: Media Grid */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#f0f0f1]">
                  {loading && mediaList.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <AdminLoader text="Loading Media Library..." subtext="Accessing 12,000+ media assets" minHeight="min-h-[250px]" />
                    </div>
                  ) : mediaList.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs gap-1">
                      <ImageIcon size={32} className="text-slate-300 mb-1" />
                      <span className="font-semibold">No media items found</span>
                      <span className="text-[11px] text-slate-400">Try adjusting your search or filters</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Grid of Square Thumbnails */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5">
                        {mediaList.map((m) => {
                          const isSelected = selectedMedia?._id === m._id;
                          const mediaUrl = getImageUrl(m);

                          return (
                            <div
                              key={m._id}
                              onClick={() => handleSelect(m)}
                              className={`relative aspect-square bg-white rounded border overflow-hidden cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-[#2271b1] ring-3 ring-[#2271b1] shadow-md z-10'
                                  : 'border-slate-300 hover:border-slate-400 hover:shadow-xs'
                              }`}
                            >
                              <img
                                src={mediaUrl}
                                alt={m.name || 'media'}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                                onError={(e) => {
                                  if (!e.currentTarget.dataset.fallback) {
                                    e.currentTarget.dataset.fallback = 'true';
                                    e.currentTarget.src = '/logo.webp';
                                  } else {
                                    e.currentTarget.style.display = 'none';
                                  }
                                }}
                              />
                              {/* Selected Checkmark Badge matching WordPress screenshot */}
                              {isSelected && (
                                <div className="absolute top-0 right-0 w-5 h-5 bg-[#2271b1] text-white flex items-center justify-center shadow-xs">
                                  <Check size={13} strokeWidth={3.5} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination Status & Load More Button */}
                      <div className="flex flex-col items-center justify-center pt-2 pb-4 gap-2 text-xs text-slate-600">
                        <span className="font-medium">
                          Showing {mediaList.length} of {total.toLocaleString()} media items
                        </span>
                        {mediaList.length < total && (
                          <button
                            type="button"
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="px-5 py-1.5 bg-white hover:bg-[#2271b1] hover:text-white border border-[#2271b1] text-[#2271b1] rounded text-xs font-bold shadow-2xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            {loadingMore ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Loading more...</span>
                              </>
                            ) : (
                              <span>Load more</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Attachment Details Panel (Matching User Screenshot) */}
                {selectedMedia && (
                  <div className="w-72 sm:w-80 border-l border-slate-300 bg-[#f6f7f7] p-3.5 overflow-y-auto custom-scrollbar text-xs text-slate-700 shrink-0 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <h4 className="font-bold uppercase text-slate-500 text-[10px] tracking-wider">
                        Attachment Details
                      </h4>
                      {savingDetails && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Loader2 size={10} className="animate-spin" /> Saving...
                        </span>
                      )}
                    </div>

                    {/* Preview Thumbnail + Metadata */}
                    <div className="flex gap-2.5">
                      <div className="w-20 h-16 rounded bg-white border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                        <img
                          src={fullUrl}
                          alt="Preview"
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
                      <div className="space-y-0.5 text-[11px] min-w-0 flex-1">
                        <p className="font-bold text-slate-900 truncate" title={selectedMedia.name}>
                          {selectedMedia.name}
                        </p>
                        <p className="text-slate-400">{selectedMedia.created_at || 'Recently added'}</p>
                        <p className="text-slate-500">{selectedMedia.size || '198.00 KB'}</p>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(selectedMedia)}
                          className="text-rose-600 hover:text-rose-800 hover:underline text-[11px] font-medium pt-0.5 block cursor-pointer"
                        >
                          Delete permanently
                        </button>
                      </div>
                    </div>

                    {/* Form Fields: Alt Text, Title, Caption, Description, File URL */}
                    <div className="border-t border-slate-200 pt-3 space-y-3">
                      {/* Alt Text */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Alt Text
                        </label>
                        <input
                          type="text"
                          value={altText}
                          onChange={(e) => handleAltChange(e.target.value)}
                          className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] shadow-2xs"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Learn how to describe the purpose of the image
                        </p>
                      </div>

                      {/* Title */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Title
                        </label>
                        <input
                          type="text"
                          value={titleText}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] shadow-2xs"
                        />
                      </div>

                      {/* Caption */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Caption
                        </label>
                        <textarea
                          rows={2}
                          value={captionText}
                          onChange={(e) => handleCaptionChange(e.target.value)}
                          className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] shadow-2xs resize-none"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={descText}
                          onChange={(e) => handleDescChange(e.target.value)}
                          className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] shadow-2xs resize-none"
                        />
                      </div>

                      {/* File URL with Copy to Clipboard */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          File URL:
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            readOnly
                            value={fullUrl}
                            className="w-full px-2 py-1 bg-slate-100 border border-slate-300 rounded text-[11px] text-slate-600 font-mono select-all focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleCopyUrl}
                            title="Copy URL"
                            className="px-2.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-slate-600 flex items-center justify-center shrink-0 shadow-2xs cursor-pointer"
                          >
                            {copied ? (
                              <CheckCheck size={14} className="text-emerald-600" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="px-4 py-2.5 bg-[#f6f7f7] border-t border-slate-300 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600">
            {selectedMedia ? (
              <span>
                Selected: <strong className="text-slate-900">{selectedMedia.name}</strong>
              </span>
            ) : (
              <span className="text-slate-400">No image selected</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-medium transition-colors shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInsert}
              disabled={!selectedMedia}
              className="px-4 py-1.5 bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-40 text-white rounded text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:cursor-not-allowed"
            >
              {targetType === 'featured' ? 'Set Featured Image' : 'Insert into Post'}
            </button>
          </div>
        </div>
      </div>

      {/* Reusable Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        isLoading={deleteModal.isLoading}
        itemName={deleteModal.item?.name || ''}
        type="danger"
        title="Permanently Delete Media?"
        description="Are you sure you want to delete this media permanently from the database? This cannot be undone."
        confirmText="Delete Media"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModal({ isOpen: false, item: null, isLoading: false })}
      />
    </div>
  );
}
