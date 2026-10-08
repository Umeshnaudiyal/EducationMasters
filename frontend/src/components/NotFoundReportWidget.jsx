'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Send,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageSquare,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { fireConfetti } from '@/utils/confetti';

export default function NotFoundReportWidget() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleCopyUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    fireConfetti();
  };

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mb-8">
      
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/70 to-slate-50 rounded-2xl p-6 sm:p-8 border border-blue-200/80 shadow-sm relative overflow-hidden">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Left Info */}
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-md border border-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Looking for a Specific Exam Notice?</span>
            </div>
            <h4 className="text-lg sm:text-xl font-black text-slate-900">
              Were you expecting an official notice or PDF here?
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              If an official notification, answer key, or admit card link was broken, let our exam editorial team know and we will fix it immediately.
            </p>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            
            {/* Copy Current URL */}
            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs transition cursor-pointer"
            >
              {isCopied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy Broken URL</span>
                </>
              )}
            </button>

            {/* Quick Report Button */}
            {!showInput && !isSubmitted && (
              <button
                type="button"
                onClick={() => setShowInput(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Report Missing Page</span>
              </button>
            )}

            {/* Join Telegram for Live Alerts */}
            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-200 transition"
            >
              <span>Telegram Alerts</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

          </div>

        </div>

        {/* Input box toggle */}
        {showInput && !isSubmitted && (
          <form onSubmit={handleSubmit} className="mt-5 pt-4 border-t border-blue-200/60 animate-fadeIn">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="E.g. I was looking for SSC CGL 2026 Tier-1 City Slip link..."
                className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                <span>Submit Report</span>
              </button>
            </div>
          </form>
        )}

        {/* Success confirmation */}
        {isSubmitted && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Thank you! Our editorial team has received your report and is reviewing this route.</span>
          </div>
        )}

      </div>

    </section>
  );
}
