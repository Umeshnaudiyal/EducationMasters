'use client';

import React from 'react';
import Link from 'next/link';

// Comprehensive Indian States & UTs dictionary with canonical DB slugs and common aliases
export const INDIAN_STATES_DATA = [
  { name: 'Andaman & Nicobar', slug: 'andaman-nicobar', aliases: ['andaman nicobar', 'andaman and nicobar', 'andaman', 'nicobar'] },
  { name: 'Andhra Pradesh', slug: 'andhra-pradesh', aliases: ['andhra pradesh', 'andhra', 'ap'] },
  { name: 'Arunachal Pradesh', slug: 'arunchal-pradesh', aliases: ['arunachal pradesh', 'arunchal pradesh', 'arunachal', 'arunchal'] },
  { name: 'Assam', slug: 'assam', aliases: ['assam', 'as'] },
  { name: 'Bihar', slug: 'bihar', aliases: ['bihar', 'br'] },
  { name: 'Chandigarh', slug: 'chandigarh', aliases: ['chandigarh', 'ch'] },
  { name: 'Chhattisgarh', slug: 'chhatisgarh', aliases: ['chhattisgarh', 'chhatisgarh', 'cg'] },
  { name: 'Dadra & Nagar Haveli and Daman & Diu', slug: 'dadra-nagar-haveli-and-daman-diu', aliases: ['dadra & nagar haveli', 'daman and diu', 'daman & diu', 'dadra nagar haveli', 'daman', 'diu'] },
  { name: 'Delhi', slug: 'delhi', aliases: ['delhi', 'nct of delhi', 'new delhi', 'dl'] },
  { name: 'Goa', slug: 'goa', aliases: ['goa', 'ga'] },
  { name: 'Gujarat', slug: 'gujarat', aliases: ['gujarat', 'gj'] },
  { name: 'Haryana', slug: 'haryana', aliases: ['haryana', 'hr'] },
  { name: 'Himachal Pradesh', slug: 'himachal-pradesh', aliases: ['himachal pradesh', 'himachal', 'hp'] },
  { name: 'Jammu & Kashmir', slug: 'jammu-kashmir', aliases: ['jammu & kashmir', 'jammu and kashmir', 'jammu kashmir', 'jammu', 'kashmir', 'j&k', 'jk'] },
  { name: 'Jharkhand', slug: 'jharkhand', aliases: ['jharkhand', 'jh'] },
  { name: 'Karnataka', slug: 'karnatka', aliases: ['karnataka', 'karnatka', 'ka'] },
  { name: 'Kerala', slug: 'kerala', aliases: ['kerala', 'kl'] },
  { name: 'Ladakh', slug: 'laddakh', aliases: ['ladakh', 'laddakh', 'la'] },
  { name: 'Lakshadweep', slug: 'lakshadweep', aliases: ['lakshadweep', 'ld'] },
  { name: 'Madhya Pradesh', slug: 'madhya-pradesh', aliases: ['madhya pradesh', 'mp'] },
  { name: 'Maharashtra', slug: 'maharashtra', aliases: ['maharashtra', 'mh'] },
  { name: 'Manipur', slug: 'manipur', aliases: ['manipur', 'mn'] },
  { name: 'Meghalaya', slug: 'meghalaya', aliases: ['meghalaya', 'ml'] },
  { name: 'Mizoram', slug: 'mizoram', aliases: ['mizoram', 'mz'] },
  { name: 'Nagaland', slug: 'nagaland', aliases: ['nagaland', 'nl'] },
  { name: 'Odisha', slug: 'odisha', aliases: ['odisha', 'orissa', 'od', 'or'] },
  { name: 'Puducherry', slug: 'pondicherry', aliases: ['puducherry', 'pondicherry', 'py'] },
  { name: 'Punjab', slug: 'punjab', aliases: ['punjab', 'pb'] },
  { name: 'Rajasthan', slug: 'rajasthan', aliases: ['rajasthan', 'rj'] },
  { name: 'Sikkim', slug: 'sikkim', aliases: ['sikkim', 'sk'] },
  { name: 'Tamil Nadu', slug: 'tamil-nadu', aliases: ['tamil nadu', 'tamilnadu', 'tn'] },
  { name: 'Telangana', slug: 'telangana', aliases: ['telangana', 'ts', 'tg'] },
  { name: 'Tripura', slug: 'tripura', aliases: ['tripura', 'tr'] },
  { name: 'Uttar Pradesh', slug: 'uttar-pradesh', aliases: ['uttar pradesh', 'up'] },
  { name: 'Uttarakhand', slug: 'uttarakhand', aliases: ['uttarakhand', 'uttaranchal', 'uk'] },
  { name: 'West Bengal', slug: 'west-bengal', aliases: ['west bengal', 'bengal', 'wb'] },
];

/**
 * Match a raw state string, object, or department text to a known State & slug
 */
export function parseStateInfo(state, dept) {
  // Case 1: State object
  if (state && typeof state === 'object') {
    const stateName = state.name || '';
    const stateSlug = state.slug || stateName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
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

  // Case 2: State is a string
  if (typeof state === 'string' && state.trim()) {
    const trimmed = state.trim();
    const lower = trimmed.toLowerCase();

    if (lower === 'all india' || lower === 'national' || lower === 'india' || lower === '-- all india --') {
      return { name: 'All India', slug: '', isAllIndia: true };
    }

    const matched = INDIAN_STATES_DATA.find(
      (s) => s.name.toLowerCase() === lower || s.slug === lower || s.aliases.some((a) => a === lower)
    );

    if (matched) {
      return { name: matched.name, slug: matched.slug, isState: true };
    }

    return {
      name: trimmed,
      slug: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      isState: true,
    };
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
