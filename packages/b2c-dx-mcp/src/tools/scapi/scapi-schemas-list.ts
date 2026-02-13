/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * SCAPI Schemas List tool.
 *
 * Lists available SCAPI schemas with optional filtering by apiFamily, apiName, apiVersion, and status.
 * Optionally fetches full OpenAPI schemas when includeSchemas=true is provided along with all three identifiers.
 * Matches the CLI command: b2c scapi schemas list
 *
 * @module tools/scapi/scapi-schemas-list
 */

import {z} from 'zod';
import {createToolAdapter, jsonResult} from '../adapter.js';
import type {Services} from '../../services.js';
import type {McpTool} from '../../utils/index.js';
import type {SchemaListItem} from '@salesforce/b2c-tooling-sdk/clients';
import {getApiErrorMessage} from '@salesforce/b2c-tooling-sdk/clients';
import {collapseOpenApiSchema, type OpenApiSchemaInput} from '@salesforce/b2c-tooling-sdk/schemas';

/**
 * Builds the base URL for a SCAPI API endpoint.
 *
 * Constructs the base URL for making SCAPI API calls based on the instance short code,
 * API family, API name, and version.
 *
 * @param shortCode - SCAPI instance short code (e.g., "kv7kzm78")
 * @param apiFamily - API family (e.g., "shopper", "checkout", "product")
 * @param apiName - API name (e.g., "products", "baskets", "orders")
 * @param apiVersion - API version (e.g., "v1", "v2")
 * @returns Full base URL for the SCAPI API
 *
 * @example
 * ```typescript
 * const url = buildScapiApiUrl("kv7kzm78", "shopper", "products", "v1");
 * // Returns: "https://kv7kzm78.api.commercecloud.salesforce.com/shopper/products/v1"
 * ```
 */
function buildScapiApiUrl(shortCode: string, apiFamily: string, apiName: string, apiVersion: string): string {
  return `https://${shortCode}.api.commercecloud.salesforce.com/${apiFamily}/${apiName}/${apiVersion}`;
}

/**
 * Input parameters for scapi_schemas_list tool.
 */
interface SchemasListInput {
  /** Filter by API family (e.g., "shopper", "product", "checkout") */
  apiFamily?: string;
  /** Filter by API name (e.g., "shopper-products", "shopper-baskets") */
  apiName?: string;
  /** Filter by API version (e.g., "v1", "v2") */
  apiVersion?: string;
  /** Filter by schema status ("current" or "deprecated"). Use "current" to see only active schemas, or "deprecated" to find schemas being phased out. Only works in list mode (discovery). Omit to return all schemas. */
  status?: 'current' | 'deprecated';
  /** Include full OpenAPI schemas (slower, requires all three: apiFamily, apiName, apiVersion) */
  includeSchemas?: boolean;
  /** If true, return full schema without collapsing (only works when includeSchemas=true) */
  expandAll?: boolean;
}

/**
 * Schema metadata without the authenticated 'link' field (with optional baseUrl).
 */
type SchemaMetadata = Omit<SchemaListItem, 'link'> & {
  /** Base URL for calling the actual SCAPI API (not the schema endpoint) */
  baseUrl?: string;
};

/**
 * Output for discovery mode (listing schemas with metadata).
 */
interface SchemasListOutput {
  /** Array of schema metadata objects (without 'link' field, with optional baseUrl) */
  schemas: SchemaMetadata[];
  /** Total number of schemas found */
  total: number;
  /** Timestamp of the query */
  timestamp: string;
  /** Unique API families found (for discovery) */
  availableApiFamilies?: string[];
  /** Unique API names found (for discovery) */
  availableApiNames?: string[];
  /** Unique API versions found (for discovery) */
  availableVersions?: string[];
  /** Helpful message when no schemas found or to explain results */
  message?: string;
}

/**
 * Output for fetch mode (getting a specific schema).
 */
interface SchemaGetOutput {
  /** API family */
  apiFamily: string;
  /** API name */
  apiName: string;
  /** API version */
  apiVersion: string;
  /** Full OpenAPI schema (collapsed by default for context efficiency) */
  schema: Record<string, unknown>;
  /** Timestamp of the query */
  timestamp: string;
  /** Whether this is a collapsed schema */
  collapsed: boolean;
  /** Warning message if invalid parameter combinations were provided */
  warning?: string;
  /** Base URL for calling the actual SCAPI API */
  baseUrl?: string;
}

/**
 * Fetches a specific schema from the SCAPI Schemas API.
 *
 * @param params - Fetch parameters
 * @param params.client - SCAPI Schemas client
 * @param params.organizationId - Organization ID
 * @param params.args - Input arguments with API identifiers
 * @param params.shortCode - Optional short code for building base URL
 * @returns Schema fetch output
 */
async function fetchSpecificSchema(params: {
  client: ReturnType<Services['getScapiSchemasClient']>;
  organizationId: string;
  args: SchemasListInput;
  shortCode?: string;
}): Promise<SchemaGetOutput> {
  const {client, organizationId, args, shortCode} = params;
  const {apiFamily, apiName, apiVersion, expandAll, status} = args;

  // Warn if status filter was provided (it's ignored in fetch mode)
  const warning = status
    ? `Note: 'status' filter is ignored when fetching a specific schema. The API endpoint for retrieving a specific schema (${apiFamily}/${apiName}/${apiVersion}) does not support status filtering - you're already specifying the exact version. Use discovery mode (omit one or more of apiFamily/apiName/apiVersion) to filter by status.`
    : undefined;

  const {data, error, response} = await client.GET(
    '/organizations/{organizationId}/schemas/{apiFamily}/{apiName}/{apiVersion}',
    {
      params: {
        path: {organizationId, apiFamily: apiFamily!, apiName: apiName!, apiVersion: apiVersion!},
      },
    },
  );

  if (error) {
    throw new Error(
      `Failed to fetch schema for ${apiFamily}/${apiName}/${apiVersion}: ${getApiErrorMessage(error, response)}`,
    );
  }

  // Apply collapsing unless expandAll is requested
  const collapsed = !expandAll;
  const processedSchema: Record<string, unknown> = collapsed
    ? (collapseOpenApiSchema(data as OpenApiSchemaInput) as Record<string, unknown>)
    : (data as Record<string, unknown>);

  // Build base URL for the SCAPI API (where to call the API)
  const baseUrl =
    shortCode && apiFamily && apiName && apiVersion
      ? buildScapiApiUrl(shortCode, apiFamily, apiName, apiVersion)
      : undefined;

  return {
    apiFamily: apiFamily!,
    apiName: apiName!,
    apiVersion: apiVersion!,
    schema: processedSchema,
    timestamp: new Date().toISOString(),
    collapsed,
    warning,
    baseUrl,
  };
}

/**
 * Fetches and filters schemas list from the SCAPI Schemas API.
 *
 * @param params - Fetch parameters
 * @param params.client - SCAPI Schemas client
 * @param params.organizationId - Organization ID
 * @param params.args - Input parameters
 * @param params.shortCode - Optional short code for building base URLs
 * @returns Discovery mode output
 */
async function fetchSchemasList(params: {
  client: ReturnType<Services['getScapiSchemasClient']>;
  organizationId: string;
  args: SchemasListInput;
  shortCode?: string;
}): Promise<SchemasListOutput> {
  const {client, organizationId, args, shortCode} = params;
  const {data, error, response} = await client.GET('/organizations/{organizationId}/schemas', {
    params: {
      path: {organizationId},
      query: {
        apiFamily: args.apiFamily,
        apiName: args.apiName,
        apiVersion: args.apiVersion,
        status: args.status,
      },
    },
  });

  if (error) {
    throw new Error(`Failed to fetch SCAPI schemas: ${getApiErrorMessage(error, response)}`);
  }

  const schemas = data?.data ?? [];

  const filteredSchemas = prepareSchemaListForConsumer(schemas, shortCode);
  const discoveryMetadata = getAvailableFilters(schemas);

  // Generate helpful message for empty results
  const message = schemas.length === 0 ? generateEmptyResultMessage(args) : undefined;

  return {
    schemas: filteredSchemas,
    total: data?.total ?? schemas.length,
    timestamp: new Date().toISOString(),
    ...discoveryMetadata,
    message,
  };
}

/**
 * Generates helpful message when no schemas are found.
 */
function generateEmptyResultMessage(args: SchemasListInput): string {
  const hasFilters = args.apiFamily || args.apiName || args.apiVersion || args.status;
  if (hasFilters) {
    const activeFilters: string[] = [];
    if (args.apiFamily) activeFilters.push(`apiFamily="${args.apiFamily}"`);
    if (args.apiName) activeFilters.push(`apiName="${args.apiName}"`);
    if (args.apiVersion) activeFilters.push(`apiVersion="${args.apiVersion}"`);
    if (args.status) activeFilters.push(`status="${args.status}"`);
    return `No SCAPI schemas match the filters: ${activeFilters.join(', ')}. Try removing some filters or check the filter values. Use discovery mode without filters to see all available schemas.`;
  }
  return 'No SCAPI schemas available. This could indicate: (1) Invalid tenant ID or organization ID, (2) Missing OAuth scopes (requires sfcc.scapi-schemas), or (3) No schemas published for this organization. Verify your credentials and tenant configuration.';
}

/**
 * Prepares schema list for consumer: strips link, adds baseUrl when shortCode provided.
 */
function prepareSchemaListForConsumer(schemas: SchemaListItem[], shortCode?: string): SchemaMetadata[] {
  return schemas.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {link, ...rest} = item;
    const baseUrl =
      shortCode && item.apiFamily && item.apiName && item.apiVersion
        ? buildScapiApiUrl(shortCode, item.apiFamily, item.apiName, item.apiVersion)
        : undefined;
    return {...rest, baseUrl};
  });
}

/**
 * Extracts unique filter values (apiFamily, apiName, apiVersion) from a schema list.
 */
function getAvailableFilters(schemas: SchemaListItem[]): {
  availableApiFamilies?: string[];
  availableApiNames?: string[];
  availableVersions?: string[];
} {
  if (schemas.length === 0) {
    return {};
  }
  const availableApiFamilies = [
    ...new Set(schemas.map((s) => s.apiFamily).filter((v) => v !== undefined) as string[]),
  ].sort();
  const availableApiNames = [
    ...new Set(schemas.map((s) => s.apiName).filter((v) => v !== undefined) as string[]),
  ].sort();
  const availableVersions = [
    ...new Set(schemas.map((s) => s.apiVersion).filter((v) => v !== undefined) as string[]),
  ].sort();
  return {
    availableApiFamilies: availableApiFamilies.length > 0 ? availableApiFamilies : undefined,
    availableApiNames: availableApiNames.length > 0 ? availableApiNames : undefined,
    availableVersions: availableVersions.length > 0 ? availableVersions : undefined,
  };
}

/**
 * Creates the scapi_schemas_list tool.
 *
 * Mirrors CLI: b2c scapi schemas list (discovery) and b2c scapi schemas get (fetch).
 * Lists or fetches SCAPI schema specifications; includes standard SCAPI and custom API as schema types.
 *
 * @param services - MCP services instance
 * @returns MCP tool for listing/fetching SCAPI schemas
 */
export function createScapiSchemasListTool(services: Services): McpTool {
  return createToolAdapter<SchemasListInput, SchemaGetOutput | SchemasListOutput>(
    {
      name: 'scapi_schemas_list',
      description: `List or fetch SCAPI schema metadata and OpenAPI specs for standard SCAPI (Shop/Admin/Shopper) and custom APIs (apiFamily: "custom"). For endpoint registration status, use scapi_custom_apis_status.

**Modes:**
- **List (discovery):** Omit includeSchemas or any identifier. Returns metadata: schemas[], total, availableApiFamilies/Names/Versions.
- **Fetch:** Set includeSchemas=true + all three: apiFamily, apiName, apiVersion. Returns full OpenAPI schema (collapsed by default; set expandAll=true for full).

**Rules:** includeSchemas requires all three identifiers. status only works in list mode (use "current" for active schemas, "deprecated" for phased-out schemas). Custom APIs use apiFamily: "custom".

**Requirements:** OAuth with sfcc.scapi-schemas scope.`,
      toolsets: ['PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      isGA: false,
      requiresInstance: false, // SCAPI uses OAuth directly, doesn't need B2CInstance (hostname)
      inputSchema: {
        apiFamily: z.string().optional().describe('API family (e.g., "checkout", "product", "custom").'),
        apiName: z.string().optional().describe('API name (e.g., "shopper-baskets", "shopper-products").'),
        apiVersion: z.string().optional().describe('API version (e.g., "v1", "v2").'),
        status: z
          .enum(['current', 'deprecated'])
          .optional()
          .describe('Filter by status (list mode only). Omit to return all schemas.'),
        includeSchemas: z
          .boolean()
          .default(false)
          .describe('Fetch full OpenAPI schema. Requires apiFamily+apiName+apiVersion. Default: false.'),
        expandAll: z
          .boolean()
          .default(false)
          .describe('Return full uncompressed schema. Only when includeSchemas=true. Default: false.'),
      },
      async execute(args, {services: svc}) {
        // Get client and organization ID
        const client = svc.getScapiSchemasClient();
        const organizationId = svc.getOrganizationId();

        // Get shortCode for building base URLs (optional)
        let shortCode: string | undefined;
        try {
          shortCode = svc.getShortCode();
        } catch {
          // Continue without shortCode if not available
        }

        // Determine operation mode
        const hasAllIdentifiers = Boolean(args.apiFamily && args.apiName && args.apiVersion);
        const isFetchMode = hasAllIdentifiers && args.includeSchemas;

        // Validate includeSchemas flag
        if (args.includeSchemas && !hasAllIdentifiers) {
          throw new Error(
            'includeSchemas=true requires all three identifiers: apiFamily, apiName, and apiVersion. ' +
              'Please provide all three to fetch a specific schema, or omit includeSchemas to discover available schemas.',
          );
        }

        // Execute appropriate mode
        if (isFetchMode) {
          return fetchSpecificSchema({client, organizationId, args, shortCode});
        }

        return fetchSchemasList({client, organizationId, args, shortCode});
      },
      formatOutput: (output) => jsonResult(output),
    },
    services,
  );
}
