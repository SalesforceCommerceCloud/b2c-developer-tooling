/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {
  loadScapiSchemas,
  runScapiCode,
  createScapiRequest,
  createScapiAuth,
  loadScapiSnippets,
  saveScapiSnippet,
} from '@salesforce/b2c-tooling-sdk/scapi';
import {toOrganizationId} from '@salesforce/b2c-tooling-sdk/clients';
import {getB2CConfigDirectory} from '@salesforce/b2c-tooling-sdk/config';
import {resolveEffectiveSafetyConfig, loadGlobalSafetyConfig} from '@salesforce/b2c-tooling-sdk/safety';
import type {McpTool, ToolResult} from '../../utils/types.js';
import type {ServicesLoader} from '../adapter.js';
import {createProjectContextInputSchema, type ProjectContextInput, type ToolResolution} from '../project-context.js';
import {jsonResult, attachResolution} from '../adapter.js';
import {MCP_SKILL_REFERENCES, type SkillReference} from '../../skill-references.js';
import {ScapiExecutionRegistry} from './execution-registry.js';

const code = z
  .string()
  .min(1)
  .max(32_768)
  .describe('JavaScript async arrow function. Return concise JSON. No filesystem or shell access.');
const skillRead = z.boolean().optional().describe('True after reading the linked SCAPI skill.');
const snippetDescription = `\nSnippets: await codemode.search(query) returns up to 10 names/descriptions/effects; await codemode.describe(name) returns source/inputSchema. Prefixes: builtin/, user/.`;
function requireScapiSkill(read: boolean | undefined): void {
  if (read !== true)
    throw new Error(
      'SCAPI_SKILL_REQUIRED: Read skill://mcp/scapi/SKILL.md through resources or skills_read, then retry with skillRead: true.',
    );
}
const searchDescription = `Discover bundled Admin/Shopper SCAPI contracts offline. Prefer dedicated tools when available.
Read skill://mcp/scapi/SKILL.md first.

Schemas can be huge. Discover operation IDs/paths first; then select required and task-relevant fields. Avoid whole operations or request/response trees. Local refs are expanded; recursive/deep refs remain $ref.

Code objects (execute JavaScript, not these types):
interface Operation {
  api: string; operationId: string; summary?: string;
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

const executeDescription = `Read, create, update, or delete Commerce records through SCAPI Admin APIs when no dedicated tool fits. Discover standard endpoints with scapi_search; for custom APIs, fetch the live contract through scapi.request() in the same program first. Requests authenticate automatically. JSON requests; no Shopper execution or binary transfers.
Read skill://mcp/scapi/SKILL.md first.

Reuse workflows with await codemode.run(name, input); describe first. async (input) receives input. Completed executionId enables scapi_snippet_save.
Safety confirmation uses MCP elicitation. Protocol retries resume retained code; never replay it. Approval has no server deadline. Decline or cancel terminates execution without rollback. action:cancel needs executionId only (plus skillRead).

Available in your code:
declare const organizationId: string | undefined; // resolved tenant
declare const siteId: string | undefined; // configured site
declare const scapi: {
  request(options: {method: string; path: string; query?: Record<string, unknown>; body?: unknown}):
    Promise<{status: number; ok: boolean; data: any; diagnostic?: {code: string; message: string}}>;
};

Compose dependent requests; await each. Responses can be huge: filter/map/slice; return counts, selected rows and verification. Preserve failures. HTTP failures return ok:false; transport/auth/safety failures throw. SDK safety governs scapi.request. fetch/WebSocket are disabled. Optional auth.accountManager()/auth.slas() export tokens for external clients; see skill. Check writes before retrying.

Example: inspect a campaign's promotions
async () => codemode.run('builtin/campaign-promotions', {campaignId: 'selected-campaign', limit: 4})`;

function codeResult(
  data: {result?: unknown; executionId?: string; error?: string; skillReferences?: SkillReference[]},
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

export function createScapiCodeTools(
  loadServices: ServicesLoader,
  snippetDirectory?: string,
  registry = new ScapiExecutionRegistry(),
): McpTool[] {
  // Retain only source for the last 50 completed executions, until this server ends.
  const executions = new Map<string, string>();
  const searchInput = {
    code,
    skillRead,
    api: z.string().optional().describe('Limit schemas to family/name/version. Omit for all standard APIs.'),
    authType: z
      .enum(['admin', 'shopper'])
      .optional()
      .describe('Filter operations by authentication; mixed operations match either.'),
  };
  const executeInput = {
    ...createProjectContextInputSchema('configuration'),
    action: z
      .enum(['execute', 'cancel'])
      .optional()
      .describe('Defaults to execute. Cancel terminates retained work; no rollback.'),
    executionId: z
      .string()
      .uuid()
      .optional()
      .describe('Required for cancel; forbidden for execute. Protocol continuation uses requestState, not this field.'),
    code: code.optional(),
    skillRead,
    input: z.unknown().optional().describe('JSON input for async (input); kept separate from saved source.'),
  };
  const saveInput = {
    executionId: z.string().uuid(),
    name: z.string().regex(/^user\/[a-z0-9][a-z0-9-]{0,79}$/),
    description: z.string().min(1).max(500),
    effect: z.enum(['read', 'write', 'destructive']),
    inputSchema: z.record(z.string(), z.unknown()).describe('JSON Schema for the parameterized program input.'),
  };
  return [
    {
      name: 'scapi_search',
      title: 'SCAPI Spec Search',
      description: searchDescription + snippetDescription,
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
              snippets: loadScapiSnippets(snippetDirectory),
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
      description: executeDescription + snippetDescription,
      inputSchema: executeInput,
      toolsets: ['SCAPI', 'PWAV3', 'STOREFRONTNEXT'],

      effect: 'destructive',
      idempotent: false,
      openWorld: true,
      async handler(args, context) {
        let resolution: ToolResolution | undefined;
        try {
          const input = z.object(executeInput).strict().parse(args) as ProjectContextInput &
            z.infer<z.ZodObject<typeof executeInput>>;
          requireScapiSkill(input.skillRead);
          if (input.action === 'cancel') {
            if (
              !input.executionId ||
              Object.keys(args).some((key) => !['action', 'executionId', 'skillRead'].includes(key)) ||
              context?.requestState !== undefined ||
              context?.inputResponses !== undefined
            )
              throw new Error(
                'SCAPI_CANCEL_ARGUMENT_INVALID: cancel requires executionId and skillRead only; omit code, input, project overrides and protocol continuation.',
              );
            return await registry.cancel(input.executionId);
          }
          if (!input.code || input.executionId !== undefined)
            throw new Error('SCAPI_EXECUTE_ARGUMENT_INVALID: execute requires code; omit executionId.');
          if (context?.requestState !== undefined) return await registry.retry(input, context);
          if (context?.inputResponses !== undefined)
            throw new Error('SCAPI_CONTINUATION_INVALID: inputResponses require server-issued requestState.');
          const services = await loadServices(input);
          resolution = services.getResolution();
          const config = services.getResolvedConfig();
          const {shortCode, tenantId, siteId} = config.values;
          const safetyEnvironment = Object.fromEntries(
            ['SFCC_SAFETY_LEVEL', 'SFCC_SAFETY_CONFIRM', 'SFCC_SAFETY_CONFIG'].map((name) => [
              name,
              services.getEnvironmentVariable(name),
            ]),
          );
          return await registry.start(input, context, async (execution) => {
            let managedRequest: ReturnType<typeof createScapiRequest>;
            const request = async (options: unknown, signal: AbortSignal) => {
              if (!shortCode || !tenantId)
                throw new Error('SCAPI requires configured shortCode and tenantId. Use config_inspect.');
              managedRequest ??= createScapiRequest({
                shortCode,
                tenantId,
                siteId,
                auth: () => config.createOAuth(),
                documents: loadScapiSchemas(),
                confirm: (request) => execution.confirm(request),
                onDispatch: () => execution.markDispatched(),
                safety: resolveEffectiveSafetyConfig(
                  config.values.safety,
                  loadGlobalSafetyConfig(
                    getB2CConfigDirectory(),
                    safetyEnvironment,
                    resolution?.projectDirectory?.path,
                  ),
                  safetyEnvironment,
                ),
              });
              return managedRequest(options, signal);
            };
            const auth = createScapiAuth(config.values, resolution?.projectDirectory?.path);
            try {
              const result = await runScapiCode({
                code: input.code!,
                request: (options, signal) => execution.runCall('request', options, () => request(options, signal)),
                auth: (operation, options, signal) =>
                  execution.runCall('auth', undefined, () => auth(operation, options, signal)),
                organizationId: tenantId ? toOrganizationId(tenantId) : undefined,
                siteId,
                cwd: resolution?.projectDirectory?.path,
                signal: execution.controller.signal,
                onControl(control) {
                  execution.control = control;
                },
                input: input.input,
                snippets: loadScapiSnippets(snippetDirectory),
              });
              const executionId = execution.id;
              executions.set(executionId, input.code!);
              if (executions.size > 50) executions.delete(executions.keys().next().value!);
              return codeResult({result, executionId}, resolution);
            } catch (error) {
              return failure(error, resolution);
            }
          });
        } catch (error) {
          return failure(error, resolution);
        }
      },
    },
    {
      name: 'scapi_snippet_save',
      title: 'Save SCAPI Workflow',
      description:
        'Save a completed execution as a reusable user/ snippet only when the user asks. Inspect its outcome and source first; source must take variable values through input and contain no credentials. Saves source and metadata, not input or results. Existing names are not overwritten.',
      inputSchema: saveInput,
      toolsets: ['SCAPI', 'PWAV3', 'STOREFRONTNEXT'],
      effect: 'write',
      idempotent: false,
      openWorld: false,
      async handler(args) {
        try {
          const input = z.object(saveInput).strict().parse(args);
          const source = executions.get(input.executionId);
          if (!source)
            throw new Error(
              'SCAPI_EXECUTION_NOT_FOUND: only the last 50 completed executions in this server session can be saved. Do not replay writes just to save a snippet.',
            );
          const {executionId: _, ...metadata} = input;
          saveScapiSnippet({...metadata, code: source}, snippetDirectory);
          return codeResult({result: {name: input.name, saved: true}});
        } catch (error) {
          return failure(error);
        }
      },
    },
  ];
}
