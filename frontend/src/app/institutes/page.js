'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdPlaceholder from '@/components/AdPlaceholder';
import {
  Search,
  MapPin,
  Building2,
  BookOpen,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Phone,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  School,
  Award,
  Layers
} from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import { getApiBaseUrl } from '@/utils/api';

const DEFAULT_LIMIT = 20;

// Popular Coaching Hubs for Quick Filter
const POPULAR_HUBS = [
  { name: 'Dehradun', state: 'Uttarakhand' },
  { name: 'Delhi', state: 'Delhi' },
  { name: 'Chandigarh', state: 'Chandigarh' },
  { name: 'Haldwani', state: 'Uttarakhand' },
  { name: 'Rishikesh', state: 'Uttarakhand' },
  { name: 'Jaipur', state: 'Rajasthan' },
  { name: 'Lucknow', state: 'Uttar Pradesh' },
  { name: 'Patna', state: 'Bihar' },
  { name: 'Kota', state: 'Rajasthan' },
];

// Helper to generate numbered page array with ellipsis
function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

function InstituteCard({ inst }) {
  const [imgError, setImgError] = useState(false);

  const rawPath = inst.cover || inst.logo;
  const imageSrc = !imgError && rawPath ? getImageUrl(rawPath, null) : null;

  const coursesList = Array.isArray(inst.courses) ? inst.courses : [];
  const facilitiesList = Array.isArray(inst.facilities) ? inst.facilities : [];
  const displayCity = inst.city || inst.district?.name || (typeof inst.state === 'object' ? inst.state?.name : '') || 'India';
  const displayState = typeof inst.state === 'object' ? inst.state?.name : inst.state || '';

  return (
    <div className="group bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-400/60 transition-all duration-200 flex flex-col h-full">
      {/* Thumbnail Banner - Increased height for better visibility */}
      <div className="relative w-full h-40 sm:h-44 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shrink-0">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={inst.name || 'Institute'}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2.5 bg-gradient-to-br from-slate-800 to-slate-900 text-white select-none">
            <School className="w-6 h-6 text-blue-400 mb-1 opacity-80" />
            <span className="font-bold text-xs tracking-wider uppercase text-slate-200 text-center line-clamp-1">
              {inst.name || 'Institute'}
            </span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent pointer-events-none" />

        {/* Location Badge */}
        <div className="absolute bottom-1.5 left-1.5 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full shadow-xs border border-white/60">
          <MapPin className="w-3 h-3 text-blue-600 fill-blue-50 shrink-0" />
          <span className="text-[10px] font-semibold text-slate-800 capitalize line-clamp-1 max-w-[130px]">
            {displayCity}
            {displayState && displayState !== displayCity ? `, ${displayState}` : ''}
          </span>
        </div>

        {/* Verified Chip */}
        <div className="absolute top-1.5 right-1.5 z-10">
          <span className="inline-flex items-center gap-0.5 bg-emerald-500/95 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full shadow-xs">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Verified
          </span>
        </div>
      </div>

      {/* Card Content - Compact padding */}
      <div className="p-3 flex flex-col flex-1">
        {/* Institute Name */}
        <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors mb-1 min-h-[2.25rem]">
          <Link href={`/institute/${inst.slug || inst._id}`} title={inst.name}>
            {inst.name}
          </Link>
        </h3>

        {/* Address excerpt */}
        {inst.address && (
          <p className="text-[11px] text-slate-500 line-clamp-1 mb-2 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{inst.address}</span>
          </p>
        )}

        {/* Courses Pills */}
        {coursesList.length > 0 && (
          <div className="mb-2 min-h-[1.5rem]">
            <div className="flex flex-wrap gap-1">
              {coursesList.slice(0, 2).map((c, i) => (
                <span
                  key={c._id || i}
                  className="inline-block bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-medium px-1.5 py-0.5 rounded truncate max-w-[110px]"
                >
                  {c.name || c}
                </span>
              ))}
              {coursesList.length > 2 && (
                <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-medium px-1 py-0.5 rounded">
                  +{coursesList.length - 2}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Facilities Pills if present */}
        {facilitiesList.length > 0 && (
          <div className="mb-2.5 flex items-center gap-1 text-slate-500 text-[10px] truncate min-h-[1.25rem]">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
            <span className="truncate">{facilitiesList.slice(0, 2).map(f => f.name || f).join(', ')}</span>
          </div>
        )}

        {/* Card Action Footer */}
        <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
          <Link
            href={`/institute/${inst.slug || inst._id}`}
            className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-xs"
          >
            <span>View Institute</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          {inst.phone && (
            <a
              href={`tel:${inst.phone}`}
              title={`Call ${inst.name}`}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
          )}

          {inst.website && (
            <a
              href={inst.website.startsWith('http') ? inst.website : `https://${inst.website}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Official Website"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function InstitutesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [activeSearch, setActiveSearch] = useState(searchParams.get('search') || '');
  const [selectedState, setSelectedState] = useState(searchParams.get('state') || '');
  const [selectedCourse, setSelectedCourse] = useState(searchParams.get('course') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [sortBy, setSortBy] = useState('latest');

  // Limit State (show 20 at a time)
  const initialLimit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
  const [limit, setLimit] = useState(isNaN(initialLimit) ? DEFAULT_LIMIT : initialLimit);

  // Pagination States
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const [page, setPage] = useState(isNaN(initialPage) ? 1 : initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Data States
  const [institutes, setInstitutes] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter Search Filter States (for left lists)
  const [courseFilterSearch, setCourseFilterSearch] = useState('');
  const [stateFilterSearch, setStateFilterSearch] = useState('');
  const [isCourseOpen, setIsCourseOpen] = useState(true);
  const [isStateOpen, setIsStateOpen] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Update URL Query String
  const updateQueryString = useCallback(
    (newParams) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([k, v]) => {
        if (v === '' || v === null || v === undefined) {
          current.delete(k);
        } else {
          current.set(k, String(v));
        }
      });
      router.push(`/institutes?${current.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Sync state with URL params
  useEffect(() => {
    setActiveSearch(searchParams.get('search') || '');
    setSelectedState(searchParams.get('state') || '');
    setSelectedCourse(searchParams.get('course') || '');
    setSelectedCity(searchParams.get('city') || '');
    const p = parseInt(searchParams.get('page') || '1', 10);
    setPage(isNaN(p) ? 1 : p);
    const l = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    setLimit(isNaN(l) ? DEFAULT_LIMIT : l);
  }, [searchParams]);

  // Load Filter Options (States & Courses)
  useEffect(() => {
    async function loadFilterMeta() {
      try {
        const apiBase = getApiBaseUrl();
        const sRes = await fetch(`${apiBase}/states?limit=100`);
        if (sRes.ok) {
          const sData = await sRes.json();
          const items = Array.isArray(sData)
            ? sData
            : sData.data || sData.states || [];
          setStatesList(
            items.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
          );
        }
      } catch (err) {
        console.error('Failed to load states:', err);
      }

      try {
        const apiBase = getApiBaseUrl();
        const cRes = await fetch(`${apiBase}/courses?limit=100`);
        if (cRes.ok) {
          const cData = await cRes.json();
          const items = Array.isArray(cData)
            ? cData
            : cData.data || cData.courses || [];
          setCoursesList(
            items.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
          );
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
      }
    }

    loadFilterMeta();
  }, []);

  // Filtered lists for left sidebar
  const displayedCourses = useMemo(() => {
    if (!courseFilterSearch.trim()) return coursesList;
    return coursesList.filter((c) =>
      c.name?.toLowerCase().includes(courseFilterSearch.toLowerCase())
    );
  }, [coursesList, courseFilterSearch]);

  const displayedStates = useMemo(() => {
    if (!stateFilterSearch.trim()) return statesList;
    return statesList.filter((s) =>
      s.name?.toLowerCase().includes(stateFilterSearch.toLowerCase())
    );
  }, [statesList, stateFilterSearch]);

  // Fetch Institutes from Backend with limit
  const fetchInstitutes = useCallback(async () => {
    setLoading(true);
    try {
      const apiBase = getApiBaseUrl();
      const query = new URLSearchParams();
      query.set('page', String(page));
      query.set('limit', String(limit));
      query.set('status', 'publish');

      if (activeSearch) query.set('search', activeSearch);
      if (selectedState) query.set('state', selectedState);
      if (selectedCourse) query.set('course', selectedCourse);

      const res = await fetch(`${apiBase}/institutes?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        let items = data.data || data.institutes || [];

        // Apply client-side sorting if needed
        if (sortBy === 'name_asc') {
          items = [...items].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (sortBy === 'name_desc') {
          items = [...items].sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        }

        // Apply city filter if user clicked a popular hub
        if (selectedCity) {
          items = items.filter((inst) =>
            (inst.city || '').toLowerCase().includes(selectedCity.toLowerCase())
          );
        }

        setInstitutes(items);
        setTotalCount(data.total || items.length);
        setTotalPages(data.pages || Math.ceil((data.total || items.length) / limit) || 1);
      } else {
        setInstitutes([]);
      }
    } catch (err) {
      console.error('Error fetching institutes:', err);
      setInstitutes([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, activeSearch, selectedState, selectedCourse, selectedCity, sortBy]);

  useEffect(() => {
    fetchInstitutes();
  }, [fetchInstitutes]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
    setPage(1);
    updateQueryString({ search: searchTerm, page: 1 });
  };

  // Handle Filter clicks
  const handleStateClick = (stateVal) => {
    const nextState = selectedState === stateVal ? '' : stateVal;
    setSelectedState(nextState);
    setPage(1);
    updateQueryString({ state: nextState, page: 1 });
  };

  const handleCourseClick = (courseVal) => {
    const nextCourse = selectedCourse === courseVal ? '' : courseVal;
    setSelectedCourse(nextCourse);
    setPage(1);
    updateQueryString({ course: nextCourse, page: 1 });
  };

  const handleCityClick = (cityVal) => {
    const nextCity = selectedCity === cityVal ? '' : cityVal;
    setSelectedCity(nextCity);
    setPage(1);
    updateQueryString({ city: nextCity, page: 1 });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setActiveSearch('');
    setSelectedState('');
    setSelectedCourse('');
    setSelectedCity('');
    setPage(1);
    router.push('/institutes');
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    updateQueryString({ page: newPage });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 340, behavior: 'smooth' });
    }
  };

  const activeFiltersCount =
    (selectedState ? 1 : 0) +
    (selectedCourse ? 1 : 0) +
    (selectedCity ? 1 : 0) +
    (activeSearch ? 1 : 0);

  // Calculation for "Showing X – Y of Z Institutes"
  const startItem = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalCount);
  const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 pb-16">
        <h1 className="sr-only">List of Top Institutes Available</h1>

        {/* ================= MAIN WIDE LAYOUT ================= */}
        <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-6 mt-4 sm:mt-6">
          <div className="flex flex-col lg:flex-row gap-5 items-start">

            {/* ================= LEFT SIDEBAR (Slim width) ================= */}
            <aside className="w-full lg:w-[200px] xl:w-[210px] shrink-0 space-y-5">
              {/* Left Vertical AdSense Space (160 x 600 Wide Skyscraper) */}
              <div className="hidden lg:block sticky top-20 space-y-5">
                <AdPlaceholder
                  dimensions="160 x 600"
                  formatName="Wide Skyscraper"
                  minHeight="560px"
                  className="w-[160px] mx-auto"
                />

                {/* Left Courses Filter Card */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs">
                  <button
                    onClick={() => setIsCourseOpen(!isCourseOpen)}
                    className="w-full flex items-center justify-between font-bold text-slate-900 text-xs pb-2 border-b border-slate-100"
                  >
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      Select Courses
                      {selectedCourse && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </span>
                    {isCourseOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  {isCourseOpen && (
                    <div className="mt-2.5 space-y-2">
                      <input
                        type="text"
                        placeholder="Search courses..."
                        value={courseFilterSearch}
                        onChange={(e) => setCourseFilterSearch(e.target.value)}
                        className="w-full text-xs px-2 py-1 rounded bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />

                      <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
                        {displayedCourses.length === 0 ? (
                          <div className="text-xs text-slate-400 py-2 text-center">No courses found</div>
                        ) : (
                          displayedCourses.map((c) => {
                            const isChecked = selectedCourse === (c.slug || c._id);
                            return (
                              <label
                                key={c._id}
                                className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-xs cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-blue-50 text-blue-700 font-semibold'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleCourseClick(c.slug || c._id)}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                                />
                                <span className="line-clamp-1">{c.name}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Left Statewise Institutes Filter Card */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs">
                  <button
                    onClick={() => setIsStateOpen(!isStateOpen)}
                    className="w-full flex items-center justify-between font-bold text-slate-900 text-xs pb-2 border-b border-slate-100"
                  >
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      Statewise Institutes
                      {selectedState && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                    </span>
                    {isStateOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  {isStateOpen && (
                    <div className="mt-2.5 space-y-2">
                      <input
                        type="text"
                        placeholder="Search states..."
                        value={stateFilterSearch}
                        onChange={(e) => setStateFilterSearch(e.target.value)}
                        className="w-full text-xs px-2 py-1 rounded bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />

                      <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
                        {displayedStates.length === 0 ? (
                          <div className="text-xs text-slate-400 py-2 text-center">No states found</div>
                        ) : (
                          displayedStates.map((s) => {
                            const isSelected = selectedState === (s.slug || s._id);
                            return (
                              <button
                                key={s._id}
                                onClick={() => handleStateClick(s.slug || s._id)}
                                className={`w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <span className="line-clamp-1">{s.name}</span>
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Filter Trigger Button */}
              <div className="lg:hidden">
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300/80 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50"
                >
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  <span>Filter by Courses &amp; States</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-blue-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </aside>

            {/* ================= CENTER CONTENT (Wide Area) ================= */}
            <section className="flex-1 min-w-0 space-y-5">
              {/* Top Leaderboard Ad Placeholder (Centered) */}
              <div className="flex justify-center w-full">
                <AdPlaceholder
                  dimensions="728 x 90"
                  formatName="Leaderboard / Responsive Banner"
                  minHeight="90px"
                  className="max-w-[728px] w-full"
                />
              </div>

              {/* Active Filter Chips, Search & Controls Toolbar */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-semibold text-slate-700 whitespace-nowrap">
                    Showing <strong className="text-slate-900">{startItem}–{endItem}</strong> of{' '}
                    <strong className="text-slate-900">{totalCount}</strong> Institutes
                  </span>

                  {/* Active Filter Badges */}
                  {selectedState && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium border border-emerald-200">
                      State: {selectedState}
                      <button onClick={() => handleStateClick(selectedState)}>
                        <X className="w-3 h-3 hover:text-emerald-900" />
                      </button>
                    </span>
                  )}

                  {selectedCourse && (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium border border-blue-200">
                      Course: {selectedCourse}
                      <button onClick={() => handleCourseClick(selectedCourse)}>
                        <X className="w-3 h-3 hover:text-blue-900" />
                      </button>
                    </span>
                  )}

                  {selectedCity && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium border border-amber-200">
                      City: {selectedCity}
                      <button onClick={() => setSelectedCity('')}>
                        <X className="w-3 h-3 hover:text-amber-900" />
                      </button>
                    </span>
                  )}

                  {activeSearch && (
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs font-medium border border-slate-200">
                      &quot;{activeSearch}&quot;
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setActiveSearch('');
                          updateQueryString({ search: '' });
                        }}
                      >
                        <X className="w-3 h-3 hover:text-slate-900" />
                      </button>
                    </span>
                  )}

                  {activeFiltersCount > 0 && (
                    <button
                      onClick={handleClearFilters}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline ml-1"
                    >
                      Reset all
                    </button>
                  )}
                </div>

                {/* Right controls: Search bar, Per Page & Sort dropdowns */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto">
                  {/* Search Input within Filter Toolbar */}
                  <form
                    onSubmit={handleSearchSubmit}
                    className="relative flex items-center flex-1 sm:w-64 md:w-72"
                  >
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by name, city, course..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-16 py-1.5 text-xs text-slate-800 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition shadow-2xs"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          if (activeSearch) {
                            setActiveSearch('');
                            setPage(1);
                            updateQueryString({ search: '', page: 1 });
                          }
                        }}
                        className="absolute right-14 text-slate-400 hover:text-slate-600 p-0.5"
                        aria-label="Clear search"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="submit"
                      className="absolute right-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
                    >
                      Search
                    </button>
                  </form>

                  <div className="flex items-center gap-2.5 text-xs text-slate-500 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="hidden sm:inline">Per page:</span>
                      <select
                        value={limit}
                        onChange={(e) => {
                          const newLimit = Number(e.target.value);
                          setLimit(newLimit);
                          setPage(1);
                          updateQueryString({ limit: newLimit, page: 1 });
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value={20}>20</option>
                        <option value={40}>40</option>
                        <option value={60}>60</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="hidden sm:inline">Sort by:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="latest">Latest</option>
                        <option value="name_asc">Name (A - Z)</option>
                        <option value="name_desc">Name (Z - A)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Institutes Grid / List - 4 columns, up to 20 institutes per page */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {[...Array(8)].map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl border border-slate-200 p-3 animate-pulse space-y-2"
                    >
                      <div className="w-full h-40 sm:h-44 bg-slate-200 rounded-lg" />
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-7 bg-slate-200 rounded mt-3" />
                    </div>
                  ))}
                </div>
              ) : institutes.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-xs">
                  <School className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-slate-900 mb-1">No Institutes Found</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                    We couldn&apos;t find any institutes matching your current filters. Try searching for a different keyword or resetting your filters.
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* The 4-column institutes grid showing 20 institutes (5 neat rows) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {institutes.map((inst, index) => (
                      <React.Fragment key={inst._id}>
                        <InstituteCard inst={inst} />

                        {/* In-feed AdSense slot after row 2 (index 7 = 8th card) */}
                        {index === 7 && institutes.length > 8 && (
                          <div className="col-span-1 sm:col-span-2 lg:col-span-4 my-2">
                            <div className="flex justify-center w-full">
                              <AdPlaceholder
                                dimensions="728 x 90"
                                formatName="Sponsored Directory / Leaderboard"
                                minHeight="90px"
                                className="max-w-[728px] w-full"
                              />
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Professional Pagination Bar */}
                  {totalPages > 1 && (
                    <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
                      {/* Previous Page Button */}
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors text-slate-700"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>

                      {/* Numbered Page Buttons with Ellipsis */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {pageNumbers.map((p, idx) => {
                          if (p === '...') {
                            return (
                              <span
                                key={`ellipsis-${idx}`}
                                className="px-2 py-1 text-xs text-slate-400 select-none font-semibold"
                              >
                                &hellip;
                              </span>
                            );
                          }
                          const isCurrent = p === page;
                          return (
                            <button
                              key={`page-${p}`}
                              onClick={() => handlePageChange(p)}
                              className={`w-7 h-7 flex items-center justify-center text-xs font-semibold rounded-lg transition-colors ${
                                isCurrent
                                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                                  : 'text-slate-700 hover:bg-slate-100 border border-slate-200/70'
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>

                      {/* Next Page Button */}
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors text-slate-700"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ================= RIGHT SIDEBAR (Slim width) ================= */}
            <aside className="w-full lg:w-[200px] xl:w-[210px] shrink-0 space-y-5">
              {/* Right Vertical AdSense Space (160 x 600 Wide Skyscraper) */}
              <div className="sticky top-20 space-y-5">
                <AdPlaceholder
                  dimensions="160 x 600"
                  formatName="Wide Skyscraper"
                  minHeight="560px"
                  className="w-[160px] mx-auto hidden lg:flex"
                />

                {/* Popular Coaching Hubs Widget */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs">
                  <h3 className="font-bold text-slate-900 text-xs mb-2.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    Top Coaching Cities
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {POPULAR_HUBS.map((hub) => {
                      const isSelected = selectedCity.toLowerCase() === hub.name.toLowerCase();
                      return (
                        <button
                          key={hub.name}
                          onClick={() => handleCityClick(hub.name)}
                          className={`text-[11px] px-2 py-0.5 rounded border transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white font-semibold border-blue-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                          }`}
                        >
                          {hub.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Trust & Verification Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-xl border border-blue-100 p-3.5 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-2 shadow-xs">
                    <Award className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs mb-1">
                    Verified Institute Listings
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Education Masters verifies academy credentials, direct faculty contact details, and updated course curricula for students.
                  </p>
                </div>
              </div>
            </aside>
          </div>

          {/* ================= BOTTOM AD BANNER ================= */}
          <div className="flex justify-center w-full mt-8">
            <AdPlaceholder
              dimensions="970 x 250"
              formatName="Billboard / Leaderboard Ad"
              minHeight="140px"
              className="max-w-[970px] w-full"
            />
          </div>
        </div>

        {/* ================= MOBILE FILTER DRAWER ================= */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setMobileFilterOpen(false)}
            />
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <div className="w-screen max-w-sm bg-white shadow-xl flex flex-col p-6 space-y-6 overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                    Filters
                  </h2>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* State Filter Section */}
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-2">Select State</h3>
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {statesList.map((s) => {
                      const isSelected = selectedState === (s.slug || s._id);
                      return (
                        <button
                          key={s._id}
                          onClick={() => handleStateClick(s.slug || s._id)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{s.name}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Courses Filter Section */}
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-2">Select Course</h3>
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {coursesList.map((c) => {
                      const isChecked = selectedCourse === (c.slug || c._id);
                      return (
                        <button
                          key={c._id}
                          onClick={() => handleCourseClick(c.slug || c._id)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                            isChecked
                              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{c.name}</span>
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Drawer Footer Buttons */}
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-3">
                  <button
                    onClick={handleClearFilters}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Reset All
                  </button>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function InstitutesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      }
    >
      <InstitutesContent />
    </Suspense>
  );
}
