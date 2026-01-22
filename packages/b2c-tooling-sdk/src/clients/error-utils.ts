/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Utilities for extracting error messages from API responses.
 *
 * @module clients/error-utils
 */

/**
 * Extract a clean error message from an API error response.
 *
 * Handles multiple API error patterns and falls back to HTTP status.
 * This ensures that HTML response bodies (like error pages) are never
 * included in user-facing error messages.
 *
 * Supported error patterns:
 * - ODS/SLAS: `{ error: { message: '...' } }`
 * - OCAPI: `{ fault: { message: '...' } }`
 * - SCAPI/Problem+JSON: `{ detail: '...', title: '...' }`
 * - Standard Error: `{ message: '...' }`
 *
 * @param error - The error object from an API response
 * @param response - The HTTP response (for status code fallback)
 * @returns A clean, human-readable error message
 *
 * @example
 * ```typescript
 * const {data, error, response} = await client.GET('/sites', {...});
 * if (error) {
 *   const message = getApiErrorMessage(error, response);
 *   // Returns structured error message or "HTTP 521 Web Server Is Down"
 * }
 * ```
 */
export function getApiErrorMessage(error: unknown, response: Response | {status: number; statusText: string}): string {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;

    // ODS/SLAS pattern: { error: { message: '...' } }
    if (err.error && typeof err.error === 'object') {
      const nested = err.error as Record<string, unknown>;
      if (typeof nested.message === 'string' && nested.message) {
        return nested.message;
      }
    }

    // OCAPI fault pattern: { fault: { message: '...' } }
    if (err.fault && typeof err.fault === 'object') {
      const fault = err.fault as Record<string, unknown>;
      if (typeof fault.message === 'string' && fault.message) {
        return fault.message;
      }
    }

    // SCAPI/Problem+JSON pattern: { detail: '...', title: '...' }
    if (typeof err.detail === 'string' && err.detail) {
      return err.detail;
    }
    if (typeof err.title === 'string' && err.title) {
      return err.title;
    }

    // Standard Error pattern: { message: '...' }
    if (typeof err.message === 'string' && err.message) {
      return err.message;
    }
  }

  // Fallback to HTTP status
  return `HTTP ${response.status} ${response.statusText}`;
}
