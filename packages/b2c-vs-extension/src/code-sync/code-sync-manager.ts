/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  uploadFiles,
  fileToCartridgePath,
  uploadCartridges,
  type CartridgeMapping,
  type FileChange,
} from '@salesforce/b2c-tooling-sdk/operations/code';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import * as path from 'path';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {findCartridgesSafe} from '../workspace-discovery.js';
import {createScriptsBackendFromExtension} from './scripts-backend.js';

const DEBOUNCE_MS = 150;
const STATE_KEY_PREFIX = 'b2c-dx.codeSync.state.';

export interface CodeSyncRetryOptions {
  /** Delay before the first retry after a failed upload. */
  initialRetryMs: number;
  /** Upper bound for the doubling retry delay. */
  maxRetryMs: number;
}

const DEFAULT_RETRY: CodeSyncRetryOptions = {initialRetryMs: 5000, maxRetryMs: 5 * 60_000};

/** HTTP status of an upload failure: from an HTTPError response, else from the message ("PUT failed: 401 ..."). */
export function uploadErrorStatus(error: unknown): number | undefined {
  const status = (error as {response?: {status?: unknown}} | undefined)?.response?.status;
  if (typeof status === 'number') return status;
  const match = /\b([45]\d\d)\b/.exec(error instanceof Error ? error.message : String(error));
  return match ? Number(match[1]) : undefined;
}

/** Credential and permission failures don't go away on retry; they need the user to fix the configuration. */
export function isAuthUploadError(error: unknown): boolean {
  const status = uploadErrorStatus(error);
  return status === 401 || status === 403;
}

export class CodeSyncManager implements vscode.Disposable {
  readonly outputChannel: vscode.OutputChannel;
  private statusBar: vscode.StatusBarItem;
  private fileWatchers: vscode.Disposable[] = [];
  private cartridges: CartridgeMapping[] = [];
  private codeVersion: string | undefined;
  private instance: B2CInstance | undefined;
  private watching = false;

  // Debounce state
  private pendingUploads = new Map<string, FileChange>();
  private pendingDeletes = new Map<string, FileChange>();
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private isProcessing = false;

  // Failure state: doubling retry delay for transient errors, a pause for auth errors
  private retryDelayMs = 0;
  private nextRetryAt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private authPaused = false;
  private lastError: string | undefined;

  /** Hostname whose pending changes were kept across a configuration reload. */
  private suspendedHostname: string | undefined;

  constructor(
    private readonly workspaceState: vscode.Memento,
    private readonly configProvider: B2CExtensionConfig,
    private readonly upload: typeof uploadFiles = uploadFiles,
    private readonly retry: CodeSyncRetryOptions = DEFAULT_RETRY,
  ) {
    this.outputChannel = vscode.window.createOutputChannel('B2C Code Upload');
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
    this.updateStatusBar();
  }

  get isWatching(): boolean {
    return this.watching;
  }

  get discoveredCartridges(): CartridgeMapping[] {
    return this.cartridges;
  }

  async startWatch(instance: B2CInstance, directory: string): Promise<void> {
    if (this.watching) {
      vscode.window.showWarningMessage('B2C DX: Code Sync is already active. Stop it first.');
      return;
    }

    this.instance = instance;
    this.resetFailureState();

    // Discover cartridges
    const cartridges = findCartridgesSafe(directory);
    if (cartridges.length === 0) {
      vscode.window.showWarningMessage('B2C DX: No cartridges found (no .project files in workspace).');
      return;
    }
    this.cartridges = cartridges;

    this.codeVersion = instance.config.codeVersion;
    if (!this.codeVersion) {
      try {
        const active = await createScriptsBackendFromExtension(instance).getActiveCodeVersion();
        if (active?.id) {
          this.codeVersion = active.id;
          instance.config.codeVersion = this.codeVersion;
        }
      } catch {
        // OCAPI not available — soft failure
      }
    }
    if (!this.codeVersion) {
      this.log(
        '[Warning] No code version configured. Set "codeVersion" in dw.json or configure OAuth credentials. Code upload is disabled.',
      );
      this.updateStatusBar('warning');
      return;
    }

    // Set up VS Code file watchers
    for (const c of cartridges) {
      const pattern = new vscode.RelativePattern(c.src, '**/*');
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);

      watcher.onDidChange((uri) => this.onFileChange(uri));
      watcher.onDidCreate((uri) => this.onFileChange(uri));
      watcher.onDidDelete((uri) => this.onFileDelete(uri));

      this.fileWatchers.push(watcher);
    }

    this.watching = true;

    // A restart after a configuration reload keeps the log (and its errors) and doesn't steal focus.
    const resuming = this.suspendedHostname !== undefined;
    if (!resuming) {
      this.outputChannel.clear();
      this.outputChannel.show(true);
    }
    const hostname = instance.config.hostname ?? 'unknown';
    this.log(resuming ? `--- Code Sync restarted with the reloaded configuration ---` : `--- Code Sync started ---`);
    this.log(`Instance: ${hostname}`);
    if (this.codeVersion) {
      this.log(`Code Version: ${this.codeVersion}`);
    }
    this.log(`Watching ${cartridges.length} cartridge(s):`);
    for (const c of cartridges) {
      this.log(`  ${c.name} (${c.src})`);
    }

    // Changes that failed before a reload (for example with credentials the reload fixed)
    // are retried, but only against the same instance.
    const pending = this.pendingUploads.size + this.pendingDeletes.size;
    if (pending > 0 && this.suspendedHostname === instance.config.hostname) {
      this.log(`[Resume] Retrying ${pending} change(s) pending from before the reload`);
      this.scheduleProcessing();
    } else {
      this.discardPending();
    }
    this.suspendedHostname = undefined;

    this.updateStatusBar();
  }

  refreshCartridges(directory: string): void {
    if (!this.watching) return;

    const cartridges = findCartridgesSafe(directory);
    const existingNames = new Set(this.cartridges.map((c) => c.name));
    const newCartridges = cartridges.filter((c) => !existingNames.has(c.name));

    if (newCartridges.length === 0) return;

    for (const c of newCartridges) {
      const pattern = new vscode.RelativePattern(c.src, '**/*');
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);
      watcher.onDidChange((uri) => this.onFileChange(uri));
      watcher.onDidCreate((uri) => this.onFileChange(uri));
      watcher.onDidDelete((uri) => this.onFileDelete(uri));
      this.fileWatchers.push(watcher);
      this.log(`[Watch] Added cartridge: ${c.name} (${c.src})`);
    }

    this.cartridges = cartridges;
    this.updateStatusBar();
  }

  async stopWatch(): Promise<void> {
    if (!this.watching) return;

    // Clear debounce and retry timers
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
    this.clearRetryTimer();

    // Dispose all file watchers first so no new changes accumulate while we drain.
    for (const w of this.fileWatchers) {
      w.dispose();
    }
    this.fileWatchers = [];

    // Drain any pending uploads/deletes accumulated since the last debounce tick
    // (or queued while a previous processChanges() loop was running). Without
    // this drain, a save right before stop would be silently dropped. The drain
    // is a single immediate attempt: stopping must not wait out a retry delay.
    if (this.pendingUploads.size > 0 || this.pendingDeletes.size > 0) {
      try {
        await this.processChanges({drain: true});
      } catch (error) {
        this.log(`[Stop] Error draining pending changes: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    const notUploaded = this.pendingUploads.size + this.pendingDeletes.size;
    if (notUploaded > 0) this.log(`[Stop] ${notUploaded} pending change(s) were not synced`);

    this.pendingUploads.clear();
    this.pendingDeletes.clear();
    this.isProcessing = false;

    this.watching = false;
    this.instance = undefined;
    this.resetFailureState();

    this.log(`--- Code Sync stopped ---`);
    this.updateStatusBar();
  }

  /**
   * Stop watching for a configuration reload, keeping pending changes so a restart
   * against the same instance retries them with the new configuration instead of
   * a last attempt with the old one.
   */
  suspendForReload(): void {
    if (!this.watching) return;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
    for (const w of this.fileWatchers) {
      w.dispose();
    }
    this.fileWatchers = [];

    this.suspendedHostname = this.instance?.config.hostname ?? '';
    this.watching = false;
    this.instance = undefined;
    this.resetFailureState();

    this.log(`--- Code Sync suspended for configuration reload ---`);
    this.updateStatusBar();
  }

  /** Drop changes kept by {@link suspendForReload} when sync doesn't restart for the same instance. */
  discardPending(): void {
    const pending = this.pendingUploads.size + this.pendingDeletes.size;
    if (pending > 0) this.log(`[Stop] ${pending} pending change(s) were not synced`);
    this.pendingUploads.clear();
    this.pendingDeletes.clear();
    this.suspendedHostname = undefined;
  }

  async toggle(instance: B2CInstance, directory: string, hostname: string): Promise<void> {
    if (this.watching) {
      await this.stopWatch();
      await this.setPersistedState(hostname, false);
    } else {
      await this.startWatch(instance, directory);
      await this.setPersistedState(hostname, true);
    }
  }

  async uploadSingleCartridge(instance: B2CInstance, cartridge: CartridgeMapping): Promise<void> {
    let codeVersion = instance.config.codeVersion;
    if (!codeVersion) {
      try {
        const active = await createScriptsBackendFromExtension(instance).getActiveCodeVersion();
        if (active?.id) {
          codeVersion = active.id;
          instance.config.codeVersion = codeVersion;
        }
      } catch {
        // fall through to error
      }
    }
    if (!codeVersion) {
      vscode.window.showErrorMessage(
        'B2C DX: No code version configured. Set code-version in dw.json or activate a code version.',
      );
      return;
    }

    await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: `Uploading ${cartridge.name}...`},
      async () => {
        await uploadCartridges(instance, [cartridge]);
        this.log(`[Upload] Cartridge "${cartridge.name}" uploaded successfully`);
        vscode.window.showInformationMessage(`B2C DX: Cartridge "${cartridge.name}" uploaded.`);
      },
    );
  }

  async uploadFileOrFolder(instance: B2CInstance, uri: vscode.Uri, directory: string): Promise<void> {
    const cartridges = this.cartridges.length > 0 ? this.cartridges : findCartridgesSafe(directory);
    const filePath = uri.fsPath;

    const cartridge = cartridges.find((c) => filePath.startsWith(c.src));
    if (!cartridge) {
      vscode.window.showWarningMessage('B2C DX: This file is not inside a discovered cartridge.');
      return;
    }

    let codeVersion = instance.config.codeVersion;
    if (!codeVersion) {
      try {
        const active = await createScriptsBackendFromExtension(instance).getActiveCodeVersion();
        if (active?.id) {
          codeVersion = active.id;
          instance.config.codeVersion = codeVersion;
        }
      } catch {
        // fall through
      }
    }
    if (!codeVersion) {
      vscode.window.showErrorMessage('B2C DX: No code version configured.');
      return;
    }

    const stat = await vscode.workspace.fs.stat(uri);
    if (stat.type === vscode.FileType.Directory) {
      // Upload entire cartridge containing this folder
      await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: `Uploading ${cartridge.name}...`},
        async () => {
          await uploadCartridges(instance, [cartridge]);
          this.log(`[Upload] Cartridge "${cartridge.name}" uploaded successfully`);
          vscode.window.showInformationMessage(`B2C DX: Cartridge "${cartridge.name}" uploaded.`);
        },
      );
    } else {
      // Upload single file
      const change = fileToCartridgePath(filePath, cartridges);
      if (!change) return;

      await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: `Uploading ${path.basename(filePath)}...`},
        async () => {
          await uploadFiles(instance, codeVersion!, [change], []);
          this.log(`[Upload] ${change.dest}`);
          vscode.window.showInformationMessage(`B2C DX: File uploaded.`);
        },
      );
    }
  }

  getPersistedState(hostname: string): boolean | undefined {
    return this.workspaceState.get<boolean>(`${STATE_KEY_PREFIX}${hostname}`);
  }

  async setPersistedState(hostname: string, enabled: boolean): Promise<void> {
    await this.workspaceState.update(`${STATE_KEY_PREFIX}${hostname}`, enabled);
  }

  /** Retry pending changes now, ignoring any retry delay or auth pause. */
  retryNow(): void {
    this.clearRetryTimer();
    this.nextRetryAt = 0;
    this.authPaused = false;
    void this.processChanges();
  }

  dispose(): void {
    this.clearRetryTimer();
    if (this.watching) {
      this.stopWatch().catch((error: unknown) => {
        // Best-effort: extension is unloading; log to the channel so failures
        // are visible if the user has it open.
        this.log(`[Dispose] stopWatch failed: ${error instanceof Error ? error.message : String(error)}`);
      });
    }
    this.statusBar.dispose();
    this.outputChannel.dispose();
  }

  private onFileChange(uri: vscode.Uri): void {
    const filePath = uri.fsPath;
    const change = fileToCartridgePath(filePath, this.cartridges);
    if (!change) return;

    this.pendingUploads.set(filePath, change);
    this.pendingDeletes.delete(filePath);
    this.scheduleProcessing();
  }

  private onFileDelete(uri: vscode.Uri): void {
    const filePath = uri.fsPath;
    const change = fileToCartridgePath(filePath, this.cartridges);
    if (!change) return;

    this.pendingDeletes.set(filePath, change);
    this.pendingUploads.delete(filePath);
    this.scheduleProcessing();
  }

  private scheduleProcessing(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      void this.processChanges();
    }, DEBOUNCE_MS);
  }

  private async processChanges(options: {drain?: boolean} = {}): Promise<void> {
    if (this.isProcessing) return;
    if (!this.instance || !this.codeVersion) return;

    this.isProcessing = true;

    try {
      while (this.pendingUploads.size > 0 || this.pendingDeletes.size > 0) {
        // Suspended or stopped while an earlier batch was uploading.
        if (!this.instance || !this.codeVersion) return;

        // After a transient failure, wait out the retry delay instead of retrying on every save.
        const wait = this.nextRetryAt - Date.now();
        if (!options.drain && wait > 0) {
          this.scheduleRetry(wait);
          return;
        }

        const uploads = Array.from(this.pendingUploads.values());
        const deletes = Array.from(this.pendingDeletes.values());
        this.pendingUploads.clear();
        this.pendingDeletes.clear();

        try {
          await this.upload(this.instance, this.codeVersion, uploads, deletes, {
            onUpload: (files) => {
              const ts = new Date().toLocaleTimeString();
              for (const f of files) {
                this.log(`${ts} [Upload] ${f}`);
              }
            },
            onDelete: (files) => {
              const ts = new Date().toLocaleTimeString();
              for (const f of files) {
                this.log(`${ts} [Delete] ${f}`);
              }
            },
          });
          this.onSyncSuccess();
        } catch (error) {
          this.requeue(uploads, deletes);
          if (!this.watching && !options.drain) return;
          this.onSyncFailure(error);
          // An auth failure waits for the next save or an explicit retry.
          if (options.drain || this.authPaused) return;
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /** Put a failed batch back without overwriting changes made since it was taken. */
  private requeue(uploads: FileChange[], deletes: FileChange[]): void {
    for (const f of uploads) {
      if (!this.pendingUploads.has(f.src) && !this.pendingDeletes.has(f.src)) this.pendingUploads.set(f.src, f);
    }
    for (const f of deletes) {
      if (!this.pendingUploads.has(f.src) && !this.pendingDeletes.has(f.src)) this.pendingDeletes.set(f.src, f);
    }
  }

  private onSyncSuccess(): void {
    if (this.lastError) this.log(`${new Date().toLocaleTimeString()} [Recovered] Uploads are working again`);
    const wasFailing = Boolean(this.lastError);
    this.resetFailureState();
    if (wasFailing) this.updateStatusBar();
  }

  private onSyncFailure(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    const ts = new Date().toLocaleTimeString();
    const pending = this.pendingUploads.size + this.pendingDeletes.size;

    if (isAuthUploadError(error)) {
      const firstPause = !this.authPaused;
      this.authPaused = true;
      this.retryDelayMs = 0;
      this.nextRetryAt = 0;
      this.log(`${ts} [Error] ${message}`);
      this.log(
        `${ts} [Paused] ${pending} change(s) pending; retrying on the next save. Check the instance credentials.`,
      );
      if (firstPause) {
        void vscode.window
          .showWarningMessage(
            `B2C DX: Code Sync is paused: ${message}. Check the instance credentials; sync retries on the next save.`,
            'Retry',
            'Stop Code Sync',
          )
          .then((choice) => {
            if (choice === 'Retry') this.retryNow();
            else if (choice === 'Stop Code Sync') void vscode.commands.executeCommand('b2c-dx.codeSync.stop');
          });
      }
    } else {
      this.authPaused = false;
      this.retryDelayMs = this.retryDelayMs
        ? Math.min(this.retryDelayMs * 2, this.retry.maxRetryMs)
        : this.retry.initialRetryMs;
      this.nextRetryAt = Date.now() + this.retryDelayMs;
      this.log(`${ts} [Error] ${message}`);
      this.log(`${ts} [Retry] ${pending} change(s) pending; retrying in ${Math.round(this.retryDelayMs / 1000)}s`);
    }
    this.lastError = message;
    this.updateStatusBar();
  }

  private scheduleRetry(delayMs: number): void {
    if (this.retryTimer) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;
      void this.processChanges();
    }, delayMs);
  }

  private clearRetryTimer(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }
  }

  private resetFailureState(): void {
    this.clearRetryTimer();
    this.retryDelayMs = 0;
    this.nextRetryAt = 0;
    this.authPaused = false;
    this.lastError = undefined;
  }

  private log(message: string): void {
    this.outputChannel.appendLine(message);
  }

  private updateStatusBar(state?: 'warning'): void {
    this.statusBar.command = 'b2c-dx.codeSync.toggle';
    if (state === 'warning') {
      this.statusBar.text = '$(warning)';
      this.statusBar.tooltip = 'Code Sync: No code version configured\nClick to toggle';
      this.statusBar.show();
    } else if (this.watching && this.lastError) {
      const lines = [
        this.authPaused ? 'Code Sync: Paused (retries on the next save)' : 'Code Sync: Upload failed, retrying',
        `Error: ${this.lastError}`,
        'Click to stop',
      ];
      this.statusBar.text = '$(cloud-upload) $(warning)';
      this.statusBar.tooltip = lines.join('\n');
      this.statusBar.show();
    } else if (this.watching) {
      const hostname = this.instance?.config.hostname ?? '';
      const lines = ['Code Sync: Active'];
      if (hostname) lines.push(`Instance: ${hostname}`);
      if (this.codeVersion) lines.push(`Code Version: ${this.codeVersion}`);
      lines.push(`Cartridges: ${this.cartridges.length}`);
      lines.push('Click to stop');
      this.statusBar.text = '$(cloud-upload)';
      this.statusBar.tooltip = lines.join('\n');
      this.statusBar.show();
    } else {
      this.statusBar.text = '$(sync-ignored)';
      this.statusBar.tooltip = 'Code Sync: Inactive\nClick to start';
      this.statusBar.show();
    }
  }

  hideStatusBar(): void {
    this.statusBar.hide();
  }

  showStatusBar(): void {
    this.updateStatusBar();
  }
}
