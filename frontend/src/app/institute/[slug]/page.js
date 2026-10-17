'use client';

import React, { useState, useEffect, use, useRef, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdPlaceholder from '@/components/AdPlaceholder';
import {
  Phone,
  MapPin,
  Star,
  Share2,
  ExternalLink,
  CheckCircle2,
  Wifi,
  Zap,
  Camera,
  Utensils,
  Dumbbell,
  Snowflake,
  Shirt,
  Shield,
  BookOpen,
  Tv,
  Car,
  Flame,
  Droplets,
  Wind,
  BedDouble,
  Coffee,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Banknote,
  Building2,
  Smartphone,
  Clock,
  Globe,
  Mail,
  User,
  X,
  Calendar,
  Sparkles,
  School,
  ArrowRight,
  Award,
  MessageSquarePlus,
  Video,
  ChevronLeft,
  ChevronRight,
  Images
} from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import { getApiBaseUrl } from '@/utils/api';

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const WhatsAppIcon = ({ size = 18, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const getDaySchedule = (hoursObj, day) => {
  if (!hoursObj) return { enabled: true, time: "08:30 AM – 08:30 PM" };
  const dayData = hoursObj[day];
  if (typeof dayData === "string") {
    return { enabled: !dayData.toLowerCase().includes("closed"), time: dayData };
  }
  if (dayData && typeof dayData === "object") {
    if (dayData.enabled === false) return { enabled: false, time: "Closed" };
    if (dayData.open24h) return { enabled: true, time: "Open 24 Hours" };
    if (dayData.from && dayData.to) return { enabled: true, time: `${dayData.from} – ${dayData.to}` };
  }
  return { enabled: true, time: "08:30 AM – 08:30 PM" };
};

/* ================= BUSINESS HOURS TOGGLE ================= */
const BusinessHoursToggle = ({ openingHours }) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todaySchedule = getDaySchedule(openingHours, todayName);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  return (
    <div
      className="relative block w-full text-left"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between gap-2 text-xs md:text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors py-2 px-3 bg-white border border-gray-300 rounded-md cursor-pointer shadow-2xs w-full"
      >
        <span className="flex items-center gap-1.5">
          <Clock size={15} className="text-gray-600 flex-shrink-0" />
          <span className="font-bold text-gray-900">Operating Hours:</span>
          <span className={todaySchedule.enabled ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
            {todaySchedule.enabled ? "Open" : "Closed"}
          </span>
        </span>
        {isOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-2xl p-3 z-50 text-xs space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="font-bold text-gray-900 border-b border-gray-100 pb-1 flex justify-between items-center">
            <span>Weekly Schedule</span>
            <span className="text-[10px] text-gray-400 font-normal">Today: {todayName}</span>
          </div>
          <div className="space-y-1 pt-1">
            {DAYS.map((day) => {
              const sched = getDaySchedule(openingHours, day);
              const isToday = day === todayName;
              return (
                <div
                  key={day}
                  className={`flex justify-between items-center py-1 px-1.5 rounded ${isToday ? "bg-emerald-50 text-emerald-900 font-bold" : "text-gray-600"
                    }`}
                >
                  <span className="flex items-center gap-1.5">
                    {isToday && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />}
                    {day}
                  </span>
                  <span className={sched.enabled ? (isToday ? "text-emerald-700 font-bold" : "text-gray-800") : "text-rose-500 font-semibold"}>
                    {sched.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= QUICK INFORMATION CARD ================= */
const QuickInformationCard = ({ institute }) => {
  const displayCity = institute?.city || institute?.district?.name || 'India';
  const displayState = typeof institute?.state === 'object' ? institute?.state?.name : institute?.state || '';

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-xs relative z-30">
      <div className="bg-stone-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 text-center rounded-t-md">
        Quick Information
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <span className="font-bold text-gray-900">Category:</span>
          <span className="text-orange-600 font-extrabold uppercase">{institute?.category || 'Coaching & Training'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <span className="font-bold text-gray-900">Location:</span>
          <span className="text-gray-800 font-semibold">
            {displayCity}{displayState ? `, ${displayState}` : ''}
          </span>
        </div>
        {institute?.email && (
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <span className="font-bold text-gray-900">Official Email:</span>
            <span className="text-blue-600 font-medium truncate">{institute.email}</span>
          </div>
        )}
        <div>
          <BusinessHoursToggle openingHours={institute?.openingHours} />
        </div>
      </div>
    </div>
  );
};

/* ================= EXTERNAL REDIRECT CONFIRMATION MODAL ================= */
const WebsiteRedirectModal = ({ url, isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-gray-200 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto">
          <ExternalLink size={24} />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-gray-900">External Website Redirection</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Are you sure you want to redirect to the official website? You will be navigated away from Education Masters:
          </p>
          <p className="text-xs font-mono font-semibold text-blue-600 break-all bg-gray-50 p-2.5 rounded-lg border border-gray-200 mt-1">
            {url}
          </p>
        </div>
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            Proceed to Site <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

/* ================= PROFESSIONAL ENQUIRE MODAL POPUP ================= */
const EnquireModalPopup = ({
  isOpen,
  onClose,
  instituteName,
  formData,
  handleInputChange,
  formsubmithandler,
  errors,
  submitting,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-6 relative text-left">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="pr-6">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 mb-2">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Direct Admissions 2026–27</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-gray-900 leading-snug">
            Reserve Your Seat
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-blue-600 line-clamp-2 mt-0.5" title={instituteName}>
            {instituteName}
          </p>
          <p className="text-xs md:text-sm text-gray-500 mt-1 leading-relaxed">
            Get direct callback, batch timings, and fee structures from official institute staff.
          </p>
        </div>

        <form className="space-y-4 sm:space-y-5" onSubmit={formsubmithandler}>
          <div>
            <div className="relative">
              <User
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                onChange={handleInputChange}
                value={formData.name}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-xs md:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-2xs"
              />
            </div>
            {errors.name && (
              <p className="text-xs text-rose-500 font-semibold mt-1">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <div className="relative">
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                onChange={handleInputChange}
                value={formData.email}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-xs md:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-2xs"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-500 font-semibold mt-1">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <div className="relative">
              <Phone
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="tel"
                name="phone"
                placeholder="WhatsApp / Mobile Number"
                onChange={handleInputChange}
                value={formData.phone}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-xs md:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-2xs"
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-rose-500 font-semibold mt-1">
                {errors.phone}
              </p>
            )}
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2.5 text-xs text-gray-600 cursor-pointer leading-relaxed">
              <input
                type="checkbox"
                name="recaptcha"
                checked={formData.recaptcha}
                onChange={handleInputChange}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
              />
              <span>
                I agree to be contacted via call, WhatsApp, or email regarding admissions &amp; syllabus details.
              </span>
            </label>
            {errors.recaptcha && (
              <p className="text-xs text-rose-500 font-semibold mt-1">
                {errors.recaptcha}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold text-xs md:text-sm py-3.5 rounded-xl transition-all shadow-md active:scale-[0.99] cursor-pointer"
          >
            {submitting ? "Submitting..." : "Request Call Back"}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ================= SECTION HELPERS ================= */
const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-3 mt-4 mb-3">
    <h2 className="text-lg font-semibold text-slate-900 uppercase tracking-wide whitespace-nowrap">
      {title}
    </h2>
    <div className="h-[1px] bg-gray-200 flex-1" />
  </div>
);

const Section = ({ title, children }) => (
  <div className="py-1">
    <SectionHeader title={title} />
    {children}
  </div>
);

const facilityIconMap = {
  wifi: Wifi,
  internet: Wifi,
  power: Zap,
  electricity: Zap,
  cctv: Camera,
  camera: Camera,
  security: Shield,
  guard: Shield,
  canteen: Utensils,
  mess: Utensils,
  food: Utensils,
  gym: Dumbbell,
  ac: Snowflake,
  "air conditioner": Snowflake,
  cooler: Wind,
  study: BookOpen,
  library: BookOpen,
  mock: Award,
  test: Award,
  transport: Car,
  parking: Car,
  water: Droplets,
  purifier: Droplets,
  tea: Coffee,
  projector: Tv,
};

const getFacilityIcon = (name = "") => {
  const lower = name.toLowerCase();
  for (const [key, IconComponent] of Object.entries(facilityIconMap)) {
    if (lower.includes(key)) {
      return <IconComponent size={19} className="text-slate-900 flex-shrink-0" />;
    }
  }
  return <CheckCircle2 size={19} className="text-slate-900 flex-shrink-0" />;
};

/* ================= LIST COMPONENTS ================= */
const ServicesList = ({ items = [], instituteName = "Institute" }) => {
  const list = items?.length
    ? items
    : [
      "Comprehensive Study Material & Notes",
      "Weekly Mock Tests & Performance Analysis",
      "One-on-One Doubt Clearing Sessions",
      "Experienced & Certified Faculty Guidance",
      "Career Counseling & Interview Preparation",
      "Flexible Morning & Evening Batches"
    ];
  return (
    <div className="space-y-2">
      <p className="text-sm md:text-base text-slate-900">
        {instituteName} provides the following services:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 pt-0.5">
        {list.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <CheckCircle2 size={17} className="text-emerald-600 flex-shrink-0" />
            <span className="text-sm md:text-base text-slate-900">
              {typeof item === 'object' ? item.name || item.title : item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const FacilitiesList = ({ items = [], instituteName = "Institute" }) => {
  const list = items?.length
    ? items
    : [
      "Wi-Fi Campus",
      "AC Classrooms",
      "24 Hour Electricity",
      "Water Purifier",
      "Study Room & Library",
      "Mock Test Facility"
    ];
  return (
    <div className="space-y-2">
      <p className="text-sm md:text-base text-slate-900">
        {instituteName} provides the following facilities:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 pt-0.5">
        {list.map((item, i) => {
          const name = typeof item === 'object' ? item.name : item;
          return (
            <div key={i} className="flex items-center gap-2.5">
              {getFacilityIcon(name)}
              <span className="text-sm md:text-base text-slate-900">{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PaymentModesList = ({ modes = [], instituteName = "Institute" }) => {
  const defaultModes = modes?.length
    ? modes
    : ["Credit Card", "Cash", "Net Banking", "Debit Card", "UPI / QR Code"];
  const getPaymentIcon = (name = "") => {
    const lower = name.toLowerCase();
    if (lower.includes("cash")) return <Banknote size={19} className="text-slate-900 flex-shrink-0" />;
    if (lower.includes("net") || lower.includes("bank")) return <Building2 size={19} className="text-slate-900 flex-shrink-0" />;
    if (lower.includes("upi") || lower.includes("qr")) return <Smartphone size={19} className="text-slate-900 flex-shrink-0" />;
    return <CreditCard size={19} className="text-slate-900 flex-shrink-0" />;
  };

  return (
    <div className="space-y-2">
      <p className="text-sm md:text-base text-slate-900">
        {instituteName} accepts the following payment methods:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 pt-0.5">
        {defaultModes.map((mode, i) => (
          <div key={i} className="flex items-center gap-2.5">
            {getPaymentIcon(mode)}
            <span className="text-sm md:text-base text-slate-900">{mode}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const CoursesList = ({ courses = [], instituteName = "Institute" }) => {
  if (!courses || !courses.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm md:text-base text-slate-900">
        {instituteName} offers the following specialized courses &amp; batches:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {courses.map((course, i) => (
          <div
            key={course._id || i}
            className="flex items-center justify-between p-2.5 rounded-md border border-gray-200 bg-gray-50/60 hover:bg-blue-50/70 hover:border-blue-200 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen size={16} className="text-blue-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                {course.name}
              </span>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 flex-shrink-0 uppercase">
              Batch Open
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ================= ABOUT INSTITUTE SECTION (COMPACT WITH LOAD MORE) ================= */
const AboutInstituteSection = ({ aboutHtml, fallbackText, instituteName = "Institute" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef(null);

  const rawText = (aboutHtml || fallbackText || "").replace(/<[^>]*>/g, "").trim();
  const isLikelyLong = rawText.length > 220;

  useEffect(() => {
    if (contentRef.current) {
      setIsOverflowing(contentRef.current.scrollHeight > 115);
    }
  }, [aboutHtml, fallbackText]);

  const showToggle = isOverflowing || isLikelyLong;

  return (
    <Section title="About Institute">
      <div className="relative">
        <div
          ref={contentRef}
          className={`text-sm sm:text-md text-gray-600 sm:text-gray-700 leading-relaxed text-left transition-all duration-300 ${!isExpanded && showToggle ? "max-h-[200px] overflow-hidden" : ""
            }`}
        >
          {aboutHtml ? (
            <div
              className="space-y-2 [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
              dangerouslySetInnerHTML={{ __html: aboutHtml }}
            />
          ) : (
            <p>
              {fallbackText ||
                `${instituteName} is one of the premier coaching academies dedicated to providing top-quality education, structured test series, and comprehensive guidance for students aiming for competitive examinations.`}
            </p>
          )}
        </div>

        {/* Gradient fade overlay when collapsed */}
        {!isExpanded && showToggle && (
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white via-white/85 to-transparent pointer-events-none" />
        )}
      </div>

      {showToggle && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 px-3 py-1.5 rounded-md transition-colors cursor-pointer select-none"
          >
            <span>{isExpanded ? "Show Less" : "Load More"}</span>
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      )}
    </Section>
  );
};

/* ================= VIDEO TOUR SECTION ================= */
function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const str = String(url).trim();
  if (str.includes('/embed/')) return str;
  const match = str.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}

const VideoTourSection = ({ videoUrl, instituteName = "Institute" }) => {
  if (!videoUrl) return null;
  const embedUrl = getYouTubeEmbedUrl(videoUrl);
  return (
    <Section title="Campus Video Tour">
      <div className="space-y-2.5">
        <p className="text-sm md:text-base text-slate-900">
          Watch virtual campus tour and classroom facilities of {instituteName}:
        </p>
        {embedUrl ? (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 shadow-xs bg-slate-950">
            <iframe
              src={embedUrl}
              title={`${instituteName} Video Tour`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Video className="text-blue-600" size={20} />
              <span className="text-sm font-semibold text-gray-800">Campus Video Tour Available</span>
            </div>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-2xs"
            >
              Watch Video <ExternalLink size={13} />
            </a>
          </div>
        )}
      </div>
    </Section>
  );
};

/* ================= INSTITUTE HIGHLIGHTS / GALLERY MOSAIC ================= */
const InstituteGalleryMosaic = ({ images = [], instituteName = "Institute", onOpenLightbox }) => {
  if (!images || images.length === 0) return null;

  // Single Image Mode: generous 100% cover display without any text overlay
  if (images.length === 1) {
    return (
      <div
        onClick={() => onOpenLightbox(0)}
        className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-xs relative hidden sm:block h-[360px] sm:h-[420px] md:h-[460px] lg:h-[480px] bg-slate-900 group cursor-pointer"
      >
        <img
          src={images[0]}
          className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
          alt={instituteName}
        />
      </div>
    );
  }

  // 2 Images Split
  if (images.length === 2) {
    return (
      <div className="w-full hidden sm:block border border-gray-200 rounded-xl overflow-hidden shadow-xs p-1.5 md:p-2 bg-white">
        <div className="grid grid-cols-2 gap-2 md:gap-2.5 h-[360px] sm:h-[420px] md:h-[460px] lg:h-[480px]">
          {images.map((src, idx) => (
            <div
              key={idx}
              onClick={() => onOpenLightbox(idx)}
              className="relative h-full rounded-xl overflow-hidden bg-slate-900 cursor-pointer group shadow-2xs"
            >
              <img
                src={src}
                alt={`${instituteName} photo ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3 Images Layout
  if (images.length === 3) {
    return (
      <div className="w-full hidden sm:block border border-gray-200 rounded-xl overflow-hidden shadow-xs p-1.5 md:p-2 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-2.5 h-[360px] sm:h-[420px] md:h-[460px] lg:h-[480px]">
          <div
            onClick={() => onOpenLightbox(0)}
            className="relative md:col-span-7 h-full rounded-xl overflow-hidden bg-slate-900 cursor-pointer group shadow-2xs"
          >
            <img
              src={images[0]}
              alt={`${instituteName} main`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="md:col-span-5 grid grid-rows-2 gap-2 md:gap-2.5 h-full">
            {images.slice(1, 3).map((src, idx) => (
              <div
                key={idx}
                onClick={() => onOpenLightbox(idx + 1)}
                className="relative rounded-xl overflow-hidden bg-slate-900 cursor-pointer group shadow-2xs"
              >
                <img
                  src={src}
                  alt={`${instituteName} photo ${idx + 2}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 4 Images Layout
  if (images.length === 4) {
    return (
      <div className="w-full hidden sm:block border border-gray-200 rounded-xl overflow-hidden shadow-xs p-1.5 md:p-2 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-2.5 h-[360px] sm:h-[420px] md:h-[460px] lg:h-[480px]">
          <div
            onClick={() => onOpenLightbox(0)}
            className="relative md:col-span-7 h-full rounded-xl overflow-hidden bg-slate-900 cursor-pointer group shadow-2xs"
          >
            <img
              src={images[0]}
              alt={`${instituteName} main`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="md:col-span-5 grid grid-cols-2 grid-rows-2 gap-2 md:gap-2.5 h-full">
            <div
              onClick={() => onOpenLightbox(1)}
              className="relative rounded-xl overflow-hidden bg-slate-900 cursor-pointer group shadow-2xs"
            >
              <img src={images[1]} alt={`${instituteName} photo 2`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div
              onClick={() => onOpenLightbox(2)}
              className="relative rounded-xl overflow-hidden bg-slate-900 cursor-pointer group shadow-2xs"
            >
              <img src={images[2]} alt={`${instituteName} photo 3`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div
              onClick={() => onOpenLightbox(3)}
              className="relative col-span-2 rounded-xl overflow-hidden bg-slate-900 cursor-pointer group shadow-2xs"
            >
              <img src={images[3]} alt={`${instituteName} photo 4`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5 or More Images (Matches Dev Bhoomi / College Highlights mosaic reference)
  return (
    <div className="w-full hidden sm:block border border-gray-200 rounded-xl overflow-hidden shadow-xs p-1.5 md:p-2 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-2.5 h-[360px] sm:h-[420px] md:h-[460px] lg:h-[480px]">
        {/* Left Column: 1 Large Featured Image (~58% width) */}
        <div
          onClick={() => onOpenLightbox(0)}
          className="relative md:col-span-7 h-full rounded-xl overflow-hidden bg-slate-900 cursor-pointer group shadow-2xs"
        >
          <img
            src={images[0]}
            alt={`${instituteName} main`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Right Column: 4 images in 2x2 grid (~42% width) */}
        <div className="md:col-span-5 grid grid-cols-2 grid-rows-2 gap-2 md:gap-2.5 h-full">
          {images.slice(1, 5).map((imgUrl, idx) => {
            const actualIdx = idx + 1;
            const isFourthSlot = idx === 3;
            const total = images.length;
            const remaining = total - 5;
            const showOverlay = isFourthSlot && total > 5;

            return (
              <div
                key={actualIdx}
                onClick={() => onOpenLightbox(actualIdx)}
                className="relative rounded-xl overflow-hidden bg-slate-900 cursor-pointer group shadow-2xs"
              >
                <img
                  src={imgUrl}
                  alt={`${instituteName} photo ${actualIdx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {showOverlay && (
                  <div className="absolute inset-0 bg-slate-950/65 group-hover:bg-slate-950/75 backdrop-blur-[1px] transition-colors flex flex-col items-center justify-center text-white select-none">
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight drop-shadow-md">
                      +{remaining + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold tracking-wide drop-shadow-md mt-0.5">
                      Images
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ================= CAMPUS PHOTO GALLERY ================= */
const CampusGallerySection = ({ media = [], instituteName = "Institute", onOpenPhoto }) => {
  const [activePhoto, setActivePhoto] = useState(null);
  if (!media || !media.length) return null;

  const photos = media
    .map((m) => (typeof m === 'object' && m ? (m.file || m.url || m.path || m.img_url) : m))
    .filter(Boolean);
  if (!photos.length) return null;

  return (
    <Section title="Campus Infrastructure & Gallery">
      <div className="space-y-2.5">
        <p className="text-sm md:text-base text-slate-900">
          Explore verified campus infrastructure, classrooms, and study areas at {instituteName}:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
          {photos.map((photo, idx) => {
            const src = getImageUrl(photo);
            return (
              <div
                key={idx}
                onClick={() => {
                  if (onOpenPhoto) {
                    onOpenPhoto(src);
                  } else {
                    setActivePhoto(src);
                  }
                }}
                className="group relative h-28 sm:h-32 rounded-lg overflow-hidden border border-gray-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-md transition-all"
              >
                <img
                  src={src}
                  alt={`${instituteName} Campus photo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera size={20} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Fallback Lightbox Modal if onOpenPhoto not provided */}
        {!onOpenPhoto && activePhoto && (
          <div
            className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setActivePhoto(null)}
          >
            <div
              className="relative max-w-3xl w-full max-h-[85vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 p-2 cursor-pointer"
                aria-label="Close photo preview"
              >
                <X size={24} />
              </button>
              <img
                src={activePhoto}
                alt="Campus View"
                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/20"
              />
            </div>
          </div>
        )}
      </div>
    </Section>
  );
};

/* ================= FULL-SCREEN GALLERY LIGHTBOX MODAL ================= */
const GalleryLightboxModal = ({
  isOpen,
  images = [],
  currentIndex = 0,
  instituteName = "Institute",
  onClose,
  onNext,
  onPrev,
  onSelectIndex
}) => {
  if (!isOpen || !images.length) return null;
  const currentSrc = images[currentIndex] || images[0];

  return (
    <div
      className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="w-full max-w-6xl mx-auto flex items-center justify-between text-white py-2 px-1 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded-sm border border-blue-400/30 hidden sm:inline-block">
            Campus Photos
          </span>
          <span className="text-sm md:text-base font-semibold text-white/90 line-clamp-1 max-w-[240px] sm:max-w-md">
            {instituteName}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs sm:text-sm font-medium text-slate-300 bg-white/10 px-3 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close photo viewer"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main View Area with Prev / Next */}
      <div
        className="relative flex-1 w-full max-w-6xl mx-auto flex items-center justify-center my-2 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            type="button"
            onClick={onPrev}
            className="absolute left-2 sm:left-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center shadow-2xl border border-white/20 transition-all hover:scale-105 cursor-pointer"
            aria-label="Previous photo"
          >
            <ChevronLeft size={26} />
          </button>
        )}

        <img
          src={currentSrc}
          alt={`${instituteName} photo ${currentIndex + 1}`}
          className="max-w-full max-h-[70vh] sm:max-h-[76vh] object-contain rounded-xl shadow-2xl transition-all duration-300"
        />

        {images.length > 1 && (
          <button
            type="button"
            onClick={onNext}
            className="absolute right-2 sm:right-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center shadow-2xl border border-white/20 transition-all hover:scale-105 cursor-pointer"
            aria-label="Next photo"
          >
            <ChevronRight size={26} />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip (if multiple images) */}
      {images.length > 1 && (
        <div
          className="w-full max-w-4xl mx-auto pt-2 pb-1 overflow-x-auto no-scrollbar z-10 flex items-center justify-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-2 px-2 max-w-full overflow-x-auto py-1">
            {images.map((src, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectIndex(idx)}
                className={`relative w-14 h-11 sm:w-16 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                  currentIndex === idx
                    ? "border-blue-500 scale-105 shadow-md shadow-blue-500/30 opacity-100"
                    : "border-transparent opacity-50 hover:opacity-80"
                }`}
              >
                <img
                  src={src}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= LOCATION & DIRECTIONS ================= */
function getMapEmbedUrl(gmap) {
  if (!gmap) return null;
  const str = String(gmap).trim();
  if (str.startsWith('!1m') || str.startsWith('pb=!1m')) {
    const pb = str.startsWith('pb=') ? str : `pb=${str}`;
    return `https://www.google.com/maps/embed?${pb}`;
  }
  if (str.includes('/embed') || str.includes('google.com/maps/embed')) {
    return str;
  }
  return null;
}

const MapLocationSection = ({ gmap, address, instituteName = "Institute" }) => {
  if (!gmap) return null;
  const embedUrl = getMapEmbedUrl(gmap);
  const openUrl = embedUrl
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${instituteName} ${address || ''}`)}`
    : (gmap.startsWith('http') ? gmap : `https://${gmap}`);

  return (
    <Section title="Location & Map Directions">
      <div className="space-y-2.5">
        <p className="text-sm md:text-base text-slate-900">
          Find {instituteName} on Google Maps:
        </p>
        {embedUrl ? (
          <div className="space-y-2">
            <div className="relative w-full h-[280px] sm:h-[320px] rounded-xl overflow-hidden border border-gray-200 shadow-xs bg-slate-100">
              <iframe
                src={embedUrl}
                title={`${instituteName} Google Map`}
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
              />
            </div>
            <div className="flex justify-end">
              <a
                href={openUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                <span>Open in Google Maps / Get Directions</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <MapPin className="text-rose-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-xs font-bold text-gray-900">{instituteName}</p>
                <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                  {address || 'Official Campus Location Available'}
                </p>
              </div>
            </div>
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <span>Open in Google Maps</span>
              <ExternalLink size={13} />
            </a>
          </div>
        )}
      </div>
    </Section>
  );
};

/* ================= BOTTOM SECTIONS ================= */
function formatPostDate(dateStr) {
  if (!dateStr) return 'Aug 08, 2026';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Aug 08, 2026';
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  } catch {
    return 'Aug 08, 2026';
  }
}

function getPostCategory(post) {
  if (post.category && typeof post.category === 'string') return post.category;
  if (post.category && typeof post.category === 'object' && post.category.name) return post.category.name;
  const t = (post.title || '').toLowerCase();
  if (t.includes('railway') || t.includes('rrb') || t.includes('scr') || t.includes('apprentice') || t.includes('je')) return 'Railway';
  if (t.includes('defence') || t.includes('army') || t.includes('airforce') || t.includes('navy')) return 'Defence';
  if (t.includes('ssc') || t.includes('cgl') || t.includes('chsl')) return 'SSC';
  if (t.includes('upsc') || t.includes('ias')) return 'UPSC';
  return 'Article';
}

const RecentPostsSection = ({ posts = [] }) => {
  if (!posts || !posts.length) return null;

  return (
    <div className="mt-8">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#1a4a6b] tracking-tight pb-1 inline-block">
          Recent Posts
        </h2>
        <div className="h-0.5 w-full bg-gray-200 mt-1" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {posts.map((post, idx) => {
          const postImage = post.image || post.featured_image || post.thumbnail;
          const imageSrc = postImage ? getImageUrl(postImage, '/logo.webp') : null;
          const cat = getPostCategory(post);
          const dateFormatted = formatPostDate(post.createdAt || post.date);

          return (
            <div
              key={post._id || idx}
              className="flex items-center gap-3.5 pb-3 border-b border-gray-200/90 group"
            >
              <Link
                href={`/${post.slug || ''}`}
                className="w-20 h-14 rounded-md overflow-hidden bg-slate-100 flex-shrink-0 border border-gray-200 relative block"
              >
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white">
                    <GraduationCap className="w-5 h-5 text-blue-400" />
                  </div>
                )}
              </Link>

              <div className="flex-1 min-w-0 space-y-1">
                <Link
                  href={`/${post.slug || ''}`}
                  className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2 leading-snug transition-colors"
                >
                  {post.title}
                </Link>

                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                    <span>{dateFormatted}</span>
                  </span>

                  <span className="font-medium text-gray-500 hover:text-gray-700">
                    {cat}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const UsefulInformationSection = () => {
  return (
    <div className="mt-8">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#1a4a6b] tracking-tight pb-1 inline-block">
          Useful Information
        </h2>
        <div className="h-0.5 w-full bg-gray-200 mt-1" />
      </div>

      <div className="bg-gray-50/50 rounded-lg border border-gray-200/80 p-5">
        <ul className="list-disc pl-5 space-y-2.5 text-xs sm:text-sm text-gray-700 leading-relaxed font-normal">
          <li>Avoid any scams while paying directly in advance</li>
          <li>Make payment via Western Union etc at your own risk.</li>
          <li>You can accept and make payments from outside the country at your own risk.</li>
          <li>Education Masters is not responsible for any transaction or payments, shipping guarantee, seller or buyer protections.</li>
        </ul>
      </div>
    </div>
  );
};

/* ================= MAIN SINGLE INSTITUTE PAGE COMPONENT ================= */
export default function SingleInstitutePage({ params }) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;

  const [institute, setInstitute] = useState(null);
  const [similarInstitutes, setSimilarInstitutes] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Interaction states
  const [shownumber, setshownumber] = useState(false);
  const [showEnquirePopup, setShowEnquirePopup] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showWebsiteConfirm, setShowWebsiteConfirm] = useState(false);
  const [selectedWebsiteUrl, setSelectedWebsiteUrl] = useState("");
  const [showThankYou, setShowThankYou] = useState(false);
  const [copied, setCopied] = useState(false);

  // Lightbox state for multi-image photo gallery
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Real review state - persists per institute
  const [reviewsList, setReviewsList] = useState([]);
  const [newReview, setNewReview] = useState({ name: "", rating: 5, comment: "" });

  // Enquiry form states
  const INITIAL_FORM = {
    name: "",
    email: "",
    phone: "",
    recaptcha: false,
  };
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Load institute data, reviews & recent posts
  useEffect(() => {
    async function loadInstituteData() {
      setLoading(true);
      setError(false);
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/institutes/${slug}`);
        if (res.ok) {
          const json = await res.json();
          const inst = json.data || json;
          setInstitute(inst);

          // Fetch similar institutes
          if (inst?.state?._id || inst?.state) {
            const stateId = typeof inst.state === 'object' ? inst.state._id || inst.state.slug : inst.state;
            const simRes = await fetch(`${apiBase}/institutes?state=${stateId}&limit=4`);
            if (simRes.ok) {
              const simJson = await simRes.json();
              const items = (simJson.data || simJson.institutes || []).filter(
                (item) => item._id !== inst._id && item.slug !== inst.slug
              );
              setSimilarInstitutes(items.slice(0, 3));
            }
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to load institute:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    async function loadRecentPosts() {
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/blogs?limit=10`);
        if (res.ok) {
          const json = await res.json();
          const posts = json.data || json.blogs || [];
          setRecentPosts(posts.filter(p => p.title && !p.title.includes('test')));
        }
      } catch (err) {
        console.error("Failed to load recent posts:", err);
      }
    }

    // Load any user-submitted reviews from local cache
    try {
      const stored = localStorage.getItem(`inst_reviews_${slug}`);
      if (stored) {
        setReviewsList(JSON.parse(stored));
      }
    } catch {
      // ignore
    }

    loadInstituteData();
    loadRecentPosts();
  }, [slug]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name || formData.name.length < 3) newErrors.name = "Enter valid name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Enter valid email";
    if (!/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = "Enter valid 10-digit mobile number";
    if (!formData.recaptcha) newErrors.recaptcha = "Consent required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formsubmithandler = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      await new Promise(r => setTimeout(r, 600));
      setFormData(INITIAL_FORM);
      setShowEnquirePopup(false);
      setShowThankYou(true);
    } catch {
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!newReview.name.trim() || !newReview.comment.trim()) {
      alert("Please enter your name and review feedback.");
      return;
    }
    const updated = [
      {
        name: newReview.name.trim(),
        rating: Number(newReview.rating) || 5,
        date: "Just now",
        comment: newReview.comment.trim(),
      },
      ...reviewsList,
    ];
    setReviewsList(updated);
    try {
      localStorage.setItem(`inst_reviews_${slug}`, JSON.stringify(updated));
    } catch { }
    setNewReview({ name: "", rating: 5, comment: "" });
    setShowReview(false);
    alert("Thank you! Your review has been submitted.");
  };

  const handleVisitWebsiteClick = (e) => {
    e.preventDefault();
    const url = institute?.website || "https://educationmasters.in";
    const targetUrl = url.startsWith("http") ? url : `https://${url}`;
    setSelectedWebsiteUrl(targetUrl);
    setShowWebsiteConfirm(true);
  };

  const handleShareClick = () => {
    if (typeof window !== "undefined") {
      if (navigator.share) {
        navigator.share({
          title: institute?.name || "Institute Profile",
          url: window.location.href,
        }).catch(() => { });
      } else {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  const RatingStars = ({ rating = 5 }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={rating >= i ? "fill-amber-400 text-amber-400" : "text-gray-300"}
        />
      ))}
    </div>
  );

  // Collect all gallery images: cover first, followed by media items, fallback to logo
  const allGalleryImages = useMemo(() => {
    if (!institute) return [];
    const list = [];
    if (institute.cover) {
      const src = getImageUrl(institute.cover);
      if (src && !list.includes(src)) list.push(src);
    }
    if (Array.isArray(institute.media) && institute.media.length > 0) {
      institute.media.forEach((item) => {
        const raw = typeof item === 'object' && item ? (item.file || item.url || item.path || item.img_url) : item;
        if (raw) {
          const src = getImageUrl(raw);
          if (src && !list.includes(src)) list.push(src);
        }
      });
    }
    if (list.length === 0 && institute.logo) {
      const src = getImageUrl(institute.logo);
      if (src && !list.includes(src)) list.push(src);
    }
    return list;
  }, [institute]);

  const openLightbox = (index = 0) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextLightbox = (e) => {
    e?.stopPropagation?.();
    setLightboxIndex((prev) => (prev + 1) % (allGalleryImages.length || 1));
  };
  const prevLightbox = (e) => {
    e?.stopPropagation?.();
    setLightboxIndex((prev) => (prev - 1 + (allGalleryImages.length || 1)) % (allGalleryImages.length || 1));
  };

  useEffect(() => {
    if (lightboxIndex === null || !allGalleryImages.length) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLightbox();
      if (e.key === 'ArrowLeft') prevLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, allGalleryImages.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F7] flex flex-col">
        <Header />
        <main className="flex-1 max-w-[1240px] w-full mx-auto p-4 py-8">
          <div className="bg-white rounded-md border border-gray-200 p-6 animate-pulse space-y-4">
            <div className="h-32 bg-slate-200 rounded-md" />
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-48 bg-slate-200 rounded mt-6" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !institute) {
    return (
      <div className="min-h-screen bg-[#F8F7F7] flex flex-col">
        <Header />
        <main className="flex-1 max-w-[1240px] w-full mx-auto p-4 py-16 text-center">
          <div className="bg-white rounded-md border border-gray-200 p-12 max-w-lg mx-auto shadow-xs">
            <School className="w-16 h-16 text-slate-300 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Institute Not Found</h1>
            <p className="text-sm text-slate-500 mb-6">
              The institute profile you are looking for may have been moved or is currently unavailable.
            </p>
            <Link
              href="/institutes"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition"
            >
              Browse All Institutes
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const rawPath = institute.cover || institute.logo;
  const imageSrc = getImageUrl(rawPath, null);
  const displayCity = institute.city || institute.district?.name || 'India';
  const displayState = typeof institute.state === 'object' ? institute.state?.name : institute.state || '';
  const rawPhone = institute.phone || "9811631557";
  const cleanPhone = rawPhone.replace(/\D/g, "");

  // Real review calculations (no static dummy values)
  const hasReviews = reviewsList.length > 0;
  const averageRating = hasReviews
    ? (reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviewsList.length)
    : null;

  return (
    <>
      <Header />

      <div className="bg-[#F8F7F7] min-h-screen pt-0 pb-6">
        <div className="max-w-[1240px] mx-auto bg-white rounded-md border border-gray-200 shadow-xs p-3 md:p-4 overflow-x-hidden">

          {/* ================= FULL-WIDTH TOP HEADER BANNER ================= */}
          <div className="-mx-3 -mt-3 md:-mx-4 md:-mt-4 mb-3 p-[6px] bg-white overflow-hidden rounded-t-md border-b border-gray-200 w-[calc(100%+24px)] md:w-[calc(100%+32px)]">
            <AdPlaceholder
              dimensions="728 x 90"
              formatName="Institute Profile Leaderboard Banner"
              minHeight="90px"
              className="max-w-[728px] mx-auto w-full"
            />
          </div>

          {/* ================= BREADCRUMBS ================= */}
          <div className="mb-3 flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <Link href="/institutes" className="hover:text-blue-600">Institutes</Link>
            <span>/</span>
            <span className="text-gray-900 font-bold line-clamp-1">{institute.name}</span>
          </div>

          {/* ================= DESKTOP HOSTEL-STYLE HEADER ================= */}
          <div className="hidden lg:flex gap-4 items-start pb-4 border-b border-gray-200 mb-5">
            {/* Institute Thumbnail Logo / Cover */}
            <div className="w-48 h-36 rounded-md border border-gray-200 bg-slate-100 overflow-hidden flex-shrink-0 relative">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  className="w-full h-full object-cover"
                  alt={institute.name}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-slate-800 text-white select-none">
                  <School className="w-8 h-8 text-blue-400 mb-1" />
                  <span className="text-xs font-bold uppercase text-center line-clamp-1">
                    {institute.name}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-semibold text-gray-900 leading-tight">
                  {institute.name}
                </h1>
                <span className="bg-indigo-50 text-indigo-700 text-[11px] font-semibold px-2 py-0.5 rounded-sm border border-indigo-100 uppercase">
                  {institute.category || 'Coaching Institute'}
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-sm border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Verified
                </span>
              </div>

              {/* Real Rating or Write Review CTA */}
              <div className="flex items-center gap-2">
                {hasReviews ? (
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xs px-2 py-0.5 rounded-sm font-bold bg-emerald-600">
                      {averageRating.toFixed(1)} ★
                    </span>
                    <RatingStars rating={averageRating} />
                    <span className="text-xs text-gray-600 font-medium">
                      ({reviewsList.length} {reviewsList.length === 1 ? 'Review' : 'Reviews'})
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowReview(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer py-0.5"
                  >
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                    <span>Be the first to rate &amp; review</span>
                  </button>
                )}
              </div>

              {/* Address */}
              <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-700 font-medium">
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin size={14} className="text-rose-500 flex-shrink-0" />
                  <span>{institute.address || `${displayCity}, ${displayState}`}</span>
                </div>
              </div>

              {/* Action Buttons Row (NO redundant Call Now button, NO static views) */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                {/* Single Professional Phone Action: Show Number / Click to Call */}
                {Boolean(rawPhone) && (
                  shownumber ? (
                    <a
                      href={`tel:${cleanPhone}`}
                      title="Click to Call"
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-xs md:text-sm font-semibold rounded-md shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Phone size={16} />
                      <span>{institute.phone}</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setshownumber(true)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-xs md:text-sm font-bold rounded-md shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Phone size={16} />
                      <span>Show Number</span>
                    </button>
                  )
                )}

                {/* WhatsApp button */}
                <button
                  type="button"
                  onClick={() => {
                    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                      `Hi, I am inquiring about courses at ${institute.name}`
                    )}`;
                    window.open(waUrl, "_blank");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs md:text-sm font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <WhatsAppIcon size={16} /> WhatsApp
                </button>

                {/* Share button */}
                <button
                  type="button"
                  className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 px-4 py-2 text-xs md:text-sm font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  onClick={handleShareClick}
                >
                  <Share2 size={16} className="text-gray-600" />
                  {copied ? "Link Copied!" : "Share"}
                </button>

                {/* Write Review button */}
                <button
                  type="button"
                  onClick={() => setShowReview(true)}
                  className="bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 px-4 py-2 text-xs md:text-sm font-bold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Star size={16} className="text-amber-500 fill-amber-400" /> Write Review
                </button>

                {/* Visit Official Website */}
                {institute.website && (
                  <button
                    type="button"
                    onClick={handleVisitWebsiteClick}
                    title="Visit Official Website"
                    className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 w-9 h-9 rounded-md transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                  >
                    <Globe size={18} className="text-gray-700" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ================= MOBILE HOSTEL-STYLE HEADER ================= */}
          <section className="lg:hidden mb-5 pb-4 border-b border-gray-200">
            <div className="space-y-3">
              <div
                onClick={() => (allGalleryImages.length > 0 ? openLightbox(0) : null)}
                className="relative h-[280px] sm:h-[340px] rounded-xl overflow-hidden bg-slate-900 shadow-xs cursor-pointer group"
              >
                {(allGalleryImages.length > 0 || imageSrc) ? (
                  <>
                    <img
                      src={allGalleryImages[0] || imageSrc}
                      alt={institute.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {allGalleryImages.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg border border-white/20 flex items-center gap-1.5 pointer-events-none">
                        <Camera size={13} className="text-blue-300" />
                        <span>1 / {allGalleryImages.length} Photos</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-white">
                    <School className="w-12 h-12 text-blue-400 mb-2" />
                    <span className="text-sm font-bold">{institute.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-1">
                <h2 className="text-lg font-semibold text-gray-900 leading-snug">
                  {institute.name}
                </h2>

                <div className="flex items-start gap-1.5 text-xs text-gray-600 font-medium">
                  <MapPin size={14} className="text-rose-500 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{institute.address || `${displayCity}, ${displayState}`}</span>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-gray-900 pt-0.5">
                  <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-sm text-[11px] border border-indigo-100 uppercase">
                    {institute.category || 'Coaching Institute'}
                  </span>

                  {hasReviews ? (
                    <div className="flex items-center gap-1.5">
                      <span className="bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-sm text-[11px]">
                        {averageRating.toFixed(1)} ★
                      </span>
                      <span className="text-gray-600 font-medium text-xs">
                        {reviewsList.length} {reviewsList.length === 1 ? 'Review' : 'Reviews'}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowReview(true)}
                      className="text-blue-600 font-semibold text-xs hover:underline"
                    >
                      Leave first review
                    </button>
                  )}
                </div>

                {/* Operating Hours dropdown */}
                <div className="pt-1">
                  <BusinessHoursToggle openingHours={institute.openingHours} />
                </div>

                {/* Mobile Action Buttons (Show Number, WhatsApp, Website) */}
                <div className="flex items-center gap-2 pt-3">
                  {shownumber ? (
                    <a
                      href={`tel:${cleanPhone}`}
                      className="flex-1 bg-orange-500 text-white font-extrabold text-xs h-10 rounded-md flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Phone size={15} /> {institute.phone}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setshownumber(true)}
                      className="flex-1 border border-orange-500 text-orange-600 hover:bg-orange-50 font-extrabold text-xs h-10 rounded-md flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Phone size={15} /> SHOW NUMBER
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                        `Hi, I am inquiring about courses at ${institute.name}`
                      )}`;
                      window.open(waUrl, "_blank");
                    }}
                    className="flex-1 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-extrabold text-xs h-10 rounded-md flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <WhatsAppIcon size={16} /> WHATSAPP
                  </button>

                  {institute.website && (
                    <button
                      type="button"
                      onClick={handleVisitWebsiteClick}
                      className="w-10 h-10 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md flex items-center justify-center shadow-2xs transition-colors flex-shrink-0 cursor-pointer"
                    >
                      <ExternalLink size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ================= MULTI-IMAGE FULL-WIDTH MOSAIC (> 1 images) ================= */}
          {allGalleryImages.length > 1 && (
            <div className="mb-6 hidden sm:block w-full">
              <InstituteGalleryMosaic
                images={allGalleryImages}
                instituteName={institute.name}
                onOpenLightbox={openLightbox}
              />
            </div>
          )}

          {/* ================= MAIN 2-COLUMN GRID ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-[67%_33%] gap-6 mt-2">

            {/* ================= LEFT COLUMN ================= */}
            <div className="space-y-4">

              {/* Single Image Banner (Left Column so Quick Information card comes to the top on right) */}
              {allGalleryImages.length === 1 && (
                <div
                  onClick={() => openLightbox(0)}
                  className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-xs relative hidden sm:block h-[340px] sm:h-[400px] md:h-[440px] lg:h-[460px] bg-slate-900 group cursor-pointer"
                >
                  <img
                    src={allGalleryImages[0]}
                    className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
                    alt={institute.name}
                  />
                </div>
              )}

              {/* ABOUT INSTITUTE */}
              <AboutInstituteSection
                aboutHtml={institute.about}
                fallbackText={`${institute.name} is one of the premier coaching academies in ${displayCity}, dedicated to providing top-quality education, structured test series, and comprehensive guidance for students aiming for competitive examinations.`}
                instituteName={institute.name}
              />

              {/* COURSES OFFERED */}
              {institute.courses && institute.courses.length > 0 && (
                <Section title="Courses Offered">
                  <CoursesList courses={institute.courses} instituteName={institute.name} />
                </Section>
              )}

              {/* FACILITIES */}
              <Section title="Facilities">
                <FacilitiesList items={institute.facilities} instituteName={institute.name} />
              </Section>

              {/* PAYMENT MODES */}
              <Section title="Payment Modes">
                <PaymentModesList modes={institute.paymentMode} instituteName={institute.name} />
              </Section>

              {/* CAMPUS VIDEO TOUR */}
              {Boolean(institute.video) && (
                <VideoTourSection videoUrl={institute.video} instituteName={institute.name} />
              )}

              {/* CAMPUS PHOTO GALLERY */}
              {Boolean(institute.media && institute.media.length > 0) && (
                <CampusGallerySection
                  media={institute.media}
                  instituteName={institute.name}
                  onOpenPhoto={(photoSrc) => {
                    const idx = allGalleryImages.indexOf(photoSrc);
                    openLightbox(idx >= 0 ? idx : 0);
                  }}
                />
              )}

              {/* LOCATION & DIRECTIONS */}
              {Boolean(institute.gmap) && (
                <MapLocationSection
                  gmap={institute.gmap}
                  address={institute.address}
                  instituteName={institute.name}
                />
              )}


            </div>

            {/* ================= RIGHT COLUMN ================= */}
            <div className="space-y-4">

              {/* QUICK INFORMATION CARD */}
              <QuickInformationCard institute={institute} />

              {/* ENQUIRY FORM */}
              <div className="bg-white rounded-xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden">
                {/* Top Subtle Gradient Accent Bar */}
                <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />

                <div className="p-4 sm:p-5">
                  {/* Header Badge & Title */}
                  <div className="pb-3 mb-3 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                        <span>Admissions 2026–27</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                        Fast Callback
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 leading-snug">
                      Reserve Your Seat
                    </h3>
                    <p className="text-xs font-semibold text-blue-600 line-clamp-2 mt-0.5" title={institute.name}>
                      {institute.name}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      Get direct callback, fee details &amp; syllabus assistance from official counselors.
                    </p>
                  </div>

                  <form className="space-y-3" onSubmit={formsubmithandler}>
                    <div>
                      <div className="relative group">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                        <input
                          type="text"
                          name="name"
                          placeholder="Full Name"
                          onChange={handleInputChange}
                          value={formData.name}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 rounded-lg text-xs md:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-2xs"
                        />
                      </div>
                      {errors.name && <p className="text-red-500 font-semibold text-[11px] mt-1 pl-1">{errors.name}</p>}
                    </div>

                    <div>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                        <input
                          type="email"
                          name="email"
                          placeholder="Email Address"
                          onChange={handleInputChange}
                          value={formData.email}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 rounded-lg text-xs md:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-2xs"
                        />
                      </div>
                      {errors.email && <p className="text-red-500 font-semibold text-[11px] mt-1 pl-1">{errors.email}</p>}
                    </div>

                    <div>
                      <div className="relative group">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                        <input
                          type="tel"
                          name="phone"
                          placeholder="WhatsApp / Mobile Number"
                          onChange={handleInputChange}
                          value={formData.phone}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 rounded-lg text-xs md:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-2xs"
                        />
                      </div>
                      {errors.phone && <p className="text-red-500 font-semibold text-[11px] mt-1 pl-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <label className="flex items-start gap-2.5 text-[11px] text-gray-600 cursor-pointer select-none leading-relaxed">
                        <input
                          type="checkbox"
                          name="recaptcha"
                          checked={formData.recaptcha}
                          onChange={handleInputChange}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer flex-shrink-0"
                        />
                        <span>
                          I agree to receive callbacks &amp; WhatsApp updates regarding admissions &amp; batch timings.
                        </span>
                      </label>
                      {errors.recaptcha && <p className="text-red-500 font-semibold text-[11px] mt-1 pl-1">{errors.recaptcha}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 px-4 rounded-lg transition-all shadow-xs hover:shadow active:scale-[0.99] text-xs md:text-sm flex items-center justify-center gap-2 cursor-pointer ${submitting ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                    >
                      {submitting ? (
                        <>
                          <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>Request Call Back</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Trust Footer */}
                  <div className="flex items-center justify-center gap-2.5 pt-3 mt-3 border-t border-gray-100 text-[10px] font-medium text-gray-400 select-none">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                      100% Free
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Shield size={11} className="text-blue-500 flex-shrink-0" />
                      Verified
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-amber-500 flex-shrink-0" />
                      Fast Response
                    </span>
                  </div>
                </div>
              </div>

              {/* SIMILAR INSTITUTES CARD */}
              {similarInstitutes.length > 0 && (
                <div className="bg-white rounded-md border border-gray-200 shadow-xs p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider">
                      <School size={16} className="text-blue-600" />
                      <span>Similar Institutes</span>
                    </div>
                    <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                      {similarInstitutes.length} Centers
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {similarInstitutes.map((sim) => (
                      <Link
                        key={sim._id}
                        href={`/institute/${sim.slug || sim._id}`}
                        className="flex items-center gap-3 p-2 rounded-md border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-md bg-slate-100 overflow-hidden flex-shrink-0 border border-gray-200">
                          <img
                            src={getImageUrl(sim.cover || sim.logo, '/logo.webp')}
                            alt={sim.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 line-clamp-1">
                            {sim.name}
                          </h4>
                          <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                            <MapPin size={11} className="text-rose-500" />
                            <span>{sim.city || displayCity}</span>
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* WHITE-THEMED SPONSORED AD CARD */}
              <div
                onClick={() => setShowEnquirePopup(true)}
                className="hidden lg:flex bg-white rounded-md border border-gray-200 shadow-xs p-5 sm:p-6 cursor-pointer hover:border-blue-300 hover:shadow-md transition group min-h-[300px] flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
                      <span>Sponsored Advisory</span>
                    </div>
                    <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
                      Admissions 2026–27
                    </span>
                  </div>

                  <div className="text-center py-2 space-y-2.5">
                    <div className="h-12 w-12 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs group-hover:scale-110 transition-transform">
                      <GraduationCap size={24} />
                    </div>
                    <h4 className="text-sm sm:text-base font-extrabold text-gray-900 leading-snug">
                      Looking for Top Coaching Hubs &amp; Batches?
                    </h4>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed px-1">
                      Get 100% Free Counseling &amp; Verified Course Guidance from Education Masters Experts.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[10px] font-bold text-gray-600">
                      <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Verified Academies</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Free Consultation</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 rounded-md shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>ENQUIRE NOW</span>
                  <ExternalLink size={14} />
                </button>
              </div>

              {/* STUDENT REVIEWS & RATINGS (RIGHT SIDEBAR) */}
              <div className="bg-white rounded-md border border-gray-200 shadow-xs p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider">
                    <Star size={15} className="text-amber-500 fill-amber-400" />
                    <span>Student Reviews &amp; Ratings</span>
                  </div>
                  {hasReviews && (
                    <span className="text-[10px] font-extrabold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                      ★ {averageRating.toFixed(1)} ({reviewsList.length})
                    </span>
                  )}
                </div>

                {hasReviews ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-amber-50/50 border border-amber-100/80 rounded-lg p-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-gray-900">{averageRating.toFixed(1)}</span>
                          <div>
                            <RatingStars rating={averageRating} />
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              Based on {reviewsList.length} verified review{reviewsList.length === 1 ? '' : 's'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowReview(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-md transition-colors shadow-xs cursor-pointer"
                      >
                        Write Review
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                      {reviewsList.map((rev, i) => (
                        <div key={i} className="bg-gray-50/80 border border-gray-100 p-3 rounded-lg space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-gray-900">{rev.name}</span>
                            <span className="text-[10px] text-gray-400">{rev.date}</span>
                          </div>
                          <RatingStars rating={rev.rating} />
                          <p className="text-xs text-gray-700 leading-relaxed pt-1">
                            {rev.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50/80 border border-gray-200/90 rounded-md p-5 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-500 shadow-2xs">
                      <Star size={20} className="fill-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900">No Reviews Submitted Yet</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                        Have you attended classes or mock tests at <span className="font-semibold text-gray-700">{institute.name}</span>? Share your experience to guide other students and aspirants.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowReview(true)}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-md transition-colors shadow-xs cursor-pointer"
                    >
                      <Star size={14} className="fill-white" />
                      <span>Write First Review</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ================= BOTTOM: RECENT POSTS SECTION ================= */}
          <RecentPostsSection posts={recentPosts} />

          {/* ================= BOTTOM: USEFUL INFORMATION SECTION ================= */}
          <UsefulInformationSection />

        </div>
      </div>

      <Footer />

      {/* ================= MODALS ================= */}
      {/* External Website Redirect Modal */}
      <WebsiteRedirectModal
        url={selectedWebsiteUrl}
        isOpen={showWebsiteConfirm}
        onClose={() => setShowWebsiteConfirm(false)}
      />

      {/* Enquire Modal Popup */}
      <EnquireModalPopup
        isOpen={showEnquirePopup}
        onClose={() => setShowEnquirePopup(false)}
        instituteName={institute.name}
        formData={formData}
        handleInputChange={handleInputChange}
        formsubmithandler={formsubmithandler}
        errors={errors}
        submitting={submitting}
      />

      {/* Write Review Modal */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 relative">
            <button
              onClick={() => setShowReview(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-full cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-base font-bold text-gray-900">
              Write a Review for {institute.name}
            </h3>

            <form onSubmit={handleReviewSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Your Rating</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNewReview(prev => ({ ...prev, rating: num }))}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        size={22}
                        className={
                          newReview.rating >= num
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Aman Sharma"
                  value={newReview.name}
                  onChange={(e) => setNewReview(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Review Details</label>
                <textarea
                  rows={4}
                  placeholder="Share your experience regarding classes, faculty, notes, and infrastructure..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-lg shadow-xs cursor-pointer"
              >
                Submit Student Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Thank You Modal */}
      {showThankYou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-gray-200">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900">Enquiry Received!</h3>
            <p className="text-xs text-gray-600">
              Thank you for contacting <span className="font-bold">{institute.name}</span>. An admission counselor will connect with you shortly.
            </p>
            <button
              onClick={() => setShowThankYou(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Full-Screen Photo Gallery Lightbox Modal */}
      <GalleryLightboxModal
        isOpen={lightboxIndex !== null}
        images={allGalleryImages}
        currentIndex={lightboxIndex || 0}
        instituteName={institute.name}
        onClose={closeLightbox}
        onNext={nextLightbox}
        onPrev={prevLightbox}
        onSelectIndex={(idx) => setLightboxIndex(idx)}
      />
    </>
  );
}
