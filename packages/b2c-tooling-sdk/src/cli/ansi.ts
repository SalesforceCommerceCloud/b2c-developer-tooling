/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Shared ANSI control codes and a single source of truth for the level -> color
 * palette used by every CLI log/table renderer. Concentrating the palette here
 * keeps the CLI's terminal output visually consistent across `b2c logs`,
 * `b2c mrt logs`, job log highlighting, and any future stream renderer.
 */

const ESC = String.fromCharCode(27);

export const ANSI = {
  RESET: `${ESC}[0m`,
  DIM: `${ESC}[2m`,
  BOLD: `${ESC}[1m`,
  HIGHLIGHT: `${ESC}[1;33m`,
  // Standalone hues for ad-hoc CLI styling (REPL prompts, status output, cap commands)
  RED: `${ESC}[31m`,
  GREEN: `${ESC}[32m`,
  YELLOW: `${ESC}[33m`,
  MAGENTA: `${ESC}[35m`,
  CYAN: `${ESC}[36m`,
  GRAY: `${ESC}[90m`,
} as const;

/**
 * ANSI color codes by log level. The keys cover the levels emitted by both
 * B2C server logs and MRT logs (which uses both `WARN` and `WARNING`).
 */
export const LEVEL_COLORS: Readonly<Record<string, string>> = {
  ERROR: `${ESC}[31m`, // Red
  FATAL: `${ESC}[35m`, // Magenta
  WARN: `${ESC}[33m`, // Yellow
  WARNING: `${ESC}[33m`, // Yellow
  INFO: `${ESC}[36m`, // Cyan
  DEBUG: `${ESC}[90m`, // Gray
  TRACE: `${ESC}[90m`, // Gray
};

/** Wrap text in the bold-yellow highlight style. */
export function colorHighlight(text: string): string {
  return `${ANSI.HIGHLIGHT}${text}${ANSI.RESET}`;
}

/** Wrap a level name in its level color + bold. */
export function colorLevel(level: string): string {
  const color = LEVEL_COLORS[level] || '';
  return `${color}${ANSI.BOLD}${level}${ANSI.RESET}`;
}

/** Wrap text in the dim style (used for timestamps and metadata brackets). */
export function colorDim(text: string): string {
  return `${ANSI.DIM}${text}${ANSI.RESET}`;
}
