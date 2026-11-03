/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';

import path from 'node:path';

import type {CartridgeService} from '../cartridges/cartridge-service.js';
import type {B2CExtensionConfig} from '../config-provider.js';
import {registerSafeCommand} from '../safety.js';
import {
  PROJECT_TYPES_FILE,
  generateTo,
  projectFile,
  projectFilePath,
  resolveTarget,
  type GenerateOutcome,
} from './custom-attributes.js';

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

function describeOutcome(outcome: GenerateOutcome): string {
  const values = outcome.valuesIncluded ? '' : ' Enum values were omitted.';
  return `${outcome.attributes} custom attribute(s) across ${outcome.objectTypes} object type(s).${values}`;
}

export function registerScriptTypes(
  context: vscode.ExtensionContext,
  cartridgeService: CartridgeService,
  configProvider: B2CExtensionConfig,
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
    const cartridges = enabled ? cartridgeService.getCartridges().map((c) => ({name: c.name, src: c.src})) : [];
    const extraTypeFiles = enabled ? customTypesFiles() : [];
    a.configurePlugin(PLUGIN_ID, {cartridges, enabled, extraTypeFiles});
    log.appendLine(
      `[ScriptTypes] Pushed ${cartridges.length} cartridge(s); enabled=${enabled}; order=[${cartridges.map((c) => c.name).join(', ')}]; types=[${extraTypeFiles.join(', ')}].`,
    );
  };

  // Custom attribute declarations are opt-in: the plugin loads the project
  // file only after the write command (or `b2c setup ide vscode-types
  // --custom-attributes`) has created it.
  const customTypesFiles = (): string[] => {
    const file = projectFile(configProvider);
    return file ? [file] : [];
  };

  void push();

  const resetSub = configProvider.onDidReset(() => void push());

  const typesWatcher = vscode.workspace.createFileSystemWatcher(`**/${PROJECT_TYPES_FILE.split(path.sep).join('/')}`);
  typesWatcher.onDidCreate(() => void push());
  typesWatcher.onDidDelete(() => void push());

  const cartridgesSub = cartridgeService.onDidChange(() => void push());

  const configChange = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('b2c-dx.features.scriptTypes')) {
      void push();
    }
  });

  const refreshCmd = registerSafeCommand('b2c-dx.scriptTypes.refresh', async () => {
    cartridgeService.refresh();
    const cartridges = cartridgeService.getCartridges();
    vscode.window.showInformationMessage(
      `B2C DX: Script API IntelliSense — ${isFeatureEnabled() ? 'active' : 'disabled'} (${cartridges.length} cartridge${cartridges.length === 1 ? '' : 's'}).`,
    );
  });

  const writeCustomCmd = registerSafeCommand('b2c-dx.scriptTypes.writeCustomAttributes', async () => {
    const target = resolveTarget(configProvider);
    if (typeof target === 'string') {
      vscode.window.showErrorMessage(`B2C DX: Cannot generate custom attribute types. ${target}`);
      return;
    }
    const file = projectFilePath(configProvider);
    try {
      const outcome = await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: 'B2C DX: Generating custom attribute types...'},
        () => generateTo(configProvider, target, file),
      );
      for (const warning of outcome.warnings) log.appendLine(`[ScriptTypes] ${warning}`);
      await push();
      const action = await vscode.window.showInformationMessage(
        `B2C DX: Wrote ${path.relative(configProvider.getWorkingDirectory(), file)}: ${describeOutcome(outcome)}`,
        'Open File',
      );
      if (action === 'Open File') await vscode.window.showTextDocument(vscode.Uri.file(file));
    } catch (err) {
      vscode.window.showErrorMessage(`B2C DX: Custom attribute types not generated: ${String(err)}`);
    }
  });

  context.subscriptions.push(cartridgesSub, configChange, resetSub, typesWatcher, refreshCmd, writeCustomCmd);
}
