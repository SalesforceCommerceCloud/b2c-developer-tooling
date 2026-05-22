/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {findCartridges, type CartridgeMapping} from '@salesforce/b2c-tooling-sdk/operations/code';

import * as vscode from 'vscode';

import type {B2CExtensionConfig} from '../config-provider.js';

// Cartridges that conventionally sit at the bottom of the cartridge path when
// the user hasn't told us otherwise (no `cartridges` in dw.json/SFCC_CARTRIDGES).
const KNOWN_BASE_CARTRIDGES = new Set(['modules', 'app_storefront_base']);

/**
 * Order discovered cartridges. Prefer the `cartridges` list resolved from
 * dw.json / SFCC_CARTRIDGES (the same activation order used at deploy time);
 * otherwise fall back to discovery order with known base cartridges last.
 *
 * Cartridges named in the configured order but not present on disk are dropped
 * silently; cartridges present on disk but unnamed in the configured order are
 * appended after the named ones, in discovery order.
 */
function orderCartridges(discovered: CartridgeMapping[], configured: string[] | undefined): CartridgeMapping[] {
  if (configured && configured.length > 0) {
    const byName = new Map(discovered.map((c) => [c.name, c]));
    const ordered: CartridgeMapping[] = [];
    const seen = new Set<string>();
    for (const name of configured) {
      const found = byName.get(name);
      if (found && !seen.has(name)) {
        ordered.push(found);
        seen.add(name);
      }
    }
    for (const c of discovered) {
      if (!seen.has(c.name)) ordered.push(c);
    }
    return ordered;
  }

  const indexed = discovered.map((c, i) => ({c, i}));
  indexed.sort((a, b) => {
    const ab = KNOWN_BASE_CARTRIDGES.has(a.c.name) ? 1 : 0;
    const bb = KNOWN_BASE_CARTRIDGES.has(b.c.name) ? 1 : 0;
    if (ab !== bb) return ab - bb;
    return a.i - b.i;
  });
  return indexed.map((x) => x.c);
}

/**
 * Workspace cartridge enumeration shared across features that need to know
 * which directories are cartridges (code-sync tree, Script API IntelliSense, etc.).
 *
 * The returned list is ordered to match the runtime cartridge path: the
 * `cartridges` field from the resolved dw.json / SFCC_CARTRIDGES config wins,
 * otherwise discovery order with known bases (app_storefront_base, modules)
 * sorted last.
 *
 * Caches the result of `findCartridges()` and refreshes when:
 *   - any `.project` file is added or removed in the workspace,
 *   - the active config resets (project root change, instance switch, dw.json edit),
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
    // A config reset can change the cartridge order (dw.json edit, instance
    // switch) even when the on-disk set is unchanged — re-sort and notify.
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
    let discovered: CartridgeMapping[];
    try {
      discovered = findCartridges(cwd);
    } catch {
      discovered = [];
    }
    const configured = this.configProvider.getConfig()?.values.cartridges;
    this.cartridges = orderCartridges(discovered, configured);
    this.loaded = true;
  }

  dispose(): void {
    this.watcher.dispose();
    this.resetSub.dispose();
    this.emitter.dispose();
  }
}
