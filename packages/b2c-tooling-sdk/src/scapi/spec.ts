/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {SCAPI_METHODS, scapiFullPath, type ApiDocument, type ScapiSchemaDocument} from './catalog.js';
import {matchesScapiApi} from './live.js';
import {createScapiOperationSearch, type ScapiOperationSearchOptions} from './search.js';

/** One operation as `spec.operations()` lists it; `path` and `method` are the arguments of `spec.operation()`. */
export interface ScapiSpecOperationSummary {
  api: string;
  method: string;
  path: string;
  operationId?: string;
  summary?: string;
}

const MEMBERS =
  'spec has only apis(), operations({api, method}), operation(path, method), resolve(value, api) and search(query, {limit}), all async.';

// Keys of these objects are names chosen by the API, not schema keywords, so a property called description survives.
const NAME_MAPS = new Set([
  'properties',
  'patternProperties',
  'headers',
  'content',
  'responses',
  'schemas',
  'scopes',
  'links',
  'callbacks',
  'securitySchemes',
]);
const VALUE_KEYS = new Set(['default', 'enum', 'const']);

function outline(value: unknown, nameMap = false): unknown {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => outline(item));
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!nameMap && (key === 'description' || key === 'example' || key === 'examples')) continue;
    out[key] = !nameMap && VALUE_KEYS.has(key) ? item : outline(item, !nameMap && NAME_MAPS.has(key));
  }
  return out;
}

const brief = (value: string) => {
  const text = value.replaceAll(/\s+/g, ' ').trim();
  return text.length > 200 ? `${text.slice(0, 199)}…` : text;
};

/**
 * The host side of the program's `spec` object. Every member is a host call, so a program only
 * receives the parts of the contracts it asks for, and a replay sees the answers the first run did.
 */
export function createScapiSpecHost(documents: ScapiSchemaDocument[], detail: 'full' | 'outline' = 'full') {
  const byId = new Map(documents.map((document) => [document.entry.id, document]));
  let index: Map<string, {document: ScapiSchemaDocument; path: string; item: ApiDocument}> | undefined;
  let search: ReturnType<typeof createScapiOperationSearch> | undefined;
  const paths = () => {
    if (index) return index;
    index = new Map();
    for (const document of documents)
      for (const [path, item] of Object.entries(document.schema.paths ?? {}) as [string, ApiDocument][])
        index.set(scapiFullPath(document, path), {document, path, item});
    return index;
  };
  const resolve = (value: unknown, api: string, seen = new Set<string>(), depth = 0): unknown => {
    if (depth > 20 || !value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map((item) => resolve(item, api, seen, depth + 1));
    const ref = (value as {$ref?: unknown}).$ref;
    if (typeof ref === 'string') {
      if (!ref.startsWith('#/') || seen.has(ref)) return value;
      const target = ref
        .slice(2)
        .split('/')
        .reduce<unknown>(
          (object, key) =>
            (object as Record<string, unknown> | undefined)?.[key.replaceAll('~1', '/').replaceAll('~0', '~')],
          byId.get(api)?.schema,
        );
      if (target === undefined) throw new Error(`Unresolved schema reference: ${ref}`);
      return resolve(target, api, new Set([...seen, ref]), depth + 1);
    }
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolve(item, api, seen, depth + 1)]));
  };
  const resolveDetail = (value: unknown, api: string) =>
    detail === 'outline' ? outline(resolve(value, api)) : resolve(value, api);

  const handlers: Record<string, (args: Record<string, unknown>) => unknown> = {
    apis(args) {
      const api = typeof args.api === 'string' ? args.api : undefined;
      return documents.map((document) => document.entry).filter((entry) => matchesScapiApi(entry.id, api));
    },
    operations(args) {
      const api = typeof args.api === 'string' ? args.api : undefined;
      const method = typeof args.method === 'string' ? args.method.toLowerCase() : undefined;
      const list: ScapiSpecOperationSummary[] = [];
      for (const [fullPath, {document, item}] of paths()) {
        if (!matchesScapiApi(document.entry.id, api)) continue;
        for (const candidate of SCAPI_METHODS) {
          const operation = item[candidate];
          if (!operation || (method && candidate !== method)) continue;
          list.push({
            api: document.entry.id,
            method: candidate,
            path: fullPath,
            ...(operation.operationId ? {operationId: operation.operationId} : {}),
            ...(operation.summary ? {summary: brief(operation.summary)} : {}),
          });
        }
      }
      return list;
    },
    operation(args) {
      const path = String(args.path ?? '');
      const method = String(args.method ?? '').toLowerCase();
      const found = paths().get(path);
      const operation = found?.item[method];
      if (!found || !operation)
        throw new Error(
          `SCAPI_SPEC_OPERATION_NOT_FOUND: ${method.toUpperCase()} ${path}. Pass a path and method from spec.search() or spec.operations().`,
        );
      const {document, item} = found;
      const {summary, description, ...rest} = {
        ...operation,
        api: document.entry.id,
        parameters: [...(item.parameters ?? []), ...(operation.parameters ?? [])],
        security: operation.security ?? document.schema.security ?? [],
      };
      // Keep the operation's own prose; only what it references is trimmed.
      return {
        ...(summary === undefined ? {} : {summary}),
        ...(description === undefined ? {} : {description}),
        ...(resolveDetail(rest, document.entry.id) as object),
      };
    },
    resolve(args) {
      return resolveDetail(args.value, String(args.api ?? ''));
    },
    search(args) {
      search ??= createScapiOperationSearch(documents);
      return search(String(args.query ?? ''), (args.options ?? {}) as ScapiOperationSearchOptions);
    },
  };

  return (args: unknown): unknown => {
    const request = (args && typeof args === 'object' ? args : {}) as Record<string, unknown>;
    const handler =
      typeof request.op === 'string' && Object.hasOwn(handlers, request.op) ? handlers[request.op] : undefined;
    if (!handler) throw new Error(`SCAPI_SPEC_UNKNOWN_MEMBER: ${MEMBERS}`);
    return handler(request);
  };
}
