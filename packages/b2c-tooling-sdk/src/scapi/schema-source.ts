/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {SchemaListItem} from '../clients/scapi-schemas.js';
import {loadScapiSchemas, type ApiDocument, type ScapiSchemaDocument} from './catalog.js';

/**
 * Sections the Schemas API can add to a contract through its `expand` query parameter.
 *
 * Without `expand` a contract has no operation summaries or descriptions, no examples, and no tenant custom
 * properties. `all` is a superset of every other value.
 */
export const SCAPI_SCHEMA_EXPANSIONS = [
  'all',
  'custom_properties',
  'descriptions',
  'examples',
  'external_docs',
  'summaries',
  'tags',
  'titles',
] as const;

export type ScapiSchemaExpansion = (typeof SCAPI_SCHEMA_EXPANSIONS)[number];

/**
 * Validate expansion names and join them the way the Schemas API expects: one `expand` value, separated by
 * commas (semicolons are accepted when parsing). The API rejects a repeated `expand` parameter.
 *
 * @returns The canonical value, or undefined when nothing is requested.
 * @throws When a name is not a known expansion.
 */
export function normalizeScapiSchemaExpand(input: string | readonly string[] | undefined): string | undefined {
  const names = (Array.isArray(input) ? input : [input ?? ''])
    .flatMap((value) => String(value).split(/[,;]/))
    .map((value) => value.trim())
    .filter(Boolean);
  const unknown = names.filter((name) => !(SCAPI_SCHEMA_EXPANSIONS as readonly string[]).includes(name));
  if (unknown.length > 0)
    throw new Error(
      `Unknown schema expansion ${unknown.map((name) => `"${name}"`).join(', ')}. Valid values: ${SCAPI_SCHEMA_EXPANSIONS.join(', ')}.`,
    );
  if (names.includes('all')) return 'all';
  const unique = SCAPI_SCHEMA_EXPANSIONS.filter((name) => names.includes(name));
  return unique.length > 0 ? unique.join(',') : undefined;
}

/**
 * Every section except tenant custom properties. The distributable bundled corpus is built with this, so it
 * carries the full prose and examples but nothing specific to one tenant.
 */
export const SCAPI_STANDARD_SCHEMA_EXPAND = 'descriptions,examples,external_docs,summaries,tags,titles';

/** Whether an `expand` value requests a section; `all` includes every section. */
export function scapiExpandIncludes(expand: string | undefined, section: ScapiSchemaExpansion): boolean {
  const names = (expand ?? '').split(/[,;]/).map((value) => value.trim());
  return names.includes('all') || names.includes(section);
}

/** Whether the contract carries tenant custom properties and operation prose, so it can serve code mode. */
export function isFullScapiExpand(expand: string | undefined): boolean {
  return (
    scapiExpandIncludes(expand, 'custom_properties') &&
    scapiExpandIncludes(expand, 'summaries') &&
    scapiExpandIncludes(expand, 'descriptions')
  );
}

/** What a caller will do with a contract; used to ask the server for only that much. */
export interface ScapiSchemaNeeds {
  /** The whole contract: every section (`all`). Overrides the other needs. */
  full?: boolean;
  /** Operation, parameter and schema prose (`summaries`, `descriptions`, `titles`). */
  prose?: boolean;
  /** Request and response examples. */
  examples?: boolean;
  /** Tenant custom properties (`c_*` attributes). */
  customProperties?: boolean;
}

/**
 * Smallest `expand` value that satisfies what the caller will use, so outline-only reads stay small.
 *
 * @returns The `expand` value, or undefined when no section is needed.
 */
export function scapiSchemaExpandFor(needs: ScapiSchemaNeeds): string | undefined {
  if (needs.full) return 'all';
  const names: ScapiSchemaExpansion[] = [];
  if (needs.customProperties) names.push('custom_properties');
  if (needs.prose) names.push('summaries', 'descriptions', 'titles');
  if (needs.examples) names.push('examples');
  return normalizeScapiSchemaExpand(names);
}

export interface ScapiSchemaIdentity {
  apiFamily: string;
  apiName: string;
  apiVersion: string;
}

/** Find a standard contract in the bundled corpus. */
export function findBundledScapiSchema(identity: ScapiSchemaIdentity): ScapiSchemaDocument | undefined {
  const id = `${identity.apiFamily}/${identity.apiName}/${identity.apiVersion}`;
  return loadScapiSchemas().find((document) => document.entry.id === id);
}

export interface ScapiSchemaFilter {
  apiFamily?: string;
  apiName?: string;
  apiVersion?: string;
  status?: string;
}

/** List the bundled corpus in the Schemas API listing shape, applying the same filters. */
export function listBundledScapiSchemas(filter: ScapiSchemaFilter = {}): SchemaListItem[] {
  return loadScapiSchemas()
    .filter(
      ({entry}) =>
        (!filter.apiFamily || entry.apiFamily === filter.apiFamily) &&
        (!filter.apiName || entry.apiName === filter.apiName) &&
        (!filter.apiVersion || entry.apiVersion === filter.apiVersion) &&
        (!filter.status || entry.status === filter.status),
    )
    .map(({entry}) => ({
      schemaVersion: entry.schemaVersion,
      apiFamily: entry.apiFamily,
      apiName: entry.apiName,
      apiVersion: entry.apiVersion,
      status: entry.status as SchemaListItem['status'],
    }));
}

/** Where a contract or listing came from. */
export type ScapiSchemaSource = 'live' | 'bundled';

export interface ScapiSchemaFetchResult {
  schema: ApiDocument;
  source: ScapiSchemaSource;
  /** Set when `source` is `bundled` because the live fetch failed. */
  warning?: string;
}

export interface ScapiSchemaListFetchResult {
  schemas: SchemaListItem[];
  total: number;
  source: ScapiSchemaSource;
  warning?: string;
}

function reason(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).replaceAll(/\s+/g, ' ').trim().slice(0, 300);
}

const BUNDLED_LIMITS =
  'The bundled corpus has the standard SCAPI contracts only: no tenant custom properties or custom APIs, and it may be older than your tenant.';

/**
 * Fetch one contract live, falling back to the bundled corpus when the live fetch fails (missing
 * configuration or credentials, no access, network or server errors).
 *
 * The bundled contract always carries the full prose and examples, regardless of the requested expansion.
 * Custom APIs exist only on the tenant, so their failure is rethrown. Abort errors are never swallowed.
 *
 * @param identity - API family, name and version
 * @param fetchLive - Fetches the contract, building the client lazily so configuration errors fall back too
 * @param signal - Abort signal; an aborted request throws instead of falling back
 */
export async function fetchScapiSchemaWithFallback(
  identity: ScapiSchemaIdentity,
  fetchLive: () => Promise<ApiDocument>,
  signal?: AbortSignal,
): Promise<ScapiSchemaFetchResult> {
  try {
    return {schema: await fetchLive(), source: 'live'};
  } catch (error) {
    if (signal?.aborted) throw error;
    const bundled = findBundledScapiSchema(identity);
    if (!bundled) throw error;
    return {
      schema: bundled.schema,
      source: 'bundled',
      warning:
        `Live schema unavailable (${reason(error)}). Showing the bundled ${bundled.entry.id} contract ` +
        `(schema ${bundled.entry.schemaVersion}). ${BUNDLED_LIMITS}`,
    };
  }
}

/** List schemas live, falling back to the bundled corpus (with the same filters) when the live listing fails. */
export async function listScapiSchemasWithFallback(
  filter: ScapiSchemaFilter,
  fetchLive: () => Promise<{schemas: SchemaListItem[]; total: number}>,
  signal?: AbortSignal,
): Promise<ScapiSchemaListFetchResult> {
  try {
    return {...(await fetchLive()), source: 'live'};
  } catch (error) {
    if (signal?.aborted) throw error;
    const schemas = listBundledScapiSchemas(filter);
    return {
      schemas,
      total: schemas.length,
      source: 'bundled',
      warning: `Live schema listing unavailable (${reason(error)}). Listing the bundled corpus. ${BUNDLED_LIMITS}`,
    };
  }
}
