/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';

interface XmlFileAssociation {
  pattern: string;
  systemId: string;
}

const XSD_MAPPINGS: ReadonlyArray<{pattern: string; schemaFile: string}> = [
  {pattern: '**/metadata/catalogs/*.xml', schemaFile: 'catalog.xsd'},
  {pattern: '**/metadata/customer-groups/*.xml', schemaFile: 'customergroup.xsd'},
  {pattern: '**/metadata/customer-lists/*.xml', schemaFile: 'customerlist.xsd'},
  {pattern: '**/metadata/custom-objects/*.xml', schemaFile: 'customobject.xsd'},
  {pattern: '**/metadata/inventory-lists/*.xml', schemaFile: 'inventory.xsd'},
  {pattern: '**/metadata/libraries/*.xml', schemaFile: 'library.xsd'},
  {pattern: '**/metadata/payment-methods/*.xml', schemaFile: 'paymentmethod.xsd'},
  {pattern: '**/metadata/payment-processors/*.xml', schemaFile: 'paymentprocessor.xsd'},
  {pattern: '**/metadata/preferences/*.xml', schemaFile: 'preferences.xsd'},
  {pattern: '**/metadata/pricebooks/*.xml', schemaFile: 'pricebook.xsd'},
  {pattern: '**/metadata/promotions/*.xml', schemaFile: 'promotion.xsd'},
  {pattern: '**/metadata/redirect-urls/*.xml', schemaFile: 'redirecturl.xsd'},
  {pattern: '**/metadata/search/*.xml', schemaFile: 'search.xsd'},
  {pattern: '**/metadata/shipping/*.xml', schemaFile: 'shipping.xsd'},
  {pattern: '**/metadata/sites/*.xml', schemaFile: 'site.xsd'},
  {pattern: '**/metadata/slots/*.xml', schemaFile: 'slot.xsd'},
  {pattern: '**/metadata/sourcecodes/*.xml', schemaFile: 'sourcecode.xsd'},
  {pattern: '**/metadata/stores/*.xml', schemaFile: 'store.xsd'},
  {pattern: '**/metadata/url-rules/*.xml', schemaFile: 'urlrules.xsd'},
];

function getDesiredAssociations(extensionUri: vscode.Uri): XmlFileAssociation[] {
  return XSD_MAPPINGS.map((mapping) => ({
    pattern: mapping.pattern,
    systemId: vscode.Uri.joinPath(extensionUri, 'resources', 'xsd', mapping.schemaFile).toString(),
  }));
}

function normalizeAssociations(value: unknown): XmlFileAssociation[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is XmlFileAssociation =>
      Boolean(entry && typeof entry === 'object' && 'pattern' in entry && typeof entry.pattern === 'string') &&
      Boolean('systemId' in entry && typeof entry.systemId === 'string'),
  );
}

function arraysEqual(left: XmlFileAssociation[], right: XmlFileAssociation[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((item, idx) => item.pattern === right[idx]?.pattern && item.systemId === right[idx]?.systemId);
}

export function registerXmlValidation(context: vscode.ExtensionContext, log: vscode.OutputChannel): void {
  const applyAssociations = async (): Promise<void> => {
    const xmlConfig = vscode.workspace.getConfiguration('xml');
    const existing = normalizeAssociations(xmlConfig.get<unknown>('fileAssociations', []));
    const desired = getDesiredAssociations(context.extensionUri);
    const managedPatterns = new Set(desired.map((association) => association.pattern));

    const retained = existing.filter((association) => !managedPatterns.has(association.pattern));
    const next = [...retained, ...desired];

    if (arraysEqual(existing, next)) return;

    try {
      await xmlConfig.update('fileAssociations', next, vscode.ConfigurationTarget.Workspace);
      log.appendLine(`[XmlValidation] Registered ${desired.length} XML file association(s) for B2C metadata schemas.`);
    } catch (err) {
      log.appendLine(`[XmlValidation] Failed to register XML file associations: ${String(err)}`);
    }
  };

  void applyAssociations();

  const configChange = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('xml.fileAssociations')) {
      void applyAssociations();
    }
  });

  context.subscriptions.push(configChange);
}
