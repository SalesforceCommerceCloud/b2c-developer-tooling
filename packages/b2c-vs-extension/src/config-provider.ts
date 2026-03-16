/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  resolveConfig,
  EnvSource,
  type NormalizedConfig,
  type ResolvedB2CConfig,
} from '@salesforce/b2c-tooling-sdk/config';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

const DW_JSON = 'dw.json';
const DOT_ENV = '.env';
const PROJECT_ROOT_KEY = 'b2c-dx.projectRoot';

/**
 * Detect the best workspace folder for B2C config resolution.
 *
 * Scans all workspace folders for B2C indicators in priority order:
 * 1. Folder containing dw.json (strongest signal)
 * 2. Folder containing .env with SFCC_* variables
 * 3. Folder containing package.json with `b2c` key
 * 4. Falls back to first folder (current behavior)
 *
 * Single-folder workspaces skip scanning (fast path).
 */
function detectWorkingDirectory(log: vscode.OutputChannel): string {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    log.appendLine('[Config] No workspace folders open, falling back to process.cwd()');
    return process.cwd();
  }

  // Single-folder workspace — fast path
  if (folders.length === 1) {
    return folders[0].uri.fsPath;
  }

  // Multi-root: scan for B2C indicators
  const folderNames = folders.map((f) => f.uri.fsPath).join(', ');
  log.appendLine(
    `[Config] Multi-root workspace detected (${folders.length} folders: ${folderNames}), scanning for B2C project...`,
  );

  for (const folder of folders) {
    const dwJsonPath = path.join(folder.uri.fsPath, DW_JSON);
    if (fs.existsSync(dwJsonPath)) {
      log.appendLine(`[Config] Selected workspace folder via dw.json: ${folder.uri.fsPath}`);
      return folder.uri.fsPath;
    }
  }

  for (const folder of folders) {
    const envPath = path.join(folder.uri.fsPath, DOT_ENV);
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        if (/^SFCC_/m.test(content)) {
          log.appendLine(`[Config] Selected workspace folder via .env with SFCC_* vars: ${folder.uri.fsPath}`);
          return folder.uri.fsPath;
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  for (const folder of folders) {
    const pkgPath = path.join(folder.uri.fsPath, 'package.json');
    try {
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (pkg && typeof pkg === 'object' && 'b2c' in pkg) {
          log.appendLine(`[Config] Selected workspace folder via package.json "b2c" key: ${folder.uri.fsPath}`);
          return folder.uri.fsPath;
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Fallback to first folder
  log.appendLine(
    `[Config] No B2C indicators found in any workspace folder, falling back to first folder: ${folders[0].uri.fsPath}`,
  );
  return folders[0].uri.fsPath;
}

/**
 * Centralized B2C config provider for the VS Code extension.
 *
 * Resolves config from dw.json / .env / env vars once, caches the result,
 * and exposes an event so all features can react to config changes.
 * Watches for dw.json and .env changes via both FileSystemWatchers (external edits,
 * creates, deletes) and onDidSaveTextDocument (in-editor saves).
 */
export class B2CExtensionConfig implements vscode.Disposable {
  private config: ResolvedB2CConfig | null = null;
  private instance: B2CInstance | null = null;
  private configError: string | null = null;
  private resolved = false;
  private detectedDirectory = '';
  private pinned = false;

  private readonly _onDidReset = new vscode.EventEmitter<void>();
  readonly onDidReset = this._onDidReset.event;

  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly log: vscode.OutputChannel,
    private readonly workspaceState?: vscode.Memento,
  ) {
    // Watch for dw.json and .env saves made within VS Code (most reliable for in-editor edits)
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        const basename = path.basename(doc.fileName);
        if (basename === DW_JSON || basename === DOT_ENV) {
          this.log.appendLine(`[Config] ${basename} saved in editor: ${doc.fileName}`);
          this.reset();
        }
      }),
    );

    // FileSystemWatcher per workspace folder for external changes and create/delete.
    // RelativePattern is more reliable than a bare glob string on macOS.
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      for (const filename of [DW_JSON, DOT_ENV]) {
        const pattern = new vscode.RelativePattern(folder, `**/${filename}`);
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);
        watcher.onDidChange((uri) => {
          this.log.appendLine(`[Config] ${filename} changed (fs watcher): ${uri.fsPath}`);
          this.reset();
        });
        watcher.onDidCreate((uri) => {
          this.log.appendLine(`[Config] ${filename} created: ${uri.fsPath}`);
          this.reset();
        });
        watcher.onDidDelete((uri) => {
          this.log.appendLine(`[Config] ${filename} deleted: ${uri.fsPath}`);
          this.reset();
        });
        this.disposables.push(watcher);
        this.log.appendLine(`[Config] File watcher registered for ${folder.uri.fsPath}/**/${filename}`);
      }
    }
  }

  getConfig(): ResolvedB2CConfig | null {
    return this.config;
  }

  getInstance(): B2CInstance | null {
    return this.instance;
  }

  getConfigError(): string | null {
    return this.configError;
  }

  /**
   * Returns the working directory used for config resolution.
   * Either the pinned project root or the auto-detected workspace folder.
   */
  getWorkingDirectory(): string {
    return this.detectedDirectory;
  }

  /**
   * Whether the project root was explicitly pinned by the user
   * (vs auto-detected).
   */
  isProjectRootPinned(): boolean {
    return this.pinned;
  }

  /**
   * Ensures configuration has been resolved at least once.
   * Call this before reading from getters when you need fresh data.
   */
  async ensureResolved(): Promise<void> {
    if (!this.resolved) {
      await this.resolveAsync();
    }
  }

  /**
   * Pin a specific folder as the B2C project root.
   * Persisted in workspace state so it survives reloads.
   */
  async setProjectRoot(folderPath: string): Promise<void> {
    this.log.appendLine(`[Config] Pinning project root to: ${folderPath}`);
    await this.workspaceState?.update(PROJECT_ROOT_KEY, folderPath);
    this.reset();
  }

  /**
   * Clear the pinned project root and return to auto-detection.
   */
  async resetProjectRoot(): Promise<void> {
    this.log.appendLine('[Config] Clearing pinned project root, returning to auto-detect');
    await this.workspaceState?.update(PROJECT_ROOT_KEY, undefined);
    this.reset();
  }

  reset(): void {
    this.log.appendLine('[Config] Resetting cached config (will re-resolve asynchronously)');
    this.config = null;
    this.instance = null;
    this.configError = null;
    this.resolved = false;
    this.detectedDirectory = '';
    this.pinned = false;
    // Re-resolve asynchronously, then fire the event so listeners get fresh data
    void this.resolveAsync().then(() => {
      this._onDidReset.fire();
    });
  }

  /**
   * Uncached config resolution for a specific directory.
   * Used by deploy-cartridge where the project directory differs from the workspace root.
   */
  async resolveForDirectory(
    workingDirectory: string,
    overrides: Partial<NormalizedConfig> = {},
  ): Promise<ResolvedB2CConfig> {
    return resolveConfig(overrides, {workingDirectory});
  }

  dispose(): void {
    this._onDidReset.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }

  private async resolveAsync(): Promise<void> {
    this.resolved = true;
    try {
      // Check for pinned project root first
      const pinnedRoot = this.workspaceState?.get<string>(PROJECT_ROOT_KEY);
      let workingDirectory: string;
      if (pinnedRoot && fs.existsSync(pinnedRoot)) {
        workingDirectory = pinnedRoot;
        this.pinned = true;
        this.log.appendLine(`[Config] Using pinned project root: ${pinnedRoot}`);
      } else {
        if (pinnedRoot) {
          // Pinned path no longer exists — clear it
          this.log.appendLine(`[Config] Pinned project root no longer exists, clearing: ${pinnedRoot}`);
          void this.workspaceState?.update(PROJECT_ROOT_KEY, undefined);
        }
        workingDirectory = detectWorkingDirectory(this.log);
        this.pinned = false;
      }
      if (!workingDirectory || workingDirectory === '/' || !fs.existsSync(workingDirectory)) {
        workingDirectory = '';
      }
      this.detectedDirectory = workingDirectory;
      this.log.appendLine(`[Config] Resolving config from ${workingDirectory || '(no working directory)'}`);

      // Load .env file if present (same as CLI's bin/run.js)
      if (workingDirectory) {
        const envFilePath = path.join(workingDirectory, DOT_ENV);
        try {
          if (typeof process.loadEnvFile === 'function' && fs.existsSync(envFilePath)) {
            process.loadEnvFile(envFilePath);
            this.log.appendLine(`[Config] Loaded .env file: ${envFilePath}`);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          this.log.appendLine(`[Config] Failed to load .env file: ${message}`);
        }
      }

      const config = await resolveConfig({}, {workingDirectory, sourcesBefore: [new EnvSource()]});
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
