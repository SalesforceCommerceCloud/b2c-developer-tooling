/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {buildProjectIndex, type ProjectIndex} from '@salesforce/b2c-tooling-sdk/project-index';

import * as vscode from 'vscode';

import type {CartridgeService} from './cartridge-service.js';

/** Files whose changes can change the index: controllers, hook scripts and registrations, Custom APIs. */
const WATCH_GLOBS = ['**/cartridge/**/*.{js,ds,json,yaml,yml}', '**/{package,hooks,steptypes}.json'];
const DEBOUNCE_MS = 400;

const EMPTY: ProjectIndex = {
  version: 1,
  cartridges: [],
  endpoints: [],
  hooks: [],
  customApis: [],
  jobSteps: [],
  errors: [],
};

/**
 * Builds and caches the SDK project index (controllers and routes composed
 * along the cartridge path, hooks, Custom APIs) for the workspace, using the
 * same cartridge order as the Cartridges view.
 *
 * The index is built lazily on first use and rebuilt on demand after cartridge
 * order changes or relevant files change (debounced), so hidden views cost
 * nothing.
 */
export class ProjectIndexService implements vscode.Disposable {
  readonly onDidChange: vscode.Event<void>;

  private readonly emitter = new vscode.EventEmitter<void>();
  private index: ProjectIndex | undefined;
  private timer: NodeJS.Timeout | undefined;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly cartridgeService: CartridgeService,
    private readonly log?: vscode.OutputChannel,
  ) {
    this.onDidChange = this.emitter.event;
    const schedule = () => this.scheduleInvalidate();
    for (const glob of WATCH_GLOBS) {
      const watcher = vscode.workspace.createFileSystemWatcher(glob);
      this.disposables.push(
        watcher,
        watcher.onDidChange(schedule),
        watcher.onDidCreate(schedule),
        watcher.onDidDelete(schedule),
      );
    }
    this.disposables.push(cartridgeService.onDidChange(() => this.invalidate()));
  }

  dispose(): void {
    if (this.timer) clearTimeout(this.timer);
    for (const d of this.disposables) d.dispose();
    this.emitter.dispose();
  }

  /** The current index, building it if needed. Never throws; returns an empty index on failure. */
  getIndex(): ProjectIndex {
    if (!this.index) {
      const started = Date.now();
      try {
        const cartridges = this.cartridgeService.getCartridges().map((c) => ({name: c.name, src: c.src}));
        this.index = buildProjectIndex({cartridges});
        this.log?.appendLine(
          `[Endpoints] Indexed ${this.index.endpoints.length} endpoint(s), ${this.index.hooks.length} hook(s), ` +
            `${this.index.customApis.length} Custom API endpoint(s) in ${Date.now() - started} ms`,
        );
      } catch (error) {
        this.log?.appendLine(`[Endpoints] Indexing failed: ${error instanceof Error ? error.message : String(error)}`);
        this.index = EMPTY;
      }
    }
    return this.index;
  }

  /** Drops the cached index and notifies listeners. */
  invalidate(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.index = undefined;
    this.emitter.fire();
  }

  private scheduleInvalidate(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.invalidate(), DEBOUNCE_MS);
  }
}
