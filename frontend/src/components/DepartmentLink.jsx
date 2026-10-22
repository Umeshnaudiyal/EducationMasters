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
 * Reusable DepartmentLink component that displays the department if attached, or falls back to "In Jobs"
 */
export default function DepartmentLink({
  job,
  department,
  className = 'text-slate-800 font-medium hover:text-blue-600 hover:underline transition-colors',
  fallbackText = 'Jobs',
  fallbackHref = '/jobs',
  showInPrefix = true,
  prefixText = 'In ',
}) {
  const deptInfo = department
    ? getJobDepartment({ department })
    : getJobDepartment(job);

  if (deptInfo && deptInfo.name && deptInfo.slug) {
    if (!showInPrefix) {
      return (
        <Link
          href={`/department/${deptInfo.slug}/jobs`}
          className={className}
          title={`View all ${deptInfo.name} Jobs`}
        >
          {deptInfo.name}
        </Link>
      );
    }
    return (
      <span>
        {prefixText}
        <Link
          href={`/department/${deptInfo.slug}/jobs`}
          className={className}
          title={`View all ${deptInfo.name} Jobs`}
        >
          {deptInfo.name}
        </Link>
      </span>
    );
  }

  if (!showInPrefix) {
    return (
      <Link href={fallbackHref} className={className}>
        {fallbackText}
      </Link>
    );
  }

  return (
    <span>
      {prefixText}
      <Link href={fallbackHref} className={className}>
        {fallbackText}
      </Link>
    </span>
  );
}
