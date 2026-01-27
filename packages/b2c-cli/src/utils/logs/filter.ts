/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {LogEntry} from '@salesforce/b2c-tooling-sdk/operations/logs';

/**
 * Parses a relative time string (e.g., "5m", "1h", "2d") into milliseconds.
 * Returns null if the string is not a valid relative time format.
 */
export function parseRelativeTime(timeStr: string): null | number {
  const match = timeStr.match(/^(\d+)([mhd])$/i);
  if (!match) {
    return null;
  }

  const value = Number.parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'd': {
      return value * 24 * 60 * 60 * 1000;
    }
    case 'h': {
      return value * 60 * 60 * 1000;
    }
    case 'm': {
      return value * 60 * 1000;
    }
    default: {
      return null;
    }
  }
}

/**
 * Parses a --since value into a Date object.
 * Supports:
 * - Relative times: "5m", "1h", "2d"
 * - ISO 8601: "2026-01-25T10:00:00"
 */
export function parseSinceTime(sinceStr: string): Date {
  // Try relative time first
  const relativeMs = parseRelativeTime(sinceStr);
  if (relativeMs !== null) {
    return new Date(Date.now() - relativeMs);
  }

  // Try ISO 8601
  const date = new Date(sinceStr);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(
      `Invalid --since value: "${sinceStr}". Use relative time (e.g., "5m", "1h", "2d") or ISO 8601 (e.g., "2026-01-25T10:00:00")`,
    );
  }

  return date;
}

/**
 * Parses a B2C log timestamp into a Date object.
 * Expected format: "2025-01-25 10:30:45.123 GMT"
 */
export function parseLogTimestamp(timestamp: string): Date | null {
  // B2C format: "2025-01-25 10:30:45.123 GMT"
  // Convert to ISO format for parsing
  const isoFormat = timestamp.replace(' GMT', 'Z').replace(' ', 'T');
  const date = new Date(isoFormat);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Filters entries by timestamp.
 */
export function filterBySince(entries: LogEntry[], since: Date): LogEntry[] {
  return entries.filter((entry) => {
    if (!entry.timestamp) return true; // Include entries without timestamps
    const entryDate = parseLogTimestamp(entry.timestamp);
    return entryDate === null || entryDate >= since;
  });
}

/**
 * Filters entries by log level.
 */
export function filterByLevel(entries: LogEntry[], levels: string[]): LogEntry[] {
  const upperLevels = new Set(levels.map((l) => l.toUpperCase()));
  return entries.filter((entry) => {
    // Include entries without level if no specific level filter
    if (!entry.level) return false;
    return upperLevels.has(entry.level.toUpperCase());
  });
}

/**
 * Filters entries by text search (case-insensitive substring match).
 */
export function filterBySearch(entries: LogEntry[], search: string): LogEntry[] {
  const lowerSearch = search.toLowerCase();
  return entries.filter((entry) => {
    return entry.message.toLowerCase().includes(lowerSearch) || entry.raw.toLowerCase().includes(lowerSearch);
  });
}

/**
 * Checks if a single entry matches the specified log levels.
 * Used for streaming/tail scenarios where we filter one entry at a time.
 */
export function matchesLevel(entry: LogEntry, levels: string[]): boolean {
  if (!entry.level) return false;
  const upperLevels = new Set(levels.map((l) => l.toUpperCase()));
  return upperLevels.has(entry.level.toUpperCase());
}

/**
 * Checks if a single entry matches the search text (case-insensitive).
 * Used for streaming/tail scenarios where we filter one entry at a time.
 */
export function matchesSearch(entry: LogEntry, search: string): boolean {
  const lowerSearch = search.toLowerCase();
  return entry.message.toLowerCase().includes(lowerSearch) || entry.raw.toLowerCase().includes(lowerSearch);
}
