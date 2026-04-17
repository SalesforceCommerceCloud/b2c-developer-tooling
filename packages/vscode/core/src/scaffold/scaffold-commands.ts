/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import path from 'node:path';
import * as vscode from 'vscode';
import {
  createScaffoldRegistry,
  generateFromScaffold,
  evaluateCondition,
  detectSourceFromPath,
  resolveLocalSource,
  resolveRemoteSource,
  isRemoteSource,
  resolveOutputDirectory,
  type Scaffold,
  type ScaffoldParameter,
  type ScaffoldChoice,
  type ScaffoldGenerateResult,
  type SourceResult,
} from '@salesforce/b2c-tooling-sdk/scaffold';
import {findCartridges} from '@salesforce/b2c-tooling-sdk/operations/code';
import type {B2CExtensionConfig} from '../config-provider.js';

interface ScaffoldQuickPickItem extends vscode.QuickPickItem {
  scaffold: Scaffold;
}

interface ValueQuickPickItem extends vscode.QuickPickItem {
  value: string;
}

interface BooleanQuickPickItem extends vscode.QuickPickItem {
  boolValue: boolean;
}

export function registerScaffoldCommands(
  configProvider: B2CExtensionConfig,
  log: vscode.OutputChannel,
  builtInScaffoldsDir: string,
): vscode.Disposable[] {
  const generate = vscode.commands.registerCommand('b2c-dx.scaffold.generate', async (uri?: vscode.Uri) => {
    try {
      await runScaffoldWizard(uri, configProvider, log, builtInScaffoldsDir);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.appendLine(`[Scaffold] Error: ${message}`);
      vscode.window.showErrorMessage(`Scaffold generation failed: ${message}`);
    }
  });

  return [generate];
}

async function runScaffoldWizard(
  uri: vscode.Uri | undefined,
  configProvider: B2CExtensionConfig,
  log: vscode.OutputChannel,
  builtInScaffoldsDir: string,
): Promise<void> {
  if (!vscode.workspace.workspaceFolders?.length) {
    vscode.window.showWarningMessage('Open a workspace folder to use scaffolds.');
    return;
  }
  const projectRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
  log.appendLine(`[Scaffold] Starting wizard, projectRoot=${projectRoot}`);

  // Step 1: Discover and select scaffold
  const registry = createScaffoldRegistry({builtInScaffoldsDir});
  const scaffolds = await vscode.window.withProgress(
    {location: vscode.ProgressLocation.Window, title: 'Loading scaffolds...'},
    () => registry.getScaffolds({projectRoot}),
  );

  log.appendLine(`[Scaffold] Discovered ${scaffolds.length} scaffold(s)`);
  for (const s of scaffolds) {
    log.appendLine(`[Scaffold]   ${s.id} (${s.source}) — ${s.path}`);
  }

  if (scaffolds.length === 0) {
    vscode.window.showWarningMessage('No scaffolds available.');
    return;
  }

  // Determine context path: from URI (context menu) or active editor (command palette)
  const contextPath = uri?.fsPath ?? vscode.window.activeTextEditor?.document.uri.fsPath ?? undefined;
  if (contextPath) {
    log.appendLine(`[Scaffold] Context path: ${contextPath}`);
  }

  // Filter scaffolds based on context: inside a cartridge → show only cartridge-targeting scaffolds
  const insideCartridge = contextPath
    ? findCartridges(projectRoot).some((c) => contextPath === c.src || contextPath.startsWith(c.src + path.sep))
    : false;

  if (insideCartridge) {
    log.appendLine('[Scaffold] Context is inside a cartridge — filtering scaffold list');
  }

  const filteredScaffolds = insideCartridge
    ? scaffolds.filter((s) => s.manifest.parameters.some((p) => p.source === 'cartridges'))
    : scaffolds;

  const displayScaffolds = filteredScaffolds.length > 0 ? filteredScaffolds : scaffolds;

  const scaffoldItems: ScaffoldQuickPickItem[] = displayScaffolds.map((s) => ({
    label: s.manifest.displayName,
    description: s.manifest.category,
    detail: s.manifest.description,
    scaffold: s,
  }));

  const picked = await vscode.window.showQuickPick(scaffoldItems, {
    title: 'New from Scaffold',
    placeHolder: 'Select a scaffold template',
    matchOnDetail: true,
  });

  if (!picked) return;
  const scaffold = picked.scaffold;
  log.appendLine(`[Scaffold] Selected: ${scaffold.id}`);

  // Step 2: Pre-fill source parameters from context, then prompt for the rest
  const resolvedVariables: Record<string, string | boolean | string[]> = {};

  let sourceDetected = false;
  if (contextPath) {
    for (const param of scaffold.manifest.parameters) {
      if (!param.source) continue;
      const detected = detectSourceFromPath(param, contextPath, projectRoot);
      if (detected) {
        resolvedVariables[param.name] = detected.value;
        Object.assign(resolvedVariables, detected.companionVariables);
        sourceDetected = true;
        log.appendLine(`[Scaffold] Auto-detected ${param.source}: ${param.name}=${detected.value}`);
      }
    }
  }

  // Count visible params for step progress (best-effort — conditional params may change)
  const visibleParams = scaffold.manifest.parameters.filter((p) => {
    if (resolvedVariables[p.name] !== undefined) return false;
    if (p.when && !evaluateCondition(p.when, resolvedVariables)) return false;
    return true;
  });

  let stepIndex = 0;
  for (const param of scaffold.manifest.parameters) {
    // Skip if already pre-filled by context detection
    if (resolvedVariables[param.name] !== undefined) continue;

    // Evaluate conditional visibility
    if (param.when && !evaluateCondition(param.when, resolvedVariables)) {
      log.appendLine(`[Scaffold] Skipping param ${param.name} (when: "${param.when}" is false)`);
      continue;
    }

    stepIndex++;
    const stepTitle = `${scaffold.manifest.displayName} (${stepIndex}/${visibleParams.length})`;
    log.appendLine(`[Scaffold] Prompting for param: ${param.name} (type: ${param.type})`);

    const value = await promptForParameter(param, scaffold, projectRoot, configProvider, log, stepTitle);
    if (value === undefined) {
      log.appendLine('[Scaffold] User cancelled');
      return;
    }

    resolvedVariables[param.name] = value;
    log.appendLine(`[Scaffold] ${param.name} = ${JSON.stringify(value)}`);

    // Set companion path variable for cartridges source
    if (param.source === 'cartridges' && typeof value === 'string') {
      const result = resolveLocalSource('cartridges', projectRoot);
      const cartridgePath = result.pathMap?.get(value);
      if (cartridgePath) {
        resolvedVariables[`${param.name}Path`] = cartridgePath;
      }
    }
  }

  // Step 3: Resolve output directory
  let outputDir: string;
  if (sourceDetected) {
    // Source detected (e.g., cartridge) → use projectRoot because cartridgeNamePath is relative to it
    outputDir = projectRoot;
    log.appendLine(`[Scaffold] Output dir from source detection: ${outputDir}`);
  } else if (uri) {
    outputDir = uri.fsPath;
    log.appendLine(`[Scaffold] Output dir from context menu: ${outputDir}`);
  } else {
    const defaultOutput = resolveOutputDirectory({scaffold, projectRoot});
    const folders = await vscode.window.showOpenDialog({
      title: 'Select output directory',
      defaultUri: vscode.Uri.file(defaultOutput),
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: 'Generate Here',
    });
    if (!folders || folders.length === 0) return;
    outputDir = folders[0].fsPath;
    log.appendLine(`[Scaffold] Output dir from dialog: ${outputDir}`);
  }

  // Step 4: Generate with progress
  log.appendLine(`[Scaffold] Generating ${scaffold.id} into ${outputDir}`);
  const result: ScaffoldGenerateResult = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Generating ${scaffold.manifest.displayName}...`,
    },
    () =>
      generateFromScaffold(scaffold, {
        outputDir,
        variables: resolvedVariables,
        dryRun: false,
        force: false,
      }),
  );

  // Step 5: Show results
  const created = result.files.filter((f) => f.action === 'created' || f.action === 'overwritten');
  const skipped = result.files.filter((f) => f.action === 'skipped');

  log.appendLine(`[Scaffold] Result: ${created.length} created, ${skipped.length} skipped`);
  for (const f of result.files) {
    log.appendLine(`[Scaffold]   ${f.action}: ${f.path}${f.skipReason ? ` (${f.skipReason})` : ''}`);
  }

  if (result.postInstructions) {
    log.appendLine(`[Scaffold] Post-instructions: ${result.postInstructions}`);
  }

  if (created.length === 0 && skipped.length > 0) {
    vscode.window.showWarningMessage(
      `All ${skipped.length} file(s) already exist and were skipped. Use the CLI with --force to overwrite.`,
    );
    return;
  }

  if (created.length > 0) {
    // Open the first created file immediately
    const fileUri = vscode.Uri.file(created[0].absolutePath);
    const doc = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(doc);

    // Show message with Reveal action for the output directory
    const action = await vscode.window.showInformationMessage(
      `Generated ${created.length} file(s) from ${scaffold.manifest.displayName} scaffold.`,
      'Reveal in Explorer',
    );
    if (action === 'Reveal in Explorer') {
      await vscode.commands.executeCommand('revealInExplorer', fileUri);
    }
  }

  if (result.postInstructions) {
    vscode.window.showInformationMessage(result.postInstructions);
  }
}

/**
 * Prompt for a single parameter value using VS Code UI.
 * Returns undefined if the user cancelled.
 */
async function promptForParameter(
  param: ScaffoldParameter,
  scaffold: Scaffold,
  projectRoot: string,
  configProvider: B2CExtensionConfig,
  log: vscode.OutputChannel,
  title?: string,
): Promise<string | boolean | string[] | undefined> {
  const stepTitle = title ?? scaffold.manifest.displayName;

  switch (param.type) {
    case 'boolean':
      return promptBoolean(param, stepTitle);

    case 'choice': {
      const choices = await resolveChoices(param, projectRoot, configProvider, log);
      if (choices.length === 0) {
        if (param.source) {
          log.appendLine(`[Scaffold] No ${param.source} found, falling back to text input`);
        }
        return promptString(param, stepTitle);
      }
      return promptChoice(param, choices, stepTitle);
    }

    case 'multi-choice': {
      const choices = await resolveChoices(param, projectRoot, configProvider, log);
      if (choices.length === 0) return [];
      return promptMultiChoice(param, choices, stepTitle);
    }

    case 'string': {
      if (param.source) {
        const choices = await resolveChoices(param, projectRoot, configProvider, log);
        if (choices.length > 0) {
          return promptChoice(param, choices, stepTitle);
        }
        log.appendLine(`[Scaffold] No ${param.source} found, falling back to text input`);
      }
      return promptString(param, stepTitle);
    }

    default:
      return undefined;
  }
}

async function promptString(param: ScaffoldParameter, title: string): Promise<string | undefined> {
  return vscode.window.showInputBox({
    title,
    prompt: param.prompt,
    value: typeof param.default === 'string' ? param.default : undefined,
    validateInput: (val) => {
      if (param.required && !val.trim()) return 'This field is required';
      if (param.pattern && val) {
        if (!new RegExp(param.pattern).test(val)) {
          return param.validationMessage || `Value must match: ${param.pattern}`;
        }
      }
      return null;
    },
  });
}

async function promptBoolean(param: ScaffoldParameter, title: string): Promise<boolean | undefined> {
  const items: BooleanQuickPickItem[] = [
    {label: 'Yes', description: param.default === true ? '(default)' : undefined, boolValue: true},
    {label: 'No', description: param.default === false ? '(default)' : undefined, boolValue: false},
  ];

  const picked = await vscode.window.showQuickPick(items, {
    title,
    placeHolder: param.prompt,
  });

  return picked?.boolValue;
}

async function promptChoice(
  param: ScaffoldParameter,
  choices: ScaffoldChoice[],
  title: string,
): Promise<string | undefined> {
  const items: ValueQuickPickItem[] = choices.map((c) => ({
    label: c.label,
    description: c.value !== c.label ? c.value : undefined,
    value: c.value,
  }));

  const picked = await vscode.window.showQuickPick(items, {
    title,
    placeHolder: param.prompt,
    matchOnDescription: true,
  });

  return picked?.value;
}

async function promptMultiChoice(
  param: ScaffoldParameter,
  choices: ScaffoldChoice[],
  title: string,
): Promise<string[] | undefined> {
  const defaults = Array.isArray(param.default) ? param.default : [];
  const items: ValueQuickPickItem[] = choices.map((c) => ({
    label: c.label,
    description: c.value !== c.label ? c.value : undefined,
    value: c.value,
    picked: defaults.includes(c.value),
  }));

  const picked = await vscode.window.showQuickPick(items, {
    title,
    placeHolder: param.prompt,
    canPickMany: true,
  });

  return picked?.map((p) => p.value);
}

/**
 * Resolve choices for a parameter, handling both local and remote sources.
 */
async function resolveChoices(
  param: ScaffoldParameter,
  projectRoot: string,
  configProvider: B2CExtensionConfig,
  log: vscode.OutputChannel,
): Promise<ScaffoldChoice[]> {
  if (!param.source) {
    return param.choices || [];
  }

  if (isRemoteSource(param.source)) {
    try {
      const instance = configProvider.getInstance();
      if (!instance) {
        log.appendLine(`[Scaffold] No B2C instance configured, cannot resolve ${param.source}`);
        return [];
      }
      return await resolveRemoteSource(param.source, instance);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.appendLine(`[Scaffold] Failed to resolve remote source ${param.source}: ${message}`);
      return [];
    }
  }

  const result: SourceResult = resolveLocalSource(param.source, projectRoot);
  return result.choices;
}
