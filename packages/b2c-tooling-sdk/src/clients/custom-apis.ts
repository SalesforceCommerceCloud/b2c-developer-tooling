/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Custom APIs DX API client for B2C Commerce.
 *
 * Provides a fully typed client for Custom APIs DX API operations using
 * openapi-fetch with OAuth authentication middleware. Used for retrieving
 * the status of deployed Custom API endpoints.
 *
 * @module clients/custom-apis
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import {OAuthStrategy} from '../auth/oauth.js';
import type {paths, components} from './custom-apis.generated.js';
import {createAuthMiddleware, createLoggingMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from './middleware-registry.js';

/**
 * Re-export generated types for external use.
 */
export type {paths, components};

/**
 * The typed Custom APIs client - this is the openapi-fetch Client with full type safety.
 *
 * @see {@link createCustomApisClient} for instantiation
 */
export type CustomApisClient = Client<paths>;

/**
 * Helper type to extract response data from an operation.
 */
export type CustomApisResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;

/**
 * Standard Custom APIs error response structure.
 */
export type CustomApisError = components['schemas']['ErrorResponse'];

/** Default OAuth scopes required for Custom APIs (read-only) */
export const CUSTOM_APIS_DEFAULT_SCOPES = ['sfcc.custom-apis'];

/**
 * Configuration for creating a Custom APIs client.
 */
export interface CustomApisClientConfig {
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
   * (sfcc.custom-apis) plus tenant-specific scope (SALESFORCE_COMMERCE_API:{tenant}).
   */
  scopes?: string[];

  /**
   * Middleware registry to use for this client.
   * If not specified, uses the global middleware registry.
   */
  middlewareRegistry?: MiddlewareRegistry;
}

/**
 * Creates a typed Custom APIs DX API client.
 *
 * Returns the openapi-fetch client directly, with authentication
 * handled via middleware. This gives full access to all openapi-fetch
 * features with type-safe paths, parameters, and responses.
 *
 * The client automatically handles OAuth scope requirements:
 * - Domain scope: `sfcc.custom-apis` (or custom via config.scopes)
 * - Tenant scope: `SALESFORCE_COMMERCE_API:{tenantId}`
 *
 * @param config - Custom APIs client configuration including shortCode and tenantId
 * @param auth - Authentication strategy (typically OAuth)
 * @returns Typed openapi-fetch client
 *
 * @example
 * // Create Custom APIs client - scopes are handled automatically
 * const oauthStrategy = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * const client = createCustomApisClient(
 *   { shortCode: 'kv7kzm78', tenantId: 'zzxy_prd' },
 *   oauthStrategy
 * );
 *
 * // Get all Custom API endpoints
 * const { data, error } = await client.GET('/organizations/{organizationId}/endpoints', {
 *   params: {
 *     path: { organizationId: toOrganizationId('zzxy_prd') }
 *   }
 * });
 */
export function createCustomApisClient(config: CustomApisClientConfig, auth: AuthStrategy): CustomApisClient {
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  const client = createClient<paths>({
    baseUrl: `https://${config.shortCode}.api.commercecloud.salesforce.com/dx/custom-apis/v1`,
  });

  // Build required scopes: domain scope + tenant-specific scope
  const requiredScopes = config.scopes ?? [...CUSTOM_APIS_DEFAULT_SCOPES, buildTenantScope(config.tenantId)];

  // If OAuth strategy, add required scopes; otherwise use as-is
  const scopedAuth = auth instanceof OAuthStrategy ? auth.withAdditionalScopes(requiredScopes) : auth;

  // Core middleware: auth first
  client.use(createAuthMiddleware(scopedAuth));

  // Plugin middleware from registry
  for (const middleware of registry.getMiddleware('custom-apis')) {
    client.use(middleware);
  }

  // Logging middleware last (sees complete request with all modifications)
  client.use(createLoggingMiddleware('CUSTOM-APIS'));

  return client;
}

/** Prefix required for SCAPI organizationId */
export const ORGANIZATION_ID_PREFIX = 'f_ecom_';

/** Prefix for tenant-specific SCAPI OAuth scopes */
export const SCAPI_TENANT_SCOPE_PREFIX = 'SALESFORCE_COMMERCE_API:';

/**
 * Ensures a tenant ID has the required f_ecom_ prefix for use as an SCAPI organizationId.
 * If the value already has the prefix, it's returned as-is.
 *
 * @param tenantId - The tenant ID (e.g., "zzxy_prd" or "f_ecom_zzxy_prd")
 * @returns The organization ID with the f_ecom_ prefix (e.g., "f_ecom_zzxy_prd")
 *
 * @example
 * toOrganizationId('zzxy_prd')        // Returns 'f_ecom_zzxy_prd'
 * toOrganizationId('f_ecom_zzxy_prd') // Returns 'f_ecom_zzxy_prd' (unchanged)
 */
export function toOrganizationId(tenantId: string): string {
  if (tenantId.startsWith(ORGANIZATION_ID_PREFIX)) {
    return tenantId;
  }
  return `${ORGANIZATION_ID_PREFIX}${tenantId}`;
}

/**
 * Extracts the raw tenant ID by stripping the f_ecom_ prefix if present.
 *
 * @param value - The tenant ID or organization ID (e.g., "zzxy_prd" or "f_ecom_zzxy_prd")
 * @returns The raw tenant ID without the prefix (e.g., "zzxy_prd")
 *
 * @example
 * toTenantId('f_ecom_zzxy_prd') // Returns 'zzxy_prd'
 * toTenantId('zzxy_prd')        // Returns 'zzxy_prd' (unchanged)
 */
export function toTenantId(value: string): string {
  if (value.startsWith(ORGANIZATION_ID_PREFIX)) {
    return value.slice(ORGANIZATION_ID_PREFIX.length);
  }
  return value;
}

/**
 * Builds the tenant-specific OAuth scope required for SCAPI APIs.
 *
 * @param tenantId - The tenant ID (with or without f_ecom_ prefix)
 * @returns The tenant-specific scope (e.g., "SALESFORCE_COMMERCE_API:zzxy_prd")
 *
 * @example
 * buildTenantScope('zzxy_prd')        // Returns 'SALESFORCE_COMMERCE_API:zzxy_prd'
 * buildTenantScope('f_ecom_zzxy_prd') // Returns 'SALESFORCE_COMMERCE_API:zzxy_prd'
 */
export function buildTenantScope(tenantId: string): string {
  return `${SCAPI_TENANT_SCOPE_PREFIX}${toTenantId(tenantId)}`;
}
