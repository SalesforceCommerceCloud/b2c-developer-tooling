/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * SCAPI CORS Preferences API client for B2C Commerce.
 *
 * Provides a fully typed client for the CORS Preferences API, which allows managing
 * Cross-Origin Resource Sharing (CORS) preferences per site. Specifying permitted domains
 * defines exceptions to the same-site policy that browsers would otherwise enforce.
 *
 * @module clients/scapi-cors
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import {OAuthStrategy} from '../auth/oauth.js';
import type {paths, components} from './scapi-cors.generated.js';
import {createAuthMiddleware, createLoggingMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from './middleware-registry.js';
import {toOrganizationId, normalizeTenantId, buildTenantScope} from './custom-apis.js';

/**
 * Re-export generated types for external use.
 */
export type {paths, components};

/**
 * Re-export organization/tenant utilities for convenience.
 */
export {toOrganizationId, normalizeTenantId, buildTenantScope};

/**
 * The typed SCAPI CORS Preferences client.
 *
 * ## Endpoints
 *
 * | Method | Path | Description |
 * |--------|------|-------------|
 * | GET | `/organizations/{organizationId}/cors` | Get all CORS preferences for a site |
 * | PUT | `/organizations/{organizationId}/cors` | Create or replace all CORS preferences for a site |
 * | DELETE | `/organizations/{organizationId}/cors` | Delete all CORS preferences for a site |
 *
 * @example
 * ```typescript
 * import { createScapiCorsClient, toOrganizationId } from '@salesforce/b2c-tooling-sdk/clients';
 * import { OAuthStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 *
 * const auth = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * const client = createScapiCorsClient(
 *   { shortCode: 'kv7kzm78', tenantId: 'zzxy_prd' },
 *   auth
 * );
 *
 * // Get CORS preferences for a site
 * const { data, error } = await client.GET('/organizations/{organizationId}/cors', {
 *   params: {
 *     path: { organizationId: toOrganizationId('zzxy_prd') },
 *     query: { siteId: 'RefArch' },
 *   }
 * });
 * ```
 *
 * @see {@link createScapiCorsClient} for instantiation
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/cors | CORS Preferences API Reference}
 */
export type ScapiCorsClient = Client<paths>;

/**
 * Helper type to extract response data from an operation.
 */
export type ScapiCorsResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;

/**
 * CORS Preferences API error response structure.
 */
export type ScapiCorsError = components['schemas']['ErrorResponse'];

/**
 * CORS preferences for a site (a list of per-client CORS configurations).
 */
export type CorsPreferences = components['schemas']['CorsPreferences'];

/**
 * CORS preferences for a specific client (clientId + allowed origins).
 */
export type CorsClientPreferences = components['schemas']['CorsClientPreferences'];

/** OAuth scopes required for read-only CORS Preferences access */
export const SCAPI_CORS_READ_SCOPES = ['sfcc.cors-preferences'];

/** OAuth scopes required for read-write CORS Preferences access */
export const SCAPI_CORS_RW_SCOPES = ['sfcc.cors-preferences.rw'];

/**
 * Configuration for creating a SCAPI CORS Preferences client.
 */
export interface ScapiCorsClientConfig {
  /**
   * The short code for the SCAPI instance.
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
   * Optional scope override. If not provided, defaults to read-write scope
   * (sfcc.cors-preferences.rw) plus tenant-specific scope (SALESFORCE_COMMERCE_API:{tenant}).
   */
  scopes?: string[];

  /**
   * Middleware registry to use for this client.
   * If not specified, uses the global middleware registry.
   */
  middlewareRegistry?: MiddlewareRegistry;
}

/**
 * Creates a typed SCAPI CORS Preferences API client.
 *
 * Returns the openapi-fetch client directly, with authentication handled via middleware.
 * The client automatically handles OAuth scope requirements — defaulting to read-write
 * scope so all three operations (GET, PUT, DELETE) are available.
 *
 * @param config - CORS client configuration including shortCode and tenantId
 * @param auth - Authentication strategy (typically OAuth)
 * @returns Typed openapi-fetch client
 *
 * @example
 * const client = createScapiCorsClient(
 *   { shortCode: 'kv7kzm78', tenantId: 'zzxy_prd' },
 *   oauthStrategy
 * );
 *
 * // Get CORS preferences
 * const { data } = await client.GET('/organizations/{organizationId}/cors', {
 *   params: {
 *     path: { organizationId: toOrganizationId('zzxy_prd') },
 *     query: { siteId: 'RefArch' },
 *   }
 * });
 */
export function createScapiCorsClient(config: ScapiCorsClientConfig, auth: AuthStrategy): ScapiCorsClient {
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  const client = createClient<paths>({
    baseUrl: `https://${config.shortCode}.api.commercecloud.salesforce.com/configuration/cors/v1`,
  });

  // Default to rw scope so GET, PUT, and DELETE all work with a single token
  const requiredScopes = config.scopes ?? [...SCAPI_CORS_RW_SCOPES, buildTenantScope(config.tenantId)];

  const scopedAuth = auth instanceof OAuthStrategy ? auth.withAdditionalScopes(requiredScopes) : auth;

  client.use(createAuthMiddleware(scopedAuth));

  for (const middleware of registry.getMiddleware('scapi-cors')) {
    client.use(middleware);
  }

  client.use(createLoggingMiddleware('SCAPI-CORS'));

  return client;
}
