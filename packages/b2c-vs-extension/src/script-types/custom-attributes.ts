/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {existsSync} from 'node:fs';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {ObjectTypesClient, generateCustomAttributeTypes} from '@salesforce/b2c-tooling-sdk/operations/object-types';

import type {B2CExtensionConfig} from '../config-provider.js';
import {resolveApiBrowserTenantId} from '../api-browser/tenant.js';

/** Project-relative location used by the write-to-project command and `b2c setup ide vscode-types`. */
export const PROJECT_TYPES_FILE = path.join('.b2c-script-types', 'custom-attributes.d.ts');

export interface CustomAttributeTypesTarget {
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
  return {shortCode, tenantId, hostname: config.values.hostname};
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

/** Absolute path of the project declarations file. */
export function projectFilePath(configProvider: B2CExtensionConfig): string {
  return path.join(configProvider.getWorkingDirectory(), PROJECT_TYPES_FILE);
}

/** The project declarations file, if one was written by the command or the CLI. */
export function projectFile(configProvider: B2CExtensionConfig): string | undefined {
  const file = projectFilePath(configProvider);
  return existsSync(file) ? file : undefined;
}
