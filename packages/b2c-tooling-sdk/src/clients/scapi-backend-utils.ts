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
 * Detects whether an error should trigger an OCAPI fallback. Currently:
 *   - {@link isInvalidScopeError}: AM rejected the requested scope.
 *   - {@link ScapiCapabilityUnsupportedError}: the SCAPI surface lacks the
 *     capability the caller asked for.
 */
export function isFallbackTrigger(error: unknown): boolean {
  return isInvalidScopeError(error) || error instanceof ScapiCapabilityUnsupportedError;
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
 * and tenantId configured; the real blocker is that implicit/stateful OAuth
 * holds a fixed-scope token and can't request the `sfcc.*` scopes SCAPI needs.
 * The old message only mentioned missing credentials, which was misleading.
 */
export function scapiUnavailableMessage(domainName: string): string {
  return (
    `${domainName} SCAPI backend requires shortCode, tenantId, and a stateless OAuth flow ` +
    `(client-credentials or JWT Bearer) that can request the required scopes. ` +
    `Implicit and stateful (stored-session) auth cannot request SCAPI scopes — ` +
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
