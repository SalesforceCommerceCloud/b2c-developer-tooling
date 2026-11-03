/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {resolveLibraryEntries} from '@salesforce/b2c-tooling-sdk/config';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import {fetchContentLibrary, type Library} from '@salesforce/b2c-tooling-sdk/operations/content';
import type {B2CExtensionConfig} from '../config-provider.js';

export interface BrowsedLibrary {
  id: string;
  isSiteLibrary: boolean;
}

export class ContentConfigProvider {
  private libraries: BrowsedLibrary[] = [];
  private libraryCache = new Map<string, Library>();
  private libraryLoads = new Map<string, Promise<Library>>();

  constructor(
    private readonly configProvider: B2CExtensionConfig,
    private readonly fetchLibrary: typeof fetchContentLibrary = fetchContentLibrary,
  ) {
    configProvider.onDidReset(() => {
      // Reset browsed libraries so the next tree refresh re-seeds from the
      // newly active instance's contentLibrary. Libraries from the previous
      // instance may not exist on the new one, and the user can re-add any
      // extras via "Add Library".
      this.libraries = [];
      this.libraryCache.clear();
      this.libraryLoads.clear();
    });
  }

  getInstance(): B2CInstance | null {
    return this.configProvider.getInstance();
  }

  getConfigError(): string | null {
    return this.configProvider.getConfigError();
  }

  getContentLibrary(): string | undefined {
    const config = this.configProvider.getConfig();
    return config?.values.contentLibrary ?? resolveLibraryEntries(config?.values.libraries)[0]?.id;
  }

  /**
   * The explicitly configured singular `contentLibrary` value (or undefined
   * when only `libraries` is set). Use this when you need to distinguish an
   * explicit `contentLibrary` from the `libraries[0]` fallback in
   * {@link getContentLibrary}.
   */
  getExplicitContentLibrary(): string | undefined {
    return this.configProvider.getConfig()?.values.contentLibrary;
  }

  /**
   * Configured library entries (from `libraries` config), normalized to
   * `{id, siteLibrary}` form. Returns an empty array when nothing is configured.
   */
  getConfiguredLibraries(): {id: string; siteLibrary: boolean}[] {
    const config = this.configProvider.getConfig();
    return resolveLibraryEntries(config?.values.libraries).map((entry) => ({
      id: entry.id,
      siteLibrary: entry.siteLibrary === true,
    }));
  }

  /**
   * Site whose cartridge path defines live Page Designer types: the configured
   * `siteId`, else the first browsed site-private library (its ID is the site ID).
   */
  getSiteId(): string | undefined {
    const configured = this.configProvider.getConfig()?.values.siteId;
    if (configured) return configured;
    return (
      this.libraries.find((l) => l.isSiteLibrary)?.id ?? this.getConfiguredLibraries().find((l) => l.siteLibrary)?.id
    );
  }

  getAssetQuery(): string[] | undefined {
    return this.configProvider.getConfig()?.values.assetQuery;
  }

  getLibraries(): BrowsedLibrary[] {
    return this.libraries;
  }

  addLibrary(id: string, isSiteLibrary: boolean): void {
    if (!this.libraries.some((l) => l.id === id && l.isSiteLibrary === isSiteLibrary)) {
      this.libraries.push({id, isSiteLibrary});
    }
  }

  removeLibrary(id: string): void {
    this.libraries = this.libraries.filter((l) => l.id !== id);
    this.invalidateLibrary(id);
  }

  getCachedLibrary(id: string): Library | undefined {
    return this.libraryCache.get(id);
  }

  setCachedLibrary(id: string, library: Library): void {
    this.libraryCache.set(id, library);
  }

  /**
   * Returns the cached library, or fetches it from the instance and caches it.
   * Concurrent calls for the same library share one fetch. A save invalidates
   * the cache, so editors opened (or reopened) afterwards load it here instead
   * of failing until the tree is refreshed.
   */
  async loadLibrary(id: string, isSiteLibrary: boolean): Promise<Library> {
    const cached = this.libraryCache.get(id);
    if (cached) return cached;
    const pending = this.libraryLoads.get(id);
    if (pending) return pending;

    const instance = this.getInstance();
    if (!instance) throw new Error('No B2C Commerce instance configured');
    const load = this.fetchLibrary(instance, id, {isSiteLibrary, assetQuery: this.getAssetQuery()})
      .then(({library}) => {
        // Don't cache a load that a reset or invalidation superseded.
        if (this.libraryLoads.get(id) === load) this.libraryCache.set(id, library);
        return library;
      })
      .finally(() => {
        if (this.libraryLoads.get(id) === load) this.libraryLoads.delete(id);
      });
    this.libraryLoads.set(id, load);
    return load;
  }

  invalidateLibrary(id: string): void {
    this.libraryCache.delete(id);
    this.libraryLoads.delete(id);
  }

  clearCache(): void {
    this.libraryCache.clear();
    this.libraryLoads.clear();
  }

  reset(): void {
    this.clearCache();
  }
}
