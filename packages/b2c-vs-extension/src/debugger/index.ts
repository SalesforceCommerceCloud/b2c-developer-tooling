/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {findCartridges} from '@salesforce/b2c-tooling-sdk/operations/code';
import {B2CScriptDebugAdapter} from '@salesforce/b2c-tooling-sdk/operations/debug';
import type {DebugSessionConfig} from '@salesforce/b2c-tooling-sdk/operations/debug';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {markFeatureUsed} from '../telemetry.js';

const DEBUG_TYPE = 'b2c-script';

class B2CDebugAdapterFactory implements vscode.DebugAdapterDescriptorFactory {
  constructor(private readonly configProvider: B2CExtensionConfig) {}

  createDebugAdapterDescriptor(_session: vscode.DebugSession): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
    markFeatureUsed('debugger');
    const config = this.configProvider.getConfig();
    if (!config || !config.hasB2CInstanceConfig()) {
      void vscode.window.showErrorMessage(
        'B2C Script Debugger: No B2C Commerce instance configured. ' +
          'Add hostname, username, and password to your configuration (dw.json).',
      );
      return undefined;
    }

    const values = config.values;
    if (!values.username || !values.password) {
      void vscode.window.showErrorMessage(
        'B2C Script Debugger: username and password (access key) are required for the script debugger. ' +
          'Add them to your configuration (dw.json).',
      );
      return undefined;
    }

    if (!values.hostname) {
      void vscode.window.showErrorMessage(
        'B2C Script Debugger: No hostname configured. Add it to your configuration (dw.json).',
      );
      return undefined;
    }

    const workingDirectory = this.configProvider.getWorkingDirectory();
    const cartridges = findCartridges(workingDirectory);

    const sessionConfig: DebugSessionConfig = {
      hostname: values.hostname,
      username: values.username,
      password: values.password,
      cartridgeRoots: cartridges,
    };

    const adapter = new B2CScriptDebugAdapter(sessionConfig);
    return new vscode.DebugAdapterInlineImplementation(adapter);
  }
}

/**
 * Copies the active debug session's `dwsid` cookie to the clipboard so the user
 * can send a triggering request (storefront page, SCAPI/OCAPI call) on the same
 * app server holding the debug session — required to hit breakpoints on
 * multi-app-server PIG environments.
 */
async function copySessionCookie(): Promise<void> {
  const session = vscode.debug.activeDebugSession;
  if (!session || session.type !== DEBUG_TYPE) {
    void vscode.window.showWarningMessage('B2C Script Debugger: no active debug session. Start a debug session first.');
    return;
  }

  let value: string | null = null;
  try {
    const result = (await session.customRequest('b2c/sessionCookie')) as {value?: string | null} | undefined;
    value = result?.value ?? null;
  } catch {
    // Falls through to the not-available message below.
  }

  if (!value) {
    void vscode.window.showWarningMessage(
      'B2C Script Debugger: no session cookie (dwsid) is available yet. Wait for the debugger to connect.',
    );
    return;
  }

  await vscode.env.clipboard.writeText(value);
  void vscode.window.showInformationMessage(
    `B2C Script Debugger: copied dwsid to clipboard. Send your triggering request with "Cookie: dwsid=${value}".`,
  );
}

export function registerDebugger(context: vscode.ExtensionContext, configProvider: B2CExtensionConfig): void {
  const factory = new B2CDebugAdapterFactory(configProvider);
  context.subscriptions.push(
    vscode.debug.registerDebugAdapterDescriptorFactory(DEBUG_TYPE, factory),
    vscode.commands.registerCommand('b2c-dx.debug.copySessionCookie', () => copySessionCookie()),
  );
}
