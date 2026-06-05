/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';

/**
 * Provides file decorations for Commerce App Package (CAP) directories.
 *
 * Any directory containing a `commerce-app.json` file gets a "CA" badge
 * in the VS Code explorer, making CAPs visually distinct.
 */
export class CapFileDecorationProvider implements vscode.FileDecorationProvider {
  private readonly _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
  readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

  /**
   * @param isCapDirectory O(1) predicate that returns true when the given URI
   *   is a known CAP directory. Backed by the in-memory set maintained by the
   *   CAP feature's FileSystemWatcher, so paints don't hit the filesystem.
   */
  constructor(private readonly isCapDirectory: (uri: vscode.Uri) => boolean) {}

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    if (!this.isCapDirectory(uri)) return undefined;
    return {
      badge: 'CA',
      tooltip: 'Commerce App Package (CAP)',
      color: new vscode.ThemeColor('charts.blue'),
    };
  }

  /** Notify VS Code to re-evaluate decorations for all files. */
  refresh(): void {
    this._onDidChangeFileDecorations.fire(undefined);
  }

  dispose(): void {
    this._onDidChangeFileDecorations.dispose();
  }
}
