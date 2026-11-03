/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {buildObjectTypeExtensionsXml, exportObjectTypes} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import * as vscode from 'vscode';

import type {B2CExtensionConfig} from '../config-provider.js';
import {registerSafeCommand} from '../safety.js';
import {describeObjectTypesError} from './model.js';
import {
  AttributeTreeItem,
  ObjectTypeTreeItem,
  ObjectTypesTreeDataProvider,
  VIEW_ID,
} from './object-types-tree-provider.js';

const DETAILS_SCHEME = 'b2c-object-type';

export function registerObjectTypes(
  context: vscode.ExtensionContext,
  configProvider: B2CExtensionConfig,
  log: vscode.OutputChannel,
): void {
  const treeProvider = new ObjectTypesTreeDataProvider(configProvider, log);
  const treeView = vscode.window.createTreeView(VIEW_ID, {treeDataProvider: treeProvider, showCollapseAll: true});
  const messageSub = treeProvider.onDidChangeMessage((message) => {
    treeView.message = message;
  });

  // Read-only documents for attribute definitions.
  const documents = new Map<string, string>();
  const documentChanges = new vscode.EventEmitter<vscode.Uri>();
  const detailsProvider = vscode.workspace.registerTextDocumentContentProvider(DETAILS_SCHEME, {
    onDidChange: documentChanges.event,
    provideTextDocumentContent: (uri) => documents.get(uri.toString()) ?? '',
  });

  const refreshCmd = registerSafeCommand('b2c-dx.objectTypes.refresh', () => treeProvider.refresh());

  const openAttributeCmd = registerSafeCommand('b2c-dx.objectTypes.openAttribute', async (item: AttributeTreeItem) => {
    if (!(item instanceof AttributeTreeItem)) return;
    const uri = vscode.Uri.from({
      scheme: DETAILS_SCHEME,
      path: `/${item.objectType}/${item.attribute.id}.json`,
    });
    documents.set(uri.toString(), `${JSON.stringify(item.attribute, null, 2)}\n`);
    documentChanges.fire(uri);
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.languages.setTextDocumentLanguage(doc, 'json');
    await vscode.window.showTextDocument(doc, {preview: true});
  });

  const copyIdCmd = registerSafeCommand('b2c-dx.objectTypes.copyAttributeId', async (item: AttributeTreeItem) => {
    if (!(item instanceof AttributeTreeItem)) return;
    await vscode.env.clipboard.writeText(item.effectiveId);
    vscode.window.setStatusBarMessage(`Copied ${item.effectiveId}`, 3000);
  });

  const exportCmd = registerSafeCommand('b2c-dx.objectTypes.exportXml', async (item: ObjectTypeTreeItem) => {
    if (!(item instanceof ObjectTypeTreeItem)) return;
    const objectType = item.definition.objectType!;
    try {
      const xml = await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: `B2C DX: Exporting ${objectType}...`},
        async () => buildObjectTypeExtensionsXml(await exportObjectTypes(await treeProvider.getClient(), [objectType])),
      );
      const doc = await vscode.workspace.openTextDocument({language: 'xml', content: xml});
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      log.appendLine(`[Object Types] Export of ${objectType} failed: ${String(error)}`);
      vscode.window.showErrorMessage(`B2C DX: Export failed. ${describeObjectTypesError(error, objectType).message}`);
    }
  });

  const resetSub = configProvider.onDidReset(() => treeProvider.reset());

  context.subscriptions.push(
    treeView,
    messageSub,
    detailsProvider,
    documentChanges,
    refreshCmd,
    openAttributeCmd,
    copyIdCmd,
    exportCmd,
    resetSub,
  );
}
