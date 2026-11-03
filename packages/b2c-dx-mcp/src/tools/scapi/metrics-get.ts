/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Metrics Get tool.
 *
 * Retrieves observability metrics time-series data for B2C Commerce tenants via SCAPI
 * observability/metrics/v1. Returns metrics data grouped by category (overall, sales, ecdn,
 * third-party, scapi, scapi-hooks, mrt, controller, ocapi).
 *
 * @module tools/scapi/metrics-get
 */

import {z} from 'zod';
import {createToolAdapter, jsonResult} from '../adapter.js';
import type {Services} from '../../services.js';
import type {McpTool} from '../../utils/index.js';
import {getMetricsByCategory, resolveMetricsWindow, enrichMetricsTags} from '@salesforce/b2c-tooling-sdk';

/**
 * Input parameters for metrics_get tool.
 */
interface MetricsGetInput {
  /** Metrics category to retrieve */
  category: 'controller' | 'ecdn' | 'mrt' | 'ocapi' | 'overall' | 'sales' | 'scapi' | 'scapi-hooks' | 'third-party';
  /** Start bound: relative ("1h", "7d" ago) or ISO 8601 (optional) */
  from?: string;
  /** End bound: relative ("6h" ago) or ISO 8601 (optional) */
  to?: string;
  /** Window duration ("1h", "30m", "2d") combined with from/to, or the last <window> alone (optional) */
  window?: string;
  /** Filter by third-party service ID (third-party category only) */
  thirdPartyServiceId?: string;
  /** Filter by SCAPI API family (scapi category only) */
  apiFamily?: string;
  /** Filter by SCAPI API name (scapi category only) */
  apiName?: string;
  /** Filter by OCAPI category (ocapi category only) */
  ocapiCategory?: string;
  /** Filter by OCAPI API (ocapi category only) */
  ocapiApi?: string;
  /** Replace each series' data points with summary statistics (optional) */
  summarize?: boolean;
}

/**
 * Per-series statistics returned instead of data points when `summarize` is set.
 * Statistics cover the returned points only; intervals without a point are
 * absent from the API (not zero) and are not counted.
 */
interface MetricSeriesSummary {
  points: number;
  sum?: number;
  min?: number;
  max?: number;
  avg?: number;
  /** ISO timestamp of the maximum value. */
  maxAt?: string;
  firstAt?: string;
  lastAt?: string;
}

const round = (n: number): number => Math.round(n * 1000) / 1000;

/**
 * Summarizes a series' data points. Placeholder series (no data) yield `{points: 0}`.
 */
export function summarizeSeriesData(data: Array<{timestamp: number; value: number}>): MetricSeriesSummary {
  if (data.length === 0) return {points: 0};
  let sum = 0;
  let min = data[0];
  let max = data[0];
  let first = data[0];
  let last = data[0];
  for (const point of data) {
    sum += point.value;
    if (point.value < min.value) min = point;
    if (point.value > max.value) max = point;
    if (point.timestamp < first.timestamp) first = point;
    if (point.timestamp > last.timestamp) last = point;
  }
  return {
    points: data.length,
    sum: round(sum),
    min: round(min.value),
    max: round(max.value),
    avg: round(sum / data.length),
    maxAt: new Date(max.timestamp).toISOString(),
    firstAt: new Date(first.timestamp).toISOString(),
    lastAt: new Date(last.timestamp).toISOString(),
  };
}

const SIGNALS_URI = 'skill://b2c-ops/b2c-production-triage/references/metrics-signals.md';

/**
 * Reading caveats returned with every response. They describe what the data
 * cannot show, which agents otherwise infer wrongly from the series alone.
 */
const COMMON_NOTES = [
  'Latency and rate series only have points for intervals with events; a gap means no events, not zero.',
  'A series whose id equals its metricId with no data is a placeholder (no events).',
];
const CATEGORY_NOTES: Partial<Record<MetricsGetInput['category'], string[]>> = {
  ecdn: ['Includes every zone host (production, staging, development, Business Manager); filter by tags.host.'],
  'third-party': [
    'Series identify the outbound host only: HTTP status, service ID and response bodies are not in this data; use service logs.',
  ],
};

/**
 * Output for metrics_get: the metrics response plus the effective query
 * parameters (resolved time bounds and filters) so the caller always sees what
 * was actually sent. Both `from` and `to` are always present: the resolver
 * derives whichever bound was left open from the 24-hour default window.
 */
interface MetricsGetOutput {
  data: unknown[];
  /** Category-specific limits of the data and where to read more. */
  notes: string[];
  query: {
    category: MetricsGetInput['category'];
    from: string;
    to: string;
    fromEpochSeconds: number;
    toEpochSeconds: number;
    /** True when `from` was clamped forward to stay within the 30-day retention window. */
    clampedFrom?: boolean;
    /** True when a bound was derived from the 24-hour default window. */
    defaultedWindow?: boolean;
    thirdPartyServiceId?: string;
    apiFamily?: string;
    apiName?: string;
    ocapiCategory?: string;
    ocapiApi?: string;
    summarize?: boolean;
  };
}

/**
 * Creates the metrics_get tool.
 *
 * Retrieves observability metrics time-series for a B2C Commerce tenant by category:
 * - **overall**: Aggregate site metrics (requests, response times, errors)
 * - **sales**: Sales and order metrics
 * - **ecdn**: Edge CDN performance metrics
 * - **third-party**: External service integration metrics (filter by thirdPartyServiceId)
 * - **scapi**: SCAPI endpoint metrics (filter by apiFamily, apiName)
 * - **scapi-hooks**: SCAPI hooks execution metrics
 * - **mrt**: Managed Runtime (PWA Kit) metrics
 * - **controller**: Controller execution metrics
 * - **ocapi**: OCAPI endpoint metrics (filter by ocapiCategory, ocapiApi)
 *
 * Returns time-series data with metric metadata (title, description, unit) and data points
 * (timestamp, value) grouped by series. Each series carries a structured `tags` map
 * (realm, environment, apiFamily, host, statusClass, …) parsed from its packed id.
 *
 * **Requirements:** OAuth with `sfcc.metrics` scope.
 *
 * @param loadServices - Function that loads configuration and returns Services instance
 * @returns MCP tool for retrieving metrics
 */
export function createMetricsGetTool(loadServices: () => Promise<Services> | Services): McpTool {
  return createToolAdapter<MetricsGetInput, MetricsGetOutput>(
    {
      name: 'metrics_get',
      effect: 'read',
      idempotent: true,
      openWorld: true,
      description:
        'CLOSED BETA. Retrieve B2C observability metric time series by category and time range. ' +
        'Defaults to the last 24 hours. Requires Metrics API access and OAuth scope sfcc.metrics. ' +
        'For incidents follow skill://b2c-ops/b2c-performance-triage/SKILL.md or b2c-integration-triage (external services); ' +
        'signal reference: skill://b2c-ops/b2c-production-triage/references/metrics-signals.md.',
      toolsets: ['SCAPI'],
      requiresInstance: false, // SCAPI uses OAuth directly
      usesConfigurationContext: true,
      inputSchema: {
        category: z
          .enum(['overall', 'sales', 'ecdn', 'third-party', 'scapi', 'scapi-hooks', 'mrt', 'controller', 'ocapi'])
          .describe('Metrics category.'),
        from: z
          .string()
          .optional()
          .describe(
            'Start bound: relative ("1h", "7d" ago) or ISO 8601. Alone → a 24h window forward (capped at now).',
          ),
        to: z
          .string()
          .optional()
          .describe('End bound: relative ("6h" ago) or ISO 8601. Alone → a 24h window back from it.'),
        window: z
          .string()
          .optional()
          .describe('Duration combined with from or to; alone selects the latest window. Default: 24h.'),
        thirdPartyServiceId: z
          .string()
          .optional()
          .describe('Filter by third-party service ID (third-party category only)'),
        apiFamily: z.string().optional().describe('Filter by SCAPI API family (scapi category only)'),
        apiName: z.string().optional().describe('Filter by SCAPI API name (scapi category only)'),
        ocapiCategory: z.string().optional().describe('Filter by OCAPI category (ocapi category only)'),
        ocapiApi: z.string().optional().describe('Filter by OCAPI API (ocapi category only)'),
        summarize: z
          .boolean()
          .optional()
          .describe('Return per-series stats (points, sum, min, max, avg, maxAt) instead of data points.'),
      },
      async execute(args, {services: svc}) {
        // Get client and tenant ID
        const client = svc.getMetricsClient();
        const tenantId = svc.getTenantId();

        if (!tenantId) {
          throw new Error(
            'Tenant ID required. Provide --tenant-id, set SFCC_TENANT_ID, or configure tenant-id in dw.json.',
          );
        }

        // Resolve the requested bounds into an explicit from+to range, filling any
        // open bound from the 24-hour default window (the API caps a window at 24h
        // and pairs a missing `to` with its own `now`). Throws a clear error on
        // unparseable/over-specified input before the request.
        const window = resolveMetricsWindow({from: args.from, to: args.to, window: args.window});

        const raw = await getMetricsByCategory(client, tenantId, args.category, {
          from: window.from,
          to: window.to,
          thirdPartyServiceId: args.thirdPartyServiceId,
          apiFamily: args.apiFamily,
          apiName: args.apiName,
          ocapiCategory: args.ocapiCategory,
          ocapiApi: args.ocapiApi,
        });

        // Enrich each series with a structured `tags` object (realm/environment
        // from the request, applied filters, and per-series dimensions parsed
        // from the packed id). Additive and always-on for this machine consumer.
        const response = enrichMetricsTags(raw, args.category, {
          tenantId,
          apiFamily: args.apiFamily,
          apiName: args.apiName,
          ocapiCategory: args.ocapiCategory,
          ocapiApi: args.ocapiApi,
          thirdPartyServiceId: args.thirdPartyServiceId,
        });

        const data = args.summarize
          ? response.data.map(({dataSeries, ...metric}) => ({
              ...metric,
              dataSeries: dataSeries.map(({data: points, ...series}) => ({
                ...series,
                summary: summarizeSeriesData(points ?? []),
              })),
            }))
          : response.data;

        return {
          data,
          notes: [...(CATEGORY_NOTES[args.category] ?? []), ...COMMON_NOTES, `Signal guide: ${SIGNALS_URI}`],
          query: {
            category: args.category,
            from: window.fromIso,
            to: window.toIso,
            fromEpochSeconds: window.fromEpochSeconds,
            toEpochSeconds: window.toEpochSeconds,
            clampedFrom: window.clampedFrom || undefined,
            defaultedWindow: window.defaultedWindow || undefined,
            thirdPartyServiceId: args.thirdPartyServiceId,
            apiFamily: args.apiFamily,
            apiName: args.apiName,
            ocapiCategory: args.ocapiCategory,
            ocapiApi: args.ocapiApi,
            summarize: args.summarize || undefined,
          },
        };
      },
      // Compact JSON: indentation roughly doubles the size of per-minute series.
      formatOutput: (output) => jsonResult(output, 0),
    },
    loadServices,
  );
}
