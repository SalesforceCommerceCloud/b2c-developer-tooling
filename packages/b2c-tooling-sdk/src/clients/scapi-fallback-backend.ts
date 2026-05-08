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
 * first; on `invalid_scope`, fall back to OCAPI and cache the choice for the
 * lifetime of the wrapper. The `name` property reflects the currently-active
 * backend ('scapi' before the first call resolves, then whichever survived).
 *
 * @module clients/scapi-fallback-backend
 */
import {getLogger} from '../logging/logger.js';
import {isInvalidScopeError, type BackendBase} from './scapi-backend-utils.js';

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
 * Wraps a SCAPI call with automatic OCAPI fallback on `invalid_scope`.
 *
 * Standalone helper so the Proxy traps and any future direct callers share
 * one definition.
 */
async function withFallback<T extends BackendBase, R>(
  state: FallbackState<T>,
  fn: (backend: T) => Promise<R>,
): Promise<R> {
  if (state.resolved) {
    return fn(state.resolved);
  }

  try {
    const result = await fn(state.scapi);
    state.resolved = state.scapi;
    return result;
  } catch (error) {
    if (isInvalidScopeError(error)) {
      getLogger().info(`SCAPI ${state.domainName} scope unavailable, falling back to OCAPI`);
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
 * @param scapi - Primary (SCAPI) backend implementation
 * @param ocapi - Fallback (OCAPI) backend implementation
 * @param domainName - Used in fallback log messages, e.g. `'jobs'`
 * @returns A Proxy over `scapi` whose methods route through fallback logic
 *
 * @example
 * ```ts
 * const backend = createFallbackBackend(scapiJobs, ocapiJobs, 'jobs');
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
