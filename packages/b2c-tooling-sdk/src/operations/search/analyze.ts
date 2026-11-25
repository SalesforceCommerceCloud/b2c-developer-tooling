/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  DEFAULT_K_VALUES,
  diffSearchCaptures,
  isFailed,
  priceOrderOf,
  requestedSearchMode,
  sourceOf,
  summarizeSide,
} from './diff.js';
import {
  SEARCH_CAPTURE_SCHEMA_VERSION,
  type SearchCapture,
  type SearchCaptureEntry,
  type SearchCaptureRequest,
  type SearchCaptureSource,
  type SearchDiff,
  type SearchDiffSummary,
} from './types.js';

/**
 * The part a capture plays in {@link analyzeSearchSources}: where it was captured
 * (the storefront search page, or the Shopper Search API, which the capture
 * records as `scapi`) and which search engine served it (`lexical` is the native
 * B2C Commerce search, `semantic` is Agentic Commerce Search).
 */
export type SearchSourceRole = 'scapiLexical' | 'scapiSemantic' | 'storefrontLexical' | 'storefrontSemantic';

/** The captures to analyze, by role. At least two are required. */
export type SearchSources = Partial<Record<SearchSourceRole, SearchCapture>>;

/**
 * A comparison {@link analyzeSearchSources} makes between two sources. The first
 * two compare a storefront with the API under the same engine, so a difference
 * points at the storefront layer. The last two compare the engines.
 *
 * - `storefront-vs-scapi-lexical`: `storefrontLexical` against `scapiLexical`
 * - `storefront-vs-scapi-semantic`: `storefrontSemantic` against `scapiSemantic`
 * - `scapi-lexical-vs-semantic`: `scapiLexical` against `scapiSemantic`
 * - `storefront-lexical-vs-semantic`: `storefrontLexical` against `storefrontSemantic`
 */
export type SearchSourcePairId =
  | 'scapi-lexical-vs-semantic'
  | 'storefront-lexical-vs-semantic'
  | 'storefront-vs-scapi-lexical'
  | 'storefront-vs-scapi-semantic';

/** How much attention a finding needs. Findings carry no pass or fail verdict. */
export type SearchFindingSeverity = 'info' | 'notice' | 'warning';

/** The roles, in the order the analysis reports them. */
export const SEARCH_SOURCE_ROLES: readonly SearchSourceRole[] = [
  'storefrontLexical',
  'storefrontSemantic',
  'scapiLexical',
  'scapiSemantic',
];

/** The comparisons, in the order the analysis reports them. */
export const SEARCH_SOURCE_PAIR_IDS: readonly SearchSourcePairId[] = [
  'storefront-vs-scapi-lexical',
  'storefront-vs-scapi-semantic',
  'scapi-lexical-vs-semantic',
  'storefront-lexical-vs-semantic',
];

const CODE = {
  storefrontOnly: 'storefront-only-products',
  apiOnly: 'api-only-products',
  totalsDiffer: 'totals-differ',
  facetsOnlyOnStorefront: 'facets-only-on-storefront',
  facetsOnlyInApi: 'facets-only-in-api',
  facetCountsDiffer: 'facet-counts-differ',
  sortingOptionsDiffer: 'sorting-options-differ',
  orderDiffers: 'order-differs',
  engineChange: 'engine-change',
  priceSortNotApplied: 'price-sort-not-applied',
  modeFallbacks: 'mode-fallbacks',
  identicalResultLists: 'identical-result-lists',
  zeroResults: 'zero-results',
  failedQueries: 'failed-queries',
  channelGapGrew: 'channel-gap-grew',
  storefrontEngineMismatch: 'storefront-engine-mismatch',
} as const;

/** The codes a {@link SearchFinding} can carry. They are stable: scripts can match on them. */
export const SEARCH_FINDING_CODES: readonly string[] = Object.values(CODE);

/** Default number of examples (a query with product IDs) kept per finding. */
export const DEFAULT_ANALYSIS_MAX_EXAMPLES = 5;

/** Default number of affected queries listed per finding. */
export const DEFAULT_ANALYSIS_MAX_QUERIES = 10;

/**
 * The thresholds that decide which findings {@link analyzeSearchSources} reports and how
 * severe they are. Shares are fractions of the compared queries, from 0 to 1.
 */
export interface SearchAnalysisThresholds {
  /**
   * Gap between a storefront capture's mean overlap with the lexical and with the semantic API
   * results at which the analysis says which engine the capture is closer to. A smaller gap is
   * `unclear`. Default 0.15.
   */
  engineAttributionGap: number;
  /**
   * Fall in the mean overlap between the storefront and the API, from lexical to semantic search,
   * at which `channel-gap-grew` is reported. Default 0.2.
   */
  channelGapDrop: number;
  /**
   * Relative difference between the storefront total and the API total of a query (the difference
   * divided by the larger total) above which `totals-differ` counts the query. Default 0.1.
   */
  totalsRelativeDifference: number;
  /**
   * Share of the compared queries a difference between the storefront and the API, or a source's
   * zero results, must reach for the finding to be a `warning` instead of a `notice`. Default 0.1.
   */
  warningShare: number;
  /**
   * Share of a source's queries with results that return a result list another query also returns,
   * at which `identical-result-lists` is a `warning` instead of a `notice`. Default 0.2.
   */
  sharedListShare: number;
}

/** The default {@link SearchAnalysisThresholds}. */
export const DEFAULT_SEARCH_ANALYSIS_THRESHOLDS: Readonly<SearchAnalysisThresholds> = Object.freeze({
  engineAttributionGap: 0.15,
  channelGapDrop: 0.2,
  totalsRelativeDifference: 0.1,
  warningShare: 0.1,
  sharedListShare: 0.2,
});

/** Options for {@link analyzeSearchSources}. */
export interface AnalyzeSearchSourcesOptions {
  /** Depths at which to report overlap. Defaults to 1, 3, 5 and 10. */
  kValues?: number[];
  /** Most examples (a query with product IDs) to keep per finding. Defaults to 5; 0 keeps none. */
  maxExamples?: number;
  /** Most affected queries to list per finding, most affected first. Defaults to 10. */
  maxQueries?: number;
  /** Overrides for the finding thresholds. See {@link DEFAULT_SEARCH_ANALYSIS_THRESHOLDS}. */
  thresholds?: Partial<SearchAnalysisThresholds>;
}

/** What the analysis knows about one source. */
export interface SearchSourceSummary {
  label: string;
  /** When the capture started (ISO 8601). */
  capturedAt: string;
  /** Where the capture's results come from. */
  source: SearchCaptureSource;
  /** Queries in the capture. */
  queries: number;
  /** Count of the successful queries by the search mode that served them (`unreported` when the response did not say). */
  effectiveSearchModes: Record<string, number>;
}

/** One comparison between two sources. */
export interface SearchSourcePair {
  id: SearchSourcePairId;
  /** The source compared against: the storefront for the storefront-vs-API pairs, the lexical source for the engine pairs. */
  baseline: SearchSourceRole;
  /** The source compared. */
  candidate: SearchSourceRole;
  /** The summary of the {@link diffSearchCaptures} comparison of the two sources. */
  summary: SearchDiffSummary;
  /**
   * Storefront product IDs, across all queries, that were counted as the API's product because
   * they are the variant the API hit represents. The storefront tile shows the variant, the API
   * returns its master.
   */
  idsMatchedThroughRepresentedProduct: number;
  /** Differences in how the two sources were captured that can affect the comparison. */
  warnings: string[];
}

/** Something the analysis noticed, with the queries it affects and what is likely behind it. */
export interface SearchFinding {
  /** Stable identifier. One of {@link SEARCH_FINDING_CODES}. */
  code: string;
  severity: SearchFindingSeverity;
  /** The comparison the finding comes from. Omitted for findings about one source or across comparisons. */
  pair?: SearchSourcePairId;
  /** The source the finding is about. */
  source?: SearchSourceRole;
  /** What was found, in plain English, with the counts. */
  message: string;
  /** Hedged explanations worth checking. They are leads, not conclusions. */
  likelyCauses: string[];
  /** The affected queries, most affected first, up to `maxQueries`. */
  queries: string[];
  /**
   * Affected queries with the product IDs concerned, up to `maxExamples`. Which products depends
   * on the finding: the products only one side returns, the products ranked differently, the top
   * hit of each engine, or the head of a repeated result list.
   */
  examples?: {productIds: string[]; query: string}[];
}

/** Which engine a storefront capture's results are closest to. */
export interface SearchEngineAttribution {
  /** The engine whose API results the storefront capture overlaps more, or `unclear` when the gap is small. */
  closerTo: 'lexical' | 'semantic' | 'unclear';
  /** Mean overlap with the lexical API results, at depth `k`. */
  meanOverlapWithLexical: number;
  /** Mean overlap with the semantic API results, at depth `k`. */
  meanOverlapWithSemantic: number;
  /** The depth the means were taken at: the largest depth both comparisons reach. */
  k: number;
}

/** The result of {@link analyzeSearchSources}. It carries no pass or fail verdict. */
export interface SearchSourceAnalysis {
  schemaVersion: typeof SEARCH_CAPTURE_SCHEMA_VERSION;
  /** Depths at which overlap is reported. */
  kValues: number[];
  /** The sources that were analyzed. */
  sources: Partial<Record<SearchSourceRole, SearchSourceSummary>>;
  /** The comparisons between the sources, in the order of {@link SEARCH_SOURCE_PAIR_IDS}. */
  pairs: SearchSourcePair[];
  /**
   * Which engine each storefront capture looks like, judged by its overlap with the lexical and
   * the semantic API results. Present when both API captures and a storefront capture were given.
   */
  engineAttribution?: Partial<Record<'storefrontLexical' | 'storefrontSemantic', SearchEngineAttribution>>;
  /** What the analysis noticed, by severity (warnings first), then comparison. */
  findings: SearchFinding[];
  /** Problems with the sources themselves, and queries some sources lack. */
  warnings: string[];
}

type Engine = 'lexical' | 'semantic';

interface RoleInfo {
  channel: 'scapi' | 'storefront';
  engine: Engine;
  label: string;
}

const ROLE_INFO: Record<SearchSourceRole, RoleInfo> = {
  storefrontLexical: {channel: 'storefront', engine: 'lexical', label: 'storefront (lexical)'},
  storefrontSemantic: {channel: 'storefront', engine: 'semantic', label: 'storefront (semantic)'},
  scapiLexical: {channel: 'scapi', engine: 'lexical', label: 'API (lexical)'},
  scapiSemantic: {channel: 'scapi', engine: 'semantic', label: 'API (semantic)'},
};

interface PairSpec {
  id: SearchSourcePairId;
  baseline: SearchSourceRole;
  candidate: SearchSourceRole;
}

const PAIR_SPECS: readonly PairSpec[] = [
  {id: 'storefront-vs-scapi-lexical', baseline: 'storefrontLexical', candidate: 'scapiLexical'},
  {id: 'storefront-vs-scapi-semantic', baseline: 'storefrontSemantic', candidate: 'scapiSemantic'},
  {id: 'scapi-lexical-vs-semantic', baseline: 'scapiLexical', candidate: 'scapiSemantic'},
  {id: 'storefront-lexical-vs-semantic', baseline: 'storefrontLexical', candidate: 'storefrontSemantic'},
];

const SEVERITY_RANK: Record<SearchFindingSeverity, number> = {warning: 0, notice: 1, info: 2};

/** Most product IDs kept in one example. */
const MAX_EXAMPLE_PRODUCT_IDS = 5;

/** Most names listed in a finding's message before "and N more". */
const MAX_LISTED = 5;

/** Smallest difference that counts when comparing against a threshold, so 0.35 - 0.2 reaches 0.15. */
const EPSILON = 1e-9;

// ---------------------------------------------------------------------------
// Formatting and small helpers
// ---------------------------------------------------------------------------

function atLeast(value: number, threshold: number): boolean {
  return value >= threshold - EPSILON;
}

function above(value: number, threshold: number): boolean {
  return value > threshold + EPSILON;
}

function fixed(value: number): string {
  return value.toFixed(2);
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

function quote(text: string): string {
  return `"${text}"`;
}

function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function listLimited(items: string[], max = MAX_LISTED): string {
  return items.length <= max ? items.join(', ') : `${items.slice(0, max).join(', ')} and ${items.length - max} more`;
}

/** `name (3 queries)` for each name, most frequent first. */
function listCounts(counts: Map<string, number>, max = MAX_LISTED): string {
  const sorted = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return listLimited(
    sorted.map(([name, count]) => `${name} (${plural(count, 'query', 'queries')})`),
    max,
  );
}

function countOccurrences(lists: string[][]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const list of lists) {
    for (const item of list) counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return counts;
}

function deepestDepth(meanOverlapAtK: Record<string, number>): number | undefined {
  const depths = Object.keys(meanOverlapAtK).map(Number);
  return depths.length > 0 ? Math.max(...depths) : undefined;
}

function byQuery(capture: SearchCapture): Map<string, SearchCaptureEntry> {
  return new Map(capture.results.map((entry) => [entry.query, entry]));
}

function idsOf(entry: SearchCaptureEntry): string[] {
  return entry.hits.map((hit) => hit.productId);
}

/** The sort a capture asked for: `sort` for Shopper Search, the `srule` parameter for a storefront page. */
function requestedSort(request: SearchCaptureRequest): string | undefined {
  return request.source === 'storefront' ? request.params?.srule : request.sort;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

interface Limits {
  maxExamples: number;
  maxQueries: number;
}

interface Settings {
  kValues: number[];
  limits: Limits;
  thresholds: SearchAnalysisThresholds;
}

function resolveOptions(options: AnalyzeSearchSourcesOptions): Settings {
  const kValues = [...new Set(options.kValues ?? DEFAULT_K_VALUES)]
    .filter((k) => Number.isInteger(k) && k > 0)
    .sort((a, b) => a - b);
  if (kValues.length === 0) {
    throw new Error('kValues must contain at least one positive integer');
  }

  const maxExamples = options.maxExamples ?? DEFAULT_ANALYSIS_MAX_EXAMPLES;
  const maxQueries = options.maxQueries ?? DEFAULT_ANALYSIS_MAX_QUERIES;
  for (const [name, value] of [
    ['maxExamples', maxExamples],
    ['maxQueries', maxQueries],
  ] as const) {
    if (!Number.isInteger(value) || value < 0) throw new Error(`${name} must be a non-negative integer`);
  }

  const thresholds: SearchAnalysisThresholds = {...DEFAULT_SEARCH_ANALYSIS_THRESHOLDS, ...options.thresholds};
  for (const [name, value] of Object.entries(thresholds)) {
    if (!Number.isFinite(value) || value < 0) throw new Error(`Threshold ${name} must be a non-negative number`);
  }

  return {kValues, limits: {maxExamples, maxQueries}, thresholds};
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

type ProvidedSource = [SearchSourceRole, SearchCapture];

/** Checks the roles and the captures. Returns the provided sources in role order; adds warnings for suspect search modes. */
function validateSources(sources: SearchSources, warnings: string[]): ProvidedSource[] {
  if (sources === null || typeof sources !== 'object') {
    throw new Error(`sources must be an object keyed by role (${SEARCH_SOURCE_ROLES.join(', ')})`);
  }
  for (const [key, value] of Object.entries(sources)) {
    if (value !== undefined && !SEARCH_SOURCE_ROLES.includes(key as SearchSourceRole)) {
      throw new Error(`Unknown search source role "${key}"; use ${SEARCH_SOURCE_ROLES.join(', ')}`);
    }
  }

  const provided: ProvidedSource[] = [];
  for (const role of SEARCH_SOURCE_ROLES) {
    const capture = sources[role];
    if (capture !== undefined) provided.push([role, capture]);
  }
  if (provided.length < 2) {
    throw new Error(
      `At least two search sources are required (got ${provided.length}); use two or more of ${SEARCH_SOURCE_ROLES.join(', ')}`,
    );
  }

  for (const [role, capture] of provided) {
    if (capture?.schemaVersion !== SEARCH_CAPTURE_SCHEMA_VERSION || !Array.isArray(capture.results)) {
      throw new Error(
        `The ${role} source is not a search capture with schemaVersion ${SEARCH_CAPTURE_SCHEMA_VERSION} (got ${String(capture?.schemaVersion)})`,
      );
    }
    if (typeof capture.request !== 'object' || capture.request === null) {
      throw new Error(`The ${role} source has no request settings`);
    }
    const {channel, engine} = ROLE_INFO[role];
    const actual = sourceOf(capture.request);
    if (actual !== channel) {
      throw new Error(`The ${role} source must be a ${channel} capture, but its request source is "${actual}"`);
    }
    if (channel === 'scapi') {
      const requested = requestedSearchMode(capture.request);
      if (requested === undefined) {
        warnings.push(
          `The ${role} source did not request a search mode, so the site default engine served it and it may not be a ${engine} capture`,
        );
      } else if (requested !== engine) {
        warnings.push(`The ${role} source requested the ${requested} search mode, not ${engine}`);
      }
    }
  }
  return provided;
}

function missingQueryWarnings(provided: ProvidedSource[]): string[] {
  const all = unique(provided.flatMap(([, capture]) => capture.results.map((entry) => entry.query)));
  const warnings: string[] = [];
  for (const [role, capture] of provided) {
    const have = new Set(capture.results.map((entry) => entry.query));
    const missing = all.filter((query) => !have.has(query));
    if (missing.length > 0) {
      warnings.push(
        `The ${role} source has no result for ${plural(missing.length, 'query', 'queries')} that other sources have: ${listLimited(missing.map((query) => quote(query)))}`,
      );
    }
  }
  return warnings;
}

// ---------------------------------------------------------------------------
// Pairs
// ---------------------------------------------------------------------------

/**
 * Replaces each storefront hit ID that is the represented product (variant) of an API hit, and not an ID the
 * API returns itself, with that hit's product ID. A storefront tile can show the variant where the API returns
 * its master. Returns a copy; the capture is not changed.
 */
function mapRepresentedProducts(
  storefront: SearchCapture,
  api: SearchCapture,
): {capture: SearchCapture; matched: number} {
  const apiEntries = byQuery(api);
  let matched = 0;
  const results = storefront.results.map((entry) => {
    const apiEntry = apiEntries.get(entry.query);
    if (!apiEntry || isFailed(entry) || isFailed(apiEntry)) return entry;

    const apiIds = new Set(idsOf(apiEntry));
    const represented = new Map<string, string>();
    for (const hit of apiEntry.hits) {
      if (hit.representedProductId !== undefined && !represented.has(hit.representedProductId)) {
        represented.set(hit.representedProductId, hit.productId);
      }
    }

    // A tile of a variant and a tile of its master (or of the same variant twice) both end up as
    // the master. Keep the first, so the mapping does not count one API product twice.
    const seen = new Set<string>();
    const mappedIds = new Set<string>();
    let changed = false;
    const hits = entry.hits.flatMap((hit) => {
      const mapped = apiIds.has(hit.productId) ? undefined : represented.get(hit.productId);
      const productId = mapped ?? hit.productId;
      if (seen.has(productId) && (mapped !== undefined || mappedIds.has(productId))) {
        changed = true;
        return [];
      }
      seen.add(productId);
      if (mapped === undefined) return [hit];
      mappedIds.add(productId);
      changed = true;
      matched++;
      return [{...hit, productId}];
    });
    return changed ? {...entry, hits} : entry;
  });
  return {capture: {...storefront, results}, matched};
}

interface PairContext {
  spec: PairSpec;
  diff: SearchDiff;
  /** The baseline capture as compared (storefront IDs matched to the API's). */
  baseline: SearchCapture;
  candidate: SearchCapture;
  baselineEntries: Map<string, SearchCaptureEntry>;
  candidateEntries: Map<string, SearchCaptureEntry>;
  matched: number;
}

/** True for the pairs that compare a storefront with the API under one engine. */
function isChannelPair(spec: PairSpec): boolean {
  return ROLE_INFO[spec.baseline].channel === 'storefront' && ROLE_INFO[spec.candidate].channel === 'scapi';
}

function engineOfPair(spec: PairSpec): Engine {
  return ROLE_INFO[spec.candidate].engine;
}

function compareSources(
  baselineRole: SearchSourceRole,
  candidateRole: SearchSourceRole,
  captures: Map<SearchSourceRole, SearchCapture>,
  kValues: number[],
): Omit<PairContext, 'spec'> {
  const storefrontToApi =
    ROLE_INFO[baselineRole].channel === 'storefront' && ROLE_INFO[candidateRole].channel === 'scapi';
  let baseline = captures.get(baselineRole) as SearchCapture;
  const candidate = captures.get(candidateRole) as SearchCapture;
  let matched = 0;
  if (storefrontToApi) {
    ({capture: baseline, matched} = mapRepresentedProducts(baseline, candidate));
  }
  return {
    diff: diffSearchCaptures(baseline, candidate, {kValues}),
    baseline,
    candidate,
    baselineEntries: byQuery(baseline),
    candidateEntries: byQuery(candidate),
    matched,
  };
}

function toPair(context: PairContext): SearchSourcePair {
  const {diff, spec} = context;
  return {
    id: spec.id,
    baseline: spec.baseline,
    candidate: spec.candidate,
    summary: diff.summary,
    idsMatchedThroughRepresentedProduct: context.matched,
    warnings: [
      ...diff.warnings,
      ...(diff.summary.compared === 0
        ? ['No query could be compared: none appears in both captures with both requests succeeding']
        : []),
    ],
  };
}

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

interface Affected {
  query: string;
  /** Larger means more affected. */
  impact: number;
  productIds?: string[];
}

interface FindingDraft {
  code: string;
  severity: SearchFindingSeverity;
  pair?: SearchSourcePairId;
  source?: SearchSourceRole;
  message: string;
  likelyCauses: string[];
}

function buildFinding(draft: FindingDraft, affected: Affected[], limits: Limits): SearchFinding {
  // The sort is stable: queries with the same impact keep their capture order.
  const ranked = [...affected].sort((a, b) => b.impact - a.impact);
  const examples = ranked
    .flatMap((item) =>
      item.productIds && item.productIds.length > 0
        ? [{query: item.query, productIds: item.productIds.slice(0, MAX_EXAMPLE_PRODUCT_IDS)}]
        : [],
    )
    .slice(0, limits.maxExamples);
  return {
    code: draft.code,
    severity: draft.severity,
    ...(draft.pair && {pair: draft.pair}),
    ...(draft.source && {source: draft.source}),
    message: draft.message,
    likelyCauses: draft.likelyCauses,
    queries: ranked.slice(0, limits.maxQueries).map((item) => item.query),
    ...(examples.length > 0 && {examples}),
  };
}

/** A difference is a warning when it reaches `threshold` of the compared queries, a notice below that. */
function severityByShare(affected: number, compared: number, threshold: number): SearchFindingSeverity {
  return compared > 0 && atLeast(affected / compared, threshold) ? 'warning' : 'notice';
}

function ofCompared(count: number, compared: number): string {
  return `${count} of ${plural(compared, 'compared query', 'compared queries')}`;
}

// --- Storefront against the API, same engine -------------------------------

interface ChannelLists {
  /** Storefront products the API list does not have, within the depth the API list covers. */
  storefrontOnly: string[];
  /** API products the storefront list does not have, within the depth the storefront list covers. */
  apiOnly: string[];
  /** Positions at which the products both sides return are ranked differently. */
  orderMismatches: number;
  /** The first products ranked differently: the storefront's, then the API's. */
  firstSwap?: [string, string];
}

/**
 * True when the list holds every match: all of the reported total or, without a total, no products or
 * fewer than the limit asked for. Pass no limit for a storefront list: a storefront page can show fewer
 * tiles than the limit, so without a total a shorter list there still counts as cut off.
 */
function holdsEveryMatch(entry: SearchCaptureEntry, limit?: number): boolean {
  if (entry.total !== undefined) return entry.hits.length >= entry.total;
  return entry.hits.length === 0 || (limit !== undefined && entry.hits.length < limit);
}

/**
 * Compares the storefront and API lists of one query. A list cut off at its limit says nothing about
 * what lies beyond it, so each side's products are only counted as missing from the other side within
 * the depth the other list covers. A storefront page size that differs from the API limit then does not
 * show up as products only one side returns.
 */
function compareChannelLists(storefront: SearchCaptureEntry, api: SearchCaptureEntry, apiLimit: number): ChannelLists {
  const storefrontIds = idsOf(storefront);
  const apiIds = idsOf(api);
  const storefrontSet = new Set(storefrontIds);
  const apiSet = new Set(apiIds);
  const apiDepth = holdsEveryMatch(api, apiLimit) ? Number.POSITIVE_INFINITY : apiIds.length;
  const storefrontDepth = holdsEveryMatch(storefront) ? Number.POSITIVE_INFINITY : storefrontIds.length;

  // The relative order of the products both sides return.
  const storefrontShared = unique(storefrontIds).filter((id) => apiSet.has(id));
  const apiShared = unique(apiIds).filter((id) => storefrontSet.has(id));
  let orderMismatches = 0;
  let firstSwap: [string, string] | undefined;
  for (const [index, id] of storefrontShared.entries()) {
    if (apiShared[index] === id) continue;
    orderMismatches++;
    firstSwap ??= [id, apiShared[index]];
  }

  return {
    storefrontOnly: unique(storefrontIds.filter((id, index) => index < apiDepth && !apiSet.has(id))),
    apiOnly: unique(apiIds.filter((id, index) => index < storefrontDepth && !storefrontSet.has(id))),
    orderMismatches,
    ...(firstSwap && {firstSwap}),
  };
}

interface ChannelContext {
  spec: PairSpec;
  engine: Engine;
  context: PairContext;
  /** Compared queries only. */
  lists: Map<string, ChannelLists>;
  thresholds: SearchAnalysisThresholds;
  limits: Limits;
}

function channelContext(context: PairContext, thresholds: SearchAnalysisThresholds, limits: Limits): ChannelContext {
  const lists = new Map<string, ChannelLists>();
  for (const item of context.diff.queries) {
    if (!item.results) continue;
    const storefront = context.baselineEntries.get(item.query);
    const api = context.candidateEntries.get(item.query);
    if (!storefront || !api) continue;
    lists.set(item.query, compareChannelLists(storefront, api, context.candidate.request.limit));
  }
  return {spec: context.spec, engine: engineOfPair(context.spec), context, lists, thresholds, limits};
}

function usedPageCacheBypass(request: SearchCaptureRequest): boolean {
  return request.source === 'storefront' && request.bypassPageCache === true;
}

function membershipFindings(ctx: ChannelContext): SearchFinding[] {
  const {compared} = ctx.context.diff.summary;
  const storefrontOnly: Affected[] = [];
  const apiOnly: Affected[] = [];
  for (const [query, lists] of ctx.lists) {
    if (lists.storefrontOnly.length > 0) {
      storefrontOnly.push({query, impact: lists.storefrontOnly.length, productIds: lists.storefrontOnly});
    }
    if (lists.apiOnly.length > 0) apiOnly.push({query, impact: lists.apiOnly.length, productIds: lists.apiOnly});
  }

  const findings: SearchFinding[] = [];
  const {engine} = ctx;
  const total = (affected: Affected[]) => affected.reduce((sum, item) => sum + item.impact, 0);
  if (storefrontOnly.length > 0) {
    findings.push(
      buildFinding(
        {
          code: CODE.storefrontOnly,
          severity: severityByShare(storefrontOnly.length, compared, ctx.thresholds.warningShare),
          pair: ctx.spec.id,
          message: `With ${engine} search, the storefront shows products the API does not return in ${ofCompared(storefrontOnly.length, compared)} (${plural(total(storefrontOnly), 'product')} in total).`,
          likelyCauses: [
            'Custom storefront code likely changes the search result, for example by adding promoted or pinned products or by re-running the search with other settings.',
            'A search redirect or a landing page may replace the results of some queries.',
            'Shopper context on the storefront (customer groups, price books, personalization) may include products the guest API request does not.',
            ...(usedPageCacheBypass(ctx.context.baseline.request)
              ? []
              : [
                  'A cached page may show results from an earlier configuration; capture again with --bypass-page-cache to rule this out.',
                ]),
            'Variant or master IDs the analysis could not match may remain: a storefront tile can show a different variant than the API hit represents.',
          ],
        },
        storefrontOnly,
        ctx.limits,
      ),
    );
  }
  if (apiOnly.length > 0) {
    findings.push(
      buildFinding(
        {
          code: CODE.apiOnly,
          severity: severityByShare(apiOnly.length, compared, ctx.thresholds.warningShare),
          pair: ctx.spec.id,
          message: `With ${engine} search, the API returns products the storefront does not show in ${ofCompared(apiOnly.length, compared)} (${plural(total(apiOnly), 'product')} in total).`,
          likelyCauses: [
            'The storefront likely filters products out, for example products that are not orderable or not available to the shopper.',
            'The page template or custom code may hide some product tiles.',
            'The page may show fewer tiles than the page size requested.',
            'Variant or master IDs the analysis could not match may remain: a storefront tile can show a different variant than the API hit represents.',
          ],
        },
        apiOnly,
        ctx.limits,
      ),
    );
  }
  return findings;
}

function totalsFindings(ctx: ChannelContext): SearchFinding[] {
  const {compared} = ctx.context.diff.summary;
  const affected: Affected[] = [];
  let largest: {query: string; storefront: number; api: number; difference: number} | undefined;
  for (const item of ctx.context.diff.queries) {
    if (!item.results) continue;
    const storefront = item.baseline.total;
    const api = item.candidate.total;
    if (storefront === undefined || api === undefined) continue;
    const larger = Math.max(storefront, api);
    if (larger <= 0) continue;
    const difference = Math.abs(storefront - api) / larger;
    if (!above(difference, ctx.thresholds.totalsRelativeDifference)) continue;
    affected.push({query: item.query, impact: difference});
    if (!largest || difference > largest.difference) largest = {query: item.query, storefront, api, difference};
  }
  if (affected.length === 0 || !largest) return [];

  return [
    buildFinding(
      {
        code: CODE.totalsDiffer,
        severity: severityByShare(affected.length, compared, ctx.thresholds.warningShare),
        pair: ctx.spec.id,
        message: `With ${ctx.engine} search, the result totals of the storefront and the API differ by more than ${percent(ctx.thresholds.totalsRelativeDifference)} in ${ofCompared(affected.length, compared)}. The largest difference is ${quote(largest.query)}: ${largest.storefront} on the storefront, ${largest.api} in the API.`,
        likelyCauses: [
          'The storefront and the API may count products differently, for example when the storefront counts only orderable products or counts variants where the API counts masters.',
          'Custom storefront code may filter or add products after the search ran.',
          ...(usedPageCacheBypass(ctx.context.baseline.request)
            ? []
            : [
                'A cached page may show a total from an earlier configuration; capture again with --bypass-page-cache to rule this out.',
              ]),
        ],
      },
      affected,
      ctx.limits,
    ),
  ];
}

function facetFindings(ctx: ChannelContext): SearchFinding[] {
  const {compared} = ctx.context.diff.summary;
  const storefrontOnly: string[][] = [];
  const apiOnly: string[][] = [];
  const counts: string[][] = [];
  const storefrontOnlyQueries: Affected[] = [];
  const apiOnlyQueries: Affected[] = [];
  const countQueries: Affected[] = [];
  for (const item of ctx.context.diff.queries) {
    const {refinements} = item;
    if (!item.results || !refinements) continue;
    if (refinements.baselineOnly.length > 0) {
      storefrontOnly.push(refinements.baselineOnly);
      storefrontOnlyQueries.push({query: item.query, impact: refinements.baselineOnly.length});
    }
    if (refinements.candidateOnly.length > 0) {
      apiOnly.push(refinements.candidateOnly);
      apiOnlyQueries.push({query: item.query, impact: refinements.candidateOnly.length});
    }
    const withCountChanges = refinements.changed.filter((change) => change.countChanges.length > 0);
    if (withCountChanges.length > 0) {
      counts.push(withCountChanges.map((change) => change.attributeId));
      countQueries.push({
        query: item.query,
        impact: withCountChanges.reduce((sum, change) => sum + change.countChanges.length, 0),
      });
    }
  }

  const findings: SearchFinding[] = [];
  const pageProfileHint =
    'The page profile may not read these filters from the page; check the parse warnings in the storefront capture.';
  if (storefrontOnlyQueries.length > 0) {
    findings.push(
      buildFinding(
        {
          code: CODE.facetsOnlyOnStorefront,
          severity: severityByShare(storefrontOnlyQueries.length, compared, ctx.thresholds.warningShare),
          pair: ctx.spec.id,
          message: `With ${ctx.engine} search, the storefront offers filters the API does not return in ${ofCompared(storefrontOnlyQueries.length, compared)}: ${listCounts(countOccurrences(storefrontOnly))}.`,
          likelyCauses: [
            'Custom storefront code or the template may add filters that are not search refinements.',
            'The page profile may read page elements as filters that are not refinements of the search result.',
            'The refinements may be defined for the storefront category but not returned by the API request.',
          ],
        },
        storefrontOnlyQueries,
        ctx.limits,
      ),
    );
  }
  if (apiOnlyQueries.length > 0) {
    findings.push(
      buildFinding(
        {
          code: CODE.facetsOnlyInApi,
          severity: severityByShare(apiOnlyQueries.length, compared, ctx.thresholds.warningShare),
          pair: ctx.spec.id,
          message: `With ${ctx.engine} search, the API returns filters the storefront does not offer in ${ofCompared(apiOnlyQueries.length, compared)}: ${listCounts(countOccurrences(apiOnly))}.`,
          likelyCauses: [
            'The storefront template may not render these refinements, or custom code may remove them.',
            pageProfileHint,
          ],
        },
        apiOnlyQueries,
        ctx.limits,
      ),
    );
  }
  if (countQueries.length > 0) {
    findings.push(
      buildFinding(
        {
          code: CODE.facetCountsDiffer,
          severity: severityByShare(countQueries.length, compared, ctx.thresholds.warningShare),
          pair: ctx.spec.id,
          message: `With ${ctx.engine} search, the product counts of filter values differ between the storefront and the API in ${ofCompared(countQueries.length, compared)}: ${listCounts(countOccurrences(counts))}.`,
          likelyCauses: [
            'The storefront may count products differently, for example only orderable products, or variants where the API counts masters.',
            'The storefront may apply a category or default refinement the API request did not.',
          ],
        },
        countQueries,
        ctx.limits,
      ),
    );
  }
  return findings;
}

function sortingFindings(ctx: ChannelContext): SearchFinding[] {
  const {compared} = ctx.context.diff.summary;
  const affected: Affected[] = [];
  const storefrontOnly = new Set<string>();
  const apiOnly = new Set<string>();
  for (const item of ctx.context.diff.queries) {
    const {sorting} = item;
    if (!item.results || !sorting) continue;
    if (sorting.baselineOnly.length === 0 && sorting.candidateOnly.length === 0) continue;
    for (const id of sorting.baselineOnly) storefrontOnly.add(id);
    for (const id of sorting.candidateOnly) apiOnly.add(id);
    affected.push({query: item.query, impact: sorting.baselineOnly.length + sorting.candidateOnly.length});
  }
  if (affected.length === 0) return [];

  const details = [
    ...(storefrontOnly.size > 0 ? [`only on the storefront: ${listLimited([...storefrontOnly])}`] : []),
    ...(apiOnly.size > 0 ? [`only in the API: ${listLimited([...apiOnly])}`] : []),
  ];
  return [
    buildFinding(
      {
        code: CODE.sortingOptionsDiffer,
        severity: severityByShare(affected.length, compared, ctx.thresholds.warningShare),
        pair: ctx.spec.id,
        message: `With ${ctx.engine} search, the sorting options differ between the storefront and the API in ${ofCompared(affected.length, compared)}: ${details.join('; ')}.`,
        likelyCauses: [
          'The storefront may offer sorting rules the API does not list, or hide some of them in the template.',
          'Custom sorting rules likely configured for the storefront may not be assigned to the category or search the API request used.',
        ],
      },
      affected,
      ctx.limits,
    ),
  ];
}

function orderFindings(ctx: ChannelContext): SearchFinding[] {
  const {compared} = ctx.context.diff.summary;
  const affected: Affected[] = [];
  for (const [query, lists] of ctx.lists) {
    if (lists.orderMismatches > 0) {
      affected.push({query, impact: lists.orderMismatches, ...(lists.firstSwap && {productIds: lists.firstSwap})});
    }
  }
  if (affected.length === 0) return [];

  return [
    buildFinding(
      {
        code: CODE.orderDiffers,
        severity: severityByShare(affected.length, compared, ctx.thresholds.warningShare),
        pair: ctx.spec.id,
        message: `With ${ctx.engine} search, the storefront and the API rank the products they both return in a different order in ${ofCompared(affected.length, compared)}. The examples show the first two products that swap places: the storefront's, then the API's.`,
        likelyCauses: [
          'Custom sorting rules or sort parameters on the storefront likely re-order the results.',
          'Personalization or shopper context (customer groups, price books, promotions) may influence the order for a shopper but not for the guest API request.',
          ...(usedPageCacheBypass(ctx.context.baseline.request)
            ? []
            : ['A cached page may show an earlier ranking; capture again with --bypass-page-cache to rule this out.']),
        ],
      },
      affected,
      ctx.limits,
    ),
  ];
}

function channelFindings(ctx: ChannelContext): SearchFinding[] {
  if (ctx.context.diff.summary.compared === 0) return [];
  return [
    ...membershipFindings(ctx),
    ...totalsFindings(ctx),
    ...facetFindings(ctx),
    ...sortingFindings(ctx),
    ...orderFindings(ctx),
  ];
}

// --- Lexical against semantic ----------------------------------------------

/** Facet attributes the candidate never returned in the compared queries although the baseline did. */
function facetsNeverReturnedByCandidate(summary: SearchDiffSummary): string[] {
  return summary.refinementAttributes
    .filter((attribute) => attribute.both === 0 && attribute.candidateOnly === 0 && attribute.baselineOnly > 0)
    .map((attribute) => attribute.attributeId);
}

function engineChangeFindings(context: PairContext, limits: Limits): SearchFinding[] {
  const {diff} = context;
  const {summary} = diff;
  if (summary.compared === 0) return [];

  const channel = ROLE_INFO[context.spec.baseline].channel === 'storefront' ? 'storefront' : 'API';
  const k = deepestDepth(summary.meanOverlapAtK);
  const lostFacets = facetsNeverReturnedByCandidate(summary);
  const lostSorting = summary.baseline.sortingOptions.filter((id) => !summary.candidate.sortingOptions.includes(id));
  const gainedSorting = summary.candidate.sortingOptions.filter((id) => !summary.baseline.sortingOptions.includes(id));

  const meanOverlap = k === undefined ? undefined : summary.meanOverlapAtK[String(k)];
  const identical = meanOverlap !== undefined && atLeast(meanOverlap, 1) && summary.top1Agreements === summary.compared;
  const sentences = [
    `Lexical and semantic search compared on the ${channel}${meanOverlap === undefined ? '' : `: the mean overlap at ${k} is ${fixed(meanOverlap)}`}, and the top hit is the same in ${summary.top1Agreements} of ${plural(summary.compared, 'compared query', 'compared queries')}.`,
    ...(lostFacets.length > 0
      ? [
          `Semantic results never include the ${lostFacets.length === 1 ? 'filter' : 'filters'} ${listLimited(lostFacets)}.`,
        ]
      : []),
    ...(lostSorting.length > 0 ? [`Sorting options only lexical search offers: ${listLimited(lostSorting)}.`] : []),
    ...(gainedSorting.length > 0
      ? [`Sorting options only semantic search offers: ${listLimited(gainedSorting)}.`]
      : []),
  ];
  const mainCause = identical
    ? channel === 'storefront'
      ? `Both captures return the same products, so the semantic capture was likely not served by Agentic Commerce Search; check that it is turned on for the site${usedPageCacheBypass(context.candidate.request) ? '.' : ', and capture again with --bypass-page-cache.'}`
      : 'Both requests return the same products, so one engine likely served both; check the search modes that served each request.'
    : 'Semantic search likely matches on meaning rather than on words, so descriptive, misspelled or conversational queries return different products.';

  const affected: Affected[] = [];
  for (const item of diff.queries) {
    const {results} = item;
    if (!results) continue;
    const depths = Object.keys(results.overlap.atK).map(Number);
    const deepest = depths.length > 0 ? results.overlap.atK[String(Math.max(...depths))] : 0;
    const lexicalTop = context.baselineEntries.get(item.query)?.hits[0]?.productId;
    const semanticTop = context.candidateEntries.get(item.query)?.hits[0]?.productId;
    affected.push({
      query: item.query,
      // Less overlap means more change; the number of products that differ breaks ties.
      impact: 1 - deepest + (results.membership.baselineOnlyCount + results.membership.candidateOnlyCount) / 1e6,
      ...(lexicalTop !== undefined &&
        semanticTop !== undefined &&
        lexicalTop !== semanticTop && {productIds: [lexicalTop, semanticTop]}),
    });
  }

  return [
    buildFinding(
      {
        code: CODE.engineChange,
        severity: 'info',
        pair: context.spec.id,
        message: `${sentences.join(' ')} The examples show the top hit of lexical search, then of semantic search.`,
        likelyCauses: [
          mainCause,
          ...(lostFacets.length > 0
            ? ['Filters semantic results never include may not be supported or configured for semantic search.']
            : []),
          ...(lostSorting.length > 0
            ? ['Sorting options only lexical search offers may not be supported for semantic search.']
            : []),
        ],
      },
      affected,
      limits,
    ),
  ];
}

// --- One source ------------------------------------------------------------

interface SourceContext {
  role: SearchSourceRole;
  capture: SearchCapture;
  thresholds: SearchAnalysisThresholds;
  limits: Limits;
  /** The pair this source belongs to when both engines of its channel were given. */
  enginePair?: SearchSourcePairId;
  /** How many of the other sources returned results for a query. */
  othersWithResults: (query: string) => number;
}

function describeFailure(entry: SearchCaptureEntry): string {
  const text = entry.error ?? 'no error message';
  const shortened = text.length > 120 ? `${text.slice(0, 117)}...` : text;
  return entry.status === 0 ? shortened : `HTTP ${entry.status}: ${shortened}`;
}

function failedQueriesFindings(ctx: SourceContext): SearchFinding[] {
  const failed = ctx.capture.results.filter((entry) => isFailed(entry));
  if (failed.length === 0) return [];

  const statuses = new Set(failed.map((entry) => entry.status));
  const storefront = ROLE_INFO[ctx.role].channel === 'storefront';
  const hasStatus = (predicate: (status: number) => boolean) => [...statuses].some((status) => predicate(status));
  const likelyCauses = [
    ...(hasStatus((status) => status === 401 || status === 403)
      ? [
          storefront
            ? 'The storefront may be password protected or may block automated requests; check the storefront password.'
            : 'The shopper token may lack the sfcc.shopper-product-search scope, or the site may not be a channel of the SLAS client.',
        ]
      : []),
    ...(hasStatus((status) => status === 400)
      ? ['The request may be rejected for a query, refinement or sort ID; check the error messages in the capture.']
      : []),
    ...(hasStatus((status) => status === 429)
      ? ['The requests may have been rate limited; capture again with fewer queries.']
      : []),
    ...(hasStatus((status) => status >= 500) || statuses.has(0)
      ? ['The service may have had a temporary error or a timeout; capture again.']
      : []),
    'Check the error messages stored with the failed queries in the capture.',
  ];
  return [
    buildFinding(
      {
        code: CODE.failedQueries,
        severity: 'warning',
        source: ctx.role,
        message: `${sentenceCase(ROLE_INFO[ctx.role].label)}: ${failed.length} of ${plural(ctx.capture.results.length, 'query', 'queries')} failed. The first error is ${describeFailure(failed[0])}.`,
        likelyCauses,
      },
      failed.map((entry) => ({query: entry.query, impact: 1})),
      ctx.limits,
    ),
  ];
}

function modeFallbackFindings(ctx: SourceContext): SearchFinding[] {
  const requested = requestedSearchMode(ctx.capture.request);
  if (requested === undefined) return [];
  const served = ctx.capture.results.filter(
    (entry) => !isFailed(entry) && entry.effectiveSearchMode !== undefined && entry.effectiveSearchMode !== requested,
  );
  if (served.length === 0) return [];

  const succeeded = ctx.capture.results.filter((entry) => !isFailed(entry)).length;
  const modes = unique(served.map((entry) => entry.effectiveSearchMode as string));
  const allFellBack = served.length === succeeded;
  return [
    buildFinding(
      {
        code: CODE.modeFallbacks,
        severity: 'warning',
        source: ctx.role,
        message: `${sentenceCase(ROLE_INFO[ctx.role].label)}: ${served.length} of ${plural(succeeded, 'successful query', 'successful queries')} asked for ${requested} search but ${served.length === 1 ? 'was' : 'were'} served by ${modes.join(' and ')} search.`,
        likelyCauses: [
          ...(allFellBack
            ? [
                `Every query fell back, so ${requested} search is likely not serving this site yet; check how it is set up for the site.`,
              ]
            : []),
          requested === 'semantic'
            ? 'Agentic Commerce Search may not be fully set up for the site yet, for example while its product index is still being built.'
            : 'The platform may serve a different engine than the one requested while the site is being switched.',
          'The platform may fall back for queries the requested engine could not serve, or while it is temporarily unavailable.',
        ],
      },
      served.map((entry) => ({query: entry.query, impact: 1})),
      ctx.limits,
    ),
  ];
}

/** The price order a sort ID names, such as `price-low-to-high` or `price-desc`, if it names one. */
function expectedPriceOrder(sort: string): 'ascending' | 'descending' | undefined {
  const id = sort.toLowerCase();
  if (/low\W*to\W*high|\basc/.test(id)) return 'ascending';
  if (/high\W*to\W*low|\bdesc/.test(id)) return 'descending';
  return undefined;
}

function priceSortFindings(ctx: SourceContext): SearchFinding[] {
  const sort = requestedSort(ctx.capture.request);
  if (sort === undefined || !/price/i.test(sort)) return [];

  const expected = expectedPriceOrder(sort);
  const reversed = expected === 'ascending' ? 'descending' : expected === 'descending' ? 'ascending' : undefined;
  const priced = ctx.capture.results.filter((entry) => !isFailed(entry) && priceOrderOf(entry.hits) !== undefined);
  const misordered = priced.filter((entry) => {
    const order = priceOrderOf(entry.hits);
    return order === 'unordered' || (reversed !== undefined && order === reversed);
  });
  if (misordered.length === 0) return [];

  const anyReversed = reversed !== undefined && misordered.some((entry) => priceOrderOf(entry.hits) === reversed);
  const {engine} = ROLE_INFO[ctx.role];
  return [
    buildFinding(
      {
        code: CODE.priceSortNotApplied,
        severity: 'warning',
        ...(ctx.enginePair && {pair: ctx.enginePair}),
        source: ctx.role,
        message: `${sentenceCase(ROLE_INFO[ctx.role].label)} requested the ${quote(sort)} sort, but the hit prices are not in ${expected ?? 'price'} order in ${misordered.length} of ${plural(priced.length, 'query', 'queries')} with prices.`,
        likelyCauses: [
          engine === 'semantic'
            ? 'Semantic search may ignore the sort and rank by relevance only.'
            : 'The sorting rule may not be a price sort in the site configuration, or the search may not apply it.',
          ...(anyReversed
            ? [`The sorting rule behind ${quote(sort)} may sort prices in the other direction than its name says.`]
            : []),
          'The sort ID may not be one the site offers for this search; compare it with the sorting options in the capture.',
        ],
      },
      misordered.map((entry) => ({query: entry.query, impact: priceMovements(entry, expected)})),
      ctx.limits,
    ),
  ];
}

/**
 * How many times the hit prices move against the expected direction or, without one, against the
 * dominant direction: the more, the less ordered the hits.
 */
function priceMovements(entry: SearchCaptureEntry, expected?: 'ascending' | 'descending'): number {
  const prices = entry.hits
    .map((hit) => hit.price)
    .filter((price): price is number => typeof price === 'number' && Number.isFinite(price));
  let rises = 0;
  let falls = 0;
  for (let index = 1; index < prices.length; index++) {
    if (prices[index] > prices[index - 1]) rises++;
    else if (prices[index] < prices[index - 1]) falls++;
  }
  if (expected === 'ascending') return falls;
  if (expected === 'descending') return rises;
  return Math.min(rises, falls);
}

function identicalListFindings(ctx: SourceContext): SearchFinding[] {
  const withHits = ctx.capture.results.filter((entry) => !isFailed(entry) && entry.hits.length > 0);
  const groups = new Map<string, SearchCaptureEntry[]>();
  for (const entry of withHits) {
    const key = JSON.stringify(idsOf(entry));
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  const shared = [...groups.values()].filter((group) => group.length > 1);
  if (shared.length === 0) return [];

  const sharing = shared.reduce((sum, group) => sum + group.length, 0);
  const largest = Math.max(...shared.map((group) => group.length));
  const affected = shared.flatMap((group) =>
    group.map((entry, index) => ({
      query: entry.query,
      impact: group.length,
      ...(index === 0 && {productIds: idsOf(entry)}),
    })),
  );
  const isStorefront = ROLE_INFO[ctx.role].channel === 'storefront';
  return [
    buildFinding(
      {
        code: CODE.identicalResultLists,
        severity: atLeast(sharing / withHits.length, ctx.thresholds.sharedListShare) ? 'warning' : 'notice',
        source: ctx.role,
        message: `${sentenceCase(ROLE_INFO[ctx.role].label)}: ${plural(sharing, 'query', 'queries')} of ${withHits.length} with results return a result list another query also returns; the largest group is ${largest} queries with exactly the same list (${plural(groups.size, 'distinct list')} across ${withHits.length} queries).`,
        likelyCauses: [
          'The engine may return a default list for queries it cannot interpret.',
          ...(isStorefront
            ? [
                'A cached page or a redirect may serve the same page for different queries; capture again with --bypass-page-cache to rule this out.',
              ]
            : []),
          'Queries that differ only in spelling or plural form can legitimately match the same products.',
        ],
      },
      affected,
      ctx.limits,
    ),
  ];
}

function zeroResultFindings(ctx: SourceContext): SearchFinding[] {
  const succeeded = ctx.capture.results.filter((entry) => !isFailed(entry));
  const empty = succeeded.filter((entry) => entry.hits.length === 0);
  if (empty.length === 0) return [];

  const storefront = ROLE_INFO[ctx.role].channel === 'storefront';
  const found = empty.filter((entry) => ctx.othersWithResults(entry.query) > 0).length;
  const redirected = empty.filter((entry) => entry.redirectedTo !== undefined).length;
  const details = [
    ...(found > 0 ? [`${found} of them ${found === 1 ? 'has' : 'have'} results in another source`] : []),
    ...(redirected > 0 ? [`${redirected} of them ${redirected === 1 ? 'was' : 'were'} redirected`] : []),
  ];
  return [
    buildFinding(
      {
        code: CODE.zeroResults,
        severity: severityByShare(empty.length, succeeded.length, ctx.thresholds.warningShare),
        source: ctx.role,
        message: `${sentenceCase(ROLE_INFO[ctx.role].label)}: ${empty.length} of ${plural(succeeded.length, 'successful query', 'successful queries')} returned no products${details.length > 0 ? ` (${details.join(', ')})` : ''}.`,
        likelyCauses: storefront
          ? [
              'The search may have redirected to another page; check the redirect in the capture.',
              'The page profile may not read the product tiles of this template; check the parse warnings in the capture.',
              'The engine may have found no match for the query.',
            ]
          : [
              'The engine may have found no match for the query.',
              'The locale, currency or refinements of the capture may exclude every product.',
            ],
      },
      empty.map((entry) => ({query: entry.query, impact: ctx.othersWithResults(entry.query)})),
      ctx.limits,
    ),
  ];
}

function sourceFindings(ctx: SourceContext): SearchFinding[] {
  return [
    ...failedQueriesFindings(ctx),
    ...modeFallbackFindings(ctx),
    ...priceSortFindings(ctx),
    ...identicalListFindings(ctx),
    ...zeroResultFindings(ctx),
  ];
}

// --- Across the comparisons ------------------------------------------------

/** Mean overlap of each compared query at depth `k`. */
function overlapByQuery(diff: SearchDiff, k: number): Map<string, number> {
  const overlaps = new Map<string, number>();
  for (const item of diff.queries) {
    const value = item.results?.overlap.atK[String(k)];
    if (value !== undefined) overlaps.set(item.query, value);
  }
  return overlaps;
}

/** The deepest depth both summaries report a mean overlap for. */
function commonDepth(a: SearchDiffSummary, b: SearchDiffSummary): number | undefined {
  const depths = Object.keys(a.meanOverlapAtK)
    .map(Number)
    .filter((k) => b.meanOverlapAtK[String(k)] !== undefined);
  return depths.length > 0 ? Math.max(...depths) : undefined;
}

function channelGapFindings(
  lexical: PairContext,
  semantic: PairContext,
  thresholds: SearchAnalysisThresholds,
  limits: Limits,
): SearchFinding[] {
  const k = commonDepth(lexical.diff.summary, semantic.diff.summary);
  if (k === undefined) return [];
  const lexicalMean = lexical.diff.summary.meanOverlapAtK[String(k)];
  const semanticMean = semantic.diff.summary.meanOverlapAtK[String(k)];
  const drop = lexicalMean - semanticMean;
  if (!atLeast(drop, thresholds.channelGapDrop)) return [];

  const lexicalOverlaps = overlapByQuery(lexical.diff, k);
  const affected: Affected[] = [];
  for (const [query, overlap] of overlapByQuery(semantic.diff, k)) {
    const before = lexicalOverlaps.get(query);
    if (before !== undefined && before > overlap) affected.push({query, impact: before - overlap});
  }

  return [
    buildFinding(
      {
        code: CODE.channelGapGrew,
        severity: 'warning',
        message: `The storefront and the API agree less under semantic search than under lexical search: the mean overlap at ${k} fell from ${fixed(lexicalMean)} to ${fixed(semanticMean)}.`,
        likelyCauses: [
          'Customization on the storefront (a custom search model, sorting or filtering) likely interacts differently with semantic results than with lexical ones.',
          'Shopper context on the storefront (customer groups, price books, personalization) may reshape semantic results.',
          'The storefront semantic capture may not have been served by semantic search; see the engine attribution.',
        ],
      },
      affected,
      limits,
    ),
  ];
}

function attributeEngine(
  vsLexical: SearchDiff,
  vsSemantic: SearchDiff,
  gap: number,
): SearchEngineAttribution | undefined {
  const k = commonDepth(vsLexical.summary, vsSemantic.summary);
  if (k === undefined) return undefined;
  const lexical = vsLexical.summary.meanOverlapAtK[String(k)];
  const semantic = vsSemantic.summary.meanOverlapAtK[String(k)];
  let closerTo: SearchEngineAttribution['closerTo'] = 'unclear';
  if (lexical !== semantic && atLeast(Math.abs(lexical - semantic), gap)) {
    closerTo = lexical > semantic ? 'lexical' : 'semantic';
  }
  return {closerTo, meanOverlapWithLexical: lexical, meanOverlapWithSemantic: semantic, k};
}

function engineMismatchFindings(
  role: 'storefrontLexical' | 'storefrontSemantic',
  attribution: SearchEngineAttribution,
  vsLexical: SearchDiff,
  vsSemantic: SearchDiff,
  request: SearchCaptureRequest,
  limits: Limits,
): SearchFinding[] {
  const expected = ROLE_INFO[role].engine;
  if (attribution.closerTo === 'unclear' || attribution.closerTo === expected) return [];

  const lexicalOverlaps = overlapByQuery(vsLexical, attribution.k);
  const semanticOverlaps = overlapByQuery(vsSemantic, attribution.k);
  const affected: Affected[] = [];
  for (const [query, lexical] of lexicalOverlaps) {
    const semantic = semanticOverlaps.get(query);
    if (semantic === undefined) continue;
    const impact = expected === 'semantic' ? lexical - semantic : semantic - lexical;
    if (impact > 0) affected.push({query, impact});
  }

  const means = `mean overlap at ${attribution.k}: ${fixed(attribution.meanOverlapWithLexical)} with the lexical API results, ${fixed(attribution.meanOverlapWithSemantic)} with the semantic API results`;
  const likelyCauses =
    expected === 'semantic'
      ? [
          'The storefront may not be served by Agentic Commerce Search yet, for example because the change to the site is not in effect for the storefront.',
          'An A/B split may have routed the capture session to the lexical group.',
          ...(usedPageCacheBypass(request)
            ? []
            : ['Cached pages may show results from before the change; capture again with --bypass-page-cache.']),
        ]
      : [
          'Agentic Commerce Search may already have been on for the storefront when this capture was taken.',
          'The lexical and semantic storefront captures may be swapped, or the captures may be labelled the wrong way round.',
          ...(usedPageCacheBypass(request)
            ? []
            : ['Cached pages may show results from after the change; capture again with --bypass-page-cache.']),
        ];
  return [
    buildFinding(
      {
        code: CODE.storefrontEngineMismatch,
        severity: 'warning',
        source: role,
        message: `The ${ROLE_INFO[role].label} capture looks closer to the ${attribution.closerTo} API results than to the ${expected} ones (${means}).`,
        likelyCauses,
      },
      affected,
      limits,
    ),
  ];
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

function findingOrder(finding: SearchFinding): number[] {
  const pairRank = finding.pair ? SEARCH_SOURCE_PAIR_IDS.indexOf(finding.pair) : -1;
  const sourceRank = finding.source ? SEARCH_SOURCE_ROLES.indexOf(finding.source) : -1;
  return [SEVERITY_RANK[finding.severity], pairRank, sourceRank];
}

/** Orders findings by severity, then those about one source or across comparisons before those of a comparison, in comparison order. */
function sortFindings(findings: SearchFinding[]): SearchFinding[] {
  return findings
    .map((finding, index) => ({finding, index, order: findingOrder(finding)}))
    .sort((a, b) => {
      for (const [position, rank] of a.order.entries()) {
        if (rank !== b.order[position]) return rank - b.order[position];
      }
      return a.index - b.index;
    })
    .map(({finding}) => finding);
}

/**
 * Analyzes up to four captures of the same queries at once: the storefront search page and the
 * Shopper Search API, each with lexical (native) and semantic (Agentic Commerce Search) search. Use
 * it to see what turning on Agentic Commerce Search changes, and whether the storefront shows what
 * the API returns.
 *
 * It compares the sources in pairs, using {@link diffSearchCaptures}:
 *
 * - `storefront-vs-scapi-lexical` and `storefront-vs-scapi-semantic` compare the storefront with
 *   the API under the same engine. Differences point at the storefront layer: custom code, caching,
 *   shopper context or filtering.
 * - `scapi-lexical-vs-semantic` and `storefront-lexical-vs-semantic` compare the engines.
 *
 * Before the storefront is compared with the API, a storefront product ID that is the variant an API
 * hit represents counts as that hit's product ID. The captures are not changed.
 *
 * With both API captures and a storefront capture, it also judges which engine each storefront
 * capture looks like. It then lists findings: what differs, how many queries it affects, and what
 * is likely behind it. Findings come from fixed thresholds, so the same captures always give the same
 * findings. They are leads to check; there is no pass or fail verdict.
 *
 * @param sources - The captures, by role. At least two are required.
 * @param options - Depths, how many examples to keep, and the thresholds
 * @returns The sources, the comparisons, the engine attribution and the findings
 * @throws Error when fewer than two sources are given, a capture is not valid, or a capture does
 *   not match its role (a storefront role needs a storefront capture, an API role needs a Shopper
 *   Search capture)
 *
 * @example
 * ```typescript
 * const analysis = analyzeSearchSources({
 *   storefrontLexical,
 *   storefrontSemantic,
 *   scapiLexical,
 *   scapiSemantic,
 * });
 * for (const finding of analysis.findings) {
 *   console.log(`${finding.severity} ${finding.code}: ${finding.message}`);
 * }
 * ```
 */
export function analyzeSearchSources(
  sources: SearchSources,
  options: AnalyzeSearchSourcesOptions = {},
): SearchSourceAnalysis {
  const settings = resolveOptions(options);
  const {kValues, limits, thresholds} = settings;
  const warnings: string[] = [];
  const provided = validateSources(sources, warnings);
  warnings.push(...missingQueryWarnings(provided));
  const captures = new Map(provided);

  // The diffs between a storefront and an API capture, kept so the engine attribution can reuse them.
  const channelDiffs = new Map<string, Omit<PairContext, 'spec'>>();
  const compareChannel = (storefront: SearchSourceRole, api: SearchSourceRole) => {
    const key = `${storefront}:${api}`;
    let result = channelDiffs.get(key);
    if (!result) {
      result = compareSources(storefront, api, captures, kValues);
      channelDiffs.set(key, result);
    }
    return result;
  };

  const contexts: PairContext[] = [];
  for (const spec of PAIR_SPECS) {
    if (!captures.has(spec.baseline) || !captures.has(spec.candidate)) continue;
    const result = isChannelPair(spec)
      ? compareChannel(spec.baseline, spec.candidate)
      : compareSources(spec.baseline, spec.candidate, captures, kValues);
    contexts.push({spec, ...result});
  }
  const contextOf = (id: SearchSourcePairId) => contexts.find((context) => context.spec.id === id);

  // Findings about the sources.
  const findings: SearchFinding[] = [];
  const summaries: SearchSourceAnalysis['sources'] = {};
  const entriesByRole = new Map(provided.map(([role, capture]) => [role, byQuery(capture)]));
  for (const [role, capture] of provided) {
    const stats = summarizeSide(capture, capture.results);
    summaries[role] = {
      label: capture.label,
      capturedAt: capture.capturedAt,
      source: sourceOf(capture.request),
      queries: capture.results.length,
      effectiveSearchModes: stats.effectiveSearchModes,
    };
    const hasResults = (other: SearchSourceRole, query: string) => {
      const entry = entriesByRole.get(other)?.get(query);
      return entry !== undefined && !isFailed(entry) && entry.hits.length > 0;
    };
    const enginePair = (['scapi-lexical-vs-semantic', 'storefront-lexical-vs-semantic'] as const).find((id) => {
      const spec = PAIR_SPECS.find((candidate) => candidate.id === id);
      return spec !== undefined && contextOf(id) !== undefined && [spec.baseline, spec.candidate].includes(role);
    });
    findings.push(
      ...sourceFindings({
        role,
        capture,
        thresholds,
        limits,
        enginePair,
        othersWithResults: (query) => provided.filter(([other]) => other !== role && hasResults(other, query)).length,
      }),
    );
  }

  // Findings about the comparisons.
  for (const context of contexts) {
    findings.push(
      ...(isChannelPair(context.spec)
        ? channelFindings(channelContext(context, thresholds, limits))
        : engineChangeFindings(context, limits)),
    );
  }

  // Findings across the comparisons.
  const lexicalChannel = contextOf('storefront-vs-scapi-lexical');
  const semanticChannel = contextOf('storefront-vs-scapi-semantic');
  if (lexicalChannel && semanticChannel) {
    findings.push(...channelGapFindings(lexicalChannel, semanticChannel, thresholds, limits));
  }

  let engineAttribution: SearchSourceAnalysis['engineAttribution'];
  if (captures.has('scapiLexical') && captures.has('scapiSemantic')) {
    for (const role of ['storefrontLexical', 'storefrontSemantic'] as const) {
      if (!captures.has(role)) continue;
      const vsLexical = compareChannel(role, 'scapiLexical');
      const vsSemantic = compareChannel(role, 'scapiSemantic');
      const attribution = attributeEngine(vsLexical.diff, vsSemantic.diff, thresholds.engineAttributionGap);
      if (!attribution) continue;
      engineAttribution = {...engineAttribution, [role]: attribution};
      findings.push(
        ...engineMismatchFindings(
          role,
          attribution,
          vsLexical.diff,
          vsSemantic.diff,
          (captures.get(role) as SearchCapture).request,
          limits,
        ),
      );
    }
  }

  return {
    schemaVersion: SEARCH_CAPTURE_SCHEMA_VERSION,
    kValues,
    sources: summaries,
    pairs: contexts.map((context) => toPair(context)),
    ...(engineAttribution && {engineAttribution}),
    findings: sortFindings(findings),
    warnings: provided.length > 0 && contexts.length === 0 ? [...warnings, noPairWarning(provided)] : warnings,
  };
}

function noPairWarning(provided: ProvidedSource[]): string {
  return `The sources given (${provided.map(([role]) => role).join(', ')}) form no comparison: pair a storefront source with the API source of the same engine (storefrontLexical with scapiLexical, storefrontSemantic with scapiSemantic), or the lexical and semantic sources of one channel`;
}
