'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  MapPin,
  Search,
  RotateCcw,
  SlidersHorizontal,
  X,
  Sparkles,
  Briefcase,
  Building2,
  Calendar,
  Check,
} from 'lucide-react';
import StateLink from '@/components/StateLink';
import { INDIAN_STATES_DATA } from '@/utils/indianStatesData';
import { getImageUrl } from '@/utils/image';
import { API_BASE } from '@/utils/api';

const LIMIT = 12;

// Built-in Country Presets
const DEFAULT_COUNTRIES = [
  { code: 'IN', slug: 'india', name: 'India', flag: '🇮🇳' },
  { code: 'ALL', slug: 'all', name: 'All Countries', flag: '🌍' },
  { code: 'US', slug: 'united-states', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', slug: 'united-kingdom', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', slug: 'canada', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', slug: 'australia', name: 'Australia', flag: '🇦🇺' },
  { code: 'AE', slug: 'united-arab-emirates', name: 'UAE', flag: '🇦🇪' },
  { code: 'SG', slug: 'singapore', name: 'Singapore', flag: '🇸🇬' },
  { code: 'DE', slug: 'germany', name: 'Germany', flag: '🇩🇪' },
];

// Popular States Quick-Filter Chips
const POPULAR_STATES = [
  { name: 'All Jobs', slug: 'all', shortName: 'All Expiring' },
  { name: 'Delhi', slug: 'delhi', shortName: 'Delhi' },
  { name: 'Uttar Pradesh', slug: 'uttar-pradesh', shortName: 'UP' },
  { name: 'Bihar', slug: 'bihar', shortName: 'Bihar' },
  { name: 'Rajasthan', slug: 'rajasthan', shortName: 'Rajasthan' },
  { name: 'Maharashtra', slug: 'maharashtra', shortName: 'Maharashtra' },
  { name: 'Madhya Pradesh', slug: 'madhya-pradesh', shortName: 'MP' },
  { name: 'Haryana', slug: 'haryana', shortName: 'Haryana' },
  { name: 'Uttarakhand', slug: 'uttarakhand', shortName: 'Uttarakhand' },
  { name: 'West Bengal', slug: 'west-bengal', shortName: 'West Bengal' },
  { name: 'Punjab', slug: 'punjab', shortName: 'Punjab' },
];

function JobsExpiringContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial Filter State from URL
  const initialCountry = searchParams.get('country') || 'india';
  const initialState = searchParams.get('state') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [jobs, setJobs] = useState([]);
  const [expiringJobs, setExpiringJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [rightTab, setRightTab] = useState('expiring');

  // Filter States
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [selectedState, setSelectedState] = useState(initialState);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);

  // Dynamic States & Countries data from API
  const [statesList, setStatesList] = useState(INDIAN_STATES_DATA);
  const [countriesList, setCountriesList] = useState(DEFAULT_COUNTRIES);

  // Fetch dynamic states & countries on mount
  useEffect(() => {
    const loadTaxonomies = async () => {
      try {
        const [statesRes, countriesRes] = await Promise.all([
          fetch(`${API_BASE}/states?all=true`).then((r) => r.json()).catch(() => null),
          fetch(`${API_BASE}/countries?all=true`).then((r) => r.json()).catch(() => null),
        ]);

        if (statesRes?.success && Array.isArray(statesRes.data) && statesRes.data.length > 0) {
          const apiStates = statesRes.data.map((s) => ({
            name: s.name,
            slug: s.slug || s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            aliases: s.aliases || [],
          }));
          setStatesList(apiStates);
        }

        if (countriesRes?.success && Array.isArray(countriesRes.data) && countriesRes.data.length > 0) {
          const apiCountries = countriesRes.data.map((c) => ({
            name: c.name,
            slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            code: c.code || '',
            flag: c.code === 'IN' ? '🇮🇳' : c.code === 'US' ? '🇺🇸' : c.code === 'GB' ? '🇬🇧' : '🌍',
          }));
          setCountriesList([{ code: 'ALL', slug: 'all', name: 'All Countries', flag: '🌍' }, ...apiCountries]);
        }
      } catch (err) {
        console.error('Error fetching taxonomies:', err);
      }
    };
    loadTaxonomies();
  }, []);

  // Fetch Expiring Jobs function
  const fetchJobs = useCallback(
    async (pageNum, country, state, search) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: LIMIT.toString(),
          days: '30',
        });

        if (country && country !== 'all') {
          params.append('country', country);
        }
        if (state && state !== 'all') {
          params.append('state', state);
        }
        if (search) {
          params.append('search', search);
        }

        const res = await fetch(`${API_BASE}/jobs/expiring-soon?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch jobs expiring soon');

        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setJobs(json.data);
          setTotalJobs(json.total || json.count || 0);
          setTotalPages(json.pages || 1);
        } else {
          setJobs([]);
          setTotalJobs(0);
          setTotalPages(1);
        }
      } catch (err) {
        console.error('Error fetching expiring jobs:', err);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch Sidebar Expiring Jobs
  const fetchExpiringSidebar = useCallback(async (stateFilter) => {
    try {
      const stateParam = stateFilter && stateFilter !== 'all' ? `&state=${encodeURIComponent(stateFilter)}` : '';
      const res = await fetch(`${API_BASE}/jobs/expiring-soon?limit=6&days=30${stateParam}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setExpiringJobs(json.data);
      } else {
        setExpiringJobs([]);
      }
    } catch (err) {
      console.error('Error fetching expiring jobs for sidebar:', err);
      setExpiringJobs([]);
    }
  }, []);

  useEffect(() => {
    fetchExpiringSidebar(selectedState);
  }, [selectedState, fetchExpiringSidebar]);

  // Main data fetch effect
  useEffect(() => {
    fetchJobs(page, selectedCountry, selectedState, searchQuery);

    // Sync browser URL query string with selected filters
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (selectedCountry && selectedCountry !== 'india' && selectedCountry !== 'all') {
      params.set('country', selectedCountry);
    }
    if (selectedState && selectedState !== 'all') {
      params.set('state', selectedState);
    }
    if (searchQuery && searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }

    const newUrl = params.toString() ? `/jobs-expiring-in-30-days?${params.toString()}` : '/jobs-expiring-in-30-days';
    window.history.replaceState(null, '', newUrl);
  }, [page, selectedCountry, selectedState, searchQuery, fetchJobs]);

  // Sync state if URL searchParams change externally
  useEffect(() => {
    const urlCountry = searchParams.get('country') || 'india';
    const urlState = searchParams.get('state') || 'all';
    const urlSearch = searchParams.get('search') || '';

    if (urlCountry !== selectedCountry) setSelectedCountry(urlCountry);
    if (urlState !== selectedState) setSelectedState(urlState);
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
      setSearchInput(urlSearch);
    }
  }, [searchParams]);

  // Handlers
  const handleCountrySelect = (countrySlug) => {
    setSelectedCountry(countrySlug);
    setSelectedState('all');
    setPage(1);
  };

  const handleStateSelect = (stateSlug) => {
    setSelectedState(stateSlug);
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSelectedCountry('india');
    setSelectedState('all');
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  };

  const hasActiveFilters =
    selectedCountry !== 'india' ||
    selectedState !== 'all' ||
    Boolean(searchQuery);

  // Active state name for dynamic title & badge
  const activeStateName = useMemo(() => {
    if (!selectedState || selectedState === 'all') return null;
    if (selectedState === 'all-india') return 'All India / Central Govt';
    const found = statesList.find((s) => s.slug === selectedState || s.name.toLowerCase() === selectedState.toLowerCase());
    return found ? found.name : selectedState.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }, [selectedState, statesList]);

  const activeCountryName = useMemo(() => {
    if (!selectedCountry || selectedCountry === 'all') return 'All Countries';
    const found = countriesList.find((c) => c.slug === selectedCountry);
    return found ? found.name : selectedCountry;
  }, [selectedCountry, countriesList]);

  // Page Dynamic Heading
  const pageTitle = useMemo(() => {
    if (activeStateName) {
      if (selectedState === 'all-india') {
        return 'All India Jobs Expiring in 30 Days';
      }
      return `${activeStateName} Jobs Expiring in 30 Days`;
    }
    if (selectedCountry && selectedCountry !== 'india' && selectedCountry !== 'all') {
      return `${activeCountryName} Jobs Expiring in 30 Days`;
    }
    return 'Jobs Expiring in 30 Days';
  }, [activeStateName, activeCountryName, selectedCountry, selectedState]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Closing Soon';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime())
        ? dateStr
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getPaginationItems = (current, total) => {
    if (total <= 9) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, 6, 7, '...', total];
    }
    if (current >= total - 3) {
      return [1, 2, '...', total - 5, total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 2, current - 1, current, current + 1, current + 2, '...', total];
  };

  const startItem = totalJobs === 0 ? 0 : (page - 1) * LIMIT + 1;
  const endItem = Math.min(page * LIMIT, totalJobs);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans">
      <Header />

      {/* Main Container with Ad Slits */}
      <div className="max-w-[1550px] mx-auto px-3 sm:px-4 py-6 flex-1 w-full bg-white">
        {/* 4-COLUMN RESPONSIVE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* 1. LEFT SKYSCRAPER AD SPACE */}
          <aside className="hidden xl:block xl:col-span-2 sticky top-20">
            <div className="bg-[#e7f9ee] border border-[#a3e6be] rounded border-dashed p-4 min-h-[600px] flex flex-col items-center justify-between text-center relative overflow-hidden group">
              <div className="w-full flex items-center justify-between text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                <span>Available at</span>
                <span className="font-extrabold text-xs">GoDaddy</span>
              </div>

              <div className="my-auto space-y-4">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto shadow-md">
                  Go
                </div>
                <h4 className="font-black text-slate-900 text-base leading-tight">
                  GET A .AI DOMAIN NAME.
                </h4>
                <div className="text-2xl font-black text-emerald-800">.AI</div>
                <button className="bg-black hover:bg-zinc-800 text-white text-xs font-bold px-5 py-2 rounded transition shadow uppercase">
                  Start Today
                </button>
              </div>

              <span className="text-[10px] text-slate-400">Sponsored Banner</span>
            </div>
          </aside>

          {/* 2. MAIN JOBS STREAM */}
          <main className="col-span-1 lg:col-span-8 xl:col-span-7 space-y-4">

            {/* Breadcrumb Aligned with Content */}
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1 font-medium">
              <Link href="/" className="hover:text-blue-600 text-blue-600 underline">
                Home
              </Link>
              <span>›</span>
              <Link href="/jobs" className="hover:text-blue-600 text-blue-600 underline">
                Jobs
              </Link>
              <span>›</span>
              <span className="text-slate-800 font-bold">Expiring in 30 Days</span>
              {activeStateName && (
                <>
                  <span>›</span>
                  <span className="text-slate-800 font-bold">{activeStateName}</span>
                </>
              )}
            </div>

            {/* Title Header */}
            <div className="border-b border-slate-200 pb-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {pageTitle}
              </h1>
            </div>

            {/* ========================================================= */}
            {/* PREMIUM COMPACT COUNTRY & STATE FILTER BAR                */}
            {/* ========================================================= */}
            {/* ========================================================= */}
            {/* PREMIUM COMPACT COUNTRY & STATE FILTER BAR                */}
            {/* ========================================================= */}
            <div className="bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 border border-slate-200/90 rounded-xl p-2.5 sm:p-3.5 shadow-2xs space-y-2.5">

              {/* Top Controls Row: 2-col dropdowns + full width search on mobile, single flex line on desktop */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">

                {/* Filter Icon Label (Desktop only) */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-800 pr-1 select-none shrink-0">
                  <SlidersHorizontal size={13} className="text-blue-600 shrink-0" />
                  <span>Filter:</span>
                </div>

                {/* Dropdowns Group: 2-column grid on mobile, flex on desktop */}
                <div className={`grid gap-1.5 sm:flex sm:items-center sm:gap-2 ${
                  selectedCountry === 'india' || selectedCountry === 'all'
                    ? 'grid-cols-2'
                    : 'grid-cols-1'
                }`}>
                  {/* 1. Country Dropdown */}
                  <div className="relative w-full sm:w-auto">
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600 flex items-center">
                      <Globe size={13} />
                    </div>
                    <select
                      value={selectedCountry}
                      onChange={(e) => handleCountrySelect(e.target.value)}
                      className="w-full sm:w-auto pl-7 pr-6 py-1.5 sm:py-1 text-xs font-medium bg-white text-slate-800 border border-slate-300 rounded-lg hover:border-blue-400 focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs cursor-pointer appearance-none transition truncate"
                      aria-label="Filter by Country"
                    >
                      {countriesList.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.flag ? `${c.flag} ` : ''}{c.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                      ▼
                    </div>
                  </div>

                  {/* 2. State Dropdown (Active when Country is India or All) */}
                  {(selectedCountry === 'india' || selectedCountry === 'all') && (
                    <div className="relative w-full sm:w-auto">
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-rose-500 flex items-center">
                        <MapPin size={13} />
                      </div>
                      <select
                        value={selectedState}
                        onChange={(e) => handleStateSelect(e.target.value)}
                        className={`w-full sm:w-auto pl-7 pr-6 py-1.5 sm:py-1 text-xs font-medium bg-white border rounded-lg focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs cursor-pointer appearance-none transition truncate ${
                          selectedState !== 'all'
                            ? 'border-blue-500 text-blue-800 font-semibold bg-blue-50/30'
                            : 'border-slate-300 text-slate-800 hover:border-blue-400'
                        }`}
                        aria-label="Filter by State"
                      >
                        <option value="all">📍 All States &amp; UTs</option>
                        <option value="all-india">🌟 All India (Central)</option>
                        <option disabled>──────────────</option>
                        {statesList.map((st) => (
                          <option key={st.slug} value={st.slug}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                        ▼
                      </div>
                    </div>
                  )}
                </div>

                {/* Search Form + Buttons: Full width on mobile, inline flex on desktop */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto sm:flex-1 sm:max-w-xs">
                  <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="relative flex-1 min-w-0">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search title, post, dept..."
                        className="w-full pl-8 pr-6 py-1.5 sm:py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-2xs placeholder:text-slate-400"
                      />
                      {searchInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchInput('');
                            setSearchQuery('');
                            setPage(1);
                          }}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 sm:py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer shrink-0"
                    >
                      Go
                    </button>
                  </form>

                  {/* Clear / Reset Filter Button */}
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:py-1 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition shadow-2xs cursor-pointer shrink-0"
                      title="Reset all filters"
                    >
                      <RotateCcw size={11} />
                      <span className="hidden min-[360px]:inline">Reset</span>
                    </button>
                  )}
                </div>

              </div>

              {/* Bottom Quick State Chips (For India) */}
              {(selectedCountry === 'india' || selectedCountry === 'all') && (
                <div
                  className="no-scrollbar hide-scrollbar pt-2 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-0.5 select-none">
                    <Sparkles size={10} className="text-amber-500" />
                    Quick:
                  </span>

                  {/* All Expiring Button */}
                  <button
                    type="button"
                    onClick={() => handleStateSelect('all')}
                    className={`px-2.5 py-0.5 text-[11px] font-medium rounded-md whitespace-nowrap transition cursor-pointer shrink-0 ${
                      selectedState === 'all'
                        ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    All Expiring
                  </button>

                  {POPULAR_STATES.filter(st => st.slug !== 'all-india' && st.slug !== 'all').map((st) => {
                    const isActive = selectedState === st.slug;
                    return (
                      <button
                        key={st.slug}
                        type="button"
                        onClick={() => handleStateSelect(st.slug)}
                        className={`px-2.5 py-0.5 text-[11px] font-medium rounded-md whitespace-nowrap transition cursor-pointer shrink-0 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {st.shortName}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Active Filter Summary Bar */}
              {hasActiveFilters && (
                <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-500 font-medium text-[11px]">Active:</span>
                    {selectedCountry !== 'india' && selectedCountry !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100/70 text-blue-800 rounded font-medium text-[11px] border border-blue-200">
                        <Globe size={10} />
                        <span>{activeCountryName}</span>
                        <button
                          type="button"
                          onClick={() => handleCountrySelect('india')}
                          className="hover:text-blue-900 ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {selectedState !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100/70 text-blue-800 rounded font-medium text-[11px] border border-blue-200">
                        <MapPin size={10} />
                        <span>{activeStateName}</span>
                        <button
                          type="button"
                          onClick={() => handleStateSelect('all')}
                          className="hover:text-blue-900 ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {searchQuery && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-medium text-[11px]">
                        <span>&ldquo;{searchQuery}&rdquo;</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setSearchInput('');
                            setPage(1);
                          }}
                          className="hover:text-slate-900 ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500 font-medium text-[11px]">
                    {totalJobs} Jobs expiring soon
                  </span>
                </div>
              )}
            </div>

            {/* Loading Indicator */}
            {loading && (
              <div className="space-y-4 pt-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="py-5 border-b border-slate-200 flex flex-col sm:flex-row gap-4 sm:gap-5 animate-pulse"
                  >
                    <div className="w-full sm:w-72 h-44 bg-slate-200 rounded shrink-0" />
                    <div className="flex-1 space-y-2.5">
                      <div className="h-5 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-10 bg-slate-200 rounded w-full" />
                      <div className="h-3 bg-slate-200 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && jobs.length === 0 && (
              <div className="py-12 px-4 text-center bg-slate-50 border border-slate-200 rounded-lg">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Briefcase size={24} />
                </div>
                <h3 className="text-base font-semibold text-slate-800">
                  No expiring jobs found
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  No active recruitment notifications found expiring in 30 days for the selected filter.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition"
                  >
                    Clear All Filters
                  </button>
                  <Link
                    href="/jobs"
                    className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded hover:bg-slate-50 transition"
                  >
                    View All Jobs
                  </Link>
                </div>
              </div>
            )}

            {/* Main Job Cards Feed */}
            {!loading && jobs.length > 0 && (
              <div className="divide-y divide-slate-200">
                {jobs.map((job) => {
                  const mediaUrl = getImageUrl(job.featured_media);

                  return (
                    <article
                      key={job._id}
                      className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 sm:gap-5 group"
                    >
                      {/* Left Thumbnail Image */}
                      <div className="w-full sm:w-72 h-44 sm:h-44 border border-slate-200 rounded-sm overflow-hidden bg-slate-50 shrink-0 relative">
                        <img
                          src={mediaUrl}
                          alt={job.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            if (!e.currentTarget.dataset.fallback) {
                              e.currentTarget.dataset.fallback = 'true';
                              e.currentTarget.src = '/job-search.png';
                            } else {
                              e.currentTarget.style.display = 'none';
                            }
                          }}
                        />
                      </div>

                      {/* Right Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <Link href={`/job/${job.slug || job._id}`}>
                            <h2 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                              {job.title}
                            </h2>
                          </Link>

                          {/* Meta Information Line */}
                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500 font-medium mt-1">
                            <span>
                              By{' '}
                              <Link
                                href={`/author/${job.author?.nicename || job.author?.name || 'DigitalDeepak'}`}
                                className="text-slate-700 font-medium hover:text-blue-600 hover:underline"
                              >
                                {job.author?.name || 'Mohit'}
                              </Link>
                            </span>
                            <span>|</span>
                            <span>
                              In <strong className="text-slate-800 font-medium">Jobs</strong>
                            </span>
                            <span>|</span>
                            <span>{formatDate(job.created_at || job.createdAt)}</span>
                            <span>|</span>
                            <StateLink state={job.state} dept={job.dept} />
                          </div>

                          {/* Excerpt Snippet */}
                          <p className="text-xs sm:text-sm text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                            {job.description?.replace(/<[^>]*>?/gm, '') ||
                              `Apply online for ${job.title}. Check complete eligibility, fees, vacancy details, and official notification.`}
                          </p>
                        </div>

                        {/* Last Date Highlight */}
                        <div className="mt-4 text-xs text-slate-700">
                          Last Date:{' '}
                          <span className="text-slate-900 font-semibold">
                            {formatDate(job.app_ends || job.dates?.last_date)}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && totalJobs > 0 && (
              <div className="pt-6 pb-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs sm:text-sm text-slate-500 font-medium">
                  Showing {startItem} to {endItem} of {totalJobs} results
                </div>

                <div className="inline-flex items-center rounded-md border border-slate-200 bg-white overflow-hidden text-xs sm:text-sm shadow-xs">
                  {/* Previous button */}
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed border-r border-slate-200 transition font-medium"
                    aria-label="Previous Page"
                  >
                    ‹
                  </button>

                  {/* Page number buttons */}
                  {getPaginationItems(page, totalPages).map((item, index) => {
                    if (item === '...') {
                      return (
                        <span
                          key={`dots-${index}`}
                          className="px-3 py-1.5 text-slate-400 border-r border-slate-200 font-medium select-none"
                        >
                          ...
                        </span>
                      );
                    }

                    const isCurrent = item === page;
                    return (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={`px-3 py-1.5 transition border-r border-slate-200 last:border-r-0 ${isCurrent
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-blue-600 hover:bg-slate-50 font-medium'
                          }`}
                      >
                        {item}
                      </button>
                    );
                  })}

                  {/* Next button */}
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition font-medium"
                    aria-label="Next Page"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* 3. RIGHT SIDEBAR WIDGET */}
          <aside className="col-span-1 lg:col-span-4 xl:col-span-3 space-y-6 sticky top-20">
            {/* Widget Box: Jobs Expiring Soon / MCQ Questions */}
            <div className="bg-[#f0f2f5] border border-slate-300 rounded-lg overflow-hidden">
              {/* Tab Header */}
              <div className="flex items-center bg-[#e4e7ec] border-b border-slate-300">
                <button
                  onClick={() => setRightTab('expiring')}
                  className={`flex-1 py-3.5 px-3 text-center text-xs sm:text-sm whitespace-nowrap font-normal transition ${rightTab === 'expiring'
                      ? 'bg-[#f0f2f5] text-slate-900 rounded-tl-lg font-medium'
                      : 'text-blue-600 hover:text-blue-700 font-medium'
                    }`}
                >
                  Jobs Expiring Soon
                </button>
                <button
                  onClick={() => setRightTab('mcq')}
                  className={`flex-1 py-3.5 px-3 text-center text-xs sm:text-sm whitespace-nowrap font-normal transition ${rightTab === 'mcq'
                      ? 'bg-[#f0f2f5] text-slate-900 rounded-tr-lg font-medium'
                      : 'text-blue-600 hover:text-blue-700 font-medium'
                    }`}
                >
                  MCQ Questions
                </button>
              </div>

              {/* Widget Body */}
              <div className="p-4 bg-[#f0f2f5]">
                {rightTab === 'expiring' ? (
                  <div>
                    {/* Badge & Info Line */}
                    <div className="flex items-center justify-between text-[11px] sm:text-xs mb-3 pb-2.5 border-b border-slate-300 gap-1.5">
                      <span className="text-slate-700 font-normal whitespace-nowrap">
                        {selectedState && selectedState !== 'all' && activeStateName
                          ? `${expiringJobs.length > 0 ? expiringJobs.length : totalJobs} ${activeStateName} Jobs expiring in 30 Days`
                          : `${totalJobs > 0 ? totalJobs : 28} Jobs are expiring in 30 Days`}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link
                          href={selectedState && selectedState !== 'all' ? `/jobs-expiring-in-30-days?state=${encodeURIComponent(selectedState)}` : '/jobs-expiring-in-30-days'}
                          className="text-blue-600 font-normal hover:underline whitespace-nowrap text-[11px] sm:text-xs"
                        >
                          View All
                        </Link>
                        <span className="bg-blue-600 text-white text-[10px] sm:text-[11px] font-normal px-1.5 py-0.5 rounded inline-flex items-center gap-1 leading-none whitespace-nowrap shadow-2xs">
                          <span>📰</span>
                          <span>Jobs</span>
                        </span>
                      </div>
                    </div>

                    {/* Mini Jobs Cards List */}
                    {expiringJobs.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500 font-medium">
                        No active expiring jobs found{activeStateName ? ` for ${activeStateName}` : ''}.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-300">
                        {expiringJobs.map((item) => {
                          const miniMediaUrl = getImageUrl(item.featured_media);

                          return (
                            <Link
                              key={item._id}
                              href={`/job/${item.slug || item._id}`}
                              className="py-3.5 first:pt-1 last:pb-1 flex items-start gap-3.5 group transition"
                            >
                              {/* Thumbnail Image */}
                              <div className="w-28 sm:w-32 h-20 bg-white rounded border border-slate-300 overflow-hidden shrink-0 shadow-2xs">
                                <img
                                  src={miniMediaUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    if (!e.currentTarget.dataset.fallback) {
                                      e.currentTarget.dataset.fallback = 'true';
                                      e.currentTarget.src = '/job-search.png';
                                    } else {
                                      e.currentTarget.style.display = 'none';
                                    }
                                  }}
                                />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                  {item.title}
                                </h4>
                                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                                  <span>{formatDate(item.app_ends || item.dates?.last_date)}</span>
                                  <span className="text-blue-600 font-medium">Jobs</span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    <p>Practice latest competitive exam questions.</p>
                    <Link
                      href="/mcq-questions"
                      className="mt-2 inline-block text-blue-600 font-semibold hover:underline"
                    >
                      Browse MCQ Questions →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Sponsored / Promo Box */}
            <div className="bg-[#e7f9ee] border border-[#a3e6be] rounded border-dashed p-4 min-h-[320px] flex flex-col items-center justify-between text-center relative overflow-hidden group">
              <div className="w-full flex items-center justify-between text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                <span>Available at</span>
                <span className="font-extrabold text-xs">GoDaddy</span>
              </div>

              <div className="my-auto space-y-3">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto shadow-md">
                  Go
                </div>
                <h4 className="font-black text-slate-900 text-sm leading-tight">
                  GET A .AI DOMAIN NAME.
                </h4>
                <div className="text-xl font-black text-emerald-800">.AI</div>
                <button className="bg-black hover:bg-zinc-800 text-white text-xs font-bold px-4 py-1.5 rounded transition shadow uppercase">
                  Start Today
                </button>
              </div>

              <span className="text-[10px] text-slate-400">Sponsored Banner</span>
            </div>
          </aside>

        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function JobsExpiringClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <JobsExpiringContent />
    </Suspense>
  );
}
