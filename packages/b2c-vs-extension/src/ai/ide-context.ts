/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';

export interface CodeSyncStatus {
  available: boolean;
  active: boolean;
  hostname?: string;
  codeVersion?: string;
}

export interface IdeContext {
  status: 'ready' | 'unconfigured' | 'unavailable';
  selectionMode: 'workspace' | 'default';
  projectDirectory?: string;
  projectRootPinned: boolean;
  configPath?: string;
  instanceName?: string;
  hostname?: string;
  codeVersion?: string;
  codeSync: CodeSyncStatus;
}

/** Only allowlisted connection metadata may cross into a model's context. */
export async function readIdeContext(
  configProvider: B2CExtensionConfig,
  getCodeSyncStatus: () => CodeSyncStatus,
): Promise<IdeContext> {
  await configProvider.ensureResolved();
  const config = configProvider.getConfig();
  const selection = configProvider.getWorkspaceInstanceSelection();
  const source = config?.sources.find((entry) => entry.name === 'DwJsonSource' && entry.location);
  const projectDirectory = configProvider.getWorkingDirectory() || undefined;
  return {
    status: config?.hasB2CInstanceConfig() ? 'ready' : selection ? 'unavailable' : 'unconfigured',
    selectionMode: selection ? 'workspace' : 'default',
    projectDirectory,
    projectRootPinned: configProvider.isProjectRootPinned(),
    configPath: selection?.location ?? source?.location,
    instanceName: selection?.name ?? config?.values.instanceName,
    hostname: config?.values.hostname,
    codeVersion: config?.values.codeVersion,
    codeSync: getCodeSyncStatus(),
  };
}

export class IdeContextTool implements vscode.LanguageModelTool<Record<string, never>> {
  constructor(private readonly readContext: () => Promise<IdeContext>) {}

  prepareInvocation(): vscode.PreparedToolInvocation {
    return {invocationMessage: 'Reading the selected B2C instance and code-sync status'};
  }

  async invoke(
    _options: vscode.LanguageModelToolInvocationOptions<Record<string, never>>,
    token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    if (token.isCancellationRequested) throw new vscode.CancellationError();
    const context = await this.readContext();
    if (token.isCancellationRequested) throw new vscode.CancellationError();
    return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(JSON.stringify(context))]);
  }
}
