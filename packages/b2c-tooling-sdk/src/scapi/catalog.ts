/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, resolve, sep} from 'node:path';

/** OpenAPI documents are dynamic JSON; no generated client type is required. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiDocument = Record<string, any>;
export interface ScapiSchemaEntry {
  id: string;
  apiFamily: string;
  apiName: string;
  apiVersion: string;
  schemaVersion: string;
  status: string;
  file: string;
  source: string;
}
export interface ScapiSchemaDocument {
  entry: ScapiSchemaEntry;
  schema: ApiDocument;
}
let bundled: ScapiSchemaDocument[] | undefined;

/** Load the versioned, language-neutral corpus without network or configuration. */
export function loadScapiSchemas(): ScapiSchemaDocument[] {
  if (bundled) return bundled;
  const require = createRequire(import.meta.url);
  const manifestFile = require.resolve('@salesforce/b2c-api-schemas/manifest.json');
  const root = dirname(manifestFile);
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8')) as {
    formatVersion: number;
    schemas: ScapiSchemaEntry[];
  };
  if (manifest.formatVersion !== 1) throw new Error('Unsupported SCAPI schema manifest.');
  bundled = manifest.schemas.map((entry) => {
    const file = resolve(root, entry.file);
    if (!file.startsWith(root + sep)) throw new Error('Invalid bundled schema path.');
    return {entry, schema: JSON.parse(readFileSync(file, 'utf8')) as ApiDocument};
  });
  return bundled;
}

export const SCAPI_METHODS = ['get', 'head', 'post', 'put', 'patch', 'delete', 'options'] as const;

/** Match an actual API path to its schema, ignoring untrusted schema server origins. */
export function findScapiOperation(documents: ScapiSchemaDocument[], method: string, path: string) {
  for (const document of documents) {
    const base = `/${document.entry.id}`;
    if (!path.startsWith(base + '/')) continue;
    for (const [template, item] of Object.entries(document.schema.paths ?? {}) as [string, ApiDocument][]) {
      const operation = item[method.toLowerCase()];
      if (!operation) continue;
      const actual = path.slice(base.length).split('/');
      const operationPath =
        document.entry.apiFamily === 'custom' ? `/organizations/{organizationId}${template}` : template;
      const expected = operationPath.split('/');
      if (actual.length !== expected.length) continue;
      const parameters: Record<string, string> = {};
      const match = expected.every((part, index) => {
        if (part.startsWith('{') && part.endsWith('}')) {
          parameters[part.slice(1, -1)] = decodeURIComponent(actual[index]);
          return actual[index].length > 0;
        }
        return part === actual[index];
      });
      if (match)
        return {
          document,
          operation: operation as ApiDocument,
          pathItem: item,
          template: base + operationPath,
          parameters,
        };
    }
  }
  throw new Error(`SCAPI_OPERATION_NOT_FOUND: ${method} ${path}. Search the schema before calling.`);
}

/** Resolve one local reference for request contract inspection. */
export function resolveScapiReference(value: ApiDocument, schema: ApiDocument): ApiDocument {
  const visited = new Set<string>();
  while (typeof value?.$ref === 'string') {
    const ref = value.$ref as string;
    if (!ref.startsWith('#/') || visited.has(ref)) throw new Error(`Unsupported schema reference: ${ref}`);
    visited.add(ref);
    value = ref
      .slice(2)
      .split('/')
      .reduce((parent: ApiDocument, key: string) => parent?.[key.replaceAll('~1', '/').replaceAll('~0', '~')], schema);
    if (!value) throw new Error(`Missing schema reference: ${ref}`);
  }
  return value;
}
