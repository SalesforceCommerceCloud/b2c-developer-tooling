/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  findCartridges,
  uploadFiles,
  fileToCartridgePath,
  uploadCartridges,
  getActiveCodeVersion,
  type CartridgeMapping,
  type FileChange,
} from '@salesforce/b2c-tooling-sdk/operations/code';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import * as path from 'path';
import * as vscode from 'vscode';

const DEBOUNCE_MS = 150;
const ERROR_RATE_LIMIT_MS = 5000;
const STATE_KEY_PREFIX = 'b2c-dx.codeSync.state.';

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
  private lastErrorTime = 0;

  constructor(private readonly workspaceState: vscode.Memento) {
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

    // Discover cartridges
    const cartridges = findCartridges(directory);
    if (cartridges.length === 0) {
      vscode.window.showWarningMessage('B2C DX: No cartridges found (no .project files in workspace).');
      return;
    }
    this.cartridges = cartridges;

    this.codeVersion = instance.config.codeVersion;
    if (!this.codeVersion) {
      try {
        const active = await getActiveCodeVersion(instance);
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

    this.outputChannel.clear();
    this.outputChannel.show(true);
    const hostname = instance.config.hostname ?? 'unknown';
    this.log(`--- Code Sync started ---`);
    this.log(`Instance: ${hostname}`);
    if (this.codeVersion) {
      this.log(`Code Version: ${this.codeVersion}`);
    }
    this.log(`Watching ${cartridges.length} cartridge(s):`);
    for (const c of cartridges) {
      this.log(`  ${c.name} (${c.src})`);
    }

    this.updateStatusBar();
  }

  refreshCartridges(directory: string): void {
    if (!this.watching) return;

    const cartridges = findCartridges(directory);
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

    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }

    // Dispose all file watchers
    for (const w of this.fileWatchers) {
      w.dispose();
    }
    this.fileWatchers = [];

    // Clear pending state
    this.pendingUploads.clear();
    this.pendingDeletes.clear();
    this.isProcessing = false;

    this.watching = false;
    this.instance = undefined;

    this.log(`--- Code Sync stopped ---`);
    this.updateStatusBar();
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
        const active = await getActiveCodeVersion(instance);
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
    const cartridges = this.cartridges.length > 0 ? this.cartridges : findCartridges(directory);
    const filePath = uri.fsPath;

    const cartridge = cartridges.find((c) => filePath.startsWith(c.src));
    if (!cartridge) {
      vscode.window.showWarningMessage('B2C DX: This file is not inside a discovered cartridge.');
      return;
    }

    let codeVersion = instance.config.codeVersion;
    if (!codeVersion) {
      try {
        const active = await getActiveCodeVersion(instance);
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

  dispose(): void {
    if (this.watching) {
      this.stopWatch().catch(() => {});
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

  private async processChanges(): Promise<void> {
    if (this.isProcessing) return;
    if (!this.instance || !this.codeVersion) return;

    this.isProcessing = true;

    try {
      while (this.pendingUploads.size > 0 || this.pendingDeletes.size > 0) {
        // Rate limit after errors
        const timeSinceError = Date.now() - this.lastErrorTime;
        if (timeSinceError < ERROR_RATE_LIMIT_MS) {
          await new Promise((resolve) => setTimeout(resolve, ERROR_RATE_LIMIT_MS - timeSinceError));
        }

        const uploads = Array.from(this.pendingUploads.values());
        const deletes = Array.from(this.pendingDeletes.values());
        this.pendingUploads.clear();
        this.pendingDeletes.clear();

        try {
          await uploadFiles(this.instance, this.codeVersion, uploads, deletes, {
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
            onError: (error) => {
              this.log(`[Error] ${error.message}`);
            },
          });
        } catch {
          this.lastErrorTime = Date.now();
          // Re-queue for retry
          for (const f of uploads) {
            this.pendingUploads.set(f.src, f);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
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
