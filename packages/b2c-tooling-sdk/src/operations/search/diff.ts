/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  SEARCH_CAPTURE_SCHEMA_VERSION,
  type CapturedHit,
  type CapturedRefinement,
  type Containment,
  type MembershipComparison,
  type OrderComparison,
  type OverlapComparison,
  type PriceOrder,
  type RankedListComparison,
  type RankMove,
  type RefinementAttributeSummary,
  type RefinementChange,
  type RefinementComparison,
  type RefinementCountChange,
  type SearchCapture,
  type SearchCaptureEntry,
  type SearchCaptureRequest,
  type SearchCaptureSource,
  type SearchDiff,
  type SearchDiffEntry,
  type SearchDiffSide,
  type SearchDiffSideSummary,
  type SearchMode,
  type SortingComparison,
} from './types.js';

/** Default depths at which overlap is reported. */
export const DEFAULT_K_VALUES = [1, 3, 5, 10];

/** Number of largest rank moves listed per query. */
const TOP_MOVERS = 5;

/** Options for {@link diffSearchCaptures} and {@link compareRankedLists}. */
export interface DiffSearchCapturesOptions {
  /** Depths at which to report overlap. Defaults to 1, 3, 5 and 10. */
  kValues?: number[];
  /** Longest list of baseline-only or candidate-only IDs to keep per query. Defaults to all. */
  maxIds?: number;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function compareOverlap(baseline: string[], candidate: string[], kValues: number[]): OverlapComparison {
  const effectiveMaxK = Math.min(baseline.length, candidate.length);
  const depths = new Set(kValues.filter((k) => k <= effectiveMaxK));
  // Always report agreement at the full comparable depth.
  if (effectiveMaxK > 0) depths.add(effectiveMaxK);

  const atK: Record<string, number> = {};
  for (const k of [...depths].sort((a, b) => a - b)) {
    const top = new Set(baseline.slice(0, k));
    const shared = [...new Set(candidate.slice(0, k))].filter((id) => top.has(id)).length;
    atK[String(k)] = round(shared / k, 4);
  }

  const skippedK = kValues.filter((k) => k > effectiveMaxK);
  return {effectiveMaxK, atK, ...(skippedK.length > 0 && {skippedK})};
}

function containmentOf(baseline: Set<string>, candidate: Set<string>, shared: number): Containment {
  if (baseline.size === 0 && candidate.size === 0) return 'both_empty';
  if (baseline.size === 0) return 'baseline_empty';
  if (candidate.size === 0) return 'candidate_empty';
  if (shared === baseline.size && shared === candidate.size) return 'equal';
  if (shared === 0) return 'disjoint';
  if (shared === baseline.size) return 'baseline_subset_of_candidate';
  if (shared === candidate.size) return 'candidate_subset_of_baseline';
  return 'neither_subset';
}

function compareMembership(baseline: string[], candidate: string[], maxIds?: number): MembershipComparison {
  const baselineSet = new Set(baseline);
  const candidateSet = new Set(candidate);
  const baselineOnly = baseline.filter((id) => !candidateSet.has(id));
  const candidateOnly = candidate.filter((id) => !baselineSet.has(id));
  const shared = [...baselineSet].filter((id) => candidateSet.has(id)).length;
  const truncated = maxIds !== undefined && (baselineOnly.length > maxIds || candidateOnly.length > maxIds);

  return {
    intersectionSize: shared,
    baselineOnlyCount: baselineOnly.length,
    candidateOnlyCount: candidateOnly.length,
    containment: containmentOf(baselineSet, candidateSet, shared),
    baselineOnlyIds: maxIds === undefined ? baselineOnly : baselineOnly.slice(0, maxIds),
    candidateOnlyIds: maxIds === undefined ? candidateOnly : candidateOnly.slice(0, maxIds),
    ...(truncated && {truncated}),
  };
}

function firstRanks(ids: string[]): Map<string, number> {
  const ranks = new Map<string, number>();
  for (const [index, id] of ids.entries()) {
    if (!ranks.has(id)) ranks.set(id, index + 1);
  }
  return ranks;
}

function compareOrder(baseline: string[], candidate: string[]): OrderComparison {
  const baselineRanks = firstRanks(baseline);
  const candidateRanks = firstRanks(candidate);

  let longestCommonPrefix = 0;
  while (
    longestCommonPrefix < baseline.length &&
    longestCommonPrefix < candidate.length &&
    baseline[longestCommonPrefix] === candidate[longestCommonPrefix]
  ) {
    longestCommonPrefix++;
  }
  const comparable = Math.min(baseline.length, candidate.length);

  const moves: RankMove[] = [];
  for (const [productId, baselineRank] of baselineRanks) {
    const candidateRank = candidateRanks.get(productId);
    if (candidateRank !== undefined) {
      moves.push({productId, baselineRank, candidateRank, delta: candidateRank - baselineRank});
    }
  }
  const deltas = moves.map((move) => Math.abs(move.delta));
  const topMovers = moves
    .filter((move) => move.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.baselineRank - b.baselineRank)
    .slice(0, TOP_MOVERS);

  return {
    top1Agree: baseline.length > 0 && candidate.length > 0 && baseline[0] === candidate[0],
    baselineTop1RankInCandidate: baseline.length > 0 ? (candidateRanks.get(baseline[0]) ?? null) : null,
    candidateTop1RankInBaseline: candidate.length > 0 ? (baselineRanks.get(candidate[0]) ?? null) : null,
    firstDivergenceRank: longestCommonPrefix < comparable ? longestCommonPrefix + 1 : null,
    longestCommonPrefix,
    displacement: {
      compared: moves.length,
      meanAbs: deltas.length > 0 ? round(deltas.reduce((sum, d) => sum + d, 0) / deltas.length, 2) : 0,
      maxAbs: deltas.length > 0 ? Math.max(...deltas) : 0,
      topMovers,
    },
  };
}

/**
 * Compares two ranked lists of product IDs: overlap at each depth, which IDs
 * differ, and how the shared IDs are ordered.
 *
 * @param baseline - Ranked IDs from the baseline
 * @param candidate - Ranked IDs from the candidate
 * @param options - Depths and ID list truncation
 */
export function compareRankedLists(
  baseline: string[],
  candidate: string[],
  options: DiffSearchCapturesOptions = {},
): RankedListComparison {
  return {
    overlap: compareOverlap(baseline, candidate, options.kValues ?? DEFAULT_K_VALUES),
    membership: compareMembership(baseline, candidate, options.maxIds),
    order: compareOrder(baseline, candidate),
  };
}

/** The hit count of each value of a refinement. A repeated value keeps its first entry. */
function hitCountsByValue(refinement: CapturedRefinement): Map<string, number | undefined> {
  const counts = new Map<string, number | undefined>();
  for (const value of refinement.values) {
    if (!counts.has(value.value)) counts.set(value.value, value.hitCount);
  }
  return counts;
}

/**
 * Compares the refinements (facets) of two results: attributes present on only
 * one side, and shared attributes whose values or value hit counts differ.
 */
export function compareRefinements(
  baseline: SearchCaptureEntry['refinements'],
  candidate: SearchCaptureEntry['refinements'],
): RefinementComparison {
  const baselineById = new Map(baseline.map((refinement) => [refinement.attributeId, refinement]));
  const candidateById = new Map(candidate.map((refinement) => [refinement.attributeId, refinement]));

  const changed: RefinementChange[] = [];
  for (const [attributeId, baselineRefinement] of baselineById) {
    const candidateRefinement = candidateById.get(attributeId);
    if (!candidateRefinement) continue;
    const baselineValues = hitCountsByValue(baselineRefinement);
    const candidateValues = hitCountsByValue(candidateRefinement);
    const baselineOnlyValues = [...baselineValues.keys()].filter((value) => !candidateValues.has(value));
    const candidateOnlyValues = [...candidateValues.keys()].filter((value) => !baselineValues.has(value));
    const countChanges: RefinementCountChange[] = [];
    for (const [value, baselineHitCount] of baselineValues) {
      const candidateHitCount = candidateValues.get(value);
      if (baselineHitCount !== undefined && candidateHitCount !== undefined && baselineHitCount !== candidateHitCount) {
        countChanges.push({value, baselineHitCount, candidateHitCount});
      }
    }
    if (baselineOnlyValues.length > 0 || candidateOnlyValues.length > 0 || countChanges.length > 0) {
      changed.push({
        attributeId,
        baselineValueCount: baselineValues.size,
        candidateValueCount: candidateValues.size,
        baselineOnlyValues,
        candidateOnlyValues,
        countChanges,
      });
    }
  }

  return {
    baselineOnly: [...baselineById.keys()].filter((id) => !candidateById.has(id)),
    candidateOnly: [...candidateById.keys()].filter((id) => !baselineById.has(id)),
    changed,
  };
}

function valuesDiffer(change: RefinementChange): boolean {
  return change.baselineOnlyValues.length > 0 || change.candidateOnlyValues.length > 0;
}

/**
 * The order of the hit prices from the first hit to the last, over the hits that
 * have a price. Use it to check whether a price sort was applied.
 *
 * @param hits - Ranked hits
 * @returns The order, or `undefined` when fewer than two hits have a price
 */
export function priceOrderOf(hits: CapturedHit[]): PriceOrder | undefined {
  const prices = hits
    .map((hit) => hit.price)
    .filter((price): price is number => typeof price === 'number' && Number.isFinite(price));
  if (prices.length < 2) return undefined;
  let rises = false;
  let falls = false;
  for (let index = 1; index < prices.length; index++) {
    if (prices[index] > prices[index - 1]) rises = true;
    else if (prices[index] < prices[index - 1]) falls = true;
  }
  if (rises && falls) return 'unordered';
  if (rises) return 'ascending';
  return falls ? 'descending' : 'equal';
}

function compareSorting(baseline: SearchCaptureEntry, candidate: SearchCaptureEntry): SortingComparison {
  const baselineOptions = new Set(baseline.sortingOptions ?? []);
  const candidateOptions = new Set(candidate.sortingOptions ?? []);
  return {
    baselineOnly: [...baselineOptions].filter((id) => !candidateOptions.has(id)),
    candidateOnly: [...candidateOptions].filter((id) => !baselineOptions.has(id)),
    ...(baseline.selectedSortingOption !== undefined && {baselineSelected: baseline.selectedSortingOption}),
    ...(candidate.selectedSortingOption !== undefined && {candidateSelected: candidate.selectedSortingOption}),
  };
}

function sortingDiffers(sorting: SortingComparison): boolean {
  return (
    sorting.baselineOnly.length > 0 ||
    sorting.candidateOnly.length > 0 ||
    sorting.baselineSelected !== sorting.candidateSelected
  );
}

/** Counts each key. Keys come from API responses, so the counts are built without an object prototype in the way. */
function tally(keys: string[]): Record<string, number> {
  const counts = new Map<string, number>();
  for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
  return Object.fromEntries(counts);
}

/** Adds one compared query to the per-attribute refinement summary. */
function tallyRefinements(
  attributes: Map<string, RefinementAttributeSummary>,
  baseline: CapturedRefinement[],
  candidate: CapturedRefinement[],
  comparison: RefinementComparison,
): void {
  const row = (attributeId: string): RefinementAttributeSummary => {
    let summary = attributes.get(attributeId);
    if (!summary) {
      summary = {attributeId, both: 0, baselineOnly: 0, candidateOnly: 0, valuesDiffer: 0, countsDiffer: 0};
      attributes.set(attributeId, summary);
    }
    return summary;
  };
  const baselineIds = new Set(baseline.map((refinement) => refinement.attributeId));
  const candidateIds = new Set(candidate.map((refinement) => refinement.attributeId));
  for (const attributeId of baselineIds) {
    if (candidateIds.has(attributeId)) row(attributeId).both++;
    else row(attributeId).baselineOnly++;
  }
  for (const attributeId of candidateIds) {
    if (!baselineIds.has(attributeId)) row(attributeId).candidateOnly++;
  }
  for (const change of comparison.changed) {
    if (valuesDiffer(change)) row(change.attributeId).valuesDiffer++;
    if (change.countChanges.length > 0) row(change.attributeId).countsDiffer++;
  }
}

/**
 * True when a query's request failed: it has an error or a status outside 2xx.
 * @internal
 */
export function isFailed(entry: SearchCaptureEntry): boolean {
  return entry.error !== undefined || entry.status < 200 || entry.status >= 300;
}

/**
 * Where a capture's results come from. Captures that predate storefront support are `scapi`.
 * @internal
 */
export function sourceOf(request: SearchCaptureRequest): SearchCaptureSource {
  return request.source ?? 'scapi';
}

/**
 * The search mode a capture asked for. A storefront page cannot ask for one.
 * @internal
 */
export function requestedSearchMode(request: SearchCaptureRequest): SearchMode | undefined {
  return request.source === 'storefront' ? undefined : request.searchMode;
}

/** Writes a range value the same way for every source: `(0.00..20.00)` becomes `(0..20)`. */
function normalizeRangeValue(value: string): string {
  const range = /^\((.*)\.\.(.*)\)$/.exec(value);
  if (!range) return value;
  const bound = (text: string) => {
    const trimmed = text.trim();
    return trimmed !== '' && Number.isFinite(Number(trimmed)) ? String(Number(trimmed)) : trimmed;
  };
  return `(${bound(range[1])}..${bound(range[2])})`;
}

/**
 * Prepares refinements for comparing captures from different sources. Storefront
 * URLs name custom attributes without the `c_` prefix the API uses, and a page
 * shows no filter for a refinement without values.
 */
function forComparison(refinements: CapturedRefinement[], crossSource: boolean): CapturedRefinement[] {
  if (!crossSource) return refinements;
  return refinements
    .filter((refinement) => refinement.values.length > 0)
    .map((refinement) => ({
      ...refinement,
      attributeId: refinement.attributeId.replace(/^c_/, ''),
      values: refinement.values.map((value) => ({...value, value: normalizeRangeValue(value.value)})),
    }));
}

function toSide(entry: SearchCaptureEntry, requestedMode: SearchMode | undefined): SearchDiffSide {
  const modeFallback =
    !isFailed(entry) &&
    requestedMode !== undefined &&
    entry.effectiveSearchMode !== undefined &&
    entry.effectiveSearchMode !== requestedMode;
  const priceOrder = priceOrderOf(entry.hits);
  return {
    status: entry.status,
    ...(entry.error !== undefined && {error: entry.error}),
    ...(entry.total !== undefined && {total: entry.total}),
    hitCount: entry.hits.length,
    ...(entry.effectiveSearchMode !== undefined && {effectiveSearchMode: entry.effectiveSearchMode}),
    ...(modeFallback && {modeFallback}),
    ...(priceOrder !== undefined && {priceOrder}),
    ...(entry.redirectedTo !== undefined && {redirectedTo: entry.redirectedTo}),
  };
}

/**
 * Per-side counts for the given entries of a capture: failures, zero results, distinct result
 * lists, the search modes that served the queries, sorting options and price orders.
 * @internal
 */
export function summarizeSide(capture: SearchCapture, entries: SearchCaptureEntry[]): SearchDiffSideSummary {
  const succeeded = entries.filter((entry) => !isFailed(entry));
  const withHits = succeeded.filter((entry) => entry.hits.length > 0);

  const resultSets = new Map<string, number>();
  for (const entry of withHits) {
    const key = JSON.stringify(entry.hits.map((hit) => hit.productId));
    resultSets.set(key, (resultSets.get(key) ?? 0) + 1);
  }

  const effectiveSearchModes: Record<string, number> = {};
  let modeFallbacks = 0;
  const sortingOptions = new Set<string>();
  const priceOrders: string[] = [];
  for (const entry of succeeded) {
    const mode = entry.effectiveSearchMode ?? 'unreported';
    effectiveSearchModes[mode] = (effectiveSearchModes[mode] ?? 0) + 1;
    const side = toSide(entry, requestedSearchMode(capture.request));
    if (side.modeFallback) modeFallbacks++;
    if (side.priceOrder) priceOrders.push(side.priceOrder);
    for (const id of entry.sortingOptions ?? []) sortingOptions.add(id);
  }

  return {
    label: capture.label,
    failed: entries.length - succeeded.length,
    zeroResults: succeeded.length - withHits.length,
    queriesWithHits: withHits.length,
    distinctResultSets: resultSets.size,
    largestSharedResultSet: resultSets.size > 0 ? Math.max(...resultSets.values()) : 0,
    effectiveSearchModes,
    modeFallbacks,
    sortingOptions: [...sortingOptions],
    selectedSortingOptions: tally(succeeded.map((entry) => entry.selectedSortingOption ?? 'unreported')),
    priceOrders: tally(priceOrders),
  };
}

const SCAPI_REQUEST_FIELDS = ['organizationId', 'siteId', 'limit', 'locale', 'currency', 'sort', 'refine'] as const;
const STOREFRONT_REQUEST_FIELDS = ['host', 'siteId', 'locale', 'path', 'limit', 'params', 'bypassPageCache'] as const;
const SHARED_REQUEST_FIELDS = ['siteId', 'limit'] as const;

function formatRequestValue(value: unknown): string {
  if (value === undefined) return '(not set)';
  // The order of refinements does not change the results.
  if (Array.isArray(value)) return JSON.stringify(value.map(String).sort());
  if (value !== null && typeof value === 'object') {
    return JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))));
  }
  return String(value);
}

function compareRequestFields<K extends string>(
  baseline: Partial<Record<K, unknown>>,
  candidate: Partial<Record<K, unknown>>,
  fields: readonly K[],
): string[] {
  const warnings: string[] = [];
  for (const field of fields) {
    const a = formatRequestValue(baseline[field]);
    const b = formatRequestValue(candidate[field]);
    if (a !== b) warnings.push(`Captures differ in ${field}: baseline ${a}, candidate ${b}`);
  }
  return warnings;
}

function describeRequestDifferences(baseline: SearchCapture, candidate: SearchCapture): string[] {
  const a = baseline.request;
  const b = candidate.request;
  if (a.source === 'storefront' && b.source === 'storefront') {
    return compareRequestFields(a, b, STOREFRONT_REQUEST_FIELDS);
  }
  if (a.source !== 'storefront' && b.source !== 'storefront') {
    return compareRequestFields(a, b, SCAPI_REQUEST_FIELDS);
  }
  return [
    `The captures come from different sources (baseline ${sourceOf(a)}, candidate ${sourceOf(b)}). ` +
      'Refinements are compared without the c_ prefix of custom attribute IDs and without refinements that have no values, ' +
      'and product IDs can differ where storefront tiles show variants instead of the master products the API returns.',
    ...compareRequestFields(a, b, SHARED_REQUEST_FIELDS),
  ];
}

/**
 * Compares two captures query by query. For each query present in both, reports
 * ranked-list overlap, membership and order, refinement and refinement hit count
 * differences, sorting option differences, the order of the hit prices and the
 * search mode that served each side. The summary adds cross-query signals, such as
 * many queries returning the same result list, and a per-attribute refinement summary.
 *
 * The captures can come from different sources, for example a storefront page
 * capture and a Shopper Search capture. Refinement IDs are then compared without
 * the `c_` prefix of custom attributes, and the diff warns that the sources differ.
 *
 * The diff carries no pass or fail verdict; interpret it for the change being tested.
 *
 * @param baseline - The capture to compare against (for example before a change)
 * @param candidate - The capture to compare (for example after a change)
 * @param options - Depths and ID list truncation
 */
export function diffSearchCaptures(
  baseline: SearchCapture,
  candidate: SearchCapture,
  options: DiffSearchCapturesOptions = {},
): SearchDiff {
  for (const [side, capture] of [
    ['baseline', baseline],
    ['candidate', candidate],
  ] as const) {
    if (capture?.schemaVersion !== SEARCH_CAPTURE_SCHEMA_VERSION || !Array.isArray(capture.results)) {
      throw new Error(
        `The ${side} is not a search capture with schemaVersion ${SEARCH_CAPTURE_SCHEMA_VERSION} (got ${String(capture?.schemaVersion)})`,
      );
    }
  }

  const kValues = [...new Set(options.kValues ?? DEFAULT_K_VALUES)]
    .filter((k) => Number.isInteger(k) && k > 0)
    .sort((a, b) => a - b);
  if (kValues.length === 0) {
    throw new Error('kValues must contain at least one positive integer');
  }

  const candidateByQuery = new Map(candidate.results.map((entry) => [entry.query, entry]));
  const baselineQueries = new Set(baseline.results.map((entry) => entry.query));
  const crossSource = sourceOf(baseline.request) !== sourceOf(candidate.request);
  const baselineMode = requestedSearchMode(baseline.request);
  const candidateMode = requestedSearchMode(candidate.request);

  const queries: SearchDiffEntry[] = [];
  const matchedBaseline: SearchCaptureEntry[] = [];
  const matchedCandidate: SearchCaptureEntry[] = [];
  const overlapTotals = new Map<number, {count: number; sum: number}>();
  const refinementAttributes = new Map<string, RefinementAttributeSummary>();
  let compared = 0;
  let top1Agreements = 0;
  let refinementDifferences = 0;
  let refinementCountDifferences = 0;
  let sortingDifferences = 0;

  for (const baselineEntry of baseline.results) {
    const candidateEntry = candidateByQuery.get(baselineEntry.query);
    if (!candidateEntry) continue;
    matchedBaseline.push(baselineEntry);
    matchedCandidate.push(candidateEntry);

    const entry: SearchDiffEntry = {
      query: baselineEntry.query,
      baseline: toSide(baselineEntry, baselineMode),
      candidate: toSide(candidateEntry, candidateMode),
    };

    const baselineFailed = isFailed(baselineEntry);
    const candidateFailed = isFailed(candidateEntry);
    if (baselineFailed || candidateFailed) {
      entry.note =
        baselineFailed && candidateFailed ? 'both sides failed' : `${baselineFailed ? 'baseline' : 'candidate'} failed`;
    } else {
      const results = compareRankedLists(
        baselineEntry.hits.map((hit) => hit.productId),
        candidateEntry.hits.map((hit) => hit.productId),
        {kValues, maxIds: options.maxIds},
      );
      const baselineRefinements = forComparison(baselineEntry.refinements, crossSource);
      const candidateRefinements = forComparison(candidateEntry.refinements, crossSource);
      const refinements = compareRefinements(baselineRefinements, candidateRefinements);
      const sorting = compareSorting(baselineEntry, candidateEntry);
      entry.results = results;
      entry.refinements = refinements;
      entry.sorting = sorting;

      compared++;
      if (results.order.top1Agree) top1Agreements++;
      if (
        refinements.baselineOnly.length > 0 ||
        refinements.candidateOnly.length > 0 ||
        refinements.changed.some((change) => valuesDiffer(change))
      ) {
        refinementDifferences++;
      }
      if (refinements.changed.some((change) => change.countChanges.length > 0)) refinementCountDifferences++;
      if (sortingDiffers(sorting)) sortingDifferences++;
      tallyRefinements(refinementAttributes, baselineRefinements, candidateRefinements, refinements);
      for (const k of kValues) {
        const value = results.overlap.atK[String(k)];
        if (value === undefined) continue;
        const total = overlapTotals.get(k) ?? {count: 0, sum: 0};
        total.count++;
        total.sum += value;
        overlapTotals.set(k, total);
      }
    }

    queries.push(entry);
  }

  const meanOverlapAtK: Record<string, number> = {};
  for (const k of kValues) {
    const total = overlapTotals.get(k);
    if (total) meanOverlapAtK[String(k)] = round(total.sum / total.count, 4);
  }

  return {
    schemaVersion: SEARCH_CAPTURE_SCHEMA_VERSION,
    baseline: {label: baseline.label, capturedAt: baseline.capturedAt, request: baseline.request},
    candidate: {label: candidate.label, capturedAt: candidate.capturedAt, request: candidate.request},
    kValues,
    summary: {
      queries: queries.length,
      compared,
      meanOverlapAtK,
      top1Agreements,
      refinementDifferences,
      refinementCountDifferences,
      sortingDifferences,
      refinementAttributes: [...refinementAttributes.values()],
      baseline: summarizeSide(baseline, matchedBaseline),
      candidate: summarizeSide(candidate, matchedCandidate),
    },
    queries,
    unmatchedQueries: {
      baselineOnly: baseline.results.map((entry) => entry.query).filter((query) => !candidateByQuery.has(query)),
      candidateOnly: candidate.results.map((entry) => entry.query).filter((query) => !baselineQueries.has(query)),
    },
    warnings: describeRequestDifferences(baseline, candidate),
  };
}
