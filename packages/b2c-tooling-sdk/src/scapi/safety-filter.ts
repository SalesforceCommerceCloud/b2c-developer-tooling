/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {isOperationAlwaysBlocked, type SafetyConfig} from '../safety/index.js';
import {SCAPI_METHODS, scapiFullPath, type ApiDocument, type ScapiSchemaDocument} from './catalog.js';

/**
 * Whether a safety config blocks every call to one schema operation. The path is
 * the operation's full template (`/product/products/v1/organizations/{organizationId}/products/{id}`),
 * with `{organizationId}` replaced when `organizationId` is given.
 */
export function isScapiOperationBlocked(
  safety: SafetyConfig,
  document: ScapiSchemaDocument,
  method: string,
  path: string,
  operationId?: string,
  organizationId?: string,
): boolean {
  const fullPath = scapiFullPath(document, path);
  return isOperationAlwaysBlocked(safety, {
    type: 'http',
    method: method.toUpperCase(),
    path: organizationId ? fullPath.replaceAll('{organizationId}', organizationId) : fullPath,
    operationId,
    api: document.entry.id,
  });
}

/**
 * Remove operations that `safety` always blocks, so search results and
 * `spec.paths` show only operations a program can call. Operations whose
 * outcome is `confirm` stay. APIs left with no operations are dropped.
 * Returns `documents` unchanged when `safety` is undefined.
 */
export function filterScapiDocumentsBySafety(
  documents: ScapiSchemaDocument[],
  safety?: SafetyConfig,
  organizationId?: string,
): ScapiSchemaDocument[] {
  if (!safety) return documents;
  return documents.flatMap((document) => {
    const paths: ApiDocument = {};
    let kept = 0;
    let removed = 0;
    for (const [path, item] of Object.entries(document.schema.paths ?? {}) as [string, ApiDocument][]) {
      const selected: ApiDocument = {...item};
      let count = 0;
      for (const method of SCAPI_METHODS) {
        const operation = item[method];
        if (!operation) continue;
        if (isScapiOperationBlocked(safety, document, method, path, operation.operationId, organizationId)) {
          delete selected[method];
          removed++;
        } else {
          count++;
        }
      }
      if (count) {
        paths[path] = selected;
        kept += count;
      }
    }
    if (!removed) return [document];
    return kept ? [{...document, schema: {...document.schema, paths}}] : [];
  });
}
