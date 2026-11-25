/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Product search capture and comparison.
 *
 * Captures the product search results for a list of queries, from the Shopper
 * Search API or from the storefront's search page, and compares two captures:
 * for example before and after a search configuration change, the `lexical` and
 * `semantic` search modes of a site with Agentic Commerce Search turned on, or
 * what shoppers see on the storefront against what the API returns.
 *
 * - {@link captureProductSearch} runs the queries against Shopper Search and
 *   records ranked hits, totals, refinements and the search mode that served
 *   each request.
 * - {@link captureStorefrontSearch} requests the storefront search page for each
 *   query and reads the same fields from the page HTML. The selectors default to
 *   the Storefront Reference Architecture (SFRA) and can be overridden for
 *   customized templates.
 * - {@link diffSearchCaptures} compares two captures query by query: overlap at
 *   each depth, which products differ, rank changes, refinement and hit count
 *   changes, sorting options, the order of hit prices and search-mode fallbacks.
 *   It reports differences without a pass or fail verdict.
 * - {@link analyzeSearchSources} analyzes up to four captures at once, the storefront
 *   and the Shopper Search API each under lexical and semantic search. It compares them
 *   in pairs, judges which engine each storefront capture looks like, and lists
 *   findings: what differs, how many queries it affects and what is likely behind it.
 * - {@link checkSearchModes} asks whether Agentic Commerce Search is serving a
 *   site: it sends each of a few queries without a search mode, as `lexical` and
 *   as `semantic`, and reports the engine that served each request, the site's
 *   default engine and a verdict of `serving`, `not-serving` or `unknown`.
 *
 * ## Usage
 *
 * ```typescript
 * import {createShopperSearchClient, toOrganizationId} from '@salesforce/b2c-tooling-sdk';
 * import {getGuestToken} from '@salesforce/b2c-tooling-sdk/slas';
 * import {captureProductSearch, diffSearchCaptures} from '@salesforce/b2c-tooling-sdk/operations/search';
 *
 * const organizationId = toOrganizationId(tenantId);
 * const token = await getGuestToken({shortCode, organizationId, slasClientId, siteId, redirectUri});
 * const client = createShopperSearchClient({shortCode, getAccessToken: () => token.access_token});
 *
 * const queries = ['shirt', 'red dress'];
 * const lexical = await captureProductSearch(client, {organizationId, siteId, queries, searchMode: 'lexical'});
 * const semantic = await captureProductSearch(client, {organizationId, siteId, queries, searchMode: 'semantic'});
 * const diff = diffSearchCaptures(lexical, semantic);
 * console.log(diff.summary.meanOverlapAtK);
 * ```
 *
 * Capturing the storefront search page instead:
 *
 * ```typescript
 * import {captureStorefrontSearch} from '@salesforce/b2c-tooling-sdk/operations/search';
 *
 * const storefront = await captureStorefrontSearch({
 *   host: 'www.example.com',
 *   siteId: 'RefArch',
 *   queries,
 *   password: process.env.SFCC_STOREFRONT_PASSWORD,
 * });
 * const diff = diffSearchCaptures(storefront, semantic);
 * ```
 *
 * ## Authentication
 *
 * Shopper Search uses a SLAS shopper access token. A guest token from a public
 * or private SLAS client that has the `sfcc.shopper-product-search` scope and the
 * site as a channel is enough.
 *
 * The storefront capture needs no API client. When the storefront is password
 * protected, pass the storefront password; the user name defaults to `storefront`.
 *
 * @module operations/search
 */
export {
  captureProductSearch,
  checkRefinements,
  normalizeQueries,
  parseQueryFile,
  DEFAULT_CAPTURE_LIMIT,
  MAX_CAPTURE_LIMIT,
  MAX_REFINEMENTS,
} from './capture.js';
export type {CaptureProductSearchOptions} from './capture.js';
export {checkSearchModes, MAX_STATUS_QUERIES} from './status.js';
export type {
  AgenticCommerceSearchState,
  CheckSearchModesOptions,
  RequestedSearchMode,
  SearchModeProbe,
  SearchModeStatus,
  SemanticRequestOutcome,
  SiteDefaultSearchMode,
} from './status.js';
export {diffSearchCaptures, compareRankedLists, compareRefinements, priceOrderOf, DEFAULT_K_VALUES} from './diff.js';
export type {DiffSearchCapturesOptions} from './diff.js';
export {
  analyzeSearchSources,
  DEFAULT_ANALYSIS_MAX_EXAMPLES,
  DEFAULT_ANALYSIS_MAX_QUERIES,
  DEFAULT_SEARCH_ANALYSIS_THRESHOLDS,
  SEARCH_FINDING_CODES,
  SEARCH_SOURCE_PAIR_IDS,
  SEARCH_SOURCE_ROLES,
} from './analyze.js';
export type {
  AnalyzeSearchSourcesOptions,
  SearchAnalysisThresholds,
  SearchEngineAttribution,
  SearchFinding,
  SearchFindingSeverity,
  SearchSourceAnalysis,
  SearchSourcePair,
  SearchSourcePairId,
  SearchSourceRole,
  SearchSources,
  SearchSourceSummary,
} from './analyze.js';
export {
  buildStorefrontSearchUrl,
  captureStorefrontSearch,
  parseStorefrontSearchPage,
  resolvePageProfile,
  storefrontSearchPath,
  DEFAULT_STOREFRONT_LOCALE,
  DEFAULT_STOREFRONT_TIMEOUT_MS,
  DEFAULT_STOREFRONT_USER,
  SFRA_PAGE_PROFILE,
} from './storefront.js';
export type {
  CaptureStorefrontSearchOptions,
  ParseStorefrontSearchPageOptions,
  StorefrontPageProfile,
  StorefrontPageResponse,
  StorefrontSearchPage,
  StorefrontSearchUrlOptions,
} from './storefront.js';
export {SEARCH_CAPTURE_SCHEMA_VERSION} from './types.js';
export type {
  CapturedHit,
  CapturedRefinement,
  CapturedRefinementValue,
  Containment,
  MembershipComparison,
  OrderComparison,
  OverlapComparison,
  PriceOrder,
  RankedListComparison,
  RankMove,
  RefinementAttributeSummary,
  RefinementChange,
  RefinementComparison,
  RefinementCountChange,
  ScapiSearchCaptureRequest,
  SearchCapture,
  SearchCaptureEntry,
  SearchCaptureRequest,
  SearchCaptureSource,
  SearchDiff,
  SearchDiffEntry,
  SearchDiffSide,
  SearchDiffSideSummary,
  SearchDiffSummary,
  SearchMode,
  SortingComparison,
  StorefrontSearchCaptureRequest,
} from './types.js';
