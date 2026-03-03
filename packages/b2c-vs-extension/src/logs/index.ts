/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {LogTailManager} from './logs-tail.js';

export function registerLogs(context: vscode.ExtensionContext, configProvider: B2CExtensionConfig): void {
  const logManager = new LogTailManager();

  const startTail = vscode.commands.registerCommand('b2c-dx.logs.startTail', async () => {
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured. Configure dw.json first.');
      return;
    }
    await logManager.startTail(instance);
  });

  const stopTail = vscode.commands.registerCommand('b2c-dx.logs.stopTail', async () => {
    await logManager.stopTail();
  });

  // Stop tailing when config changes (instance might be different)
  configProvider.onDidReset(async () => {
    if (logManager.isTailing) {
      await logManager.stopTail();
    }
  });

  context.subscriptions.push(logManager, startTail, stopTail);
}
