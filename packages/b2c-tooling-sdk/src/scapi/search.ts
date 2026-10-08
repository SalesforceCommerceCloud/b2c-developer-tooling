/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {createRankedIndex} from '../search/ranking.js';
import {SCAPI_METHODS, type ApiDocument, type ScapiSchemaDocument} from './catalog.js';

/** One ranked operation; `path` and `method` index `spec.paths` directly. */
export interface ScapiOperationMatch {
  api: string;
  method: string;
  path: string;
  operationId?: string;
  summary?: string;
  score: number;
  /** Older versions of the same API that declare this operation; only the newest is returned. */
  otherVersions?: string[];
}

export interface ScapiOperationSearchOptions {
  /** Maximum matches to return. Defaults to 10, capped at 50. */
  limit?: number;
}

interface IndexedOperation {
  api: string;
  method: string;
  path: string;
  operationId?: string;
  summary?: string;
  description: string;
  tags: string[];
  apiVersion: string;
  otherVersions: string[];
}

/** Code-mode paths are prefixed with the API id; custom API contracts omit their organization segment. */
export function scapiFullPath(document: ScapiSchemaDocument, path: string): string {
  return `/${document.entry.id}${document.entry.apiFamily === 'custom' ? '/organizations/{organizationId}' : ''}${path}`;
}

const words = (value: string) =>
  value
    .replaceAll(/([a-z\d])([A-Z])/g, '$1 $2')
    .replaceAll(/[{}/_.-]+/g, ' ')
    .trim();

// Some summaries run to paragraphs; spec.paths keeps the full text.
const brief = (value: string) => {
  const text = value.replaceAll(/\s+/g, ' ').trim();
  return text.length > 200 ? `${text.slice(0, 199)}…` : text;
};

const versionNumber = (version: string) => Number.parseInt(version.replaceAll(/\D+/g, ''), 10) || 0;

/**
 * Rank operations by summary, operationId, tags, path and description so prose such as "gift certificate balance"
 * finds operations a regex over ids would miss. Versions of one API collapse into the newest.
 */
export function createScapiOperationSearch(documents: readonly ScapiSchemaDocument[]) {
  const operations = new Map<string, IndexedOperation>();
  for (const document of documents) {
    const {apiFamily, apiName, apiVersion} = document.entry;
    for (const [path, item] of Object.entries(document.schema.paths ?? {}) as [string, ApiDocument][]) {
      for (const method of SCAPI_METHODS) {
        const operation = item[method];
        if (!operation) continue;
        const key = `${apiFamily}/${apiName}|${method}|${path}`;
        const existing = operations.get(key);
        if (existing && versionNumber(existing.apiVersion) >= versionNumber(apiVersion)) {
          existing.otherVersions.push(apiVersion);
          continue;
        }
        operations.set(key, {
          api: document.entry.id,
          method,
          path: scapiFullPath(document, path),
          operationId: operation.operationId,
          summary: operation.summary,
          description: operation.description ?? '',
          tags: operation.tags ?? [],
          apiVersion,
          otherVersions: existing ? [...existing.otherVersions, existing.apiVersion] : [],
        });
      }
    }
  }
  const index = createRankedIndex(
    [...operations].map(([key, operation]) => ({
      id: key,
      title: [operation.summary, operation.operationId && words(operation.operationId)].filter(Boolean).join(' '),
      headings: words(operation.path),
      keywords: [operation.operationId ?? '', ...operation.tags, words(operation.api)],
      summary: operation.description,
    })),
  );
  return (query: string, options: ScapiOperationSearchOptions = {}): ScapiOperationMatch[] => {
    const limit = Math.min(Math.max(Math.trunc(options.limit ?? 10), 1), 50);
    if (!query.trim()) return [];
    return (
      index
        // Short terms such as "get" or "id" fuzz into noise; fuzz only distinctive words.
        .search(query, {fuzzy: (term) => (term.length > 4 ? 0.2 : false)})
        .slice(0, limit)
        .map((result) => {
          const {api, method, path, operationId, summary, otherVersions} = operations.get(result.id as string)!;
          return {
            api,
            method,
            path,
            ...(operationId === undefined ? {} : {operationId}),
            ...(summary === undefined ? {} : {summary: brief(summary)}),
            score: Math.round(result.score * 100) / 100,
            ...(otherVersions.length > 0 ? {otherVersions: otherVersions.sort()} : {}),
          };
        })
    );
  };
}

/** One-off ranking over a document set; reuse {@link createScapiOperationSearch} for repeated queries. */
export function searchScapiOperations(
  documents: readonly ScapiSchemaDocument[],
  query: string,
  options?: ScapiOperationSearchOptions,
): ScapiOperationMatch[] {
  return createScapiOperationSearch(documents)(query, options);
}
