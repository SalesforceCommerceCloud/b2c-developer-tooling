/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'fs';
import * as path from 'path';
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

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    // Only decorate directories
    try {
      const stat = fs.statSync(uri.fsPath);
      if (!stat.isDirectory()) return undefined;
    } catch {
      return undefined;
    }

    const capJsonPath = path.join(uri.fsPath, 'commerce-app.json');
    if (fs.existsSync(capJsonPath)) {
      return {
        badge: 'CA',
        tooltip: 'Commerce App Package (CAP)',
        color: new vscode.ThemeColor('charts.blue'),
      };
    }

    return undefined;
  }

  /** Notify VS Code to re-evaluate decorations for all files. */
  refresh(): void {
    this._onDidChangeFileDecorations.fire(undefined);
  }

  dispose(): void {
    this._onDidChangeFileDecorations.dispose();
  }
}
