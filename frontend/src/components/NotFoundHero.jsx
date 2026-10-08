'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Home,
  ArrowLeft,
  GraduationCap,
  Briefcase,
  FileText,
  Award,
  Sparkles,
} from 'lucide-react';

export default function NotFoundHero() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="edu-404-wrapper">
      <style>{`
        @keyframes floatGentle {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .edu-404-wrapper {
          min-height: 100vh;
          width: 100%;
          background: radial-gradient(circle at 10% 20%, rgba(219, 234, 254, 0.7) 0%, transparent 45%),
                      radial-gradient(circle at 90% 80%, rgba(224, 231, 255, 0.6) 0%, transparent 45%),
                      #f0f6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          font-family: inherit;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }

        /* Ambient soft blurs */
        .edu-ambient-orb-1 {
          position: absolute;
          top: -100px;
          left: -80px;
          width: 400px;
          height: 400px;
          background: rgba(191, 219, 254, 0.45);
          filter: blur(80px);
          border-radius: 50%;
          pointer-events: none;
        }

        .edu-ambient-orb-2 {
          position: absolute;
          bottom: -100px;
          right: -80px;
          width: 420px;
          height: 420px;
          background: rgba(224, 231, 255, 0.5);
          filter: blur(90px);
          border-radius: 50%;
          pointer-events: none;
        }

        .edu-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 560px;
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid rgba(226, 232, 240, 0.85);
          box-shadow:
            0 10px 15px -3px rgba(15, 23, 42, 0.04),
            0 25px 40px -12px rgba(30, 58, 138, 0.09),
            0 0 0 1px rgba(255, 255, 255, 0.9) inset;
          padding: 40px 36px 32px;
          text-align: center;
          box-sizing: border-box;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        @media (max-width: 640px) {
          .edu-card {
            padding: 32px 20px 26px;
            border-radius: 20px;
          }
        }

        /* Brand Header */
        .edu-brand {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
          text-decoration: none;
        }

        .edu-brand-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #0b66c3;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(11, 102, 195, 0.28);
          flex-shrink: 0;
        }

        .edu-brand-name {
          font-size: 19px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        /* Mascot / 404 Visual */
        .edu-illustration-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        .edu-mascot-img {
          width: 230px;
          max-width: 78%;
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 14px 22px rgba(30, 58, 138, 0.12));
          animation: floatGentle 4s ease-in-out infinite;
          user-select: none;
        }

        /* Title & Copy */
        .edu-title {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 10px 0;
          letter-spacing: -0.02em;
        }

        .edu-desc {
          font-size: 13.5px;
          line-height: 1.62;
          color: #64748b;
          max-width: 440px;
          margin: 0 auto 26px auto;
          font-weight: 450;
        }

        /* Action Buttons */
        .edu-btn-group {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .edu-primary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #0b66c3;
          color: #ffffff;
          padding: 12px 26px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 6px 18px rgba(11, 102, 195, 0.32);
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }

        .edu-primary-btn:hover {
          background: #0954a5;
          transform: translateY(-1.5px);
          box-shadow: 0 8px 24px rgba(11, 102, 195, 0.42);
        }

        .edu-primary-btn:active {
          transform: translateY(0px);
        }

        .edu-secondary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #ffffff;
          color: #334155;
          padding: 11px 20px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
          border: 1px solid #cbd5e1;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .edu-secondary-btn:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          color: #0f172a;
          transform: translateY(-1.5px);
        }

        /* Quick Links */
        .edu-quick-links {
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .edu-quick-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 9999px;
          font-size: 11.5px;
          font-weight: 600;
          color: #475569;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .edu-quick-link:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #0b66c3;
        }

        /* Footer */
        .edu-footer {
          margin-top: 24px;
          font-size: 11.5px;
          color: #94a3b8;
          font-weight: 500;
          letter-spacing: 0.01em;
        }
      `}</style>

      {/* Ambient background glows */}
      <div className="edu-ambient-orb-1" />
      <div className="edu-ambient-orb-2" />

      {/* Centered Clean 404 Card */}
      <div className="edu-card">
        {/* Brand Header */}
        <Link href="/" className="edu-brand">
          <div className="edu-brand-icon">
            <GraduationCap size={20} color="#ffffff" strokeWidth={2.2} />
          </div>
          <span className="edu-brand-name">Education Masters</span>
        </Link>

        {/* 3D Mascot & 404 Artwork */}
        <div className="edu-illustration-wrap">
          <img
            src="/404-mascot.png"
            alt="404 Page Not Found"
            className="edu-mascot-img"
          />
        </div>

        {/* Heading & Subtitle */}
        <h1 className="edu-title">We couldn’t find this page</h1>
        <p className="edu-desc">
          Looks like the page you’re searching for doesn’t exist or has been
          moved. Don’t worry! Education Masters is here to help you prepare
          for exams, check results, and practice mock tests seamlessly.
        </p>

        {/* Action Buttons */}
        <div className="edu-btn-group">
          <Link href="/" className="edu-primary-btn">
            <Home size={16} strokeWidth={2.4} />
            <span>Back to Home</span>
          </Link>
          <button type="button" onClick={handleBack} className="edu-secondary-btn">
            <ArrowLeft size={16} strokeWidth={2.4} />
            <span>Previous Page</span>
          </button>
        </div>

        {/* Popular Category Shortcuts */}
        <div className="edu-quick-links">
          <Link href="/jobs" className="edu-quick-link">
            <Briefcase size={12} className="text-blue-600" />
            <span>Govt Jobs</span>
          </Link>
          <Link href="/admit-cards" className="edu-quick-link">
            <FileText size={12} className="text-cyan-600" />
            <span>Admit Cards</span>
          </Link>
          <Link href="/results" className="edu-quick-link">
            <Award size={12} className="text-emerald-600" />
            <span>Results</span>
          </Link>
          <Link href="/mock-tests" className="edu-quick-link">
            <Sparkles size={12} className="text-purple-600" />
            <span>Mock Tests</span>
          </Link>
        </div>

        {/* Footer */}
        <div className="edu-footer">
          Education Masters — © {new Date().getFullYear()} All Rights Reserved
        </div>
      </div>
    </div>
  );
}
