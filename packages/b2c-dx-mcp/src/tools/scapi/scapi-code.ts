/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {loadScapiSchemas, runScapiCode, createScapiRequest} from '@salesforce/b2c-tooling-sdk/scapi';
import {toOrganizationId} from '@salesforce/b2c-tooling-sdk/clients';
import {getB2CConfigDirectory} from '@salesforce/b2c-tooling-sdk/config';
import {resolveEffectiveSafetyConfig, loadGlobalSafetyConfig} from '@salesforce/b2c-tooling-sdk/safety';
import type {McpTool, ToolResult} from '../../utils/types.js';
import type {ServicesLoader} from '../adapter.js';
import {createProjectContextInputSchema, type ProjectContextInput, type ToolResolution} from '../project-context.js';
import {jsonResult, attachResolution} from '../adapter.js';
import {MCP_SKILL_REFERENCES, type SkillReference} from '../../skill-references.js';

const code = z.string().min(1).max(32_768).describe('JavaScript async arrow function. Return a concise JSON result.');
const skillRead = z.boolean().optional().describe('True after reading the linked SCAPI skill.');
function requireScapiSkill(read: boolean | undefined): void {
  if (read !== true)
    throw new Error(
      'SCAPI_SKILL_REQUIRED: Read skill://mcp/scapi/SKILL.md through resources or skills_read, then retry with skillRead: true.',
    );
}
const searchDescription = `Discover bundled SCAPI APIs offline: products, catalogs, orders, customers, inventory, pricing, campaigns, promotions, jobs, and Shopper APIs. Prefer dedicated tools; code mode covers other API tasks.
Read skill://mcp/scapi/SKILL.md first.

Schemas can be huge. Discover operation IDs/paths first; then select required and task-relevant fields. Avoid whole operations or request/response trees. Local refs are expanded; recursive/deep refs remain $ref.

Code objects (execute JavaScript, not these types):
interface Operation {
  api: string; operationId: string; summary?: string; description?: string; tags?: string[];
  parameters: Array<{name: string; in: string; required?: boolean; schema?: unknown}>;
  requestBody?: {required?: boolean; content: Record<string, {schema: any}>};
  responses?: Record<string, unknown>;
  security: Array<Record<string, string[]>>;
  auth: {types: string[]; schemes: string[]; executable: boolean}; // runtime support, not configured access
}
declare const spec: {
  apis: Array<{id: string; apiFamily: string; apiName: string; apiVersion: string; authTypes: string[]}>;
  paths: Record<string, Record<string, Operation>>; // full paths, lowercase HTTP methods
};

Examples:
// Find product operations
async () => Object.entries(spec.paths)
  .filter(([path]) => path.startsWith('/product/products/'))
  .flatMap(([path, methods]) => Object.entries(methods)
    .map(([method, op]) => ({method, path, operationId: op.operationId})))

// Inspect only fields needed for creation
async () => {
  const op = spec.paths['/product/products/v1/organizations/{organizationId}/products/{productId}'].put;
  const body = op.requestBody.content['application/json'].schema;
  const fields = [...new Set([...(body.required ?? []), 'name', 'owningCatalogId', 'onlineFlag'])];
  return {parameters: op.parameters, required: body.required,
    fields: Object.fromEntries(fields.map(k => [k, body.properties[k]])), auth: op.auth, security: op.security};
}`;

const executeDescription = `Read, create, update, or delete Commerce records through SCAPI Admin APIs when no dedicated tool fits. Discover endpoints with scapi_search, then call scapi.request(). JSON requests; no Shopper/custom API execution or binary transfers.
Read skill://mcp/scapi/SKILL.md first.

Available in your code:
declare const organizationId: string; // resolved tenant
declare const siteId: string | undefined; // configured site
declare const scapi: {
  request(options: {method: string; path: string; query?: Record<string, unknown>; body?: unknown}):
    Promise<{status: number; ok: boolean; data: any; diagnostic?: {code: string; message: string}}>;
};

Use a JavaScript async arrow function; await requests. Responses can be huge: filter/map/slice in code; return counts, selected rows, and verification fields. Preserve failures and diagnostics. HTTP failures return ok:false; transport/auth/safety failures throw. Local Node execution; SDK safety rules apply. Check writes before retrying.

Example: inspect one product
async () => {
  const r = await scapi.request({method: 'GET',
    path: '/product/products/v1/organizations/' + organizationId + '/products/' + encodeURIComponent('test-product')});
  return r.ok ? {status: r.status, id: r.data.id, catalog: r.data.owningCatalogId, online: r.data.online} : r;
}`;

function codeResult(
  data: {result?: unknown; error?: string; skillReferences?: SkillReference[]},
  resolution?: ToolResolution,
): ToolResult {
  const result = resolution ? attachResolution(jsonResult(data, 0), resolution, 0) : jsonResult(data, 0);
  // Code-mode payloads are arbitrary JSON: retain provenance without duplicating the result.
  delete result.structuredContent;
  return result;
}
function failure(error: unknown, resolution?: ToolResolution): ToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return {
    ...codeResult(
      {
        error: message,
        ...(/^SCAPI_(ADMIN_|SHOPPER_|AUTH_|SCOPE_)/.test(message)
          ? {skillReferences: [MCP_SKILL_REFERENCES.scapiAuthentication]}
          : {}),
      },
      resolution,
    ),
    isError: true,
  };
}

export function createScapiCodeTools(loadServices: ServicesLoader): McpTool[] {
  const searchInput = {
    code,
    skillRead,
    api: z.string().optional().describe('Limit schemas to family/name/version. Omit for all standard APIs.'),
    authType: z
      .enum(['admin', 'shopper'])
      .optional()
      .describe('Filter operations by authentication; mixed operations match either.'),
  };
  const executeInput = {...createProjectContextInputSchema('configuration'), code, skillRead};
  return [
    {
      name: 'scapi_search',
      title: 'SCAPI Spec Search',
      description: searchDescription,
      inputSchema: searchInput,
      toolsets: ['SCAPI', 'PWAV3', 'STOREFRONTNEXT'],

      effect: 'read',
      idempotent: true,
      openWorld: false,
      async handler(args, context) {
        try {
          const input = z.object(searchInput).strict().parse(args);
          requireScapiSkill(input.skillRead);
          const documents = loadScapiSchemas().filter((document) => !input.api || document.entry.id === input.api);
          if (documents.length === 0) throw new Error('Unknown schema ID. Omit api to discover available APIs.');
          return codeResult({
            result: await runScapiCode({
              code: input.code,
              documents,
              authType: input.authType,
              signal: context?.signal,
              timeoutMs: 10_000,
            }),
          });
        } catch (error) {
          return failure(error);
        }
      },
    },
    {
      name: 'scapi_execute',
      title: 'SCAPI Code Executor',
      description: executeDescription,
      inputSchema: executeInput,
      toolsets: ['SCAPI', 'PWAV3', 'STOREFRONTNEXT'],

      effect: 'destructive',
      idempotent: false,
      openWorld: true,
      async handler(args, context) {
        let resolution;
        try {
          const input = z.object(executeInput).strict().parse(args) as ProjectContextInput & {
            code: string;
            skillRead?: boolean;
          };
          requireScapiSkill(input.skillRead);
          const services = await loadServices(input);
          resolution = services.getResolution();
          const config = services.getResolvedConfig();
          const {shortCode, tenantId, siteId} = config.values;
          if (!shortCode || !tenantId)
            throw new Error('SCAPI requires configured shortCode and tenantId. Use config_inspect.');
          const safetyEnvironment = Object.fromEntries(
            ['SFCC_SAFETY_LEVEL', 'SFCC_SAFETY_CONFIRM', 'SFCC_SAFETY_CONFIG'].map((name) => [
              name,
              services.getEnvironmentVariable(name),
            ]),
          );
          const request = createScapiRequest({
            shortCode,
            tenantId,
            siteId,
            auth: () => config.createOAuth(),
            documents: loadScapiSchemas(),
            safety: resolveEffectiveSafetyConfig(
              config.values.safety,
              loadGlobalSafetyConfig(getB2CConfigDirectory(), safetyEnvironment, resolution.projectDirectory?.path),
              safetyEnvironment,
            ),
          });
          const result = await runScapiCode({
            code: input.code,
            request,
            organizationId: toOrganizationId(tenantId),
            siteId,
            cwd: resolution.projectDirectory?.path,
            signal: context?.signal,
          });
          return codeResult({result}, resolution);
        } catch (error) {
          return failure(error, resolution);
        }
      },
    },
  ];
}
