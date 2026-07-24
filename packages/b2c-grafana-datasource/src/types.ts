/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import { DataQuery, DataSourceJsonData } from '@grafana/data';

/**
 * Metrics API categories (9 endpoints)
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

export type MetricCategory = (typeof METRIC_CATEGORIES)[number];

/**
 * A post-fetch label filter on an enriched series tag (the "Label filters" tier).
 * `key` is a derived dimension (metricId, statusClass, cacheStatus, host, ...);
 * `op` is '=' or '!='.
 */
export interface LabelFilter {
  key: string;
  op: '=' | '!=';
  value: string;
}

/**
 * Query model for B2C Metrics datasource.
 *
 * Filters live in two tiers that mirror the Metrics API:
 * - **Push-down** (server) filters — sent to the API, validated against a fixed enum,
 *   and cause the API to drill down: `apiFamily`, `apiName`, `ocapiCategory`,
 *   `ocapiApi`, `thirdPartyServiceId`.
 * - **Label filters** — applied post-fetch on enriched tags (`labelFilters`).
 */
export interface B2CMetricsQuery extends DataQuery {
  /** Metrics category (determines which endpoint to call). */
  category: MetricCategory;

  /** Metrics to return (metricIds). Empty = all metrics in the category. Multi-select. */
  metricIds?: string[];

  // Push-down (server) filters — validated dropdowns of the server enum in the editor.
  apiFamily?: string;
  apiName?: string;
  ocapiCategory?: string;
  ocapiApi?: string;
  thirdPartyServiceId?: string;

  /** Post-fetch label filters (the "Label filters" tier). */
  labelFilters?: LabelFilter[];

  /** Label keys to group by — drives the per-series legend/display name. */
  groupBy?: string[];

  /**
   * Optional per-query tenant override (empty = datasource default). Tenants on the
   * same realm share the datasource's shortCode + OAuth client; a dashboard `$tenant`
   * variable can switch e.g. prd ↔ stg. Template-interpolated before sending.
   */
  tenantId?: string;
}

/** A metric option returned by the `metrics` resource (value + label + unit). */
export interface MetricOption {
  value: string;
  label: string;
  unit: string;
}

/** A push-down filter descriptor returned by the `push-down-filters` resource. */
export interface PushDownFilter {
  key: string;
  hasEnum: boolean;
  values?: string[];
}

/**
 * DataSource configuration (stored in jsonData)
 */
export interface B2CMetricsDataSourceOptions extends DataSourceJsonData {
  /**
   * Instance short code (e.g., 'zzpq_013')
   */
  shortCode: string;

  /**
   * Tenant ID (normalized form or f_ecom_ prefixed)
   */
  tenantId: string;

  /**
   * OAuth client ID
   */
  clientId: string;

  /**
   * Account Manager host (optional, defaults to SDK value)
   */
  accountManagerHost?: string;

  /**
   * Full Metrics API base URL override (optional)
   * Example: http://mock-metrics:8080/observability/metrics/v1
   * Empty → derives https://{shortCode}.api.commercecloud.salesforce.com/observability/metrics/v1
   */
  apiUrl?: string;

  /**
   * Full OAuth token endpoint URL override (optional)
   * Example: http://mock-metrics:8080/dwsso/oauth2/access_token
   * Empty → derives https://{accountManagerHost}/dwsso/oauth2/access_token
   */
  tokenUrl?: string;
}

/**
 * Secure configuration (stored encrypted in secureJsonData)
 */
export interface B2CMetricsSecureJsonData {
  /**
   * OAuth client secret
   */
  clientSecret?: string;
}
