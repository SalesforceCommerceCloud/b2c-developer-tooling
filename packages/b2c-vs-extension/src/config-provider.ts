/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  resolveConfig,
  type NormalizedConfig,
  type ResolveConfigOptions,
  type ResolvedB2CConfig,
} from '@salesforce/b2c-tooling-sdk/config';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import {getPluginConfigSources} from './plugins.js';

/**
 * Resolves configuration with plugin sources automatically injected.
 */
function resolveConfigWithPlugins(
  overrides: Partial<NormalizedConfig> = {},
  options: ResolveConfigOptions = {},
): ResolvedB2CConfig {
  const {sourcesBefore, sourcesAfter} = getPluginConfigSources();
  return resolveConfig(overrides, {
    ...options,
    sourcesBefore: [...sourcesBefore, ...(options.sourcesBefore ?? [])],
    sourcesAfter: [...(options.sourcesAfter ?? []), ...sourcesAfter],
  });
}

const DW_JSON = 'dw.json';

/**
 * Centralized B2C config provider for the VS Code extension.
 *
 * Resolves config from dw.json / env vars once, caches the result,
 * and exposes an event so all features can react to config changes.
 * Watches for dw.json changes via both a FileSystemWatcher (external edits,
 * creates, deletes) and onDidSaveTextDocument (in-editor saves).
 */
export class B2CExtensionConfig implements vscode.Disposable {
  private config: ResolvedB2CConfig | null = null;
  private instance: B2CInstance | null = null;
  private configError: string | null = null;
  private resolved = false;

  private readonly _onDidReset = new vscode.EventEmitter<void>();
  readonly onDidReset = this._onDidReset.event;

  private readonly disposables: vscode.Disposable[] = [];

  constructor(private readonly log: vscode.OutputChannel) {
    // Watch for dw.json saves made within VS Code (most reliable for in-editor edits)
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (path.basename(doc.fileName) === DW_JSON) {
          this.log.appendLine(`[Config] dw.json saved in editor: ${doc.fileName}`);
          this.reset();
        }
      }),
    );

    // FileSystemWatcher per workspace folder for external changes and create/delete.
    // RelativePattern is more reliable than a bare glob string on macOS.
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      const pattern = new vscode.RelativePattern(folder, `**/${DW_JSON}`);
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);
      watcher.onDidChange((uri) => {
        this.log.appendLine(`[Config] dw.json changed (fs watcher): ${uri.fsPath}`);
        this.reset();
      });
      watcher.onDidCreate((uri) => {
        this.log.appendLine(`[Config] dw.json created: ${uri.fsPath}`);
        this.reset();
      });
      watcher.onDidDelete((uri) => {
        this.log.appendLine(`[Config] dw.json deleted: ${uri.fsPath}`);
        this.reset();
      });
      this.disposables.push(watcher);
      this.log.appendLine(`[Config] File watcher registered for ${folder.uri.fsPath}/**/${DW_JSON}`);
    }
  }

  getConfig(): ResolvedB2CConfig | null {
    if (!this.resolved) {
      this.resolve();
    }
    return this.config;
  }

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

  reset(): void {
    this.log.appendLine('[Config] Resetting cached config (will re-resolve on next access)');
    this.config = null;
    this.instance = null;
    this.configError = null;
    this.resolved = false;
    this._onDidReset.fire();
  }

  /**
   * Uncached config resolution for a specific directory.
   * Used by deploy-cartridge where the project directory differs from the workspace root.
   */
  resolveForDirectory(workingDirectory: string, overrides: Partial<NormalizedConfig> = {}): ResolvedB2CConfig {
    return resolveConfigWithPlugins(overrides, {workingDirectory});
  }

  dispose(): void {
    this._onDidReset.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }

  private resolve(): void {
    this.resolved = true;
    try {
      let workingDirectory = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
      if (!workingDirectory || workingDirectory === '/' || !fs.existsSync(workingDirectory)) {
        workingDirectory = '';
      }
      this.log.appendLine(`[Config] Resolving config from ${workingDirectory || '(no working directory)'}`);
      const config = resolveConfigWithPlugins({}, {workingDirectory});
      this.config = config;

      if (!config.hasB2CInstanceConfig()) {
        this.configError = 'No B2C Commerce instance configured.';
        this.instance = null;
        this.log.appendLine('[Config] No B2C Commerce instance configured');
        return;
      }

      this.instance = config.createB2CInstance();
      this.configError = null;
      this.log.appendLine(`[Config] Resolved instance: ${this.instance.config.hostname}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.configError = message;
      this.config = null;
      this.instance = null;
      this.log.appendLine(`[Config] Resolution failed: ${message}`);
    }
  }
}
