/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {SchemaListItem} from '@salesforce/b2c-tooling-sdk/clients';
import type {ScapiSchemaSource} from '@salesforce/b2c-tooling-sdk/scapi';

/**
 * The Schemas API `expand` value the API Browser always requests. Swagger UI renders the whole contract, so it
 * needs every section (summaries, descriptions, examples, tags, titles, external docs) and the tenant's custom
 * properties.
 */
export const API_BROWSER_EXPAND = 'all';

/** Status shown in the webview token bar while a bundled (offline) contract is displayed. */
export const OFFLINE_TOKEN_STATUS = 'Offline: bundled schema – Try it out disabled';

/** Shown in the tree view when the API list came from the bundled corpus. */
export const OFFLINE_TREE_MESSAGE =
  'Offline: showing bundled SCAPI schemas because the live Schemas API is unavailable. Custom APIs and tenant custom properties are not shown, and Try it out is disabled.';

export const CUSTOM_API_OFFLINE_MESSAGE =
  'Custom APIs exist only on your instance and cannot be shown offline. Fix the connection (see Setup Help) and refresh the API list.';

/** Minimal API identity used by the tree and the Swagger panel. */
export interface ApiBrowserSchemaEntry {
  apiFamily: string;
  apiName: string;
  apiVersion: string;
  status?: 'current' | 'deprecated';
}

/** Normalize Schemas API listing items (live or bundled) for the tree. */
export function toSchemaEntries(items: readonly SchemaListItem[]): ApiBrowserSchemaEntry[] {
  return items.map((item) => ({
    apiFamily: item.apiFamily ?? '',
    apiName: item.apiName ?? '',
    apiVersion: item.apiVersion ?? 'v1',
    status: item.status as ApiBrowserSchemaEntry['status'],
  }));
}

/**
 * Bundled contracts are shared, cached objects; the panel mutates the spec (servers, prefill, org path), so
 * hand it a private copy.
 */
export function cloneBundledSpec<T extends Record<string, unknown>>(spec: T): T {
  return structuredClone(spec);
}

/** Live auth and Try it out are only available for contracts that came from the tenant. */
export function isLiveSource(source: ScapiSchemaSource): boolean {
  return source === 'live';
}

/**
 * Decide whether to raise the one-time offline warning. A successful live load re-arms it, so a later outage
 * is announced again but a refresh loop is not.
 */
export class OfflineWarningGate {
  private warned = false;

  /** Returns true the first time an offline state is seen since the last live success. */
  shouldWarn(source: ScapiSchemaSource): boolean {
    if (isLiveSource(source)) {
      this.warned = false;
      return false;
    }
    if (this.warned) return false;
    this.warned = true;
    return true;
  }
}
