'use client';

import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Move to Trash?',
  description = 'Are you sure you want to proceed with this action? This item will be moved to trash and can be restored later.',
  itemName = '',
  confirmText = 'Move to Trash',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning'
  isLoading = false,
}) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={() => {
          if (!isLoading) onClose();
        }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 fade-in duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="p-6">
          {/* Header Icon + Titles */}
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-full shrink-0 border ring-4 ${
                type === 'danger'
                  ? 'bg-rose-50 border-rose-200 text-rose-600 ring-rose-500/10'
                  : 'bg-amber-50 border-amber-200 text-amber-600 ring-amber-500/10'
              }`}
            >
              {type === 'danger' ? (
                <Trash2 size={22} className="stroke-[2.2]" />
              ) : (
                <AlertTriangle size={22} className="stroke-[2.2]" />
              )}
            </div>

            <div className="space-y-1 pr-4">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {/* Item Name Preview Card */}
          {itemName && (
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Target Item:
              </span>
              <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                {itemName}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-98 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 ${
                type === 'danger'
                  ? 'bg-[#dc3232] hover:bg-[#b32d2e] focus:ring-2 focus:ring-rose-500/40'
                  : 'bg-amber-600 hover:bg-amber-700 focus:ring-2 focus:ring-amber-500/40'
              }`}
            >
              {isLoading && <Loader2 size={13} className="animate-spin" />}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
