/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createSlasClient, getApiErrorMessage} from '@salesforce/b2c-tooling-sdk';
import {createOdsClient, createScapiSchemasClient, toOrganizationId} from '@salesforce/b2c-tooling-sdk/clients';
import {findDwJson, resolveConfig} from '@salesforce/b2c-tooling-sdk/config';
import {configureLogger} from '@salesforce/b2c-tooling-sdk/logging';
import {findAndDeployCartridges, getActiveCodeVersion} from '@salesforce/b2c-tooling-sdk/operations/code';
import {getPathKeys, type OpenApiSchemaInput} from '@salesforce/b2c-tooling-sdk/schemas';
import {randomUUID} from 'node:crypto';
import {exec} from 'child_process';
import {promisify} from 'util';

const execAsync = promisify(exec);

/** Standard B2C Commerce WebDAV root directories. */
const WEBDAV_ROOTS: Record<string, string> = {
  IMPEX: 'Impex',
  TEMP: 'Temp',
  CARTRIDGES: 'Cartridges',
  REALMDATA: 'Realmdata',
  CATALOGS: 'Catalogs',
  LIBRARIES: 'Libraries',
  STATIC: 'Static',
  LOGS: 'Logs',
  SECURITYLOGS: 'Securitylogs',
};
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Recursively finds all files under dir whose names end with .json (metadata files).
 * Returns paths relative to dir.
 */
function findJsonFilesUnder(dir: string, baseDir: string = dir): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return results;
  }
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(baseDir, full);
    if (fs.statSync(full).isDirectory()) {
      results.push(...findJsonFilesUnder(full, baseDir));
    } else if (name.endsWith('.json')) {
      results.push(rel);
    }
  }
  return results.sort();
}

function getWebviewContent(context: vscode.ExtensionContext): string {
  const htmlPath = path.join(context.extensionPath, 'src', 'webview.html');
  return fs.readFileSync(htmlPath, 'utf-8');
}

function getStorefrontNextCartridgeWebviewContent(context: vscode.ExtensionContext): string {
  const htmlPath = path.join(context.extensionPath, 'src', 'storefront-next-cartridge.html');
  return fs.readFileSync(htmlPath, 'utf-8');
}

function getScapiExplorerWebviewContent(
  context: vscode.ExtensionContext,
  prefill?: {tenantId: string; channelId: string; shortCode?: string},
): string {
  const htmlPath = path.join(context.extensionPath, 'src', 'scapi-explorer.html');
  let html = fs.readFileSync(htmlPath, 'utf-8');
  const prefillJson = prefill ? JSON.stringify(prefill) : 'null';
  html = html.replace('__SCAPI_PREFILL__', prefillJson);
  return html;
}

function getOdsManagementWebviewContent(context: vscode.ExtensionContext, prefill?: {defaultRealm: string}): string {
  const htmlPath = path.join(context.extensionPath, 'src', 'ods-management.html');
  let html = fs.readFileSync(htmlPath, 'utf-8');
  const defaultRealm = prefill?.defaultRealm ?? '';
  html = html.replaceAll('__ODS_DEFAULT_REALM__', defaultRealm);
  return html;
}

const WEBDAV_ROOT_LABELS: Record<string, string> = {
  impex: 'Impex directory (default)',
  temp: 'Temporary files',
  cartridges: 'Code cartridges',
  realmdata: 'Realm data',
  catalogs: 'Product catalogs',
  libraries: 'Content libraries',
  static: 'Static resources',
  logs: 'Log files',
  securitylogs: 'Security log files',
};

function getWebdavWebviewContent(
  context: vscode.ExtensionContext,
  roots: {key: string; path: string; label: string}[],
): string {
  const htmlPath = path.join(context.extensionPath, 'src', 'webdav.html');
  const raw = fs.readFileSync(htmlPath, 'utf-8');
  const rootsJson = JSON.stringify(roots);
  return raw.replace(
    'const roots = window.WEBDAV_ROOTS || [];',
    `window.WEBDAV_ROOTS = ${rootsJson};\n      const roots = window.WEBDAV_ROOTS;`,
  );
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

export function activate(context: vscode.ExtensionContext) {
  const log = vscode.window.createOutputChannel('B2C DX');

  try {
    configureLogger({
      level: 'trace',
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

  try {
    return activateInner(context, log);
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
      vscode.commands.registerCommand('b2c-dx.handleStorefrontNextCartridge', showActivationError),
      vscode.commands.registerCommand('b2c-dx.promptAgent', showActivationError),
      vscode.commands.registerCommand('b2c-dx.listWebDav', showActivationError),
      vscode.commands.registerCommand('b2c-dx.scapiExplorer', showActivationError),
      vscode.commands.registerCommand('b2c-dx.odsManagement', showActivationError),
    );
  }
}

function activateInner(context: vscode.ExtensionContext, log: vscode.OutputChannel) {
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
            const rootUri = vscode.workspace.workspaceFolders[0].uri;
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

  type WebDavPropfindEntry = {href: string; displayName?: string; contentLength?: number; isCollection?: boolean};

  const listWebDavDisposable = vscode.commands.registerCommand('b2c-dx.listWebDav', async () => {
    let projectDirectory = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
    if (!projectDirectory || projectDirectory === '/' || !fs.existsSync(projectDirectory)) {
      projectDirectory = context.extensionPath;
    }
    const dwPath = findDwJson(projectDirectory);
    const config = dwPath ? resolveConfig({}, {configPath: dwPath}) : resolveConfig({}, {projectDirectory});

    if (!config.hasB2CInstanceConfig()) {
      vscode.window.showErrorMessage(
        'B2C DX: No instance config. Configure SFCC_* env vars or dw.json in the workspace.',
      );
      return;
    }

    const roots = (Object.keys(WEBDAV_ROOTS) as string[]).map((key) => {
      const pathVal = (WEBDAV_ROOTS as Record<string, string>)[key];
      const keyLower = key.toLowerCase();
      return {
        key: keyLower,
        path: pathVal,
        label: WEBDAV_ROOT_LABELS[keyLower] ?? pathVal,
      };
    });

    const panel = vscode.window.createWebviewPanel('b2c-dx-webdav', 'B2C WebDAV Browser', vscode.ViewColumn.One, {
      enableScripts: true,
    });
    panel.webview.html = getWebdavWebviewContent(context, roots);

    const instance = config.createB2CInstance() as {
      webdav: {
        propfind: (path: string, depth: '1') => Promise<WebDavPropfindEntry[]>;
        mkcol: (path: string) => Promise<void>;
        delete: (path: string) => Promise<void>;
        put: (path: string, content: Buffer | Blob | string, contentType?: string) => Promise<void>;
        get: (path: string) => Promise<ArrayBuffer>;
      };
    };

    const getDisplayName = (e: WebDavPropfindEntry): string =>
      e.displayName ?? e.href.split('/').filter(Boolean).at(-1) ?? e.href;

    panel.webview.onDidReceiveMessage(
      async (msg: {type: string; path?: string; name?: string; isCollection?: boolean}) => {
        if (msg.type === 'listPath' && msg.path !== undefined) {
          const listPath = msg.path as string;
          try {
            const entries = await instance.webdav.propfind(listPath, '1');
            const normalizedPath = listPath.replace(/\/$/, '');
            const filtered = entries.filter((entry: WebDavPropfindEntry) => {
              const entryPath = decodeURIComponent(entry.href);
              return !entryPath.endsWith(`/${normalizedPath}`) && !entryPath.endsWith(`/${normalizedPath}/`);
            });
            panel.webview.postMessage({
              type: 'listResult',
              path: listPath,
              entries: filtered.map((e: WebDavPropfindEntry) => ({
                name: getDisplayName(e),
                isCollection: Boolean(e.isCollection),
                contentLength: e.contentLength,
              })),
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            panel.webview.postMessage({
              type: 'listResult',
              path: listPath,
              entries: [],
              error: message,
            });
          }
          return;
        }
        if (msg.type === 'requestMkdir' && msg.path !== undefined) {
          const parentPath = msg.path as string;
          const name = await vscode.window.showInputBox({
            title: 'New folder',
            prompt: parentPath ? `Create directory under ${parentPath}` : 'Create directory at root',
            placeHolder: 'Folder name',
            validateInput: (value: string) => {
              const trimmed = value.trim();
              if (!trimmed) return 'Enter a folder name';
              if (/[\\/:*?"<>|]/.test(trimmed)) return 'Name cannot contain \\ / : * ? " < > |';
              return null;
            },
          });
          if (name === undefined) return;
          const trimmed = name.trim();
          if (!trimmed) return;
          const fullPath = parentPath ? `${parentPath}/${trimmed}` : trimmed;
          try {
            await instance.webdav.mkcol(fullPath);
            panel.webview.postMessage({type: 'mkdirResult', success: true, path: fullPath});
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            panel.webview.postMessage({type: 'mkdirResult', success: false, error: message});
          }
          return;
        }
        if (msg.type === 'requestDelete' && msg.path !== undefined) {
          const pathToDelete = msg.path as string;
          const name = msg.name ?? pathToDelete.split('/').pop() ?? pathToDelete;
          const isDir = msg.isCollection === true;
          const detail = isDir ? 'This directory and its contents will be deleted.' : 'This file will be deleted.';
          const choice = await vscode.window.showWarningMessage(
            `Delete "${name}"? ${detail}`,
            {modal: true},
            'Delete',
            'Cancel',
          );
          if (choice !== 'Delete') return;
          try {
            await instance.webdav.delete(pathToDelete);
            panel.webview.postMessage({type: 'deleteResult', success: true});
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            panel.webview.postMessage({type: 'deleteResult', success: false, error: message});
          }
          return;
        }
        if (msg.type === 'requestUpload' && msg.path !== undefined) {
          const destPath = msg.path as string;
          const uris = await vscode.window.showOpenDialog({
            title: 'Select file to upload',
            canSelectFiles: true,
            canSelectMany: false,
            canSelectFolders: false,
          });
          if (!uris?.length) return;
          const uri = uris[0];
          const fileName = path.basename(uri.fsPath);
          const fullPath = destPath ? `${destPath}/${fileName}` : fileName;
          try {
            const content = fs.readFileSync(uri.fsPath);
            const ext = path.extname(fileName).toLowerCase();
            const mime: Record<string, string> = {
              '.json': 'application/json',
              '.xml': 'application/xml',
              '.zip': 'application/zip',
              '.js': 'application/javascript',
              '.ts': 'application/typescript',
              '.html': 'text/html',
              '.css': 'text/css',
              '.txt': 'text/plain',
            };
            const contentType = mime[ext];
            await instance.webdav.put(fullPath, content, contentType);
            panel.webview.postMessage({type: 'uploadResult', success: true, path: fullPath});
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            panel.webview.postMessage({type: 'uploadResult', success: false, error: message});
          }
          return;
        }
        if (msg.type === 'requestFileContent' && msg.path !== undefined) {
          const filePath = msg.path as string;
          const fileName = msg.name ?? filePath.split('/').pop() ?? filePath;
          const ext = path.extname(fileName).toLowerCase();
          const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.svg']);
          const textExtensions = new Set([
            '.json',
            '.js',
            '.ts',
            '.mjs',
            '.cjs',
            '.html',
            '.htm',
            '.css',
            '.xml',
            '.txt',
            '.md',
            '.log',
            '.yml',
            '.yaml',
            '.env',
            '.sh',
            '.bat',
            '.csv',
            '.isml',
          ]);
          const isImage = imageExtensions.has(ext);
          const isText = textExtensions.has(ext) || ext === '';
          try {
            const buffer = await instance.webdav.get(filePath);
            const arr = new Uint8Array(buffer);
            if (isImage) {
              const base64 = Buffer.from(arr).toString('base64');
              const mime: Record<string, string> = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
                '.svg': 'image/svg+xml',
              };
              const contentType = mime[ext] ?? 'application/octet-stream';
              panel.webview.postMessage({
                type: 'fileContent',
                path: filePath,
                name: fileName,
                kind: 'image',
                contentType,
                base64,
              });
            } else if (isText) {
              const text = new TextDecoder('utf-8', {fatal: false}).decode(arr);
              panel.webview.postMessage({
                type: 'fileContent',
                path: filePath,
                name: fileName,
                kind: 'text',
                text,
              });
            } else {
              panel.webview.postMessage({
                type: 'fileContent',
                path: filePath,
                name: fileName,
                kind: 'binary',
                error: 'Binary file cannot be previewed.',
              });
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            panel.webview.postMessage({
              type: 'fileContent',
              path: filePath,
              name: fileName,
              kind: 'error',
              error: message,
            });
          }
        }
      },
    );
  });

  function resolveStorefrontNextProjectDir(): string | undefined {
    const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!folder) return undefined;
    const sub = path.join(folder, 'storefront-next', 'packages', 'template-retail-rsc-app');
    if (fs.existsSync(sub) && fs.statSync(sub).isDirectory()) {
      return sub;
    }
    return folder;
  }

  function _resolveCliScript(context: vscode.ExtensionContext): {node: string; script: string} | null {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceRoot) {
      const distCli = path.join(workspaceRoot, 'dist', 'cli.js');
      if (fs.existsSync(distCli)) {
        return {node: 'node', script: distCli};
      }
    }
    const monorepoRoot = path.join(context.extensionPath, '..', '..');
    const b2cCliRun = path.join(monorepoRoot, 'packages', 'b2c-cli', 'bin', 'run.js');
    if (fs.existsSync(b2cCliRun)) {
      return {node: 'node', script: b2cCliRun};
    }
    return null;
  }

  const scapiExplorerDisposable = vscode.commands.registerCommand('b2c-dx.scapiExplorer', () => {
    const panel = vscode.window.createWebviewPanel(
      'b2c-dx-scapi-explorer',
      'SCAPI API Explorer',
      vscode.ViewColumn.One,
      {enableScripts: true},
    );
    let prefill: {tenantId: string; channelId: string; shortCode?: string} | undefined;
    try {
      const projectDirectory = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? context.extensionPath;
      const dwPath = findDwJson(projectDirectory);
      const config = dwPath ? resolveConfig({}, {configPath: dwPath}) : resolveConfig({}, {projectDirectory});
      const hostname = config.values.hostname;
      const shortCode = config.values.shortCode;
      const firstPart = hostname && typeof hostname === 'string' ? (hostname.split('.')[0] ?? '') : '';
      const tenantId = firstPart ? firstPart.replace(/-/g, '_') : '';
      if (tenantId || shortCode) {
        prefill = {
          tenantId: tenantId || '',
          channelId: 'RefArch',
          shortCode: typeof shortCode === 'string' ? shortCode : undefined,
        };
      }
    } catch {
      // Prefill is optional; leave undefined if config fails
    }
    panel.webview.html = getScapiExplorerWebviewContent(context, prefill);
    panel.webview.onDidReceiveMessage(
      async (msg: {
        type: string;
        tenantId?: string;
        channelId?: string;
        clientId?: string;
        clientSecret?: string;
        token?: string;
        apiFamily?: string;
        apiName?: string;
        apiPath?: string;
        query?: string;
        curlText?: string;
      }) => {
        const getConfig = () => {
          const projectDirectory = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? context.extensionPath;
          const dwPath = findDwJson(projectDirectory);
          return dwPath ? resolveConfig({}, {configPath: dwPath}) : resolveConfig({}, {projectDirectory});
        };

        if (msg.type === 'scapiFetchSchemas') {
          const tenantId = (msg.tenantId ?? '').trim();
          if (!tenantId) {
            panel.webview.postMessage({
              type: 'scapiSchemasListResult',
              success: false,
              error: 'Tenant Id is required to load schemas.',
            });
            return;
          }
          try {
            const config = getConfig();
            const shortCode = config.values.shortCode;
            if (!shortCode) {
              panel.webview.postMessage({
                type: 'scapiSchemasListResult',
                success: false,
                error: 'Short code not found. Set short-code in dw.json or SFCC_SHORTCODE.',
              });
              return;
            }
            if (!config.hasOAuthConfig()) {
              panel.webview.postMessage({
                type: 'scapiSchemasListResult',
                success: false,
                error: 'OAuth credentials required. Set clientId and clientSecret in dw.json.',
              });
              return;
            }
            const oauthStrategy = config.createOAuth();
            const schemasClient = createScapiSchemasClient({shortCode, tenantId}, oauthStrategy);
            const orgId = toOrganizationId(tenantId);
            const {data, error, response} = await schemasClient.GET('/organizations/{organizationId}/schemas', {
              params: {path: {organizationId: orgId}},
            });
            if (error) {
              panel.webview.postMessage({
                type: 'scapiSchemasListResult',
                success: false,
                error: getApiErrorMessage(error, response),
              });
              return;
            }
            const schemas = data?.data ?? [];
            const apiFamilies = Array.from(
              new Set(schemas.map((s: {apiFamily?: string}) => s.apiFamily).filter(Boolean)),
            ) as string[];
            apiFamilies.sort();
            panel.webview.postMessage({
              type: 'scapiSchemasListResult',
              success: true,
              schemas,
              apiFamilies,
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            panel.webview.postMessage({
              type: 'scapiSchemasListResult',
              success: false,
              error: message,
            });
          }
          return;
        }

        if (msg.type === 'scapiFetchSchemaPaths') {
          const tenantId = (msg.tenantId ?? '').trim();
          const apiFamily = (msg.apiFamily ?? '').trim();
          const apiName = (msg.apiName ?? '').trim();
          log.appendLine(`[SCAPI] Fetch schema paths: tenantId=${tenantId} apiFamily=${apiFamily} apiName=${apiName}`);
          if (!tenantId || !apiFamily || !apiName) {
            log.appendLine('[SCAPI] Fetch paths failed: Tenant Id, API Family, and API Name are required.');
            panel.webview.postMessage({
              type: 'scapiSchemaPathsResult',
              success: false,
              error: 'Tenant Id, API Family, and API Name are required.',
            });
            return;
          }
          try {
            const config = getConfig();
            const shortCode = config.values.shortCode;
            if (!shortCode) {
              log.appendLine('[SCAPI] Fetch paths failed: Short code not found.');
              panel.webview.postMessage({
                type: 'scapiSchemaPathsResult',
                success: false,
                error: 'Short code not found.',
              });
              return;
            }
            if (!config.hasOAuthConfig()) {
              log.appendLine('[SCAPI] Fetch paths failed: OAuth credentials required.');
              panel.webview.postMessage({
                type: 'scapiSchemaPathsResult',
                success: false,
                error: 'OAuth credentials required.',
              });
              return;
            }
            const oauthStrategy = config.createOAuth();
            const schemasClient = createScapiSchemasClient({shortCode, tenantId}, oauthStrategy);
            const orgId = toOrganizationId(tenantId);
            const apiVersion = 'v1';
            log.appendLine(`[SCAPI] GET schema: orgId=${orgId} ${apiFamily}/${apiName}/${apiVersion}`);
            const {data, error, response} = await schemasClient.GET(
              '/organizations/{organizationId}/schemas/{apiFamily}/{apiName}/{apiVersion}',
              {params: {path: {organizationId: orgId, apiFamily, apiName, apiVersion}}},
            );
            if (error) {
              const errMsg = getApiErrorMessage(error, response);
              log.appendLine(`[SCAPI] Fetch paths error: ${errMsg}`);
              log.appendLine(`[SCAPI] Error detail: ${JSON.stringify({error, status: response?.status})}`);
              panel.webview.postMessage({
                type: 'scapiSchemaPathsResult',
                success: false,
                error: errMsg,
              });
              return;
            }
            const pathKeys = data && typeof data === 'object' ? getPathKeys(data as OpenApiSchemaInput) : [];
            log.appendLine(
              `[SCAPI] Schema response: hasData=${Boolean(data)} pathKeysCount=${pathKeys.length} pathKeys=${JSON.stringify(pathKeys.slice(0, 5))}${pathKeys.length > 5 ? '...' : ''}`,
            );
            const orgPathPrefix = 'organizations/{organizationId}';
            const paths = pathKeys
              .map((p) => {
                if (typeof p !== 'string') return '';
                const withoutLeadingSlash = p.replace(/^\//, '');
                const suffix = withoutLeadingSlash.startsWith(orgPathPrefix + '/')
                  ? withoutLeadingSlash.slice(orgPathPrefix.length + 1)
                  : withoutLeadingSlash === orgPathPrefix
                    ? ''
                    : withoutLeadingSlash;
                return suffix;
              })
              .filter(Boolean)
              .sort();
            log.appendLine(
              `[SCAPI] Normalized paths (${paths.length}): ${JSON.stringify(paths.slice(0, 10))}${paths.length > 10 ? '...' : ''}`,
            );
            const schemaInfo =
              data && typeof data === 'object' && 'info' in data
                ? (data as {info?: Record<string, unknown>}).info
                : undefined;
            const apiTypeRaw = schemaInfo?.['x-api-type'] ?? schemaInfo?.['x-apiType'] ?? schemaInfo?.['x_api_type'];
            const apiType = typeof apiTypeRaw === 'string' ? apiTypeRaw : undefined;
            if (schemaInfo && !apiType) {
              log.appendLine(`[SCAPI] Schema info keys (no x-api-type): ${Object.keys(schemaInfo).join(', ')}`);
            } else if (apiType) {
              log.appendLine(`[SCAPI] API type: ${apiType}`);
            }
            panel.webview.postMessage({
              type: 'scapiSchemaPathsResult',
              success: true,
              paths,
              apiType: apiType ?? null,
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const stack = err instanceof Error ? err.stack : '';
            log.appendLine(`[SCAPI] Fetch paths exception: ${message}`);
            if (stack) log.appendLine(`[SCAPI] Stack: ${stack}`);
            panel.webview.postMessage({
              type: 'scapiSchemaPathsResult',
              success: false,
              error: message,
            });
          }
          return;
        }

        if (msg.type === 'scapiExecuteCurl') {
          const curlText = (msg.curlText ?? '').trim();
          const urlMatch = curlText.match(/"https:\/\/[^"]+"/);
          const url = urlMatch ? urlMatch[0].slice(1, -1) : '';
          const bearerMatch = curlText.match(/Authorization:\s*Bearer\s+([^"\\\s]+)/);
          const token = bearerMatch ? bearerMatch[1].trim() : '';
          if (!url) {
            panel.webview.postMessage({
              type: 'scapiExecuteApiResult',
              success: false,
              error: 'Could not parse URL from curl command. Expected a quoted https:// URL.',
            });
            return;
          }
          if (!token) {
            panel.webview.postMessage({
              type: 'scapiExecuteApiResult',
              success: false,
              error: 'Could not parse Authorization: Bearer token from curl command.',
            });
            return;
          }
          try {
            const res = await fetch(url, {
              method: 'GET',
              headers: {Authorization: `Bearer ${token}`},
            });
            const text = await res.text();
            if (!res.ok) {
              panel.webview.postMessage({
                type: 'scapiExecuteApiResult',
                success: false,
                error: `HTTP ${res.status}: ${text || res.statusText}`,
              });
              return;
            }
            let body: string | object = text;
            try {
              body = JSON.parse(text);
            } catch {
              // leave as string
            }
            panel.webview.postMessage({
              type: 'scapiExecuteApiResult',
              success: true,
              body,
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            panel.webview.postMessage({
              type: 'scapiExecuteApiResult',
              success: false,
              error: message,
            });
          }
          return;
        }

        if (msg.type === 'scapiExecuteShopApi') {
          const token = (msg.token ?? '').trim();
          const tenantId = (msg.tenantId ?? '').trim();
          const channelId = (msg.channelId ?? '').trim();
          const apiFamily = (msg.apiFamily ?? '').trim();
          const apiName = (msg.apiName ?? '').trim();
          const apiPath = (msg.apiPath ?? '').trim();
          const query = (msg.query ?? '').trim();
          if (!token) {
            panel.webview.postMessage({
              type: 'scapiExecuteApiResult',
              success: false,
              error: 'Bearer token is required. Generate a token first.',
            });
            return;
          }
          if (!tenantId || !channelId || !apiFamily || !apiName) {
            panel.webview.postMessage({
              type: 'scapiExecuteApiResult',
              success: false,
              error: 'Tenant Id, Channel Id, API Family, and API Name are required.',
            });
            return;
          }
          try {
            const config = getConfig();
            const shortCode = config.values.shortCode;
            if (!shortCode) {
              panel.webview.postMessage({
                type: 'scapiExecuteApiResult',
                success: false,
                error: 'Short code not found. Set short-code in dw.json or SFCC_SHORTCODE.',
              });
              return;
            }
            const orgId = toOrganizationId(tenantId);
            const pathPart = apiPath ? `/${apiPath.replace(/^\//, '')}` : '';
            const url = `https://${shortCode}.api.commercecloud.salesforce.com/${apiFamily}/${apiName}/v1/organizations/${orgId}${pathPart}?siteId=${encodeURIComponent(channelId)}${query ? `&q=${encodeURIComponent(query)}` : ''}`;
            const res = await fetch(url, {
              method: 'GET',
              headers: {Authorization: `Bearer ${token}`},
            });
            const text = await res.text();
            if (!res.ok) {
              panel.webview.postMessage({
                type: 'scapiExecuteApiResult',
                success: false,
                error: `HTTP ${res.status}: ${text || res.statusText}`,
              });
              return;
            }
            let body: string | object = text;
            try {
              body = JSON.parse(text);
            } catch {
              // leave as string
            }
            panel.webview.postMessage({
              type: 'scapiExecuteApiResult',
              success: true,
              body,
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            panel.webview.postMessage({
              type: 'scapiExecuteApiResult',
              success: false,
              error: message,
            });
          }
          return;
        }

        if (msg.type === 'scapiGenerateBearerToken') {
          const clientId = (msg.clientId ?? '').trim();
          const clientSecret = (msg.clientSecret ?? '').trim();
          const tenantId = (msg.tenantId ?? '').trim();
          const channelId = (msg.channelId ?? '').trim();
          if (!clientId || !clientSecret || !tenantId || !channelId) {
            panel.webview.postMessage({
              type: 'scapiGenerateBearerTokenResult',
              success: false,
              error: 'SLAS Client Id, Client Secret, Tenant Id, and Channel Id are required.',
            });
            return;
          }
          const config = getConfig();
          const shortCode = config.values.shortCode;
          if (!shortCode) {
            panel.webview.postMessage({
              type: 'scapiGenerateBearerTokenResult',
              success: false,
              error:
                'Short code not found. Set short-code or scapi-shortcode in dw.json, or SFCC_SHORTCODE in the environment.',
            });
            return;
          }
          const orgId = toOrganizationId(tenantId);
          const tokenUrl = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/token`;
          const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
          try {
            const res = await fetch(tokenUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${basicAuth}`,
              },
              body: `grant_type=client_credentials&channel_id=${encodeURIComponent(channelId)}`,
            });
            const data = (await res.json()) as {access_token?: string; error?: string; error_description?: string};
            if (!res.ok) {
              const errMsg = data.error_description ?? data.error ?? res.statusText ?? String(res.status);
              panel.webview.postMessage({
                type: 'scapiGenerateBearerTokenResult',
                success: false,
                error: errMsg,
              });
              return;
            }
            const token = data.access_token;
            if (!token) {
              panel.webview.postMessage({
                type: 'scapiGenerateBearerTokenResult',
                success: false,
                error: 'No access_token in response.',
              });
              return;
            }
            panel.webview.postMessage({
              type: 'scapiGenerateBearerTokenResult',
              success: true,
              token,
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            panel.webview.postMessage({
              type: 'scapiGenerateBearerTokenResult',
              success: false,
              error: message,
            });
          }
          return;
        }
        if (msg.type !== 'scapiCreateSlasClient') return;
        const tenantId = (msg.tenantId ?? '').trim();
        const channelId = (msg.channelId ?? '').trim();
        if (!tenantId || !channelId) {
          vscode.window.showErrorMessage('B2C DX: Tenant Id and Channel Id are required to create a SLAS client.');
          return;
        }
        const projectDirectory = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? context.extensionPath;
        const dwPath = findDwJson(projectDirectory);
        const config = dwPath ? resolveConfig({}, {configPath: dwPath}) : resolveConfig({}, {projectDirectory});
        const shortCode = config.values.shortCode;
        if (!shortCode) {
          vscode.window.showErrorMessage(
            'B2C DX: SCAPI short code required. Set short-code or scapi-shortcode in dw.json, or SFCC_SHORTCODE in the environment.',
          );
          return;
        }
        if (!config.hasOAuthConfig()) {
          vscode.window.showErrorMessage(
            'B2C DX: OAuth credentials required for SLAS. Set clientId and clientSecret in dw.json or SFCC_CLIENT_ID / SFCC_CLIENT_SECRET.',
          );
          return;
        }
        try {
          const oauthStrategy = config.createOAuth();
          const slasClient = createSlasClient({shortCode}, oauthStrategy);
          const {error: getErr, response: getResp} = await slasClient.GET('/tenants/{tenantId}', {
            params: {path: {tenantId}},
          });
          if (getErr) {
            const isNotFound =
              getResp.status === 404 ||
              (getResp.status === 400 &&
                typeof getErr === 'object' &&
                getErr !== null &&
                'exception_name' in getErr &&
                (getErr as {exception_name?: string}).exception_name === 'TenantNotFoundException');
            if (isNotFound) {
              await slasClient.PUT('/tenants/{tenantId}', {
                params: {path: {tenantId}},
                body: {
                  tenantId,
                  merchantName: 'B2C DX Tenant',
                  description: 'Created from SCAPI API Explorer',
                  contact: 'B2C DX',
                  emailAddress: 'noreply@example.com',
                  phoneNo: '+1 000-000-0000',
                },
              });
            } else {
              const message = getApiErrorMessage(getErr, getResp);
              vscode.window.showErrorMessage(`B2C DX: Failed to check tenant: ${message}`);
              return;
            }
          }
          const clientId = randomUUID().toLowerCase();
          const clientSecret = `sk_${randomUUID().replaceAll('-', '')}`;
          const defaultScopes = [
            'sfcc.shopper-baskets-orders.rw',
            'sfcc.shopper-categories',
            'sfcc.shopper-customers.login',
            'sfcc.shopper-customers.register',
            'sfcc.shopper-discovery-search',
            'sfcc.shopper-experience',
            'sfcc.shopper-gift-certificates',
            'sfcc.shopper-myaccount.addresses.rw',
            'sfcc.shopper-myaccount.baskets',
            'sfcc.shopper-myaccount.orders',
            'sfcc.shopper-myaccount.paymentinstruments.rw',
            'sfcc.shopper-myaccount.productlists.rw',
            'sfcc.shopper-myaccount.rw',
            'sfcc.shopper-promotions',
            'sfcc.shopper-product-search',
            'sfcc.shopper-productlists',
            'sfcc.shopper-products',
            'sfcc.shopper-stores',
          ];
          const {error, response} = await slasClient.PUT('/tenants/{tenantId}/clients/{clientId}', {
            params: {path: {tenantId, clientId}},
            body: {
              clientId,
              name: `b2c-dx client ${new Date().toISOString().slice(0, 19)}`,
              channels: [channelId],
              scopes: defaultScopes,
              redirectUri: ['http://localhost:3000/callback'],
              callbackUri: [],
              secret: clientSecret,
              isPrivateClient: true,
            },
          });
          if (error) {
            vscode.window.showErrorMessage(`B2C DX: Create SLAS client failed. ${getApiErrorMessage(error, response)}`);
            return;
          }
          vscode.window.showInformationMessage('B2C DX: SLAS client created. See Explorer for Client ID and Secret.');
          panel.webview.postMessage({
            type: 'scapiCreateSlasClientResult',
            success: true,
            clientId,
            secret: clientSecret,
            scopes: defaultScopes,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`B2C DX: Create SLAS client failed. ${message}`);
          panel.webview.postMessage({type: 'scapiCreateSlasClientResult', success: false, error: message});
        }
      },
    );
  });

  const DEFAULT_ODS_HOST = 'admin.dx.commercecloud.salesforce.com';

  const odsManagementDisposable = vscode.commands.registerCommand('b2c-dx.odsManagement', async () => {
    const panel = vscode.window.createWebviewPanel(
      'b2c-dx-ods-management',
      'On Demand Sandbox (ODS) Management',
      vscode.ViewColumn.One,
      {enableScripts: true},
    );
    let defaultRealm = '';
    try {
      const projectDirectory = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? context.extensionPath;
      const dwPath = findDwJson(projectDirectory);
      const config = dwPath ? resolveConfig({}, {configPath: dwPath}) : resolveConfig({}, {projectDirectory});
      // First part of hostname, e.g. 'zyoc' from 'zyoc-003.unified.demandware.net'
      const hostname = config.values.hostname;
      const firstSegment = (hostname && typeof hostname === 'string' ? hostname : '').split('.')[0] ?? '';
      defaultRealm = firstSegment.split('-')[0] ?? '';
    } catch {
      // leave defaultRealm empty
    }
    panel.webview.html = getOdsManagementWebviewContent(context, {defaultRealm});

    async function getOdsConfig() {
      const projectDirectory = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? context.extensionPath;
      const dwPath = findDwJson(projectDirectory);
      return dwPath ? resolveConfig({}, {configPath: dwPath}) : resolveConfig({}, {projectDirectory});
    }

    async function fetchSandboxList(): Promise<{sandboxes: unknown[]; error?: string}> {
      try {
        const config = await getOdsConfig();
        if (!config.hasOAuthConfig()) {
          return {sandboxes: [], error: 'OAuth credentials required. Set clientId and clientSecret in dw.json.'};
        }
        const host = config.values.sandboxApiHost ?? DEFAULT_ODS_HOST;
        const authStrategy = config.createOAuth();
        const odsClient = createOdsClient({host}, authStrategy);
        const result = await odsClient.GET('/sandboxes', {
          params: {query: {include_deleted: false}},
        });
        if (result.error) {
          return {
            sandboxes: [],
            error: getApiErrorMessage(result.error, result.response),
          };
        }
        const sandboxes = result.data?.data ?? [];
        return {sandboxes: sandboxes as unknown[]};
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {sandboxes: [], error: message};
      }
    }

    panel.webview.onDidReceiveMessage(
      async (msg: {type: string; sandboxId?: string; realm?: string; ttl?: number; url?: string}) => {
        if (msg.type === 'odsListRequest') {
          const {sandboxes, error} = await fetchSandboxList();
          panel.webview.postMessage({type: 'odsListResult', sandboxes, error});
          return;
        }
        if (msg.type === 'odsGetDefaultRealm') {
          let defaultRealm = '';
          try {
            const config = await getOdsConfig();
            const hostname = config.values.hostname;
            const firstSegment = (hostname && typeof hostname === 'string' ? hostname : '').split('.')[0] ?? '';
            defaultRealm = firstSegment.split('-')[0] ?? '';
          } catch {
            // leave defaultRealm empty
          }
          panel.webview.postMessage({type: 'odsDefaultRealm', defaultRealm});
          return;
        }
        if (msg.type === 'odsSandboxClick' && msg.sandboxId) {
          try {
            const config = await getOdsConfig();
            if (!config.hasOAuthConfig()) {
              panel.webview.postMessage({
                type: 'odsSandboxDetailsError',
                error: 'OAuth credentials required. Set clientId and clientSecret in dw.json.',
              });
              return;
            }
            const host = config.values.sandboxApiHost ?? DEFAULT_ODS_HOST;
            const authStrategy = config.createOAuth();
            const odsClient = createOdsClient({host}, authStrategy);
            const result = await odsClient.GET('/sandboxes/{sandboxId}', {
              params: {path: {sandboxId: msg.sandboxId}},
            });
            if (result.error || !result.data?.data) {
              panel.webview.postMessage({
                type: 'odsSandboxDetailsError',
                error: getApiErrorMessage(result.error, result.response) || 'Sandbox not found',
              });
              return;
            }
            panel.webview.postMessage({
              type: 'odsSandboxDetails',
              sandbox: result.data.data,
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            panel.webview.postMessage({type: 'odsSandboxDetailsError', error: message});
          }
          return;
        }
        if (msg.type === 'odsOpenLink' && msg.url) {
          try {
            await vscode.env.openExternal(vscode.Uri.parse(msg.url));
          } catch {
            // ignore
          }
          return;
        }
        if (msg.type === 'odsDeleteClick' && msg.sandboxId) {
          try {
            const config = await getOdsConfig();
            if (!config.hasOAuthConfig()) {
              vscode.window.showErrorMessage('B2C DX: OAuth credentials required for ODS. Configure dw.json.');
              return;
            }
            const host = config.values.sandboxApiHost ?? DEFAULT_ODS_HOST;
            const authStrategy = config.createOAuth();
            const odsClient = createOdsClient({host}, authStrategy);
            const deleteResult = await odsClient.DELETE('/sandboxes/{sandboxId}', {
              params: {path: {sandboxId: msg.sandboxId}},
            });
            if (deleteResult.error) {
              vscode.window.showErrorMessage(
                `B2C DX: Delete sandbox failed. ${getApiErrorMessage(deleteResult.error, deleteResult.response)}`,
              );
              return;
            }
            vscode.window.showInformationMessage('B2C DX: Sandbox deleted.');
            const {sandboxes, error} = await fetchSandboxList();
            panel.webview.postMessage({type: 'odsListResult', sandboxes, error});
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(`B2C DX: ${message}`);
          }
          return;
        }
        if (msg.type === 'odsCreateSandbox' && msg.realm !== undefined && msg.ttl !== undefined) {
          try {
            const config = await getOdsConfig();
            if (!config.hasOAuthConfig()) {
              vscode.window.showErrorMessage('B2C DX: OAuth credentials required for ODS. Configure dw.json.');
              return;
            }
            const realm = String(msg.realm).trim();
            if (!realm) {
              vscode.window.showErrorMessage('B2C DX: Realm is required.');
              return;
            }
            const ttl = Number(msg.ttl);
            if (Number.isNaN(ttl) || ttl < 0) {
              vscode.window.showErrorMessage('B2C DX: TTL must be a non-negative number.');
              return;
            }
            const host = config.values.sandboxApiHost ?? DEFAULT_ODS_HOST;
            const authStrategy = config.createOAuth();
            const odsClient = createOdsClient({host}, authStrategy);
            const createResult = await odsClient.POST('/sandboxes', {
              body: {
                realm,
                ttl, // 0 means no expiration
                analyticsEnabled: false,
              },
            });
            if (createResult.error) {
              vscode.window.showErrorMessage(
                `B2C DX: Create sandbox failed. ${getApiErrorMessage(createResult.error, createResult.response)}`,
              );
              return;
            }
            vscode.window.showInformationMessage('B2C DX: Sandbox creation started.');
            const {sandboxes, error} = await fetchSandboxList();
            panel.webview.postMessage({type: 'odsListResult', sandboxes, error});
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(`B2C DX: ${message}`);
          }
        }
      },
    );
  });

  const storefrontNextCartridgeDisposable = vscode.commands.registerCommand(
    'b2c-dx.handleStorefrontNextCartridge',
    () => {
      const projectDir = resolveStorefrontNextProjectDir();
      if (!projectDir) {
        vscode.window.showErrorMessage('B2C DX: Open a workspace folder to use Storefront Next Cartridge.');
        return;
      }
      const panel = vscode.window.createWebviewPanel(
        'b2c-dx-storefront-next-cartridge',
        'Storefront Next Cartridge',
        vscode.ViewColumn.One,
        {enableScripts: true},
      );
      panel.webview.html = getStorefrontNextCartridgeWebviewContent(context);

      panel.webview.onDidReceiveMessage(async (msg: {type: string}) => {
        const projectDirectory = projectDir;
        if (msg.type === 'createCartridge') {
          const cartridgesDir = path.join(projectDirectory, 'cartridges');
          if (!fs.existsSync(cartridgesDir) || !fs.statSync(cartridgesDir).isDirectory()) {
            const message =
              "B2C DX: This command must be run under a Storefront Next storefront template. No 'cartridges' directory found.";
            log.appendLine(`[Storefront Next Cartridge] ${message}`);
            vscode.window.showErrorMessage(message);
            panel.webview.postMessage({
              type: 'createCartridgeResult',
              generatedFiles: [],
              error: message,
            });
            return;
          }
          const cmd = 'pnpm sfnext generate-cartridge -d .';
          log.appendLine(`[Storefront Next Cartridge] Running: ${cmd}`);
          panel.webview.postMessage({type: 'createCartridgeResult', generatedFiles: [], running: true});
          try {
            await execAsync(cmd, {cwd: projectDirectory, maxBuffer: 4 * 1024 * 1024});
            const generatedFiles = findJsonFilesUnder(cartridgesDir).map((rel) =>
              path.join('cartridges', rel).split(path.sep).join('/'),
            );
            log.appendLine(
              `[Storefront Next Cartridge] Generated ${generatedFiles.length} metadata file(s):\n${generatedFiles.join('\n')}`,
            );
            panel.webview.postMessage({
              type: 'createCartridgeResult',
              generatedFiles,
              error: undefined,
              running: false,
            });
            vscode.window.showInformationMessage(
              `B2C DX: Page Designer metadata generated. ${generatedFiles.length} file(s) under cartridges/.`,
            );
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            const stderr =
              err && typeof err === 'object' && 'stderr' in err ? String((err as {stderr?: string}).stderr) : '';
            const errorText = stderr || message;
            log.appendLine(`[Storefront Next Cartridge] Generate failed: ${errorText}`);
            panel.webview.postMessage({
              type: 'createCartridgeResult',
              generatedFiles: [],
              error: errorText,
              running: false,
            });
            vscode.window.showErrorMessage(`B2C DX: Generate Page Designer metadata failed. ${message}`);
          }
        } else if (msg.type === 'deployCartridge') {
          const cartridgesDir = path.join(projectDirectory, 'cartridges');
          if (!fs.existsSync(cartridgesDir) || !fs.statSync(cartridgesDir).isDirectory()) {
            const message =
              "B2C DX: Deploy is only supported for Storefront Next storefronts. No 'cartridges' folder found.";
            log.appendLine(`[Storefront Next Cartridge] ${message}`);
            vscode.window.showErrorMessage(message);
            return;
          }
          const dwPath = findDwJson(projectDirectory);
          const config = dwPath
            ? resolveConfig({}, {configPath: dwPath})
            : resolveConfig({}, {projectDirectory: projectDirectory});
          if (!config.hasB2CInstanceConfig()) {
            const message =
              'B2C DX: No instance config for deploy. Configure SFCC_* env vars or dw.json in the project.';
            log.appendLine(`[Storefront Next Cartridge] ${message}`);
            vscode.window.showErrorMessage(message);
            return;
          }
          const instance = config.createB2CInstance();
          if (!instance.config.codeVersion) {
            try {
              const active = await getActiveCodeVersion(instance);
              if (active?.id) {
                instance.config.codeVersion = active.id;
              }
            } catch (err) {
              const detail = err instanceof Error ? err.message : String(err);
              const message =
                'B2C DX: No code version set and could not discover active version. Set code-version in dw.json or configure OAuth.';
              log.appendLine(`[Storefront Next Cartridge] ${message} ${detail}`);
              vscode.window.showErrorMessage(message);
              return;
            }
          }
          if (!instance.config.codeVersion) {
            const message =
              'B2C DX: No active code version found. Set code-version in dw.json or ensure OAuth is configured.';
            log.appendLine(`[Storefront Next Cartridge] ${message}`);
            vscode.window.showErrorMessage(message);
            return;
          }
          try {
            log.appendLine(
              `[Storefront Next Cartridge] Deploying cartridges to ${instance.config.hostname} (${instance.config.codeVersion})...`,
            );
            panel.webview.postMessage({type: 'deployResult', running: true});
            const result = await findAndDeployCartridges(instance, cartridgesDir, {});
            log.appendLine(
              `[Storefront Next Cartridge] Deployed ${result.cartridges.length} cartridge(s) to ${result.codeVersion}.`,
            );
            panel.webview.postMessage({
              type: 'deployResult',
              success: true,
              running: false,
              hostname: instance.config.hostname,
              codeVersion: result.codeVersion,
              reloaded: result.reloaded,
              cartridges: result.cartridges.map((c) => c.name),
            });
            vscode.window.showInformationMessage(
              `B2C DX: Deployed ${result.cartridges.length} cartridge(s) to ${result.codeVersion}. ${result.cartridges.map((c) => c.name).join(', ')}  `,
            );
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            log.appendLine(`[Storefront Next Cartridge] Deploy failed: ${message}`);
            panel.webview.postMessage({
              type: 'deployResult',
              success: false,
              running: false,
              error: message,
            });
            vscode.window.showErrorMessage(`B2C DX: Deploy failed. ${message}`);
          }
        }
      });
    },
  );

  context.subscriptions.push(
    disposable,
    promptAgentDisposable,
    listWebDavDisposable,
    scapiExplorerDisposable,
    odsManagementDisposable,
    storefrontNextCartridgeDisposable,
  );
  log.appendLine('B2C DX extension activated.');
}
