'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Loader2,
  Check,
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export default function SearchableSelectPanel({
  title = 'Option',
  endpoint = '',
  selectedValue = '',
  onSelect = () => {},
  defaultOption = null, // e.g. { label: '— All India —', value: '-- All India --' }
  extraParams = {},
  dependency = null, // Trigger reload on dependency change
  displayField = 'name',
  valueField = 'name',
  pageSize = 10,
  initialCollapsed = false,
  emptyMessage = '',
}) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const isFirstMount = useRef(true);

  // Fetch items from backend API
  const fetchItems = useCallback(
    async (targetPage = 1, searchQuery = '', isAppend = false) => {
      if (!endpoint) return;

      if (isAppend) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const query = new URLSearchParams({
          page: String(targetPage),
          limit: String(pageSize),
        });

        if (searchQuery.trim()) {
          query.set('search', searchQuery.trim());
        }

        if (extraParams && typeof extraParams === 'object') {
          Object.entries(extraParams).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
              query.set(k, String(v));
            }
          });
        }

        const res = await fetch(`${BACKEND_URL}${endpoint}?${query.toString()}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          const newItems = data.data;
          setItems((prev) => (isAppend ? [...prev, ...newItems] : newItems));
          setPage(targetPage);
          const totalCount = data.total !== undefined ? data.total : data.count || newItems.length;
          setTotal(totalCount);
          const totalPages = data.pages || Math.ceil(totalCount / pageSize) || 1;
          setHasMore(targetPage < totalPages);
        } else {
          if (!isAppend) setItems([]);
          setHasMore(false);
        }
      } catch (err) {
        console.error(`Error fetching ${title}:`, err);
        if (!isAppend) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [endpoint, pageSize, title, JSON.stringify(extraParams)]
  );

  // Initial load or reload on dependency change
  useEffect(() => {
    fetchItems(1, search, false);
  }, [fetchItems, dependency]);

  // Debounced search handling
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      fetchItems(1, search, false);
    }, 250);

    return () => clearTimeout(timer);
  }, [search, fetchItems]);

  const handleLoadMore = (e) => {
    e.stopPropagation();
    if (loadingMore || !hasMore) return;
    fetchItems(page + 1, search, true);
  };

  const handleClearSearch = (e) => {
    e.stopPropagation();
    setSearch('');
  };

  // Determine current selected label
  const currentValStr = typeof selectedValue === 'object' && selectedValue !== null
    ? selectedValue[valueField] || selectedValue._id || ''
    : String(selectedValue || '');

  // Check if selected item is already present in items
  const isSelectedInList = items.some((item) => {
    const itemVal = typeof item === 'object' ? item[valueField] || item.name || item._id : item;
    return String(itemVal) === currentValStr;
  });

  const isDefaultSelected = defaultOption && (
    currentValStr === defaultOption.value ||
    currentValStr === defaultOption.label ||
    !currentValStr
  );

  return (
    <div className="bg-white border border-slate-300 rounded shadow-2xs">
      {/* Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-3.5 py-2 bg-[#f6f7f7] border-b border-slate-300 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors select-none"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-800">{title}</span>
          {total > 0 && (
            <span className="text-[10px] font-medium text-slate-500">
              ({items.length} of {total})
            </span>
          )}
        </div>
        {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="p-2.5 space-y-2 bg-white">
          {/* Search Box */}
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#2271b1] transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Options Container */}
          <div className="max-h-44 overflow-y-auto space-y-0.5 pr-1 border border-slate-200 rounded p-1 bg-slate-50/50">
            {/* Default Option if provided */}
            {defaultOption && (
              <label
                onClick={() => onSelect(defaultOption.value, defaultOption)}
                className={`flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                  isDefaultSelected
                    ? 'bg-blue-50 text-[#2271b1] font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="radio"
                    name={`radio-${title}`}
                    checked={isDefaultSelected}
                    onChange={() => onSelect(defaultOption.value, defaultOption)}
                    className="accent-[#2271b1] cursor-pointer"
                  />
                  <span className="truncate">{defaultOption.label}</span>
                </div>
                {isDefaultSelected && <Check size={12} className="text-[#2271b1] shrink-0" />}
              </label>
            )}

            {/* Pinned Selected Value if not in loaded list and not default */}
            {!isSelectedInList && !isDefaultSelected && currentValStr && (
              <label
                onClick={() => onSelect(currentValStr, { name: currentValStr })}
                className="flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition-colors bg-blue-50 text-[#2271b1] font-semibold"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="radio"
                    name={`radio-${title}`}
                    checked={true}
                    onChange={() => onSelect(currentValStr, { name: currentValStr })}
                    className="accent-[#2271b1] cursor-pointer"
                  />
                  <span className="truncate">{currentValStr}</span>
                </div>
                <Check size={12} className="text-[#2271b1] shrink-0" />
              </label>
            )}

            {/* Loading Initial Skeleton */}
            {loading && items.length === 0 ? (
              <div className="py-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <Loader2 size={13} className="animate-spin text-[#2271b1]" />
                <span>Loading {title.toLowerCase()}...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-400">
                {emptyMessage || `No ${title.toLowerCase()} found`}
              </div>
            ) : (
              items.map((item) => {
                const itemLabel = typeof item === 'object' ? item[displayField] || item.name : item;
                const itemVal = typeof item === 'object' ? item[valueField] || item.name || item._id : item;
                const itemKey = typeof item === 'object' ? item._id || item.slug || itemLabel : item;
                const isSelected = String(itemVal) === currentValStr;

                return (
                  <label
                    key={itemKey}
                    onClick={() => onSelect(itemVal, item)}
                    className={`flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-[#2271b1] font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="radio"
                        name={`radio-${title}`}
                        checked={isSelected}
                        onChange={() => onSelect(itemVal, item)}
                        className="accent-[#2271b1] cursor-pointer"
                      />
                      <span className="truncate">{itemLabel}</span>
                    </div>
                    {isSelected && <Check size={12} className="text-[#2271b1] shrink-0" />}
                  </label>
                );
              })
            )}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-1.5 text-center text-[11px] font-semibold text-[#2271b1] hover:text-[#135e96] hover:bg-blue-50/70 border border-blue-200 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Loading more...</span>
                  </>
                ) : (
                  <span>+ Load More {title} ({items.length} of {total})</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
