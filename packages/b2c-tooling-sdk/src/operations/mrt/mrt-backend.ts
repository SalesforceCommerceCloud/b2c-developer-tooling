/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * MRT backend selection and legacy↔SCAPI fallback.
 *
 * Managed Runtime has two backends:
 *   - **legacy** — the MRT Cloud API (`cloud.mobify.com`), per-user API key.
 *   - **scapi** — the SCAPI Storefront APIs (`storefront/<api>/v1`), stateless
 *     OAuth (client-credentials or JWT Bearer) with the `sfcc.storefront.*` scopes.
 *
 * This module is the MRT analogue of `clients/scapi-backend-utils.ts`
 * (`resolveScapiOrOcapi`) and `compat/dispatcher.ts`: it resolves a user
 * preference plus config availability into a concrete backend, and runs a
 * SCAPI branch optimistically in `auto` mode with a one-shot, safe fallback to
 * legacy. Unlike the OCAPI dispatcher, MRT resolves once per invocation (the
 * supported surface — list and create — is single-call, and `--wait` pins to
 * whichever backend the create resolved to), so a plain resolve + branch is
 * clearer than the stateful `BackendDispatcher`.
 *
 * @module operations/mrt/mrt-backend
 */
import type {AuthStrategy} from '../../auth/types.js';
import {
  isFallbackTrigger,
  resolvePreferredBackend,
  SCAPI_CAPABILITY_BASELINE_RELEASE,
} from '../../clients/scapi-backend-utils.js';
import {getLogger} from '../../logging/logger.js';

/** User-facing MRT backend preference (`--mrt-backend` / `MRT_BACKEND` / `mrtBackend`). */
export type MrtBackendPreference = 'auto' | 'legacy' | 'scapi';

/** A concrete, resolved MRT backend. */
export type MrtBackend = 'legacy' | 'scapi';

/**
 * SCAPI MRT connection bundle: everything a SCAPI MRT operation needs to build a
 * client. The presence of one signals SCAPI eligibility to
 * {@link resolveMrtBackend} / {@link runMrtWithFallback}.
 */
export interface ScapiMrtConnection {
  /** SCAPI short code, e.g. `kv7kzm78`. */
  shortCode: string;
  /** Tenant identifier, e.g. `zzxy_prd` (the organization ID is derived from it). */
  tenantId: string;
  /**
   * A SCAPI-capable OAuth strategy — client-credentials or JWT Bearer, whether
   * configured directly or reused from a stored `b2c auth client` session.
   */
  auth: AuthStrategy;
}

/**
 * Error message for when explicit `--mrt-backend scapi` is requested but the
 * SCAPI MRT prerequisites are missing. Names both reasons the connection can
 * be unavailable — missing coordinates OR an auth flow SCAPI Admin does not
 * accept. Unlike the OCAPI {@link scapiUnavailableMessage}, MRT resolves auth
 * through the shared `getOAuthStrategy()` path, so a stored `b2c auth client`
 * session counts as a supported flow here.
 */
export function mrtScapiUnavailableMessage(): string {
  return (
    `The SCAPI MRT backend requires shortCode, tenantId, and an OAuth flow SCAPI Admin accepts ` +
    `that can request the sfcc.storefront.* scopes — client-credentials or JWT Bearer, configured ` +
    `directly (--client-id/--client-secret or JWT) or as a stored \`b2c auth client\` session. ` +
    `Browser user auth (Authorization Code + PKCE or the deprecated implicit flow) is not supported ` +
    `for SCAPI Admin as of B2C Commerce release ${SCAPI_CAPABILITY_BASELINE_RELEASE}. ` +
    `Provide --short-code and --tenant-id with a supported flow, or use --mrt-backend legacy ` +
    `(per-user API key via --api-key / ~/.mobify).`
  );
}

/**
 * Resolves a preference plus SCAPI availability into a concrete backend.
 *
 * - `legacy` → always `legacy`.
 * - `scapi` → `scapi`, throwing {@link mrtScapiUnavailableMessage} if the SCAPI
 *   connection is missing (fail loud; never silently use legacy).
 * - `auto` → `scapi` when a connection is available, otherwise `legacy`.
 */
export function resolveMrtBackend(opts: {preference: MrtBackendPreference; hasScapiConfig: boolean}): MrtBackend {
  const {preference, hasScapiConfig} = opts;
  return resolvePreferredBackend({
    preference,
    primary: 'legacy',
    hasScapiConfig,
    unavailableMessage: mrtScapiUnavailableMessage,
  });
}

/** One async branch per backend, run by {@link runMrtWithFallback}. */
export interface MrtBackendBranches<T> {
  scapi: () => Promise<T>;
  legacy: () => Promise<T>;
}

/** Options controlling {@link runMrtWithFallback}. */
export interface RunMrtWithFallbackOptions {
  /** Resolved user preference. */
  preference: MrtBackendPreference;
  /** True iff a {@link ScapiMrtConnection} is available. */
  hasScapiConfig: boolean;
  /**
   * Whether a legacy fallback target actually exists (i.e. legacy credentials
   * are configured). When `auto` would otherwise fall back but this is `false`,
   * the original SCAPI error is rethrown instead of running the legacy branch —
   * which would throw a misleading "provide an API key" error and bury the real
   * SCAPI failure (e.g. a missing scope) that the user needs to fix. Defaults to
   * `true`.
   */
  canFallbackToLegacy?: boolean;
  /**
   * Invoked once when `auto` mode falls back from SCAPI to legacy, with the
   * SCAPI rejection reason. Use to warn the user.
   */
  onFallback?: (reason: string) => void;
  /**
   * Invoked with the backend that will actually serve the call — before the
   * SCAPI attempt, and again with `'legacy'` if `auto` falls back. Use for
   * `-D`/debug output.
   */
  onResolve?: (backend: MrtBackend) => void;
}

/** The backend that served a call and its result. */
export interface MrtBackendRun<T> {
  /** Backend that actually produced {@link value} (post-fallback in `auto`). */
  backend: MrtBackend;
  value: T;
}

/**
 * Resolves the backend and runs the matching branch.
 *
 * - `legacy` (explicit or `auto` with no SCAPI config): runs the legacy branch.
 * - `scapi` (explicit): runs the SCAPI branch with **no** fallback — every
 *   error surfaces, including 409 Conflict.
 * - `auto` with a SCAPI connection: runs SCAPI optimistically; on a
 *   {@link isFallbackTrigger safe} rejection (a definite pre-execution client
 *   error or `invalid_scope`) it warns and retries on legacy — but only when a
 *   legacy target exists ({@link RunMrtWithFallbackOptions.canFallbackToLegacy}).
 *   With no legacy credentials, the original SCAPI error is rethrown so the user
 *   sees the real failure rather than a "provide an API key" message. Ambiguous
 *   failures (429, 5xx, network) and 409 Conflict never fall back — a mutating
 *   deploy must not cross backends after the request may have reached SCAPI.
 *
 * @returns the backend that served the call and its result.
 */
export async function runMrtWithFallback<T>(
  options: RunMrtWithFallbackOptions,
  branches: MrtBackendBranches<T>,
): Promise<MrtBackendRun<T>> {
  const {preference, hasScapiConfig, canFallbackToLegacy = true, onFallback, onResolve} = options;
  const backend = resolveMrtBackend({preference, hasScapiConfig});

  if (backend === 'legacy') {
    onResolve?.('legacy');
    return {backend: 'legacy', value: await branches.legacy()};
  }

  onResolve?.('scapi');

  // Explicit SCAPI: no fallback, surface all errors.
  if (preference === 'scapi') {
    return {backend: 'scapi', value: await branches.scapi()};
  }

  // auto + SCAPI available: optimistic SCAPI with a one-shot safe fallback.
  try {
    return {backend: 'scapi', value: await branches.scapi()};
  } catch (error) {
    // Rethrow the real SCAPI error on ambiguous/non-safe failures, or when
    // there is no legacy target to fall back to (falling back would only
    // surface a misleading "provide an API key" error).
    if (!isFallbackTrigger(error) || !canFallbackToLegacy) {
      throw error;
    }
    const reason = error instanceof Error ? error.message : String(error);
    getLogger().warn({reason}, '[MRT] SCAPI backend rejected the request; falling back to legacy MRT');
    onFallback?.(reason);
    onResolve?.('legacy');
    return {backend: 'legacy', value: await branches.legacy()};
  }
}
