/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Shared date-range utilities used by the report dashboard's DateRangePicker
// and the Query Builder's WHERE clause date UX.

export type DateRangePreset = 'last-week' | 'last-month' | 'last-6-months' | 'custom';

/**
 * Format a Date as `YYYY-MM-DD` using its **local** components. Reads the
 * year/month/day off the Date object directly rather than going through
 * `toISOString()`, which would convert to UTC and shift the result by a day
 * for users west of UTC near a calendar boundary (e.g. PST late evening).
 */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Resolve a named preset to a `{from, to}` date range in local time.
 * `custom` returns null because the caller supplies the two endpoints.
 *
 * - `last-week` — the most recent full Mon–Sun window
 * - `last-month` — the calendar month before this one
 * - `last-6-months` — the 6 calendar months before this one
 */
export function resolvePreset(preset: DateRangePreset): {from: string; to: string} | null {
  if (preset === 'custom') return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === 'last-week') {
    const day = today.getDay();
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - ((day + 6) % 7) - 7);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    return {from: toISODate(lastMonday), to: toISODate(lastSunday)};
  }
  if (preset === 'last-month') {
    const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const last = new Date(today.getFullYear(), today.getMonth(), 0);
    return {from: toISODate(first), to: toISODate(last)};
  }
  if (preset === 'last-6-months') {
    const first = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    const last = new Date(today.getFullYear(), today.getMonth(), 0);
    return {from: toISODate(first), to: toISODate(last)};
  }
  return null;
}

/**
 * Heuristic: does a SQL column type look like a date or timestamp? Matches
 * Avatica/Phoenix type names (`DATE`, `TIMESTAMP`, `TIME`) and tolerates
 * vendor variants (`TIMESTAMP_NTZ`, `DATETIME`, etc.).
 */
export function isDateLikeType(type: string | undefined): boolean {
  if (!type) return false;
  const t = type.toLowerCase().trim();
  return /(^|[^a-z])(date|datetime|timestamp(?:_ntz|_ltz|_tz)?|time)([^a-z]|$)/.test(t);
}
