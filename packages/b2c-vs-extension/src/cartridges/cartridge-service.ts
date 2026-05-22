/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {findCartridges, type CartridgeMapping} from '@salesforce/b2c-tooling-sdk/operations/code';

import * as vscode from 'vscode';

import type {B2CExtensionConfig} from '../config-provider.js';

/**
 * Workspace cartridge enumeration shared across features that need to know
 * which directories are cartridges (code-sync tree, Script API IntelliSense, etc.).
 *
 * Caches the result of `findCartridges()` and refreshes when:
 *   - any `.project` file is added or removed in the workspace,
 *   - the active config resets (project root change, instance switch),
 *   - a feature explicitly calls `refresh()`.
 */
export class CartridgeService implements vscode.Disposable {
  private cartridges: CartridgeMapping[] = [];
  private loaded = false;
  private readonly emitter = new vscode.EventEmitter<CartridgeMapping[]>();
  private readonly watcher: vscode.FileSystemWatcher;
  private readonly resetSub: vscode.Disposable;

  readonly onDidChange = this.emitter.event;

  constructor(private readonly configProvider: B2CExtensionConfig) {
    this.watcher = vscode.workspace.createFileSystemWatcher('**/.project');
    this.watcher.onDidCreate(() => this.refresh());
    this.watcher.onDidDelete(() => this.refresh());
    this.resetSub = configProvider.onDidReset(() => this.refresh());
  }

  getCartridges(): CartridgeMapping[] {
    if (!this.loaded) this.reload();
    return this.cartridges;
  }

  getCartridgeRoots(): string[] {
    return this.getCartridges().map((c) => c.src);
  }

  refresh(): void {
    this.reload();
    this.emitter.fire(this.cartridges);
  }

  private reload(): void {
    const cwd = this.configProvider.getWorkingDirectory();
    if (!cwd) {
      this.cartridges = [];
      this.loaded = true;
      return;
    }
    try {
      this.cartridges = findCartridges(cwd);
    } catch {
      this.cartridges = [];
    }
    this.loaded = true;
  }

  dispose(): void {
    this.watcher.dispose();
    this.resetSub.dispose();
    this.emitter.dispose();
  }
}
