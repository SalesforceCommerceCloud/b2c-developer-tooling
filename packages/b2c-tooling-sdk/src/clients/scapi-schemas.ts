/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * SCAPI Schemas API client for B2C Commerce.
 *
 * Provides a fully typed client for SCAPI Schemas API operations using
 * openapi-fetch with OAuth authentication middleware. Used for discovering
 * and retrieving OpenAPI schema specifications for SCAPI APIs.
 *
 * @module clients/scapi-schemas
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import {OAuthStrategy} from '../auth/oauth.js';
import type {paths, components} from './scapi-schemas.generated.js';
import {createAuthMiddleware, createLoggingMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from './middleware-registry.js';
import {toOrganizationId, toTenantId, buildTenantScope} from './custom-apis.js';

/**
 * Re-export generated types for external use.
 */
export type {paths, components};

/**
 * Re-export organization/tenant utilities for convenience.
 */
export {toOrganizationId, toTenantId, buildTenantScope};

/**
 * The typed SCAPI Schemas client for discovering available SCAPI APIs.
 *
 * ## Common Endpoints
 *
 * | Method | Path | Description |
 * |--------|------|-------------|
 * | GET | `/organizations/{organizationId}/schemas` | List available schemas |
 * | GET | `/organizations/{organizationId}/schemas/{apiFamily}/{apiName}/{apiVersion}` | Get specific schema |
 *
 * @example
 * ```typescript
 * import { createScapiSchemasClient, toOrganizationId } from '@salesforce/b2c-tooling-sdk/clients';
 * import { OAuthStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 *
 * const auth = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * const client = createScapiSchemasClient(
 *   { shortCode: 'kv7kzm78', tenantId: 'zzxy_prd' },
 *   auth
 * );
 *
 * // List all available SCAPI schemas
 * const { data, error } = await client.GET('/organizations/{organizationId}/schemas', {
 *   params: { path: { organizationId: toOrganizationId('zzxy_prd') } }
 * });
 * ```
 *
 * @see {@link createScapiSchemasClient} for instantiation
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/scapi-schemas?meta=Summary | SCAPI Schemas API Reference}
 */
export type ScapiSchemasClient = Client<paths>;

/**
 * Helper type to extract response data from an operation.
 */
export type ScapiSchemasResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;

/**
 * Standard SCAPI Schemas error response structure.
 */
export type ScapiSchemasError = components['schemas']['ErrorResponse'];

/**
 * Schema list item from the list endpoint.
 */
export type SchemaListItem = components['schemas']['SchemaListItem'];

/**
 * Schema list result from the list endpoint.
 */
export type SchemaListResult = components['schemas']['SchemaListResult'];

/**
 * OpenAPI schema structure returned by the get endpoint.
 */
export type OpenApiSchema = components['schemas']['OpenApiSchema'];

/** Default OAuth scopes required for SCAPI Schemas (read-only) */
export const SCAPI_SCHEMAS_DEFAULT_SCOPES = ['sfcc.scapi-schemas'];

/**
 * Configuration for creating a SCAPI Schemas client.
 */
export interface ScapiSchemasClientConfig {
  /**
   * The short code for the SCAPI instance.
   * This is typically a 4-8 character alphanumeric code.
   * @example "kv7kzm78"
   */
  shortCode: string;

  /**
   * The tenant ID (with or without f_ecom_ prefix).
   * Used to build the organizationId path parameter and tenant-specific OAuth scope.
   * @example "zzxy_prd" or "f_ecom_zzxy_prd"
   */
  tenantId: string;

  /**
   * Optional scope override. If not provided, defaults to domain scope
   * (sfcc.scapi-schemas) plus tenant-specific scope (SALESFORCE_COMMERCE_API:{tenant}).
   */
  scopes?: string[];

  /**
   * Middleware registry to use for this client.
   * If not specified, uses the global middleware registry.
   */
  middlewareRegistry?: MiddlewareRegistry;
}

/**
 * Creates a typed SCAPI Schemas API client.
 *
 * Returns the openapi-fetch client directly, with authentication
 * handled via middleware. This gives full access to all openapi-fetch
 * features with type-safe paths, parameters, and responses.
 *
 * The client automatically handles OAuth scope requirements:
 * - Domain scope: `sfcc.scapi-schemas` (or custom via config.scopes)
 * - Tenant scope: `SALESFORCE_COMMERCE_API:{tenantId}`
 *
 * @param config - SCAPI Schemas client configuration including shortCode and tenantId
 * @param auth - Authentication strategy (typically OAuth)
 * @returns Typed openapi-fetch client
 *
 * @example
 * // Create SCAPI Schemas client - scopes are handled automatically
 * const oauthStrategy = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * const client = createScapiSchemasClient(
 *   { shortCode: 'kv7kzm78', tenantId: 'zzxy_prd' },
 *   oauthStrategy
 * );
 *
 * // List available SCAPI schemas
 * const { data, error } = await client.GET('/organizations/{organizationId}/schemas', {
 *   params: {
 *     path: { organizationId: toOrganizationId('zzxy_prd') }
 *   }
 * });
 *
 * // Get a specific schema
 * const { data: schema } = await client.GET(
 *   '/organizations/{organizationId}/schemas/{apiFamily}/{apiName}/{apiVersion}',
 *   {
 *     params: {
 *       path: {
 *         organizationId: toOrganizationId('zzxy_prd'),
 *         apiFamily: 'shopper',
 *         apiName: 'products',
 *         apiVersion: 'v1'
 *       },
 *       query: { expand: 'custom_properties' }
 *     }
 *   }
 * );
 */
export function createScapiSchemasClient(config: ScapiSchemasClientConfig, auth: AuthStrategy): ScapiSchemasClient {
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  const client = createClient<paths>({
    baseUrl: `https://${config.shortCode}.api.commercecloud.salesforce.com/dx/scapi-schemas/v1`,
  });

  // Build required scopes: domain scope + tenant-specific scope
  const requiredScopes = config.scopes ?? [...SCAPI_SCHEMAS_DEFAULT_SCOPES, buildTenantScope(config.tenantId)];

  // If OAuth strategy, add required scopes; otherwise use as-is
  const scopedAuth = auth instanceof OAuthStrategy ? auth.withAdditionalScopes(requiredScopes) : auth;

  // Core middleware: auth first
  client.use(createAuthMiddleware(scopedAuth));

  // Plugin middleware from registry
  for (const middleware of registry.getMiddleware('scapi-schemas')) {
    client.use(middleware);
  }

  // Logging middleware last (sees complete request with all modifications)
  client.use(createLoggingMiddleware('SCAPI-SCHEMAS'));

  return client;
}
