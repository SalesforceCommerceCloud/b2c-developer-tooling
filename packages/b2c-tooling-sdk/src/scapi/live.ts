/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {ScapiSchemasClient, SchemaListItem} from '../clients/scapi-schemas.js';
import type {ApiDocument, ScapiSchemaDocument} from './catalog.js';

const SCHEMAS_API = 'dx/scapi-schemas/v1';
const IDENTITY = /^[a-z0-9-]+$/i;

export interface ScapiLiveSchemaCacheOptions {
  /** Age after which discovery refetches a contract; cached contracts never expire. Defaults to 30 minutes. */
  ttlMs?: number;
  /** Concurrent schema fetches per load. Defaults to 4. */
  concurrency?: number;
}

export interface ScapiLiveSchemaLoadOptions {
  /** Limit to one API id (family/name/version). */
  api?: string;
  /** Ignore cached listing and contracts. */
  refresh?: boolean;
  signal?: AbortSignal;
}

export interface ScapiLiveSchemaLoadResult {
  documents: ScapiSchemaDocument[];
  /** APIs listed by the tenant whose contract could not be fetched. */
  failures: Array<{api: string; error: string}>;
}

/** Identify a tenant's live contracts; schemas differ by custom attributes and custom APIs. */
export function scapiTenantKey(shortCode: string, organizationId: string): string {
  return `${shortCode.toLowerCase()}/${organizationId.toLowerCase()}`;
}

/** Validate a Schemas API response and describe it as a catalog document. */
export function createLiveScapiDocument(
  identity: {apiFamily: string; apiName: string; apiVersion: string; status?: string},
  schema: unknown,
): ScapiSchemaDocument {
  const {apiFamily, apiName, apiVersion} = identity;
  if (![apiFamily, apiName, apiVersion].every((part) => typeof part === 'string' && IDENTITY.test(part)))
    throw new Error('SCAPI_SCHEMA_INVALID: invalid schema identity.');
  const document = schema as ApiDocument | null;
  if (
    !document ||
    typeof document !== 'object' ||
    !/^3\./.test(document.openapi) ||
    !document.paths ||
    typeof document.paths !== 'object' ||
    Array.isArray(document.paths)
  )
    throw new Error('SCAPI_SCHEMA_INVALID: Expected an OpenAPI 3 contract with paths from the Schemas API.');
  const id = `${apiFamily}/${apiName}/${apiVersion}`;
  return {
    entry: {
      id,
      apiFamily,
      apiName,
      apiVersion,
      schemaVersion: document.info?.version ?? apiVersion,
      status: identity.status ?? 'live',
      file: '',
      source: `https://{shortCode}.api.commercecloud.salesforce.com/${SCHEMAS_API}/organizations/{organizationId}/schemas/${id}`,
      origin: 'live',
    },
    schema: document,
  };
}

/** Bundled contracts, replaced by live contracts, replaced by local contracts with the same id. */
export function mergeScapiSchemas(
  bundled: readonly ScapiSchemaDocument[],
  live: readonly ScapiSchemaDocument[],
  local: readonly ScapiSchemaDocument[] = [],
): ScapiSchemaDocument[] {
  const byId = new Map(bundled.map((document) => [document.entry.id, document]));
  for (const document of [...live, ...local]) byId.set(document.entry.id, document);
  return [...byId.values()];
}

interface Cached<T> {
  value: T;
  at: number;
}

/**
 * Per-tenant cache of contracts from the SCAPI Schemas API, including tenant custom
 * properties and custom APIs. Discovery loads it; execution reuses whatever it holds.
 */
export class ScapiLiveSchemaCache {
  private readonly concurrency: number;
  private readonly documents = new Map<string, Map<string, Cached<ScapiSchemaDocument>>>();
  private readonly listings = new Map<string, Cached<SchemaListItem[]>>();
  private readonly ttlMs: number;

  constructor(options: ScapiLiveSchemaCacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? 30 * 60_000;
    this.concurrency = Math.max(1, options.concurrency ?? 4);
  }

  /** All cached live contracts for a tenant, regardless of age. Never fetches. */
  get(tenant: string): ScapiSchemaDocument[] {
    return [...(this.documents.get(tenant)?.values() ?? [])].map((cached) => cached.value);
  }

  /** Fetch the tenant's listing and missing or expired contracts, then return the selected set. */
  async load(
    tenant: string,
    client: ScapiSchemasClient,
    organizationId: string,
    options: ScapiLiveSchemaLoadOptions = {},
  ): Promise<ScapiLiveSchemaLoadResult> {
    const listing = await this.list(tenant, client, organizationId, options);
    const selected = listing.filter(
      (item) => !options.api || `${item.apiFamily}/${item.apiName}/${item.apiVersion}` === options.api,
    );
    const cached = this.documents.get(tenant) ?? new Map<string, Cached<ScapiSchemaDocument>>();
    this.documents.set(tenant, cached);
    const now = Date.now();
    const documents: ScapiSchemaDocument[] = [];
    const failures: ScapiLiveSchemaLoadResult['failures'] = [];
    const pending = selected.filter((item) => {
      const hit = cached.get(`${item.apiFamily}/${item.apiName}/${item.apiVersion}`);
      if (!options.refresh && hit && now - hit.at < this.ttlMs) {
        documents.push(hit.value);
        return false;
      }
      return true;
    });
    const fetchOne = async (item: SchemaListItem) => {
      const api = `${item.apiFamily}/${item.apiName}/${item.apiVersion}`;
      try {
        options.signal?.throwIfAborted();
        const {data, error, response} = await client.GET(
          '/organizations/{organizationId}/schemas/{apiFamily}/{apiName}/{apiVersion}',
          {
            params: {
              path: {organizationId, apiFamily: item.apiFamily!, apiName: item.apiName!, apiVersion: item.apiVersion!},
              query: {expand: 'custom_properties'},
            },
            signal: options.signal,
          },
        );
        if (error) throw new Error(`HTTP ${response.status}`);
        const document = createLiveScapiDocument(
          {apiFamily: item.apiFamily!, apiName: item.apiName!, apiVersion: item.apiVersion!, status: item.status},
          data,
        );
        cached.set(api, {value: document, at: Date.now()});
        documents.push(document);
      } catch (error) {
        if (options.signal?.aborted) throw error;
        // A failed refetch keeps the previous contract available.
        const previous = cached.get(api);
        if (previous) documents.push(previous.value);
        failures.push({api, error: error instanceof Error ? error.message : String(error)});
      }
    };
    const queue = [...pending];
    await Promise.all(
      Array.from({length: Math.min(this.concurrency, queue.length)}, async () => {
        while (queue.length) await fetchOne(queue.shift()!);
      }),
    );
    documents.sort((a, b) => a.entry.id.localeCompare(b.entry.id, 'en'));
    return {documents, failures};
  }

  /** Record a contract fetched elsewhere (for example by scapi_schemas_list or inside an execution). */
  put(tenant: string, document: ScapiSchemaDocument): void {
    const cached = this.documents.get(tenant) ?? new Map<string, Cached<ScapiSchemaDocument>>();
    cached.set(document.entry.id, {value: document, at: Date.now()});
    this.documents.set(tenant, cached);
  }

  private async list(
    tenant: string,
    client: ScapiSchemasClient,
    organizationId: string,
    options: ScapiLiveSchemaLoadOptions,
  ): Promise<SchemaListItem[]> {
    const hit = this.listings.get(tenant);
    if (!options.refresh && hit && Date.now() - hit.at < this.ttlMs) return hit.value;
    const {data, error, response} = await client.GET('/organizations/{organizationId}/schemas', {
      params: {path: {organizationId}},
      signal: options.signal,
    });
    if (error)
      throw new Error(
        `SCAPI_LIVE_SCHEMAS_UNAVAILABLE: Schemas API listing failed (HTTP ${response.status}). ` +
          'The API client needs sfcc.scapi-schemas; omit schemas:"live" to search bundled contracts offline.',
      );
    const items = (data?.data ?? []).filter(
      (item) =>
        item.apiFamily &&
        item.apiName &&
        item.apiVersion &&
        [item.apiFamily, item.apiName, item.apiVersion].every((part) => IDENTITY.test(part)),
    );
    this.listings.set(tenant, {value: items, at: Date.now()});
    return items;
  }
}
