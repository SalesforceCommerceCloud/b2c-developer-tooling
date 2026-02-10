/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * SCAPI Custom API Status tool.
 *
 * Mirrors CLI: b2c scapi custom status. All CLI flags are supported; let the agent decide what to use.
 * Returns raw endpoints from the API (no roll-up). Remote only.
 *
 * @module tools/scapi/scapi-custom-apis-status
 */

import {z} from 'zod';
import {createToolAdapter, jsonResult} from '../adapter.js';
import type {Services} from '../../services.js';
import type {McpTool} from '../../utils/index.js';
import type {CustomApisComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {getApiErrorMessage} from '@salesforce/b2c-tooling-sdk/clients';
import {getApiType} from '@salesforce/b2c-tooling-sdk/operations/scapi';

type CustomApiEndpoint = CustomApisComponents['schemas']['CustomApiEndpoint'];

/** Endpoint with optional display field (type) added by the tool. */
type EndpointWithMeta = CustomApiEndpoint & {type?: string};

const DEFAULT_COLUMNS = ['type', 'apiName', 'endpointPath', 'httpMethod', 'status', 'siteId'] as const;
const ALL_COLUMN_KEYS = [
  'type',
  'apiName',
  'apiVersion',
  'cartridgeName',
  'endpointPath',
  'httpMethod',
  'status',
  'siteId',
  'securityScheme',
  'operationId',
  'schemaFile',
  'implementationScript',
  'errorReason',
  'id',
] as const;

function pickColumns(endpoint: EndpointWithMeta, columns: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of columns) {
    if (key in endpoint && (endpoint as Record<string, unknown>)[key] !== undefined) {
      out[key] = (endpoint as Record<string, unknown>)[key];
    }
  }
  return out;
}

function buildColumnList(args: CustomListInput): string[] {
  if (args.extended) {
    return [...ALL_COLUMN_KEYS];
  }
  if (args.columns?.trim()) {
    return args.columns
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  }
  return [...DEFAULT_COLUMNS];
}

function buildResponse(
  withMeta: EndpointWithMeta[],
  args: CustomListInput,
  columnList: string[],
  activeCodeVersion: string | undefined,
): CustomListOutput {
  const filterColumns = columnList.length > 0 && (args.extended !== true || (args.columns ?? '').trim() !== '');
  const toOutput = (e: EndpointWithMeta): EndpointWithMeta | Record<string, unknown> =>
    filterColumns ? (pickColumns(e, columnList) as Record<string, unknown>) : e;

  if (args.groupBy) {
    const groups: Record<string, (EndpointWithMeta | Record<string, unknown>)[]> = {};
    if (args.groupBy === 'type') {
      for (const endpoint of withMeta) {
        const type = endpoint.type ?? '-';
        if (!groups[type]) groups[type] = [];
        groups[type].push(toOutput(endpoint));
      }
    } else {
      for (const endpoint of withMeta) {
        const site = endpoint.siteId ?? 'Global';
        if (!groups[site]) groups[site] = [];
        groups[site].push(toOutput(endpoint));
      }
    }
    return {
      groups,
      total: withMeta.length,
      activeCodeVersion,
      timestamp: new Date().toISOString(),
      message: withMeta.length === 0 ? 'No Custom API endpoints found.' : `Found ${withMeta.length} endpoint(s).`,
    };
  }

  return {
    endpoints: withMeta.map((e) => toOutput(e)),
    total: withMeta.length,
    activeCodeVersion,
    timestamp: new Date().toISOString(),
    message: withMeta.length === 0 ? 'No Custom API endpoints found.' : `Found ${withMeta.length} endpoint(s).`,
  };
}

/**
 * Input schema for scapi_custom_apis_status tool.
 * All flags mirror b2c scapi custom status (--status, --group-by, --columns, --extended).
 */
interface CustomListInput {
  /** Filter by endpoint status. Same as CLI --status / -s */
  status?: 'active' | 'not_registered';
  /** Group output by "site" or "type" (Admin/Shopper). Same as CLI --group-by / -g */
  groupBy?: 'site' | 'type';
  /** Comma-separated columns to include. Same as CLI --columns / -c. Available: type, apiName, apiVersion, cartridgeName, endpointPath, httpMethod, status, siteId, securityScheme, operationId, schemaFile, implementationScript, errorReason, id */
  columns?: string;
  /** Include all fields. Same as CLI --extended / -x. When false, only default columns are returned. */
  extended?: boolean;
}

/**
 * Output schema for scapi_custom_apis_status tool.
 */
interface CustomListOutput {
  /** Raw endpoints (one per site). When groupBy is set, use "groups" instead. */
  endpoints?: EndpointWithMeta[] | Record<string, unknown>[];
  /** When groupBy is set: groups keyed by type ("Admin","Shopper") or by siteId */
  groups?: Record<string, (EndpointWithMeta | Record<string, unknown>)[]>;
  total: number;
  activeCodeVersion?: string;
  remoteError?: string;
  timestamp: string;
  message?: string;
}

/**
 * Creates the scapi_custom_apis_status tool.
 *
 * Mirrors CLI: b2c scapi custom status. All flags supported; agent chooses what to use.
 * See: https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/custom-apis.html#b2c-scapi-custom-status
 */
export function createScapiCustomApisStatusTool(services: Services): McpTool {
  return createToolAdapter<CustomListInput, CustomListOutput>(
    {
      name: 'scapi_custom_apis_status',
      description: `List Custom SCAPI API endpoints and their registration status (active vs not_registered). Returns individual HTTP endpoints (e.g., GET /hello, POST /items/{id}) with deployment status, one row per endpoint per site. Use this for developer-defined custom APIs only.

**When to use this tool:**
- Use this tool when you need: endpoint registration status (active/not_registered), endpoint-level details per site, or to verify custom endpoints are deployed.
- For API-level schema information, use scapi_schemas_list instead.

**Efficient workflows for agents:**
- To check if custom endpoints are active: use this tool with status: "active".
- To get custom API schemas: use scapi_schemas_list with apiFamily: "custom" instead.
- To see all custom endpoints across sites: use this tool without filters (or groupBy: "site").
- To get endpoint details: use extended: true or specify columns.

**Output format:**
- Returns endpoints (array) or groups (when groupBy is set), total, activeCodeVersion, timestamp, message.
- Default fields (6): type, apiName, endpointPath, httpMethod, status, siteId.
- Extended fields (14 total): adds apiVersion, cartridgeName, securityScheme, operationId, schemaFile, implementationScript, errorReason, id.
- Use extended: true to get all fields, or columns: "field1,field2" to select specific fields.
- Returns one row per endpoint per site (no roll-up). Data comes from the remote instance only.

**Examples:**
- "What custom API endpoints are deployed?" → call without filters (returns all endpoints with registration status).
- "Show me only active custom endpoints" → status: "active".
- "Group endpoints by site" → groupBy: "site".
- "Show me endpoint details with all fields" → extended: true.
- "Show me only apiName and status for active endpoints" → status: "active", columns: "apiName,status".

**Requirements:** Requires OAuth with sfcc.custom-apis scope and valid instance config (shortCode, tenantId). On failure, response includes remoteError and total 0.

CLI reference: b2c scapi custom status — https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/custom-apis.html#b2c-scapi-custom-status`,
      toolsets: ['PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      isGA: false,
      requiresInstance: false,
      inputSchema: {
        status: z
          .enum(['active', 'not_registered'])
          .optional()
          .describe('Return only endpoints with this status. Omit to return all.'),
        groupBy: z
          .enum(['site', 'type'])
          .optional()
          .describe('Return groups instead of flat list: "type" = Admin vs Shopper; "site" = by siteId.'),
        columns: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return, e.g. type,apiName,status,siteId. Valid: type, apiName, apiVersion, cartridgeName, endpointPath, httpMethod, status, siteId, securityScheme, operationId, schemaFile, implementationScript, errorReason, id.',
          ),
        extended: z
          .boolean()
          .optional()
          .describe(
            'If true, return all available fields (14 fields total). If false or omitted, return default columns only (6 fields: type, apiName, endpointPath, httpMethod, status, siteId). Use extended: true when you need additional details like apiVersion, cartridgeName, securityScheme, operationId, schemaFile, implementationScript, errorReason, or id. Note: If you only need specific fields, use columns parameter instead for more control.',
          ),
      },
      async execute(args, {services: svc}) {
        let endpoints: CustomApiEndpoint[] = [];
        let activeCodeVersion: string | undefined;
        let remoteError: string | undefined;

        try {
          const client = svc.getCustomApisClient();
          const organizationId = svc.getOrganizationId();
          // Call Custom APIs DX API: list endpoints for this org, optional status filter.
          const {data, error, response} = await client.GET('/organizations/{organizationId}/endpoints', {
            params: {
              path: {organizationId},
              query: args.status ? {status: args.status} : undefined,
            },
          });
          if (error) {
            remoteError = `Failed to fetch remote endpoints: ${getApiErrorMessage(error, response)}`;
          } else {
            endpoints = data?.data ?? [];
            activeCodeVersion = data?.activeCodeVersion;
          }
        } catch (error) {
          // Network/config errors: capture message for remoteError and return below.
          remoteError = error instanceof Error ? error.message : 'Unknown error fetching remote endpoints';
        }

        // On any remote failure, return early with error details (no endpoints).
        if (remoteError) {
          return {
            total: 0,
            activeCodeVersion,
            remoteError,
            timestamp: new Date().toISOString(),
            message: `Failed to fetch Custom API endpoints: ${remoteError}. Check OAuth credentials and sfcc.custom-apis scope.`,
          };
        }

        // Add type to each endpoint (no roll-up)
        const withMeta: EndpointWithMeta[] = endpoints.map((e) => ({
          ...e,
          type: getApiType(e.securityScheme),
        }));

        const columnList = buildColumnList(args);
        return buildResponse(withMeta, args, columnList, activeCodeVersion);
      },
      formatOutput: (output) => jsonResult(output),
    },
    services,
  );
}
