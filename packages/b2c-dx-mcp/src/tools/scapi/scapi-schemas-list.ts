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
  /** Filter by schema status ("current" or "deprecated") */
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
export function createSchemasListTool(services: Services): McpTool {
  return createToolAdapter<SchemasListInput, SchemaGetOutput | SchemasListOutput>(
    {
      name: 'scapi_schemas_list',
      description: `List or fetch SCAPI (Salesforce Commerce API) schema metadata and OpenAPI specs. Works for BOTH standard SCAPI (Shop, Admin, Shopper APIs) AND custom APIs (apiFamily: "custom").

**When to use this tool:**
- Use this tool when you need: schema discovery, OpenAPI specs, API metadata, or to fetch a specific schema.
- Returns API-level definitions (e.g., loyalty-points v1, shopper-products v1) with schema information.
- For endpoint-level registration status (active/not_registered), use scapi_custom_api_status instead.

**How to choose mode:**
- **List (discovery):** Omit includeSchemas, or omit any of apiFamily/apiName/apiVersion. Use when you need to discover what APIs exist or filter by family/name/version/status. Returns: schemas[] (metadata only), total, availableApiFamilies, availableApiNames, availableVersions.
- **Fetch (one schema):** Set includeSchemas=true AND provide all three: apiFamily, apiName, apiVersion. Use when you need the full OpenAPI 3.0 schema for a specific API. Returns: schema (object), apiFamily, apiName, apiVersion, baseUrl, collapsed. Set expandAll=true to get the full uncollapsed schema.

**Efficient workflows for agents:**
- To discover custom APIs: list with apiFamily: "custom" (no includeSchemas needed initially). This shows all custom APIs with their apiName and apiVersion.
- To fetch a custom API schema: if you know the API name and version, fetch directly with apiFamily: "custom", apiName: "<name>", apiVersion: "<version>", includeSchemas: true (one call). If you don't know the version, discover first with apiFamily: "custom" and apiName: "<name>".
- To discover standard APIs: list with apiFamily filter (e.g., apiFamily: "product" for product APIs).
- To fetch a specific schema: provide all three identifiers + includeSchemas: true (most efficient - one call).

**Rules:**
- If you set includeSchemas=true you MUST provide apiFamily, apiName, and apiVersion. Otherwise the tool returns an error.
- In list mode, all of apiFamily, apiName, apiVersion, status are optional filters. Omit them or set only the ones you need.
- status (current | deprecated) only applies in list mode; it is ignored in fetch mode.
- Custom APIs appear with apiFamily: "custom" in list results.

**Examples:**
- Standard APIs:
  - "What checkout APIs exist?" → list with apiFamily: "checkout" (no includeSchemas).
  - "Show me the shopper-products v1 OpenAPI schema" → apiFamily: "product", apiName: "shopper-products", apiVersion: "v1", includeSchemas: true.
- Custom APIs:
  - "What custom API definitions are available?" → list with apiFamily: "custom".
  - "Show me the loyalty-points custom API schema" → apiFamily: "custom", apiName: "loyalty-points", apiVersion: "v1", includeSchemas: true.
- General:
  - "List all current schemas" → list with status: "current".

**Requirements:** Instance must have shortCode, tenantId, and OAuth with sfcc.scapi-schemas scope.`,
      toolsets: ['PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      isGA: true,
      requiresInstance: false, // SCAPI uses OAuth directly, doesn't need B2CInstance (hostname)
      inputSchema: {
        apiFamily: z
          .string()
          .optional()
          .describe('API family (e.g., "checkout", "product", "shopper"). Use to filter or identify schemas.'),
        apiName: z
          .string()
          .optional()
          .describe('API name (e.g., "shopper-baskets", "shopper-products"). Use to filter or identify schemas.'),
        apiVersion: z
          .string()
          .optional()
          .describe('API version (e.g., "v1", "v2"). Use to filter or identify schemas.'),
        status: z
          .enum(['current', 'deprecated'])
          .optional()
          .describe(
            'Filter by schema status. "current" returns only active schemas, "deprecated" returns deprecated ones. Only works in discovery mode.',
          ),
        includeSchemas: z
          .boolean()
          .optional()
          .describe(
            'Include full OpenAPI schemas. Requires all three identifiers (apiFamily, apiName, apiVersion). Default false (returns metadata only). WARNING: Slower and increases response size.',
          ),
        expandAll: z
          .boolean()
          .optional()
          .describe(
            'Return full uncompressed schema instead of collapsed version. Only works when includeSchemas=true. Default false.',
          ),
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
