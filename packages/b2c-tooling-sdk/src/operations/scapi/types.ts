/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {components} from '../../clients/custom-apis.generated.js';

/**
 * Valid HTTP methods for custom API endpoints.
 */
export type HttpMethod = 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT';

/**
 * Valid security schemes for custom API endpoints.
 */
export type SecurityScheme = 'AmOAuth2' | 'ShopperToken';

/**
 * Represents a local custom API endpoint found in the workspace.
 */
export interface LocalCustomApiEndpoint {
  /** Custom API name (from folder name or schema.yaml info.title) */
  apiName: string;
  /** API version (from schema.yaml info.version) */
  apiVersion: string;
  /** Name of the cartridge containing this API */
  cartridgeName: string;
  /** Endpoint path (e.g., "/hello", "/items/{itemId}") */
  endpointPath: string;
  /** HTTP method (GET, POST, etc.) */
  httpMethod: HttpMethod;
  /** Operation ID from OpenAPI schema */
  operationId?: string;
  /** Security scheme (AmOAuth2 for Admin APIs, ShopperToken for Shopper APIs) */
  securityScheme?: SecurityScheme;
  /** Relative path to schema file within cartridge */
  schemaFile: string;
  /** Implementation script file (e.g., "script.js") */
  implementationScript?: string;
  /** Status indicator (always "local" for workspace-scanned endpoints) */
  status: 'local' | 'not_deployed';
}

/**
 * Options for scanning local custom APIs.
 */
export interface ScanLocalCustomApisOptions {
  /** Directory to search for cartridges (defaults to cwd) */
  directory?: string;
  /** Include only these cartridge names */
  includeCartridges?: string[];
  /** Exclude these cartridge names */
  excludeCartridges?: string[];
  /** Include only these API names */
  includeApis?: string[];
  /** Exclude these API names */
  excludeApis?: string[];
}

/**
 * Type alias for CustomApiEndpoint from generated types.
 */
type CustomApiEndpoint = components['schemas']['CustomApiEndpoint'];

/**
 * Rolled-up endpoint with sites combined.
 *
 * Multiple endpoints with same API/version/path/method are grouped, with siteIds combined.
 * This interface extends CustomApiEndpoint but replaces the single siteId with an array
 * of siteIds, and adds additional metadata fields.
 *
 * Used by {@link rollUpEndpoints} utility function.
 *
 * @example
 * ```typescript
 * import { rollUpEndpoints } from '@salesforce/b2c-tooling-sdk/operations/scapi';
 *
 * const endpoints = [
 *   { apiName: 'loyalty', siteId: 'site-a', ... },
 *   { apiName: 'loyalty', siteId: 'site-b', ... },
 * ];
 *
 * const rolledUp: RolledUpEndpoint[] = rollUpEndpoints(endpoints);
 * // Returns: [{ apiName: 'loyalty', siteIds: ['site-a', 'site-b'], ... }]
 * ```
 */
export interface RolledUpEndpoint extends Omit<CustomApiEndpoint, 'siteId'> {
  /** Array of site IDs where this endpoint is deployed (empty for local-only endpoints) */
  siteIds: string[];
  /** Human-readable API type (Admin, Shopper) */
  type: string;
  /** Source of the endpoint (remote or local) */
  source?: 'both' | 'local' | 'remote';
  /** Full SCAPI URL for testing this endpoint (includes path parameters as placeholders) */
  baseUrl?: string;
  /** Full OpenAPI schema content (YAML) if includeSchemas flag was set */
  schema?: string;
}
