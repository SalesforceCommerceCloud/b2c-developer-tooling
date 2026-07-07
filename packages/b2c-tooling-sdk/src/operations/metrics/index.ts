/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Metrics operations for B2C Commerce (Observability).
 *
 * > **CLOSED BETA:** The Metrics API is a closed beta capability. Availability,
 * > request/response shapes, and OAuth scopes may change without notice, and the
 * > API must be enabled for your organization.
 *
 * This module provides typed, high-level functions for retrieving operational
 * time-series metrics from the SCAPI Observability Metrics API
 * (`observability/metrics/v1`). Each metric *category* has its own function; all
 * return the same {@link MetricsDataResponse} envelope.
 *
 * ## Categories
 *
 * - {@link getOverallMetrics} — overall application metrics
 * - {@link getSalesMetrics} — sales metrics
 * - {@link getEcdnMetrics} — embedded CDN metrics
 * - {@link getThirdPartyMetrics} — third-party service call metrics (filterable by service)
 * - {@link getScapiMetrics} — SCAPI request metrics (filterable by API family/name)
 * - {@link getScapiHooksMetrics} — SCAPI hook execution metrics
 * - {@link getMrtMetrics} — Managed Runtime metrics
 * - {@link getControllerMetrics} — controller/pipeline metrics
 * - {@link getOcapiMetrics} — OCAPI request metrics (filterable by category/api)
 *
 * {@link getMetricsByCategory} dispatches to the correct function by category
 * name — convenient for CLIs and tools that take a category as input.
 *
 * ## Usage
 *
 * ```typescript
 * import {createMetricsClient} from '@salesforce/b2c-tooling-sdk/clients';
 * import {getOverallMetrics} from '@salesforce/b2c-tooling-sdk/operations/metrics';
 *
 * const client = createMetricsClient({shortCode, tenantId}, auth);
 * const result = await getOverallMetrics(client, tenantId, {from, to});
 * for (const metric of result.data) {
 *   console.log(metric.title, metric.dataSeries.length);
 * }
 * ```
 *
 * ## Authentication
 *
 * Requires OAuth client-credentials with the `sfcc.metrics` admin scope. The
 * {@link createMetricsClient} factory attaches this scope plus the tenant scope
 * automatically.
 *
 * @module operations/metrics
 */
import type {MetricsClient, MetricsDataResponse} from '../../clients/metrics.js';
import {toOrganizationId} from '../../clients/custom-apis.js';
import {getApiErrorMessage} from '../../clients/error-utils.js';
import {getLogger} from '../../logging/logger.js';

export type {
  MetricsClient,
  MetricsClientConfig,
  MetricsDataResponse,
  Metric,
  MetricDataSeries,
  MetricDataPoint,
  MetricsError,
} from '../../clients/metrics.js';

/**
 * All metric categories exposed by the Metrics API, in a stable, documented order.
 *
 * Values match the API path segments (e.g. `overall` → `/metrics/overall`).
 */
export const METRIC_CATEGORIES = [
  'overall',
  'sales',
  'ecdn',
  'third-party',
  'scapi',
  'scapi-hooks',
  'mrt',
  'controller',
  'ocapi',
] as const;

/**
 * A metric category name. One of {@link METRIC_CATEGORIES}.
 */
export type MetricCategory = (typeof METRIC_CATEGORIES)[number];

/**
 * Time-window options common to every metrics operation.
 *
 * `from` and `to` are epoch **milliseconds**. Both are optional; when omitted the
 * API applies its default window. When both are supplied, `from` must be before
 * `to` or the API returns a 400.
 */
export interface MetricsTimeWindow {
  /** Start of the window, epoch milliseconds (inclusive). */
  from?: number;
  /** End of the window, epoch milliseconds (inclusive). */
  to?: number;
}

/**
 * Options for {@link getThirdPartyMetrics}: time window plus an optional
 * third-party service filter.
 */
export interface ThirdPartyMetricsOptions extends MetricsTimeWindow {
  /** Restrict results to a single third-party service by its id. */
  thirdPartyServiceId?: string;
}

/**
 * Options for {@link getScapiMetrics}: time window plus optional SCAPI filters.
 */
export interface ScapiMetricsOptions extends MetricsTimeWindow {
  /** Restrict results to a SCAPI API family (e.g. `product`, `checkout`). */
  apiFamily?: string;
  /** Restrict results to a SCAPI API name (e.g. `shopper-products`). */
  apiName?: string;
}

/**
 * Options for {@link getOcapiMetrics}: time window plus optional OCAPI filters.
 */
export interface OcapiMetricsOptions extends MetricsTimeWindow {
  /** Restrict results to an OCAPI category (e.g. `shop`, `data`). */
  ocapiCategory?: string;
  /** Restrict results to a specific OCAPI API. */
  ocapiApi?: string;
}

/**
 * Union of every option shape accepted by {@link getMetricsByCategory}.
 */
export type MetricsQueryOptions = MetricsTimeWindow &
  Partial<Pick<ThirdPartyMetricsOptions, 'thirdPartyServiceId'>> &
  Partial<Pick<ScapiMetricsOptions, 'apiFamily' | 'apiName'>> &
  Partial<Pick<OcapiMetricsOptions, 'ocapiCategory' | 'ocapiApi'>>;

/**
 * Normalizes an optional time-window into the query object openapi-fetch expects,
 * dropping undefined values so they are not serialized.
 */
function timeWindowQuery(options?: MetricsTimeWindow): {from?: number; to?: number} {
  const query: {from?: number; to?: number} = {};
  if (options?.from !== undefined) query.from = options.from;
  if (options?.to !== undefined) query.to = options.to;
  return query;
}

/**
 * Wraps a failed metrics request in a descriptive Error.
 */
function metricsError(category: MetricCategory, error: unknown, response: Response): Error {
  return new Error(`Failed to get ${category} metrics: ${getApiErrorMessage(error, response)}`, {cause: error});
}

/**
 * Retrieves overall application metrics for an organization.
 *
 * @param client - Metrics API client from {@link createMetricsClient}
 * @param tenantId - Tenant ID (with or without the `f_ecom_` prefix)
 * @param options - Optional time window (epoch milliseconds)
 * @returns The metrics data response
 * @throws Error if the request fails
 */
export async function getOverallMetrics(
  client: MetricsClient,
  tenantId: string,
  options?: MetricsTimeWindow,
): Promise<MetricsDataResponse> {
  getLogger().debug({tenantId, options}, 'Fetching overall metrics');
  const {data, error, response} = await client.GET('/organizations/{organizationId}/metrics/overall', {
    params: {path: {organizationId: toOrganizationId(tenantId)}, query: timeWindowQuery(options)},
  });
  if (error || !data) throw metricsError('overall', error, response);
  return data;
}

/**
 * Retrieves sales metrics for an organization.
 *
 * @param client - Metrics API client from {@link createMetricsClient}
 * @param tenantId - Tenant ID (with or without the `f_ecom_` prefix)
 * @param options - Optional time window (epoch milliseconds)
 * @returns The metrics data response
 * @throws Error if the request fails
 */
export async function getSalesMetrics(
  client: MetricsClient,
  tenantId: string,
  options?: MetricsTimeWindow,
): Promise<MetricsDataResponse> {
  getLogger().debug({tenantId, options}, 'Fetching sales metrics');
  const {data, error, response} = await client.GET('/organizations/{organizationId}/metrics/sales', {
    params: {path: {organizationId: toOrganizationId(tenantId)}, query: timeWindowQuery(options)},
  });
  if (error || !data) throw metricsError('sales', error, response);
  return data;
}

/**
 * Retrieves embedded CDN (eCDN) metrics for an organization.
 *
 * @param client - Metrics API client from {@link createMetricsClient}
 * @param tenantId - Tenant ID (with or without the `f_ecom_` prefix)
 * @param options - Optional time window (epoch milliseconds)
 * @returns The metrics data response
 * @throws Error if the request fails
 */
export async function getEcdnMetrics(
  client: MetricsClient,
  tenantId: string,
  options?: MetricsTimeWindow,
): Promise<MetricsDataResponse> {
  getLogger().debug({tenantId, options}, 'Fetching ecdn metrics');
  const {data, error, response} = await client.GET('/organizations/{organizationId}/metrics/ecdn', {
    params: {path: {organizationId: toOrganizationId(tenantId)}, query: timeWindowQuery(options)},
  });
  if (error || !data) throw metricsError('ecdn', error, response);
  return data;
}

/**
 * Retrieves third-party service call metrics for an organization.
 *
 * @param client - Metrics API client from {@link createMetricsClient}
 * @param tenantId - Tenant ID (with or without the `f_ecom_` prefix)
 * @param options - Optional time window and `thirdPartyServiceId` filter
 * @returns The metrics data response
 * @throws Error if the request fails
 */
export async function getThirdPartyMetrics(
  client: MetricsClient,
  tenantId: string,
  options?: ThirdPartyMetricsOptions,
): Promise<MetricsDataResponse> {
  getLogger().debug({tenantId, options}, 'Fetching third-party metrics');
  const {data, error, response} = await client.GET('/organizations/{organizationId}/metrics/third-party', {
    params: {
      path: {organizationId: toOrganizationId(tenantId)},
      query: {...timeWindowQuery(options), thirdPartyServiceId: options?.thirdPartyServiceId},
    },
  });
  if (error || !data) throw metricsError('third-party', error, response);
  return data;
}

/**
 * Retrieves SCAPI request metrics for an organization.
 *
 * @param client - Metrics API client from {@link createMetricsClient}
 * @param tenantId - Tenant ID (with or without the `f_ecom_` prefix)
 * @param options - Optional time window and `apiFamily`/`apiName` filters
 * @returns The metrics data response
 * @throws Error if the request fails
 */
export async function getScapiMetrics(
  client: MetricsClient,
  tenantId: string,
  options?: ScapiMetricsOptions,
): Promise<MetricsDataResponse> {
  getLogger().debug({tenantId, options}, 'Fetching scapi metrics');
  const {data, error, response} = await client.GET('/organizations/{organizationId}/metrics/scapi', {
    params: {
      path: {organizationId: toOrganizationId(tenantId)},
      query: {...timeWindowQuery(options), apiFamily: options?.apiFamily, apiName: options?.apiName},
    },
  });
  if (error || !data) throw metricsError('scapi', error, response);
  return data;
}

/**
 * Retrieves SCAPI hook execution metrics for an organization.
 *
 * @param client - Metrics API client from {@link createMetricsClient}
 * @param tenantId - Tenant ID (with or without the `f_ecom_` prefix)
 * @param options - Optional time window (epoch milliseconds)
 * @returns The metrics data response
 * @throws Error if the request fails
 */
export async function getScapiHooksMetrics(
  client: MetricsClient,
  tenantId: string,
  options?: MetricsTimeWindow,
): Promise<MetricsDataResponse> {
  getLogger().debug({tenantId, options}, 'Fetching scapi-hooks metrics');
  const {data, error, response} = await client.GET('/organizations/{organizationId}/metrics/scapi-hooks', {
    params: {path: {organizationId: toOrganizationId(tenantId)}, query: timeWindowQuery(options)},
  });
  if (error || !data) throw metricsError('scapi-hooks', error, response);
  return data;
}

/**
 * Retrieves Managed Runtime (MRT) metrics for an organization.
 *
 * @param client - Metrics API client from {@link createMetricsClient}
 * @param tenantId - Tenant ID (with or without the `f_ecom_` prefix)
 * @param options - Optional time window (epoch milliseconds)
 * @returns The metrics data response
 * @throws Error if the request fails
 */
export async function getMrtMetrics(
  client: MetricsClient,
  tenantId: string,
  options?: MetricsTimeWindow,
): Promise<MetricsDataResponse> {
  getLogger().debug({tenantId, options}, 'Fetching mrt metrics');
  const {data, error, response} = await client.GET('/organizations/{organizationId}/metrics/mrt', {
    params: {path: {organizationId: toOrganizationId(tenantId)}, query: timeWindowQuery(options)},
  });
  if (error || !data) throw metricsError('mrt', error, response);
  return data;
}

/**
 * Retrieves controller/pipeline metrics for an organization.
 *
 * @param client - Metrics API client from {@link createMetricsClient}
 * @param tenantId - Tenant ID (with or without the `f_ecom_` prefix)
 * @param options - Optional time window (epoch milliseconds)
 * @returns The metrics data response
 * @throws Error if the request fails
 */
export async function getControllerMetrics(
  client: MetricsClient,
  tenantId: string,
  options?: MetricsTimeWindow,
): Promise<MetricsDataResponse> {
  getLogger().debug({tenantId, options}, 'Fetching controller metrics');
  const {data, error, response} = await client.GET('/organizations/{organizationId}/metrics/controller', {
    params: {path: {organizationId: toOrganizationId(tenantId)}, query: timeWindowQuery(options)},
  });
  if (error || !data) throw metricsError('controller', error, response);
  return data;
}

/**
 * Retrieves OCAPI request metrics for an organization.
 *
 * @param client - Metrics API client from {@link createMetricsClient}
 * @param tenantId - Tenant ID (with or without the `f_ecom_` prefix)
 * @param options - Optional time window and `ocapiCategory`/`ocapiApi` filters
 * @returns The metrics data response
 * @throws Error if the request fails
 */
export async function getOcapiMetrics(
  client: MetricsClient,
  tenantId: string,
  options?: OcapiMetricsOptions,
): Promise<MetricsDataResponse> {
  getLogger().debug({tenantId, options}, 'Fetching ocapi metrics');
  const {data, error, response} = await client.GET('/organizations/{organizationId}/metrics/ocapi', {
    params: {
      path: {organizationId: toOrganizationId(tenantId)},
      query: {...timeWindowQuery(options), ocapiCategory: options?.ocapiCategory, ocapiApi: options?.ocapiApi},
    },
  });
  if (error || !data) throw metricsError('ocapi', error, response);
  return data;
}

/**
 * Retrieves metrics for a category by name, dispatching to the category-specific
 * function. Category-specific filters (`thirdPartyServiceId`, `apiFamily`,
 * `apiName`, `ocapiCategory`, `ocapiApi`) are applied only for the categories
 * that support them and ignored otherwise.
 *
 * @param client - Metrics API client from {@link createMetricsClient}
 * @param tenantId - Tenant ID (with or without the `f_ecom_` prefix)
 * @param category - One of {@link METRIC_CATEGORIES}
 * @param options - Optional time window and category-specific filters
 * @returns The metrics data response
 * @throws Error if the request fails or the category is unknown
 */
export async function getMetricsByCategory(
  client: MetricsClient,
  tenantId: string,
  category: MetricCategory,
  options?: MetricsQueryOptions,
): Promise<MetricsDataResponse> {
  switch (category) {
    case 'overall':
      return getOverallMetrics(client, tenantId, options);
    case 'sales':
      return getSalesMetrics(client, tenantId, options);
    case 'ecdn':
      return getEcdnMetrics(client, tenantId, options);
    case 'third-party':
      return getThirdPartyMetrics(client, tenantId, options);
    case 'scapi':
      return getScapiMetrics(client, tenantId, options);
    case 'scapi-hooks':
      return getScapiHooksMetrics(client, tenantId, options);
    case 'mrt':
      return getMrtMetrics(client, tenantId, options);
    case 'controller':
      return getControllerMetrics(client, tenantId, options);
    case 'ocapi':
      return getOcapiMetrics(client, tenantId, options);
    default: {
      // Exhaustiveness guard: if a new category is added to METRIC_CATEGORIES
      // without a case here, this line fails to compile.
      const exhaustive: never = category;
      throw new Error(`Unknown metric category: ${String(exhaustive)}`);
    }
  }
}
