/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Scans local workspace for custom SCAPI API definitions.
 *
 * Discovers custom APIs by:
 * 1. Finding cartridges using findCartridges() (looks for .project files)
 * 2. Scanning each cartridge's cartridge/rest-apis/ directory
 * 3. Parsing schema.yaml and api.json files to extract endpoint metadata
 *
 * @module operations/scapi/local-scanner
 */

import {findCartridges} from '../code/cartridges.js';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import type {HttpMethod, LocalCustomApiEndpoint, ScanLocalCustomApisOptions, SecurityScheme} from './types.js';

/**
 * Determines the security scheme from the OpenAPI schema's security schemes.
 *
 * @param securitySchemes - The security schemes object from the OpenAPI schema
 * @returns The detected security scheme, or undefined if none found
 */
function detectSecurityScheme(securitySchemes: Record<string, unknown> = {}): SecurityScheme | undefined {
  if (securitySchemes.AmOAuth2) {
    return 'AmOAuth2';
  }
  if (securitySchemes.ShopperToken) {
    return 'ShopperToken';
  }
  return undefined;
}

/**
 * Reads and parses the api.json file to extract implementation details.
 *
 * @param apiJsonPath - Path to the api.json file
 * @returns Implementation script path, or undefined if not found
 */
function readImplementationScript(apiJsonPath: string): string | undefined {
  if (!fs.existsSync(apiJsonPath)) {
    return undefined;
  }

  try {
    const apiJsonContent = fs.readFileSync(apiJsonPath, 'utf8');
    const apiJson = JSON.parse(apiJsonContent) as {
      endpoints?: Array<{implementation?: string}>;
    };

    const implementation = apiJson.endpoints?.[0]?.implementation;
    return implementation ? `${implementation}.js` : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Extracts endpoint definitions from OpenAPI paths object.
 *
 * @param paths - The paths object from the OpenAPI schema
 * @param apiName - Name of the API
 * @param apiVersion - Version of the API
 * @param cartridgeName - Name of the cartridge
 * @param securityScheme - Detected security scheme
 * @param implementationScript - Path to implementation script
 * @returns Array of local custom API endpoints
 */
function extractEndpointsFromPaths(
  paths: Record<string, unknown>,
  apiName: string,
  apiVersion: string,
  cartridgeName: string,
  securityScheme: SecurityScheme | undefined,
  implementationScript: string | undefined,
): LocalCustomApiEndpoint[] {
  const endpoints: LocalCustomApiEndpoint[] = [];

  for (const [endpointPath, methods] of Object.entries(paths)) {
    if (typeof methods !== 'object' || !methods) {
      continue;
    }

    for (const [httpMethod, operation] of Object.entries(methods)) {
      if (typeof operation !== 'object' || !operation) {
        continue;
      }

      const op = operation as {operationId?: string; security?: unknown[]};
      const method = httpMethod.toUpperCase() as HttpMethod;

      endpoints.push({
        apiName,
        apiVersion,
        cartridgeName,
        endpointPath,
        httpMethod: method,
        operationId: op.operationId,
        securityScheme,
        schemaFile: `rest-apis/${apiName}/schema.yaml`,
        implementationScript,
        status: 'local',
      });
    }
  }

  return endpoints;
}

/**
 * Parses a custom API directory to extract endpoint definitions.
 *
 * @param apiPath - Path to the API directory
 * @param apiName - Name of the API
 * @param cartridgeName - Name of the cartridge
 * @returns Array of local custom API endpoints, or empty array on error
 */
function parseCustomApiDirectory(apiPath: string, apiName: string, cartridgeName: string): LocalCustomApiEndpoint[] {
  const schemaPath = path.join(apiPath, 'schema.yaml');
  const apiJsonPath = path.join(apiPath, 'api.json');

  if (!fs.existsSync(schemaPath)) {
    return [];
  }

  try {
    // Parse schema.yaml (OpenAPI 3.0)
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const schema = yaml.parse(schemaContent) as {
      info?: {version?: string};
      paths?: Record<string, unknown>;
      components?: {securitySchemes?: Record<string, unknown>};
    };

    const apiVersion = schema.info?.version || 'v1';
    const paths = schema.paths || {};
    const securityScheme = detectSecurityScheme(schema.components?.securitySchemes);
    const implementationScript = readImplementationScript(apiJsonPath);

    return extractEndpointsFromPaths(paths, apiName, apiVersion, cartridgeName, securityScheme, implementationScript);
  } catch (error) {
    // Skip malformed schema files but log warning
    console.warn(`Failed to parse custom API schema at ${schemaPath}:`, error);
    return [];
  }
}

/**
 * Checks if an API name passes the filter criteria.
 *
 * Filter logic:
 * - If includeApis is provided: API must be in the list to pass
 * - If excludeApis is provided: API must NOT be in the list to pass
 * - If both filters provided: includeApis takes precedence (checked first)
 * - If no filters provided: all APIs pass
 *
 * @param apiName - Name of the API to check
 * @param includeApis - Optional whitelist of API names to include
 * @param excludeApis - Optional blacklist of API names to exclude
 * @returns True if the API should be included, false otherwise
 *
 * @example
 * ```typescript
 * // Only include 'api-a'
 * shouldIncludeApi('api-a', ['api-a'], undefined); // true
 * shouldIncludeApi('api-b', ['api-a'], undefined); // false
 *
 * // Exclude 'api-b'
 * shouldIncludeApi('api-a', undefined, ['api-b']); // true
 * shouldIncludeApi('api-b', undefined, ['api-b']); // false
 *
 * // Both filters: includeApis checked first
 * shouldIncludeApi('api-a', ['api-a'], ['api-a']); // false (excluded)
 * ```
 */
function shouldIncludeApi(
  apiName: string,
  includeApis: string[] | undefined,
  excludeApis: string[] | undefined,
): boolean {
  // If whitelist provided, API must be in it
  if (includeApis !== undefined) {
    const isInWhitelist = includeApis.includes(apiName);
    if (!isInWhitelist) {
      return false;
    }
  }

  // If blacklist provided, API must NOT be in it
  if (excludeApis !== undefined) {
    const isInBlacklist = excludeApis.includes(apiName);
    if (isInBlacklist) {
      return false;
    }
  }

  // No filters blocked it, include the API
  return true;
}

/**
 * Scans a cartridge's rest-apis directory for custom API definitions.
 *
 * @param restApisPath - Path to the cartridge's rest-apis directory
 * @param cartridgeName - Name of the cartridge
 * @param includeApis - List of API names to include (if provided)
 * @param excludeApis - List of API names to exclude (if provided)
 * @returns Array of discovered endpoints
 */
function scanCartridgeApis(
  restApisPath: string,
  cartridgeName: string,
  includeApis: string[] | undefined,
  excludeApis: string[] | undefined,
): LocalCustomApiEndpoint[] {
  if (!fs.existsSync(restApisPath)) {
    return [];
  }

  const endpoints: LocalCustomApiEndpoint[] = [];
  const apiDirs = fs.readdirSync(restApisPath, {withFileTypes: true});

  for (const apiDir of apiDirs) {
    if (!apiDir.isDirectory()) {
      continue;
    }

    const apiName = apiDir.name;

    if (!shouldIncludeApi(apiName, includeApis, excludeApis)) {
      continue;
    }

    const apiPath = path.join(restApisPath, apiName);
    const apiEndpoints = parseCustomApiDirectory(apiPath, apiName, cartridgeName);
    endpoints.push(...apiEndpoints);
  }

  return endpoints;
}

/**
 * Scans the local workspace for custom API definitions.
 *
 * Uses SDK's findCartridges() to discover cartridges, then looks for
 * cartridge/rest-apis/{apiName}/schema.yaml files within each.
 *
 * @param options - Scan options (directory, filters)
 * @returns Array of discovered custom API endpoints
 *
 * @example
 * ```typescript
 * import { scanLocalCustomApis } from '@salesforce/b2c-tooling-sdk/operations/scapi';
 *
 * // Scan current directory
 * const endpoints = scanLocalCustomApis();
 *
 * // Scan specific directory
 * const endpoints = scanLocalCustomApis({ directory: './my-project' });
 *
 * // Filter by cartridge
 * const endpoints = scanLocalCustomApis({ includeCartridges: ['app_storefront_base'] });
 * ```
 */
export function scanLocalCustomApis(options: ScanLocalCustomApisOptions = {}): LocalCustomApiEndpoint[] {
  const {directory, includeCartridges, excludeCartridges, includeApis, excludeApis} = options;
  const endpoints: LocalCustomApiEndpoint[] = [];

  try {
    // Use SDK's cartridge discovery (looks for .project files)
    const cartridges = findCartridges(directory, {
      include: includeCartridges,
      exclude: excludeCartridges,
    });

    for (const cartridge of cartridges) {
      const restApisPath = path.join(cartridge.src, 'cartridge', 'rest-apis');
      const cartridgeEndpoints = scanCartridgeApis(restApisPath, cartridge.name, includeApis, excludeApis);
      endpoints.push(...cartridgeEndpoints);
    }
  } catch (error) {
    // Log error but return partial results
    console.warn('Failed to scan local custom APIs:', error);
  }

  return endpoints;
}
