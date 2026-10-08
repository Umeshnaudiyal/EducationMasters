'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { ToastProvider } from '@/context/ToastContext';
import { StickyNotesProvider } from '@/context/StickyNotesContext';
import AuthModal from '@/components/auth/AuthModal';
import StickyNotesDrawer from '@/components/sticky-notes/StickyNotesDrawer';
import FloatingStickyNote from '@/components/sticky-notes/FloatingStickyNote';

export default function Providers({ children }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <ToastProvider>
        <AuthModalProvider>
          <StickyNotesProvider>
            {children}
            <AuthModal />
            <StickyNotesDrawer />
            <FloatingStickyNote />
          </StickyNotesProvider>
        </AuthModalProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
