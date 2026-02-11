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

// MCP-specific default columns (includes siteId since MCP returns raw endpoints per site)
const DEFAULT_COLUMNS = ['type', 'apiName', 'cartridgeName', 'endpointPath', 'httpMethod', 'status', 'siteId'] as const;

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
  // If columns specified, use those; otherwise use defaults (saves tokens)
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
  // Always filter to requested columns (saves tokens by not returning unused fields)
  const toOutput = (e: EndpointWithMeta): Record<string, unknown> =>
    pickColumns(e, columnList) as Record<string, unknown>;

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
 * Mirrors b2c scapi custom status (--status, --group-by, --columns).
 * Use columns parameter to request all fields or specific fields.
 */
interface CustomListInput {
  /** Filter by endpoint status. Same as CLI --status / -s */
  status?: 'active' | 'not_registered';
  /** Group output by "site" or "type" (Admin/Shopper). Same as CLI --group-by / -g */
  groupBy?: 'site' | 'type';
  /** Comma-separated columns to include. Same as CLI --columns / -c. Omit for defaults (7 fields). Use all field names for complete data. */
  columns?: string;
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
      description: `List Custom SCAPI endpoint registration status (active/not_registered). Returns one row per endpoint per site. For schemas, use scapi_schemas_list with apiFamily: "custom".

Use cases: Check endpoint status, verify deployment, get per-site details. Use status: "active" to filter, groupBy: "site" to group, columns: "field1,field2" for specific fields, or omit columns for defaults.

Output: Default (7 fields): type,apiName,cartridgeName,endpointPath,httpMethod,status,siteId. All fields: type,apiName,apiVersion,cartridgeName,endpointPath,httpMethod,status,siteId,securityScheme,operationId,schemaFile,implementationScript,errorReason,id.

Requires OAuth (sfcc.custom-apis scope) and instance config (shortCode, tenantId). Returns remoteError on failure.

CLI: b2c scapi custom status`,
      toolsets: ['PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      isGA: false,
      requiresInstance: false,
      inputSchema: {
        status: z.enum(['active', 'not_registered']).optional().describe('Filter by status. Omit for all.'),
        groupBy: z.enum(['site', 'type']).optional().describe('Group by siteId or type (Admin/Shopper).'),
        columns: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields. Omit for defaults (7 fields). All fields: type,apiName,apiVersion,cartridgeName,endpointPath,httpMethod,status,siteId,securityScheme,operationId,schemaFile,implementationScript,errorReason,id',
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
