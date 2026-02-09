/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

function getWebviewContent(context: vscode.ExtensionContext): string {
  const htmlPath = path.join(context.extensionPath, "src", "webview.html");
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
    let cli: {
      loadConfig: (flags: object, options: { startDir?: string; configPath?: string }) => { hasB2CInstanceConfig: () => boolean; createB2CInstance: () => unknown };
      findDwJson: (startDir: string) => string | undefined;
      WEBDAV_ROOTS: Record<string, string>;
    };
    try {
      cli = (await import('@salesforce/b2c-tooling-sdk/cli')) as typeof cli;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`B2C DX: Could not load SDK. ${message}`);
      return;
    }

    let startDir =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
    if (!startDir || startDir === '/' || !fs.existsSync(startDir)) {
      startDir = context.extensionPath;
    }
    const dwPath = cli.findDwJson(startDir);
    const config = dwPath
      ? cli.loadConfig({}, { configPath: dwPath })
      : cli.loadConfig({}, { startDir });

    if (!config.hasB2CInstanceConfig()) {
      vscode.window.showErrorMessage(
        'B2C DX: No instance config. Configure SFCC_* env vars or dw.json in the workspace.'
      );
      return;
    }

    const roots = (Object.keys(cli.WEBDAV_ROOTS) as string[]).map((key) => {
      const pathVal = (cli.WEBDAV_ROOTS as Record<string, string>)[key];
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
            validateInput: (value) => {
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
        }
      }
    );
  });

  context.subscriptions.push(disposable, promptAgentDisposable, listWebDavDisposable);
}


