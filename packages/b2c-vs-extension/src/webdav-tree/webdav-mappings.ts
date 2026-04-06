/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';

/**
 * Manages catalog and library ID mappings for the WebDAV tree.
 *
 * Seeds IDs from config (`catalogs`, `libraries`, `contentLibrary`) and
 * supports runtime additions/removals. On config reset, re-seeds from
 * config — manual additions are discarded. Users wanting persistence
 * should add IDs to dw.json.
 */
export class WebDavMappingsProvider {
  private catalogIds: string[] = [];
  private libraryIds: string[] = [];

  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChange = this._onDidChange.event;

  constructor(private readonly configProvider: B2CExtensionConfig) {
    configProvider.onDidReset(() => this.seedFromConfig());
  }

  /** Re-read config and reset catalog/library lists. */
  seedFromConfig(): void {
    const config = this.configProvider.getConfig();
    this.catalogIds = [...(config?.values.catalogs ?? [])];

    const libs = new Set<string>(config?.values.libraries ?? []);
    const contentLib = config?.values.contentLibrary;
    if (contentLib) libs.add(contentLib);
    this.libraryIds = [...libs];

    this._onDidChange.fire();
  }

  getCatalogIds(): string[] {
    return this.catalogIds;
  }

  getLibraryIds(): string[] {
    return this.libraryIds;
  }

  /**
   * Returns the effective content library ID.
   * Prefers the explicit `contentLibrary` config value, then falls back
   * to the first entry in `libraries`.
   */
  getEffectiveContentLibrary(): string | undefined {
    return this.configProvider.getConfig()?.values.contentLibrary ?? this.libraryIds[0];
  }

  addCatalog(id: string): void {
    if (!this.catalogIds.includes(id)) {
      this.catalogIds.push(id);
      this._onDidChange.fire();
    }
  }

  removeCatalog(id: string): void {
    const idx = this.catalogIds.indexOf(id);
    if (idx !== -1) {
      this.catalogIds.splice(idx, 1);
      this._onDidChange.fire();
    }
  }

  addLibrary(id: string): void {
    if (!this.libraryIds.includes(id)) {
      this.libraryIds.push(id);
      this._onDidChange.fire();
    }
  }

  removeLibrary(id: string): void {
    const idx = this.libraryIds.indexOf(id);
    if (idx !== -1) {
      this.libraryIds.splice(idx, 1);
      this._onDidChange.fire();
    }
  }
}
