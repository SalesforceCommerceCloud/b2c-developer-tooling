/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Generic fallback wrapper for SCAPI/OCAPI dual backends.
 *
 * Builds a Proxy that implements the same interface as the underlying
 * backends. Each method call routes through {@link withFallback}: try SCAPI
 * first; on a recognized fallback trigger (e.g. `invalid_scope` or a
 * SCAPI-side capability gap such as a downgraded scope tier), fall back to
 * OCAPI for that call and pin to OCAPI for the rest of the wrapper's life.
 * Note that a successful SCAPI call only pins *softly* — a later call that
 * trips a fallback trigger still routes to OCAPI and re-pins, so a flow
 * that reads under a read-only scope and then needs to write isn't stuck.
 * The `name` property reflects the currently-active backend ('scapi' before
 * the first call resolves, then whichever survived).
 *
 * @module clients/scapi-fallback-backend
 */
import {getLogger} from '../logging/logger.js';
import {isFallbackTrigger, type BackendBase} from './scapi-backend-utils.js';

/**
 * Internal state shared by all method invocations on a Proxy. Holds the
 * resolved backend so that once SCAPI succeeds (or we've fallen back to
 * OCAPI), subsequent calls skip the SCAPI attempt.
 */
interface FallbackState<T extends BackendBase> {
  scapi: T;
  ocapi: T;
  domainName: string;
  resolved?: T;
}

/**
 * Wraps a SCAPI call with automatic OCAPI fallback on a recognized
 * fallback trigger ({@link isFallbackTrigger}).
 *
 * Standalone helper so the Proxy traps and any future direct callers share
 * one definition.
 */
async function withFallback<T extends BackendBase, R>(
  state: FallbackState<T>,
  fn: (backend: T) => Promise<R>,
): Promise<R> {
  // Once we've fallen back to OCAPI, stay there — there's no SCAPI surface to
  // re-attempt. Errors propagate from OCAPI directly.
  if (state.resolved === state.ocapi) {
    return fn(state.ocapi);
  }

  // Either unresolved (first call), or already pinned to SCAPI by a prior
  // successful call. We still try SCAPI, but a fallback-trigger error here
  // routes this call through OCAPI and re-pins. This handles the case where
  // a read succeeds (pinning SCAPI) and then a write fails because the
  // ScopeTierManager has been downgraded to read-only — the write should
  // still satisfy through OCAPI rather than throwing.
  const target = state.resolved ?? state.scapi;
  try {
    const result = await fn(target);
    if (!state.resolved) state.resolved = state.scapi;
    return result;
  } catch (error) {
    if (isFallbackTrigger(error)) {
      getLogger().info(`SCAPI ${state.domainName} unavailable for this operation, falling back to OCAPI`);
      state.resolved = state.ocapi;
      return fn(state.ocapi);
    }
    throw error;
  }
}

/**
 * Creates a fallback wrapper over `scapi` and `ocapi` backends.
 *
 * The returned object presents the same interface as `T`. Method calls are
 * intercepted: the first call tries SCAPI; on `invalid_scope` it falls back
 * to OCAPI. The choice is cached for the wrapper's lifetime.
 *
 * **Contract:**
 * - Both `scapi` and `ocapi` must implement `T`. TypeScript enforces this
 *   at the call site since both are typed as `T`.
 * - Only methods of `T` are routed through the fallback logic. The `name`
 *   getter is special-cased to reflect the resolved backend.
 * - **Non-method properties** are returned from the SCAPI target only and
 *   are not switched on fallback. By convention, backends should be method
 *   bags — any state beyond `name` should be encapsulated, not exposed.
 * - **Concurrency:** if two calls race before resolution, both may attempt
 *   SCAPI. This is benign for read operations (idempotent retries) and
 *   acceptable for writes (both either succeed or fail with the same
 *   error). Each Proxy instance has its own state, so this concerns only
 *   shared use of a single wrapper.
 *
 * @param scapi - Primary (SCAPI) backend implementation
 * @param ocapi - Fallback (OCAPI) backend implementation
 * @param domainName - Used in fallback log messages, e.g. `'jobs'`
 * @returns A Proxy over `scapi` whose methods route through fallback logic
 *
 * @example
 * ```ts
 * const backend = createFallbackBackend<JobsBackend>(scapiJobs, ocapiJobs, 'jobs');
 * await backend.executeJob('my-job'); // tries SCAPI, may fall back to OCAPI
 * ```
 */
export function createFallbackBackend<T extends BackendBase>(scapi: T, ocapi: T, domainName: string): T {
  const state: FallbackState<T> = {scapi, ocapi, domainName};

  return new Proxy(scapi, {
    get(target, prop, receiver) {
      // Special property: `name` reflects whichever backend has handled requests so far.
      if (prop === 'name') {
        return (state.resolved ?? scapi).name;
      }

      const value = Reflect.get(target, prop, receiver);

      // Non-functions (constants, getters): return as-is from the SCAPI backend.
      // Wrappers don't currently expose any non-method state besides `name`,
      // but this keeps the Proxy transparent for property access.
      if (typeof value !== 'function') {
        return value;
      }

      // For each method, return a wrapper that routes the call through fallback.
      // We must look up the method by name on the resolved backend (not on the
      // SCAPI target we're proxying), since the OCAPI backend may have a
      // different implementation.
      //
      // If the method is missing from OCAPI (e.g., a SCAPI-only capability like
      // delete), don't attempt a fallback — let SCAPI handle it directly.
      // The caller should use the type-guard pattern (e.g. supportsDeleteJobExecution)
      // to detect this before calling.
      const ocapiHasMethod = typeof (ocapi as unknown as Record<string | symbol, unknown>)[prop] === 'function';
      if (!ocapiHasMethod) {
        return (...args: unknown[]) => {
          const fn = (scapi as unknown as Record<string | symbol, unknown>)[prop];
          return (fn as (...a: unknown[]) => Promise<unknown>).apply(scapi, args);
        };
      }

      return (...args: unknown[]) =>
        withFallback(state, (backend) => {
          const fn = (backend as unknown as Record<string | symbol, unknown>)[prop];
          if (typeof fn !== 'function') {
            throw new TypeError(`Method ${String(prop)} is not a function on ${backend.name} backend`);
          }
          return (fn as (...a: unknown[]) => Promise<unknown>).apply(backend, args);
        });
    },
  }) as T;
}
