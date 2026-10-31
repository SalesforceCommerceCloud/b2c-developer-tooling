/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head'];

/** Visit every components-, path- and operation-level parameter object in the spec. */
function forEachParameter(spec: Record<string, unknown>, visit: (param: Record<string, unknown>) => void): void {
  const apply = (param: unknown) => {
    if (param && typeof param === 'object') visit(param as Record<string, unknown>);
  };
  const applyAll = (params: unknown) => {
    if (Array.isArray(params)) for (const param of params) apply(param);
  };

  // Components-level parameters
  const components = spec.components as Record<string, unknown> | undefined;
  if (components?.parameters && typeof components.parameters === 'object') {
    for (const param of Object.values(components.parameters as Record<string, unknown>)) apply(param);
  }

  // Path-level and operation-level parameters
  const paths = spec.paths as Record<string, Record<string, unknown>> | undefined;
  if (!paths) return;
  for (const pathItem of Object.values(paths)) {
    applyAll(pathItem.parameters);
    for (const method of HTTP_METHODS) {
      const op = pathItem[method] as Record<string, unknown> | undefined;
      if (op?.parameters) applyAll(op.parameters);
    }
  }
}

const SUBSCHEMA_KEYS = ['items', 'not', 'additionalProperties'];
const SUBSCHEMA_LIST_KEYS = ['allOf', 'oneOf', 'anyOf'];

/**
 * Copy a parameter schema without examples, inlining local `$ref`s so the shared component
 * schemas (whose examples feed request/response "Example Value") are left untouched.
 */
function withoutExamples(schema: unknown, spec: Record<string, unknown>, refs: ReadonlySet<string>): unknown {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return schema;
  let source = schema as Record<string, unknown>;
  let seen = refs;
  const ref = source.$ref;
  if (typeof ref === 'string' && ref.startsWith('#/')) {
    if (refs.has(ref)) return {};
    const target = resolveLocalRef(spec, ref);
    if (!target) return source;
    seen = new Set([...refs, ref]);
    const {$ref: _ref, ...siblings} = source;
    source = {...target, ...siblings};
  }

  const copy: Record<string, unknown> = {...source};
  delete copy.example;
  delete copy.examples;
  for (const key of SUBSCHEMA_KEYS) {
    if (key in copy) copy[key] = withoutExamples(copy[key], spec, seen);
  }
  for (const key of SUBSCHEMA_LIST_KEYS) {
    if (Array.isArray(copy[key])) copy[key] = (copy[key] as unknown[]).map((s) => withoutExamples(s, spec, seen));
  }
  if (copy.properties && typeof copy.properties === 'object') {
    copy.properties = Object.fromEntries(
      Object.entries(copy.properties as Record<string, unknown>).map(([k, v]) => [k, withoutExamples(v, spec, seen)]),
    );
  }
  return copy;
}

function resolveLocalRef(spec: Record<string, unknown>, ref: string): Record<string, unknown> | undefined {
  let node: unknown = spec;
  for (const segment of ref.slice(2).split('/')) {
    if (!node || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[segment.replace(/~1/g, '/').replace(/~0/g, '~')];
  }
  return node && typeof node === 'object' ? (node as Record<string, unknown>) : undefined;
}

/**
 * Remove parameter examples from a fully expanded contract, including those inherited from
 * referenced component schemas, so "Try it out" fields start empty.
 *
 * Swagger UI fills "Try it out" fields from parameter examples, so sample data (fake `sfdc_usid`,
 * `select`, ...) would be sent with every request. Array parameters are worse: their examples are
 * comma-joined strings, which fail validation or break request building and leave Execute doing nothing.
 */
export function stripParameterExamples(spec: Record<string, unknown>): void {
  forEachParameter(spec, (param) => {
    delete param.example;
    delete param.examples;
    if (param.schema) param.schema = withoutExamples(param.schema, spec, new Set());
  });
}

/**
 * Pre-fill default values for known parameters (e.g. organizationId, siteId)
 * throughout the spec so users don't have to fill them in manually for "Try it out".
 *
 * Replaces the entire `param.schema` with `{ type: 'string', default: value }` to
 * avoid the OAS 3.0 issue where adding `default` alongside a `$ref` sibling is ignored.
 * Fully expanded contracts also carry parameter `example`/`examples`, which Swagger UI
 * prefers over `default` when filling the field, so those are replaced with the value too.
 */
export function prefillParameters(spec: Record<string, unknown>, defaults: Record<string, string>): void {
  forEachParameter(spec, (param) => {
    const name = param.name;
    if (typeof name !== 'string' || !(name in defaults)) return;
    param.schema = {type: 'string', default: defaults[name]};
    param.example = defaults[name];
    delete param.examples;
  });
}
