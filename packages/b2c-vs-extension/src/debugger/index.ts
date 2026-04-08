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

const DEBUG_TYPE = 'b2c-script';

class B2CDebugAdapterFactory implements vscode.DebugAdapterDescriptorFactory {
  constructor(private readonly configProvider: B2CExtensionConfig) {}

  createDebugAdapterDescriptor(_session: vscode.DebugSession): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
    const config = this.configProvider.getConfig();
    if (!config) {
      throw new Error('No B2C Commerce instance configured. Configure dw.json first.');
    }

    const values = config.values;
    if (!values.hostname || !values.username || !values.password) {
      throw new Error('Basic auth credentials (hostname, username, password) are required for the script debugger.');
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

export function registerDebugger(context: vscode.ExtensionContext, configProvider: B2CExtensionConfig): void {
  const factory = new B2CDebugAdapterFactory(configProvider);
  context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory(DEBUG_TYPE, factory));
}
