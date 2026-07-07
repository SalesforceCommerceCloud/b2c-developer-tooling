/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Metrics Get tool.
 *
 * ⚠️ **CLOSED BETA:** The Metrics API is a closed beta feature. It must be enabled for your
 * organization, and its behavior, output, and OAuth scopes may change without notice.
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
import {getMetricsByCategory, type MetricsDataResponse} from '@salesforce/b2c-tooling-sdk';

/**
 * Input parameters for metrics_get tool.
 */
interface MetricsGetInput {
  /** Metrics category to retrieve */
  category: 'controller' | 'ecdn' | 'mrt' | 'ocapi' | 'overall' | 'sales' | 'scapi' | 'scapi-hooks' | 'third-party';
  /** Start time in epoch milliseconds (optional) */
  from?: number;
  /** End time in epoch milliseconds (optional) */
  to?: number;
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
 * Creates the metrics_get tool.
 *
 * ⚠️ **CLOSED BETA:** The Metrics API is a closed beta feature. It must be enabled for your
 * organization, and its behavior, output, and OAuth scopes may change without notice.
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
  return createToolAdapter<MetricsGetInput, MetricsDataResponse>(
    {
      name: 'metrics_get',
      description: `⚠️ **CLOSED BETA:** The Metrics API is a closed beta feature. It must be enabled for your organization, and its behavior, output, and OAuth scopes may change without notice.

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

**Response:** MetricsDataResponse with data[] containing metricId, title, description, unit, dataSeries[] with time-series data points (timestamp, value).

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
        from: z.number().int().optional().describe('Start time in epoch milliseconds (optional)'),
        to: z.number().int().optional().describe('End time in epoch milliseconds (optional)'),
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

        // Build options object with category-specific filters
        const options: {
          from?: number;
          to?: number;
          thirdPartyServiceId?: string;
          apiFamily?: string;
          apiName?: string;
          ocapiCategory?: string;
          ocapiApi?: string;
        } = {};

        if (args.from !== undefined) options.from = args.from;
        if (args.to !== undefined) options.to = args.to;
        if (args.thirdPartyServiceId !== undefined) options.thirdPartyServiceId = args.thirdPartyServiceId;
        if (args.apiFamily !== undefined) options.apiFamily = args.apiFamily;
        if (args.apiName !== undefined) options.apiName = args.apiName;
        if (args.ocapiCategory !== undefined) options.ocapiCategory = args.ocapiCategory;
        if (args.ocapiApi !== undefined) options.ocapiApi = args.ocapiApi;

        return getMetricsByCategory(client, tenantId, args.category, options);
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}
