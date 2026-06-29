/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {DwJsonSource} from '@salesforce/b2c-tooling-sdk/config';
import {setAuthSessionBackend} from '@salesforce/b2c-tooling-sdk/auth';
import {detectWorkspaceType} from '@salesforce/b2c-tooling-sdk/discovery';
import {configureLogger} from '@salesforce/b2c-tooling-sdk/logging';
import {VsCodeSecretsAuthSessionBackend} from './pkce-secret-store.js';

import * as path from 'path';
import * as vscode from 'vscode';
import {B2CExtensionConfig} from './config-provider.js';
import {CartridgeService} from './cartridges/cartridge-service.js';
import {registerCap} from './cap/index.js';
import {registerJobLogViewer} from './job-log-viewer.js';
import {registerContentTree} from './content-tree/index.js';
import {registerLogs} from './logs/index.js';
import {initializePlugins} from './plugins.js';
import {registerSafeCommand, registerSafety} from './safety.js';
import {registerSandboxTree} from './sandbox-tree/index.js';
import {registerScaffold} from './scaffold/index.js';
import {registerApiBrowser} from './api-browser/index.js';
import {registerDebugger} from './debugger/index.js';
import {registerCodeSync} from './code-sync/index.js';
import {registerScriptTypes} from './script-types/index.js';
import {registerWebDavTree} from './webdav-tree/index.js';
import {disposeTelemetry, initTelemetry, sendEvent, sendException} from './telemetry.js';

function applyLogLevel(log: vscode.OutputChannel): void {
  const config = vscode.workspace.getConfiguration('b2c-dx');
  const level = config.get<string>('logLevel', 'info');
  try {
    configureLogger({
      level: level as 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent',
      destination: {
        write(chunk: string | Buffer): boolean {
          const line = typeof chunk === 'string' ? chunk : chunk.toString('utf-8');
          log.appendLine(line.trimEnd());
          return true;
        },
      },
      json: false,
      colorize: false,
      redact: true,
    });
  } catch (err) {
    const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    log.appendLine(`Warning: Failed to configure SDK logger; SDK logs will not appear in this panel.\n${detail}`);
  }
}

async function updateStorefrontNextContext(
  configProvider: B2CExtensionConfig,
  log: vscode.OutputChannel,
): Promise<void> {
  const workingDir = configProvider.getWorkingDirectory();
  log.appendLine(`[Workspace] Running detectWorkspaceType for cwd=${workingDir}`);
  let isStorefrontNext = false;
  try {
    const result = await detectWorkspaceType(workingDir);
    log.appendLine(
      `[Workspace] Detection result: projectTypes=[${result.projectTypes.join(', ')}] matchedPatterns=[${result.matchedPatterns.join(', ')}]`,
    );
    isStorefrontNext = result.projectTypes.includes('storefront-next');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.appendLine(`[Workspace] storefront-next detection failed: ${message}`);
  }
  await vscode.commands.executeCommand('setContext', 'b2c-dx.isStorefrontNext', isStorefrontNext);
  log.appendLine(`[Workspace] setContext b2c-dx.isStorefrontNext=${isStorefrontNext} (cwd=${workingDir})`);
}

export async function activate(context: vscode.ExtensionContext) {
  const log = vscode.window.createOutputChannel('B2C DX');

  applyLogLevel(log);

  // Best-effort telemetry init. Non-blocking: client.start() runs in the
  // background. No-ops entirely when the user has telemetry disabled or no
  // connection string is configured.
  initTelemetry(context);

  try {
    const result = await activateInner(context, log);
    sendEvent('EXTENSION_ACTIVATED');
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    log.appendLine(`Activation failed: ${message}`);
    if (stack) log.appendLine(stack);
    console.error('B2C DX extension activation failed:', err);
    if (err instanceof Error) sendException(err, {phase: 'activate'});
    sendEvent('ACTIVATION_FAILED');
    vscode.window.showErrorMessage(`B2C DX: Extension failed to activate. See Output > B2C DX. Error: ${message}`);
    const showActivationError = () => {
      log.show();
      vscode.window.showErrorMessage(`B2C DX activation error: ${message}`);
    };
    context.subscriptions.push(
      vscode.commands.registerCommand('b2c-dx.promptAgent', showActivationError),
      vscode.commands.registerCommand('b2c-dx.listWebDav', showActivationError),
    );
  }
}

export async function deactivate(): Promise<void> {
  sendEvent('EXTENSION_DEACTIVATED');
  await disposeTelemetry();
}

async function activateInner(context: vscode.ExtensionContext, log: vscode.OutputChannel) {
  // Initialize b2c-cli plugins before registering commands/views.
  // This ensures plugin config sources and middleware are available
  // before the first resolveConfig() call. Failures are non-fatal.
  await initializePlugins();

  registerJobLogViewer(context);

  // Persist auth sessions via VS Code SecretStorage (OS keychain on
  // macOS/Windows/Linux, encrypted fallback otherwise — handled by VS Code).
  // Hydrate the in-memory snapshot before registering, so the SDK's sync
  // reads see existing sessions on first call.
  const authBackend = new VsCodeSecretsAuthSessionBackend(context);
  await authBackend.hydrate();
  setAuthSessionBackend(authBackend);

  const configProvider = new B2CExtensionConfig(log, context.workspaceState);
  context.subscriptions.push(configProvider);
  await configProvider.ensureResolved();

  registerSafety(context, configProvider);

  void updateStorefrontNextContext(configProvider, log);
  context.subscriptions.push(
    configProvider.onDidReset(() => {
      void updateStorefrontNextContext(configProvider, log);
    }),
  );

  const cartridgeService = new CartridgeService(configProvider);
  context.subscriptions.push(cartridgeService);

  const promptAgentDisposable = registerSafeCommand('b2c-dx.promptAgent', async () => {
    const prompt = await vscode.window.showInputBox({
      title: 'Prompt Agent',
      placeHolder: 'Enter your prompt for the agent...',
    });
    if (prompt === undefined || prompt === '') {
      return;
    }
    try {
      await vscode.env.clipboard.writeText(prompt);
      await vscode.commands.executeCommand('composer.newAgentChat');
      await new Promise((resolve) => setTimeout(resolve, 300));
      await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showWarningMessage(
        `Could not open Cursor chat: ${message}. Run this extension in Cursor to send prompts to the agent.`,
      );
    }
  });

  const listWebDavDisposable = registerSafeCommand('b2c-dx.listWebDav', () => {
    vscode.commands.executeCommand('b2cWebdavExplorer.focus');
  });

  // --- Active instance status bar ---
  const dwJsonSource = new DwJsonSource();
  const getWorkingDirectory = () => configProvider.getWorkingDirectory();

  const instanceStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
  instanceStatusBar.command = 'b2c-dx.instance.switch';
  const updateInstanceStatusBar = async () => {
    const config = configProvider.getConfig();
    if (config) {
      // Find active instance name from dw.json
      const instances = await dwJsonSource.listInstances({workingDirectory: getWorkingDirectory()});
      const active = instances.find((i) => i.active);
      const name = active?.name;
      const host = config.values.hostname ?? '';
      const truncatedHost = host.length > 40 ? host.slice(0, 37) + '...' : host;
      const display = name || truncatedHost || 'unnamed';
      const pinnedSuffix = configProvider.isProjectRootPinned() ? ' $(pinned)' : '';
      instanceStatusBar.text = `$(cloud) ${display}${pinnedSuffix}`;
      const tooltipLines = [`B2C Instance: ${name ?? 'unnamed'}`];
      if (host) tooltipLines.push(`Host: ${host}`);
      if (configProvider.isProjectRootPinned()) {
        tooltipLines.push(`Project root: ${getWorkingDirectory()} (pinned)`);
      }
      tooltipLines.push('Click to switch instance');
      instanceStatusBar.tooltip = tooltipLines.join('\n');
      instanceStatusBar.show();
    } else {
      const err = configProvider.getConfigError();
      if (err) {
        instanceStatusBar.text = '$(cloud) B2C: Not configured';
        instanceStatusBar.tooltip = err;
        instanceStatusBar.show();
      } else {
        instanceStatusBar.hide();
      }
    }
  };
  await updateInstanceStatusBar();
  configProvider.onDidReset(() => void updateInstanceStatusBar());

  const instanceConfigScheme = 'b2c-instance-config';
  const instanceConfigContents = new Map<string, string>();
  const instanceConfigOnDidChange = new vscode.EventEmitter<vscode.Uri>();
  const instanceConfigRegistration = vscode.workspace.registerTextDocumentContentProvider(instanceConfigScheme, {
    onDidChange: instanceConfigOnDidChange.event,
    provideTextDocumentContent(uri: vscode.Uri) {
      return instanceConfigContents.get(uri.toString()) ?? '';
    },
  });

  const inspectInstanceDisposable = registerSafeCommand('b2c-dx.instance.inspect', async () => {
    const config = configProvider.getConfig();
    if (!config) {
      vscode.window.showWarningMessage('B2C DX: No B2C Commerce configuration found.');
      return;
    }
    const safeValues: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(config.values)) {
      if (value === undefined) continue;
      // Redact secrets
      if (/secret|password|passphrase|apikey/i.test(key) && typeof value === 'string') {
        safeValues[key] = value.slice(0, 4) + '****';
      } else {
        safeValues[key] = value;
      }
    }
    const content = JSON.stringify(safeValues, null, 2);
    const host = config.values.hostname ?? 'instance';
    const uri = vscode.Uri.parse(`${instanceConfigScheme}:${host}.json`);
    instanceConfigContents.set(uri.toString(), content);
    instanceConfigOnDidChange.fire(uri);
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.languages.setTextDocumentLanguage(doc, 'json');
    await vscode.window.showTextDocument(doc, {preview: true});
  });

  const switchInstanceDisposable = registerSafeCommand('b2c-dx.instance.switch', async () => {
    const workingDirectory = getWorkingDirectory();
    const instances = await dwJsonSource.listInstances({workingDirectory});

    if (instances.length === 0) {
      vscode.window.showWarningMessage('No instances configured in dw.json.');
      return;
    }

    if (instances.length === 1) {
      // Only one instance — go straight to inspect
      await vscode.commands.executeCommand('b2c-dx.instance.inspect');
      return;
    }

    const items = instances.map((inst) => ({
      label: `${inst.active ? '$(check) ' : ''}${inst.name}`,
      description: inst.hostname ?? '',
      instance: inst,
    }));

    const picked = await vscode.window.showQuickPick(items, {
      title: 'Switch B2C Instance',
      placeHolder: 'Select an instance to activate',
    });
    if (!picked) return;

    if (picked.instance.active) {
      // Already active — just show config
      await vscode.commands.executeCommand('b2c-dx.instance.inspect');
      return;
    }

    try {
      await dwJsonSource.setActiveInstance(picked.instance.name, {workingDirectory});
      // The FileSystemWatcher will detect the dw.json change and trigger reset,
      // but fire manually in case the watcher is slow
      configProvider.reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`Failed to switch instance: ${message}`);
    }
  });

  const setProjectRootDisposable = registerSafeCommand('b2c-dx.setProjectRoot', async (uri?: vscode.Uri) => {
    if (!uri) return;
    const folderPath = uri.fsPath;
    await configProvider.setProjectRoot(folderPath);
    vscode.window.showInformationMessage(`B2C DX: Project root set to ${path.basename(folderPath)}`);
  });

  const resetProjectRootDisposable = registerSafeCommand('b2c-dx.resetProjectRoot', async () => {
    if (!configProvider.isProjectRootPinned()) {
      vscode.window.showInformationMessage('B2C DX: Project root is already using auto-detection.');
      return;
    }
    await configProvider.resetProjectRoot();
    vscode.window.showInformationMessage('B2C DX: Project root reset to auto-detect.');
  });

  const settings = vscode.workspace.getConfiguration('b2c-dx');

  if (settings.get<boolean>('features.webdavBrowser', true)) {
    registerWebDavTree(context, configProvider);
  }
  if (settings.get<boolean>('features.contentLibraries', true)) {
    registerContentTree(context, configProvider);
  }
  if (settings.get<boolean>('features.sandboxExplorer', true)) {
    registerSandboxTree(context, configProvider);
  }
  if (settings.get<boolean>('features.logTailing', true)) {
    registerLogs(context, configProvider);
  }
  if (settings.get<boolean>('features.scaffold', true)) {
    registerScaffold(context, configProvider, log);
  }
  if (settings.get<boolean>('features.apiBrowser', true)) {
    registerApiBrowser(context, configProvider, log);
  }
  if (settings.get<boolean>('features.cap', true)) {
    registerCap(context, configProvider, log);
  }
  if (settings.get<boolean>('features.codeSync', true)) {
    registerCodeSync(context, configProvider, cartridgeService, log);
  }
  if (settings.get<boolean>('features.scriptTypes', true)) {
    registerScriptTypes(context, cartridgeService, log);
  }

  registerDebugger(context, configProvider);

  // React to configuration changes
  const configChangeListener = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('b2c-dx.logLevel')) {
      applyLogLevel(log);
    }
  });

  context.subscriptions.push(
    promptAgentDisposable,
    listWebDavDisposable,
    instanceStatusBar,
    instanceConfigRegistration,
    inspectInstanceDisposable,
    switchInstanceDisposable,
    setProjectRootDisposable,
    resetProjectRootDisposable,
    configChangeListener,
  );
  log.appendLine('B2C DX extension activated.');
}
