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
import {createProjectContextInputSchema, type ProjectContextInput} from '../project-context.js';
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
const outputSchema = {
  result: z.unknown().optional(),
  error: z.string().optional(),
  skillReferences: z.array(z.object({uri: z.string(), section: z.string()})).optional(),
};
function codeResult(data: {result?: unknown; error?: string; skillReferences?: SkillReference[]}): ToolResult {
  return {...jsonResult(data), structuredContent: data};
}
function failure(error: unknown): ToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return {
    ...codeResult({
      error: message,
      ...(/^SCAPI_(ADMIN_|SHOPPER_|AUTH_|SCOPE_)/.test(message)
        ? {skillReferences: [MCP_SKILL_REFERENCES.scapiAuthentication]}
        : {}),
    }),
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
      description:
        'Search bundled Admin/Shopper SCAPI contracts offline. spec.apis lists APIs and authTypes; spec.paths maps full paths to lowercase methods. Operations include auth {types,schemes,executable}, security, parameters, requestBody, responses. spec.resolve(value, operation.api) expands refs. Return selected fields. Read skill://mcp/scapi/SKILL.md first.',
      inputSchema: searchInput,
      outputSchema,
      toolsets: ['SCAPI', 'PWAV3', 'STOREFRONTNEXT'],
      isGA: false,
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
      description:
        'Run JavaScript with SCAPI Admin requests (create/update/delete). Discover with scapi_search. scapi.request({method,path,query?,body?}) returns {status,ok,data}; organizationId/siteId come from config. Await requests; return selected fields. Local Node execution; SDK safety rules apply to helper calls. Check writes before retrying. Read skill://mcp/scapi/SKILL.md first.',
      inputSchema: executeInput,
      outputSchema,
      toolsets: ['SCAPI', 'PWAV3', 'STOREFRONTNEXT'],
      isGA: false,
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
          const request = createScapiRequest({
            shortCode,
            tenantId,
            siteId,
            auth: () => config.createOAuth(),
            documents: loadScapiSchemas(),
            safety: resolveEffectiveSafetyConfig(config.values.safety, loadGlobalSafetyConfig(getB2CConfigDirectory())),
          });
          const result = await runScapiCode({
            code: input.code,
            request,
            organizationId: toOrganizationId(tenantId),
            siteId,
            cwd: resolution.projectDirectory?.path,
            signal: context?.signal,
          });
          return attachResolution(codeResult({result}), resolution);
        } catch (error) {
          const result = failure(error);
          return resolution ? attachResolution(result, resolution) : result;
        }
      },
    },
  ];
}
