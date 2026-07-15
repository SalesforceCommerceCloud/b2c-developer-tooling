/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {describe, it} from 'mocha';
import {z} from 'zod';
import {normalizeObjectSchema} from '@modelcontextprotocol/sdk/server/zod-compat.js';
import {toJsonSchemaCompat} from '@modelcontextprotocol/sdk/server/zod-json-schema-compat.js';
import type {McpTool} from '../../src/utils/index.js';
import type {Services} from '../../src/services.js';
import {createCartridgesTools} from '../../src/tools/cartridges/index.js';
import {createDiagnosticsTools} from '../../src/tools/diagnostics/index.js';
import {createDocsTools} from '../../src/tools/docs/index.js';
import {createMrtTools} from '../../src/tools/mrt/index.js';
import {createPwav3Tools} from '../../src/tools/pwav3/index.js';
import {createScapiTools} from '../../src/tools/scapi/index.js';
import {createStorefrontNextTools} from '../../src/tools/storefrontnext/index.js';

/**
 * loadServices is only invoked inside tool handlers at call time — schema
 * generation never touches it, so a throwing stub is safe here.
 */
const loadServices = (() => {
  throw new Error('loadServices must not be called during schema generation');
}) as unknown as () => Services;

function allTools(): McpTool[] {
  return [
    ...createCartridgesTools(loadServices),
    ...createDiagnosticsTools(loadServices),
    ...createDocsTools(loadServices),
    ...createMrtTools(loadServices),
    ...createPwav3Tools(loadServices),
    ...createScapiTools(loadServices),
    ...createStorefrontNextTools(loadServices),
  ];
}

/**
 * Convert a tool's Zod input schema exactly the way the MCP SDK does when it
 * answers a `tools/list` request, so the JSON Schema we assert on is the one
 * clients actually receive.
 */
function toClientJsonSchema(tool: McpTool): Record<string, unknown> {
  const obj = normalizeObjectSchema(z.object(tool.inputSchema) as never);
  return obj ? (toJsonSchemaCompat(obj, {strictUnions: true, pipeStrategy: 'input'}) as Record<string, unknown>) : {};
}

/**
 * Walk a JSON Schema node, collecting JSON-path strings of every `type: "array"`
 * node that lacks an `items` (or `prefixItems`) definition.
 */
function findArraysWithoutItems(node: unknown, path: string, out: string[]): void {
  if (node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const [i, n] of node.entries()) {
      findArraysWithoutItems(n, `${path}[${i}]`, out);
    }
    return;
  }
  const record = node as Record<string, unknown>;
  const type = record.type;
  const isArrayType = type === 'array' || (Array.isArray(type) && type.includes('array'));
  if (isArrayType && !('items' in record) && !('prefixItems' in record)) {
    out.push(path);
  }
  for (const [key, value] of Object.entries(record)) {
    if (key === 'type') continue;
    findArraysWithoutItems(value, `${path}.${key}`, out);
  }
}

describe('tools/schema client compatibility', () => {
  // GitHub Copilot's MCP client rejects any tool whose JSON Schema contains an
  // array-typed parameter without an `items` definition. This guards against a
  // regression that would silently break every Copilot user.
  it('emits an items definition for every array-typed parameter', () => {
    const offenders: string[] = [];
    for (const tool of allTools()) {
      findArraysWithoutItems(toClientJsonSchema(tool), tool.name, offenders);
    }
    expect(offenders, `arrays missing items: ${offenders.join(', ')}`).to.deep.equal([]);
  });

  it('generates a valid object schema for every registered tool', () => {
    const tools = allTools();
    expect(tools.length).to.be.greaterThan(0);
    for (const tool of tools) {
      const schema = toClientJsonSchema(tool);
      expect(schema, `${tool.name} schema`).to.be.an('object');
    }
  });
});
