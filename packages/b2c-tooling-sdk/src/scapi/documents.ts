/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {ScapiSchemasClient} from '../clients/scapi-schemas.js';
import {loadScapiSchemas, type ScapiSchemaDocument} from './catalog.js';
import {
  ScapiLiveSchemaCache,
  matchesScapiApi,
  mergeScapiSchemas,
  scapiTenantKey,
  suggestScapiApis,
  type ScapiLiveSchemaLoadResult,
} from './live.js';

/** A tenant whose live contracts can be fetched from the SCAPI Schemas API. */
export interface ScapiLiveSchemaTenant {
  client: ScapiSchemasClient;
  shortCode: string;
  /** `f_ecom_...` organization ID. */
  organizationId: string;
}

/**
 * A tenant whose live contracts can be fetched. `tenant` may be a function, so
 * missing configuration or credentials fall back to bundled contracts like any
 * other live-loading failure.
 */
export interface ScapiLiveSchemaSource {
  tenant: ScapiLiveSchemaTenant | (() => ScapiLiveSchemaTenant | Promise<ScapiLiveSchemaTenant>);
  /** Shared cache; reuse one per process so contracts persist across calls. */
  cache: ScapiLiveSchemaCache;
}

export interface ResolveScapiDocumentsOptions {
  /** Limit to an API family, family/name or family/name/version. */
  api?: string;
  /** Fetch the tenant's contracts (custom APIs, `c_*` properties); falls back to bundled ones on failure. */
  live?: ScapiLiveSchemaSource;
  /** With `live`, refetch instead of using the cache. */
  refresh?: boolean;
  /** Developer contracts; replace bundled and live contracts with the same ID. */
  local?: readonly ScapiSchemaDocument[];
  /** Bundled contracts. Defaults to {@link loadScapiSchemas}. */
  bundled?: readonly ScapiSchemaDocument[];
  signal?: AbortSignal;
}

export interface ResolvedScapiDocuments {
  documents: ScapiSchemaDocument[];
  source: 'bundled' | 'live';
  /** Why live contracts were not used. */
  warnings: string[];
  /** Live APIs whose contract could not be fetched. */
  failures: ScapiLiveSchemaLoadResult['failures'];
}

/** Thrown when `api` matches no known contract; `suggestions` lists close API IDs. */
export class ScapiUnknownApiError extends Error {
  constructor(
    message: string,
    readonly suggestions: string[],
  ) {
    super(`${message}${suggestions.length > 0 ? ` Close matches: ${suggestions.join(', ')}.` : ''}`);
    this.name = 'ScapiUnknownApiError';
  }
}

/**
 * The contracts a SCAPI search or code-mode program should see: bundled contracts,
 * replaced by the tenant's live contracts when `live` is given, replaced by `local`
 * contracts. When live loading fails (missing access, network), returns the bundled
 * contracts with a warning, except for `custom` APIs, which exist only on the tenant.
 *
 * @example
 * ```typescript
 * const cache = new ScapiLiveSchemaCache();
 * const {documents, warnings} = await resolveScapiDocuments({
 *   api: 'product',
 *   live: {tenant: {client: schemasClient, shortCode: 'abc123', organizationId: 'f_ecom_zzzz_001'}, cache},
 * });
 * const hits = searchScapiOperations(documents, 'update product');
 * ```
 */
export async function resolveScapiDocuments(
  options: ResolveScapiDocumentsOptions = {},
): Promise<ResolvedScapiDocuments> {
  const {api, live, signal} = options;
  const local = (options.local ?? []).filter((document) => matchesScapiApi(document.entry.id, api));
  const bundledAll = () => mergeScapiSchemas(options.bundled ?? loadScapiSchemas(), [], options.local ?? []);
  const unknown = (message: string, known: readonly ScapiSchemaDocument[]) =>
    new ScapiUnknownApiError(
      message,
      suggestScapiApis(
        known.map((document) => document.entry.id),
        api!,
      ),
    );
  const bundled = (): ScapiSchemaDocument[] => {
    const all = bundledAll();
    const selected = all.filter((document) => matchesScapiApi(document.entry.id, api));
    if (selected.length === 0)
      throw unknown(
        'Unknown schema ID. Omit api to discover available APIs, or use live schemas for tenant and custom APIs.',
        all,
      );
    return selected;
  };
  if (!live) return {documents: bundled(), source: 'bundled', warnings: [], failures: []};
  let tenant: string | undefined;
  try {
    const target = typeof live.tenant === 'function' ? await live.tenant() : live.tenant;
    tenant = scapiTenantKey(target.shortCode, target.organizationId);
    const loaded = await live.cache.load(tenant, target.client, target.organizationId, {
      api,
      refresh: options.refresh,
      signal,
    });
    const documents = mergeScapiSchemas([], loaded.documents, local);
    if (documents.length === 0 && loaded.failures.length === 0 && api)
      throw unknown(
        'Unknown schema ID for this tenant. Omit api to discover available APIs.',
        mergeScapiSchemas(options.bundled ?? loadScapiSchemas(), live.cache.get(tenant!), options.local ?? []),
      );
    return {documents, source: 'live', warnings: [], failures: loaded.failures};
  } catch (error) {
    // Custom APIs exist only on the tenant; an unknown ID is a caller error, not an access problem.
    if (signal?.aborted || error instanceof ScapiUnknownApiError || api?.split('/')[0].toLowerCase() === 'custom')
      throw error;
    const message = error instanceof Error ? error.message : String(error);
    return {
      documents: bundled(),
      source: 'bundled',
      warnings: [
        `Live schemas unavailable (${message.replaceAll(/\s+/g, ' ').trim().slice(0, 300)}). Searching the bundled standard contracts instead: no tenant c_* properties or custom APIs, and they may be older than your tenant.`,
      ],
      failures: [],
    };
  }
}
