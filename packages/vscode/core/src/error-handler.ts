/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as vscode from 'vscode';

/**
 * Two-tier error handler following the Salesforce Extension Pack pattern:
 * - Short notification with action buttons
 * - Full error details in the "B2C DX" output channel (on "View Details" click)
 *
 * Exported via the B2CDXApi so dependent extensions share a consistent error UX.
 */
export async function showError(
  log: vscode.OutputChannel,
  error: unknown,
  options?: {suggestion?: string},
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const shortMessage = message.length > 120 ? message.slice(0, 117) + '...' : message;

  const buttons: string[] = ['View Details'];
  if (options?.suggestion) buttons.unshift(options.suggestion);

  const selection = await vscode.window.showErrorMessage(`B2C DX: ${shortMessage}`, ...buttons);

  if (selection === 'View Details') {
    log.appendLine(`[ERROR] ${message}`);
    if (error instanceof Error && error.stack) {
      log.appendLine(error.stack);
    }
    log.show();
  }
}
