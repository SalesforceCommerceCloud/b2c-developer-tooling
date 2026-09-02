/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Shared flag-parsing and error-classification helpers for the MRT bundle
 * commands (`deploy`, `upload-v2`). Kept in one place so the two commands
 * cannot drift.
 */

/**
 * Parses a glob pattern string into an array of patterns.
 * Accepts either a JSON array (e.g. '["server/**\/*", "ssr.{js,mjs}"]')
 * or a comma-separated string (e.g. 'server/**\/*,ssr.js').
 * JSON array format supports brace expansion in individual patterns.
 */
export function parseGlobPatterns(value: string): string[] {
  const trimmed = value.trim();
  if (trimmed.startsWith('[')) {
    const parsed: unknown = JSON.parse(trimmed);
    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) {
      throw new Error(`Invalid glob pattern array: expected an array of strings`);
    }
    return parsed.map((s: string) => s.trim()).filter(Boolean);
  }
  return trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parses SSR parameter flags into a key-value object.
 * Accepts format: key=value
 */
export function parseSsrParams(params: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const param of params) {
    const eqIndex = param.indexOf('=');
    if (eqIndex === -1) {
      throw new Error(`Invalid SSR parameter format: "${param}". Expected key=value format.`);
    }
    const key = param.slice(0, eqIndex);
    const value = param.slice(eqIndex + 1);
    result[key] = value;
  }
  return result;
}

/** Patterns that indicate a 403/authorization error, typically caused by an invalid project ID */
export const MRT_AUTH_ERROR_PATTERNS = [
  '403',
  'forbidden',
  'not authorized',
  'unauthorized',
  'permission denied',
  'do not have permission',
];

/** Suggestion shown when a deploy/push operation fails with a 403/authorization error */
export const MRT_PROJECT_SUGGESTION = 'To see projects you have access to, run: b2c mrt project list --limit 10';

/** Returns true when the error message looks like a 403/authorization failure. */
export function isMrtAuthError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return MRT_AUTH_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}
