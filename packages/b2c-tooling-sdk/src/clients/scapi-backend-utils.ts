/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Shared utilities for SCAPI/OCAPI dual-backend domains.
 *
 * Each domain that supports both OCAPI (legacy) and SCAPI (modern) shares
 * these utilities to keep behavior consistent: backend preference resolution,
 * scope-error detection, and the canonical `ApiBackendPreference` type.
 *
 * @module clients/scapi-backend-utils
 */
import type {AuthStrategy} from '../auth/types.js';
import {getApiErrorMessage} from './error-utils.js';

/**
 * User-facing API backend preference.
 *
 * - `'ocapi'`: force OCAPI (always use the legacy Data API).
 * - `'scapi'`: force SCAPI (requires shortCode + tenantId; fails loudly if scopes missing).
 * - `'auto'`: prefer SCAPI when configured, with temporary safe OCAPI fallback.
 */
export type ApiBackendPreference = 'ocapi' | 'scapi' | 'auto';

/**
 * Common shape of every dual-backend implementation. Each canonical backend
 * (e.g., `JobsBackend`) extends this so a generic fallback wrapper can read
 * `name` to know which backend served the last call.
 */
export interface BackendBase {
  readonly name: 'ocapi' | 'scapi';
}

/** Error raised when browser-based Account Manager user auth is passed to a SCAPI Admin client. */
export class ScapiUserAuthUnsupportedError extends Error {
  constructor() {
    super(
      'SCAPI Admin APIs currently support system authentication only. ' +
        'Use client credentials or JWT Bearer authentication; PKCE/implicit user auth remains available for OCAPI.',
    );
    this.name = 'ScapiUserAuthUnsupportedError';
  }
}

/** Reject browser user-auth strategies before a SCAPI request is attempted. */
export function assertScapiAdminAuthSupported(auth: AuthStrategy): void {
  if ('authMethod' in auth && (auth.authMethod === 'user' || auth.authMethod === 'implicit')) {
    throw new ScapiUserAuthUnsupportedError();
  }
}

/**
 * Returns a copy of `auth` with `additionalScopes` merged in, or the original
 * `auth` if the strategy doesn't support scope merging (e.g., basic/api-key
 * auth, or a stored-session strategy where scopes were fixed at acquisition).
 *
 * Centralized so SCAPI client factories don't have to keep extending an
 * `instanceof` chain as new OAuth strategy types are added.
 */
export function withScopes(auth: AuthStrategy, additionalScopes: string[]): AuthStrategy {
  assertScapiAdminAuthSupported(auth);
  if (typeof auth.withAdditionalScopes === 'function') {
    return auth.withAdditionalScopes(additionalScopes);
  }
  return auth;
}

/**
 * Detects an Account Manager `invalid_scope` error.
 *
 * When a client's API client doesn't have the requested scope configured,
 * Account Manager returns `{"error":"invalid_scope", ...}` on the token
 * request. The OAuth strategy surfaces that as an Error whose message
 * contains `invalid_scope`.
 *
 * Used by fallback wrappers to decide whether to downgrade to OCAPI.
 */
export function isInvalidScopeError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('invalid_scope');
}

/**
 * Thrown by SCAPI backends when a requested operation cannot be expressed on
 * SCAPI (e.g., toggling the `disabled` flag via the SCAPI Users PATCH, which
 * the SCAPI schema does not include). The fallback wrapper recognizes this
 * and falls back to OCAPI; in explicit `scapi` mode it propagates so the
 * caller sees the limitation.
 */
export class ScapiCapabilityUnsupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScapiCapabilityUnsupportedError';
  }
}

/**
 * HTTP statuses that prove SCAPI rejected a request before performing it.
 *
 * These are safe for the temporary `auto` compatibility mode to retry over
 * OCAPI. Ambiguous responses (`429`, `5xx`) and network failures are excluded
 * because a mutating request might already have reached the platform.
 */
export const SAFE_SCAPI_FALLBACK_STATUSES = new Set([400, 401, 403, 404, 405, 406, 415]);

/**
 * A structured SCAPI response failure. Backends must retain the response
 * status so the shared fallback policy can distinguish a definite rejection
 * from an ambiguous transport/server failure.
 */
export class ScapiRequestError extends Error {
  constructor(
    message: string,
    /** HTTP status returned by SCAPI. */
    public readonly status: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ScapiRequestError';
  }
}

/** Creates a structured SCAPI error using the repository's common formatter. */
export function createScapiRequestError(
  error: unknown,
  response: Response | {status: number; statusText: string},
  fallbackMessage: string,
): ScapiRequestError {
  const message = error ? getApiErrorMessage(error, response) : fallbackMessage;
  return new ScapiRequestError(message || fallbackMessage, response.status, {cause: error});
}

/**
 * Detects whether an error should trigger an OCAPI fallback. Currently:
 *   - {@link isInvalidScopeError}: AM rejected the requested scope.
 *   - {@link ScapiCapabilityUnsupportedError}: the SCAPI surface lacks the
 *     capability the caller asked for.
 *   - {@link ScapiRequestError}: SCAPI definitively rejected the request with
 *     a safe client-error status.
 */
export function isFallbackTrigger(error: unknown): boolean {
  return (
    isInvalidScopeError(error) ||
    error instanceof ScapiCapabilityUnsupportedError ||
    (error instanceof ScapiRequestError && SAFE_SCAPI_FALLBACK_STATUSES.has(error.status))
  );
}

/**
 * Inputs to `resolveScapiOrOcapi`.
 */
export interface ResolveBackendOptions {
  /** User preference (from `--api-backend` flag or `apiBackend` config). */
  preference: ApiBackendPreference;
  /** True iff shortCode + tenantId + auth are all available. */
  hasScapiConfig: boolean;
  /** Domain name used in error messages, e.g. `'Jobs'`, `'Scripts'`. */
  domainName: string;
}

/**
 * Message for when explicit SCAPI is requested but the instance can't reach it.
 *
 * Names both reasons the SCAPI client config can be unavailable — missing
 * coordinates OR an auth flow that can't request scopes — because a user who
 * hits this in explicit `--api-backend scapi` mode often *does* have shortCode
 * and tenantId configured; the real blocker can be browser user auth, which
 * SCAPI Admin APIs do not currently support, or a fixed-scope stored token.
 * The old message only mentioned missing credentials, which was misleading.
 */
export function scapiUnavailableMessage(domainName: string): string {
  return (
    `${domainName} SCAPI backend requires shortCode, tenantId, and a stateless OAuth flow ` +
    `(client-credentials or JWT Bearer) that can request the required scopes. ` +
    `Browser user auth (Authorization Code + PKCE or implicit) is currently OCAPI/WebDAV-only, ` +
    `and fixed-token stored sessions cannot request SCAPI scopes — ` +
    `use client-credentials/JWT, or set --api-backend ocapi.`
  );
}

/**
 * Resolves a user preference + config availability into a concrete backend choice.
 *
 * - Explicit `'ocapi'` always returns `'ocapi'`.
 * - Explicit `'scapi'` requires SCAPI config and throws if missing.
 * - `'auto'` returns `'scapi'` if SCAPI config is available, otherwise `'ocapi'`.
 *
 * Throws an error with the domain name in the message when explicit SCAPI is
 * requested without the required configuration.
 */
export function resolveScapiOrOcapi(opts: ResolveBackendOptions): 'ocapi' | 'scapi' {
  const {preference, hasScapiConfig, domainName} = opts;

  if (preference === 'ocapi') return 'ocapi';

  if (preference === 'scapi') {
    if (!hasScapiConfig) {
      throw new Error(scapiUnavailableMessage(domainName));
    }
    return 'scapi';
  }

  // auto
  return hasScapiConfig ? 'scapi' : 'ocapi';
}
