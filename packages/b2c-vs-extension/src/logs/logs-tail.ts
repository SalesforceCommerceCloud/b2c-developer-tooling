/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  tailLogs,
  type TailLogsResult,
  type LogEntry,
  discoverAndCreateNormalizer,
} from '@salesforce/b2c-tooling-sdk/operations/logs';
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
  private outputChannel: vscode.LogOutputChannel;
  private statusBar: vscode.StatusBarItem;
  private tailResult: TailLogsResult | undefined;
  private entryCount = 0;
  private lastErrorMessage: string | undefined;
  // Maps a discovered log file name to its prefix (e.g. "error", "customerror")
  // so each entry can be tagged with its source. onEntry only carries the file
  // name; the prefix arrives on the LogFile in onFileDiscovered.
  private fileToPrefix = new Map<string, string>();

  constructor() {
    // `{log: true}` makes this a LogOutputChannel: the same single "B2C Logs"
    // channel, but VS Code renders per-level colors (error/warn/info/debug) and
    // adds a built-in level-filter dropdown. No extra channel is created.
    this.outputChannel = vscode.window.createOutputChannel('B2C Logs', {log: true});
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 48);
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
    this.outputChannel.info(`--- Tailing logs: ${prefixes.join(', ')} ---`);
    this.entryCount = 0;
    this.fileToPrefix.clear();

    try {
      this.tailResult = await tailLogs(instance, {
        prefixes,
        pathNormalizer,
        onEntry: (entry) => {
          this.entryCount++;
          this.writeEntry(entry);
          // A live entry means the instance is reachable again — clear the
          // dedup latch so the next distinct error is shown.
          this.lastErrorMessage = undefined;
          this.updateStatusBar();
        },
        onError: (error) => {
          // Tailing polls on an interval; an unreachable instance produces the
          // same error every tick. Collapse consecutive identical errors into a
          // single line so the channel doesn't fill with duplicates.
          if (error.message === this.lastErrorMessage) return;
          this.lastErrorMessage = error.message;
          this.outputChannel.error(error.message);
        },
        onFileDiscovered: (file) => {
          this.fileToPrefix.set(file.name, file.prefix);
          this.outputChannel.info(`Discovered: ${file.name}`);
        },
        onFileRotated: (file) => {
          this.outputChannel.info(`File rotated: ${file.name}`);
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
    this.outputChannel.info(`--- Stopped tailing (${this.entryCount} entries) ---`);
    this.tailResult = undefined;
    this.entryCount = 0;
    this.fileToPrefix.clear();
    this.updateStatusBar();
  }

  /**
   * Writes a parsed log entry to the channel, routing by level so VS Code
   * colors it, tagging it with its source prefix, and indenting continuation
   * lines (stack traces) so each multi-line entry reads as one block.
   *
   * The server's GMT timestamp leads each entry — it is the authoritative time
   * the event occurred on the instance. (VS Code's LogOutputChannel also adds
   * its own local timestamp, but that only reflects when the line was polled,
   * so the server time is shown explicitly as the source of truth.)
   *
   * The source prefix is shown only when it adds information beyond the level
   * VS Code prints (e.g. `[customerror]` for an ERROR entry, but nothing for an
   * `error` file).
   */
  private writeEntry(entry: LogEntry): void {
    const prefix = this.fileToPrefix.get(entry.file) ?? entry.file;
    // Skip the tag when it would just duplicate VS Code's level (e.g. an "error"
    // file emitting an ERROR entry → VS Code already shows "[error]").
    const showTag = prefix.toLowerCase() !== (entry.level ?? '').toLowerCase();
    const tag = showTag ? `[${prefix}] ` : '';
    // Server event time (GMT) — the accurate time the event occurred. Leads the
    // entry so it is unambiguously the source of truth over VS Code's poll time.
    const serverTs = entry.timestamp ? `${entry.timestamp} ` : '';
    // Path normalization is applied in the SDK before onEntry, so entry.message
    // already carries local cartridge paths — keep it intact for clickable links.
    const body = entry.message.split('\n').join('\n    ');
    const line = `${serverTs}${tag}${body}`;

    switch (entry.level) {
      case 'ERROR':
      case 'FATAL':
        this.outputChannel.error(line);
        break;
      case 'WARN':
        this.outputChannel.warn(line);
        break;
      case 'DEBUG':
      case 'TRACE':
        this.outputChannel.debug(line);
        break;
      default:
        // INFO and unparsed entries (no recognized level)
        this.outputChannel.info(line);
        break;
    }
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
