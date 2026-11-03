/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {getJobLog, JobExecutionError} from '@salesforce/b2c-tooling-sdk';
import {
  applyObjectTypeSync,
  importObjectTypeExtensions,
  planObjectTypeSync,
} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import type {ObjectAttributeDefinition} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import * as vscode from 'vscode';

import type {B2CExtensionConfig} from '../config-provider.js';
import {openJobLog} from '../job-log-viewer.js';
import {runWithSafety} from '../safety.js';
import {definitionFromDocument, describeObjectTypesError, describeSyncPlan} from './model.js';
import type {ObjectTypesTreeDataProvider} from './object-types-tree-provider.js';

/** Editable custom attribute definitions: `b2c-object-attribute:/{objectType}/{id}.json`. */
export const ATTRIBUTE_SCHEME = 'b2c-object-attribute';

const URI_PATH = /^\/([^/]+)\/([^/]+)\.json$/;

export function attributeUri(objectType: string, id: string): vscode.Uri {
  return vscode.Uri.from({scheme: ATTRIBUTE_SCHEME, path: `/${objectType}/${id}.json`});
}

function parseUri(uri: vscode.Uri): {objectType: string; id: string} | undefined {
  const match = uri.path.match(URI_PATH);
  return match ? {objectType: match[1], id: match[2]} : undefined;
}

function render(attribute: ObjectAttributeDefinition): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(attribute, null, 2)}\n`);
}

const MAX_LINES = 12;

function section(title: string, lines: string[]): string {
  if (lines.length === 0) return '';
  const shown = lines.slice(0, MAX_LINES).map((line) => `• ${line}`);
  if (lines.length > MAX_LINES) shown.push(`• ...and ${lines.length - MAX_LINES} more`);
  return `${title}\n${shown.join('\n')}`;
}

/**
 * Custom attribute definitions as JSON documents. Saving one applies the
 * change to the instance after a confirmation: writable properties through the
 * Object Definitions API, enum values and default values (which the API
 * ignores) through a site import.
 */
export class AttributeFileSystemProvider implements vscode.FileSystemProvider {
  private readonly _onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  readonly onDidChangeFile = this._onDidChangeFile.event;

  private readonly contents = new Map<string, Uint8Array>();
  private readonly mtimes = new Map<string, number>();

  constructor(
    private readonly configProvider: B2CExtensionConfig,
    private readonly treeProvider: ObjectTypesTreeDataProvider,
    private readonly log: vscode.OutputChannel,
  ) {}

  /** Seeds the document with an attribute already loaded in the tree. */
  set(objectType: string, attribute: ObjectAttributeDefinition): vscode.Uri {
    const uri = attributeUri(objectType, attribute.id);
    this.store(uri, render(attribute));
    return uri;
  }

  watch(): vscode.Disposable {
    return new vscode.Disposable(() => {});
  }

  stat(uri: vscode.Uri): vscode.FileStat {
    if (!parseUri(uri)) return {type: vscode.FileType.Directory, ctime: 0, mtime: 0, size: 0};
    return {type: vscode.FileType.File, ctime: 0, mtime: this.mtimes.get(uri.toString()) ?? 0, size: 0};
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    const cached = this.contents.get(uri.toString());
    if (cached) return cached;
    const target = parseUri(uri);
    if (!target) throw vscode.FileSystemError.FileNotFound(uri);
    // Not opened from the tree in this session (for example a restored editor).
    try {
      const client = await this.treeProvider.getClient();
      const attribute = await client.getAttributeDefinition(target.objectType, target.id, {includeValues: true});
      const content = render(attribute);
      this.contents.set(uri.toString(), content);
      return content;
    } catch (error) {
      throw vscode.FileSystemError.Unavailable(describeObjectTypesError(error, target.objectType).message);
    }
  }

  async writeFile(uri: vscode.Uri, content: Uint8Array): Promise<void> {
    const target = parseUri(uri);
    if (!target) throw vscode.FileSystemError.NoPermissions(uri);
    const {objectType, id} = target;
    const label = `${objectType}.${id}`;

    let desired;
    try {
      desired = definitionFromDocument(Buffer.from(content).toString('utf8'), id);
    } catch (error) {
      throw vscode.FileSystemError.Unavailable(error instanceof Error ? error.message : String(error));
    }

    try {
      const client = await this.treeProvider.getClient();
      const plan = await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Window, title: `Comparing ${label} with the instance...`},
        () => planObjectTypeSync(client, [{objectType, attributes: [desired], systemAttributes: [], groups: []}]),
      );
      const {api, importItems, warnings} = describeSyncPlan(plan);
      if (api.length === 0 && importItems.length === 0) {
        if (warnings.length > 0) void vscode.window.showWarningMessage(`B2C DX: ${warnings.join(' ')}`);
        else vscode.window.setStatusBarMessage(`B2C DX: ${label} has no changes to apply`, 4000);
        this.store(uri, content);
        return;
      }

      const instance = importItems.length > 0 ? this.configProvider.getInstance() : null;
      if (importItems.length > 0 && !instance) {
        throw new Error(
          'Enum values and default values are set with a site import, which needs the instance hostname in the configuration.',
        );
      }
      const host = this.configProvider.getConfig()?.values.hostname ?? 'the instance';
      const detail = [
        section('Object Definitions API:', api),
        section('Site import (runs the site archive import job):', importItems),
        section('Notes:', warnings),
      ]
        .filter(Boolean)
        .join('\n\n');
      const choice = await vscode.window.showWarningMessage(
        `Apply changes to ${label} on ${host}?`,
        {modal: true, detail},
        'Apply',
      );
      if (choice !== 'Apply') throw new Error('Not saved: the changes were not applied.');

      await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: `B2C DX: Applying ${label}`},
        async (progress) => {
          if (plan.actions.length > 0) {
            progress.report({message: 'Updating the attribute definition...'});
            await runWithSafety(() => applyObjectTypeSync(client, plan), `Update ${label}?`);
          }
          if (plan.importRequired.length > 0) {
            progress.report({message: 'Importing enum and default values...'});
            await runWithSafety(
              () => importObjectTypeExtensions(instance!, plan.importRequired),
              `Import values for ${label}?`,
            );
          }
        },
      );

      // Show what the instance now has, which may differ from what was typed (ignored fields).
      const saved = await client.getAttributeDefinition(objectType, id, {includeValues: true});
      this.store(uri, render(saved));
      this._onDidChangeFile.fire([{type: vscode.FileChangeType.Changed, uri}]);
      this.treeProvider.invalidate(objectType);
      vscode.window.showInformationMessage(`B2C DX: Applied changes to ${label}.`);
    } catch (error) {
      if (error instanceof vscode.FileSystemError) throw error;
      await this.showJobLog(error);
      this.log.appendLine(`[Object Types] Saving ${label} failed: ${String(error)}`);
      throw vscode.FileSystemError.Unavailable(describeObjectTypesError(error, objectType).message);
    }
  }

  readDirectory(): [string, vscode.FileType][] {
    return [];
  }

  createDirectory(): never {
    throw vscode.FileSystemError.NoPermissions('Attribute definitions are managed on the instance');
  }

  delete(): never {
    throw vscode.FileSystemError.NoPermissions('Attribute definitions are managed on the instance');
  }

  rename(): never {
    throw vscode.FileSystemError.NoPermissions('Attribute IDs cannot be renamed');
  }

  private store(uri: vscode.Uri, content: Uint8Array): void {
    this.contents.set(uri.toString(), content);
    this.mtimes.set(uri.toString(), Date.now());
  }

  private async showJobLog(error: unknown): Promise<void> {
    const instance = this.configProvider.getInstance();
    if (!(error instanceof JobExecutionError) || !instance || !error.execution.is_log_file_existing) return;
    try {
      await openJobLog(error.execution.id ?? 'import', await getJobLog(instance, error.execution));
    } catch {
      // The save error is still reported.
    }
  }
}
