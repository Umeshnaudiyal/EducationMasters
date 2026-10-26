import React from 'react';
import Link from 'next/link';
import { INDIAN_STATES_DATA, isPlaceholderString } from '@/components/StateLink';

/**
 * Extracts normalized department information ({ name, slug }) from a job or department reference
 */
export function getJobDepartment(job) {
  if (!job) return null;

  // Case 1: Populated department object
  if (job.department && typeof job.department === 'object') {
    const name = String(job.department.name || '').trim();
    if (name && !isPlaceholderString(name)) {
      const slug =
        job.department.slug ||
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return { name, slug };
    }
  }

  // Case 2: Explicit dept property (or string department)
  const rawDept = job.dept || (typeof job.department === 'string' ? job.department : null);
  if (rawDept && typeof rawDept === 'string') {
    const trimmed = rawDept.trim();
    // Guard against placeholder strings, pure numbers, and 24-character MongoDB ObjectId strings
    if (
      trimmed &&
      !isPlaceholderString(trimmed) &&
      !/^[0-9a-fA-F]{24}$/.test(trimmed) &&
      !/^\d+$/.test(trimmed)
    ) {
      // Guard against pure state names (e.g. if someone accidentally saved a state name in dept field)
      const isPureState = INDIAN_STATES_DATA.some(
        (s) =>
          s.name.toLowerCase() === trimmed.toLowerCase() ||
          s.slug === trimmed.toLowerCase() ||
          s.aliases?.some((a) => a === trimmed.toLowerCase())
      );

      if (!isPureState) {
        const slug = trimmed
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        return { name: trimmed, slug };
      }
    }
  }

  return null;
}

/**
 * Reusable DepartmentLink component that displays the department if attached, or falls back to "In Jobs".
 * Automatically truncates long department names to prevent wrapping across multiple metadata lines.
 */
export default function DepartmentLink({
  job,
  department,
  className = 'text-slate-800 font-medium hover:text-blue-600 hover:underline transition-colors',
  fallbackText = 'Jobs',
  fallbackHref = '/jobs',
  showInPrefix = true,
  prefixText = 'In ',
  truncate = true,
  maxWidth = 'max-w-[170px] sm:max-w-[220px] md:max-w-[260px] lg:max-w-[280px]',
  style = {},
}) {
  const deptInfo = department
    ? getJobDepartment({ department })
    : getJobDepartment(job);

  const displayName = deptInfo?.name || fallbackText;
  const href = deptInfo?.slug
    ? `/department/${deptInfo.slug}/jobs`
    : fallbackHref;
  const linkTitle = deptInfo?.name
    ? `View all ${deptInfo.name} Jobs`
    : `View ${fallbackText}`;

  const linkClass = `${className} ${truncate ? `truncate ${maxWidth} min-w-0 inline-block align-bottom` : ''
    }`;

  const truncateStyle = truncate
    ? {
      maxWidth: '260px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      display: 'inline-block',
      verticalAlign: 'bottom',
      ...style,
    }
    : style;

  const linkElement = (
    <Link href={href} className={linkClass} style={truncateStyle} title={linkTitle}>
      {displayName}
    </Link>
  );

  if (!showInPrefix) {
    return linkElement;
  }

  return (
    <span className="inline-flex items-baseline align-bottom max-w-full">
      <span className="shrink-0 pr-1">{prefixText} </span>
      {linkElement}
    </span>
  );
}
