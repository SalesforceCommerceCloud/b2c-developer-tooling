/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

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
  const applyDefault = (param: unknown) => {
    if (!param || typeof param !== 'object') return;
    const record = param as Record<string, unknown>;
    const name = record.name;
    if (typeof name !== 'string' || !(name in defaults)) return;
    record.schema = {type: 'string', default: defaults[name]};
    record.example = defaults[name];
    delete record.examples;
  };
  const applyDefaults = (params: unknown) => {
    if (Array.isArray(params)) for (const param of params) applyDefault(param);
  };

  // Components-level parameters
  const components = spec.components as Record<string, unknown> | undefined;
  if (components?.parameters && typeof components.parameters === 'object') {
    for (const param of Object.values(components.parameters as Record<string, unknown>)) applyDefault(param);
  }

  // Path-level and operation-level parameters
  const paths = spec.paths as Record<string, Record<string, unknown>> | undefined;
  if (!paths) return;
  const methods = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head'];
  for (const pathItem of Object.values(paths)) {
    applyDefaults(pathItem.parameters);
    for (const method of methods) {
      const op = pathItem[method] as Record<string, unknown> | undefined;
      if (op?.parameters) applyDefaults(op.parameters);
    }
  }
}
