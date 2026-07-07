/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Metrics API client for B2C Commerce (Observability).
 *
 * > **CLOSED BETA:** The Metrics API (`observability/metrics/v1`) is a closed
 * > beta capability. Availability, request/response shapes, and OAuth scopes may
 * > change without notice, and the API must be enabled for your organization.
 *
 * Provides a fully typed client for the SCAPI Observability Metrics API using
 * openapi-fetch with OAuth authentication middleware. The API exposes
 * time-series operational metrics (overall, sales, eCDN, third-party services,
 * SCAPI, SCAPI hooks, MRT, controllers, and OCAPI) for an organization.
 *
 * @module clients/metrics
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import {OAuthStrategy} from '../auth/oauth.js';
import {JwtOAuthStrategy} from '../auth/oauth-jwt.js';
import type {paths, components} from './metrics.generated.js';
import {createAuthMiddleware, createLoggingMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from './middleware-registry.js';
import {buildTenantScope} from './custom-apis.js';

/**
 * Re-export generated types for external use.
 */
export type {paths, components};

/**
 * The typed Metrics API client for retrieving observability metrics.
 *
 * **CLOSED BETA** — see the module description.
 *
 * ## Common Endpoints
 *
 * | Method | Path | Description |
 * |--------|------|-------------|
 * | GET | `/organizations/{organizationId}/metrics/overall` | Overall application metrics |
 * | GET | `/organizations/{organizationId}/metrics/sales` | Sales metrics |
 * | GET | `/organizations/{organizationId}/metrics/scapi` | SCAPI request metrics |
 *
 * @example
 * ```typescript
 * import { createMetricsClient, toOrganizationId } from '@salesforce/b2c-tooling-sdk/clients';
 * import { OAuthStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 *
 * const auth = new OAuthStrategy({ clientId: '...', clientSecret: '...' });
 * const client = createMetricsClient({ shortCode: 'kv7kzm78', tenantId: 'zzxy_prd' }, auth);
 *
 * const { data, error } = await client.GET('/organizations/{organizationId}/metrics/overall', {
 *   params: { path: { organizationId: toOrganizationId('zzxy_prd') } },
 * });
 * ```
 *
 * @see {@link createMetricsClient} for instantiation
 */
export type MetricsClient = Client<paths>;

/**
 * Helper type to extract response data from an operation.
 */
export type MetricsResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;

/**
 * The metrics data response envelope returned by every metrics operation.
 */
export type MetricsDataResponse = components['schemas']['MetricsDataResponse'];

/**
 * A single metric with its metadata and one or more data series.
 */
export type Metric = components['schemas']['Metric'];

/**
 * A named series of data points belonging to a {@link Metric}.
 */
export type MetricDataSeries = components['schemas']['DataSeries'];

/**
 * A single `{timestamp, value}` data point. `timestamp` is epoch milliseconds.
 */
export type MetricDataPoint = components['schemas']['DataPoint'];

/**
 * Standard RFC 7807 problem-details error response from the Metrics API.
 */
export type MetricsError = components['schemas']['ErrorResponse'];

/** Default OAuth scope required for the Metrics API (read-only). */
export const METRICS_DEFAULT_SCOPES = ['sfcc.metrics'];

/**
 * Configuration for creating a Metrics API client.
 */
export interface MetricsClientConfig {
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
   * Optional scope override. If not provided, defaults to the domain scope
   * (sfcc.metrics) plus the tenant-specific scope (SALESFORCE_COMMERCE_API:{tenant}).
   */
  scopes?: string[];

  /**
   * Middleware registry to use for this client.
   * If not specified, uses the global middleware registry.
   */
  middlewareRegistry?: MiddlewareRegistry;
}

/**
 * Creates a typed Metrics API client.
 *
 * **CLOSED BETA** — see the module description.
 *
 * Returns the openapi-fetch client directly, with authentication handled via
 * middleware. This gives full access to all openapi-fetch features with
 * type-safe paths, parameters, and responses.
 *
 * The client automatically handles OAuth scope requirements:
 * - Domain scope: `sfcc.metrics` (or custom via config.scopes)
 * - Tenant scope: `SALESFORCE_COMMERCE_API:{tenantId}`
 *
 * @param config - Metrics client configuration including shortCode and tenantId
 * @param auth - Authentication strategy (typically OAuth client-credentials)
 * @returns Typed openapi-fetch client
 *
 * @example
 * const auth = new OAuthStrategy({ clientId: '...', clientSecret: '...' });
 * const client = createMetricsClient({ shortCode: 'kv7kzm78', tenantId: 'zzxy_prd' }, auth);
 */
export function createMetricsClient(config: MetricsClientConfig, auth: AuthStrategy): MetricsClient {
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  const client = createClient<paths>({
    baseUrl: `https://${config.shortCode}.api.commercecloud.salesforce.com/observability/metrics/v1`,
  });

  // Build required scopes: domain scope + tenant-specific scope
  const requiredScopes = config.scopes ?? [...METRICS_DEFAULT_SCOPES, buildTenantScope(config.tenantId)];

  // If auth supports scopes, add required scopes; otherwise use as-is
  const scopedAuth =
    auth instanceof OAuthStrategy || auth instanceof JwtOAuthStrategy
      ? auth.withAdditionalScopes(requiredScopes)
      : auth;

  // Core middleware: auth first
  client.use(createAuthMiddleware(scopedAuth));

  // Plugin middleware from registry
  for (const middleware of registry.getMiddleware('metrics')) {
    client.use(middleware);
  }

  // Logging middleware last (sees complete request with all modifications)
  client.use(createLoggingMiddleware('METRICS'));

  return client;
}
