/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {PropfindEntry} from '@salesforce/b2c-tooling-sdk/clients';
import {updateInstanceConfig, type ResolvedB2CConfig} from '@salesforce/b2c-tooling-sdk/config';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import * as vscode from 'vscode';

const NEW_VERSION = Symbol('new');
const SELECT_ACTION = 'Select Code Version';

/** Offers the server-only connection setup when nothing is configured yet. */
export async function showNoInstanceError(): Promise<void> {
  const action = await vscode.window.showErrorMessage(
    'B2C DX: No B2C Commerce instance configured. Connect with just the server name; you sign in to Account Manager when code is uploaded.',
    'Connect to Instance',
  );
  if (action === 'Connect to Instance') {
    await vscode.commands.executeCommand('b2c-dx.setup.connection', {serverOnly: true});
  }
}

/** Tells the user no code version is set and offers the picker. */
export function showNoCodeVersionMessage(message = 'B2C DX: Choose a code version to upload cartridges to.'): void {
  void vscode.window.showWarningMessage(message, SELECT_ACTION).then((action) => {
    if (action === SELECT_ACTION) void vscode.commands.executeCommand('b2c-dx.codeSync.selectCodeVersion');
  });
}

/** Code version names from a depth-1 PROPFIND of `Cartridges` (the folder itself excluded). */
export function codeVersionsFromPropfind(entries: PropfindEntry[]): string[] {
  return entries
    .filter((e) => e.isCollection && e.displayName && e.displayName !== 'Cartridges')
    .map((e) => e.displayName as string)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * The dw.json file that supplied the instance hostname, so a chosen code
 * version lands next to it. Undefined when the hostname came from elsewhere
 * (environment variables, the global config).
 */
export function dwJsonForHostname(config: ResolvedB2CConfig): string | undefined {
  const source = config.sources.find(
    (s) => s.name === 'DwJsonSource' && s.scope !== 'global' && s.fields.includes('hostname'),
  );
  return source?.location;
}

/**
 * Lets the user choose the code version that code sync uploads to. Versions
 * are listed over WebDAV, so this works with only a browser login; no API
 * client is needed. Returns the chosen version, or undefined if cancelled.
 */
export async function pickCodeVersion(instance: B2CInstance): Promise<string | undefined> {
  const versions = await vscode.window.withProgress(
    {location: vscode.ProgressLocation.Notification, title: 'B2C DX: Listing code versions...'},
    async () => codeVersionsFromPropfind(await instance.webdav.propfind('Cartridges', '1')),
  );
  const current = instance.config.codeVersion;
  const items: (vscode.QuickPickItem & {version: string | typeof NEW_VERSION})[] = [
    ...versions.map((v) => ({label: v, description: v === current ? 'Current' : undefined, version: v})),
    {label: '$(add) New code version...', version: NEW_VERSION},
  ];
  const picked = await vscode.window.showQuickPick(items, {
    title: 'Code Version for Uploads',
    placeHolder: 'Choose the code version that code sync uploads cartridges to',
    ignoreFocusOut: true,
  });
  if (!picked) return undefined;
  if (picked.version !== NEW_VERSION) return picked.version;

  const name = await vscode.window.showInputBox({
    title: 'New Code Version',
    prompt: 'Created on the instance with the first upload',
    placeHolder: 'version1',
    ignoreFocusOut: true,
    validateInput: (v) => (/^[A-Za-z0-9_.-]+$/.test(v.trim()) ? null : 'Letters, digits, dot, dash, underscore only'),
  });
  return name?.trim() || undefined;
}

/**
 * Saves `codeVersion` to the dw.json entry that configures the instance.
 * Returns the file path, or undefined when there is no such dw.json.
 */
export async function saveCodeVersion(config: ResolvedB2CConfig, codeVersion: string): Promise<string | undefined> {
  const dwJsonPath = dwJsonForHostname(config);
  if (!dwJsonPath) return undefined;
  const {path} = await updateInstanceConfig({codeVersion}, {path: dwJsonPath, instance: config.values.instanceName});
  return path;
}
