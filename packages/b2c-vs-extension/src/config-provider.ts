/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  resolveConfig,
  EnvSource,
  getB2CSettingsPath,
  readB2CSettings,
  readEnvFile,
  resolveEnvFilePath,
  StorefrontNextEnvSource,
  STOREFRONT_NEXT_ENV_VAR_MAP,
  type NormalizedConfig,
  type ResolveConfigOptions,
  type ResolvedB2CConfig,
  type CreateOAuthOptions,
} from '@salesforce/b2c-tooling-sdk/config';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import {readdir, readFile} from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import {isEnvFileCandidate, type EnvFileSelection, type WorkspaceInstanceSelection} from './instance-selection.js';
import {findWorkspaceDwJson, isUnscannableRoot} from './workspace-discovery.js';

const DW_JSON = 'dw.json';
const DOT_ENV = '.env';
const PROJECT_ROOT_KEY = 'b2c-dx.projectRoot';
const WORKSPACE_INSTANCE_KEY = 'b2c-dx.workspaceInstance';
const WORKSPACE_INSTANCE_NONE_KEY = 'b2c-dx.workspaceInstanceNone';
const WORKSPACE_ENV_FILE_KEY = 'b2c-dx.workspaceEnvFile';

/** Matches toolkit (`SFCC_*`) and Storefront Next variable assignments in an env file. */
const B2C_ENV_LINE = new RegExp(
  `^(?:export\\s+)?(?:SFCC_|${Object.keys(STOREFRONT_NEXT_ENV_VAR_MAP).join('=|')}=)`,
  'm',
);

/** Variables loaded from the selected env file, kept separate from the ambient environment. */
interface SelectedEnvFile {
  path?: string;
  values: Record<string, string | undefined>;
  /** Why the selected env file could not be used, when resolution fell back. */
  problem?: string;
}

/** Async existence check via vscode.workspace.fs (no sync IO on the hot path). */
async function pathExists(p: string): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(vscode.Uri.file(p));
    return true;
  } catch {
    return false;
  }
}

/** List env file candidates (`.env`, `.env.*` excluding templates) in a directory. */
export async function listEnvFileCandidates(directory: string): Promise<string[]> {
  if (!directory) return [];
  try {
    const entries = await readdir(directory, {withFileTypes: true});
    return entries
      .filter((entry) => entry.isFile() && isEnvFileCandidate(entry.name))
      .map((entry) => path.join(directory, entry.name))
      .sort((a, b) => (path.basename(a) === DOT_ENV ? -1 : path.basename(b) === DOT_ENV ? 1 : a.localeCompare(b)));
  } catch {
    return [];
  }
}

/**
 * Detect the best project directory for B2C config resolution.
 *
 * Scans all workspace folders for B2C indicators in priority order:
 * 1. Directory containing dw.json (strongest signal; nested directories included)
 * 2. Folder containing an env file (.env or .env.*) with SFCC_* or Storefront Next variables
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
    for (const envPath of await listEnvFileCandidates(folder.uri.fsPath)) {
      try {
        const content = await readFile(envPath, 'utf-8');
        if (B2C_ENV_LINE.test(content)) {
          log.appendLine(
            `[Config] Selected workspace folder via ${path.basename(envPath)} with B2C variables: ${folder.uri.fsPath}`,
          );
          return folder.uri.fsPath;
        }
      } catch {
        // Ignore unreadable files
      }
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
  private workspaceInstanceSelection: WorkspaceInstanceSelection | undefined;
  private workspaceInstanceDisabled: boolean;
  private envFileSelection: EnvFileSelection;
  private activeEnvFile: string | undefined;
  private envFileProblem: string | undefined;
  private workspaceInstanceWatcher: vscode.FileSystemWatcher | undefined;

  private readonly _onDidReset = new vscode.EventEmitter<void>();
  readonly onDidReset = this._onDidReset.event;

  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly log: vscode.OutputChannel,
    private readonly workspaceState?: vscode.Memento,
    private readonly ambientEnvironment: NodeJS.ProcessEnv = process.env,
  ) {
    this.resolvedEnvironment = ambientEnvironment;
    this.workspaceInstanceSelection = workspaceState?.get<WorkspaceInstanceSelection>(WORKSPACE_INSTANCE_KEY);
    this.workspaceInstanceDisabled = workspaceState?.get<boolean>(WORKSPACE_INSTANCE_NONE_KEY) === true;
    this.envFileSelection = workspaceState?.get<string | null>(WORKSPACE_ENV_FILE_KEY);
    // Watch for dw.json and env file saves made within VS Code (most reliable for in-editor edits)
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        const basename = path.basename(doc.fileName);
        if (basename === DW_JSON || isEnvFileCandidate(basename)) {
          this.log.appendLine(`[Config] ${basename} saved in editor: ${doc.fileName}`);
          this.reset();
        }
      }),
    );

    // FileSystemWatcher per workspace folder for external changes and create/delete.
    // RelativePattern is more reliable than a bare glob string on macOS.
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      for (const filename of [DW_JSON, `${DOT_ENV}*`]) {
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
    this.refreshWorkspaceInstanceWatcher();
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

  /** Return the instance selected only for this VS Code workspace. */
  getWorkspaceInstanceSelection(): WorkspaceInstanceSelection | undefined {
    return this.workspaceInstanceSelection ? {...this.workspaceInstanceSelection} : undefined;
  }

  /** Whether this workspace selected no dw.json instance. */
  isInstanceDisabled(): boolean {
    return this.workspaceInstanceDisabled;
  }

  /** Use no dw.json instance in this workspace (env file and shell variables only). */
  async selectNoInstanceForWorkspace(): Promise<void> {
    await this.workspaceState?.update(WORKSPACE_INSTANCE_KEY, undefined);
    await this.workspaceState?.update(WORKSPACE_INSTANCE_NONE_KEY, true);
    this.workspaceInstanceSelection = undefined;
    this.workspaceInstanceDisabled = true;
    this.log.appendLine('[Config] Selected no instance for this workspace');
    this.refreshWorkspaceInstanceWatcher();
    this.reset();
  }

  /** Return the workspace env file choice: a path, `null` for none, or `undefined` for the default `.env`. */
  getEnvFileSelection(): EnvFileSelection {
    return this.envFileSelection;
  }

  /** Return the env file applied to the current resolution, if any. */
  getActiveEnvFile(): string | undefined {
    return this.activeEnvFile;
  }

  /** Why the selected env file could not be used in the current resolution, if it could not. */
  getEnvFileProblem(): string | undefined {
    return this.envFileProblem;
  }

  /** Select the env file for this workspace: a path, `null` for none, or `undefined` for the default `.env`. */
  async selectEnvFile(selection: EnvFileSelection): Promise<void> {
    const normalized = typeof selection === 'string' ? path.resolve(selection) : selection;
    await this.workspaceState?.update(WORKSPACE_ENV_FILE_KEY, normalized);
    this.envFileSelection = normalized;
    this.log.appendLine(
      `[Config] Env file for this workspace: ${normalized === null ? 'none' : (normalized ?? 'default (.env)')}`,
    );
    this.reset();
  }

  /** Select an exact instance for this VS Code workspace without changing shared active state. */
  async selectInstanceForWorkspace(selection: WorkspaceInstanceSelection): Promise<void> {
    const normalized = {...selection, location: path.resolve(selection.location)};
    await this.workspaceState?.update(WORKSPACE_INSTANCE_KEY, normalized);
    await this.workspaceState?.update(WORKSPACE_INSTANCE_NONE_KEY, undefined);
    this.workspaceInstanceSelection = normalized;
    this.workspaceInstanceDisabled = false;
    this.log.appendLine(`[Config] Selected instance for this workspace: ${normalized.name}`);
    this.refreshWorkspaceInstanceWatcher();
    this.reset();
  }

  /** Clear the workspace override and resume following the shared default. */
  async followDefaultInstance(): Promise<void> {
    await this.workspaceState?.update(WORKSPACE_INSTANCE_KEY, undefined);
    await this.workspaceState?.update(WORKSPACE_INSTANCE_NONE_KEY, undefined);
    this.workspaceInstanceSelection = undefined;
    this.workspaceInstanceDisabled = false;
    this.log.appendLine('[Config] Following default instance');
    this.refreshWorkspaceInstanceWatcher();
    this.reset();
  }

  /** Return the ordered primary and global files used by instance-management features. */
  getInstanceCatalogOptions(): ResolveConfigOptions {
    const workingDirectory = this.detectedDirectory;
    const envFile = this.readSelectedEnvFile(workingDirectory);
    return {
      workingDirectory,
      configPath: this.selectConfigPath(envFile),
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
    this.activeEnvFile = undefined;
    this.envFileProblem = undefined;
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
    this.workspaceInstanceWatcher?.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }

  private refreshWorkspaceInstanceWatcher(): void {
    this.workspaceInstanceWatcher?.dispose();
    this.workspaceInstanceWatcher = undefined;

    const location = this.workspaceInstanceSelection?.location;
    if (!location) return;

    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(vscode.Uri.file(path.dirname(location)), path.basename(location)),
    );
    const resetForSelectionChange = (): void => {
      this.log.appendLine(`[Config] Selected instance configuration changed: ${location}`);
      this.reset();
    };
    watcher.onDidChange(resetForSelectionChange);
    watcher.onDidCreate(resetForSelectionChange);
    watcher.onDidDelete(resetForSelectionChange);
    this.workspaceInstanceWatcher = watcher;
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

      const {config, environment, envFile, envFileProblem} = await this.resolveProjectConfiguration(workingDirectory);
      this.config = config;
      this.resolvedEnvironment = environment;
      this.activeEnvFile = envFile;
      this.envFileProblem = envFileProblem;

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

  /**
   * Read the env file selected for this workspace (or `<directory>/.env` by default).
   *
   * A selected file that no longer exists falls back to the default `.env`, and
   * an unreadable file contributes nothing; both are reported as `problem`.
   */
  private readSelectedEnvFile(workingDirectory: string): SelectedEnvFile {
    if (this.envFileSelection === null) return {values: {}};
    const projectDirectory = workingDirectory || undefined;

    let problem: string | undefined;
    let envFile: string | undefined;
    try {
      envFile = resolveEnvFilePath({envFile: this.envFileSelection, projectDirectory});
    } catch (error) {
      problem = error instanceof Error ? error.message : String(error);
      envFile = resolveEnvFilePath({projectDirectory});
    }
    // Without a project directory, only an explicit selection applies (never the host's cwd).
    if (!envFile || (!workingDirectory && (problem || this.envFileSelection === undefined))) {
      return {values: {}, problem};
    }

    try {
      return {path: envFile, values: readEnvFile(envFile), problem};
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {values: {}, problem: `Could not read env file ${envFile}: ${message}`};
    }
  }

  /**
   * Select the dw.json path from `SFCC_CONFIG` (ambient first, then the env file).
   * An empty value selects no dw.json, matching the CLI. A relative env file
   * value resolves from the env file's directory.
   */
  private selectConfigPath(envFile: SelectedEnvFile): string | undefined {
    const ambientConfigPath = this.ambientEnvironment.SFCC_CONFIG;
    if (ambientConfigPath !== undefined) return ambientConfigPath;

    const fileConfigPath = envFile.values.SFCC_CONFIG;
    if (fileConfigPath === undefined || fileConfigPath === '' || !envFile.path) return fileConfigPath;
    return path.isAbsolute(fileConfigPath) ? fileConfigPath : path.resolve(path.dirname(envFile.path), fileConfigPath);
  }

  private async resolveProjectConfiguration(
    workingDirectory: string,
    overrides: Partial<NormalizedConfig> = {},
  ): Promise<{
    config: ResolvedB2CConfig;
    envFile?: string;
    envFileProblem?: string;
    environment: Record<string, string | undefined>;
  }> {
    const envFile = this.readSelectedEnvFile(workingDirectory);
    if (envFile.problem) this.log.appendLine(`[Config] Warning: ${envFile.problem}`);
    if (envFile.path) this.log.appendLine(`[Config] Loaded env file: ${envFile.path}`);

    // SFCC_DOTENV_FILE is never honored from inside an env file (no chaining).
    const fileValues = {...envFile.values};
    delete fileValues.SFCC_DOTENV_FILE;
    const environment: Record<string, string | undefined> = {...fileValues, ...this.ambientEnvironment};
    const configPath = this.selectConfigPath(envFile);
    if (configPath) this.log.appendLine(`[Config] Using explicit config path: ${configPath}`);
    if (configPath === '') this.log.appendLine('[Config] SFCC_CONFIG is empty; no dw.json is used');

    const {defaultConfigPath} = readB2CSettings({environment: this.ambientEnvironment});
    if (defaultConfigPath) {
      this.log.appendLine(`[Config] Global dw.json: ${defaultConfigPath}`);
    }

    const instanceDisabled = this.workspaceInstanceDisabled;
    const workspaceSelection = instanceDisabled ? undefined : this.workspaceInstanceSelection;
    if (instanceDisabled) {
      this.log.appendLine('[Config] No instance selected for this workspace; dw.json is not used');
    } else if (workspaceSelection) {
      this.log.appendLine(`[Config] Applying workspace instance selection: ${workspaceSelection.name}`);
    }

    const fileOnlyValues = Object.fromEntries(
      Object.entries(fileValues).filter(([key]) => this.ambientEnvironment[key] === undefined),
    );
    const storefrontNextFromAmbient = Object.keys(STOREFRONT_NEXT_ENV_VAR_MAP).some(
      (key) => this.ambientEnvironment[key] !== undefined,
    );
    const config = await resolveConfig(overrides, {
      workingDirectory,
      instance: workspaceSelection?.name,
      configPath: instanceDisabled ? '' : (workspaceSelection?.location ?? configPath),
      credentialsFile: environment.MRT_CREDENTIALS_FILE || undefined,
      // An explicit workspace selection identifies an exact file and name. Do
      // not fall through to a same-name entry in the global fallback.
      defaultConfigPath: workspaceSelection || instanceDisabled ? undefined : defaultConfigPath,
      sourcesBefore: [
        new EnvSource(this.ambientEnvironment),
        new EnvSource(fileOnlyValues, {name: 'DotenvFile', location: envFile.path}),
      ],
      // Storefront Next variables are borrowed from the app and only fill gaps below dw.json.
      sourcesAfter: [
        new StorefrontNextEnvSource(environment, {location: storefrontNextFromAmbient ? undefined : envFile.path}),
      ],
    });
    if (workspaceSelection && config.values.instanceName !== workspaceSelection.name) {
      const mismatch = config.warnings.find(
        (warning) => warning.code === 'HOSTNAME_MISMATCH' && warning.details?.source === 'DwJsonSource',
      );
      if (mismatch) throw new Error(`Selected instance "${workspaceSelection.name}" was not used: ${mismatch.message}`);
      throw new Error(
        `Selected instance "${workspaceSelection.name}" is no longer available. Choose another instance or follow the default instance.`,
      );
    }
    return {config, envFile: envFile.path, envFileProblem: envFile.problem, environment};
  }
}
