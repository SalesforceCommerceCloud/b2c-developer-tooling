/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {DwJsonSource} from '@salesforce/b2c-tooling-sdk/config';
import {configureLogger} from '@salesforce/b2c-tooling-sdk/logging';

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import {B2CExtensionConfig} from './config-provider.js';
import {registerContentTree} from './content-tree/index.js';
import {registerLogs} from './logs/index.js';
import {initializePlugins} from './plugins.js';
import {registerSandboxTree} from './sandbox-tree/index.js';
import {registerScaffold} from './scaffold/index.js';
import {registerApiBrowser} from './api-browser/index.js';
import {registerDebugger} from './debugger/index.js';
import {registerWebDavTree} from './webdav-tree/index.js';

function getWebviewContent(context: vscode.ExtensionContext): string {
  const htmlPath = path.join(context.extensionPath, 'src', 'webview.html');
  return fs.readFileSync(htmlPath, 'utf-8');
}

/** PascalCase for use in template content (class names, types, etc.). e.g. "first page" → "FirstPage" */
function pageNameToPageId(pageName: string): string {
  return pageName
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/** camelCase for filename. e.g. "first page" → "firstPage" */
function pageNameToFileNameId(pageName: string): string {
  const pascal = pageNameToPageId(pageName || 'Page');
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

type RegionForm = {id: string; name: string; description: string; maxComponents: number};

type WebviewMessage =
  | {type: 'openExternal'}
  | {
      type: 'submitForm';
      pageType: {name?: string; description?: string; supportedAspectTypes?: string[]};
      regions: RegionForm[];
    };

function renderTemplate(
  template: string,
  pageName: string,
  pageDescription: string,
  supportedAspectTypes: string[],
  regions: RegionForm[],
): string {
  const pageId = pageNameToPageId(pageName || 'Page');
  const quoted = (s: string) => `'${String(s).replace(/'/g, "\\'")}'`;
  const aspectsStr = `[${supportedAspectTypes.map((a) => quoted(a)).join(', ')}]`;
  const regionsBlock = regions
    .map(
      (r) =>
        `{
        id: ${quoted(r.id)},
        name: ${quoted(r.name)},
        description: ${quoted(r.description)},
        maxComponents: ${r.maxComponents},
    }`,
    )
    .join(',\n    ');
  const firstRegionId = regions[0]?.id ?? '';

  return template
    .replace(/\$\{pageName\}/g, quoted(pageName || ''))
    .replace(/\$\{pageDescription\}/g, quoted(pageDescription || ''))
    .replace(/\$\{supportedAspectTypes\}/g, aspectsStr)
    .replace('__REGIONS__', regionsBlock)
    .replace(/\$\{pageId\}/g, pageId)
    .replace(/\$\{pageName\}Data/g, `${pageId}Data`)
    .replace(/\$\{regions\[0\]\.id\}/g, firstRegionId);
}

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

export async function activate(context: vscode.ExtensionContext) {
  const log = vscode.window.createOutputChannel('B2C DX');

  applyLogLevel(log);

  try {
    return await activateInner(context, log);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    log.appendLine(`Activation failed: ${message}`);
    if (stack) log.appendLine(stack);
    console.error('B2C DX extension activation failed:', err);
    vscode.window.showErrorMessage(`B2C DX: Extension failed to activate. See Output > B2C DX. Error: ${message}`);
    const showActivationError = () => {
      log.show();
      vscode.window.showErrorMessage(`B2C DX activation error: ${message}`);
    };
    context.subscriptions.push(
      vscode.commands.registerCommand('b2c-dx.openUI', showActivationError),
      vscode.commands.registerCommand('b2c-dx.promptAgent', showActivationError),
      vscode.commands.registerCommand('b2c-dx.listWebDav', showActivationError),
    );
  }
}

async function activateInner(context: vscode.ExtensionContext, log: vscode.OutputChannel) {
  // Initialize b2c-cli plugins before registering commands/views.
  // This ensures plugin config sources and middleware are available
  // before the first resolveConfig() call. Failures are non-fatal.
  await initializePlugins();

  const configProvider = new B2CExtensionConfig(log, context.workspaceState);
  context.subscriptions.push(configProvider);
  await configProvider.ensureResolved();

  const disposable = vscode.commands.registerCommand('b2c-dx.openUI', () => {
    vscode.window.showInformationMessage('B2C DX: Opening Page Designer Assistant.');

    const panel = vscode.window.createWebviewPanel(
      'b2c-dx-page-designer-ui',
      'My Extension UI',
      vscode.ViewColumn.One,
      {enableScripts: true},
    );

    panel.webview.html = getWebviewContent(context);

    panel.webview.onDidReceiveMessage(async (msg: WebviewMessage) => {
      if (msg.type === 'openExternal') {
        await vscode.env.openExternal(vscode.Uri.parse('https://example.com'));
      }
      if (msg.type === 'submitForm') {
        try {
          const {pageType, regions} = msg;
          const pageName = pageType?.name ?? '';
          const templatePath = path.join(context.extensionPath, 'src', 'template', '_app.pageId.tsx');
          const template = fs.readFileSync(templatePath, 'utf-8');
          const content = renderTemplate(
            template,
            pageName,
            pageType?.description ?? '',
            pageType?.supportedAspectTypes ?? [],
            regions ?? [],
          );

          const fileNameId = pageNameToFileNameId(pageName);
          const fileName = `_app.${fileNameId}.tsx`;

          let targetUri: vscode.Uri;
          if (vscode.workspace.workspaceFolders?.length) {
            const rootUri = vscode.Uri.file(configProvider.getWorkingDirectory());
            const routesUri = vscode.Uri.joinPath(rootUri, 'routes');
            const routesPath = routesUri.fsPath;
            const hasRoutesFolder = fs.existsSync(routesPath) && fs.statSync(routesPath).isDirectory();
            targetUri = hasRoutesFolder
              ? vscode.Uri.joinPath(routesUri, fileName)
              : vscode.Uri.joinPath(rootUri, fileName);
          } else {
            const picked = await vscode.window.showSaveDialog({
              defaultUri: vscode.Uri.joinPath(context.globalStorageUri, fileName),
              saveLabel: 'Create file',
            });
            if (!picked) {
              return;
            }
            targetUri = picked;
          }

          vscode.window.showInformationMessage(`Writing file to: ${targetUri.fsPath}`);

          await vscode.workspace.fs.writeFile(targetUri, Buffer.from(content, 'utf-8'));
          await vscode.window.showInformationMessage(`Saved to: ${targetUri.fsPath}`, 'Open');
          const doc = await vscode.workspace.openTextDocument(targetUri);
          await vscode.window.showTextDocument(doc, {
            viewColumn: panel.viewColumn ?? vscode.ViewColumn.One,
            preview: false,
            preserveFocus: false,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Failed to save: ${message}`);
        }
      }
    });
  });

  const promptAgentDisposable = vscode.commands.registerCommand('b2c-dx.promptAgent', async () => {
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

  const listWebDavDisposable = vscode.commands.registerCommand('b2c-dx.listWebDav', () => {
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

  const inspectInstanceDisposable = vscode.commands.registerCommand('b2c-dx.instance.inspect', async () => {
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

  const switchInstanceDisposable = vscode.commands.registerCommand('b2c-dx.instance.switch', async () => {
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

  const setProjectRootDisposable = vscode.commands.registerCommand(
    'b2c-dx.setProjectRoot',
    async (uri?: vscode.Uri) => {
      if (!uri) return;
      const folderPath = uri.fsPath;
      await configProvider.setProjectRoot(folderPath);
      vscode.window.showInformationMessage(`B2C DX: Project root set to ${path.basename(folderPath)}`);
    },
  );

  const resetProjectRootDisposable = vscode.commands.registerCommand('b2c-dx.resetProjectRoot', async () => {
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

  registerDebugger(context, configProvider);

  // React to configuration changes
  const configChangeListener = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('b2c-dx.logLevel')) {
      applyLogLevel(log);
    }
  });

  context.subscriptions.push(
    disposable,
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
