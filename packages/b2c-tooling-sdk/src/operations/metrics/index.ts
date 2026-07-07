/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Metrics operations for B2C Commerce (Observability).
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
import {parseSinceTime, parseRelativeTime} from '../logs/filter.js';

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
 * Accepts either a {@link Date} or a number of **epoch milliseconds** (the same
 * unit as `Date.now()`), for both `from` and `to`. Both are optional; when
 * omitted the API applies its default window. When both are supplied, `from`
 * must be before `to` or the API returns a 400.
 *
 * > **Note:** The Metrics API wire format is epoch **seconds**, and the data
 * > points it returns are timestamped in **seconds**. These operations convert
 * > millisecond inputs to seconds on the way out and normalize response
 * > timestamps back to **milliseconds** on the way in, so callers work in
 * > JS-native millisecond time throughout (e.g. `new Date(point.timestamp)`).
 */
export interface MetricsTimeWindow {
  /** Start of the window — a {@link Date} or epoch milliseconds (inclusive). */
  from?: Date | number;
  /** End of the window — a {@link Date} or epoch milliseconds (inclusive). */
  to?: Date | number;
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
 * How far back the Metrics API retains data: `from` must be no older than
 * `serverNow - 30 days`, or the API returns 400.
 */
export const METRICS_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Safety margin kept *inside* the retention window when clamping `from`. Because
 * the server evaluates retention against its own clock at request time, a `from`
 * computed as exactly "30 days ago" on the client is reliably rejected once
 * request latency and client/server clock skew are added. {@link resolveMetricsWindow}
 * therefore clamps a `from` that lands within this margin of the retention floor
 * up to `now - 30 days + margin`, so edge requests (e.g. `--from 30d`) succeed.
 * 5 minutes comfortably covers latency and typical skew while costing a
 * negligible fraction of the 30-day window.
 */
export const METRICS_RETENTION_SAFETY_MARGIN_MS = 5 * 60 * 1000;

/**
 * A metrics bound as accepted from a CLI flag or MCP argument: a {@link Date},
 * epoch **milliseconds**, or a human string — a relative duration (`5m`, `1h`,
 * `2d`, interpreted as "ago") or an ISO 8601 timestamp.
 */
export type MetricsBoundInput = Date | number | string;

/**
 * Parses a single metrics time bound (`from` or `to`) into a {@link Date}.
 *
 * This is the shared bound parser for the CLI `metrics get` command and the MCP
 * `metrics_get` tool. It intentionally does NOT synthesize a companion bound or
 * apply a default window: each of `from`/`to` is resolved independently and only
 * when the caller supplies it, so the request sent to the API contains exactly
 * the bounds the user asked for. This matches the Metrics API's own `from`/`to`
 * parameters — e.g. passing only `from` lets the API apply its native forward
 * window, rather than the client inventing `to = now`.
 *
 * @param value - The bound: a Date, epoch milliseconds, a relative duration
 *   (`5m`/`1h`/`2d`, relative to `now`), or an ISO 8601 timestamp
 * @param now - Reference time for relative durations (defaults to the current
 *   time; injectable for deterministic tests)
 * @returns The resolved {@link Date}
 * @throws TypeError if a string value is neither a valid relative duration nor
 *   a parseable ISO 8601 timestamp
 *
 * @example
 * ```typescript
 * const from = parseMetricsBound('2d');            // 2 days ago
 * const to = parseMetricsBound('2026-01-25T12:00:00Z');
 * await getSalesMetrics(client, tenantId, {from, to});
 * ```
 */
export function parseMetricsBound(value: MetricsBoundInput, now: Date = new Date()): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  return parseSinceTime(value, now);
}

/**
 * Raw `from`/`to`/`window` inputs, as accepted from CLI flags or MCP arguments,
 * before resolution. Any subset may be provided.
 */
export interface MetricsWindowInput {
  /** Start bound (Date, epoch ms, relative like `7d`, or ISO 8601). */
  from?: MetricsBoundInput;
  /** End bound (Date, epoch ms, relative like `6h`, or ISO 8601). */
  to?: MetricsBoundInput;
  /**
   * Window duration as a relative string (`1h`, `30m`, `2d`) or a number of
   * **milliseconds**. Combined with exactly one of `from`/`to` it derives the
   * other bound; supplied alone it means "the last {window}".
   */
  window?: number | string;
}

/**
 * A resolved metrics window: the `from`/`to` bounds actually sent to the API
 * (either may be absent when the caller supplied only one and no window), plus
 * epoch-second echoes for reporting.
 */
export interface ResolvedMetricsWindow {
  /** Resolved start bound, or undefined if not sent. */
  from?: Date;
  /** Resolved end bound, or undefined if not sent. */
  to?: Date;
  /** ISO 8601 form of {@link from}, or undefined. */
  fromIso?: string;
  /** ISO 8601 form of {@link to}, or undefined. */
  toIso?: string;
  /** Epoch **seconds** form of {@link from} (the API wire unit), or undefined. */
  fromEpochSeconds?: number;
  /** Epoch **seconds** form of {@link to} (the API wire unit), or undefined. */
  toEpochSeconds?: number;
  /**
   * True when `from` was clamped forward to stay inside the retention window
   * (see {@link METRICS_RETENTION_SAFETY_MARGIN_MS}). Surfaced so callers can
   * report that the effective start differs slightly from what was requested.
   */
  clampedFrom: boolean;
}

/**
 * Parses a `--window`/`--for` duration into milliseconds. Accepts a relative
 * string (`1h`, `30m`, `2d`) or a raw number of milliseconds.
 *
 * @throws TypeError if a string is not a valid relative duration
 */
function parseWindowMs(window: number | string): number {
  if (typeof window === 'number') return window;
  const ms = parseRelativeTime(window);
  if (ms === null) {
    throw new TypeError(`Invalid window duration: "${window}". Use a relative duration like "30m", "1h", or "2d".`);
  }
  return ms;
}

/**
 * Resolves `from`/`to`/`window` inputs into the concrete bounds to send to the
 * Metrics API. This is the shared resolver for the CLI `metrics get` command and
 * the MCP `metrics_get` tool, so both share identical, tested semantics.
 *
 * The `window` duration makes fixed-width lookbacks easy without hand-computing
 * a second timestamp — e.g. "a 1-hour window starting 7 days ago" is
 * `{from: '7d', window: '1h'}`. Resolution rules:
 *
 * - `from` + `to` — used as given; `window` must NOT also be set.
 * - `from` + `window` — `to = from + window`.
 * - `to` + `window` — `from = to - window`.
 * - `window` only — the last `window`: `to = now`, `from = now - window`.
 * - `from` only — only `from` is sent; the API applies its own window (the
 *   client does NOT invent `to = now`).
 * - `to` only — only `to` is sent.
 * - nothing — neither bound is sent; the API applies its default window.
 *
 * Validation here is structural (over-specification and `from` after `to`).
 * Additionally, a `from` that lands at or just beyond the 30-day retention floor
 * is clamped *forward* to `now - 30 days + margin` (see
 * {@link METRICS_RETENTION_SAFETY_MARGIN_MS}) so that requests like `--from 30d`
 * are not rejected by the server's own slightly-later clock. Clamping only ever
 * moves `from` toward `now` (never fetches out-of-range data) and is reported via
 * {@link ResolvedMetricsWindow.clampedFrom}. Other API limits (maximum window
 * width, etc.) are left to the API, whose error messages are authoritative.
 *
 * @param input - The raw `from`/`to`/`window` inputs
 * @param now - Reference time for relative bounds, window-only mode, and the
 *   retention clamp (defaults to the current time; injectable for deterministic tests)
 * @returns The resolved bounds plus ISO/epoch-second echoes and a clamp flag
 * @throws TypeError if a bound or the window string is unparseable
 * @throws RangeError if all three are supplied, or the resolved `from` is after `to`
 *
 * @example
 * ```typescript
 * // A 1-hour window starting 7 days ago:
 * const w = resolveMetricsWindow({from: '7d', window: '1h'});
 * await getScapiMetrics(client, tenantId, {from: w.from, to: w.to});
 * ```
 */
export function resolveMetricsWindow(input: MetricsWindowInput = {}, now: Date = new Date()): ResolvedMetricsWindow {
  const hasFrom = input.from !== undefined && input.from !== '';
  const hasTo = input.to !== undefined && input.to !== '';
  const hasWindow = input.window !== undefined && input.window !== '';

  if (hasFrom && hasTo && hasWindow) {
    throw new RangeError('Specify at most two of from, to, and window — not all three.');
  }

  let from = hasFrom ? parseMetricsBound(input.from!, now) : undefined;
  let to = hasTo ? parseMetricsBound(input.to!, now) : undefined;

  if (hasWindow) {
    const windowMs = parseWindowMs(input.window!);
    if (from && !to) {
      to = new Date(from.getTime() + windowMs);
    } else if (to && !from) {
      from = new Date(to.getTime() - windowMs);
    } else {
      // window alone → the last {window}
      to = now;
      from = new Date(now.getTime() - windowMs);
    }
  }

  // Clamp `from` forward if it is at/beyond the retention floor, to survive the
  // server evaluating retention against its own (slightly later) clock.
  let clampedFrom = false;
  if (from) {
    const earliestSafe = now.getTime() - METRICS_RETENTION_MS + METRICS_RETENTION_SAFETY_MARGIN_MS;
    if (from.getTime() < earliestSafe) {
      from = new Date(earliestSafe);
      clampedFrom = true;
    }
  }

  if (from && to && from.getTime() > to.getTime()) {
    throw new RangeError(`Invalid time window: from (${from.toISOString()}) must be before to (${to.toISOString()}).`);
  }

  return {
    from,
    to,
    fromIso: from?.toISOString(),
    toIso: to?.toISOString(),
    fromEpochSeconds: from ? toEpochSeconds(from) : undefined,
    toEpochSeconds: to ? toEpochSeconds(to) : undefined,
    clampedFrom,
  };
}

/**
 * Converts a millisecond time input ({@link Date} or epoch ms) to the epoch
 * **seconds** the Metrics API expects on the wire.
 */
function toEpochSeconds(value: Date | number): number {
  const ms = value instanceof Date ? value.getTime() : value;
  return Math.floor(ms / 1000);
}

/**
 * Normalizes an optional time-window into the query object openapi-fetch expects.
 * Converts millisecond inputs to epoch seconds and drops undefined values so they
 * are not serialized.
 */
function timeWindowQuery(options?: MetricsTimeWindow): {from?: number; to?: number} {
  const query: {from?: number; to?: number} = {};
  if (options?.from !== undefined) query.from = toEpochSeconds(options.from);
  if (options?.to !== undefined) query.to = toEpochSeconds(options.to);
  return query;
}

/**
 * Normalizes a successful metrics response for JS consumers: rewrites every data
 * point timestamp from the API's epoch **seconds** to epoch **milliseconds** so
 * that `new Date(point.timestamp)` yields the correct instant. Returns a new
 * response object; the input is not mutated.
 */
function normalizeResponse(data: MetricsDataResponse): MetricsDataResponse {
  return {
    ...data,
    data: (data.data ?? []).map((metric) => ({
      ...metric,
      dataSeries: (metric.dataSeries ?? []).map((series) => ({
        ...series,
        data: (series.data ?? []).map((point) => ({...point, timestamp: point.timestamp * 1000})),
      })),
    })),
  };
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
  return normalizeResponse(data);
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
  return normalizeResponse(data);
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
  return normalizeResponse(data);
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
  return normalizeResponse(data);
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
  return normalizeResponse(data);
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
  return normalizeResponse(data);
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
  return normalizeResponse(data);
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
  return normalizeResponse(data);
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
  return normalizeResponse(data);
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
