/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Generates the golden test fixture for metrics tags extraction.
 *
 * This fixture covers every extraction strategy with representative inputs,
 * including edge cases. Both TypeScript and Go tests assert against it to
 * guarantee parity.
 *
 * Run with: pnpm --filter @salesforce/b2c-tooling-sdk run generate:metrics-tags-golden
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import type {MetricCategory} from '../src/operations/metrics/index.js';
import {parseSeriesTags, type MetricsTagContext, type MetricSeriesTags} from '../src/operations/metrics/tags.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, '../specs/metrics-tags.golden.json');

interface GoldenTestCase {
  category: MetricCategory;
  metricId: string;
  seriesId: string;
  context: MetricsTagContext;
  expectedTags: MetricSeriesTags;
  description?: string;
}

interface GoldenFixture {
  version: string;
  generatedAt: string;
  description: string;
  testCases: GoldenTestCase[];
}

/**
 * Comprehensive test matrix covering every strategy and edge case.
 * Each case runs through parseSeriesTags to capture the expected output.
 */
const TEST_CASES: Array<Omit<GoldenTestCase, 'expectedTags'>> = [
  // Request-derived identity tags
  {
    category: 'scapi',
    metricId: 'totalCalls',
    seriesId: 'bdpx.product',
    context: {tenantId: 'f_ecom_bdpx_prd'},
    description: 'Derives realm and environment from prefixed org id',
  },
  {
    category: 'scapi',
    metricId: 'totalCalls',
    seriesId: 'bdpx.product',
    context: {tenantId: 'bdpx_prd'},
    description: 'Derives realm and environment from bare tenant id',
  },
  {
    category: 'overall',
    metricId: 'requests',
    seriesId: 'acme Requests',
    context: {tenantId: 'acme'},
    description: 'Realm with no environment (no underscore)',
  },
  {
    category: 'scapi',
    metricId: 'totalCalls',
    seriesId: 'multi_underscore_realm_env.product',
    context: {tenantId: 'multi_underscore_realm_env'},
    description: 'Multi-segment tenant id (environment is last segment)',
  },

  // SCAPI familyOrStatus strategy
  {
    category: 'scapi',
    metricId: 'totalCalls',
    seriesId: 'bdpx.product',
    context: {tenantId: 'bdpx_prd'},
    description: 'SCAPI totalCalls: apiFamily',
  },
  {
    category: 'scapi',
    metricId: 'responseCount',
    seriesId: 'bdpx 2xx',
    context: {tenantId: 'bdpx_prd'},
    description: 'SCAPI responseCount: statusClass (not apiFamily)',
  },
  {
    category: 'scapi',
    metricId: 'responseCount',
    seriesId: 'bdpx 4xx',
    context: {tenantId: 'bdpx_prd'},
    description: 'SCAPI responseCount: statusClass 4xx',
  },

  // SCAPI familyOrOverallAgg strategy
  {
    category: 'scapi',
    metricId: 'requestLatency',
    seriesId: 'bdpx Average overall latency',
    context: {tenantId: 'bdpx_prd'},
    description: 'SCAPI requestLatency: overall aggregation',
  },
  {
    category: 'scapi',
    metricId: 'requestLatency',
    seriesId: 'bdpx.product',
    context: {tenantId: 'bdpx_prd'},
    description: 'SCAPI requestLatency: apiFamily (not overall)',
  },

  // SCAPI drill-down ids (returned when filtering by apiFamily) — real bdpx_prd forms.
  // The leading family + trailing vN version split off; the middle is the api name.
  {
    category: 'scapi',
    metricId: 'totalCalls',
    seriesId: 'bdpx.shopper.auth.v1',
    context: {tenantId: 'bdpx_prd', apiFamily: 'shopper'},
    description: 'SCAPI drill-down: apiFamily + apiName + apiVersion (filter overrides family)',
  },
  {
    category: 'scapi',
    metricId: 'requestLatency',
    seriesId: 'bdpx.search.shopper-search.v1',
    context: {tenantId: 'bdpx_prd', apiFamily: 'search'},
    description: 'SCAPI drill-down: hyphenated apiName + version',
  },
  {
    category: 'scapi',
    metricId: 'totalCalls',
    seriesId: 'bdpx.shopper.baskets.v2',
    context: {tenantId: 'bdpx_prd'},
    description: 'SCAPI drill-down without filter: family/name/version all from id',
  },

  // Rollup series whose id is the bare metric id echoed back (real bdpx_prd forms
  // under a family filter): must be tagged aggregation=total, never apiFamily/series.
  {
    category: 'scapi',
    metricId: 'cacheHitRate',
    seriesId: 'cacheHitRate',
    context: {tenantId: 'bdpx_prd', apiFamily: 'shopper'},
    description: 'SCAPI rollup: cacheHitRate id echoes metric id → aggregation=total (filter still applies)',
  },
  {
    category: 'scapi',
    metricId: 'errors4xx',
    seriesId: 'errors4xx',
    context: {tenantId: 'bdpx_prd'},
    description: 'SCAPI rollup: errors4xx id echoes metric id → aggregation=total (not apiFamily)',
  },

  // SCAPI lastSpaceSplit strategy (cacheHitRate)
  {
    category: 'scapi',
    metricId: 'cacheHitRate',
    seriesId: 'bdpx.product HIT',
    context: {tenantId: 'bdpx_prd'},
    description: 'SCAPI cacheHitRate: apiFamily + cacheStatus split on space',
  },
  {
    category: 'scapi',
    metricId: 'cacheHitRate',
    seriesId: 'bdpx.custom MISS',
    context: {tenantId: 'bdpx_prd'},
    description: 'SCAPI cacheHitRate: MISS status',
  },
  {
    category: 'scapi',
    metricId: 'cacheHitRate',
    seriesId: 'bdpx.product',
    context: {tenantId: 'bdpx_prd'},
    description: 'SCAPI cacheHitRate: no space (apiFamily only)',
  },

  // SCAPI wholeAs strategy (errors4xx)
  {
    category: 'scapi',
    metricId: 'errors4xx',
    seriesId: 'bdpx.shopper',
    context: {tenantId: 'bdpx_prd'},
    description: 'SCAPI errors4xx: whole remainder as apiFamily',
  },

  // eCDN ecdnSuccessError strategy
  {
    category: 'ecdn',
    metricId: 'successAndError',
    seriesId: '2xx bdpx.bdpx-prod_cc-bm_net',
    context: {tenantId: 'bdpx_prd'},
    description: 'eCDN successAndError: status class before realm',
  },
  {
    category: 'ecdn',
    metricId: 'successAndError',
    seriesId: '5xx bdpx.bdpx-stg_host',
    context: {tenantId: 'bdpx_stg'},
    description: 'eCDN successAndError: 5xx status',
  },
  {
    category: 'ecdn',
    metricId: 'successAndError',
    seriesId: 'bdpx.bdpx-prod_host',
    context: {tenantId: 'bdpx_prd'},
    description: 'eCDN successAndError: no status (host only)',
  },

  // eCDN wildcard (wholeAs host)
  {
    category: 'ecdn',
    metricId: 'totalRequests',
    seriesId: 'bdpx.bdpx-prod_cc-bm_net',
    context: {tenantId: 'bdpx_prd'},
    description: 'eCDN other metrics: host only',
  },

  // third-party wholeAs (host)
  {
    category: 'third-party',
    metricId: 'callsCount',
    seriesId: 'bdpx.login.salesforce.com',
    context: {tenantId: 'bdpx_prd'},
    description: 'third-party callsCount: dotted host as whole remainder',
  },
  {
    category: 'third-party',
    metricId: 'callsP95',
    seriesId: 'bdpx.api.example.com',
    context: {tenantId: 'bdpx_prd'},
    description: 'third-party callsP95: dotted host',
  },

  // third-party lastDotSplit (remoteExceptions)
  {
    category: 'third-party',
    metricId: 'remoteExceptions',
    seriesId: 'bdpx.xitgmcd3.api.commercecloud.salesforce.com.socketReadTimeout',
    context: {tenantId: 'bdpx_prd'},
    description: 'third-party remoteExceptions: host + exceptionType (last dot split)',
  },
  {
    category: 'third-party',
    metricId: 'remoteExceptions',
    seriesId: 'bdpx.login.salesforce.com.connectionTimeout',
    context: {tenantId: 'bdpx_prd'},
    description: 'third-party remoteExceptions: another exception type',
  },
  {
    category: 'third-party',
    metricId: 'remoteExceptions',
    seriesId: 'bdpx.host',
    context: {tenantId: 'bdpx_prd'},
    description: 'third-party remoteExceptions: no dot (host only)',
  },

  // OCAPI wholeAs (ocapiCategory)
  {
    category: 'ocapi',
    metricId: 'totalCalls',
    seriesId: 'bdpx.shop',
    context: {tenantId: 'bdpx_prd'},
    description: 'OCAPI totalCalls: ocapiCategory',
  },
  {
    category: 'ocapi',
    metricId: 'callsMean',
    seriesId: 'bdpx.data',
    context: {tenantId: 'bdpx_prd'},
    description: 'OCAPI callsMean: ocapiCategory',
  },

  // Controller wildcard (wholeAs controller)
  {
    category: 'controller',
    metricId: 'callsMean',
    seriesId: 'bdpx.Checkout-Begin',
    context: {tenantId: 'bdpx_prd'},
    description: 'Controller wildcard: controller name',
  },
  {
    category: 'controller',
    metricId: 'totalCalls',
    seriesId: 'bdpx.Home-Show',
    context: {tenantId: 'bdpx_prd'},
    description: 'Controller wildcard: applies to any controller metric',
  },

  // Applied filters override heuristics
  {
    category: 'scapi',
    metricId: 'totalCalls',
    seriesId: 'bdpx.shopper.auth.v1',
    context: {tenantId: 'bdpx_prd', apiFamily: 'shopper'},
    description: 'Applied apiFamily filter overrides drill-down id',
  },
  {
    category: 'scapi',
    metricId: 'totalCalls',
    seriesId: 'totalCalls',
    context: {tenantId: 'bdpx_prd', apiFamily: 'products', apiName: 'shopper-products'},
    description: 'Applied apiFamily + apiName filters',
  },
  {
    category: 'ocapi',
    metricId: 'totalCalls',
    seriesId: 'totalCalls',
    context: {tenantId: 'bdpx_prd', ocapiCategory: 'shop'},
    description: 'Applied ocapiCategory filter',
  },
  {
    category: 'third-party',
    metricId: 'callsCount',
    seriesId: 'bdpx.login.salesforce.com',
    context: {tenantId: 'bdpx_prd', thirdPartyServiceId: 'my.svc'},
    description: 'Applied thirdPartyServiceId filter (heuristic host still present)',
  },

  // Fallback behavior
  {
    category: 'overall',
    metricId: 'requests',
    seriesId: 'bdpx Requests',
    context: {tenantId: 'bdpx_prd'},
    description: 'Unrecognized pattern: prose label under series tag',
  },
  {
    category: 'mrt',
    metricId: 'errorRate',
    seriesId: 'errorRate',
    context: {tenantId: 'bdpx_prd'},
    description: 'Fallback series echoes metric id (not captured as series tag)',
  },
];

async function generateGolden(): Promise<void> {
  const testCases: GoldenTestCase[] = TEST_CASES.map((tc) => ({
    ...tc,
    expectedTags: parseSeriesTags(tc),
  }));

  const fixture: GoldenFixture = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    description:
      'Golden test fixture for metrics tags extraction. Covers all strategies and edge cases. Both TS and Go tests assert against this.',
    testCases,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(fixture, null, 2) + '\n');

  console.log(`Generated metrics tags golden fixture with ${testCases.length} test cases at ${OUTPUT_PATH}`);
}

generateGolden().catch((err) => {
  console.error('Failed to generate metrics tags golden fixture:', err);
  process.exit(1);
});
