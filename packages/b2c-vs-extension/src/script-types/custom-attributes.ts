/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import {mkdir, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {findAuthSession, isAuthSessionTokenValid} from '@salesforce/b2c-tooling-sdk/auth';
import {ObjectTypesClient, generateCustomAttributeTypes} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import * as vscode from 'vscode';

import type {B2CExtensionConfig} from '../config-provider.js';
import {resolveApiBrowserTenantId} from '../api-browser/tenant.js';

/** Project-relative location used by the write-to-project command and `b2c setup ide vscode-types`. */
export const PROJECT_TYPES_FILE = path.join('.b2c-script-types', 'custom-attributes.d.ts');

/** Regenerate the background copy when it is older than this. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface CustomAttributeTypesTarget {
  /** Key for the background copy: one file per instance. */
  key: string;
  shortCode: string;
  tenantId: string;
  hostname?: string;
}

/** Identifies the instance custom attribute types are generated from, or explains why there is none. */
export function resolveTarget(configProvider: B2CExtensionConfig): CustomAttributeTypesTarget | string {
  const config = configProvider.getConfig();
  if (!config) return 'No B2C Commerce configuration found.';
  if (!config.hasOAuthConfig()) return 'Account Manager API client (client-id) is not configured.';
  const shortCode = config.values.shortCode;
  if (!shortCode) return 'short-code is not configured.';
  const tenantId = resolveApiBrowserTenantId(config.values);
  if (!tenantId) return 'tenant-id is not configured.';
  const key = createHash('sha256')
    .update(`${tenantId}|${shortCode}|${config.values.clientId}`)
    .digest('hex')
    .slice(0, 16);
  return {key, shortCode, tenantId, hostname: config.values.hostname};
}

/**
 * Whether generation can run without user interaction: an API client secret,
 * or a stored browser login that has not expired. Background refresh never
 * opens a browser.
 */
export function canAuthenticateSilently(configProvider: B2CExtensionConfig): boolean {
  const config = configProvider.getConfig();
  if (!config?.values.clientId) return false;
  if (config.values.clientSecret) return true;
  const session = findAuthSession(config.values.clientId);
  return Boolean(session && isAuthSessionTokenValid(session));
}

export interface GenerateOutcome {
  file: string;
  objectTypes: number;
  attributes: number;
  valuesIncluded: boolean;
  warnings: string[];
}

/** Generates the declarations for the configured instance and writes them to `file`. */
export async function generateTo(
  configProvider: B2CExtensionConfig,
  target: CustomAttributeTypesTarget,
  file: string,
): Promise<GenerateOutcome> {
  const config = configProvider.getConfig();
  if (!config) throw new Error('No B2C Commerce configuration found.');
  const auth = config.createOAuth(await configProvider.getUserAuthOptions());
  const client = new ObjectTypesClient({shortCode: target.shortCode, tenantId: target.tenantId, auth});
  const result = await generateCustomAttributeTypes(client, {
    header: target.hostname ? `Instance: ${target.hostname}` : undefined,
  });
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, result.content, 'utf8');
  return {
    file,
    objectTypes: result.objectTypes.length,
    attributes: result.objectTypes.reduce((sum, type) => sum + type.attributes, 0),
    valuesIncluded: result.valuesIncluded,
    warnings: result.warnings,
  };
}

/** Background copy of the declarations for an instance, under the extension's storage. */
export function storageFile(context: vscode.ExtensionContext, target: CustomAttributeTypesTarget): string {
  const base = context.storageUri ?? context.globalStorageUri;
  return path.join(base.fsPath, 'custom-attributes', `${target.key}.d.ts`);
}

export async function isStale(file: string): Promise<boolean> {
  try {
    const info = await stat(file);
    return Date.now() - info.mtimeMs > MAX_AGE_MS;
  } catch {
    return true;
  }
}

/** The project copy, if one was written by the command or the CLI. */
export function projectFile(configProvider: B2CExtensionConfig): string | undefined {
  const file = path.join(configProvider.getWorkingDirectory(), PROJECT_TYPES_FILE);
  return existsSync(file) ? file : undefined;
}
