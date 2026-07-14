/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Client-side dimension extraction for Metrics API series.
 *
 * The Metrics API returns each series as `{id, name, data}`, where `id`/`name`
 * pack every identifying dimension into a single display string using
 * inconsistent delimiters — e.g. `bdpx.product` (realm `.` apiFamily),
 * `bdpx.product HIT` (realm `.` family ` ` cacheStatus), `2xx bdpx.host` (status
 * class *before* the realm), or `bdpx.host.socketReadTimeout` (realm `.` host —
 * whose own dots are ambiguous — `.` exceptionType). This makes the strings
 * effectively unparseable in general and awkward to chart, group, or merge
 * across realms.
 *
 * This module derives a structured, InfluxDB/Prometheus-style `tags` map for
 * each series so consumers (dashboards, a Grafana plugin, ad-hoc analysis) can
 * group and filter by dimension instead of regexing display strings. Two design
 * rules keep it robust:
 *
 * 1. **Identity comes from the request, not the string.** `realm` and
 *    `environment` are derived from the tenant/organization the request targeted
 *    (`f_ecom_bdpx_prd` → `realm=bdpx`, `environment=prd`), never scraped from
 *    the packed id. This is reliable regardless of the id's delimiter soup and
 *    correctly distinguishes the *org's* environment from, say, eCDN hosts that
 *    span dev/stg/prod within a single prod request.
 * 2. **Never throw, never drop data.** An id that matches no known pattern still
 *    gets `{realm, environment}` plus the unrecognized remainder under `series`,
 *    so enrichment only ever adds information.
 *
 * This is an interim client-side convenience. The intent is for the Metrics API
 * to expose a `tags` object on each series server-side; when it does, this layer
 * becomes a thin fallback (or is retired).
 *
 * @module operations/metrics/tags
 */

import type {MetricsDataResponse} from '../../clients/metrics.js';
import {normalizeTenantId} from '../../clients/custom-apis.js';
import {getLogger} from '../../logging/logger.js';
import type {MetricCategory} from './index.js';

/**
 * A flat map of a series' identifying dimensions (string → string), following
 * the InfluxDB/Prometheus/CloudWatch "tag"/"label"/"dimension" convention.
 *
 * Always contains `realm` and `environment` (derived from the request context).
 * Category-specific keys (`apiFamily`, `host`, `cacheStatus`, `statusClass`,
 * `ocapiCategory`, `controller`, `exceptionType`) are added when recognized. A
 * rollup/aggregation series carries `aggregation` (a *statistic*, not a
 * dimension — kept distinct so consumers can separate "how it was computed" from
 * "what it describes"). An unrecognized remainder is preserved under `series`.
 */
export type MetricSeriesTags = Record<string, string>;

/**
 * The request identity and applied filters used to derive authoritative tags.
 *
 * `realm`/`environment` are parsed from `tenantId`. The optional filter fields
 * mirror the Metrics API's category filters; when a filter was sent, that
 * dimension is *known from the request* and is stamped onto every series as an
 * authoritative tag — rather than being (mis)parsed from a drilled-down series
 * id. For example, requesting `apiFamily=shopper` makes the server return
 * finer-grained ids like `bdpx.shopper.auth.v1`; folding the filter in yields the
 * correct `apiFamily: "shopper"` instead of the string-parser's wrong
 * `apiFamily: "shopper.auth.v1"`.
 */
export interface MetricsTagContext {
  /** Tenant or organization id the request targeted (with or without `f_ecom_`). */
  tenantId: string;
  /** The `apiFamily` filter sent with a scapi request, if any. */
  apiFamily?: string;
  /** The `apiName` filter sent with a scapi request, if any. */
  apiName?: string;
  /** The `ocapiCategory` filter sent with an ocapi request, if any. */
  ocapiCategory?: string;
  /** The `ocapiApi` filter sent with an ocapi request, if any. */
  ocapiApi?: string;
  /** The `thirdPartyServiceId` filter sent with a third-party request, if any. */
  thirdPartyServiceId?: string;
}

/**
 * Maps a {@link MetricsTagContext} filter field to the tag key it authoritatively
 * sets when present. These override any value the string heuristics would infer.
 */
const FILTER_TAG_KEYS: Array<[keyof MetricsTagContext, string]> = [
  ['apiFamily', 'apiFamily'],
  ['apiName', 'apiName'],
  ['ocapiCategory', 'ocapiCategory'],
  ['ocapiApi', 'ocapiApi'],
  ['thirdPartyServiceId', 'thirdPartyServiceId'],
];

/**
 * Splits a normalized tenant id (`bdpx_prd`) into its realm and environment.
 * The environment is the final underscore-delimited segment; everything before
 * it is the realm. Ids without an underscore yield just a realm.
 */
function splitRealmEnvironment(tenantId: string): {realm: string; environment?: string} {
  const normalized = normalizeTenantId(tenantId);
  const lastUnderscore = normalized.lastIndexOf('_');
  if (lastUnderscore <= 0 || lastUnderscore === normalized.length - 1) {
    return {realm: normalized};
  }
  return {
    realm: normalized.slice(0, lastUnderscore),
    environment: normalized.slice(lastUnderscore + 1),
  };
}

/**
 * Strips a leading `realm.` or `realm ` prefix from a packed series id, if
 * present. The Metrics API prefixes most ids with the realm using either a `.`
 * or a space; this removes whichever is found so the category rule sees only the
 * dimension remainder. Returns the input unchanged when no realm prefix matches.
 */
function stripRealmPrefix(seriesId: string, realm: string): string {
  if (seriesId.startsWith(`${realm}.`)) return seriesId.slice(realm.length + 1);
  if (seriesId.startsWith(`${realm} `)) return seriesId.slice(realm.length + 1);
  return seriesId;
}

/**
 * A category/metric-specific rule that extracts dimension tags from the portion
 * of a series id remaining after the realm prefix is stripped.
 *
 * @param remainder - The series id with any leading `realm.`/`realm ` removed
 * @param rawId - The original, unmodified series id (for cases where the realm
 *   is not a leading prefix, e.g. eCDN's `2xx realm.host`)
 * @param realm - The realm derived from the request context
 * @returns A map of extracted dimension tags (may be empty)
 */
type SeriesTagExtractor = (remainder: string, rawId: string, realm: string) => MetricSeriesTags;

/**
 * Extractor for series whose remainder is a bare API family (`product`,
 * `custom`, …) — but which may instead be an HTTP status class (`2xx`) or the
 * metric's own fallback id. SCAPI mixes these within a single metric.
 */
const scapiFamilyOrStatus: SeriesTagExtractor = (remainder): MetricSeriesTags => {
  if (/^[1-5]xx$/.test(remainder)) return {statusClass: remainder};
  return {apiFamily: remainder};
};

/**
 * Per-category, per-metric extraction rules. Keyed by `category` then
 * `metricId`; a category-level `*` entry applies to any metric not explicitly
 * listed. Rules operate on the realm-stripped remainder (see
 * {@link stripRealmPrefix}); returning `{}` means "no extra dimensions, just the
 * context tags."
 */
const EXTRACTORS: Partial<Record<MetricCategory, Record<string, SeriesTagExtractor>>> = {
  scapi: {
    // `bdpx.product` → apiFamily=product; `bdpx 2xx`/`bdpx 3xx` → statusClass
    totalCalls: scapiFamilyOrStatus,
    requestLatency: (remainder): MetricSeriesTags => {
      // `Average overall latency` is a rollup, not a per-family series.
      if (/overall/i.test(remainder)) return {aggregation: 'overall'};
      return {apiFamily: remainder};
    },
    responseCount: scapiFamilyOrStatus,
    errors4xx: (remainder): MetricSeriesTags => ({apiFamily: remainder}),
    // `bdpx.product HIT` / `bdpx.custom MISS` → apiFamily + cacheStatus
    cacheHitRate: (remainder): MetricSeriesTags => {
      const spaceIdx = remainder.lastIndexOf(' ');
      if (spaceIdx > 0) {
        return {apiFamily: remainder.slice(0, spaceIdx), cacheStatus: remainder.slice(spaceIdx + 1)};
      }
      return {apiFamily: remainder};
    },
  },
  ocapi: {
    // `bdpx.shop` → ocapiCategory=shop
    totalCalls: (remainder): MetricSeriesTags => ({ocapiCategory: remainder}),
    callsMean: (remainder): MetricSeriesTags => ({ocapiCategory: remainder}),
  },
  controller: {
    // `bdpx.Home-Show` → controller=Home-Show (applies to every controller metric)
    '*': (remainder): MetricSeriesTags => ({controller: remainder}),
  },
  'third-party': {
    // `bdpx.login.salesforce.com` → host; the host itself contains dots, so we
    // treat the whole remainder as the host for call/latency metrics.
    callsCount: (remainder): MetricSeriesTags => ({host: remainder}),
    callsP95: (remainder): MetricSeriesTags => ({host: remainder}),
    // `bdpx.host.socketReadTimeout` → host + exceptionType. The exception type is
    // the final dot-segment; everything before it is the (dotted) host. This is
    // only unambiguous because we key on the remoteExceptions metric.
    remoteExceptions: (remainder): MetricSeriesTags => {
      const lastDot = remainder.lastIndexOf('.');
      if (lastDot > 0) {
        return {host: remainder.slice(0, lastDot), exceptionType: remainder.slice(lastDot + 1)};
      }
      return {host: remainder};
    },
  },
  ecdn: {
    // `2xx bdpx.host` (status class BEFORE the realm) → statusClass + host; other
    // eCDN metrics are just `bdpx.host` → host. Operates on the raw id because
    // the realm is not a leading prefix here.
    successAndError: (_remainder, rawId, realm): MetricSeriesTags => {
      const spaceIdx = rawId.indexOf(' ');
      if (spaceIdx > 0) {
        const statusClass = rawId.slice(0, spaceIdx);
        const host = stripRealmPrefix(rawId.slice(spaceIdx + 1), realm);
        return {statusClass, host};
      }
      return {host: stripRealmPrefix(rawId, realm)};
    },
    '*': (remainder) => ({host: remainder}),
  },
};

/**
 * Extracts the dimension tags for a single series id.
 *
 * Combines three tiers, most-authoritative last:
 * 1. **Request identity** — `realm`/`environment` from the tenant id (never parsed
 *    from the series string).
 * 2. **String heuristics** — category/metric-specific dimensions parsed from the
 *    packed id (`apiFamily`, `host`, `cacheStatus`, …), or the raw remainder under
 *    `series` when no rule matches.
 * 3. **Applied filters** — any filter that was sent with the request
 *    ({@link MetricsTagContext}) is stamped last, overriding a heuristic guess.
 *    This corrects drill-down ids: with `apiFamily=shopper` the server returns
 *    `bdpx.shopper.auth.v1`, which heuristics would mis-tag as
 *    `apiFamily: "shopper.auth.v1"`; the filter restores `apiFamily: "shopper"`.
 *
 * The result is always a superset of the request context and never throws.
 *
 * @param params - The series' category, metric id, series id, and request context
 * @returns The extracted {@link MetricSeriesTags}
 *
 * @example
 * ```typescript
 * parseSeriesTags({
 *   category: 'scapi', metricId: 'cacheHitRate',
 *   seriesId: 'bdpx.product HIT', context: {tenantId: 'f_ecom_bdpx_prd'},
 * });
 * // → { realm: 'bdpx', environment: 'prd', apiFamily: 'product', cacheStatus: 'HIT' }
 * ```
 */
export function parseSeriesTags(params: {
  category: MetricCategory;
  metricId: string;
  seriesId: string;
  context: MetricsTagContext;
}): MetricSeriesTags {
  const {category, metricId, seriesId, context} = params;
  const {realm, environment} = splitRealmEnvironment(context.tenantId);

  const tags: MetricSeriesTags = {realm};
  if (environment) tags.environment = environment;

  const categoryRules = EXTRACTORS[category];
  const extractor = categoryRules?.[metricId] ?? categoryRules?.['*'];
  const remainder = stripRealmPrefix(seriesId, realm);

  if (extractor) {
    Object.assign(tags, extractor(remainder, seriesId, realm));
  } else if (remainder && remainder !== metricId) {
    // No rule for this category/metric. Preserve the (realm-stripped) remainder
    // so nothing is lost, unless it is just the metric id echoed back (a
    // value-less fallback series).
    tags.series = remainder;
  }

  // Applied filters are authoritative — stamp them last so they override any
  // heuristic guess from a drilled-down id.
  for (const [field, key] of FILTER_TAG_KEYS) {
    const value = context[field];
    if (value) tags[key] = value;
  }

  return tags;
}

/**
 * Enriches a metrics response by adding a structured `tags` map to every series,
 * in place-safe fashion (returns a new response; the input is not mutated).
 *
 * This is the batch counterpart to {@link parseSeriesTags}: it walks every
 * metric and series and attaches `series.tags` derived from the series id, the
 * metric id, the category, and the request context. Existing fields (`id`,
 * `name`, `data`) are preserved exactly, so the enriched response is a
 * structural superset — consumers that ignore `tags` are unaffected. The
 * category must be supplied because a {@link MetricsDataResponse} does not carry
 * it (it is implied by the endpoint that produced the response).
 *
 * @param response - The metrics response to enrich
 * @param category - The metric category the response was fetched for
 * @param context - The request identity used to derive `realm`/`environment`
 * @returns A new response with `tags` added to each series
 *
 * @example
 * ```typescript
 * const raw = await getScapiMetrics(client, tenantId);
 * const enriched = enrichMetricsTags(raw, 'scapi', {tenantId});
 * for (const metric of enriched.data) {
 *   for (const series of metric.dataSeries) {
 *     console.log(series.tags, series.data);
 *   }
 * }
 * ```
 */
export function enrichMetricsTags(
  response: MetricsDataResponse,
  category: MetricCategory,
  context: MetricsTagContext,
): MetricsTaggedResponse {
  let unparsed = 0;
  const data = (response.data ?? []).map((metric) => ({
    ...metric,
    dataSeries: (metric.dataSeries ?? []).map((series) => {
      const tags = parseSeriesTags({
        category,
        metricId: metric.metricId,
        seriesId: series.id,
        context,
      });
      // Count series where no dimension beyond identity was recovered, to log
      // once about incomplete coverage without failing.
      const hasDimension = Object.keys(tags).some((k) => k !== 'realm' && k !== 'environment');
      if (!hasDimension) unparsed++;
      return {...series, tags};
    }),
  }));

  if (unparsed > 0) {
    getLogger().debug(
      {unparsed, category, tenantId: context.tenantId},
      'enrichMetricsTags: some series yielded only identity tags (no category dimensions)',
    );
  }

  return {...response, data};
}

/**
 * A metrics response whose series carry the structured {@link MetricSeriesTags}.
 * Structurally a superset of {@link MetricsDataResponse}.
 */
export interface MetricsTaggedResponse extends MetricsDataResponse {
  data: Array<
    MetricsDataResponse['data'][number] & {
      dataSeries: Array<MetricsDataResponse['data'][number]['dataSeries'][number] & {tags: MetricSeriesTags}>;
    }
  >;
}
