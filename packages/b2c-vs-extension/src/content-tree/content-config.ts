/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {findDwJson, resolveConfig} from '@salesforce/b2c-tooling-sdk/config';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import type {Library} from '@salesforce/b2c-tooling-sdk/operations/content';
import * as fs from 'fs';
import * as vscode from 'vscode';

export interface BrowsedLibrary {
  id: string;
  isSiteLibrary: boolean;
}

export class ContentConfigProvider {
  private instance: B2CInstance | null = null;
  private configError: string | null = null;
  private resolved = false;
  private libraries: BrowsedLibrary[] = [];
  private libraryCache = new Map<string, Library>();
  private contentLibrary: string | undefined;

  getInstance(): B2CInstance | null {
    if (!this.resolved) {
      this.resolve();
    }
    return this.instance;
  }

  getConfigError(): string | null {
    if (!this.resolved) {
      this.resolve();
    }
    return this.configError;
  }

  getContentLibrary(): string | undefined {
    if (!this.resolved) {
      this.resolve();
    }
    return this.contentLibrary;
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
    this.instance = null;
    this.configError = null;
    this.resolved = false;
    this.libraryCache.clear();
  }

  private resolve(): void {
    this.resolved = true;
    try {
      let workingDirectory = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
      if (!workingDirectory || workingDirectory === '/' || !fs.existsSync(workingDirectory)) {
        workingDirectory = '';
      }
      const dwPath = workingDirectory ? findDwJson(workingDirectory) : undefined;
      const config = dwPath ? resolveConfig({}, {configPath: dwPath}) : resolveConfig({}, {workingDirectory});

      this.contentLibrary = config.values.contentLibrary;

      if (!config.hasB2CInstanceConfig()) {
        this.configError = 'No B2C Commerce instance configured.';
        this.instance = null;
        return;
      }

      this.instance = config.createB2CInstance();
      this.configError = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.configError = message;
      this.instance = null;
    }
  }
}
