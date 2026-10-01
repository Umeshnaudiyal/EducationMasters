'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

const AuthModalContext = createContext({
  isAuthModalOpen: false,
  authModalMode: 'register',
  modalOptions: {},
  openAuthModal: () => {},
  closeAuthModal: () => {},
  setAuthModalMode: () => {},
});

export function AuthModalProvider({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('register'); // 'register' | 'login'
  const [modalOptions, setModalOptions] = useState({});
  const autoOpenTimerRef = useRef(null);

  const openAuthModal = useCallback((options = {}) => {
    const mode = options.mode || 'register';
    setAuthModalMode(mode);
    setModalOptions(options);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback((force = false) => {
    if (modalOptions?.preventClose && !force) {
      return; // Do not dismiss if locked/mandatory unless explicitly forced on login/registration success
    }
    setIsAuthModalOpen(false);
    setModalOptions({});
    try {
      sessionStorage.setItem('em_auth_popup_closed', 'true');
    } catch (e) {}
  }, [modalOptions]);

  // Professional Auto-trigger popup on homepage / public pages after 3.5 seconds
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Do not auto-trigger if user is already logged in or on admin/login page
    const isAdminPath = pathname?.startsWith('/edu-admin') || pathname === '/edu-login';
    const isAlreadyClosed = sessionStorage.getItem('em_auth_popup_closed') === 'true';

    if (!session?.user && status === 'unauthenticated' && !isAdminPath && !isAlreadyClosed) {
      autoOpenTimerRef.current = setTimeout(() => {
        // Double check session
        if (!session?.user && !sessionStorage.getItem('em_auth_popup_closed')) {
          openAuthModal({ mode: 'register' });
        }
      }, 3500);
    }

    return () => {
      if (autoOpenTimerRef.current) {
        clearTimeout(autoOpenTimerRef.current);
      }
    };
  }, [session, status, pathname, openAuthModal]);

  return (
    <AuthModalContext.Provider
      value={{
        isAuthModalOpen,
        authModalMode,
        modalOptions,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}
