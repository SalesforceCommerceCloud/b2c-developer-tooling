/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import path from 'node:path';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {registerScaffoldCommands} from './scaffold-commands.js';

export function registerScaffold(
  context: vscode.ExtensionContext,
  configProvider: B2CExtensionConfig,
  log: vscode.OutputChannel,
): void {
  const builtInScaffoldsDir = path.join(context.extensionPath, 'dist', 'data', 'scaffolds');
  log.appendLine(`[Scaffold] Built-in scaffolds dir: ${builtInScaffoldsDir}`);
  const disposables = registerScaffoldCommands(configProvider, log, builtInScaffoldsDir);
  context.subscriptions.push(...disposables);
}
