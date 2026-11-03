/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';

import {existsSync} from 'node:fs';
import path from 'node:path';

import type {CartridgeService} from '../cartridges/cartridge-service.js';
import type {B2CExtensionConfig} from '../config-provider.js';
import {registerSafeCommand} from '../safety.js';
import {
  PROJECT_TYPES_FILE,
  canAuthenticateSilently,
  generateTo,
  isStale,
  projectFile,
  resolveTarget,
  storageFile,
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

function isCustomAttributesEnabled(): boolean {
  return vscode.workspace.getConfiguration('b2c-dx').get<boolean>('scriptTypes.customAttributes', true);
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

  // Custom attribute declarations: a project copy (written by the command or
  // `b2c setup ide vscode-types --custom-attributes`) wins; otherwise a copy
  // generated in the background into extension storage, one per instance.
  const customTypesFiles = (): string[] => {
    if (!isCustomAttributesEnabled()) return [];
    const inProject = projectFile(configProvider);
    if (inProject) return [inProject];
    const target = resolveTarget(configProvider);
    if (typeof target === 'string') return [];
    const file = storageFile(context, target);
    return existsSync(file) ? [file] : [];
  };

  let generating: Promise<void> | undefined;
  const refreshInBackground = async (): Promise<void> => {
    if (generating || !isFeatureEnabled() || !isCustomAttributesEnabled()) return;
    if (projectFile(configProvider)) return;
    const target = resolveTarget(configProvider);
    if (typeof target === 'string') return;
    const file = storageFile(context, target);
    if (!(await isStale(file))) return;
    // Never open a browser for a background refresh; wait for the command instead.
    if (!canAuthenticateSilently(configProvider)) {
      log.appendLine('[ScriptTypes] Custom attribute types not refreshed: no API client secret or stored login.');
      return;
    }
    generating = (async () => {
      try {
        const outcome = await generateTo(configProvider, target, file);
        log.appendLine(`[ScriptTypes] Generated custom attribute types: ${describeOutcome(outcome)} ${file}`);
        for (const warning of outcome.warnings) log.appendLine(`[ScriptTypes] ${warning}`);
        await push();
      } catch (err) {
        log.appendLine(`[ScriptTypes] Custom attribute types not generated: ${String(err)}`);
      } finally {
        generating = undefined;
      }
    })();
    await generating;
  };

  void push().then(() => refreshInBackground());

  const resetSub = configProvider.onDidReset(() => void push().then(() => refreshInBackground()));

  const cartridgesSub = cartridgeService.onDidChange(() => void push());

  const configChange = vscode.workspace.onDidChangeConfiguration((e) => {
    if (
      e.affectsConfiguration('b2c-dx.features.scriptTypes') ||
      e.affectsConfiguration('b2c-dx.scriptTypes.customAttributes')
    ) {
      void push().then(() => refreshInBackground());
    }
  });

  const refreshCmd = registerSafeCommand('b2c-dx.scriptTypes.refresh', async () => {
    cartridgeService.refresh();
    const cartridges = cartridgeService.getCartridges();
    vscode.window.showInformationMessage(
      `B2C DX: Script API IntelliSense — ${isFeatureEnabled() ? 'active' : 'disabled'} (${cartridges.length} cartridge${cartridges.length === 1 ? '' : 's'}).`,
    );
  });

  const generate = async (toProject: boolean): Promise<void> => {
    const target = resolveTarget(configProvider);
    if (typeof target === 'string') {
      vscode.window.showErrorMessage(`B2C DX: Cannot generate custom attribute types. ${target}`);
      return;
    }
    const file = toProject
      ? path.join(configProvider.getWorkingDirectory(), PROJECT_TYPES_FILE)
      : (projectFile(configProvider) ?? storageFile(context, target));
    try {
      const outcome = await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: 'B2C DX: Generating custom attribute types...'},
        () => generateTo(configProvider, target, file),
      );
      for (const warning of outcome.warnings) log.appendLine(`[ScriptTypes] ${warning}`);
      await push();
      const where = toProject ? ` Wrote ${path.relative(configProvider.getWorkingDirectory(), file)}.` : '';
      const action = toProject
        ? await vscode.window.showInformationMessage(
            `B2C DX: Custom attribute types updated: ${describeOutcome(outcome)}${where}`,
            'Open File',
          )
        : await vscode.window.showInformationMessage(
            `B2C DX: Custom attribute types updated: ${describeOutcome(outcome)}`,
          );
      if (action === 'Open File') await vscode.window.showTextDocument(vscode.Uri.file(file));
    } catch (err) {
      vscode.window.showErrorMessage(`B2C DX: Custom attribute types not generated: ${String(err)}`);
    }
  };

  const refreshCustomCmd = registerSafeCommand('b2c-dx.scriptTypes.refreshCustomAttributes', () => generate(false));
  const writeCustomCmd = registerSafeCommand('b2c-dx.scriptTypes.writeCustomAttributes', () => generate(true));

  context.subscriptions.push(cartridgesSub, configChange, resetSub, refreshCmd, refreshCustomCmd, writeCustomCmd);
}
