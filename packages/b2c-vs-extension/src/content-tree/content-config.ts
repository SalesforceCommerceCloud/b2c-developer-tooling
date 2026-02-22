/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import type {Library} from '@salesforce/b2c-tooling-sdk/operations/content';
import type {B2CExtensionConfig} from '../config-provider.js';

export interface BrowsedLibrary {
  id: string;
  isSiteLibrary: boolean;
}

export class ContentConfigProvider {
  private libraries: BrowsedLibrary[] = [];
  private libraryCache = new Map<string, Library>();

  constructor(private readonly configProvider: B2CExtensionConfig) {
    configProvider.onDidReset(() => {
      this.libraryCache.clear();
    });
  }

  getInstance(): B2CInstance | null {
    return this.configProvider.getInstance();
  }

  getConfigError(): string | null {
    return this.configProvider.getConfigError();
  }

  getContentLibrary(): string | undefined {
    return this.configProvider.getConfig()?.values.contentLibrary;
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
    this.libraryCache.delete(id);
  }

  getCachedLibrary(id: string): Library | undefined {
    return this.libraryCache.get(id);
  }

  setCachedLibrary(id: string, library: Library): void {
    this.libraryCache.set(id, library);
  }

  invalidateLibrary(id: string): void {
    this.libraryCache.delete(id);
  }

  clearCache(): void {
    this.libraryCache.clear();
  }

  reset(): void {
    this.libraryCache.clear();
  }
}
