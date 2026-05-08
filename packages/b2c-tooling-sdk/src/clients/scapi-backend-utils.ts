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

/**
 * User-facing API backend preference.
 *
 * - `'ocapi'`: force OCAPI (always use the legacy Data API).
 * - `'scapi'`: force SCAPI (requires shortCode + tenantId; fails loudly if scopes missing).
 * - `'auto'`: prefer SCAPI when configured, transparently fall back to OCAPI on `invalid_scope`.
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

/**
 * Returns a copy of `auth` with `additionalScopes` merged in, or the original
 * `auth` if the strategy doesn't support scope merging (e.g., basic/api-key
 * auth, or a stored-session strategy where scopes were fixed at acquisition).
 *
 * Centralized so SCAPI client factories don't have to keep extending an
 * `instanceof` chain as new OAuth strategy types are added.
 */
export function withScopes(auth: AuthStrategy, additionalScopes: string[]): AuthStrategy {
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
      throw new Error(
        `${domainName} SCAPI backend requires shortCode, tenantId, and OAuth credentials. ` +
          `Configure them in dw.json or use --api-backend ocapi.`,
      );
    }
    return 'scapi';
  }

  // auto
  return hasScapiConfig ? 'scapi' : 'ocapi';
}
