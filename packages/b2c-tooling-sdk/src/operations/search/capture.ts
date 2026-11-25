/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {ProductSearchResult, SearchMode, ShopperSearchClient} from '../../clients/shopper-search.js';
import {getApiErrorMessage} from '../../clients/error-utils.js';
import {getLogger} from '../../logging/logger.js';
import {
  SEARCH_CAPTURE_SCHEMA_VERSION,
  type CapturedRefinement,
  type SearchCapture,
  type SearchCaptureEntry,
} from './types.js';

/** Default number of hits requested per query (the API's own default). */
export const DEFAULT_CAPTURE_LIMIT = 25;

/** Largest number of hits the API returns per request. */
export const MAX_CAPTURE_LIMIT = 200;

/** Most refinements the API accepts in one request. */
export const MAX_REFINEMENTS = 9;

/** Options for {@link captureProductSearch}. */
export interface CaptureProductSearchOptions {
  /** SCAPI organization ID (`f_ecom_...`). */
  organizationId: string;
  /** Site (channel) ID to search. */
  siteId: string;
  /** Queries to run, in order. Blank and repeated queries are skipped. */
  queries: string[];
  /** Hits to request per query, 1 to 200. Defaults to 25. */
  limit?: number;
  /** Search mode to request. Omit to use the platform default. */
  searchMode?: SearchMode;
  locale?: string;
  currency?: string;
  /** ID of the sorting option to request. Omit to use the default sort. */
  sort?: string;
  /**
   * Refinements to apply to every query, as `attribute=value`, for example
   * `brand=Acme`, `c_color=red|blue` or `price=(0..50)`. At most 9.
   */
  refine?: string[];
  /** Label stored in the capture. Defaults to the search mode, or `capture`. */
  label?: string;
  /** Short code to record in the capture (informational). */
  shortCode?: string;
  /** Called after each query completes. */
  onResult?: (entry: SearchCaptureEntry, index: number, count: number) => void;
}

/**
 * Normalizes a query list: trims each query and drops blank and repeated ones,
 * keeping first-seen order.
 */
export function normalizeQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of queries) {
    const query = raw.trim();
    if (!query || seen.has(query)) continue;
    seen.add(query);
    result.push(query);
  }
  return result;
}

/**
 * Parses a query file: one query per line. Blank lines and lines starting
 * with `#` are ignored.
 */
export function parseQueryFile(content: string): string[] {
  return normalizeQueries(content.split(/\r?\n/).filter((line) => !line.trim().startsWith('#')));
}

/**
 * Drops keys whose value is `undefined`, so a capture equals its own JSON round trip.
 * @internal
 */
export function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

function toRefinements(result: ProductSearchResult): CapturedRefinement[] {
  return (result.refinements ?? []).map((refinement) =>
    withoutUndefined({
      attributeId: refinement.attributeId,
      label: refinement.label,
      values: (refinement.values ?? []).map((value) =>
        withoutUndefined({value: value.value, label: value.label, hitCount: value.hitCount}),
      ),
    }),
  );
}

/**
 * Checks refinements for {@link captureProductSearch}: each must be
 * `attribute=value`, and the API accepts at most {@link MAX_REFINEMENTS}.
 * The capture runs the same check before it sends any request.
 *
 * @param refine - Refinements, for example `brand=Acme` or `price=(0..50)`
 * @throws Error naming the first refinement that is not valid
 */
export function checkRefinements(refine: string[]): void {
  if (refine.length > MAX_REFINEMENTS) {
    throw new Error(`At most ${MAX_REFINEMENTS} refinements are allowed per request (got ${refine.length})`);
  }
  for (const refinement of refine) {
    const separator = refinement.indexOf('=');
    if (separator <= 0 || separator === refinement.length - 1) {
      throw new Error(
        `Invalid refinement "${refinement}": use attribute=value, for example brand=Acme or price=(0..50)`,
      );
    }
  }
}

function toSortingOptionLabels(result: ProductSearchResult): Record<string, string> | undefined {
  const labels = Object.fromEntries(
    (result.sortingOptions ?? [])
      .filter((option) => option.id && option.label)
      .map((option) => [option.id, option.label]),
  );
  return Object.keys(labels).length > 0 ? labels : undefined;
}

function toEntry(query: string, status: number, latencyMs: number, result: ProductSearchResult): SearchCaptureEntry {
  const suggestedPhrases = (result.searchPhraseSuggestions?.suggestedPhrases ?? [])
    .map((suggestion) => suggestion.phrase)
    .filter((phrase): phrase is string => Boolean(phrase));
  const selectedRefinements = result.selectedRefinements;

  return withoutUndefined({
    query,
    status,
    latencyMs,
    total: result.total,
    searchMode: result.searchMode,
    effectiveSearchMode: result.effectiveSearchMode,
    hits: (result.hits ?? []).map((hit) =>
      withoutUndefined({
        productId: hit.productId,
        productName: hit.productName,
        hitType: hit.hitType,
        representedProductId: hit.representedProduct?.id,
        price: hit.price,
      }),
    ),
    refinements: toRefinements(result),
    ...(selectedRefinements && Object.keys(selectedRefinements).length > 0 && {selectedRefinements}),
    sortingOptions: result.sortingOptions?.map((option) => option.id),
    sortingOptionLabels: toSortingOptionLabels(result),
    selectedSortingOption: result.selectedSortingOption,
    ...(suggestedPhrases.length > 0 && {suggestedPhrases}),
  });
}

/**
 * Runs each query through Shopper Search `productSearch` and captures the ranked
 * hits with their prices, totals, refinements with their hit counts, sorting
 * options and the search mode that served the request. A sort and refinements,
 * when given, apply to every query.
 *
 * Queries run one at a time. A failed query is recorded with its status and
 * error instead of stopping the capture, so a capture always covers every query.
 *
 * @param client - Shopper Search client with a valid shopper token
 * @param options - Site, queries and request settings
 * @returns The capture, ready to save as JSON and compare with {@link diffSearchCaptures}
 *
 * @example
 * ```typescript
 * const capture = await captureProductSearch(client, {
 *   organizationId: 'f_ecom_zzxy_prd',
 *   siteId: 'RefArch',
 *   queries: ['shirt', 'red dress'],
 *   searchMode: 'lexical',
 * });
 * ```
 */
export async function captureProductSearch(
  client: ShopperSearchClient,
  options: CaptureProductSearchOptions,
): Promise<SearchCapture> {
  const logger = getLogger();
  const limit = options.limit ?? DEFAULT_CAPTURE_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_CAPTURE_LIMIT) {
    throw new Error(`limit must be an integer from 1 to ${MAX_CAPTURE_LIMIT}`);
  }

  const queries = normalizeQueries(options.queries);
  if (queries.length === 0) {
    throw new Error('At least one query is required');
  }

  const refine = options.refine ?? [];
  checkRefinements(refine);

  const capture: SearchCapture = {
    schemaVersion: SEARCH_CAPTURE_SCHEMA_VERSION,
    label: options.label ?? options.searchMode ?? 'capture',
    capturedAt: new Date().toISOString(),
    request: {
      source: 'scapi',
      ...(options.shortCode && {shortCode: options.shortCode}),
      organizationId: options.organizationId,
      siteId: options.siteId,
      limit,
      ...(options.searchMode && {searchMode: options.searchMode}),
      ...(options.locale && {locale: options.locale}),
      ...(options.currency && {currency: options.currency}),
      ...(options.sort && {sort: options.sort}),
      ...(refine.length > 0 && {refine}),
    },
    results: [],
  };

  for (const [index, query] of queries.entries()) {
    const started = performance.now();
    let entry: SearchCaptureEntry;
    try {
      const {data, error, response} = await client.GET('/organizations/{organizationId}/product-search', {
        params: {
          path: {organizationId: options.organizationId},
          query: {
            siteId: options.siteId,
            q: query,
            limit,
            ...(options.searchMode && {searchMode: options.searchMode}),
            ...(options.locale && {locale: options.locale}),
            ...(options.currency && {currency: options.currency}),
            ...(options.sort && {sort: options.sort}),
            ...(refine.length > 0 && {refine}),
          },
        },
      });
      const latencyMs = Math.round(performance.now() - started);
      entry =
        error || !data
          ? {
              query,
              status: response.status,
              error: getApiErrorMessage(error, response),
              latencyMs,
              hits: [],
              refinements: [],
            }
          : toEntry(query, response.status, latencyMs, data);
    } catch (error) {
      entry = {
        query,
        status: 0,
        error: error instanceof Error ? error.message : String(error),
        latencyMs: Math.round(performance.now() - started),
        hits: [],
        refinements: [],
      };
    }

    logger.debug(
      {query, status: entry.status, total: entry.total, effectiveSearchMode: entry.effectiveSearchMode},
      `[SEARCH] Captured "${query}"`,
    );
    capture.results.push(entry);
    options.onResult?.(entry, index, queries.length);
  }

  return capture;
}
