/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {tailLogs, type TailLogsResult, discoverAndCreateNormalizer} from '@salesforce/b2c-tooling-sdk/operations/logs';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import * as vscode from 'vscode';

const ALL_PREFIX_OPTIONS = [
  {label: 'error', picked: true},
  {label: 'customerror', picked: true},
  {label: 'warn'},
  {label: 'debug'},
  {label: 'info'},
  {label: 'fatal'},
  {label: 'syserror'},
  {label: 'analytics'},
  {label: 'api'},
  {label: 'customwarn'},
  {label: 'customdebug'},
  {label: 'custominfo'},
  {label: 'deprecation'},
  {label: 'migration'},
  {label: 'performance'},
  {label: 'quota'},
  {label: 'staging'},
];

/**
 * Manages the log tailing lifecycle: Output Channel, status bar, and SDK integration.
 */
export class LogTailManager implements vscode.Disposable {
  private outputChannel: vscode.OutputChannel;
  private statusBar: vscode.StatusBarItem;
  private tailResult: TailLogsResult | undefined;
  private entryCount = 0;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('B2C Logs');
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 49);
    this.statusBar.command = 'b2c-dx.logs.stopTail';
    this.updateStatusBar();
  }

  get isTailing(): boolean {
    return this.tailResult !== undefined;
  }

  async startTail(instance: B2CInstance): Promise<void> {
    if (this.tailResult) {
      vscode.window.showWarningMessage('B2C DX: Already tailing logs. Stop the current session first.');
      return;
    }

    const prefixPicks = await vscode.window.showQuickPick(ALL_PREFIX_OPTIONS, {
      title: 'Select log prefixes to tail',
      canPickMany: true,
      placeHolder: 'Select one or more log file prefixes',
    });
    if (!prefixPicks || prefixPicks.length === 0) return;

    const prefixes = prefixPicks.map((p) => p.label);

    // Try to create a path normalizer for clickable file links
    const workDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    let pathNormalizer: ((message: string) => string) | undefined;
    if (workDir) {
      try {
        pathNormalizer = await discoverAndCreateNormalizer(workDir);
      } catch {
        // Path normalizer is optional
      }
    }

    this.outputChannel.clear();
    this.outputChannel.show(true);
    this.outputChannel.appendLine(`--- Tailing logs: ${prefixes.join(', ')} ---`);
    this.entryCount = 0;

    try {
      this.tailResult = await tailLogs(instance, {
        prefixes,
        pathNormalizer,
        onEntry: (entry) => {
          this.entryCount++;
          const level = entry.level ? `[${entry.level}]` : '';
          const ts = entry.timestamp ?? '';
          this.outputChannel.appendLine(`${ts} ${level} ${entry.message}`);
          this.updateStatusBar();
        },
        onError: (error) => {
          this.outputChannel.appendLine(`[ERROR] ${error.message}`);
        },
        onFileDiscovered: (file) => {
          this.outputChannel.appendLine(`[LOG] Discovered: ${file.name}`);
        },
        onFileRotated: (file) => {
          this.outputChannel.appendLine(`[LOG] File rotated: ${file.name}`);
        },
      });
      this.updateStatusBar();
    } catch (err) {
      this.tailResult = undefined;
      this.updateStatusBar();
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`Failed to start log tailing: ${message}`);
    }
  }

  async stopTail(): Promise<void> {
    if (!this.tailResult) {
      vscode.window.showInformationMessage('B2C DX: Not currently tailing logs.');
      return;
    }
    try {
      await this.tailResult.stop();
    } catch {
      // Best effort
    }
    this.outputChannel.appendLine(`--- Stopped tailing (${this.entryCount} entries) ---`);
    this.tailResult = undefined;
    this.entryCount = 0;
    this.updateStatusBar();
  }

  private updateStatusBar(): void {
    if (this.tailResult) {
      this.statusBar.text = `$(pulse) Tailing Logs (${this.entryCount})`;
      this.statusBar.tooltip = 'Click to stop tailing B2C logs';
      this.statusBar.show();
    } else {
      this.statusBar.hide();
    }
  }

  dispose(): void {
    if (this.tailResult) {
      this.tailResult.stop().catch(() => {});
      this.tailResult = undefined;
    }
    this.statusBar.dispose();
    this.outputChannel.dispose();
  }
}
