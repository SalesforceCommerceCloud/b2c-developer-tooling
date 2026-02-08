/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * SCAPI Custom API List tool.
 *
 * Lists custom SCAPI API endpoints (both deployed and local).
 * Discovers custom APIs from remote instances and local workspace.
 *
 * @module tools/scapi/custom-list
 */

import {z} from 'zod';
import {createToolAdapter, jsonResult} from '../adapter.js';
import type {Services} from '../../services.js';
import type {McpTool} from '../../utils/index.js';
import type {CustomApisComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {getApiErrorMessage, type WebDavClient, buildCustomApiUrl} from '@salesforce/b2c-tooling-sdk/clients';
import {
  scanLocalCustomApis,
  getEndpointKey,
  rollUpEndpoints,
  type RolledUpEndpoint,
  type LocalCustomApiEndpoint,
} from '@salesforce/b2c-tooling-sdk/operations/scapi';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

/**
 * Configuration constants for schema retrieval performance and safety.
 */
// Note: WEBDAV_TIMEOUT_MS reserved for future timeout implementation
// const WEBDAV_TIMEOUT_MS = 30000; // 30 seconds
const MAX_SCHEMA_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_WEBDAV_DEPTH = 5; // Reduced from 10 to improve performance

/**
 * Valid HTTP methods for custom API endpoints.
 */
const VALID_HTTP_METHODS: readonly string[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const;

type CustomApiEndpoint = CustomApisComponents['schemas']['CustomApiEndpoint'];

/**
 * Input schema for scapi_custom_api_list tool.
 */
interface CustomListInput {
  /** Filter by endpoint status ("active" or "not_registered") */
  status?: 'active' | 'not_registered';
  /** Include full OpenAPI schemas via WebDAV retrieval (slower, requires WebDAV credentials) */
  includeSchemas?: boolean;
}

/**
 * Output schema for scapi_custom_api_list tool.
 */
interface CustomListOutput {
  /** Array of custom API endpoints (rolled up by site) */
  endpoints: RolledUpEndpoint[];
  /** Total number of unique endpoints found (remote + local) */
  total: number;
  /** Number of remote endpoints found */
  remoteCount: number;
  /** Number of local endpoints found */
  localCount: number;
  /** Active code version on the instance */
  activeCodeVersion?: string;
  /** Error message if remote fetch failed (tool continues with local scan) */
  remoteError?: string;
  /** Error message if WebDAV schema retrieval failed */
  webdavError?: string;
  /** Number of schemas successfully retrieved via WebDAV */
  schemasRetrieved?: number;
  /** Timestamp of the query */
  timestamp: string;
  /** Helpful message when no endpoints found or errors occurred */
  message?: string;
}

/**
 * Recursively searches WebDAV for custom API schema files.
 *
 * Searches pattern: Cartridges/{codeVersion}/{cartridgeName}/cartridge/rest-apis/{apiName}/schema.yaml
 *
 * Performance note: Direct path is attempted first. Recursive search is only used as fallback.
 * Uses limited depth to prevent excessive WebDAV calls.
 *
 * @param webdavClient - WebDAV client instance
 * @param activeCodeVersion - Active code version on the instance
 * @param cartridgeName - Name of the cartridge to search in
 * @param apiName - Name of the API to find
 * @param maxDepth - Maximum recursion depth (default from MAX_WEBDAV_DEPTH constant)
 * @returns Schema content as YAML string, or undefined if not found
 *
 * @example
 * const schema = await searchWebDAVForSchema(
 *   webdavClient,
 *   'version1',
 *   'app_custom_apis',
 *   'loyalty-points'
 * );
 */
async function searchWebDAVForSchema(
  webdavClient: WebDavClient,
  activeCodeVersion: string,
  cartridgeName: string,
  apiName: string,
  maxDepth = MAX_WEBDAV_DEPTH,
): Promise<string | undefined> {
  if (maxDepth <= 0) {
    return undefined;
  }

  try {
    // Try direct path first: Cartridges/{version}/{cartridge}/cartridge/rest-apis/{apiName}/schema.yaml
    const schemaPath = `Cartridges/${activeCodeVersion}/${cartridgeName}/cartridge/rest-apis/${apiName}/schema.yaml`;

    if (await webdavClient.exists(schemaPath)) {
      const schemaBuffer = await webdavClient.get(schemaPath);
      return Buffer.from(schemaBuffer).toString('utf8');
    }

    // If not found in standard location, try recursive search
    // Search in cartridge directory recursively
    const basePath = `Cartridges/${activeCodeVersion}/${cartridgeName}`;
    const results = await searchRecursively(webdavClient, basePath, apiName, maxDepth);

    if (results.length > 0) {
      // Return first match
      return results[0];
    }

    return undefined;
  } catch (error) {
    // Log warning - schema might not be deployed or WebDAV access issue
    console.warn(
      `Warning: Failed to retrieve schema for ${cartridgeName}/${apiName} from WebDAV:`,
      error instanceof Error ? error.message : 'Unknown error',
    );
    return undefined;
  }
}

/**
 * Helper function to recursively search directories for API schema.
 */
async function searchRecursively(
  webdavClient: WebDavClient,
  currentPath: string,
  apiName: string,
  remainingDepth: number,
): Promise<string[]> {
  if (remainingDepth <= 0) {
    return [];
  }

  try {
    // Try to find schema in current path
    const schemaPath = `${currentPath}/${apiName}/schema.yaml`;
    if (await webdavClient.exists(schemaPath)) {
      const schemaBuffer = await webdavClient.get(schemaPath);
      return [Buffer.from(schemaBuffer).toString('utf8')];
    }

    // List subdirectories and search recursively
    const entries = await webdavClient.propfind(currentPath, '1');
    const results: string[] = [];

    for (const entry of entries) {
      // Skip the current directory entry itself
      if (entry.href.endsWith(currentPath) || entry.href.endsWith(`${currentPath}/`)) {
        continue;
      }

      if (entry.isCollection) {
        // Extract directory name from href
        const dirName = entry.displayName || entry.href.split('/').findLast(Boolean) || '';
        if (dirName) {
          // eslint-disable-next-line no-await-in-loop -- Sequential WebDAV operations required
          const subResults = await searchRecursively(
            webdavClient,
            `${currentPath}/${dirName}`,
            apiName,
            remainingDepth - 1,
          );
          results.push(...subResults);
        }
      }
    }

    return results;
  } catch (error) {
    // Log warning for inaccessible directories to aid debugging
    console.warn(
      `Warning: Failed to access WebDAV directory "${currentPath}" for API "${apiName}":`,
      error instanceof Error ? error.message : 'Unknown error',
    );
    return [];
  }
}

/**
 * Fetches remote endpoints from the Custom APIs DX API.
 *
 * @param svc - Services instance
 * @param status - Optional status filter
 * @returns Remote endpoints, active code version, and any error
 */
async function fetchRemoteEndpoints(
  svc: Services,
  status?: 'active' | 'not_registered',
): Promise<{
  endpoints: CustomApiEndpoint[];
  activeCodeVersion?: string;
  error?: string;
}> {
  try {
    const client = svc.getCustomApisClient();
    const organizationId = svc.getOrganizationId();

    const {data, error, response} = await client.GET('/organizations/{organizationId}/endpoints', {
      params: {
        path: {organizationId},
        query: status ? {status} : undefined,
      },
    });

    if (error) {
      return {
        endpoints: [],
        error: `Failed to fetch remote endpoints: ${getApiErrorMessage(error, response)}`,
      };
    }

    return {
      endpoints: data?.data ?? [],
      activeCodeVersion: data?.activeCodeVersion,
    };
  } catch (error) {
    return {
      endpoints: [],
      error: error instanceof Error ? error.message : 'Unknown error fetching remote endpoints',
    };
  }
}

/**
 * Converts local endpoints to match CustomApiEndpoint structure with validation.
 *
 * @param localEndpoints - Local endpoints from scanner
 * @returns Array of validated endpoints in CustomApiEndpoint format
 */
function convertAndValidateLocalEndpoints(localEndpoints: ReturnType<typeof scanLocalCustomApis>): CustomApiEndpoint[] {
  const converted: CustomApiEndpoint[] = [];

  for (const local of localEndpoints) {
    // Validate HTTP method at runtime
    const httpMethod = local.httpMethod.toUpperCase();
    if (!VALID_HTTP_METHODS.includes(httpMethod)) {
      console.warn(
        `Warning: Invalid HTTP method "${local.httpMethod}" for endpoint ${local.endpointPath} in ${local.cartridgeName}/${local.apiName}. Skipping.`,
      );
      continue;
    }

    converted.push({
      apiName: local.apiName,
      apiVersion: local.apiVersion,
      cartridgeName: local.cartridgeName,
      endpointPath: local.endpointPath,
      httpMethod: httpMethod as CustomApiEndpoint['httpMethod'],
      operationId: local.operationId,
      securityScheme: local.securityScheme,
      schemaFile: local.schemaFile,
      implementationScript: local.implementationScript,
      status: 'not_registered', // Local endpoints are not yet registered/deployed
      siteId: undefined,
    });
  }

  return converted;
}

/**
 * Determines the source (remote/local/both) for each endpoint.
 *
 * @param rolledUp - Rolled up endpoints
 * @param remoteEndpoints - Remote endpoints
 * @param localEndpoints - Local endpoints
 */
function determineEndpointSources(
  rolledUp: RolledUpEndpoint[],
  remoteEndpoints: CustomApiEndpoint[],
  localEndpoints: CustomApiEndpoint[],
): void {
  const remoteKeys = new Set(remoteEndpoints.map((e) => getEndpointKey(e)));
  const localKeys = new Set(localEndpoints.map((e) => getEndpointKey(e)));

  for (const endpoint of rolledUp) {
    const key = getEndpointKey({
      ...endpoint,
      siteId: endpoint.siteIds[0], // Doesn't affect key, just needed for type
    } as CustomApiEndpoint);

    if (remoteKeys.has(key) && localKeys.has(key)) {
      endpoint.source = 'both';
    } else if (remoteKeys.has(key)) {
      endpoint.source = 'remote';
    } else {
      endpoint.source = 'local';
    }
  }
}

/**
 * Adds baseUrl to endpoints if configuration is available.
 *
 * @param rolledUp - Rolled up endpoints
 * @param svc - Services instance
 */
function addBaseUrlsToEndpoints(rolledUp: RolledUpEndpoint[], svc: Services): void {
  try {
    const shortCode = svc.getShortCode();
    const organizationId = svc.getTenantId() ? svc.getOrganizationId() : undefined;

    if (shortCode && organizationId) {
      for (const endpoint of rolledUp) {
        if (endpoint.apiName && endpoint.apiVersion && endpoint.endpointPath) {
          endpoint.baseUrl = buildCustomApiUrl(
            shortCode,
            organizationId,
            endpoint.apiName,
            endpoint.apiVersion,
            endpoint.endpointPath,
          );
        }
      }
    }
  } catch {
    // If config is missing, skip baseUrl (local-only mode)
  }
}

/**
 * Validates a schema (size and YAML syntax).
 *
 * @param schema - Schema content
 * @param apiName - API name for logging
 * @returns True if valid, false otherwise
 */
function validateSchema(schema: string, apiName: string): boolean {
  // Validate schema size
  if (schema.length > MAX_SCHEMA_SIZE_BYTES) {
    console.warn(
      `Warning: Schema for ${apiName} exceeds size limit (${schema.length} bytes > ${MAX_SCHEMA_SIZE_BYTES} bytes). Skipping.`,
    );
    return false;
  }

  // Validate YAML syntax
  try {
    yaml.parse(schema);
    return true;
  } catch (yamlError) {
    console.warn(
      `Warning: Invalid YAML schema for ${apiName}:`,
      yamlError instanceof Error ? yamlError.message : 'Parse error',
    );
    return false;
  }
}

/**
 * Fetches remote schemas via WebDAV concurrently.
 *
 * @param rolledUp - Rolled up endpoints
 * @param webdavClient - WebDAV client
 * @param activeCodeVersion - Active code version
 * @returns Number of schemas retrieved
 */
async function fetchRemoteSchemas(
  rolledUp: RolledUpEndpoint[],
  webdavClient: WebDavClient,
  activeCodeVersion: string,
): Promise<number> {
  let schemasRetrieved = 0;

  // Deduplicate schema fetches - multiple endpoints may share the same API
  const uniqueSchemas = new Map<string, {cartridge: string; api: string; endpoints: RolledUpEndpoint[]}>();

  for (const endpoint of rolledUp) {
    // Skip local-only endpoints or those without required metadata
    if ((endpoint.source !== 'remote' && endpoint.source !== 'both') || !endpoint.cartridgeName || !endpoint.apiName) {
      continue;
    }

    const key = `${endpoint.cartridgeName}:${endpoint.apiName}`;
    const existing = uniqueSchemas.get(key);
    if (existing) {
      existing.endpoints.push(endpoint);
    } else {
      uniqueSchemas.set(key, {
        cartridge: endpoint.cartridgeName,
        api: endpoint.apiName,
        endpoints: [endpoint],
      });
    }
  }

  // Fetch all schemas concurrently for better performance
  const schemaFetches = [...uniqueSchemas.entries()].map(async ([key, {cartridge, api, endpoints}]) => {
    try {
      const schema = await searchWebDAVForSchema(webdavClient, activeCodeVersion, cartridge, api);

      if (schema && validateSchema(schema, api)) {
        return {key, schema, endpoints};
      }

      return {key, schema: undefined, endpoints};
    } catch (error) {
      console.warn(
        `Warning: Failed to fetch schema for ${api}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      return {key, schema: undefined, endpoints};
    }
  });

  // Wait for all schema fetches to complete
  const schemaResults = await Promise.all(schemaFetches);

  // Apply schemas to all endpoints that share the same API
  for (const {schema, endpoints} of schemaResults) {
    if (schema) {
      for (const endpoint of endpoints) {
        endpoint.schema = schema;
        schemasRetrieved++;
      }
    }
  }

  return schemasRetrieved;
}

/**
 * Checks if an endpoint needs a local schema file to be read.
 *
 * An endpoint needs a local schema if:
 * - It has a local definition (source is 'local' or 'both')
 * - No schema has been loaded yet (e.g., not fetched from WebDAV)
 * - Has the required metadata (cartridge name and API name)
 *
 * @param endpoint - Endpoint to check
 * @returns True if endpoint needs local schema
 */
function needsLocalSchema(endpoint: RolledUpEndpoint): boolean {
  return (
    (endpoint.source === 'local' || endpoint.source === 'both') &&
    !endpoint.schema &&
    Boolean(endpoint.cartridgeName) &&
    Boolean(endpoint.apiName)
  );
}

/**
 * Reads a single local schema file from the filesystem.
 *
 * @param workingDir - Working directory
 * @param cartridgeName - Cartridge name
 * @param apiName - API name
 * @returns Schema content if found and valid, undefined otherwise
 */
function readLocalSchemaFile(workingDir: string, cartridgeName: string, apiName: string): string | undefined {
  try {
    const cartridgePath = path.join(
      workingDir,
      'cartridges',
      cartridgeName,
      'cartridge',
      'rest-apis',
      apiName,
      'schema.yaml',
    );

    if (!fs.existsSync(cartridgePath)) {
      return undefined;
    }

    const schema = fs.readFileSync(cartridgePath, 'utf8');

    if (!validateSchema(schema, apiName)) {
      return undefined;
    }

    return schema;
  } catch (error) {
    console.warn(
      `Warning: Failed to read local schema at cartridges/${cartridgeName}/cartridge/rest-apis/${apiName}/schema.yaml:`,
      error instanceof Error ? error.message : 'Unknown error',
    );
    return undefined;
  }
}

/**
 * Reads local schemas from filesystem with caching.
 *
 * @param rolledUp - Rolled up endpoints
 * @param localEndpoints - Local endpoints from scanner
 * @param workingDir - Working directory
 * @returns Number of schemas retrieved
 */
function readLocalSchemas(
  rolledUp: RolledUpEndpoint[],
  localEndpoints: ReturnType<typeof scanLocalCustomApis>,
  workingDir: string,
): number {
  let schemasRetrieved = 0;
  const localSchemaCache = new Map<string, string | undefined>();

  for (const endpoint of rolledUp) {
    if (!needsLocalSchema(endpoint)) {
      continue;
    }

    // Type assertion safe because needsLocalSchema checks these exist
    const cartridgeName = endpoint.cartridgeName!;
    const apiName = endpoint.apiName!;
    const cacheKey = `${cartridgeName}:${apiName}`;

    // Check cache first
    if (localSchemaCache.has(cacheKey)) {
      const cachedSchema = localSchemaCache.get(cacheKey);
      if (cachedSchema) {
        endpoint.schema = cachedSchema;
        schemasRetrieved++;
      }
      continue;
    }

    // Find the local endpoint to verify it exists
    const localEndpoint = localEndpoints.find((le: LocalCustomApiEndpoint): boolean => {
      return (
        le.apiName === apiName &&
        le.apiVersion === endpoint.apiVersion &&
        le.cartridgeName === cartridgeName &&
        le.endpointPath === endpoint.endpointPath &&
        le.httpMethod === endpoint.httpMethod
      );
    });

    if (!localEndpoint) {
      continue;
    }

    // Read and validate schema file
    const schema = readLocalSchemaFile(workingDir, cartridgeName, apiName);
    localSchemaCache.set(cacheKey, schema);

    if (schema) {
      endpoint.schema = schema;
      schemasRetrieved++;
    }
  }

  return schemasRetrieved;
}

/**
 * Generates a helpful result message based on the operation outcome.
 *
 * @param rolledUp - Rolled up endpoints
 * @param remoteEndpoints - Remote endpoints
 * @param localEndpoints - Local endpoints
 * @param remoteError - Remote fetch error if any
 * @returns Message string or undefined
 */
function generateResultMessage(
  rolledUp: RolledUpEndpoint[],
  remoteEndpoints: CustomApiEndpoint[],
  localEndpoints: ReturnType<typeof scanLocalCustomApis>,
  remoteError?: string,
): string | undefined {
  // Handle empty results
  if (rolledUp.length === 0) {
    if (remoteError && localEndpoints.length === 0) {
      return `No custom API endpoints found. Remote fetch failed: ${remoteError}. No local endpoints found in workspace.`;
    }
    if (remoteError) {
      return `Remote fetch failed: ${remoteError}. Showing local endpoints only.`;
    }
    if (localEndpoints.length === 0 && remoteEndpoints.length === 0) {
      return 'No custom API endpoints found in workspace or remote instance. Create custom APIs in cartridges/*/cartridge/rest-apis/ or deploy them to the instance.';
    }
  }

  // Handle remote fetch failure with local endpoints present
  if (remoteError && localEndpoints.length > 0 && remoteEndpoints.length === 0) {
    return `Remote fetch failed: ${remoteError}. Showing ${localEndpoints.length} local endpoint(s) only.`;
  }

  // Informational: Remote succeeded but returned 0 endpoints while local has some
  if (!remoteError && remoteEndpoints.length === 0 && localEndpoints.length > 0) {
    return `Found ${localEndpoints.length} local endpoint(s). No endpoints currently deployed to the remote instance.`;
  }

  // Informational: Only remote endpoints found (no local definitions)
  if (!remoteError && remoteEndpoints.length > 0 && localEndpoints.length === 0) {
    return `Found ${remoteEndpoints.length} deployed endpoint(s). No local endpoint definitions found in workspace.`;
  }

  return undefined;
}

/**
 * Creates the scapi_custom_api_list tool.
 *
 * This tool lists custom SCAPI API endpoints from both remote instances
 * and local workspace. It provides comprehensive discovery of custom APIs
 * for development, deployment, and troubleshooting workflows.
 *
 * @param services - MCP services instance
 * @returns MCP tool for listing custom APIs
 */
export function createCustomListTool(services: Services): McpTool {
  return createToolAdapter<CustomListInput, CustomListOutput>(
    {
      name: 'scapi_custom_api_list',
      description: `List custom SCAPI API endpoints (developer-created APIs).

This tool lists CUSTOM APIs created by developers, not standard Commerce Cloud APIs.
For standard SCAPI schemas (Shop API, Admin API, etc.), use scapi_schemas_list instead.

**What It Does:**

1. Fetches deployed custom endpoints from remote instance (requires OAuth)
2. Scans local workspace for custom API definitions in cartridges/*/cartridge/rest-apis/
3. Merges both sources and shows which are deployed, local-only, or both
4. Optionally retrieves full OpenAPI schemas (includeSchemas=true)

**Returns for Each Endpoint:**
- apiName, apiVersion, cartridgeName
- endpointPath, httpMethod
- baseUrl: Full SCAPI URL for testing (e.g., https://shortcode.api.commercecloud.salesforce.com/custom/cartridge/api-name/v1/path)
- status: "active" (deployed successfully) or "not_registered" (failed deployment)
- source: "remote" (deployed only), "local" (not deployed), or "both"
- siteIds: Sites where endpoint is available (for deployed endpoints)
- schema: Full OpenAPI YAML (only if includeSchemas=true)

**Usage Examples:**

List all custom APIs (fast):
- {} or {status: "active"}

List with full schemas (slower):
- {includeSchemas: true}

**When to Use:**
- User asks about "my custom APIs" or "custom endpoints"
- Checking if custom APIs are deployed
- Finding custom APIs in workspace
- Comparing local definitions vs. deployed endpoints
- Troubleshooting custom API registration issues

**Agent Guidelines:**
- Default behavior (includeSchemas=false) is fast - returns metadata only
- Only set includeSchemas=true when user needs schema structure/details
- Tool works without credentials (local scan only) or with OAuth (remote + local)
- If remote fetch fails, tool continues with local scan and provides clear error message
- Endpoints are "rolled up" - same endpoint on multiple sites appears once with all siteIds

**Performance:**
- Concurrent WebDAV fetching for remote schemas
- Caching prevents duplicate fetches
- Schemas validated for size (<5MB) and YAML syntax
- Fast local filesystem scan

**Requirements:**
- Remote fetch: SCAPI shortCode, tenantId, OAuth credentials
- Local scan: None (always works)
- Schema retrieval: WebDAV username/password (for remote), filesystem access (for local)`,
      toolsets: ['PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      isGA: false,
      requiresInstance: false, // Can work without instance (local scan) or with OAuth (remote + local)
      inputSchema: {
        status: z
          .enum(['active', 'not_registered'])
          .optional()
          .describe(
            'Filter by endpoint status. "active" = successfully deployed, "not_registered" = failed registration.',
          ),
        includeSchemas: z
          .boolean()
          .optional()
          .describe(
            'Include full OpenAPI schemas by retrieving schema.yaml files via WebDAV (remote) or file system (local). ' +
              'WARNING: Significantly slower than default. Can add 5-30 seconds depending on number of endpoints. ' +
              'Remote schemas require WebDAV username/password configured. ' +
              'Schemas are validated for size (<5MB) and YAML syntax before inclusion. ' +
              'Uses concurrent fetching and caching for optimal performance. ' +
              'Schemas are added to each endpoint as "schema" field containing YAML content.',
          ),
      },
      async execute(args, {services: svc}) {
        const workingDir = svc.getCwd();

        // 1. Fetch remote endpoints
        const {
          endpoints: remoteEndpoints,
          activeCodeVersion,
          error: remoteError,
        } = await fetchRemoteEndpoints(svc, args.status);

        // 2. Scan and convert local endpoints
        const localEndpoints = scanLocalCustomApis({directory: workingDir});
        const localAsRemote = convertAndValidateLocalEndpoints(localEndpoints);

        // 3. Merge and roll up endpoints
        const allEndpoints = [...remoteEndpoints, ...localAsRemote];
        const rolledUp = rollUpEndpoints(allEndpoints);

        // 4. Determine source for each endpoint (remote/local/both)
        determineEndpointSources(rolledUp, remoteEndpoints, localAsRemote);

        // 5. Add baseUrl to endpoints
        addBaseUrlsToEndpoints(rolledUp, svc);

        // 6. Optionally retrieve schemas
        let webdavError: string | undefined;
        let schemasRetrieved = 0;

        if (args.includeSchemas) {
          // Fetch remote schemas via WebDAV
          if (activeCodeVersion && remoteEndpoints.length > 0) {
            try {
              const webdavClient = svc.getWebDavClient();
              schemasRetrieved += await fetchRemoteSchemas(rolledUp, webdavClient, activeCodeVersion);
            } catch (error) {
              webdavError = `Failed to retrieve schemas via WebDAV: ${error instanceof Error ? error.message : 'Unknown error'}. Check WebDAV credentials and network connectivity.`;
            }
          }

          // Read local schemas from filesystem
          schemasRetrieved += readLocalSchemas(rolledUp, localEndpoints, workingDir);
        }

        // 7. Generate result message
        const message = generateResultMessage(rolledUp, remoteEndpoints, localEndpoints, remoteError);

        return {
          endpoints: rolledUp,
          total: rolledUp.length,
          activeCodeVersion,
          remoteCount: remoteEndpoints.length,
          localCount: localEndpoints.length,
          remoteError,
          webdavError,
          schemasRetrieved: args.includeSchemas ? schemasRetrieved : undefined,
          timestamp: new Date().toISOString(),
          message,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    services,
  );
}
