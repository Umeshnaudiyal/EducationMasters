'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import UniversalToast from '@/components/UniversalToast';

const ToastContext = createContext({
  toasts: [],
  showToast: () => {},
  removeToast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
});

// Singleton emitter for direct toast.success() imports anywhere
let globalToastEmitter = null;

export const toast = {
  success: (message, options = {}) => {
    if (globalToastEmitter) {
      return globalToastEmitter({
        type: 'success',
        message,
        title: typeof options === 'string' ? options : options.title || 'Success!',
        ...((typeof options === 'object') ? options : {}),
      });
    }
  },
  error: (message, options = {}) => {
    if (globalToastEmitter) {
      return globalToastEmitter({
        type: 'error',
        message,
        title: typeof options === 'string' ? options : options.title || 'Error',
        ...((typeof options === 'object') ? options : {}),
      });
    }
  },
  info: (message, options = {}) => {
    if (globalToastEmitter) {
      return globalToastEmitter({
        type: 'info',
        message,
        title: typeof options === 'string' ? options : options.title || 'Information',
        ...((typeof options === 'object') ? options : {}),
      });
    }
  },
  warning: (message, options = {}) => {
    if (globalToastEmitter) {
      return globalToastEmitter({
        type: 'warning',
        message,
        title: typeof options === 'string' ? options : options.title || 'Warning',
        ...((typeof options === 'object') ? options : {}),
      });
    }
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toastData) => {
    const id = `toast_${Date.now()}_${++counterRef.current}`;
    const newToast = {
      id,
      type: toastData.type || 'success',
      title: toastData.title || (toastData.type === 'error' ? 'Something went wrong' : 'Success!'),
      message: typeof toastData === 'string' ? toastData : toastData.message || '',
      duration: toastData.duration ?? 5000,
      icon: toastData.icon,
      timestamp: Date.now(),
      ...toastData,
    };

    setToasts([newToast]); // Show only 1 toast at a time
    return id;
  }, []);

  // Set global emitter reference
  globalToastEmitter = showToast;

  const success = useCallback((message, options = {}) => {
    return showToast({
      type: 'success',
      message,
      title: typeof options === 'string' ? options : options.title || 'Success!',
      ...(typeof options === 'object' ? options : {}),
    });
  }, [showToast]);

  const error = useCallback((message, options = {}) => {
    return showToast({
      type: 'error',
      message,
      title: typeof options === 'string' ? options : options.title || 'Error',
      ...(typeof options === 'object' ? options : {}),
    });
  }, [showToast]);

  const info = useCallback((message, options = {}) => {
    return showToast({
      type: 'info',
      message,
      title: typeof options === 'string' ? options : options.title || 'Information',
      ...(typeof options === 'object' ? options : {}),
    });
  }, [showToast]);

  const warning = useCallback((message, options = {}) => {
    return showToast({
      type: 'warning',
      message,
      title: typeof options === 'string' ? options : options.title || 'Warning',
      ...(typeof options === 'object' ? options : {}),
    });
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        success,
        error,
        info,
        warning,
      }}
    >
      {children}
      <UniversalToast toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
