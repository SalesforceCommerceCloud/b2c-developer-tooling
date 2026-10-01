/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {
  loadScapiSchemas,
  mergeScapiSchemas,
  scapiTenantKey,
  ScapiLiveSchemaCache,
  ScapiShopperSessions,
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
const SCAPI_SKILL_REQUIRED =
  'SCAPI_SKILL_REQUIRED: Read skill://mcp/scapi/SKILL.md through resources or skills_read, then retry with skillRead: true.';
const skillRead = z
  .literal(true, {error: SCAPI_SKILL_REQUIRED})
  .describe('Required. Set true only after reading skill://mcp/scapi/SKILL.md (MCP resource, or skills_read({uri})).');
function requireScapiSkill(read: boolean | undefined): void {
  if (read !== true) throw new Error(SCAPI_SKILL_REQUIRED);
}
const searchDescription = `Requires reading skill://mcp/scapi/SKILL.md first. Search SCAPI Admin/Shopper OpenAPI contracts by running JavaScript over \`spec\`, to find the operationId, path, inputs and scopes for a Commerce API task when no dedicated tool fits. Use cip_* for analytics and webdav_* for files. Searches the bundled contracts by default (offline, no credentials); schemas:"live" fetches the current contracts from the configured instance instead, including tenant c_* fields, custom APIs and APIs newer than the bundle.`;

const executeDescription = `Requires reading skill://mcp/scapi/SKILL.md first. Run any SCAPI Admin or Shopper API operation (reads, writes, searches and actions) through scapi.request() in JavaScript. Covers most developer, merchant and administrator tasks: catalogs, products, pricing, promotions, orders, customers, inventory, sites, jobs, code versions, observability, and storefront flows such as baskets. Use it whenever no more specific tool fits. Find operations with scapi_search first. Auth is automatic; Shopper calls run as a per-site guest whose basket persists. Operations are governed by Safety Mode and may ask the user for confirmation.`;

function codeResult(
  data: {
    result?: unknown;
    executionId?: string;
    error?: string;
    schemaFailures?: Array<{api: string; error: string}>;
    skillReferences?: SkillReference[];
  },
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
        ...(/^SCAPI_(ADMIN_|SHOPPER_|REGISTERED_SHOPPER_|AUTH_|SCOPE_)/.test(message)
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
  schemaCache = new ScapiLiveSchemaCache(),
  shopperSessions = new ScapiShopperSessions(),
): McpTool[] {
  // Retain only source for the last 50 completed executions, until this server ends.
  const executions = new Map<string, string>();
  const searchInput = {
    ...createProjectContextInputSchema('configuration'),
    code,
    skillRead,
    api: z.string().optional().describe('Limit schemas to family/name/version. Omit for all APIs.'),
    schemas: z
      .enum(['bundled', 'live'])
      .optional()
      .describe('bundled (default, offline) or live tenant contracts from the Schemas API.'),
    refresh: z.boolean().optional().describe('With schemas:"live", refetch instead of using cached contracts.'),
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
      description: searchDescription,
      inputSchema: searchInput,
      toolsets: ['SCAPI', 'PWAV3', 'STOREFRONTNEXT'],

      effect: 'read',
      idempotent: true,
      openWorld: true,
      async handler(args, context) {
        let resolution: ToolResolution | undefined;
        try {
          const input = z.object(searchInput).strict().parse(args) as ProjectContextInput &
            z.infer<z.ZodObject<typeof searchInput>>;
          requireScapiSkill(input.skillRead);
          if (input.schemas !== 'live' && input.refresh !== undefined)
            throw new Error('SCAPI_SEARCH_ARGUMENT_INVALID: refresh requires schemas:"live".');
          let documents: ReturnType<typeof loadScapiSchemas>;
          let failures: Array<{api: string; error: string}> = [];
          if (input.schemas === 'live') {
            const services = await loadServices(input);
            resolution = services.getResolution();
            // Throws with configuration guidance when shortCode, tenantId, or OAuth credentials are missing.
            const client = services.getScapiSchemasClient();
            const organizationId = services.getOrganizationId();
            const tenant = scapiTenantKey(services.getShortCode()!, organizationId);
            ({documents, failures} = await schemaCache.load(tenant, client, organizationId, {
              api: input.api,
              refresh: input.refresh,
              signal: context?.signal,
            }));
            if (documents.length === 0 && failures.length === 0)
              throw new Error('Unknown schema ID for this tenant. Omit api to discover available APIs.');
          } else {
            documents = loadScapiSchemas().filter((document) => !input.api || document.entry.id === input.api);
            if (documents.length === 0)
              throw new Error(
                'Unknown schema ID. Omit api to discover available APIs, or use schemas:"live" for tenant and custom APIs.',
              );
          }
          const result = await runScapiCode({
            code: input.code,
            documents,
            authType: input.authType,
            signal: context?.signal,
            timeoutMs: 10_000,
            snippets: loadScapiSnippets(snippetDirectory),
          });
          return codeResult({result, ...(failures.length > 0 ? {schemaFailures: failures} : {})}, resolution);
        } catch (error) {
          return failure(error, resolution);
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
          const tenant = shortCode && tenantId ? scapiTenantKey(shortCode, toOrganizationId(tenantId)) : undefined;
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
                // Guest sessions outlive executions so shopper state (baskets) carries across them.
                shopperAuth: shopperSessions.for({
                  shortCode,
                  tenantId,
                  slasClientId: config.values.slasClientId,
                  slasClientSecret: config.values.slasClientSecret,
                }),
                // Live contracts discovered for this tenant replace bundled ones; the user owns their accuracy.
                documents: mergeScapiSchemas(loadScapiSchemas(), tenant ? schemaCache.get(tenant) : []),
                onSchema(document, customProperties) {
                  // Keep expanded tenant contracts from being replaced by unexpanded fetches.
                  if (tenant && (customProperties || document.entry.apiFamily === 'custom'))
                    schemaCache.put(tenant, document);
                },
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
