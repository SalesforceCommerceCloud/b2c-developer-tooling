/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {buildObjectTypeExtensionsXml, exportObjectTypes} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import type {ObjectAttributeValueType} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import * as vscode from 'vscode';

import type {B2CExtensionConfig} from '../config-provider.js';
import {registerSafeCommand, runWithSafety} from '../safety.js';
import {ATTRIBUTE_SCHEME, AttributeFileSystemProvider} from './attribute-fs-provider.js';
import {describeObjectTypesError, validateAttributeId, validateEnumValue} from './model.js';
import {
  AttributeTreeItem,
  EnumValueTreeItem,
  FolderTreeItem,
  ObjectTypeTreeItem,
  ObjectTypesTreeDataProvider,
  VIEW_ID,
} from './object-types-tree-provider.js';

const DETAILS_SCHEME = 'b2c-object-type';

const VALUE_TYPES: Array<{type: ObjectAttributeValueType; detail: string}> = [
  {type: 'string', detail: 'Text up to 4000 characters'},
  {type: 'text', detail: 'Long text'},
  {type: 'html', detail: 'HTML markup'},
  {type: 'int', detail: 'Integer'},
  {type: 'double', detail: 'Decimal number'},
  {type: 'boolean', detail: 'Yes / no'},
  {type: 'date', detail: 'Date'},
  {type: 'datetime', detail: 'Date and time'},
  {type: 'email', detail: 'Email address'},
  {type: 'image', detail: 'Image reference'},
  {type: 'password', detail: 'Encrypted text'},
  {type: 'money', detail: 'Amount with currency'},
  {type: 'quantity', detail: 'Amount with unit'},
  {type: 'enum_of_string', detail: 'Choice from text values (add values after creating)'},
  {type: 'enum_of_int', detail: 'Choice from integer values (add values after creating)'},
  {type: 'set_of_string', detail: 'Set of text values'},
  {type: 'set_of_int', detail: 'Set of integers'},
  {type: 'set_of_double', detail: 'Set of decimal numbers'},
];

function statusOf(error: unknown): number | undefined {
  const status = (error as {status?: unknown} | null)?.status;
  return typeof status === 'number' ? status : undefined;
}

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

  // Custom attributes open as editable documents; saving applies the change after a confirmation.
  const attributeFs = new AttributeFileSystemProvider(configProvider, treeProvider, log);
  const attributeFsSub = vscode.workspace.registerFileSystemProvider(ATTRIBUTE_SCHEME, attributeFs, {
    isCaseSensitive: true,
  });

  // System attributes open read-only.
  const documents = new Map<string, string>();
  const documentChanges = new vscode.EventEmitter<vscode.Uri>();
  const detailsProvider = vscode.workspace.registerTextDocumentContentProvider(DETAILS_SCHEME, {
    onDidChange: documentChanges.event,
    provideTextDocumentContent: (uri) => documents.get(uri.toString()) ?? '',
  });

  const refreshCmd = registerSafeCommand('b2c-dx.objectTypes.refresh', () => treeProvider.refresh());

  const openAttributeCmd = registerSafeCommand('b2c-dx.objectTypes.openAttribute', async (item: AttributeTreeItem) => {
    if (!(item instanceof AttributeTreeItem)) return;
    let uri: vscode.Uri;
    if (item.attribute.system) {
      uri = vscode.Uri.from({scheme: DETAILS_SCHEME, path: `/${item.objectType}/${item.attribute.id}.json`});
      documents.set(uri.toString(), `${JSON.stringify(item.attribute, null, 2)}\n`);
      documentChanges.fire(uri);
    } else {
      uri = attributeFs.set(item.objectType, item.attribute);
    }
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.languages.setTextDocumentLanguage(doc, 'json');
    await vscode.window.showTextDocument(doc, {preview: true});
  });

  const copyIdCmd = registerSafeCommand('b2c-dx.objectTypes.copyAttributeId', async (item: AttributeTreeItem) => {
    if (!(item instanceof AttributeTreeItem)) return;
    await vscode.env.clipboard.writeText(item.attribute.id);
    vscode.window.setStatusBarMessage(`Copied ${item.attribute.id}`, 3000);
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

  const createCmd = registerSafeCommand(
    'b2c-dx.objectTypes.createAttribute',
    async (item?: FolderTreeItem | ObjectTypeTreeItem) => {
      const objectType =
        item instanceof ObjectTypeTreeItem
          ? item.definition.objectType!
          : item instanceof FolderTreeItem
            ? item.objectType
            : await vscode.window.showInputBox({
                title: 'New Custom Attribute',
                prompt: 'System object type (for example Product, Order, Profile, SitePreferences)',
                validateInput: (value) => (value.trim() ? undefined : 'Enter an object type.'),
              });
      if (!objectType) return;
      const title = `New ${objectType} Custom Attribute`;

      const id = (
        await vscode.window.showInputBox({
          title: `${title} (1/3)`,
          prompt: 'Attribute ID',
          validateInput: validateAttributeId,
        })
      )?.trim();
      if (!id) return;
      const typePick = await vscode.window.showQuickPick(
        VALUE_TYPES.map((entry) => ({label: entry.type, detail: entry.detail})),
        {title: `${title} (2/3)`, placeHolder: 'Value type (cannot be changed later)'},
      );
      if (!typePick) return;
      const displayName = await vscode.window.showInputBox({
        title: `${title} (3/3)`,
        prompt: 'Display name (optional)',
        value: id,
      });
      if (displayName === undefined) return;

      try {
        const client = await treeProvider.getClient();
        // PUT replaces an existing definition, so check first.
        const exists = await client.getAttributeDefinition(objectType, id).then(
          () => true,
          (error: unknown) => {
            if (statusOf(error) === 404) return false;
            throw error;
          },
        );
        if (exists) {
          vscode.window.showErrorMessage(`B2C DX: ${objectType}.${id} already exists.`);
          return;
        }
        const host = configProvider.getConfig()?.values.hostname ?? 'the instance';
        const choice = await vscode.window.showWarningMessage(
          `Create ${objectType}.${id} on ${host}?`,
          {modal: true, detail: `Value type: ${typePick.label}${displayName ? `\nDisplay name: ${displayName}` : ''}`},
          'Create',
        );
        if (choice !== 'Create') return;
        const {definition} = await runWithSafety(
          () =>
            client.createOrReplaceAttributeDefinition(objectType, {
              id,
              valueType: typePick.label as ObjectAttributeValueType,
              ...(displayName ? {displayName: {default: displayName}} : {}),
            }),
          `Create ${objectType}.${id}?`,
        );
        treeProvider.invalidate(objectType);
        const doc = await vscode.workspace.openTextDocument(attributeFs.set(objectType, definition));
        await vscode.languages.setTextDocumentLanguage(doc, 'json');
        await vscode.window.showTextDocument(doc, {preview: false});
        const hint = typePick.label.startsWith('enum_of_')
          ? ' Right-click it in the Object Types view and choose Add Value... to add values.'
          : '';
        vscode.window.showInformationMessage(`B2C DX: Created ${objectType}.${id}.${hint}`);
      } catch (error) {
        log.appendLine(`[Object Types] Creating ${objectType}.${id} failed: ${String(error)}`);
        vscode.window.showErrorMessage(
          `B2C DX: Could not create ${objectType}.${id}. ${describeObjectTypesError(error, objectType).message}`,
        );
      }
    },
  );

  /** Runs an enum value change and reports failures as an error message. */
  const valueChange = async (label: string, run: () => Promise<unknown>) => {
    try {
      await run();
    } catch (error) {
      vscode.window.showErrorMessage(`B2C DX: ${label} failed. ${describeObjectTypesError(error).message}`);
    }
  };

  const addValueCmd = registerSafeCommand('b2c-dx.objectTypes.addEnumValue', async (item: AttributeTreeItem) => {
    if (!(item instanceof AttributeTreeItem) || item.attribute.system) return;
    const {objectType, attribute} = item;
    const existing = (attribute.valueDefinitions ?? []).map((entry) => String(entry.value));
    const title = `Add Value to ${objectType}.${attribute.id}`;
    const value = (
      await vscode.window.showInputBox({
        title: `${title} (1/2)`,
        prompt: attribute.valueType === 'enum_of_int' ? 'Value (a whole number)' : 'Value (stored on objects)',
        validateInput: (input) => validateEnumValue(input, attribute.valueType, existing),
      })
    )?.trim();
    if (!value) return;
    const display = await vscode.window.showInputBox({
      title: `${title} (2/2)`,
      prompt: 'Display value shown in Business Manager (default locale)',
      value,
    });
    if (display === undefined) return;
    await valueChange('Adding the value', () =>
      attributeFs.apply(objectType, {
        id: attribute.id,
        valueDefinitions: [{value, ...(display ? {displayValue: {default: display}} : {})}],
      }),
    );
  });

  const editValueCmd = registerSafeCommand('b2c-dx.objectTypes.editEnumValue', async (item: EnumValueTreeItem) => {
    if (!(item instanceof EnumValueTreeItem) || item.attribute.system) return;
    const display = await vscode.window.showInputBox({
      title: `Edit Display Value of ${item.value}`,
      prompt: 'Display value shown in Business Manager (default locale; other locales are kept)',
      value: item.display ?? item.value,
      validateInput: (input) => (input.trim() ? undefined : 'Enter a display value.'),
    });
    if (display === undefined || display === item.display) return;
    await valueChange('Editing the value', () =>
      attributeFs.apply(item.objectType, {
        id: item.attribute.id,
        valueDefinitions: [{value: item.value, displayValue: {default: display}}],
      }),
    );
  });

  const defaultValueCmd = registerSafeCommand('b2c-dx.objectTypes.setDefaultValue', async (item: EnumValueTreeItem) => {
    if (!(item instanceof EnumValueTreeItem) || item.attribute.system) return;
    await valueChange('Setting the default value', () =>
      attributeFs.apply(item.objectType, {id: item.attribute.id, defaultValue: {value: item.value}}),
    );
  });

  const removeValueCmd = registerSafeCommand('b2c-dx.objectTypes.removeEnumValue', async (item: EnumValueTreeItem) => {
    if (!(item instanceof EnumValueTreeItem) || item.attribute.system) return;
    await valueChange('Removing the value', () =>
      attributeFs.removeValue(item.objectType, item.attribute.id, item.value),
    );
  });

  const resetSub = configProvider.onDidReset(() => treeProvider.reset());

  context.subscriptions.push(
    treeView,
    messageSub,
    attributeFsSub,
    detailsProvider,
    documentChanges,
    refreshCmd,
    openAttributeCmd,
    copyIdCmd,
    exportCmd,
    createCmd,
    addValueCmd,
    editValueCmd,
    defaultValueCmd,
    removeValueCmd,
    resetSub,
  );
}
