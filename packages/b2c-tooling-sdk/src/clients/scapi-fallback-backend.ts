/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Generic fallback wrapper for SCAPI/OCAPI dual backends.
 *
 * Each domain (jobs, scripts, users, roles) gets a thin subclass that
 * delegates each interface method through `withFallback`. The wrapper itself
 * holds no domain knowledge — it only implements the "try SCAPI first; on
 * `invalid_scope`, fall back to OCAPI; cache the choice" behavior.
 *
 * @module clients/scapi-fallback-backend
 */
import {getLogger} from '../logging/logger.js';
import {isInvalidScopeError, type BackendBase} from './scapi-backend-utils.js';

/**
 * Base class for `Fallback*Backend` implementations. Subclasses implement
 * the domain interface (e.g., `JobsBackend`) by delegating each method to
 * `withFallback`.
 *
 * @example
 * ```ts
 * class FallbackJobsBackend extends ScapiFallbackBackend<JobsBackend> implements JobsBackend {
 *   async executeJob(jobId: string, options?: ExecuteJobOptions) {
 *     return this.withFallback((b) => b.executeJob(jobId, options));
 *   }
 *   // ... one delegating method per interface method
 * }
 * ```
 */
export abstract class ScapiFallbackBackend<T extends BackendBase> {
  protected resolvedBackend?: T;

  constructor(
    protected scapiBackend: T,
    protected ocapiBackend: T,
    /** Used in fallback log messages, e.g. `'jobs'`, `'scripts'`. */
    protected domainName: string,
  ) {}

  /**
   * Reports the backend that served the last successful call. Defaults to
   * `'scapi'` before the first call, since that's what we'd try first.
   */
  get name(): 'ocapi' | 'scapi' {
    return this.resolvedBackend?.name ?? this.scapiBackend.name;
  }

  /**
   * Runs `fn` against the resolved backend, or against SCAPI first with
   * automatic OCAPI fallback on `invalid_scope`. The choice is cached: once
   * a backend has succeeded (or fallen back), all subsequent calls go to it.
   */
  protected async withFallback<R>(fn: (backend: T) => Promise<R>): Promise<R> {
    if (this.resolvedBackend) {
      return fn(this.resolvedBackend);
    }

    try {
      const result = await fn(this.scapiBackend);
      this.resolvedBackend = this.scapiBackend;
      return result;
    } catch (error) {
      if (isInvalidScopeError(error)) {
        getLogger().info(`SCAPI ${this.domainName} scope unavailable, falling back to OCAPI`);
        this.resolvedBackend = this.ocapiBackend;
        return fn(this.ocapiBackend);
      }
      throw error;
    }
  }
}
