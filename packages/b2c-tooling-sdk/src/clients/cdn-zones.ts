/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * CDN Zones API client for B2C Commerce.
 *
 * Provides a fully typed client for CDN Zones API operations using
 * openapi-fetch with OAuth authentication middleware. Used for managing
 * eCDN configurations including zones, certificates, WAF, rate limiting,
 * cache purge, and other CDN settings.
 *
 * @module clients/cdn-zones
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import {OAuthStrategy} from '../auth/oauth.js';
import type {paths, components} from './cdn-zones.generated.js';
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
 * The typed CDN Zones client for eCDN management.
 *
 * ## Common Endpoints
 *
 * | Method | Path | Description |
 * |--------|------|-------------|
 * | GET | `/organizations/{organizationId}/zones/info` | List all zones |
 * | GET | `/organizations/{organizationId}/zones/{zoneId}/certificates` | Get zone certificates |
 * | POST | `/organizations/{organizationId}/zones/{zoneId}/cachepurge` | Purge cache |
 * | GET | `/organizations/{organizationId}/zones/{zoneId}/firewall/waf` | Get WAF settings |
 * | GET | `/organizations/{organizationId}/zones/{zoneId}/speed` | Get speed settings |
 *
 * @example
 * ```typescript
 * import { createCdnZonesClient, toOrganizationId } from '@salesforce/b2c-tooling-sdk/clients';
 * import { OAuthStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 *
 * const auth = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * const client = createCdnZonesClient(
 *   { shortCode: 'kv7kzm78', tenantId: 'zzxy_prd' },
 *   auth
 * );
 *
 * // List all zones
 * const { data, error } = await client.GET('/organizations/{organizationId}/zones/info', {
 *   params: { path: { organizationId: toOrganizationId('zzxy_prd') } }
 * });
 * ```
 *
 * @see {@link createCdnZonesClient} for instantiation
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/cdn-api-process-apis?meta=Summary | CDN Zones API Reference}
 */
export type CdnZonesClient = Client<paths>;

/**
 * Helper type to extract response data from an operation.
 */
export type CdnZonesResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;

/**
 * Standard CDN Zones error response structure.
 */
export type CdnZonesError = components['schemas']['ApiStandardsErrorResponse'];

/**
 * Zone information from the zones/info endpoint.
 */
export type Zone = components['schemas']['Zone'];

/**
 * Zone list envelope.
 */
export type ZonesEnvelope = components['schemas']['ZonesEnvelope'];

/**
 * Certificate information.
 */
export type Certificate = components['schemas']['Certificate'];

/**
 * Security settings.
 */
export type SecuritySetting = components['schemas']['SecuritySetting'];

/**
 * Speed settings.
 */
export type SpeedSetting = components['schemas']['SpeedSetting'];

/** Default OAuth scopes required for CDN Zones (read-only) */
export const CDN_ZONES_READ_SCOPES = ['sfcc.cdn-zones'];

/** OAuth scopes required for CDN Zones (read-write) */
export const CDN_ZONES_RW_SCOPES = ['sfcc.cdn-zones.rw'];

/**
 * Configuration for creating a CDN Zones client.
 */
export interface CdnZonesClientConfig {
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
   * (sfcc.cdn-zones) plus tenant-specific scope (SALESFORCE_COMMERCE_API:{tenant}).
   */
  scopes?: string[];

  /**
   * Middleware registry to use for this client.
   * If not specified, uses the global middleware registry.
   */
  middlewareRegistry?: MiddlewareRegistry;
}

/**
 * Options for creating a CDN Zones client.
 */
export interface CdnZonesClientOptions {
  /**
   * If true, request read-write scopes (sfcc.cdn-zones.rw).
   * If false or not specified, request read-only scopes (sfcc.cdn-zones).
   */
  readWrite?: boolean;
}

/**
 * Creates a typed CDN Zones API client.
 *
 * Returns the openapi-fetch client directly, with authentication
 * handled via middleware. This gives full access to all openapi-fetch
 * features with type-safe paths, parameters, and responses.
 *
 * The client automatically handles OAuth scope requirements:
 * - Domain scope: `sfcc.cdn-zones` (read) or `sfcc.cdn-zones.rw` (read-write)
 * - Tenant scope: `SALESFORCE_COMMERCE_API:{tenantId}`
 *
 * @param config - CDN Zones client configuration including shortCode and tenantId
 * @param auth - Authentication strategy (typically OAuth)
 * @param options - Optional settings like readWrite scope
 * @returns Typed openapi-fetch client
 *
 * @example
 * // Create CDN Zones client for read-only operations
 * const oauthStrategy = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * const client = createCdnZonesClient(
 *   { shortCode: 'kv7kzm78', tenantId: 'zzxy_prd' },
 *   oauthStrategy
 * );
 *
 * // List all zones
 * const { data, error } = await client.GET('/organizations/{organizationId}/zones/info', {
 *   params: {
 *     path: { organizationId: toOrganizationId('zzxy_prd') }
 *   }
 * });
 *
 * @example
 * // Create CDN Zones client for read-write operations (e.g., cache purge)
 * const rwClient = createCdnZonesClient(
 *   { shortCode: 'kv7kzm78', tenantId: 'zzxy_prd' },
 *   oauthStrategy,
 *   { readWrite: true }
 * );
 *
 * // Purge cache
 * const { data } = await rwClient.POST('/organizations/{organizationId}/zones/{zoneId}/cachepurge', {
 *   params: {
 *     path: { organizationId: toOrganizationId('zzxy_prd'), zoneId: 'zone-id' }
 *   },
 *   body: { path: ['/some/path'] }
 * });
 */
export function createCdnZonesClient(
  config: CdnZonesClientConfig,
  auth: AuthStrategy,
  options?: CdnZonesClientOptions,
): CdnZonesClient {
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  const client = createClient<paths>({
    baseUrl: `https://${config.shortCode}.api.commercecloud.salesforce.com/cdn/zones/v1`,
  });

  // Build required scopes: domain scope + tenant-specific scope
  const domainScopes = options?.readWrite ? CDN_ZONES_RW_SCOPES : CDN_ZONES_READ_SCOPES;
  const requiredScopes = config.scopes ?? [...domainScopes, buildTenantScope(config.tenantId)];

  // If OAuth strategy, add required scopes; otherwise use as-is
  const scopedAuth = auth instanceof OAuthStrategy ? auth.withAdditionalScopes(requiredScopes) : auth;

  // Core middleware: auth first
  client.use(createAuthMiddleware(scopedAuth));

  // Plugin middleware from registry
  for (const middleware of registry.getMiddleware('cdn-zones')) {
    client.use(middleware);
  }

  // Logging middleware last (sees complete request with all modifications)
  client.use(createLoggingMiddleware('CDN-ZONES'));

  return client;
}
