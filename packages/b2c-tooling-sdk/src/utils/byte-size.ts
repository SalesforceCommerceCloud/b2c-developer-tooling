/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

const MULTIPLIERS: Record<string, number> = {
  b: 1,
  kb: 1024,
  kib: 1024,
  mb: 1024 * 1024,
  mib: 1024 * 1024,
  gb: 1024 * 1024 * 1024,
  gib: 1024 * 1024 * 1024,
};

/**
 * Parses a human-friendly size into bytes. A bare number (or a numeric input)
 * is interpreted as mebibytes; suffixes `b`, `kb`, `mb`, `gb` (and their
 * `kib`/`mib`/`gib` forms) are accepted case-insensitively.
 *
 * @param input - Size string such as `"200mb"`, `"512kb"`, `"150"`, or a number of MiB
 * @returns Size in bytes (floored)
 * @throws Error if the input cannot be parsed
 */
export function parseByteSize(input: string | number): number {
  const match = /^\s*(\d+(?:\.\d+)?)\s*(b|kb|kib|mb|mib|gb|gib)?\s*$/i.exec(String(input));
  if (!match) {
    throw new Error(`Invalid size: "${input}". Use e.g. 200, 200mb, or 512kb.`);
  }
  const value = Number(match[1]);
  const unit = (match[2] ?? 'mb').toLowerCase();
  return Math.floor(value * MULTIPLIERS[unit]);
}
