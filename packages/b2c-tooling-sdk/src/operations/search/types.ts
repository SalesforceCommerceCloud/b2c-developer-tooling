/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {SearchMode} from '../../clients/shopper-search.js';

export type {SearchMode};

/** Version of the capture and diff JSON formats. Bumped on breaking changes. */
export const SEARCH_CAPTURE_SCHEMA_VERSION = 1;

/** Where a capture's results come from. */
export type SearchCaptureSource = 'scapi' | 'storefront';

/** The request settings shared by every query in a Shopper Search (SCAPI) capture. */
export interface ScapiSearchCaptureRequest {
  /** `scapi`. Captures that predate storefront support omit it. */
  source?: 'scapi';
  /** SCAPI short code the capture was taken from (informational). */
  shortCode?: string;
  /** SCAPI organization ID (`f_ecom_...`). */
  organizationId: string;
  /** Site (channel) ID. */
  siteId: string;
  /** Number of hits requested per query. */
  limit: number;
  /** The `searchMode` sent with each request. Omitted when the platform default applied. */
  searchMode?: SearchMode;
  /** Locale sent with each request. */
  locale?: string;
  /** Currency sent with each request. */
  currency?: string;
  /** ID of the sorting option sent with each request. Omitted when the default sort applied. */
  sort?: string;
  /** Refinements sent with each request, as `attribute=value`. Omitted when there were none. */
  refine?: string[];
}

/** The request settings shared by every query in a storefront search page capture. */
export interface StorefrontSearchCaptureRequest {
  source: 'storefront';
  /** Storefront hostname. */
  host: string;
  /** Site ID. */
  siteId: string;
  /** Locale segment of the default search page path. Omitted when a custom path was requested. */
  locale?: string;
  /** Path of the search page that was requested. */
  path: string;
  /** Page size requested with the `sz` parameter. */
  limit: number;
  /** Extra query parameters sent with every request. */
  params?: Record<string, string>;
  /** True when a unique parameter was added so the page cache could not answer. */
  bypassPageCache?: boolean;
}

/** The request settings shared by every query in a capture. */
export type SearchCaptureRequest = ScapiSearchCaptureRequest | StorefrontSearchCaptureRequest;

/** One product hit, reduced to the fields used for comparison. */
export interface CapturedHit {
  productId: string;
  productName?: string;
  hitType?: string;
  /** ID of the represented product (for example the variant a master hit stands for). */
  representedProductId?: string;
  /** Sales price. For masters and sets, the lowest price of their products. */
  price?: number;
}

/** One refinement value, reduced to the fields used for comparison. */
export interface CapturedRefinementValue {
  value: string;
  label?: string;
  hitCount?: number;
}

/** One refinement (facet) returned for a query. */
export interface CapturedRefinement {
  attributeId: string;
  label?: string;
  values: CapturedRefinementValue[];
}

/** The captured result of one query. */
export interface SearchCaptureEntry {
  query: string;
  /** HTTP status of the search request, or 0 when the request did not complete. */
  status: number;
  /** Error message when the request failed. */
  error?: string;
  /** Round-trip time of the search request in milliseconds. */
  latencyMs: number;
  /** Total number of matching products reported by the API or the page. */
  total?: number;
  /** The `searchMode` the API echoed back, if any. */
  searchMode?: SearchMode;
  /** The search mode that actually served the request, if the API reported it. */
  effectiveSearchMode?: SearchMode;
  /** Ranked hits, in API order. */
  hits: CapturedHit[];
  /** Refinements (facets) returned for the query. */
  refinements: CapturedRefinement[];
  /** Refinements the API reports as applied, by attribute ID. */
  selectedRefinements?: Record<string, string>;
  /** IDs of the sorting options offered. */
  sortingOptions?: string[];
  /** ID of the sorting option applied. */
  selectedSortingOption?: string;
  /** Phrases suggested for the query (for example spelling corrections). */
  suggestedPhrases?: string[];
  /** Storefront captures: URL of the page requested. */
  url?: string;
  /** Storefront captures: URL of the page finally served, when the request was redirected. */
  redirectedTo?: string;
  /** Storefront captures: parts of the page that could not be read, for tuning the page profile. */
  parseWarnings?: string[];
}

/** A set of product search results captured from one site at one point in time. */
export interface SearchCapture {
  schemaVersion: typeof SEARCH_CAPTURE_SCHEMA_VERSION;
  /** Free-form label, such as `before`, `after`, `lexical` or `semantic`. */
  label: string;
  /** When the capture started (ISO 8601). */
  capturedAt: string;
  request: SearchCaptureRequest;
  results: SearchCaptureEntry[];
}

/** How two sets of product IDs relate to each other. */
export type Containment =
  | 'baseline_empty'
  | 'baseline_subset_of_candidate'
  | 'both_empty'
  | 'candidate_empty'
  | 'candidate_subset_of_baseline'
  | 'disjoint'
  | 'equal'
  | 'neither_subset';

/** Set agreement between two ranked lists at each depth. */
export interface OverlapComparison {
  /**
   * The largest depth both lists reach (`min(baseline, candidate)`). Overlap is only
   * computed up to this depth, so a shorter list cannot look like a divergence.
   */
  effectiveMaxK: number;
  /** `|baseline[:k] ∩ candidate[:k]| / k` for each computed depth, keyed by `k`. */
  atK: Record<string, number>;
  /** Depths that were requested but are deeper than `effectiveMaxK`. */
  skippedK?: number[];
}

/** Which products differ between two ranked lists. */
export interface MembershipComparison {
  intersectionSize: number;
  baselineOnlyCount: number;
  candidateOnlyCount: number;
  containment: Containment;
  /** Product IDs only the baseline returned, in baseline rank order. */
  baselineOnlyIds: string[];
  /** Product IDs only the candidate returned, in candidate rank order. */
  candidateOnlyIds: string[];
  /** True when the ID lists were truncated by `maxIds`. */
  truncated?: boolean;
}

/** A product whose rank differs between the two lists. */
export interface RankMove {
  productId: string;
  baselineRank: number;
  candidateRank: number;
  /** `candidateRank - baselineRank`; negative means the product moved up. */
  delta: number;
}

/** How the ranking of shared products differs. */
export interface OrderComparison {
  top1Agree: boolean;
  /** 1-based rank of the baseline's top hit in the candidate, or null if absent. */
  baselineTop1RankInCandidate: null | number;
  /** 1-based rank of the candidate's top hit in the baseline, or null if absent. */
  candidateTop1RankInBaseline: null | number;
  /** 1-based rank of the first position where the lists differ, or null if identical up to the shorter length. */
  firstDivergenceRank: null | number;
  longestCommonPrefix: number;
  /** Rank displacement, computed over the shared products only. */
  displacement: {
    /** Number of shared products compared. */
    compared: number;
    meanAbs: number;
    maxAbs: number;
    /** The shared products that moved the most. */
    topMovers: RankMove[];
  };
}

/** Comparison of two ranked product ID lists. */
export interface RankedListComparison {
  overlap: OverlapComparison;
  membership: MembershipComparison;
  order: OrderComparison;
}

/** A refinement value both sides returned, with a different hit count on each side. */
export interface RefinementCountChange {
  value: string;
  baselineHitCount: number;
  candidateHitCount: number;
}

/** A refinement present on both sides whose values or value hit counts differ. */
export interface RefinementChange {
  attributeId: string;
  baselineValueCount: number;
  candidateValueCount: number;
  baselineOnlyValues: string[];
  candidateOnlyValues: string[];
  /** Values on both sides whose hit counts differ. A value without a hit count on either side is not compared. */
  countChanges: RefinementCountChange[];
}

/** Comparison of the refinements (facets) returned for a query. */
export interface RefinementComparison {
  /** Refinement attribute IDs only the baseline returned. */
  baselineOnly: string[];
  /** Refinement attribute IDs only the candidate returned. */
  candidateOnly: string[];
  /** Refinements on both sides whose values or value hit counts differ. */
  changed: RefinementChange[];
}

/** Comparison of the sorting options offered for a query. */
export interface SortingComparison {
  /** Sorting option IDs only the baseline offered. */
  baselineOnly: string[];
  /** Sorting option IDs only the candidate offered. */
  candidateOnly: string[];
  /** Sorting option the baseline reported as applied. */
  baselineSelected?: string;
  /** Sorting option the candidate reported as applied. */
  candidateSelected?: string;
}

/**
 * Order of the hit prices from the first hit to the last, over the hits that have a
 * price: `ascending` or `descending` when the prices only rise or only fall (equal
 * neighbors allowed), `equal` when they are all the same, and `unordered` when they
 * both rise and fall.
 */
export type PriceOrder = 'ascending' | 'descending' | 'equal' | 'unordered';

/** One side of a query comparison. */
export interface SearchDiffSide {
  status: number;
  error?: string;
  total?: number;
  hitCount: number;
  effectiveSearchMode?: SearchMode;
  /** True when a search mode was requested and the API served a different one. */
  modeFallback?: boolean;
  /** Order of the hit prices. Omitted when fewer than two hits have a price. */
  priceOrder?: PriceOrder;
  /** Storefront captures: URL of the page finally served, when the search was redirected. */
  redirectedTo?: string;
}

/** The comparison of one query. */
export interface SearchDiffEntry {
  query: string;
  baseline: SearchDiffSide;
  candidate: SearchDiffSide;
  /** Omitted when either side failed. */
  results?: RankedListComparison;
  /** Omitted when either side failed. */
  refinements?: RefinementComparison;
  /** Omitted when either side failed. */
  sorting?: SortingComparison;
  /** Why metrics were omitted, when they were. */
  note?: string;
}

/** Per-side counts in the diff summary. */
export interface SearchDiffSideSummary {
  label: string;
  /** Queries whose request failed. */
  failed: number;
  /** Queries that returned no hits. */
  zeroResults: number;
  /** Queries that returned at least one hit. */
  queriesWithHits: number;
  /**
   * Number of distinct ranked hit lists across queries with hits. Far fewer distinct
   * lists than queries means many queries returned exactly the same results.
   */
  distinctResultSets: number;
  /** The most queries that share one identical ranked hit list. */
  largestSharedResultSet: number;
  /** Count of queries by the search mode that served them (`unreported` when the API did not say). */
  effectiveSearchModes: Record<string, number>;
  /** Queries where the requested search mode was not the one served. */
  modeFallbacks: number;
  /** Sorting option IDs offered for any query, in first-seen order. */
  sortingOptions: string[];
  /** Count of queries by the sorting option the response reported as applied (`unreported` when it did not say). */
  selectedSortingOptions: Record<string, number>;
  /** Count of queries by the order of their hit prices, over the queries where at least two hits have a price. */
  priceOrders: Record<string, number>;
}

/** How one refinement attribute compares across the compared queries. */
export interface RefinementAttributeSummary {
  attributeId: string;
  /** Compared queries where both sides returned the refinement. */
  both: number;
  /** Compared queries where only the baseline returned it. */
  baselineOnly: number;
  /** Compared queries where only the candidate returned it. */
  candidateOnly: number;
  /** Queries where both sides returned it with different values. */
  valuesDiffer: number;
  /** Queries where both sides returned it and a value both returned has a different hit count on each side. */
  countsDiffer: number;
}

/** Totals across all compared queries. */
export interface SearchDiffSummary {
  /** Queries present in both captures. */
  queries: number;
  /** Queries where both sides succeeded and metrics were computed. */
  compared: number;
  /** Mean overlap at each depth, over the compared queries where that depth could be computed. */
  meanOverlapAtK: Record<string, number>;
  /** Compared queries whose top hit is the same on both sides. */
  top1Agreements: number;
  /** Compared queries where a refinement, or the values of a refinement, differ. Hit counts are counted separately. */
  refinementDifferences: number;
  /** Compared queries where a refinement value both sides returned has a different hit count on each side. */
  refinementCountDifferences: number;
  /** Compared queries whose sorting options, or the sorting option reported as applied, differ. */
  sortingDifferences: number;
  /** Each refinement attribute returned for a compared query, in first-seen order. */
  refinementAttributes: RefinementAttributeSummary[];
  baseline: SearchDiffSideSummary;
  candidate: SearchDiffSideSummary;
}

/** The comparison of two captures. Carries no pass or fail verdict. */
export interface SearchDiff {
  schemaVersion: typeof SEARCH_CAPTURE_SCHEMA_VERSION;
  baseline: Pick<SearchCapture, 'capturedAt' | 'label' | 'request'>;
  candidate: Pick<SearchCapture, 'capturedAt' | 'label' | 'request'>;
  kValues: number[];
  summary: SearchDiffSummary;
  queries: SearchDiffEntry[];
  /** Queries present in only one capture. */
  unmatchedQueries: {baselineOnly: string[]; candidateOnly: string[]};
  /** Differences in how the captures were taken that can affect the comparison. */
  warnings: string[];
}
