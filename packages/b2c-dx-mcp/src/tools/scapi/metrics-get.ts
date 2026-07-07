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
import {
  getMetricsByCategory,
  resolveMetricsWindow,
  enrichMetricsTags,
  type MetricsDataResponse,
} from '@salesforce/b2c-tooling-sdk';

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
}

/**
 * Output for metrics_get: the metrics response plus the effective query
 * parameters (resolved time bounds and filters) so the caller always sees what
 * was actually sent. Both `from` and `to` are always present: the resolver
 * derives whichever bound was left open from the 24-hour default window.
 */
interface MetricsGetOutput extends MetricsDataResponse {
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
 * (timestamp, value) grouped by series (e.g., 2xx, 4xx, 5xx response codes).
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
      description: `CLOSED BETA: the Metrics API must be enabled for your organization, and its behavior, output, and OAuth scopes may change without notice.

Retrieve observability metrics time-series for a B2C Commerce tenant. Returns metrics data grouped by category with time-series data points.

**Categories:**
- overall: Aggregate site metrics (requests, response times, errors)
- sales: Sales and order metrics
- ecdn: Edge CDN performance metrics
- third-party: External service metrics (use thirdPartyServiceId filter)
- scapi: SCAPI endpoint metrics (use apiFamily/apiName filters)
- scapi-hooks: SCAPI hooks execution metrics
- mrt: Managed Runtime (PWA Kit) metrics
- controller: Controller execution metrics
- ocapi: OCAPI endpoint metrics (use ocapiCategory/ocapiApi filters)

**Time window:** Provide "from" and/or "to" as a relative duration ("1h", "7d" — interpreted as ago) or an ISO 8601 timestamp, and/or "window" as a duration ("1h", "30m"). The tool always sends an explicit from+to range, defaulting to a 24-hour window: from + window → to = from + window; to + window → from = to - window; window alone → the last <window>; from alone → 24h forward from it (capped at now); to alone → 24h back from it; nothing → the last 24h. Do not supply from, to, and window together. The API caps a window at 24h and retains 30 days; an explicit range wider than 24h is sent as-is and the API returns a clear error.

**Response:** { query, data } — "query" echoes the resolved from/to (ISO + epoch seconds), filters, and defaultedWindow/clampedFrom flags; "data[]" contains metricId, title, description, unit, and dataSeries[] with time-series points (timestamp in epoch milliseconds, value). Each series also carries a structured "tags" object (realm, environment, any applied filters, and per-series dimensions like apiFamily/host/cacheStatus) parsed client-side from the packed series id — use these to group/filter rather than parsing the series id string.

**Requirements:** OAuth with sfcc.metrics scope.`,
      toolsets: ['SCAPI'],
      isGA: false,
      requiresInstance: false, // SCAPI uses OAuth directly
      inputSchema: {
        category: z
          .enum(['overall', 'sales', 'ecdn', 'third-party', 'scapi', 'scapi-hooks', 'mrt', 'controller', 'ocapi'])
          .describe(
            'Metrics category: overall (aggregate), sales, ecdn (CDN), third-party (external), scapi (SCAPI APIs), scapi-hooks, mrt (PWA Kit), controller, ocapi',
          ),
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
          .describe(
            'Window duration ("1h", "30m", "2d"). With from → to=from+window; with to → from=to-window; alone → the last <window>. Defaults to 24h.',
          ),
        thirdPartyServiceId: z
          .string()
          .optional()
          .describe('Filter by third-party service ID (third-party category only)'),
        apiFamily: z.string().optional().describe('Filter by SCAPI API family (scapi category only)'),
        apiName: z.string().optional().describe('Filter by SCAPI API name (scapi category only)'),
        ocapiCategory: z.string().optional().describe('Filter by OCAPI category (ocapi category only)'),
        ocapiApi: z.string().optional().describe('Filter by OCAPI API (ocapi category only)'),
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

        return {
          ...response,
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
          },
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}
