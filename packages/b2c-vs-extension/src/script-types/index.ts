/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';

import type {CartridgeService} from '../cartridges/cartridge-service.js';

const PLUGIN_ID = '@salesforce/b2c-script-types';

interface TypeScriptApi {
  configurePlugin(pluginId: string, configuration: unknown): void;
}

async function getTypeScriptApi(log: vscode.OutputChannel): Promise<TypeScriptApi | undefined> {
  const ext = vscode.extensions.getExtension('vscode.typescript-language-features');
  if (!ext) {
    log.appendLine('[ScriptTypes] vscode.typescript-language-features not found; IntelliSense plugin disabled.');
    return undefined;
  }
  if (!ext.isActive) {
    try {
      await ext.activate();
    } catch (err) {
      log.appendLine(`[ScriptTypes] Failed to activate TypeScript extension: ${String(err)}`);
      return undefined;
    }
  }
  const api = ext.exports?.getAPI?.(0) as TypeScriptApi | undefined;
  if (!api || typeof api.configurePlugin !== 'function') {
    log.appendLine('[ScriptTypes] TypeScript extension API unavailable; cannot push plugin config.');
    return undefined;
  }
  return api;
}

function isFeatureEnabled(): boolean {
  return vscode.workspace.getConfiguration('b2c-dx').get<boolean>('features.scriptTypes', true);
}

export function registerScriptTypes(
  context: vscode.ExtensionContext,
  cartridgeService: CartridgeService,
  log: vscode.OutputChannel,
): void {
  let api: TypeScriptApi | undefined;
  let apiPromise: Promise<TypeScriptApi | undefined> | undefined;

  const ensureApi = async (): Promise<TypeScriptApi | undefined> => {
    if (api) return api;
    if (!apiPromise) apiPromise = getTypeScriptApi(log);
    api = await apiPromise;
    return api;
  };

  const push = async (): Promise<void> => {
    const a = await ensureApi();
    if (!a) return;
    const enabled = isFeatureEnabled();
    const roots = enabled ? cartridgeService.getCartridgeRoots() : [];
    a.configurePlugin(PLUGIN_ID, {cartridgeRoots: roots, enabled});
    log.appendLine(`[ScriptTypes] Pushed ${roots.length} cartridge root(s); enabled=${enabled}.`);
  };

  void push();

  const cartridgesSub = cartridgeService.onDidChange(() => void push());

  const configChange = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('b2c-dx.features.scriptTypes')) {
      void push();
    }
  });

  const refreshCmd = vscode.commands.registerCommand('b2c-dx.scriptTypes.refresh', async () => {
    cartridgeService.refresh();
    const roots = cartridgeService.getCartridgeRoots();
    vscode.window.showInformationMessage(
      `B2C DX: Script API IntelliSense — ${isFeatureEnabled() ? 'active' : 'disabled'} (${roots.length} cartridge${roots.length === 1 ? '' : 's'}).`,
    );
  });

  context.subscriptions.push(cartridgesSub, configChange, refreshCmd);
}
