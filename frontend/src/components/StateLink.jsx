import React from 'react';
import Link from 'next/link';
import { INDIAN_STATES_DATA } from '@/utils/indianStatesData';

export { INDIAN_STATES_DATA };

/**
 * Match a raw state string, object, or department text to a known State & slug
 */
export function parseStateInfo(state, dept) {
  // Case 1: State object
  if (state && typeof state === 'object') {
    const stateName = state.name || '';
    const stateSlug = state.slug || (stateName ? stateName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '');
    
    if (stateName) {
      // Check if canonical entry matches
      const canonical = INDIAN_STATES_DATA.find(
        (s) => s.slug === stateSlug || s.name.toLowerCase() === stateName.toLowerCase()
      );

      return {
        name: canonical ? canonical.name : stateName,
        slug: canonical ? canonical.slug : stateSlug,
        isState: true,
      };
    }
  }

  // Case 2: State is a string
  if (typeof state === 'string' && state.trim()) {
    const trimmed = state.trim();
    const lower = trimmed.toLowerCase();

    if (lower === 'all india' || lower === 'national' || lower === 'india' || lower === '-- all india --' || lower === '— all india —') {
      return { name: 'All India', slug: '', isAllIndia: true };
    }

    const matched = INDIAN_STATES_DATA.find(
      (s) => s.name.toLowerCase() === lower || s.slug === lower || s.aliases.some((a) => a === lower)
    );

    if (matched) {
      return { name: matched.name, slug: matched.slug, isState: true };
    }

    // Guard against unpopulated MongoDB ObjectId hex strings or pure integer IDs
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(trimmed);
    const isNumericId = /^\d+$/.test(trimmed);
    if (!isObjectId && !isNumericId) {
      return {
        name: trimmed,
        slug: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        isState: true,
      };
    }
    // If it is an ID, fall through to check dept or fallback to All India
  }

  // Case 3: Dept string might contain state info or comma-separated location
  if (typeof dept === 'string' && dept.trim()) {
    const trimmedDept = dept.trim();
    const lowerDept = trimmedDept.toLowerCase();

    // Check exact match with a state
    const exactState = INDIAN_STATES_DATA.find(
      (s) => s.name.toLowerCase() === lowerDept || s.slug === lowerDept || s.aliases.some((a) => a === lowerDept)
    );
    if (exactState) {
      return { name: exactState.name, slug: exactState.slug, isState: true };
    }

    // Check if dept has comma or parenthesis with state name (e.g., "PGIMER, Chandigarh" or "APPSC, Andhra Pradesh")
    // Sort states by name length descending to avoid partial short matches
    const sortedStates = [...INDIAN_STATES_DATA].sort((a, b) => b.name.length - a.name.length);
    for (const s of sortedStates) {
      // Regex check with word boundaries for state name or major aliases
      const terms = [s.name, s.slug, ...s.aliases.filter(a => a.length > 2)];
      const pattern = new RegExp(`(?:,\\s*|\\bin\\s+|\\bfor\\s+|\\bat\\s+|\\(\\s*)(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?:\\s*\\)|$)`, 'i');
      
      const match = trimmedDept.match(pattern);
      if (match && match.index !== undefined) {
        const prefix = trimmedDept.slice(0, match.index).trim();
        const suffix = trimmedDept.slice(match.index + match[0].length).trim();
        return {
          prefix: prefix ? `${prefix}, ` : '',
          suffix: suffix ? ` ${suffix}` : '',
          name: s.name,
          slug: s.slug,
          isState: true,
        };
      }
    }

    // If no state found, render pure department text
    return {
      text: trimmedDept,
      isDept: true,
    };
  }

  // Default fallback
  return { name: 'All India', slug: '', isAllIndia: true };
}

/**
 * Reusable StateLink component that renders clickable state links styled uniformly
 */
export default function StateLink({
  state,
  dept,
  defaultStateName,
  defaultStateSlug,
  fallback = 'All India',
  className = 'text-slate-700 font-medium hover:text-blue-600 hover:underline transition-colors',
}) {
  // If explicitly given default state context (e.g. from state/[slug]/page.js)
  if (defaultStateName && defaultStateSlug && !state && !dept) {
    return (
      <Link href={`/state/${defaultStateSlug}`} className={className}>
        {defaultStateName}
      </Link>
    );
  }

  const info = parseStateInfo(state, dept);

  if (info.isAllIndia) {
    return (
      <Link href="/state" className={className}>
        {fallback}
      </Link>
    );
  }

  if (info.isState && info.slug) {
    return (
      <span>
        {info.prefix && <span className="text-slate-500 font-normal">{info.prefix}</span>}
        <Link href={`/state/${info.slug}`} className={className}>
          {info.name}
        </Link>
        {info.suffix && <span className="text-slate-500 font-normal">{info.suffix}</span>}
      </span>
    );
  }

  if (info.text) {
    return <span className="text-slate-700 font-medium">{info.text}</span>;
  }

  return (
    <Link href="/state" className={className}>
      {fallback}
    </Link>
  );
}
