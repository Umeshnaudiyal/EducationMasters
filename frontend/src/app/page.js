'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import LiveTicker from '@/components/LiveTicker';
import HeroSection from '@/components/HeroSection';
import CategoriesSection from '@/components/CategoriesSection';
import LiveUpdatesFeed from '@/components/LiveUpdatesFeed';
import Footer from '@/components/Footer';
import { TypingTestModal, MockTestModal } from '@/components/Modals';

export default function Home() {
  const [isTypingModalOpen, setIsTypingModalOpen] = useState(false);
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 1. Glass Nav Header with Predictive Search */}
      <Header 
        onOpenMockModal={() => setIsMockModalOpen(true)}
      />

      {/* 2. Live Announcement Ticker */}
      <LiveTicker />

      {/* 3. Main Content Sections */}
      <main className="flex-1">
        
        {/* Hero section */}
        <HeroSection />

        {/* Popular Categories Grid */}
        <CategoriesSection />

        {/* Leaderboard Ad + Latest Sarkari Naukri + Subject MCQs */}
        <LiveUpdatesFeed />

      </main>

      {/* 4. Footer */}
      <Footer />

      {/* 5. Modals */}
      <TypingTestModal 
        isOpen={isTypingModalOpen} 
        onClose={() => setIsTypingModalOpen(false)} 
      />

      <MockTestModal 
        isOpen={isMockModalOpen} 
        onClose={() => setIsMockModalOpen(false)} 
      />

    </div>
  );
}
