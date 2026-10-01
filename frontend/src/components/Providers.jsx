'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { ToastProvider } from '@/context/ToastContext';
import AuthModal from '@/components/auth/AuthModal';

export default function Providers({ children }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <ToastProvider>
        <AuthModalProvider>
          {children}
          <AuthModal />
        </AuthModalProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
