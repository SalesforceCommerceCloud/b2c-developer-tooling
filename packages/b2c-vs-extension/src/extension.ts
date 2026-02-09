/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {findDwJson, loadConfig, WEBDAV_ROOTS} from '@salesforce/b2c-tooling-sdk/cli';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

function getWebviewContent(context: vscode.ExtensionContext): string {
  const htmlPath = path.join(context.extensionPath, "src", "webview.html");
  return fs.readFileSync(htmlPath, "utf-8");
}

function getStorefrontNextCartridgeWebviewContent(context: vscode.ExtensionContext): string {
  const htmlPath = path.join(context.extensionPath, "src", "storefront-next-cartridge.html");
  return fs.readFileSync(htmlPath, "utf-8");
}

const WEBDAV_ROOT_LABELS: Record<string, string> = {
  impex: "Impex directory (default)",
  temp: "Temporary files",
  cartridges: "Code cartridges",
  realmdata: "Realm data",
  catalogs: "Product catalogs",
  libraries: "Content libraries",
  static: "Static resources",
  logs: "Log files",
  securitylogs: "Security log files",
};

function getWebdavWebviewContent(
  context: vscode.ExtensionContext,
  roots: { key: string; path: string; label: string }[]
): string {
  const htmlPath = path.join(context.extensionPath, "src", "webdav.html");
  const raw = fs.readFileSync(htmlPath, "utf-8");
  const rootsJson = JSON.stringify(roots);
  return raw.replace(
    "const roots = window.WEBDAV_ROOTS || [];",
    `window.WEBDAV_ROOTS = ${rootsJson};\n      const roots = window.WEBDAV_ROOTS;`
  );
}

/** PascalCase for use in template content (class names, types, etc.). e.g. "first page" → "FirstPage" */
function pageNameToPageId(pageName: string): string {
  return pageName
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

/** camelCase for filename. e.g. "first page" → "firstPage" */
function pageNameToFileNameId(pageName: string): string {
  const pascal = pageNameToPageId(pageName || "Page");
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

type RegionForm = { id: string; name: string; description: string; maxComponents: number };

type WebviewMessage =
  | { type: 'openExternal' }
  | {
      type: 'submitForm';
      pageType: { name?: string; description?: string; supportedAspectTypes?: string[] };
      regions: RegionForm[];
    };

function renderTemplate(
  template: string,
  pageName: string,
  pageDescription: string,
  supportedAspectTypes: string[],
  regions: RegionForm[]
): string {
  const pageId = pageNameToPageId(pageName || "Page");
  const quoted = (s: string) => `'${String(s).replace(/'/g, "\\'")}'`;
  const aspectsStr = `[${supportedAspectTypes.map((a) => quoted(a)).join(", ")}]`;
  const regionsBlock = regions
    .map(
      (r) =>
        `{
        id: ${quoted(r.id)},
        name: ${quoted(r.name)},
        description: ${quoted(r.description)},
        maxComponents: ${r.maxComponents},
    }`
    )
    .join(",\n    ");
  const firstRegionId = regions[0]?.id ?? "";

  return template
    .replace(/\$\{pageName\}/g, quoted(pageName || ""))
    .replace(/\$\{pageDescription\}/g, quoted(pageDescription || ""))
    .replace(/\$\{supportedAspectTypes\}/g, aspectsStr)
    .replace("__REGIONS__", regionsBlock)
    .replace(/\$\{pageId\}/g, pageId)
    .replace(/\$\{pageName\}Data/g, `${pageId}Data`)
    .replace(/\$\{regions\[0\]\.id\}/g, firstRegionId);
}

export function activate(context: vscode.ExtensionContext) {
  const log = vscode.window.createOutputChannel('B2C DX');
  try {
    return activateInner(context, log);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    log.appendLine(`Activation failed: ${message}`);
    if (stack) log.appendLine(stack);
    console.error('B2C DX extension activation failed:', err);
    vscode.window.showErrorMessage(`B2C DX: Extension failed to activate. See Output > B2C DX. Error: ${message}`);
    context.subscriptions.push(
      vscode.commands.registerCommand('b2c-dx.openUI', () => {
        log.show();
        vscode.window.showErrorMessage(`B2C DX activation error: ${message}`);
      })
    );
  }
}

function activateInner(context: vscode.ExtensionContext, log: vscode.OutputChannel) {
  const disposable = vscode.commands.registerCommand('b2c-dx.openUI', () => {
    vscode.window.showInformationMessage('B2C DX: Opening Page Designer Assistant.');

    const panel = vscode.window.createWebviewPanel(
      'b2c-dx-page-designer-ui',
      "My Extension UI",
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = getWebviewContent(context);
    
    panel.webview.onDidReceiveMessage(async (msg: WebviewMessage) => {
      if (msg.type === 'openExternal') {
        await vscode.env.openExternal(vscode.Uri.parse("https://example.com"));
      }
      if (msg.type === 'submitForm') {
        try {
          const { pageType, regions } = msg;
          const pageName = pageType?.name ?? "";
          const templatePath = path.join(context.extensionPath, "src", "template", "_app.pageId.tsx");
          const template = fs.readFileSync(templatePath, "utf-8");
          const content = renderTemplate(
            template,
            pageName,
            pageType?.description ?? "",
            pageType?.supportedAspectTypes ?? [],
            regions ?? []
          );

          const fileNameId = pageNameToFileNameId(pageName);
          const fileName = `_app.${fileNameId}.tsx`;

          let targetUri: vscode.Uri;
          if (vscode.workspace.workspaceFolders?.length) {
            const rootUri = vscode.workspace.workspaceFolders[0].uri;
            const routesUri = vscode.Uri.joinPath(rootUri, "routes");
            const routesPath = routesUri.fsPath;
            const hasRoutesFolder =
              fs.existsSync(routesPath) && fs.statSync(routesPath).isDirectory();
            targetUri = hasRoutesFolder
              ? vscode.Uri.joinPath(routesUri, fileName)
              : vscode.Uri.joinPath(rootUri, fileName);
          } else {
            const picked = await vscode.window.showSaveDialog({
              defaultUri: vscode.Uri.joinPath(context.globalStorageUri, fileName),
              saveLabel: "Create file",
            });
            if (!picked) {
              return;
            }
            targetUri = picked;
          }

          vscode.window.showInformationMessage(`Writing file to: ${targetUri.fsPath}`);

          await vscode.workspace.fs.writeFile(targetUri, Buffer.from(content, "utf-8"));
          await vscode.window.showInformationMessage(
            `Saved to: ${targetUri.fsPath}`,
            "Open"
          );
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
      title: "Prompt Agent",
      placeHolder: "Enter your prompt for the agent...",
    });
    if (prompt === undefined || prompt === "") {
      return;
    }
    try {
      await vscode.env.clipboard.writeText(prompt);
      await vscode.commands.executeCommand("composer.newAgentChat");
      await new Promise((resolve) => setTimeout(resolve, 300));
      await vscode.commands.executeCommand("editor.action.clipboardPasteAction");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showWarningMessage(
        `Could not open Cursor chat: ${message}. Run this extension in Cursor to send prompts to the agent.`
      );
    }
  });

  type WebDavPropfindEntry = { href: string; displayName?: string; contentLength?: number; isCollection?: boolean };

  const listWebDavDisposable = vscode.commands.registerCommand('b2c-dx.listWebDav', async () => {
    let startDir =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
    if (!startDir || startDir === '/' || !fs.existsSync(startDir)) {
      startDir = context.extensionPath;
    }
    const dwPath = findDwJson(startDir);
    const config = dwPath
      ? loadConfig({}, {configPath: dwPath})
      : loadConfig({}, {startDir});

    if (!config.hasB2CInstanceConfig()) {
      vscode.window.showErrorMessage(
        'B2C DX: No instance config. Configure SFCC_* env vars or dw.json in the workspace.'
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

    const panel = vscode.window.createWebviewPanel(
      'b2c-dx-webdav',
      'B2C WebDAV Browser',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );
    panel.webview.html = getWebdavWebviewContent(context, roots);

    const instance = config.createB2CInstance() as {
      webdav: {
        propfind: (path: string, depth: '1') => Promise<WebDavPropfindEntry[]>;
        mkcol: (path: string) => Promise<void>;
        delete: (path: string) => Promise<void>;
        put: (path: string, content: Buffer | Blob | string, contentType?: string) => Promise<void>;
      };
    };

    const getDisplayName = (e: WebDavPropfindEntry): string =>
      e.displayName ?? e.href.split('/').filter(Boolean).at(-1) ?? e.href;

    panel.webview.onDidReceiveMessage(
      async (msg: { type: string; path?: string; name?: string; isCollection?: boolean }) => {
        if (msg.type === 'listPath' && msg.path !== undefined) {
          const listPath = msg.path as string;
          try {
            const entries = await instance.webdav.propfind(listPath, '1');
            const normalizedPath = listPath.replace(/\/$/, '');
            const filtered = entries.filter((entry: WebDavPropfindEntry) => {
              const entryPath = decodeURIComponent(entry.href);
              return (
                !entryPath.endsWith(`/${normalizedPath}`) &&
                !entryPath.endsWith(`/${normalizedPath}/`)
              );
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
            panel.webview.postMessage({ type: 'mkdirResult', success: true, path: fullPath });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            panel.webview.postMessage({ type: 'mkdirResult', success: false, error: message });
          }
          return;
        }
        if (msg.type === 'requestDelete' && msg.path !== undefined) {
          const pathToDelete = msg.path as string;
          const name = msg.name ?? pathToDelete.split('/').pop() ?? pathToDelete;
          const isDir = msg.isCollection === true;
          const detail = isDir
            ? 'This directory and its contents will be deleted.'
            : 'This file will be deleted.';
          const choice = await vscode.window.showWarningMessage(
            `Delete "${name}"? ${detail}`,
            { modal: true },
            'Delete',
            'Cancel'
          );
          if (choice !== 'Delete') return;
          try {
            await instance.webdav.delete(pathToDelete);
            panel.webview.postMessage({ type: 'deleteResult', success: true });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            panel.webview.postMessage({ type: 'deleteResult', success: false, error: message });
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
            panel.webview.postMessage({ type: 'uploadResult', success: true, path: fullPath });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            panel.webview.postMessage({ type: 'uploadResult', success: false, error: message });
          }
        }
      }
    );
  });

  function resolveStorefrontNextProjectDir(): string | undefined {
    const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!folder) return undefined;
    const sub = path.join(folder, "storefront-next", "packages", "template-retail-rsc-app");
    if (fs.existsSync(sub) && fs.statSync(sub).isDirectory()) {
      return sub;
    }
    return folder;
  }

  function resolveCliScript(context: vscode.ExtensionContext): { node: string; script: string } | null {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceRoot) {
      const distCli = path.join(workspaceRoot, "dist", "cli.js");
      if (fs.existsSync(distCli)) {
        return { node: "node", script: distCli };
      }
    }
    const monorepoRoot = path.join(context.extensionPath, "..", "..");
    const b2cCliRun = path.join(monorepoRoot, "packages", "b2c-cli", "bin", "run.js");
    if (fs.existsSync(b2cCliRun)) {
      return { node: "node", script: b2cCliRun };
    }
    return null;
  }

  const storefrontNextCartridgeDisposable = vscode.commands.registerCommand(
    "b2c-dx.handleStorefrontNextCartridge",
    () => {
      const projectDir = resolveStorefrontNextProjectDir();
      if (!projectDir) {
        vscode.window.showErrorMessage(
          "B2C DX: Open a workspace folder to use Storefront Next Cartridge."
        );
        return;
      }
      const panel = vscode.window.createWebviewPanel(
        "b2c-dx-storefront-next-cartridge",
        "Storefront Next Cartridge",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      panel.webview.html = getStorefrontNextCartridgeWebviewContent(context);

      panel.webview.onDidReceiveMessage(async (msg: { type: string }) => {
        const cli = resolveCliScript(context);
        const projectDirectory = projectDir;
        if (msg.type === "createCartridge") {
          const cmd =
            cli
              ? `node ${JSON.stringify(cli.script)} generate-cartridge --project-directory=${JSON.stringify(projectDirectory)}`
              : `npx --yes @salesforce/b2c-cli generate-cartridge --project-directory=${JSON.stringify(projectDirectory)}`;
          const term = vscode.window.createTerminal({
            name: "B2C Create Cartridge",
            cwd: cli ? path.dirname(cli.script) : undefined,
          });
          term.show();
          term.sendText(cmd);
        } else if (msg.type === "deployCartridge") {
          const cmd =
            cli
              ? `node ${JSON.stringify(cli.script)} deploy-cartridge --project-directory=${JSON.stringify(projectDirectory)}`
              : `npx --yes @salesforce/b2c-cli deploy-cartridge --project-directory=${JSON.stringify(projectDirectory)}`;
          const term = vscode.window.createTerminal({
            name: "B2C Deploy Cartridge",
            cwd: cli ? path.dirname(cli.script) : undefined,
          });
          term.show();
          term.sendText(cmd);
        }
      });
    }
  );

  context.subscriptions.push(
    disposable,
    promptAgentDisposable,
    listWebDavDisposable,
    storefrontNextCartridgeDisposable
  );
  log.appendLine('B2C DX extension activated.');
}


