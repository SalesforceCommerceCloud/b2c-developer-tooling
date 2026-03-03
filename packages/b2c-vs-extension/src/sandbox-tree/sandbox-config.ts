/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {B2CExtensionConfig} from '../config-provider.js';

export interface SandboxInfo {
  id: string;
  realm?: string;
  instance?: string;
  state?: string;
  hostName?: string;
  createdAt?: string;
  eol?: string;
  profile?: string;
  createdBy?: string;
  autoScheduled?: boolean;
  links?: Array<{href: string; rel: string}>;
  [key: string]: unknown;
}

/**
 * Manages the list of browsed realms and per-realm sandbox caches.
 * Mirrors the ContentConfigProvider pattern.
 */
export class SandboxConfigProvider {
  private realms: string[] = [];
  private sandboxCache = new Map<string, SandboxInfo[]>();

  constructor(private readonly configProvider: B2CExtensionConfig) {
    configProvider.onDidReset(() => {
      this.sandboxCache.clear();
    });
  }

  getConfigProvider(): B2CExtensionConfig {
    return this.configProvider;
  }

  getRealms(): string[] {
    return this.realms;
  }

  addRealm(realm: string): void {
    const r = realm.trim();
    if (r && !this.realms.includes(r)) {
      this.realms.push(r);
    }
  }

  removeRealm(realm: string): void {
    this.realms = this.realms.filter((r) => r !== realm);
    this.sandboxCache.delete(realm);
  }

  getCachedSandboxes(realm: string): SandboxInfo[] | undefined {
    return this.sandboxCache.get(realm);
  }

  setCachedSandboxes(realm: string, sandboxes: SandboxInfo[]): void {
    this.sandboxCache.set(realm, sandboxes);
  }

  invalidateRealm(realm: string): void {
    this.sandboxCache.delete(realm);
  }

  clearCache(): void {
    this.sandboxCache.clear();
  }

  /** Read the configured `realm` from dw.json (via SDK normalization). */
  getConfiguredRealm(): string | undefined {
    return this.configProvider.getConfig()?.values.realm;
  }

  /**
   * Derive a realm guess from the configured hostname.
   * e.g. "abcd-001.dx.commercecloud.salesforce.com" → "abcd"
   */
  getHostnameRealm(): string | undefined {
    const config = this.configProvider.getConfig();
    if (!config) return undefined;
    const hostname = config.values.hostname;
    if (!hostname || typeof hostname !== 'string') return undefined;
    const firstSegment = hostname.split('.')[0] ?? '';
    const realm = firstSegment.split('-')[0] ?? '';
    return realm || undefined;
  }

  /** Get the default realm: explicit config > hostname derivation. */
  getDefaultRealm(): string {
    return this.getConfiguredRealm() ?? this.getHostnameRealm() ?? '';
  }
}
