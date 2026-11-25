/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {SearchMode, ShopperSearchClient} from '../../clients/shopper-search.js';
import {getApiErrorMessage} from '../../clients/error-utils.js';
import {getLogger} from '../../logging/logger.js';
import {normalizeQueries, withoutUndefined} from './capture.js';
import {SEARCH_CAPTURE_SCHEMA_VERSION} from './types.js';

/** Most queries {@link checkSearchModes} accepts. Each query is sent three times, once per search mode. */
export const MAX_STATUS_QUERIES = 5;

/** Where Agentic Commerce Search is turned on, named in warnings. */
const SEARCH_PREFERENCES_PATH = 'Merchant Tools > Agentic Commerce Search > Search Preferences';

/**
 * The search mode a probe asked for. `default` sends no `searchMode`, so the
 * platform's configured engine applies, the same one the storefront uses.
 */
export type RequestedSearchMode = 'default' | 'lexical' | 'semantic';

/**
 * Whether Agentic Commerce Search is serving a site, as far as the probes can tell.
 *
 * - `serving`: a request for the `semantic` search mode was served by semantic search.
 * - `not-serving`: the API rejected the `semantic` search mode, or multi-word queries
 *   fell back to lexical search. The feature is off for the site or its semantic index
 *   is not ready yet.
 * - `unknown`: the probes do not settle it. See {@link SearchModeStatus.warnings}.
 */
export type AgenticCommerceSearchState = 'not-serving' | 'serving' | 'unknown';

/**
 * The engine that serves requests without a `searchMode`, which is what shoppers
 * on the storefront get.
 *
 * - `semantic` or `lexical`: every successful request was served by that engine.
 * - `mixed`: successful requests were served by different engines.
 * - `unreported`: requests succeeded, but the API did not report the engine.
 * - `failed`: no request succeeded.
 */
export type SiteDefaultSearchMode = 'failed' | 'lexical' | 'mixed' | 'semantic' | 'unreported';

/**
 * What happened to the requests for `searchMode=semantic`.
 *
 * - `served`: at least one succeeded and was served by semantic search.
 * - `fallback`: at least one succeeded and none was served by semantic search; the API
 *   reported lexical search. Semantic search falls back to lexical when its index is
 *   missing or not ready, and for single-word product lookups.
 * - `rejected`: every request failed with HTTP 400.
 * - `unreported`: at least one succeeded, but the API did not report the engine.
 * - `failed`: no request succeeded, and not all of them failed with HTTP 400.
 */
export type SemanticRequestOutcome = 'failed' | 'fallback' | 'rejected' | 'served' | 'unreported';

/** Options for {@link checkSearchModes}. */
export interface CheckSearchModesOptions {
  /** SCAPI organization ID (`f_ecom_...`). */
  organizationId: string;
  /** Site (channel) ID to check. */
  siteId: string;
  /**
   * Queries to probe, one to {@link MAX_STATUS_QUERIES} after blank and repeated
   * queries are dropped. Use multi-word queries that shoppers type: a single-word
   * product lookup can fall back to lexical search even when Agentic Commerce
   * Search is on.
   */
  queries: string[];
  locale?: string;
  currency?: string;
  /** Short code to record in the result (informational). */
  shortCode?: string;
}

/** One `productSearch` request sent by {@link checkSearchModes}. */
export interface SearchModeProbe {
  query: string;
  /** The search mode the request asked for. */
  requested: RequestedSearchMode;
  /** HTTP status, or 0 when the request did not complete, for example after a network error. */
  status: number;
  /** Why the request failed. Absent when it succeeded. */
  error?: string;
  latencyMs: number;
  /** Number of products that match the query. */
  total?: number;
  /**
   * The engine the API reports served the request. Absent when the request failed
   * and when the API does not report it, which is not the same as `lexical`.
   */
  effectiveSearchMode?: SearchMode;
}

/** The result of {@link checkSearchModes}. */
export interface SearchModeStatus {
  /** Schema version, shared with search captures. */
  schemaVersion: typeof SEARCH_CAPTURE_SCHEMA_VERSION;
  siteId: string;
  organizationId: string;
  /** Short code the check ran against (informational). */
  shortCode?: string;
  /** When the check started, as an ISO 8601 timestamp. */
  checkedAt: string;
  agenticCommerceSearch: AgenticCommerceSearchState;
  siteDefault: SiteDefaultSearchMode;
  semanticRequests: SemanticRequestOutcome;
  /** Every request, in the order it was sent: for each query, the default, `lexical` and `semantic` request. */
  probes: SearchModeProbe[];
  /** Plain-English notes that explain the result or say what to do next. */
  warnings: string[];
}

/** The search modes {@link checkSearchModes} requests for each query, in this order. */
const REQUESTED_MODES: RequestedSearchMode[] = ['default', 'lexical', 'semantic'];

function isSearchMode(value: unknown): value is SearchMode {
  return value === 'lexical' || value === 'semantic';
}

function isMultiWord(query: string): boolean {
  return /\s/.test(query.trim());
}

function succeeded(probe: SearchModeProbe): boolean {
  return probe.error === undefined;
}

function describeFailure(probe: SearchModeProbe): string {
  const message = probe.error ?? 'unknown error';
  return probe.status === 0 ? message : `HTTP ${probe.status}: ${message}`;
}

function deriveSemanticRequests(probes: SearchModeProbe[]): SemanticRequestOutcome {
  const semantic = probes.filter((probe) => probe.requested === 'semantic');
  const ok = semantic.filter((probe) => succeeded(probe));
  const reported = ok.filter((probe) => probe.effectiveSearchMode !== undefined);

  if (reported.some((probe) => probe.effectiveSearchMode === 'semantic')) return 'served';
  if (reported.length > 0) return 'fallback';
  if (ok.length > 0) return 'unreported';
  if (semantic.length > 0 && semantic.every((probe) => probe.status === 400)) return 'rejected';
  return 'failed';
}

function deriveSiteDefault(probes: SearchModeProbe[]): SiteDefaultSearchMode {
  const ok = probes.filter((probe) => probe.requested === 'default' && succeeded(probe));
  if (ok.length === 0) return 'failed';

  const modes = [...new Set(ok.map((probe) => probe.effectiveSearchMode).filter((mode) => mode !== undefined))];
  if (modes.length === 0) return 'unreported';
  return modes.length === 1 ? modes[0] : 'mixed';
}

function deriveAgenticCommerceSearch(
  probes: SearchModeProbe[],
  semanticRequests: SemanticRequestOutcome,
): AgenticCommerceSearchState {
  if (semanticRequests === 'served') return 'serving';

  if (semanticRequests === 'rejected') {
    // Only a rejection of `semantic` alone says anything about the feature. When requests
    // without it fail too, the cause is more likely the site, locale or currency.
    return probes.some((probe) => probe.requested !== 'semantic' && succeeded(probe)) ? 'not-serving' : 'unknown';
  }

  if (semanticRequests === 'fallback') {
    // Single-word lookups fall back even when the feature is on, so only a multi-word fallback counts.
    return probes.some(
      (probe) => probe.requested === 'semantic' && probe.effectiveSearchMode === 'lexical' && isMultiWord(probe.query),
    )
      ? 'not-serving'
      : 'unknown';
  }

  return 'unknown';
}

function buildWarnings(
  probes: SearchModeProbe[],
  summary: Pick<SearchModeStatus, 'agenticCommerceSearch' | 'semanticRequests' | 'siteDefault'>,
): string[] {
  const {agenticCommerceSearch, semanticRequests, siteDefault} = summary;
  const warnings: string[] = [];
  const semantic = probes.filter((probe) => probe.requested === 'semantic');
  const firstError = semantic.find((probe) => !succeeded(probe));

  if (semanticRequests === 'rejected' && firstError) {
    warnings.push(
      agenticCommerceSearch === 'not-serving'
        ? `The API rejected searchMode=semantic (${describeFailure(firstError)}). Agentic Commerce Search is probably not turned on for this site. Turn it on in Business Manager under ${SEARCH_PREFERENCES_PATH} > Enable Agentic Commerce Search; provisioning takes about two to three days.`
        : `The API rejected searchMode=semantic (${describeFailure(firstError)}), but requests without searchMode failed too, so the cause may be the site ID, locale or currency rather than Agentic Commerce Search.`,
    );
  }

  if (semanticRequests === 'failed' && firstError) {
    warnings.push(
      `None of the searchMode=semantic requests succeeded (${describeFailure(firstError)}), so Agentic Commerce Search cannot be checked.`,
    );
  }

  if (semanticRequests === 'fallback' && agenticCommerceSearch === 'not-serving') {
    const fellBack = semantic
      .filter((probe) => probe.effectiveSearchMode === 'lexical' && isMultiWord(probe.query))
      .map((probe) => `"${probe.query}"`);
    warnings.push(
      `Semantic requests for multi-word queries fell back to lexical search (${fellBack.join(', ')}). Agentic Commerce Search is off for the site, or its semantic index is not ready yet; provisioning takes about two to three days after it is turned on.`,
    );
  }

  if (semanticRequests === 'served') {
    const fellBack = semantic
      .filter((probe) => probe.effectiveSearchMode === 'lexical' && isMultiWord(probe.query))
      .map((probe) => `"${probe.query}"`);
    if (fellBack.length > 0) {
      warnings.push(
        `Some semantic requests for multi-word queries fell back to lexical search (${fellBack.join(', ')}), so semantic search does not serve every query. Capture these queries with both engines and compare the results before you rely on semantic search for them.`,
      );
    }
  }

  if (semanticRequests === 'served' && siteDefault === 'lexical') {
    warnings.push(
      `Requests for searchMode=semantic are served by semantic search, but requests without a searchMode are served by lexical search, so shoppers probably still get lexical search unless the storefront sets the search mode itself, for example for an A/B test. Check Enable Agentic Commerce Search in Business Manager under ${SEARCH_PREFERENCES_PATH}.`,
    );
  }

  if (semanticRequests === 'unreported' || siteDefault === 'unreported') {
    warnings.push(
      `The API did not report effectiveSearchMode, so the search engine that served the requests cannot be determined. Confirm the setting in Business Manager under ${SEARCH_PREFERENCES_PATH}.`,
    );
  }

  if (semanticRequests !== 'served' && probes.every((probe) => !isMultiWord(probe.query))) {
    warnings.push(
      'Every query is a single word. Single-word product lookups can fall back to lexical search even when Agentic Commerce Search is on; add a multi-word query, such as one shoppers type, for a reliable answer.',
    );
  }

  return warnings;
}

async function probeSearchMode(
  client: ShopperSearchClient,
  options: CheckSearchModesOptions,
  query: string,
  requested: RequestedSearchMode,
): Promise<SearchModeProbe> {
  const started = performance.now();
  try {
    const {data, error, response} = await client.GET('/organizations/{organizationId}/product-search', {
      params: {
        path: {organizationId: options.organizationId},
        query: {
          siteId: options.siteId,
          q: query,
          limit: 1,
          ...(requested !== 'default' && {searchMode: requested}),
          ...(options.locale && {locale: options.locale}),
          ...(options.currency && {currency: options.currency}),
        },
      },
    });
    const latencyMs = Math.round(performance.now() - started);
    if (error || !data) {
      return {query, requested, status: response.status, error: getApiErrorMessage(error, response), latencyMs};
    }
    return withoutUndefined({
      query,
      requested,
      status: response.status,
      latencyMs,
      total: data.total,
      effectiveSearchMode: isSearchMode(data.effectiveSearchMode) ? data.effectiveSearchMode : undefined,
    });
  } catch (error) {
    return {
      query,
      requested,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
      latencyMs: Math.round(performance.now() - started),
    };
  }
}

/**
 * Checks whether Agentic Commerce Search is serving a site, by asking Shopper Search
 * `productSearch` for the same queries three ways: without a `searchMode` (what
 * shoppers get), with `searchMode=lexical` and with `searchMode=semantic`. Each
 * request asks for one hit, and the response says which engine served it.
 *
 * Requests run one at a time. A failed request is recorded in {@link SearchModeStatus.probes}
 * with its status and error instead of stopping the check.
 *
 * ## How the result is derived
 *
 * `semanticRequests` summarizes the requests with `searchMode=semantic`:
 *
 * - `served`: at least one succeeded and the API reported `semantic` as the engine.
 * - `fallback`: otherwise, at least one succeeded and the API reported `lexical`.
 * - `unreported`: otherwise, at least one succeeded but the API reported no engine.
 * - `rejected`: none succeeded and every one failed with HTTP 400.
 * - `failed`: none succeeded, for any other reason.
 *
 * `siteDefault` summarizes the requests without a `searchMode` that succeeded:
 * the engine the API reported when all agree, `mixed` when they differ,
 * `unreported` when the API reported no engine, and `failed` when none succeeded.
 *
 * `agenticCommerceSearch` is the verdict:
 *
 * - `serving` when `semanticRequests` is `served`.
 * - `not-serving` when `semanticRequests` is `rejected` and a request without
 *   `searchMode=semantic` succeeded, or when it is `fallback` and at least one
 *   multi-word query fell back to lexical search. Single-word lookups can fall
 *   back even when the feature is on, so they do not count.
 * - `unknown` in every other case, including a rejection when every other request
 *   failed too, which points at the site, locale or currency instead.
 *
 * The API reports the serving engine as `effectiveSearchMode` only on API versions
 * that include it. A response without it counts as not reported, never as `lexical`.
 *
 * {@link SearchModeStatus.warnings} says why a result is not conclusive: only
 * single-word queries, an engine the API did not report, a rejected `semantic`
 * request (with the API's message), failed requests, multi-word queries that
 * fell back (the feature is off, or its semantic index is not ready, which takes
 * about two to three days after it is turned on), multi-word queries that fell back
 * while others were served by semantic search, and semantic requests that are
 * served while requests without a `searchMode` are still served by lexical search.
 *
 * @param client - Shopper Search client with a valid shopper token
 * @param options - Site, queries and request settings
 * @returns The verdict, the engines behind it and every request that produced it
 * @throws Error when there are no queries, or more than {@link MAX_STATUS_QUERIES}, after blank and repeated ones are dropped
 *
 * @example
 * ```typescript
 * const status = await checkSearchModes(client, {
 *   organizationId: 'f_ecom_zzxy_prd',
 *   siteId: 'RefArch',
 *   queries: ['red dress', 'leather ankle boots'],
 * });
 * console.log(status.agenticCommerceSearch); // 'serving', 'not-serving' or 'unknown'
 * console.log(status.siteDefault); // the engine shoppers get: 'semantic', 'lexical', ...
 * ```
 */
export async function checkSearchModes(
  client: ShopperSearchClient,
  options: CheckSearchModesOptions,
): Promise<SearchModeStatus> {
  const logger = getLogger();
  const queries = normalizeQueries(options.queries);
  if (queries.length === 0) {
    throw new Error('At least one query is required');
  }
  if (queries.length > MAX_STATUS_QUERIES) {
    throw new Error(`At most ${MAX_STATUS_QUERIES} queries are allowed (got ${queries.length})`);
  }

  const checkedAt = new Date().toISOString();
  const probes: SearchModeProbe[] = [];
  for (const query of queries) {
    for (const requested of REQUESTED_MODES) {
      const probe = await probeSearchMode(client, options, query, requested);
      logger.debug(
        {query, requested, status: probe.status, total: probe.total, effectiveSearchMode: probe.effectiveSearchMode},
        `[SEARCH] Probed "${query}" (${requested})`,
      );
      probes.push(probe);
    }
  }

  const semanticRequests = deriveSemanticRequests(probes);
  const siteDefault = deriveSiteDefault(probes);
  const agenticCommerceSearch = deriveAgenticCommerceSearch(probes, semanticRequests);

  return withoutUndefined({
    schemaVersion: SEARCH_CAPTURE_SCHEMA_VERSION,
    siteId: options.siteId,
    organizationId: options.organizationId,
    shortCode: options.shortCode,
    checkedAt,
    agenticCommerceSearch,
    siteDefault,
    semanticRequests,
    probes,
    warnings: buildWarnings(probes, {agenticCommerceSearch, semanticRequests, siteDefault}),
  });
}
