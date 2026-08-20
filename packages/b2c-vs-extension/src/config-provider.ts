/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  resolveConfig,
  EnvSource,
  getB2CSettingsPath,
  mergeProjectEnvironment,
  readB2CSettings,
  readProjectEnvironment,
  type NormalizedConfig,
  type ResolveConfigOptions,
  type ResolvedB2CConfig,
  type CreateOAuthOptions,
} from '@salesforce/b2c-tooling-sdk/config';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import {readFile} from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import {findWorkspaceDwJson, isUnscannableRoot} from './workspace-discovery.js';

const DW_JSON = 'dw.json';
const DOT_ENV = '.env';
const PROJECT_ROOT_KEY = 'b2c-dx.projectRoot';

/** Async existence check via vscode.workspace.fs (no sync IO on the hot path). */
async function pathExists(p: string): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(vscode.Uri.file(p));
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect the best project directory for B2C config resolution.
 *
 * Scans all workspace folders for B2C indicators in priority order:
 * 1. Directory containing dw.json (strongest signal; nested directories included)
 * 2. Folder containing .env with SFCC_* variables
 * 3. Folder containing package.json with `b2c` key
 * 4. Falls back to first folder (current behavior)
 */
async function detectWorkingDirectory(log: vscode.OutputChannel): Promise<string> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    // No workspace folders (empty window). The extension can still be activated
    // implicitly by its typescriptServerPlugins contribution when any JS/TS file
    // is opened, so we must NOT fall back to process.cwd() here — the extension
    // host's cwd is arbitrary (often the user's home directory), and downstream
    // filesystem discovery (findCartridges / detectWorkspaceType) would then
    // recursively scan it on the shared extension-host thread, freezing every
    // other extension (W-23618508). Return no working directory so all
    // discovery is skipped.
    log.appendLine('[Config] No workspace folders open; skipping filesystem discovery (no working directory)');
    return '';
  }

  const folderNames = folders.map((f) => f.uri.fsPath).join(', ');
  log.appendLine(`[Config] Scanning workspace folders for a B2C project (${folderNames})...`);

  const dwJson = await findWorkspaceDwJson();
  if (dwJson) {
    const projectDirectory = path.dirname(dwJson.fsPath);
    log.appendLine(`[Config] Selected project directory via dw.json: ${projectDirectory}`);
    return projectDirectory;
  }

  for (const folder of folders) {
    const envPath = path.join(folder.uri.fsPath, DOT_ENV);
    try {
      const content = await readFile(envPath, 'utf-8');
      if (/^SFCC_/m.test(content)) {
        log.appendLine(`[Config] Selected workspace folder via .env with SFCC_* vars: ${folder.uri.fsPath}`);
        return folder.uri.fsPath;
      }
    } catch {
      // Ignore missing or unreadable files
    }
  }

  for (const folder of folders) {
    const pkgPath = path.join(folder.uri.fsPath, 'package.json');
    try {
      const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
      if (pkg && typeof pkg === 'object' && 'b2c' in pkg) {
        log.appendLine(`[Config] Selected workspace folder via package.json "b2c" key: ${folder.uri.fsPath}`);
        return folder.uri.fsPath;
      }
    } catch {
      // Ignore missing files or parse errors
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
  private resolvedEnvironment: Record<string, string | undefined>;

  private readonly _onDidReset = new vscode.EventEmitter<void>();
  readonly onDidReset = this._onDidReset.event;

  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly log: vscode.OutputChannel,
    private readonly workspaceState?: vscode.Memento,
    private readonly ambientEnvironment: NodeJS.ProcessEnv = process.env,
  ) {
    this.resolvedEnvironment = ambientEnvironment;
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

    const settingsPath = getB2CSettingsPath({environment: this.ambientEnvironment});
    const settingsWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(vscode.Uri.file(path.dirname(settingsPath)), path.basename(settingsPath)),
    );
    const resetForSettingsChange = (): void => {
      this.log.appendLine(`[Config] Shared settings changed: ${settingsPath}`);
      this.reset();
    };
    settingsWatcher.onDidChange(resetForSettingsChange);
    settingsWatcher.onDidCreate(resetForSettingsChange);
    settingsWatcher.onDidDelete(resetForSettingsChange);
    this.disposables.push(settingsWatcher);
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
   * Either the pinned project root or the auto-detected project directory.
   */
  getWorkingDirectory(): string {
    return this.detectedDirectory;
  }

  /** Return the ordered primary and global files used by instance-management features. */
  getInstanceCatalogOptions(): ResolveConfigOptions {
    const workingDirectory = this.detectedDirectory;
    let projectConfigPath: string | undefined;
    try {
      projectConfigPath = readProjectEnvironment(workingDirectory)?.SFCC_CONFIG;
    } catch {
      // Configuration resolution reports malformed project environments separately.
    }
    const configPath =
      this.ambientEnvironment.SFCC_CONFIG ||
      (projectConfigPath && workingDirectory
        ? path.isAbsolute(projectConfigPath)
          ? projectConfigPath
          : path.resolve(workingDirectory, projectConfigPath)
        : undefined);
    return {
      workingDirectory,
      configPath,
      defaultConfigPath: readB2CSettings({environment: this.ambientEnvironment}).defaultConfigPath,
    };
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
    this.resolvedEnvironment = this.ambientEnvironment;
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
    const {config} = await this.resolveProjectConfiguration(workingDirectory, overrides);
    return config;
  }

  /**
   * Returns CreateOAuthOptions with VS Code-specific overrides for browser-based
   * user authentication (PKCE — and the legacy implicit flow):
   * - Uses `vscode.env.openExternal` to open the browser on the client (works in Codespaces/remote)
   * - Uses `vscode.env.asExternalUri` to resolve the redirect URI for port forwarding
   *
   * Merge with any additional options before passing to `config.createOAuth()`
   * or `config.createB2CInstance()`.
   */
  async getUserAuthOptions(): Promise<CreateOAuthOptions> {
    const localPort = parseInt(this.resolvedEnvironment.SFCC_OAUTH_LOCAL_PORT || '', 10) || 8080;
    const localUri = vscode.Uri.parse(`http://localhost:${localPort}`);
    const externalUri = await vscode.env.asExternalUri(localUri);

    return {
      redirectUri: (
        this.resolvedEnvironment.SFCC_REDIRECT_URI || externalUri.toString(/* skipEncoding */ true)
      ).replace(/\/$/, ''),
      openBrowser: async (url: string) => {
        await vscode.env.openExternal(vscode.Uri.parse(url));
      },
    };
  }

  /**
   * @deprecated Use {@link getUserAuthOptions}. Retained for callsite stability;
   * the returned options work for both PKCE and legacy implicit flows.
   */
  async getImplicitAuthOptions(): Promise<CreateOAuthOptions> {
    return this.getUserAuthOptions();
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
      if (pinnedRoot && (await pathExists(pinnedRoot))) {
        workingDirectory = pinnedRoot;
        this.pinned = true;
        this.log.appendLine(`[Config] Using pinned project root: ${pinnedRoot}`);
      } else {
        if (pinnedRoot) {
          // Pinned path no longer exists — clear it
          this.log.appendLine(`[Config] Pinned project root no longer exists, clearing: ${pinnedRoot}`);
          void this.workspaceState?.update(PROJECT_ROOT_KEY, undefined);
        }
        workingDirectory = await detectWorkingDirectory(this.log);
        this.pinned = false;
      }
      // Never resolve config or run discovery out of a home/root directory or a
      // path that no longer exists. isUnscannableRoot() also covers ''/'/' — a
      // home-directory-as-folder layout must not trigger recursive scans that
      // would stall the extension host (W-23618508).
      if (isUnscannableRoot(workingDirectory) || !(await pathExists(workingDirectory))) {
        if (workingDirectory) {
          this.log.appendLine(
            `[Config] Working directory ${workingDirectory} is a home/root or missing path; skipping discovery`,
          );
        }
        workingDirectory = '';
      }
      this.detectedDirectory = workingDirectory;
      this.log.appendLine(`[Config] Resolving config from ${workingDirectory || '(no working directory)'}`);

      const {config, environment} = await this.resolveProjectConfiguration(workingDirectory);
      this.config = config;
      this.resolvedEnvironment = environment;

      if (!config.hasB2CInstanceConfig()) {
        this.configError = 'No B2C Commerce instance configured.';
        this.instance = null;
        this.log.appendLine('[Config] No B2C Commerce instance configured');
        return;
      }

      const implicitAuthOpts = await this.getImplicitAuthOptions();
      this.instance = config.createB2CInstance(implicitAuthOpts);
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

  private async resolveProjectConfiguration(
    workingDirectory: string,
    overrides: Partial<NormalizedConfig> = {},
  ): Promise<{config: ResolvedB2CConfig; environment: Record<string, string | undefined>}> {
    let projectEnvironment: Record<string, string | undefined> | undefined;
    if (workingDirectory) {
      const environmentPath = path.join(workingDirectory, DOT_ENV);
      try {
        projectEnvironment = readProjectEnvironment(workingDirectory);
        if (projectEnvironment) this.log.appendLine(`[Config] Loaded project environment: ${environmentPath}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.log.appendLine(`[Config] Failed to load project environment: ${message}`);
      }
    }

    const environment = mergeProjectEnvironment(projectEnvironment, this.ambientEnvironment);
    const processConfigPath = this.ambientEnvironment.SFCC_CONFIG || undefined;
    const projectConfigPath = projectEnvironment?.SFCC_CONFIG;
    const configPath =
      processConfigPath ??
      (projectConfigPath && workingDirectory
        ? path.isAbsolute(projectConfigPath)
          ? projectConfigPath
          : path.resolve(workingDirectory, projectConfigPath)
        : undefined);
    if (configPath) this.log.appendLine(`[Config] Using explicit config path: ${configPath}`);

    const {defaultConfigPath} = readB2CSettings({environment: this.ambientEnvironment});
    if (defaultConfigPath) {
      this.log.appendLine(`[Config] Global dw.json: ${defaultConfigPath}`);
    }

    const config = await resolveConfig(overrides, {
      workingDirectory,
      configPath,
      defaultConfigPath,
      sourcesBefore: [new EnvSource(environment)],
    });
    return {config, environment};
  }
}
