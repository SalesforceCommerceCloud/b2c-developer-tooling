/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import type {B2CDXApi} from 'b2c-dx-core/api';

function getWebviewContent(context: vscode.ExtensionContext): string {
  const htmlPath = path.join(context.extensionPath, 'src', 'page-designer', 'webview.html');
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

export function registerPageDesignerCommands(context: vscode.ExtensionContext, api: B2CDXApi): vscode.Disposable[] {
  const openPageDesigner = vscode.commands.registerCommand('b2c-dx-sfnext.openPageDesigner', () => {
    vscode.window.showInformationMessage('B2C DX: Opening Page Designer Assistant.');

    const panel = vscode.window.createWebviewPanel(
      'b2c-dx-page-designer-ui',
      'Page Designer Assistant',
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
          const templatePath = path.join(context.extensionPath, 'src', 'page-designer', 'template', '_app.pageId.tsx');
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
            const rootUri = vscode.Uri.file(api.getWorkingDirectory());
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

  return [openPageDesigner];
}
