/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {MrtLogEntry} from '@salesforce/b2c-tooling-sdk/operations/mrt';

/**
 * ANSI color codes for log levels.
 * Matches the color scheme from logs/format.ts for consistency.
 */
const LEVEL_COLORS: Record<string, string> = {
  ERROR: '\u001B[31m', // Red
  FATAL: '\u001B[35m', // Magenta
  WARN: '\u001B[33m', // Yellow
  WARNING: '\u001B[33m', // Yellow
  INFO: '\u001B[36m', // Cyan
  DEBUG: '\u001B[90m', // Gray
  TRACE: '\u001B[90m', // Gray
};

const RESET = '\u001B[0m';
const DIM = '\u001B[2m';
const BOLD = '\u001B[1m';
const HIGHLIGHT = '\u001B[1;33m'; // Bold yellow for search matches

/**
 * Options for formatting an MRT log entry.
 */
export interface FormatMrtEntryOptions {
  /** Whether to use ANSI color codes. */
  useColor: boolean;
  /** Regex to highlight matches in the message. */
  searchHighlight?: RegExp;
}

/**
 * Highlights regex matches in text with ANSI color codes.
 */
function highlightMatches(text: string, pattern: RegExp): string {
  return text.replace(pattern, (match) => `${HIGHLIGHT}${match}${RESET}`);
}

/**
 * Colorizes a log level name using its level color + bold.
 */
export function colorLevel(level: string): string {
  const color = LEVEL_COLORS[level] || '';
  return `${color}${BOLD}${level}${RESET}`;
}

/**
 * Colorizes text with the search highlight style (bold yellow).
 */
export function colorHighlight(text: string): string {
  return `${HIGHLIGHT}${text}${RESET}`;
}

/**
 * Formats an MRT log entry for terminal display.
 *
 * Output format:
 * ```
 * LEVEL [timestamp] [shortRequestId]
 * message
 * ```
 */
export function formatMrtEntry(entry: MrtLogEntry, options: FormatMrtEntryOptions): string {
  const {useColor, searchHighlight} = options;
  const headerParts: string[] = [];

  // Level first (most important for scanning)
  if (entry.level) {
    if (useColor) {
      const color = LEVEL_COLORS[entry.level] || '';
      headerParts.push(`${color}${BOLD}${entry.level}${RESET}`);
    } else {
      headerParts.push(entry.level);
    }
  }

  // Timestamp
  if (entry.timestamp) {
    if (useColor) {
      headerParts.push(`${DIM}[${entry.timestamp}]${RESET}`);
    } else {
      headerParts.push(`[${entry.timestamp}]`);
    }
  }

  // Short request ID
  if (entry.shortRequestId) {
    if (useColor) {
      headerParts.push(`${DIM}[${entry.shortRequestId}]${RESET}`);
    } else {
      headerParts.push(`[${entry.shortRequestId}]`);
    }
  }

  const header = headerParts.join(' ');
  let message = entry.message.trimEnd();

  // Highlight search matches in message
  if (useColor && searchHighlight) {
    message = highlightMatches(message, searchHighlight);
  }

  return `${header}\n${message}\n`;
}
