/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {LogEntry} from '@salesforce/b2c-tooling-sdk/operations/logs';
import {createPathNormalizer, discoverAndCreateNormalizer} from '@salesforce/b2c-tooling-sdk/operations/logs';

/**
 * Default log prefixes to retrieve/tail.
 */
export const DEFAULT_PREFIXES = ['error', 'customerror'];

/**
 * ANSI color codes for log levels.
 */
const LEVEL_COLORS: Record<string, string> = {
  ERROR: '\u001B[31m', // Red
  FATAL: '\u001B[35m', // Magenta
  WARN: '\u001B[33m', // Yellow
  INFO: '\u001B[36m', // Cyan
  DEBUG: '\u001B[90m', // Gray
  TRACE: '\u001B[90m', // Gray
};

const RESET = '\u001B[0m';
const DIM = '\u001B[2m';
const BOLD = '\u001B[1m';

/**
 * Formats a log entry for human-readable output.
 *
 * Output format:
 * LEVEL [timestamp] [file]
 * message (may be multi-line)
 */
export function formatEntry(entry: LogEntry, useColor: boolean): string {
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

  // File name (dimmed)
  if (useColor) {
    headerParts.push(`${DIM}[${entry.file}]${RESET}`);
  } else {
    headerParts.push(`[${entry.file}]`);
  }

  // Build output: header line followed by message, with trailing blank line
  const header = headerParts.join(' ');
  return `${header}\n${entry.message}\n`;
}

/**
 * Sets up a path normalizer for IDE click-to-open functionality.
 * Priority: 1) explicit cartridgePath, 2) auto-discover cartridges, 3) undefined (no normalization)
 */
export function setupPathNormalizer(
  cartridgePath: string | undefined,
  noNormalize: boolean,
): ((msg: string) => string) | undefined {
  if (noNormalize) {
    return undefined;
  }

  return cartridgePath ? createPathNormalizer({cartridgePath}) : discoverAndCreateNormalizer();
}
