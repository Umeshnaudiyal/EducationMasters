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

function parseToastParams(type, arg1, arg2) {
  const defaultTitles = {
    success: 'Success!',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
  };

  let config = {
    type,
    title: defaultTitles[type] || 'Notification',
    message: '',
  };

  if (typeof arg1 === 'object' && arg1 !== null) {
    config = { ...config, ...arg1, type: arg1.type || type };
  } else if (typeof arg1 === 'string' && typeof arg2 === 'string') {
    // Determine which is title and which is message
    if (arg1.length <= 40 && arg2.length > arg1.length) {
      config.title = arg1;
      config.message = arg2;
    } else {
      config.title = arg2;
      config.message = arg1;
    }
  } else if (typeof arg1 === 'string') {
    config.message = arg1;
    if (typeof arg2 === 'object' && arg2 !== null) {
      config = { ...config, ...arg2 };
      if (arg2.title) config.title = arg2.title;
    }
  }

  return config;
}

// Singleton emitter for direct toast.success() imports anywhere
let globalToastEmitter = null;

export const toast = {
  success: (arg1, arg2) => {
    if (globalToastEmitter) {
      return globalToastEmitter(parseToastParams('success', arg1, arg2));
    }
  },
  error: (arg1, arg2) => {
    if (globalToastEmitter) {
      return globalToastEmitter(parseToastParams('error', arg1, arg2));
    }
  },
  info: (arg1, arg2) => {
    if (globalToastEmitter) {
      return globalToastEmitter(parseToastParams('info', arg1, arg2));
    }
  },
  warning: (arg1, arg2) => {
    if (globalToastEmitter) {
      return globalToastEmitter(parseToastParams('warning', arg1, arg2));
    }
  },
  show: (toastData) => {
    if (globalToastEmitter) {
      return globalToastEmitter(toastData);
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
    const parsed = typeof toastData === 'string' 
      ? { type: 'success', title: 'Success!', message: toastData }
      : toastData;

    const newToast = {
      id,
      type: parsed.type || 'success',
      title: parsed.title || (parsed.type === 'error' ? 'Something went wrong' : 'Success!'),
      message: parsed.message || '',
      duration: parsed.duration ?? 5000,
      icon: parsed.icon,
      emoji: parsed.emoji,
      badge: parsed.badge,
      action: parsed.action,
      timestamp: Date.now(),
      ...parsed,
    };

    setToasts((prev) => [...prev.slice(-2), newToast]);
    return id;
  }, []);

  // Set global emitter reference
  globalToastEmitter = showToast;

  const success = useCallback((arg1, arg2) => {
    return showToast(parseToastParams('success', arg1, arg2));
  }, [showToast]);

  const error = useCallback((arg1, arg2) => {
    return showToast(parseToastParams('error', arg1, arg2));
  }, [showToast]);

  const info = useCallback((arg1, arg2) => {
    return showToast(parseToastParams('info', arg1, arg2));
  }, [showToast]);

  const warning = useCallback((arg1, arg2) => {
    return showToast(parseToastParams('warning', arg1, arg2));
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
