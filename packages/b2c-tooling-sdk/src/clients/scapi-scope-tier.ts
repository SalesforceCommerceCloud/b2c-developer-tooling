/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Scope-tier client manager for SCAPI domains with dual scopes.
 *
 * Many SCAPI Admin APIs expose two scopes — read-only and read-write
 * (e.g., `sfcc.jobs` and `sfcc.jobs.rw`). A given API client may have only
 * one of them configured in Account Manager. The optimistic strategy is to
 * request `rw` first and downgrade to read-only only when `invalid_scope`
 * is detected on a read operation.
 *
 * `ScopeTierManager` encapsulates that state machine so each SCAPI backend
 * doesn't have to reimplement it. Write operations always require `rw`;
 * if we already know the client only has read scope, the manager throws
 * a descriptive error rather than making a doomed request.
 *
 * @module clients/scapi-scope-tier
 */

export type ScopeTier = 'rw' | 'read-only';

export interface ScopeTierManagerOptions<C> {
  /** Builds a typed SCAPI client with the given OAuth scopes. */
  buildClient(scopes: string[]): C;
  /** Scopes for read-write operations, e.g., `['sfcc.jobs.rw']`. */
  rwScopes: string[];
  /** Scopes for read-only operations, e.g., `['sfcc.jobs']`. */
  readScopes: string[];
  /** Domain name surfaced in error messages, e.g. `'Jobs'`, `'Scripts'`. */
  domainName: string;
}

/**
 * Lazy-initialized manager for clients at different scope tiers.
 *
 * - First read or write call builds the rw client and caches it.
 * - If the caller detects an `invalid_scope` error on a read attempt, it
 *   calls `downgradeToReadOnly()` and the next read uses the read-only client.
 * - Once downgraded, write requests throw — the API client lacks rw scope.
 *
 * The same rw client serves both read and write while the rw scope is valid;
 * we only build a separate read-only client after a downgrade.
 */
export class ScopeTierManager<C> {
  private rwClient?: C;
  private readClient?: C;
  private resolved?: ScopeTier;

  constructor(private opts: ScopeTierManagerOptions<C>) {}

  /** The currently-resolved tier, or undefined before first use. */
  get resolvedTier(): ScopeTier | undefined {
    return this.resolved;
  }

  /**
   * Returns a client suitable for write operations. Throws if we've already
   * downgraded to read-only — the API client doesn't have the rw scope.
   */
  getClientForWrite(): C {
    if (this.resolved === 'read-only') {
      throw new Error(
        `SCAPI ${this.opts.domainName} API requires the "${this.opts.rwScopes.join(' ')}" scope. ` +
          `Add this scope to your API client in Account Manager.`,
      );
    }
    if (!this.rwClient) {
      this.rwClient = this.opts.buildClient(this.opts.rwScopes);
    }
    this.resolved = 'rw';
    return this.rwClient;
  }

  /**
   * Returns a client suitable for read operations. Prefers the rw client if
   * it's already been used successfully (rw scope grants read too).
   */
  getClientForRead(): C {
    if (this.resolved === 'read-only') {
      // Already downgraded; readClient is built in downgradeToReadOnly()
      return this.readClient!;
    }
    if (!this.rwClient) {
      this.rwClient = this.opts.buildClient(this.opts.rwScopes);
    }
    this.resolved = 'rw';
    return this.rwClient;
  }

  /**
   * Marks the rw scope as unavailable and builds a read-only client.
   * Subsequent `getClientForWrite()` calls will throw; reads use the
   * read-only client.
   */
  downgradeToReadOnly(): void {
    this.resolved = 'read-only';
    this.readClient = this.opts.buildClient(this.opts.readScopes);
  }
}
