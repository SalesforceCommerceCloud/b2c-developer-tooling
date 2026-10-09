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
 * The OCAPI `fault.type` returned (with HTTP 403) when an instance has OCAPI
 * disabled. The platform is progressively deprecating OCAPI; on a deprecated
 * instance every Data API call fails with this fault regardless of scopes or
 * credentials. SCAPI is the supported path forward.
 */
const OCAPI_DEPRECATED_FAULT_TYPE = 'OcapiDeprecatedException';

/** Doc anchor users are directed to when OCAPI is deprecated for an instance. */
const SCAPI_SETUP_DOC_URL =
  'https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/authentication.html#scapi-authentication';

/**
 * Renders the scope portion of the deprecation message. When the operation has
 * a SCAPI equivalent, names the exact scope(s) that unlock it (e.g.
 * `the "sfcc.scripts" or "sfcc.scripts.rw" scope`); otherwise falls back to the
 * generic `sfcc.*` phrasing.
 */
function scopeClause(requiredScopes?: string[]): string {
  if (!requiredScopes || requiredScopes.length === 0) {
    return 'the required sfcc.* scopes';
  }
  const quoted = requiredScopes.map((s) => `"${s}"`);
  const list = quoted.length === 1 ? quoted[0] : `${quoted.slice(0, -1).join(', ')} or ${quoted[quoted.length - 1]}`;
  return `the ${list} scope`;
}

/**
 * Builds the user-facing guidance shown when an instance has OCAPI deprecated.
 *
 * Pass the SCAPI scope(s) the failed operation requires to name them in the
 * message (e.g. an operation needing `sfcc.scripts.rw` tells the user exactly
 * which scope to add). Omit `requiredScopes` for operations that have no SCAPI
 * equivalent — the message then uses the generic `sfcc.*` phrasing.
 */
export function ocapiDeprecatedMessage(requiredScopes?: string[]): string {
  return (
    'OCAPI is deprecated and disabled for this instance. ' +
    `Configure SCAPI access (shortCode, tenantId, and ${scopeClause(requiredScopes)}) on your Account Manager API client to continue. ` +
    `See: ${SCAPI_SETUP_DOC_URL}`
  );
}

/**
 * Generic OCAPI deprecation message (no specific scope named). Convenience for
 * call sites that surface the guidance directly without an operation scope.
 */
export const OCAPI_DEPRECATED_MESSAGE = ocapiDeprecatedMessage();

/**
 * Returns true if an API error object is an OCAPI deprecation fault
 * (`fault.type === 'OcapiDeprecatedException'`).
 *
 * Detection keys off the structured `fault.type`, not the message text, so it
 * is robust to message wording changes. Used to convert the opaque OCAPI 403
 * into actionable "configure SCAPI" guidance at every OCAPI-terminal site.
 */
export function isOcapiDeprecatedFault(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const fault = (error as Record<string, unknown>).fault;
  if (!fault || typeof fault !== 'object') return false;
  return (fault as Record<string, unknown>).type === OCAPI_DEPRECATED_FAULT_TYPE;
}

/**
 * Error thrown when an OCAPI operation fails because OCAPI is deprecated for
 * the instance. Carries actionable SCAPI-setup guidance — including the exact
 * scope the failed operation needs, when supplied — so the CLI surfaces a
 * helpful message instead of an opaque "Failed to ..." line.
 *
 * Thrown by OCAPI-terminal operations (those with no SCAPI fallback, or whose
 * SCAPI path was already exhausted) when {@link isOcapiDeprecatedFault} matches.
 */
export class OcapiDeprecatedError extends Error {
  constructor(options: {cause?: unknown; requiredScopes?: string[]} = {}) {
    super(
      ocapiDeprecatedMessage(options.requiredScopes),
      options.cause === undefined ? undefined : {cause: options.cause},
    );
    this.name = 'OcapiDeprecatedError';
  }
}

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

/**
 * Throws a well-formed Error for a failed OCAPI call.
 *
 * Centralizes OCAPI-terminal error handling so every call site behaves
 * consistently:
 * - OCAPI deprecation faults become an {@link OcapiDeprecatedError} with
 *   actionable SCAPI-setup guidance, naming `requiredScopes` when the operation
 *   has a SCAPI equivalent.
 * - Everything else throws `Error(`${prefix}: ${message}`)` where `message`
 *   is the fault text from {@link getApiErrorMessage}.
 *
 * The original `error` is always attached as `cause` for debug logging.
 *
 * @param error - The error object from an openapi-fetch result.
 * @param response - The HTTP response (for status fallback).
 * @param prefix - Operation-specific prefix, e.g. `'Failed to list code versions'`.
 * @param requiredScopes - SCAPI scope(s) the equivalent operation needs, named
 *   in the deprecation message. Omit for OCAPI-only operations.
 * @throws Always throws — return type is `never`.
 */
export function throwOcapiError(
  error: unknown,
  response: Response | {status: number; statusText: string},
  prefix: string,
  requiredScopes?: string[],
): never {
  if (isOcapiDeprecatedFault(error)) {
    throw new OcapiDeprecatedError({cause: error, requiredScopes});
  }
  throw new Error(`${prefix}: ${getApiErrorMessage(error, response)}`, {cause: error});
}
