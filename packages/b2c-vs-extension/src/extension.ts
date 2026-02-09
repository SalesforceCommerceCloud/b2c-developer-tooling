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
    const output = vscode.window.createOutputChannel('B2C DX');
    output.show(true);

    let cli: {
      loadConfig: (flags: object, options: { startDir?: string; configPath?: string }) => { hasB2CInstanceConfig: () => boolean; createB2CInstance: () => unknown };
      findDwJson: (startDir: string) => string | undefined;
      WEBDAV_ROOTS: { IMPEX: string };
    };
    try {
      cli = (await import('@salesforce/b2c-tooling-sdk/cli')) as typeof cli;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      output.appendLine(`Failed to load B2C Tooling SDK: ${message}`);
      vscode.window.showErrorMessage(`B2C DX: Could not load SDK. Run "pnpm install" and "pnpm run build" in the repo.`);
      return;
    }

    // Resolve dw.json: search from workspace folder, cwd, or extension dir upward (findDwJson walks parents)
    let startDir =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
    // Extension Host often has cwd="/" when no folder is open; use extension dir so we find repo's dw.json
    if (!startDir || startDir === '/' || !fs.existsSync(startDir)) {
      startDir = context.extensionPath;
    }
    output.appendLine(`Searching for dw.json from: ${startDir}`);
    const dwPath = cli.findDwJson(startDir);
    const config = dwPath
      ? cli.loadConfig({}, { configPath: dwPath })
      : cli.loadConfig({}, { startDir });
    if (dwPath) {
      output.appendLine(`Using config: ${dwPath}`);
    }

    if (!config.hasB2CInstanceConfig()) {
      output.appendLine('B2C instance not configured. Set SFCC_* env vars or use dw.json in the workspace.');
      if (!dwPath) {
        output.appendLine('No dw.json found in the workspace directory or any parent.');
      } else {
        output.appendLine('dw.json was found but is missing hostname (and auth). Add hostname (and username/password or OAuth) to dw.json.');
      }
      vscode.window.showErrorMessage(
        'B2C DX: No instance config. Configure SFCC_* env vars or dw.json in the workspace.'
      );
      return;
    }

    try {
      const instance = config.createB2CInstance() as { webdav: { propfind: (path: string, depth: '1') => Promise<WebDavPropfindEntry[]> } };
      const fullPath = cli.WEBDAV_ROOTS.IMPEX;
      output.appendLine(`Listing ${fullPath}...`);

      const entries = await instance.webdav.propfind(fullPath, '1');
      const normalizedFullPath = fullPath.replace(/\/$/, '');
      const filtered = entries.filter((entry: WebDavPropfindEntry) => {
        const entryPath = decodeURIComponent(entry.href);
        return (
          !entryPath.endsWith(`/${normalizedFullPath}`) &&
          !entryPath.endsWith(`/${normalizedFullPath}/`)
        );
      });

      if (filtered.length === 0) {
        output.appendLine('No files or directories found.');
        return;
      }

      // Format helpers (aligned with CLI webdav ls)
      const formatBytes = (bytes: number | undefined): string => {
        if (bytes === undefined || bytes === null) return '-';
        if (bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const k = 1024;
        const i = Math.min(
          Math.floor(Math.log(bytes) / Math.log(k)),
          units.length - 1
        );
        return `${(bytes / k ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
      };
      const getDisplayName = (e: WebDavPropfindEntry): string =>
        e.displayName ?? e.href.split('/').filter(Boolean).at(-1) ?? e.href;

      // Build a simple table: Name, Type, Size
      const nameWidth = Math.max(
        'Name'.length,
        ...filtered.map((e: WebDavPropfindEntry) => getDisplayName(e).length)
      );
      const typeWidth = Math.max('Type'.length, 3);
      const sizeWidth = Math.max(
        'Size'.length,
        ...filtered.map((e: WebDavPropfindEntry) => formatBytes(e.contentLength).length)
      );
      const pad = (s: string, w: number) => s.padEnd(w);
      output.appendLine(
        `${pad('Name', nameWidth)}  ${pad('Type', typeWidth)}  ${pad('Size', sizeWidth)}`
      );
      output.appendLine('-'.repeat(nameWidth + typeWidth + sizeWidth + 4));
      for (const e of filtered) {
        output.appendLine(
          `${pad(getDisplayName(e), nameWidth)}  ${pad(e.isCollection ? 'dir' : 'file', typeWidth)}  ${pad(formatBytes(e.contentLength), sizeWidth)}`
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      output.appendLine(`Error: ${message}`);
      vscode.window.showErrorMessage(`B2C DX WebDAV: ${message}`);
    }
  });

  context.subscriptions.push(disposable, promptAgentDisposable, listWebDavDisposable);
}


