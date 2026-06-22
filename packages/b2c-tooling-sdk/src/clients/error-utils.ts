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
 * Matches JSON Web Tokens (three base64url segments separated by dots, the
 * first beginning with `eyJ` — the base64 of `{"`). OCAPI/SLAS faults such as
 * `InvalidAccessTokenException` embed the offending bearer token verbatim in
 * their human-readable `message`, so any message surfaced to the user must be
 * scrubbed of it.
 */
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

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
 * User-facing guidance shown when an instance has OCAPI deprecated. Kept as a
 * single constant so the message is identical across every OCAPI-terminal call
 * site (it is emitted both by {@link getApiErrorMessage} and
 * {@link OcapiDeprecatedError}).
 */
export const OCAPI_DEPRECATED_MESSAGE =
  'OCAPI is deprecated and disabled for this instance. ' +
  'Configure SCAPI access (shortCode, tenantId, and the required sfcc.* scopes on your Account Manager API client) to continue. ' +
  `See: ${SCAPI_SETUP_DOC_URL}`;

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
 * the instance. Carries the actionable {@link OCAPI_DEPRECATED_MESSAGE} so the
 * CLI surfaces SCAPI-setup guidance instead of an opaque "Failed to ..." line.
 *
 * Thrown by OCAPI-terminal operations (those with no SCAPI fallback, or whose
 * SCAPI path was already exhausted) when {@link isOcapiDeprecatedFault} matches.
 */
export class OcapiDeprecatedError extends Error {
  constructor(cause?: unknown) {
    super(OCAPI_DEPRECATED_MESSAGE, cause === undefined ? undefined : {cause});
    this.name = 'OcapiDeprecatedError';
  }
}

/**
 * Redacts JWT bearer tokens from a free-text string.
 *
 * Keeps a short `eyJ…` prefix (mirroring the logger's partial-token style) so
 * the message still reads sensibly, while removing the credential itself.
 * Applied to every user-facing API error message — credentials must never
 * reach stdout/stderr/logs outside of debug/trace logging (where the structured
 * logger applies its own field-level redaction).
 */
export function redactTokens(text: string): string {
  return text.replace(JWT_PATTERN, 'eyJ…[REDACTED-TOKEN]');
}

/**
 * Extract a clean error message from an API error response.
 *
 * Handles multiple API error patterns and falls back to HTTP status.
 * This ensures that HTML response bodies (like error pages) are never
 * included in user-facing error messages.
 *
 * The returned message is always scrubbed of bearer tokens via
 * {@link redactTokens} — some OCAPI faults (e.g. `InvalidAccessTokenException`)
 * embed the full JWT in their message text.
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
  // OCAPI deprecation: replace the opaque fault with actionable SCAPI guidance.
  if (isOcapiDeprecatedFault(error)) {
    return OCAPI_DEPRECATED_MESSAGE;
  }

  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;

    // ODS/SLAS pattern: { error: { message: '...' } }
    if (err.error && typeof err.error === 'object') {
      const nested = err.error as Record<string, unknown>;
      if (typeof nested.message === 'string' && nested.message) {
        return redactTokens(nested.message);
      }
    }

    // OCAPI fault pattern: { fault: { message: '...' } }
    if (err.fault && typeof err.fault === 'object') {
      const fault = err.fault as Record<string, unknown>;
      if (typeof fault.message === 'string' && fault.message) {
        return redactTokens(fault.message);
      }
    }

    // SCAPI/Problem+JSON pattern: { detail: '...', title: '...' }
    if (typeof err.detail === 'string' && err.detail) {
      return redactTokens(err.detail);
    }
    if (typeof err.title === 'string' && err.title) {
      return redactTokens(err.title);
    }

    // Standard Error pattern: { message: '...' }
    if (typeof err.message === 'string' && err.message) {
      return redactTokens(err.message);
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
 *   actionable SCAPI-setup guidance (instead of an opaque "Failed to ...").
 * - Everything else throws `Error(`${prefix}: ${message}`)` where `message`
 *   is the token-redacted fault text from {@link getApiErrorMessage}.
 *
 * The original `error` is always attached as `cause` for debug logging.
 *
 * @param error - The error object from an openapi-fetch result.
 * @param response - The HTTP response (for status fallback).
 * @param prefix - Operation-specific prefix, e.g. `'Failed to list code versions'`.
 * @throws Always throws — return type is `never`.
 */
export function throwOcapiError(
  error: unknown,
  response: Response | {status: number; statusText: string},
  prefix: string,
): never {
  if (isOcapiDeprecatedFault(error)) {
    throw new OcapiDeprecatedError(error);
  }
  throw new Error(`${prefix}: ${getApiErrorMessage(error, response)}`, {cause: error});
}
