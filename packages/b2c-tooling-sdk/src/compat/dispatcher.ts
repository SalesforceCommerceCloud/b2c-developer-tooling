/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Optimistic SCAPI with cached OCAPI fallback for `apiBackend=auto`.
 *
 * ## Why this exists
 *
 * When `apiBackend=auto` and the user has no SCAPI scopes provisioned in
 * Account Manager, every SCAPI call fails with `invalid_scope`. OAuth
 * strategies cache successful tokens but **not** failed token requests, so
 * without state, every call in a multi-call operation (e.g. `job run --wait`
 * polls dozens of times) re-attempts SCAPI, re-hits Account Manager, re-fails,
 * re-falls back to OCAPI. Slow, noisy, and surfaces the fallback log line
 * repeatedly.
 *
 * The dispatcher caches the resolved backend for the lifetime of one logical
 * operation: the first call probes SCAPI; the rest go straight to the
 * resolved backend. Token caching handles the success path; the dispatcher
 * handles the failure path.
 *
 * ## When to use
 *
 * Any interface (CLI, VSCode, MCP) that:
 *   - honors `apiBackend=auto`, **and**
 *   - performs multiple backend calls per user-initiated operation.
 *
 * ## When NOT to use
 *
 *   - **Explicit `apiBackend=scapi` or `apiBackend=ocapi`.** The choice is
 *     known up-front; just branch once with `if/else`.
 *   - **Single-call operations.** A `try/catch` is shorter and clearer than
 *     constructing a dispatcher.
 *   - **SDK code that picks a backend deliberately.** Call `ScapiJobsOps` or
 *     the OCAPI free functions directly. No dispatcher needed.
 *   - **SCAPI-only operations** (no OCAPI equivalent). Just call the SCAPI
 *     ops; if the user forced `apiBackend=ocapi`, fail with a clear error in
 *     the command itself. The dispatcher's only job is fallback caching.
 *
 * ## Lifecycle
 *
 * This module lives in `compat/` because it exists to bridge the
 * OCAPI → SCAPI transition. When OCAPI is removed:
 *   - delete every `ocapi: () => ...` branch from CLI/VSCode/MCP commands,
 *   - inline the SCAPI ops calls,
 *   - delete this directory.
 *
 * @module compat/dispatcher
 */
import {getLogger} from '../logging/logger.js';
import {isInvalidScopeError, type ApiBackendPreference} from '../clients/scapi-backend-utils.js';

export type {ApiBackendPreference};

export type ResolvedBackend = 'scapi' | 'ocapi';

/**
 * Branches passed to {@link BackendDispatcher.run}: one async function per
 * backend. The SCAPI branch receives a non-null ops bundle (`S`) so callers
 * don't need non-null assertions. The OCAPI branch receives no argument —
 * it should call the OCAPI free functions directly with whatever instance
 * handle the caller has.
 */
export interface DispatchBranches<S, T> {
  scapi: (ops: S) => Promise<T>;
  ocapi: () => Promise<T>;
}

/**
 * Stateful router that runs SCAPI optimistically and falls back to OCAPI
 * once on `invalid_scope`, caching the choice for the lifetime of the
 * dispatcher. See the module-level docs for the full rationale.
 *
 * Construct one per logical operation (e.g. one per CLI command run, or
 * one per VSCode user-initiated action). Sharing a dispatcher across
 * unrelated operations is fine but not required.
 *
 * @typeParam S - The SCAPI ops bundle type (e.g., `ScapiJobsOps`).
 */
export class BackendDispatcher<S> {
  private resolved?: ResolvedBackend;
  private opsCache?: S;

  /**
   * @param preference - User preference (`auto` | `scapi` | `ocapi`).
   * @param createScapi - Lazily builds the SCAPI ops bundle. Returns
   *   `undefined` when SCAPI is not configured (shortCode/tenantId/auth
   *   missing).
   * @param domainName - Used in fallback log messages (e.g. `'jobs'`).
   *
   * @throws Error if `preference === 'scapi'` but `createScapi()` returns
   *   `undefined` — explicit SCAPI without configuration is a hard error.
   */
  constructor(
    preference: ApiBackendPreference,
    createScapi: () => S | undefined,
    private readonly domainName: string,
  ) {
    const probe = preference === 'ocapi' ? undefined : createScapi();
    const hasScapi = probe !== undefined;
    if (probe !== undefined) this.opsCache = probe;

    if (preference === 'scapi' && !hasScapi) {
      throw new Error(
        `${domainName} SCAPI backend requires shortCode, tenantId, and OAuth credentials. ` +
          `Configure them in dw.json or set apiBackend to ocapi.`,
      );
    }
    if (preference === 'scapi') this.resolved = 'scapi';
    if (preference === 'ocapi') this.resolved = 'ocapi';
    if (preference === 'auto' && !hasScapi) this.resolved = 'ocapi';
  }

  /** Backend that has handled requests so far, or undefined if none yet. */
  get active(): ResolvedBackend | undefined {
    return this.resolved;
  }

  /**
   * Runs the operation against the resolved backend. If unresolved (auto
   * with SCAPI configured), tries SCAPI first; on `invalid_scope`, falls
   * back to OCAPI and caches the choice. Other errors propagate without
   * fallback.
   */
  async run<T>(branches: DispatchBranches<S, T>): Promise<T> {
    if (this.resolved === 'ocapi') return branches.ocapi();
    if (this.resolved === 'scapi') return branches.scapi(this.opsCache!);

    try {
      const result = await branches.scapi(this.opsCache!);
      this.resolved = 'scapi';
      return result;
    } catch (error) {
      if (isInvalidScopeError(error)) {
        getLogger().info(`SCAPI ${this.domainName} scope unavailable, falling back to OCAPI`);
        this.resolved = 'ocapi';
        return branches.ocapi();
      }
      throw error;
    }
  }
}
