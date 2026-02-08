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
 * @module tools/scapi/scapi-list
 */

import {z} from 'zod';
import {createToolAdapter, jsonResult} from '../adapter.js';
import type {Services} from '../../services.js';
import type {McpTool} from '../../utils/index.js';
import type {SchemaListItem} from '@salesforce/b2c-tooling-sdk/clients';
import {getApiErrorMessage, buildScapiApiUrl} from '@salesforce/b2c-tooling-sdk/clients';
import {collapseOpenApiSchema, type OpenApiSchemaInput} from '@salesforce/b2c-tooling-sdk/schemas';

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
 * Schema metadata without the authenticated 'link' field.
 * The link field is removed because it's an authenticated endpoint that users cannot access directly.
 */
type SchemaMetadata = Omit<SchemaListItem, 'link'> & {
  /** Base URL for calling the actual SCAPI API (not the schema endpoint) */
  baseUrl?: string;
};

/**
 * Output for discovery mode (listing schemas with metadata).
 */
interface SchemasListOutput {
  /** Array of schema metadata objects (without 'link' field) */
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

  // Remove 'link' field from schemas and add baseUrl for the actual SCAPI API
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const filteredSchemas = schemas.map(({link, ...schema}) => {
    // Build base URL if we have all required fields
    const baseUrl =
      shortCode && schema.apiFamily && schema.apiName && schema.apiVersion
        ? buildScapiApiUrl(shortCode, schema.apiFamily, schema.apiName, schema.apiVersion)
        : undefined;

    return {...schema, baseUrl};
  });

  // Extract unique values for agent convenience
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
 * Extracts unique filter values from a list of schemas.
 *
 * This function analyzes all schemas and returns the unique values for
 * apiFamily, apiName, and apiVersion. This helps users/agents discover
 * what filter options are available without prior knowledge.
 *
 * @param schemas - Array of schema list items from the API
 * @returns Object containing sorted arrays of unique values, or undefined if none found
 *
 * @example
 * ```typescript
 * const schemas = [
 *   { apiFamily: "checkout", apiName: "shopper-baskets", apiVersion: "v1" },
 *   { apiFamily: "checkout", apiName: "shopper-orders", apiVersion: "v1" },
 *   { apiFamily: "product", apiName: "shopper-products", apiVersion: "v2" },
 * ];
 *
 * const result = getAvailableFilters(schemas);
 * // Returns:
 * // {
 * //   availableApiFamilies: ["checkout", "product"],
 * //   availableApiNames: ["shopper-baskets", "shopper-orders", "shopper-products"],
 * //   availableVersions: ["v1", "v2"]
 * // }
 * ```
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
 * This tool has two modes:
 * 1. Discovery mode: List available SCAPI schemas with metadata (default, fast)
 * 2. Fetch mode: Get full OpenAPI schema (requires includeSchemas=true + all three identifiers, slower)
 *
 * @param services - MCP services instance
 * @returns MCP tool for listing/fetching SCAPI schemas
 */
export function createSchemasListTool(services: Services): McpTool {
  return createToolAdapter<SchemasListInput, SchemaGetOutput | SchemasListOutput>(
    {
      name: 'scapi_schemas_list',
      description: `List or fetch standard SCAPI (Salesforce Commerce API) schemas.

This tool works with STANDARD Commerce Cloud APIs like Shop API, Admin API, and Shopper APIs.
For CUSTOM APIs created by developers, use scapi_custom_api_list instead.

**Two Modes:**

1. **Discovery Mode** (default, fast)
   - Returns metadata only: apiFamily, apiName, apiVersion, status, baseUrl
   - Use to find what SCAPI schemas are available
   - Provides availableApiFamilies, availableApiNames, availableVersions for filtering
   - Example: {} (no params) returns all schemas
   
2. **Fetch Mode** (opt-in, slower)
   - Returns full OpenAPI 3.0 schema definition
   - Requires: apiFamily + apiName + apiVersion + includeSchemas=true
   - Schemas are collapsed by default (use expandAll=true for full schema)
   - Use when you need paths, operations, request/response models

**When to Use Each Mode:**

Discovery mode (fast):
- "What SCAPI APIs are available?"
- "List checkout APIs"
- "Show me all v2 APIs"
- User wants to explore or find an API

Fetch mode (slower):
- "Show me the Shop API schema"
- "What endpoints does shopper-baskets v2 have?"
- User needs schema details to make API calls or generate code

**Filter Examples (Discovery Mode):**
- {} - List all schemas
- {apiFamily: "checkout"} - List all checkout APIs
- {apiFamily: "shopper", status: "current"} - Current shopper APIs only
- {apiVersion: "v2"} - All v2 APIs across families

**Fetch Examples (Fetch Mode):**
- {apiFamily: "checkout", apiName: "shopper-baskets", apiVersion: "v2", includeSchemas: true}
- {apiFamily: "product", apiName: "shopper-products", apiVersion: "v1", includeSchemas: true, expandAll: true}

**Agent Guidelines:**
- ALWAYS start with discovery mode to find available APIs (faster, cheaper)
- Only use includeSchemas=true when you need schema structure/details
- Use collapsed schemas (default) - they're sufficient for understanding API structure
- Use expandAll=true only if user explicitly needs full schema details
- The 'baseUrl' field shows where to call the API (e.g., https://shortcode.api.commercecloud.salesforce.com/shopper/products/v1)
- DO NOT show 'link' field URLs - those are internal authenticated endpoints

**Output Fields:**
- baseUrl: Where to call the actual SCAPI API (for making requests)
- availableApiFamilies/Names/Versions: Help users discover filter options
- status: "current" (active) or "deprecated"
- schema: Full OpenAPI schema (only in fetch mode with includeSchemas=true)

Note: Requires SCAPI shortCode, tenantId, and OAuth credentials configured.`,
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
