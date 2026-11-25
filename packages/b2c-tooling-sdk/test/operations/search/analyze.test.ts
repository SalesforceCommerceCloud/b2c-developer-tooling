/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  analyzeSearchSources,
  DEFAULT_ANALYSIS_MAX_EXAMPLES,
  DEFAULT_ANALYSIS_MAX_QUERIES,
  DEFAULT_SEARCH_ANALYSIS_THRESHOLDS,
  diffSearchCaptures,
  SEARCH_CAPTURE_SCHEMA_VERSION,
  SEARCH_FINDING_CODES,
  SEARCH_SOURCE_PAIR_IDS,
  SEARCH_SOURCE_ROLES,
  type AnalyzeSearchSourcesOptions,
  type CapturedRefinement,
  type ScapiSearchCaptureRequest,
  type SearchCapture,
  type SearchCaptureEntry,
  type SearchFinding,
  type SearchMode,
  type SearchSourceAnalysis,
  type SearchSources,
  type StorefrontSearchCaptureRequest,
} from '@salesforce/b2c-tooling-sdk/operations/search';

const CAPTURED_AT = '2026-01-01T00:00:00.000Z';

/** `prefix1`, `prefix2`, ... */
function ids(prefix: string, count: number): string[] {
  return Array.from({length: count}, (_, index) => `${prefix}${index + 1}`);
}

function entry(query: string, hitIds: string[], overrides: Partial<SearchCaptureEntry> = {}): SearchCaptureEntry {
  return {
    query,
    status: 200,
    latencyMs: 10,
    total: hitIds.length,
    hits: hitIds.map((productId) => ({productId})),
    refinements: [],
    ...overrides,
  };
}

function failedEntry(query: string, status: number, error: string): SearchCaptureEntry {
  return {query, status, error, latencyMs: 10, hits: [], refinements: []};
}

/** An entry whose hits have the given prices, in order. */
function pricedEntry(query: string, prices: number[]): SearchCaptureEntry {
  const hitIds = prices.map((_, index) => `${query}-${index + 1}`);
  return entry(query, hitIds, {hits: prices.map((price, index) => ({productId: hitIds[index], price}))});
}

function brand(hitCount: number): CapturedRefinement {
  return {attributeId: 'brand', label: 'Brand', values: [{value: 'Acme', hitCount}]};
}

function scapi(
  label: string,
  mode: SearchMode | undefined,
  results: SearchCaptureEntry[],
  request: Partial<ScapiSearchCaptureRequest> = {},
): SearchCapture {
  return {
    schemaVersion: SEARCH_CAPTURE_SCHEMA_VERSION,
    label,
    capturedAt: CAPTURED_AT,
    request: {
      source: 'scapi',
      organizationId: 'f_ecom_abcd_123',
      siteId: 'RefArch',
      limit: 25,
      ...(mode && {searchMode: mode}),
      ...request,
    },
    results,
  };
}

function storefront(
  label: string,
  results: SearchCaptureEntry[],
  request: Partial<StorefrontSearchCaptureRequest> = {},
): SearchCapture {
  return {
    schemaVersion: SEARCH_CAPTURE_SCHEMA_VERSION,
    label,
    capturedAt: CAPTURED_AT,
    request: {
      host: 'www.example.com',
      siteId: 'RefArch',
      path: '/on/demandware.store/Sites-RefArch-Site/default/Search-Show',
      limit: 25,
      ...request,
      source: 'storefront',
    },
    results,
  };
}

const lexicalApi = (results: SearchCaptureEntry[], request?: Partial<ScapiSearchCaptureRequest>) =>
  scapi('api-lexical', 'lexical', results, request);
const semanticApi = (results: SearchCaptureEntry[], request?: Partial<ScapiSearchCaptureRequest>) =>
  scapi('api-semantic', 'semantic', results, request);
const lexicalStorefront = (results: SearchCaptureEntry[], request?: Partial<StorefrontSearchCaptureRequest>) =>
  storefront('storefront-lexical', results, request);
const semanticStorefront = (results: SearchCaptureEntry[], request?: Partial<StorefrontSearchCaptureRequest>) =>
  storefront('storefront-semantic', results, request);

/** The storefront lexical capture against the API lexical capture: the first same-engine pair. */
function lexicalChannel(
  storefrontEntries: SearchCaptureEntry[],
  apiEntries: SearchCaptureEntry[],
  options?: AnalyzeSearchSourcesOptions,
): SearchSourceAnalysis {
  return analyzeSearchSources(
    {storefrontLexical: lexicalStorefront(storefrontEntries), scapiLexical: lexicalApi(apiEntries)},
    options,
  );
}

function findingsOf(analysis: SearchSourceAnalysis, code: string): SearchFinding[] {
  return analysis.findings.filter((finding) => finding.code === code);
}

/** The one finding with the code. */
function only(analysis: SearchSourceAnalysis, code: string): SearchFinding {
  const found = findingsOf(analysis, code);
  expect(found, `findings with code ${code}`).to.have.lengthOf(1);
  return found[0];
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

const QUERIES = ['shirt', 'red dress'];

/** Four captures of the same queries with the same results everywhere: the engines and channels agree. */
function agreeingSources(): Required<SearchSources> {
  const results = () => QUERIES.map((query) => entry(query, ids(`${query}-`, 3)));
  return {
    storefrontLexical: lexicalStorefront(results()),
    storefrontSemantic: semanticStorefront(results()),
    scapiLexical: lexicalApi(results()),
    scapiSemantic: semanticApi(results().map((item) => ({...item, effectiveSearchMode: 'semantic' as const}))),
  };
}

/** A list of 20 product IDs that shares its first `shared` IDs with `base`. */
function sharing(base: string[], shared: number, prefix: string): string[] {
  return [...base.slice(0, shared), ...ids(prefix, base.length - shared)];
}

describe('operations/search analyze', () => {
  describe('exports', () => {
    it('lists the roles and the pairs in report order', () => {
      expect(SEARCH_SOURCE_ROLES).to.deep.equal([
        'storefrontLexical',
        'storefrontSemantic',
        'scapiLexical',
        'scapiSemantic',
      ]);
      expect(SEARCH_SOURCE_PAIR_IDS).to.deep.equal([
        'storefront-vs-scapi-lexical',
        'storefront-vs-scapi-semantic',
        'scapi-lexical-vs-semantic',
        'storefront-lexical-vs-semantic',
      ]);
    });

    it('documents the finding codes', () => {
      expect([...SEARCH_FINDING_CODES].sort()).to.deep.equal(
        [
          'api-only-products',
          'channel-gap-grew',
          'engine-change',
          'facet-counts-differ',
          'facets-only-in-api',
          'facets-only-on-storefront',
          'failed-queries',
          'identical-result-lists',
          'mode-fallbacks',
          'order-differs',
          'price-sort-not-applied',
          'sorting-options-differ',
          'storefront-engine-mismatch',
          'storefront-only-products',
          'totals-differ',
          'zero-results',
        ].sort(),
      );
    });

    it('documents the default thresholds and limits', () => {
      expect(DEFAULT_SEARCH_ANALYSIS_THRESHOLDS).to.deep.equal({
        engineAttributionGap: 0.15,
        channelGapDrop: 0.2,
        totalsRelativeDifference: 0.1,
        warningShare: 0.1,
        sharedListShare: 0.2,
      });
      expect(Object.isFrozen(DEFAULT_SEARCH_ANALYSIS_THRESHOLDS)).to.equal(true);
      expect(DEFAULT_ANALYSIS_MAX_EXAMPLES).to.equal(5);
      expect(DEFAULT_ANALYSIS_MAX_QUERIES).to.equal(10);
    });
  });

  describe('validation', () => {
    it('requires at least two sources', () => {
      expect(() => analyzeSearchSources({})).to.throw('At least two search sources are required (got 0)');
      expect(() => analyzeSearchSources({scapiLexical: lexicalApi([])})).to.throw(
        'At least two search sources are required (got 1)',
      );
    });

    it('does not count a role that is set to undefined', () => {
      expect(() =>
        analyzeSearchSources({scapiLexical: lexicalApi([]), scapiSemantic: undefined, storefrontLexical: undefined}),
      ).to.throw('At least two search sources are required (got 1)');
    });

    it('rejects a role it does not know', () => {
      const sources = {scapiLexical: lexicalApi([]), scapiSemantic: semanticApi([]), other: lexicalApi([])};
      expect(() => analyzeSearchSources(sources as unknown as SearchSources)).to.throw(
        'Unknown search source role "other"',
      );
    });

    it('rejects sources that are not an object', () => {
      expect(() => analyzeSearchSources(null as unknown as SearchSources)).to.throw('sources must be an object');
    });

    it('names the role when a storefront role is given an API capture', () => {
      expect(() => analyzeSearchSources({storefrontLexical: lexicalApi([]), scapiLexical: lexicalApi([])})).to.throw(
        'The storefrontLexical source must be a storefront capture, but its request source is "scapi"',
      );
      expect(() => analyzeSearchSources({storefrontSemantic: lexicalApi([]), scapiSemantic: semanticApi([])})).to.throw(
        'The storefrontSemantic source must be a storefront capture',
      );
    });

    it('names the role when an API role is given a storefront capture', () => {
      expect(() =>
        analyzeSearchSources({storefrontLexical: lexicalStorefront([]), scapiLexical: lexicalStorefront([])}),
      ).to.throw('The scapiLexical source must be a scapi capture, but its request source is "storefront"');
      expect(() =>
        analyzeSearchSources({storefrontLexical: lexicalStorefront([]), scapiSemantic: lexicalStorefront([])}),
      ).to.throw('The scapiSemantic source must be a scapi capture');
    });

    it('names the role when a source is not a capture', () => {
      const wrongVersion = {...semanticApi([]), schemaVersion: 2} as unknown as SearchCapture;
      expect(() => analyzeSearchSources({scapiLexical: lexicalApi([]), scapiSemantic: wrongVersion})).to.throw(
        'The scapiSemantic source is not a search capture with schemaVersion 1 (got 2)',
      );

      const notACapture = {} as unknown as SearchCapture;
      expect(() => analyzeSearchSources({scapiLexical: lexicalApi([]), storefrontLexical: notACapture})).to.throw(
        'The storefrontLexical source is not a search capture with schemaVersion 1 (got undefined)',
      );

      const noResults = {...lexicalApi([]), results: undefined} as unknown as SearchCapture;
      expect(() => analyzeSearchSources({scapiLexical: noResults, scapiSemantic: semanticApi([])})).to.throw(
        'The scapiLexical source is not a search capture',
      );
    });

    it('names the role when a capture has no request settings', () => {
      const noRequest = {...lexicalApi([]), request: undefined} as unknown as SearchCapture;
      expect(() => analyzeSearchSources({scapiLexical: noRequest, scapiSemantic: semanticApi([])})).to.throw(
        'The scapiLexical source has no request settings',
      );
    });

    it('treats a capture whose request has no source as an API capture', () => {
      const old = lexicalApi([entry('shoes', ['a'])]);
      const {source: _source, ...request} = old.request as ScapiSearchCaptureRequest;
      const analysis = analyzeSearchSources({
        scapiLexical: {...old, request},
        scapiSemantic: semanticApi([entry('shoes', ['a'])]),
      });

      expect(analysis.sources.scapiLexical?.source).to.equal('scapi');
      expect(analysis.pairs.map((pair) => pair.id)).to.deep.equal(['scapi-lexical-vs-semantic']);
    });

    it('warns, without failing, when an API role did not request its search mode', () => {
      const analysis = analyzeSearchSources({
        scapiLexical: scapi('default', undefined, [entry('shoes', ['a'])]),
        scapiSemantic: scapi('lexical-again', 'lexical', [entry('shoes', ['a'])]),
      });

      expect(analysis.warnings).to.include(
        'The scapiLexical source did not request a search mode, so the site default engine served it and it may not be a lexical capture',
      );
      expect(analysis.warnings).to.include('The scapiSemantic source requested the lexical search mode, not semantic');
    });

    it('has no warnings when every role matches its capture and the queries agree', () => {
      expect(analyzeSearchSources(agreeingSources()).warnings).to.deep.equal([]);
    });

    it('rejects invalid options', () => {
      const sources = agreeingSources();
      expect(() => analyzeSearchSources(sources, {kValues: []})).to.throw(
        'kValues must contain at least one positive integer',
      );
      expect(() => analyzeSearchSources(sources, {kValues: [0, -1]})).to.throw(
        'kValues must contain at least one positive integer',
      );
      expect(() => analyzeSearchSources(sources, {maxExamples: -1})).to.throw(
        'maxExamples must be a non-negative integer',
      );
      expect(() => analyzeSearchSources(sources, {maxQueries: 1.5})).to.throw(
        'maxQueries must be a non-negative integer',
      );
      expect(() => analyzeSearchSources(sources, {thresholds: {channelGapDrop: -0.1}})).to.throw(
        'Threshold channelGapDrop must be a non-negative number',
      );
      expect(() => analyzeSearchSources(sources, {thresholds: {warningShare: Number.NaN}})).to.throw(
        'Threshold warningShare must be a non-negative number',
      );
    });
  });

  describe('sources and pairs', () => {
    it('summarizes each source', () => {
      const analysis = analyzeSearchSources(agreeingSources());

      expect(analysis.schemaVersion).to.equal(SEARCH_CAPTURE_SCHEMA_VERSION);
      expect(analysis.sources).to.deep.equal({
        storefrontLexical: {
          label: 'storefront-lexical',
          capturedAt: CAPTURED_AT,
          source: 'storefront',
          queries: 2,
          effectiveSearchModes: {unreported: 2},
        },
        storefrontSemantic: {
          label: 'storefront-semantic',
          capturedAt: CAPTURED_AT,
          source: 'storefront',
          queries: 2,
          effectiveSearchModes: {unreported: 2},
        },
        scapiLexical: {
          label: 'api-lexical',
          capturedAt: CAPTURED_AT,
          source: 'scapi',
          queries: 2,
          effectiveSearchModes: {unreported: 2},
        },
        scapiSemantic: {
          label: 'api-semantic',
          capturedAt: CAPTURED_AT,
          source: 'scapi',
          queries: 2,
          effectiveSearchModes: {semantic: 2},
        },
      });
    });

    it('compares the four sources in four pairs, in order', () => {
      const analysis = analyzeSearchSources(agreeingSources());

      expect(analysis.pairs.map((pair) => [pair.id, pair.baseline, pair.candidate])).to.deep.equal([
        ['storefront-vs-scapi-lexical', 'storefrontLexical', 'scapiLexical'],
        ['storefront-vs-scapi-semantic', 'storefrontSemantic', 'scapiSemantic'],
        ['scapi-lexical-vs-semantic', 'scapiLexical', 'scapiSemantic'],
        ['storefront-lexical-vs-semantic', 'storefrontLexical', 'storefrontSemantic'],
      ]);
      for (const pair of analysis.pairs) {
        expect(pair.summary.compared).to.equal(2);
        expect(pair.summary.meanOverlapAtK).to.deep.equal({'1': 1, '3': 1});
      }
    });

    it('does not depend on the order of the keys it is given', () => {
      const sources = agreeingSources();
      const reordered: SearchSources = {
        scapiSemantic: sources.scapiSemantic,
        scapiLexical: sources.scapiLexical,
        storefrontSemantic: sources.storefrontSemantic,
        storefrontLexical: sources.storefrontLexical,
      };

      expect(analyzeSearchSources(reordered)).to.deep.equal(analyzeSearchSources(sources));
    });

    it('builds only the pairs whose two sources were given', () => {
      const sources = agreeingSources();
      const pairIds = (given: SearchSources) => analyzeSearchSources(given).pairs.map((pair) => pair.id);

      expect(pairIds({storefrontLexical: sources.storefrontLexical, scapiLexical: sources.scapiLexical})).to.deep.equal(
        ['storefront-vs-scapi-lexical'],
      );
      expect(
        pairIds({storefrontSemantic: sources.storefrontSemantic, scapiSemantic: sources.scapiSemantic}),
      ).to.deep.equal(['storefront-vs-scapi-semantic']);
      expect(pairIds({scapiLexical: sources.scapiLexical, scapiSemantic: sources.scapiSemantic})).to.deep.equal([
        'scapi-lexical-vs-semantic',
      ]);
      expect(
        pairIds({storefrontLexical: sources.storefrontLexical, storefrontSemantic: sources.storefrontSemantic}),
      ).to.deep.equal(['storefront-lexical-vs-semantic']);
      expect(
        pairIds({
          storefrontLexical: sources.storefrontLexical,
          scapiLexical: sources.scapiLexical,
          scapiSemantic: sources.scapiSemantic,
        }),
      ).to.deep.equal(['storefront-vs-scapi-lexical', 'scapi-lexical-vs-semantic']);
    });

    it('warns when the sources given form no pair', () => {
      const sources = agreeingSources();
      const analysis = analyzeSearchSources({
        storefrontLexical: sources.storefrontLexical,
        scapiSemantic: sources.scapiSemantic,
      });

      expect(analysis.pairs).to.deep.equal([]);
      expect(analysis.findings.filter((finding) => finding.pair)).to.deep.equal([]);
      expect(analysis.warnings).to.have.lengthOf(1);
      expect(analysis.warnings[0]).to.include('storefrontLexical, scapiSemantic');
      expect(analysis.warnings[0]).to.include('form no comparison');
    });

    it('takes each pair summary from the diff of its two captures', () => {
      const sources = agreeingSources();
      const analysis = analyzeSearchSources({scapiLexical: sources.scapiLexical, scapiSemantic: sources.scapiSemantic});
      const diff = diffSearchCaptures(sources.scapiLexical, sources.scapiSemantic);

      expect(analysis.pairs[0].summary).to.deep.equal(diff.summary);
      expect(analysis.kValues).to.deep.equal(diff.kValues);
    });

    it('reports overlap at the depths asked for', () => {
      const analysis = analyzeSearchSources(agreeingSources(), {kValues: [3, 1, 3, 2]});

      expect(analysis.kValues).to.deep.equal([1, 2, 3]);
      expect(Object.keys(analysis.pairs[0].summary.meanOverlapAtK)).to.deep.equal(['1', '2', '3']);
    });

    it('carries the differences between the two captures into the pair warnings', () => {
      const sources = agreeingSources();
      const analysis = analyzeSearchSources({
        storefrontLexical: sources.storefrontLexical,
        scapiLexical: lexicalApi([entry('shirt', ids('shirt-', 3))], {limit: 10}),
        scapiSemantic: semanticApi([entry('shirt', ids('shirt-', 3))], {limit: 40}),
      });

      const [channelPair, enginePair] = analysis.pairs;
      expect(channelPair.warnings.join(' ')).to.include('The captures come from different sources');
      expect(channelPair.warnings.join(' ')).to.include('Captures differ in limit: baseline 25, candidate 10');
      expect(enginePair.warnings).to.deep.equal(['Captures differ in limit: baseline 10, candidate 40']);
    });

    it('says when no query can be compared', () => {
      const analysis = analyzeSearchSources({
        scapiLexical: lexicalApi([entry('shoes', ['a'])]),
        scapiSemantic: semanticApi([entry('boots', ['b'])]),
      });

      expect(analysis.pairs[0].summary.compared).to.equal(0);
      expect(analysis.pairs[0].warnings).to.include(
        'No query could be compared: none appears in both captures with both requests succeeding',
      );
      expect(findingsOf(analysis, 'engine-change')).to.deep.equal([]);
    });

    it('warns about queries some sources lack', () => {
      const analysis = analyzeSearchSources({
        storefrontLexical: lexicalStorefront([entry('shirt', ['a']), entry('dress', ['b'])]),
        scapiLexical: lexicalApi([entry('shirt', ['a'])]),
      });

      expect(analysis.warnings).to.deep.equal([
        'The scapiLexical source has no result for 1 query that other sources have: "dress"',
      ]);
    });

    it('lists at most a few of the missing queries', () => {
      const analysis = analyzeSearchSources({
        storefrontLexical: lexicalStorefront([
          entry('shirt', ['a']),
          ...ids('q', 7).map((query) => entry(query, ['b'])),
        ]),
        scapiLexical: lexicalApi([entry('shirt', ['a'])]),
      });

      expect(analysis.warnings).to.deep.equal([
        'The scapiLexical source has no result for 7 queries that other sources have: "q1", "q2", "q3", "q4", "q5" and 2 more',
      ]);
    });
  });

  describe('storefront products that stand for API products', () => {
    const variantApi = () =>
      entry('shirt', ['m1', 'p2'], {
        hits: [{productId: 'm1', representedProductId: 'v-red'}, {productId: 'p2'}],
      });

    it('counts a storefront variant as the API product that represents it', () => {
      const analysis = lexicalChannel([entry('shirt', ['v-red', 'p2'])], [variantApi()], {kValues: [2]});

      const [pair] = analysis.pairs;
      expect(pair.idsMatchedThroughRepresentedProduct).to.equal(1);
      expect(pair.summary.meanOverlapAtK).to.deep.equal({'2': 1});
      expect(pair.summary.top1Agreements).to.equal(1);
      expect(findingsOf(analysis, 'storefront-only-products')).to.deep.equal([]);
      expect(findingsOf(analysis, 'api-only-products')).to.deep.equal([]);
      expect(findingsOf(analysis, 'order-differs')).to.deep.equal([]);
    });

    it('counts a variant tile and its master tile as one API product', () => {
      const analysis = lexicalChannel([entry('shirt', ['v-red', 'm1', 'p2'])], [variantApi()], {kValues: [2]});

      const [pair] = analysis.pairs;
      expect(pair.idsMatchedThroughRepresentedProduct).to.equal(1);
      expect(pair.summary.meanOverlapAtK).to.deep.equal({'2': 1});
      expect(findingsOf(analysis, 'order-differs')).to.deep.equal([]);
    });

    it('keeps an ID the storefront shows when the API has no product for it', () => {
      const analysis = lexicalChannel([entry('shirt', ['v-blue', 'p2'])], [variantApi()], {kValues: [2]});

      expect(analysis.pairs[0].idsMatchedThroughRepresentedProduct).to.equal(0);
      expect(analysis.pairs[0].summary.meanOverlapAtK).to.deep.equal({'2': 0.5});
      expect(only(analysis, 'storefront-only-products').examples).to.deep.equal([
        {query: 'shirt', productIds: ['v-blue']},
      ]);
    });

    it('does not map an ID the API returns itself', () => {
      const api = entry('shirt', ['a', 'b'], {
        hits: [{productId: 'a', representedProductId: 'b'}, {productId: 'b'}],
      });
      const analysis = lexicalChannel([entry('shirt', ['a', 'b'])], [api], {kValues: [2]});

      expect(analysis.pairs[0].idsMatchedThroughRepresentedProduct).to.equal(0);
      expect(analysis.pairs[0].summary.meanOverlapAtK).to.deep.equal({'2': 1});
    });

    it('counts the matches over all queries, for each pair', () => {
      const second = entry('dress', ['m3'], {hits: [{productId: 'm3', representedProductId: 'v-blue'}]});
      const analysis = analyzeSearchSources({
        storefrontLexical: lexicalStorefront([entry('shirt', ['v-red', 'p2']), entry('dress', ['v-blue'])]),
        storefrontSemantic: semanticStorefront([entry('shirt', ['v-red', 'p2'])]),
        scapiLexical: lexicalApi([variantApi(), second]),
        scapiSemantic: semanticApi([variantApi()]),
      });

      const matched = Object.fromEntries(
        analysis.pairs.map((pair) => [pair.id, pair.idsMatchedThroughRepresentedProduct]),
      );
      expect(matched).to.deep.equal({
        'storefront-vs-scapi-lexical': 2,
        'storefront-vs-scapi-semantic': 1,
        'scapi-lexical-vs-semantic': 0,
        'storefront-lexical-vs-semantic': 0,
      });
    });

    it('does not match IDs between sources of the same channel', () => {
      const analysis = analyzeSearchSources({
        scapiLexical: lexicalApi([variantApi()]),
        scapiSemantic: semanticApi([entry('shirt', ['v-red', 'p2'])]),
      });

      expect(analysis.pairs[0].idsMatchedThroughRepresentedProduct).to.equal(0);
      expect(analysis.pairs[0].summary.top1Agreements).to.equal(0);
    });

    it('matches IDs in the storefront and API captures without changing them', () => {
      const sources = deepFreeze({
        storefrontLexical: lexicalStorefront([entry('shirt', ['v-red', 'p2'])]),
        storefrontSemantic: semanticStorefront([entry('shirt', ['v-red', 'p2'])]),
        scapiLexical: lexicalApi([variantApi()]),
        scapiSemantic: semanticApi([variantApi()]),
      });
      const before = structuredClone(sources);

      const analysis = analyzeSearchSources(sources);

      expect(analysis.pairs[0].idsMatchedThroughRepresentedProduct).to.equal(1);
      expect(sources).to.deep.equal(before);
      expect(sources.storefrontLexical.results[0].hits.map((hit) => hit.productId)).to.deep.equal(['v-red', 'p2']);
    });

    it('does not match IDs of a query that failed', () => {
      const analysis = lexicalChannel([failedEntry('shirt', 500, 'boom')], [variantApi()]);

      expect(analysis.pairs[0].idsMatchedThroughRepresentedProduct).to.equal(0);
      expect(analysis.pairs[0].summary.compared).to.equal(0);
    });
  });

  describe('engine attribution', () => {
    const base = ids('s', 20);

    /** The storefront semantic capture shares `lexicalShared` of its 20 products with the lexical API, `semanticShared` with the semantic API. */
    function attribute(lexicalShared: number, semanticShared: number, options?: AnalyzeSearchSourcesOptions) {
      return analyzeSearchSources(
        {
          storefrontSemantic: semanticStorefront([entry('shoes', base)]),
          scapiLexical: lexicalApi([entry('shoes', sharing(base, lexicalShared, 'l'))]),
          scapiSemantic: semanticApi([entry('shoes', sharing(base, semanticShared, 'm'))]),
        },
        {kValues: [20], ...options},
      ).engineAttribution?.storefrontSemantic;
    }

    it('says which engine a storefront capture is closer to', () => {
      expect(attribute(18, 8)).to.deep.equal({
        closerTo: 'lexical',
        meanOverlapWithLexical: 0.9,
        meanOverlapWithSemantic: 0.4,
        k: 20,
      });
      expect(attribute(6, 16)).to.deep.equal({
        closerTo: 'semantic',
        meanOverlapWithLexical: 0.3,
        meanOverlapWithSemantic: 0.8,
        k: 20,
      });
    });

    it('says unclear when the two overlaps are close', () => {
      expect(attribute(17, 15)?.closerTo).to.equal('unclear');
      expect(attribute(10, 10)?.closerTo).to.equal('unclear');
    });

    it('decides at a gap of exactly 0.15', () => {
      expect(attribute(17, 14)?.closerTo).to.equal('lexical');
      expect(attribute(14, 17)?.closerTo).to.equal('semantic');
      expect(attribute(17, 15)?.closerTo).to.equal('unclear');
    });

    it('uses the gap given in the thresholds', () => {
      expect(attribute(17, 14, {thresholds: {engineAttributionGap: 0.2}})?.closerTo).to.equal('unclear');
      expect(attribute(17, 15, {thresholds: {engineAttributionGap: 0.1}})?.closerTo).to.equal('lexical');
    });

    it('measures at the deepest depth both comparisons reach', () => {
      const list = ids('s', 20);
      const analysis = analyzeSearchSources({
        storefrontLexical: lexicalStorefront([entry('shoes', list)]),
        scapiLexical: lexicalApi([entry('shoes', list)]),
        scapiSemantic: semanticApi([entry('shoes', sharing(list, 5, 'm'))]),
      });

      expect(analysis.engineAttribution?.storefrontLexical).to.deep.equal({
        closerTo: 'lexical',
        meanOverlapWithLexical: 1,
        meanOverlapWithSemantic: 0.5,
        k: 10,
      });
    });

    it('judges each storefront capture', () => {
      const analysis = analyzeSearchSources(
        {
          storefrontLexical: lexicalStorefront([entry('shoes', base)]),
          storefrontSemantic: semanticStorefront([entry('shoes', base)]),
          scapiLexical: lexicalApi([entry('shoes', sharing(base, 20, 'l'))]),
          scapiSemantic: semanticApi([entry('shoes', sharing(base, 4, 'm'))]),
        },
        {kValues: [20]},
      );

      expect(analysis.engineAttribution?.storefrontLexical?.closerTo).to.equal('lexical');
      expect(analysis.engineAttribution?.storefrontSemantic?.closerTo).to.equal('lexical');
    });

    it('is left out without both API captures', () => {
      const sources = agreeingSources();

      expect(
        analyzeSearchSources({storefrontLexical: sources.storefrontLexical, scapiLexical: sources.scapiLexical})
          .engineAttribution,
      ).to.equal(undefined);
      expect(
        analyzeSearchSources({storefrontSemantic: sources.storefrontSemantic, scapiSemantic: sources.scapiSemantic})
          .engineAttribution,
      ).to.equal(undefined);
      expect(
        analyzeSearchSources({scapiLexical: sources.scapiLexical, scapiSemantic: sources.scapiSemantic})
          .engineAttribution,
      ).to.equal(undefined);
    });

    it('is left out when no query can be compared', () => {
      const analysis = analyzeSearchSources({
        storefrontSemantic: semanticStorefront([entry('boots', base)]),
        scapiLexical: lexicalApi([entry('shoes', base)]),
        scapiSemantic: semanticApi([entry('shoes', base)]),
      });

      expect(analysis.engineAttribution).to.equal(undefined);
    });
  });

  describe('findings: storefront against the API', () => {
    describe('storefront-only-products and api-only-products', () => {
      it('reports products only the storefront shows', () => {
        const analysis = lexicalChannel([entry('shoes', ['a', 'b', 'c', 'x'])], [entry('shoes', ['a', 'b', 'c'])]);

        const found = only(analysis, 'storefront-only-products');
        expect(found.severity).to.equal('warning');
        expect(found.pair).to.equal('storefront-vs-scapi-lexical');
        expect(found.source).to.equal(undefined);
        expect(found.queries).to.deep.equal(['shoes']);
        expect(found.examples).to.deep.equal([{query: 'shoes', productIds: ['x']}]);
        expect(found.message).to.equal(
          'With lexical search, the storefront shows products the API does not return in 1 of 1 compared query (1 product in total).',
        );
        expect(found.likelyCauses.length).to.be.greaterThan(1);
        expect(found.likelyCauses.join(' ')).to.include('likely');
        expect(findingsOf(analysis, 'api-only-products')).to.deep.equal([]);
      });

      it('reports products only the API returns', () => {
        const analysis = lexicalChannel([entry('shoes', ['a', 'c'])], [entry('shoes', ['a', 'b', 'c'])]);

        const found = only(analysis, 'api-only-products');
        expect(found.severity).to.equal('warning');
        expect(found.pair).to.equal('storefront-vs-scapi-lexical');
        expect(found.examples).to.deep.equal([{query: 'shoes', productIds: ['b']}]);
        expect(found.message).to.equal(
          'With lexical search, the API returns products the storefront does not show in 1 of 1 compared query (1 product in total).',
        );
        expect(findingsOf(analysis, 'storefront-only-products')).to.deep.equal([]);
      });

      it('names the engine of the pair', () => {
        const analysis = analyzeSearchSources({
          storefrontSemantic: semanticStorefront([entry('shoes', ['a', 'x'])]),
          scapiSemantic: semanticApi([entry('shoes', ['a'])]),
        });

        const found = only(analysis, 'storefront-only-products');
        expect(found.pair).to.equal('storefront-vs-scapi-semantic');
        expect(found.message).to.include('With semantic search');
      });

      it('suggests capturing again without the page cache only when the cache was not bypassed', () => {
        const sf = [entry('shoes', ['a', 'x'])];
        const api = [entry('shoes', ['a'])];
        const cached = analyzeSearchSources({storefrontLexical: lexicalStorefront(sf), scapiLexical: lexicalApi(api)});
        const bypassed = analyzeSearchSources({
          storefrontLexical: lexicalStorefront(sf, {bypassPageCache: true}),
          scapiLexical: lexicalApi(api),
        });

        expect(only(cached, 'storefront-only-products').likelyCauses.join(' ')).to.include('--bypass-page-cache');
        expect(only(bypassed, 'storefront-only-products').likelyCauses.join(' ')).to.not.include('--bypass-page-cache');
      });

      it('orders the queries by how many products differ', () => {
        const analysis = lexicalChannel(
          [entry('one', ['a', 'x1']), entry('three', ['a', 'y1', 'y2', 'y3']), entry('two', ['a', 'z1', 'z2'])],
          [entry('one', ['a']), entry('three', ['a']), entry('two', ['a'])],
        );

        const found = only(analysis, 'storefront-only-products');
        expect(found.queries).to.deep.equal(['three', 'two', 'one']);
        expect(found.examples?.map((example) => example.productIds)).to.deep.equal([
          ['y1', 'y2', 'y3'],
          ['z1', 'z2'],
          ['x1'],
        ]);
        expect(found.message).to.include('(6 products in total)');
      });

      it('is a warning from 10% of the compared queries and a notice below', () => {
        const queries = (count: number) => ids('q', count);
        const listFor = (query: string) => ids(`${query}-`, 3);
        const analyze = (count: number, options?: AnalyzeSearchSourcesOptions) =>
          lexicalChannel(
            queries(count).map((query, index) =>
              entry(query, index === 0 ? [...listFor(query), `${query}-extra`] : listFor(query)),
            ),
            queries(count).map((query) => entry(query, listFor(query))),
            options,
          );

        expect(only(analyze(10), 'storefront-only-products').severity).to.equal('warning');
        expect(only(analyze(9), 'storefront-only-products').severity).to.equal('warning');
        expect(only(analyze(11), 'storefront-only-products').severity).to.equal('notice');
        expect(only(analyze(11, {thresholds: {warningShare: 0.05}}), 'storefront-only-products').severity).to.equal(
          'warning',
        );
        expect(only(analyze(10, {thresholds: {warningShare: 0.5}}), 'storefront-only-products').severity).to.equal(
          'notice',
        );
      });

      it('does not report products beyond the depth the other list covers', () => {
        // The storefront page shows 3 of 10 products, the API returned all 10.
        const analysis = lexicalChannel(
          [entry('shoes', ['a', 'b', 'c'], {total: 10})],
          [entry('shoes', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'])],
        );

        expect(findingsOf(analysis, 'storefront-only-products')).to.deep.equal([]);
        expect(findingsOf(analysis, 'api-only-products')).to.deep.equal([]);
        expect(findingsOf(analysis, 'order-differs')).to.deep.equal([]);
        expect(analysis.findings).to.deep.equal([]);
      });

      it('does not report storefront products beyond the depth the API returned', () => {
        // The API returned 3 of 10 products, the storefront shows all 10.
        const analysis = lexicalChannel(
          [entry('shoes', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'])],
          [entry('shoes', ['a', 'b', 'c'], {total: 10})],
        );

        expect(findingsOf(analysis, 'storefront-only-products')).to.deep.equal([]);
        expect(findingsOf(analysis, 'api-only-products')).to.deep.equal([]);
      });

      it('reports a difference within the depth both lists cover', () => {
        const analysis = lexicalChannel(
          [entry('shoes', ['a', 'x', 'c', 'd', 'e'], {total: 10})],
          [entry('shoes', ['a', 'b', 'c'], {total: 10})],
        );

        expect(only(analysis, 'storefront-only-products').examples).to.deep.equal([
          {query: 'shoes', productIds: ['x']},
        ]);
        expect(only(analysis, 'api-only-products').examples).to.deep.equal([{query: 'shoes', productIds: ['b']}]);
      });

      it('treats a list shorter than the limit as complete when the total is unknown', () => {
        const analysis = lexicalChannel(
          [entry('shoes', ['a', 'b', 'x'], {total: undefined})],
          [entry('shoes', ['a', 'b'], {total: undefined})],
        );

        expect(only(analysis, 'storefront-only-products').examples).to.deep.equal([
          {query: 'shoes', productIds: ['x']},
        ]);
      });

      it('treats a storefront list shorter than the limit as cut off when the total is unknown', () => {
        const analysis = lexicalChannel(
          [entry('shoes', ['a', 'b'], {total: undefined})],
          [entry('shoes', ['a', 'b', 'x'], {total: 3})],
        );

        expect(findingsOf(analysis, 'api-only-products')).to.deep.equal([]);
      });

      it('treats an empty storefront list as complete when the total is unknown', () => {
        const analysis = lexicalChannel([entry('shoes', [], {total: undefined})], [entry('shoes', ['x'], {total: 1})]);

        expect(only(analysis, 'api-only-products').examples).to.deep.equal([{query: 'shoes', productIds: ['x']}]);
      });

      it('treats a list at the limit as cut off when the total is unknown', () => {
        const analysis = analyzeSearchSources({
          storefrontLexical: lexicalStorefront([entry('shoes', ['a', 'b', 'x'], {total: undefined})]),
          scapiLexical: lexicalApi([entry('shoes', ['a', 'b'], {total: undefined})], {limit: 2}),
        });

        expect(findingsOf(analysis, 'storefront-only-products')).to.deep.equal([]);
      });
    });

    describe('totals-differ', () => {
      const withTotals = (storefrontTotal: number, apiTotal: number, options?: AnalyzeSearchSourcesOptions) =>
        lexicalChannel(
          [entry('shoes', ['a', 'b'], {total: storefrontTotal}), entry('boots', ['c', 'd'], {total: 50})],
          [entry('shoes', ['a', 'b'], {total: apiTotal}), entry('boots', ['c', 'd'], {total: 50})],
          options,
        );

      it('reports queries whose totals differ by more than 10%', () => {
        const found = only(withTotals(100, 80), 'totals-differ');

        expect(found.severity).to.equal('warning');
        expect(found.pair).to.equal('storefront-vs-scapi-lexical');
        expect(found.queries).to.deep.equal(['shoes']);
        expect(found.message).to.equal(
          'With lexical search, the result totals of the storefront and the API differ by more than 10% in 1 of 2 compared queries. The largest difference is "shoes": 100 on the storefront, 80 in the API.',
        );
        expect(found.likelyCauses.length).to.be.greaterThan(0);
      });

      it('does not report a difference of exactly 10%', () => {
        expect(findingsOf(withTotals(100, 90), 'totals-differ')).to.deep.equal([]);
        expect(findingsOf(withTotals(90, 100), 'totals-differ')).to.deep.equal([]);
      });

      it('reports a difference just above 10%', () => {
        expect(findingsOf(withTotals(100, 89), 'totals-differ')).to.have.lengthOf(1);
        expect(findingsOf(withTotals(89, 100), 'totals-differ')).to.have.lengthOf(1);
      });

      it('uses the relative difference given in the thresholds', () => {
        expect(
          findingsOf(withTotals(100, 90, {thresholds: {totalsRelativeDifference: 0.05}}), 'totals-differ'),
        ).to.have.lengthOf(1);
        expect(
          findingsOf(withTotals(100, 80, {thresholds: {totalsRelativeDifference: 0.25}}), 'totals-differ'),
        ).to.deep.equal([]);
      });

      it('orders the queries by the size of the difference and names the largest', () => {
        const analysis = lexicalChannel(
          [entry('small', ['a'], {total: 100}), entry('large', ['b'], {total: 100})],
          [entry('small', ['a'], {total: 80}), entry('large', ['b'], {total: 20})],
        );

        const found = only(analysis, 'totals-differ');
        expect(found.queries).to.deep.equal(['large', 'small']);
        expect(found.message).to.include('"large": 100 on the storefront, 20 in the API');
      });

      it('skips queries without a total on either side and queries without products', () => {
        const analysis = lexicalChannel(
          [entry('a', ['x'], {total: undefined}), entry('b', [], {total: 0})],
          [entry('a', ['x'], {total: 500}), entry('b', [], {total: 0})],
        );

        expect(findingsOf(analysis, 'totals-differ')).to.deep.equal([]);
      });
    });

    describe('facets and sorting options', () => {
      it('reports filters only the storefront offers', () => {
        const analysis = lexicalChannel(
          [entry('shoes', ['a'], {refinements: [brand(3)]})],
          [entry('shoes', ['a'], {refinements: []})],
        );

        const found = only(analysis, 'facets-only-on-storefront');
        expect(found.severity).to.equal('warning');
        expect(found.pair).to.equal('storefront-vs-scapi-lexical');
        expect(found.queries).to.deep.equal(['shoes']);
        expect(found.examples).to.equal(undefined);
        expect(found.message).to.equal(
          'With lexical search, the storefront offers filters the API does not return in 1 of 1 compared query: brand (1 query).',
        );
        expect(findingsOf(analysis, 'facets-only-in-api')).to.deep.equal([]);
      });

      it('reports filters only the API returns', () => {
        const analysis = lexicalChannel(
          [entry('shoes', ['a'], {refinements: []})],
          [entry('shoes', ['a'], {refinements: [brand(3)]})],
        );

        const found = only(analysis, 'facets-only-in-api');
        expect(found.message).to.equal(
          'With lexical search, the API returns filters the storefront does not offer in 1 of 1 compared query: brand (1 query).',
        );
        expect(findingsOf(analysis, 'facets-only-on-storefront')).to.deep.equal([]);
      });

      it('reports filter values whose product counts differ', () => {
        const analysis = lexicalChannel(
          [entry('shoes', ['a'], {refinements: [brand(3)]})],
          [entry('shoes', ['a'], {refinements: [brand(5)]})],
        );

        const found = only(analysis, 'facet-counts-differ');
        expect(found.severity).to.equal('warning');
        expect(found.message).to.equal(
          'With lexical search, the product counts of filter values differ between the storefront and the API in 1 of 1 compared query: brand (1 query).',
        );
        expect(findingsOf(analysis, 'facets-only-on-storefront')).to.deep.equal([]);
        expect(findingsOf(analysis, 'facets-only-in-api')).to.deep.equal([]);
      });

      it('lists the filters by the number of queries they differ in', () => {
        const size: CapturedRefinement = {attributeId: 'size', values: [{value: 'M', hitCount: 2}]};
        const analysis = lexicalChannel(
          [
            entry('one', ['a'], {refinements: [brand(3), size]}),
            entry('two', ['b'], {refinements: [brand(3)]}),
            entry('three', ['c'], {refinements: []}),
          ],
          [entry('one', ['a']), entry('two', ['b']), entry('three', ['c'])],
        );

        const found = only(analysis, 'facets-only-on-storefront');
        expect(found.message).to.include('in 2 of 3 compared queries: brand (2 queries), size (1 query).');
        expect(found.queries).to.deep.equal(['one', 'two']);
      });

      it('compares custom attributes without their c_ prefix and ignores filters without values', () => {
        const color = (attributeId: string): CapturedRefinement => ({
          attributeId,
          values: [{value: 'red', hitCount: 2}],
        });
        const analysis = lexicalChannel(
          [entry('shoes', ['a'], {refinements: [color('color')]})],
          [entry('shoes', ['a'], {refinements: [color('c_color'), {attributeId: 'brand', values: []}]})],
        );

        expect(findingsOf(analysis, 'facets-only-on-storefront')).to.deep.equal([]);
        expect(findingsOf(analysis, 'facets-only-in-api')).to.deep.equal([]);
        expect(findingsOf(analysis, 'facet-counts-differ')).to.deep.equal([]);
      });

      it('reports sorting options only one side offers', () => {
        const analysis = lexicalChannel(
          [entry('shoes', ['a'], {sortingOptions: ['best-matches', 'price-low-to-high']})],
          [entry('shoes', ['a'], {sortingOptions: ['best-matches', 'price-high-to-low']})],
        );

        const found = only(analysis, 'sorting-options-differ');
        expect(found.severity).to.equal('warning');
        expect(found.message).to.equal(
          'With lexical search, the sorting options differ between the storefront and the API in 1 of 1 compared query: only on the storefront: price-low-to-high; only in the API: price-high-to-low.',
        );
      });

      it('does not report a difference in the sorting option applied', () => {
        const analysis = lexicalChannel(
          [entry('shoes', ['a'], {sortingOptions: ['best-matches'], selectedSortingOption: 'best-matches'})],
          [entry('shoes', ['a'], {sortingOptions: ['best-matches'], selectedSortingOption: 'price-low-to-high'})],
        );

        expect(findingsOf(analysis, 'sorting-options-differ')).to.deep.equal([]);
      });

      it('reports nothing when the filters and sorting options agree', () => {
        const analysis = lexicalChannel(
          [entry('shoes', ['a', 'b'], {refinements: [brand(3)], sortingOptions: ['best-matches']})],
          [entry('shoes', ['a', 'b'], {refinements: [brand(3)], sortingOptions: ['best-matches']})],
        );

        expect(analysis.findings).to.deep.equal([]);
      });
    });

    describe('order-differs', () => {
      it('reports products ranked in a different order', () => {
        const analysis = lexicalChannel([entry('shoes', ['a', 'b', 'c'])], [entry('shoes', ['b', 'a', 'c'])]);

        const found = only(analysis, 'order-differs');
        expect(found.severity).to.equal('warning');
        expect(found.pair).to.equal('storefront-vs-scapi-lexical');
        expect(found.queries).to.deep.equal(['shoes']);
        expect(found.examples).to.deep.equal([{query: 'shoes', productIds: ['a', 'b']}]);
        expect(found.message).to.include(
          'rank the products they both return in a different order in 1 of 1 compared query',
        );
        expect(findingsOf(analysis, 'storefront-only-products')).to.deep.equal([]);
        expect(findingsOf(analysis, 'api-only-products')).to.deep.equal([]);
      });

      it('does not report a product the storefront left out as an order difference', () => {
        const analysis = lexicalChannel([entry('shoes', ['a', 'c'])], [entry('shoes', ['a', 'b', 'c'])]);

        expect(findingsOf(analysis, 'order-differs')).to.deep.equal([]);
        expect(findingsOf(analysis, 'api-only-products')).to.have.lengthOf(1);
      });

      it('reports an order difference next to a membership difference', () => {
        const analysis = lexicalChannel([entry('shoes', ['b', 'a', 'x'])], [entry('shoes', ['a', 'b', 'c'])]);

        expect(findingsOf(analysis, 'order-differs')).to.have.lengthOf(1);
        expect(findingsOf(analysis, 'storefront-only-products')).to.have.lengthOf(1);
      });

      it('orders the queries by how many products moved', () => {
        const analysis = lexicalChannel(
          [entry('few', ['a', 'b', 'c', 'd']), entry('many', ['d', 'c', 'b', 'a'])],
          [entry('few', ['a', 'b', 'd', 'c']), entry('many', ['a', 'b', 'c', 'd'])],
        );

        expect(only(analysis, 'order-differs').queries).to.deep.equal(['many', 'few']);
      });
    });
  });

  describe('findings: lexical against semantic', () => {
    const lexicalEntries = () => [
      entry('shirt', ['a', 'b', 'c', 'd'], {
        refinements: [brand(4)],
        sortingOptions: ['best-matches', 'price-low-to-high'],
      }),
      entry('dress', ['e', 'f', 'g', 'h'], {
        refinements: [brand(2)],
        sortingOptions: ['best-matches', 'price-low-to-high'],
      }),
    ];
    const semanticEntries = () => [
      entry('shirt', ['a', 'b', 'c', 'y'], {
        effectiveSearchMode: 'semantic',
        sortingOptions: ['best-matches', 'relevance'],
      }),
      entry('dress', ['z', 'f', 'w', 'v'], {
        effectiveSearchMode: 'semantic',
        sortingOptions: ['best-matches', 'relevance'],
      }),
    ];

    it('describes what changes when the API switches to semantic search', () => {
      const analysis = analyzeSearchSources(
        {scapiLexical: lexicalApi(lexicalEntries()), scapiSemantic: semanticApi(semanticEntries())},
        {kValues: [4]},
      );

      const found = only(analysis, 'engine-change');
      expect(found.severity).to.equal('info');
      expect(found.pair).to.equal('scapi-lexical-vs-semantic');
      expect(found.message).to.equal(
        'Lexical and semantic search compared on the API: the mean overlap at 4 is 0.50, and the top hit is the same in 1 of 2 compared queries. ' +
          'Semantic results never include the filter brand. ' +
          'Sorting options only lexical search offers: price-low-to-high. ' +
          'Sorting options only semantic search offers: relevance. ' +
          'The examples show the top hit of lexical search, then of semantic search.',
      );
      expect(found.queries).to.deep.equal(['dress', 'shirt']);
      expect(found.examples).to.deep.equal([{query: 'dress', productIds: ['e', 'z']}]);
      expect(found.likelyCauses.join(' ')).to.include('likely matches on meaning');
    });

    it('describes the same change on the storefront', () => {
      const analysis = analyzeSearchSources(
        {
          storefrontLexical: lexicalStorefront(lexicalEntries()),
          storefrontSemantic: semanticStorefront(semanticEntries()),
        },
        {kValues: [4]},
      );

      const found = only(analysis, 'engine-change');
      expect(found.pair).to.equal('storefront-lexical-vs-semantic');
      expect(found.message).to.include('Lexical and semantic search compared on the storefront:');
    });

    it('names several filters semantic results never include', () => {
      const size: CapturedRefinement = {attributeId: 'size', values: [{value: 'M', hitCount: 1}]};
      const analysis = analyzeSearchSources({
        scapiLexical: lexicalApi([entry('shirt', ['a'], {refinements: [brand(1), size]})]),
        scapiSemantic: semanticApi([entry('shirt', ['a'])]),
      });

      expect(only(analysis, 'engine-change').message).to.include(
        'Semantic results never include the filters brand, size.',
      );
    });

    it('does not say a filter is never returned when semantic results have it for some queries', () => {
      const analysis = analyzeSearchSources({
        scapiLexical: lexicalApi([
          entry('shirt', ['a'], {refinements: [brand(1)]}),
          entry('dress', ['b'], {refinements: [brand(1)]}),
        ]),
        scapiSemantic: semanticApi([entry('shirt', ['a'], {refinements: [brand(1)]}), entry('dress', ['b'])]),
      });

      expect(only(analysis, 'engine-change').message).to.not.include('never include');
    });

    it('leaves out the example products when the top hits agree', () => {
      const analysis = analyzeSearchSources({
        scapiLexical: lexicalApi([entry('shirt', ['a', 'b'])]),
        scapiSemantic: semanticApi([entry('shirt', ['a', 'c'])]),
      });

      expect(only(analysis, 'engine-change').examples).to.equal(undefined);
    });

    it('suggests the semantic capture was not served by semantic search when the results are the same', () => {
      const same = () => [entry('shirt', ['a', 'b']), entry('dress', ['c', 'd'])];
      const storefrontSame = analyzeSearchSources({
        storefrontLexical: lexicalStorefront(same()),
        storefrontSemantic: semanticStorefront(same()),
      });
      const apiSame = analyzeSearchSources({
        scapiLexical: lexicalApi(same()),
        scapiSemantic: semanticApi(same()),
      });

      expect(only(storefrontSame, 'engine-change').likelyCauses[0]).to.include(
        'the semantic capture was likely not served by Agentic Commerce Search',
      );
      expect(only(storefrontSame, 'engine-change').likelyCauses[0]).to.include('--bypass-page-cache');
      expect(only(apiSame, 'engine-change').likelyCauses[0]).to.include('one engine likely served both');
    });

    it('does not suggest bypassing the page cache when the semantic storefront capture already did', () => {
      const same = () => [entry('shirt', ['a', 'b']), entry('dress', ['c', 'd'])];
      const analysis = analyzeSearchSources({
        storefrontLexical: lexicalStorefront(same()),
        storefrontSemantic: semanticStorefront(same(), {bypassPageCache: true}),
      });

      const cause = only(analysis, 'engine-change').likelyCauses[0];
      expect(cause).to.include('the semantic capture was likely not served by Agentic Commerce Search');
      expect(cause).to.not.include('--bypass-page-cache');
      expect(cause.endsWith('turned on for the site.')).to.equal(true);
    });

    describe('price-sort-not-applied', () => {
      const unordered = () => [pricedEntry('shoes', [10, 30, 20, 40]), pricedEntry('boots', [10, 20, 30])];

      it('reports a price sort that left the prices out of order', () => {
        const analysis = analyzeSearchSources({
          scapiLexical: lexicalApi(unordered()),
          scapiSemantic: semanticApi(unordered(), {sort: 'price-low-to-high'}),
        });

        const found = only(analysis, 'price-sort-not-applied');
        expect(found.severity).to.equal('warning');
        expect(found.source).to.equal('scapiSemantic');
        expect(found.pair).to.equal('scapi-lexical-vs-semantic');
        expect(found.queries).to.deep.equal(['shoes']);
        expect(found.message).to.equal(
          'API (semantic) requested the "price-low-to-high" sort, but the hit prices are not in ascending order in 1 of 2 queries with prices.',
        );
        expect(found.likelyCauses.join(' ')).to.include('Semantic search may ignore the sort');
      });

      it('reports it without a pair when the other engine was not captured', () => {
        const analysis = analyzeSearchSources({
          storefrontLexical: lexicalStorefront([entry('shoes', ['shoes-1'])]),
          scapiSemantic: semanticApi(unordered(), {sort: 'price-low-to-high'}),
        });

        const found = only(analysis, 'price-sort-not-applied');
        expect(found.source).to.equal('scapiSemantic');
        expect(found.pair).to.equal(undefined);
      });

      it('reports a lexical capture too', () => {
        const analysis = analyzeSearchSources({
          scapiLexical: lexicalApi(unordered(), {sort: 'price-high-to-low'}),
          scapiSemantic: semanticApi(unordered()),
        });

        const found = only(analysis, 'price-sort-not-applied');
        expect(found.source).to.equal('scapiLexical');
        expect(found.likelyCauses.join(' ')).to.include('may not be a price sort');
      });

      it('reads the sort of a storefront capture from its srule parameter', () => {
        const analysis = analyzeSearchSources({
          storefrontLexical: lexicalStorefront(unordered(), {params: {srule: 'price-high-to-low'}}),
          storefrontSemantic: semanticStorefront(unordered()),
        });

        const found = only(analysis, 'price-sort-not-applied');
        expect(found.source).to.equal('storefrontLexical');
        expect(found.pair).to.equal('storefront-lexical-vs-semantic');
        expect(found.message).to.include('Storefront (lexical) requested the "price-high-to-low" sort');
      });

      it('does not report prices that are in the order the sort names', () => {
        const ordered = () => [pricedEntry('shoes', [10, 20, 30]), pricedEntry('boots', [10, 10, 20])];
        const analysis = analyzeSearchSources({
          scapiLexical: lexicalApi(ordered()),
          scapiSemantic: semanticApi(ordered(), {sort: 'price-low-to-high'}),
        });

        expect(findingsOf(analysis, 'price-sort-not-applied')).to.deep.equal([]);
      });

      it('reports prices in the opposite order to the one the sort names', () => {
        const reversed = analyzeSearchSources({
          scapiLexical: lexicalApi([pricedEntry('shoes', [10, 20, 30]), pricedEntry('boots', [30, 20, 10])], {
            sort: 'price-high-to-low',
          }),
          scapiSemantic: semanticApi([pricedEntry('shoes', [10, 20, 30])]),
        });

        const found = only(reversed, 'price-sort-not-applied');
        expect(found.queries).to.deep.equal(['shoes']);
        expect(found.message).to.include('not in descending order in 1 of 2 queries');
        expect(found.likelyCauses.join(' ')).to.include('in the other direction than its name says');
      });

      it('accepts either direction when the sort ID does not name one', () => {
        const ordered = () => [pricedEntry('shoes', [10, 20, 30]), pricedEntry('boots', [30, 20, 10])];
        const analysis = analyzeSearchSources({
          scapiLexical: lexicalApi(ordered()),
          scapiSemantic: semanticApi(ordered(), {sort: 'price'}),
        });

        expect(findingsOf(analysis, 'price-sort-not-applied')).to.deep.equal([]);
      });

      it('does not report a sort that is not a price sort', () => {
        const analysis = analyzeSearchSources({
          scapiLexical: lexicalApi(unordered()),
          scapiSemantic: semanticApi(unordered(), {sort: 'best-matches'}),
        });

        expect(findingsOf(analysis, 'price-sort-not-applied')).to.deep.equal([]);
      });

      it('does not report a capture that asked for no sort', () => {
        const analysis = analyzeSearchSources({
          scapiLexical: lexicalApi(unordered()),
          scapiSemantic: semanticApi(unordered()),
        });

        expect(findingsOf(analysis, 'price-sort-not-applied')).to.deep.equal([]);
      });

      it('does not judge hits that have fewer than two prices', () => {
        const analysis = analyzeSearchSources({
          scapiLexical: lexicalApi([entry('shoes', ['a', 'b'])]),
          scapiSemantic: semanticApi([pricedEntry('shoes', [10])], {sort: 'price-low-to-high'}),
        });

        expect(findingsOf(analysis, 'price-sort-not-applied')).to.deep.equal([]);
      });

      it('orders the queries by how far the prices are from ordered', () => {
        const analysis = analyzeSearchSources({
          scapiLexical: lexicalApi([]),
          scapiSemantic: semanticApi(
            [pricedEntry('mild', [10, 30, 20, 40]), pricedEntry('wild', [30, 10, 40, 20, 50, 5])],
            {sort: 'price-low-to-high'},
          ),
        });

        expect(only(analysis, 'price-sort-not-applied').queries).to.deep.equal(['wild', 'mild']);
      });
    });
  });

  describe('findings about one source', () => {
    describe('mode-fallbacks', () => {
      it('reports queries served by another search mode than requested', () => {
        const analysis = analyzeSearchSources({
          scapiLexical: lexicalApi([entry('shoes', ['a']), entry('boots', ['b'])]),
          scapiSemantic: semanticApi([
            entry('shoes', ['a'], {effectiveSearchMode: 'lexical'}),
            entry('boots', ['b'], {effectiveSearchMode: 'lexical'}),
          ]),
        });

        const found = only(analysis, 'mode-fallbacks');
        expect(found.severity).to.equal('warning');
        expect(found.source).to.equal('scapiSemantic');
        expect(found.pair).to.equal(undefined);
        expect(found.queries).to.deep.equal(['shoes', 'boots']);
        expect(found.message).to.equal(
          'API (semantic): 2 of 2 successful queries asked for semantic search but were served by lexical search.',
        );
        expect(found.likelyCauses[0]).to.include('Every query fell back');
      });

      it('does not say every query fell back when only some did', () => {
        const analysis = analyzeSearchSources({
          scapiLexical: lexicalApi([entry('shoes', ['a'])]),
          scapiSemantic: semanticApi([
            entry('shoes', ['a'], {effectiveSearchMode: 'lexical'}),
            entry('boots', ['b'], {effectiveSearchMode: 'semantic'}),
          ]),
        });

        const found = only(analysis, 'mode-fallbacks');
        expect(found.message).to.equal(
          'API (semantic): 1 of 2 successful queries asked for semantic search but was served by lexical search.',
        );
        expect(found.queries).to.deep.equal(['shoes']);
        expect(found.likelyCauses.join(' ')).to.not.include('Every query fell back');
      });

      it('reports a lexical request served by semantic search', () => {
        const analysis = analyzeSearchSources({
          scapiLexical: lexicalApi([entry('shoes', ['a'], {effectiveSearchMode: 'semantic'})]),
          scapiSemantic: semanticApi([entry('shoes', ['a'])]),
        });

        const found = only(analysis, 'mode-fallbacks');
        expect(found.source).to.equal('scapiLexical');
        expect(found.message).to.include('asked for lexical search but was served by semantic search');
      });

      it('does not report queries that failed, were not told the mode or came from a storefront', () => {
        const analysis = analyzeSearchSources({
          storefrontLexical: lexicalStorefront([entry('shoes', ['a'], {effectiveSearchMode: 'semantic'})]),
          scapiLexical: scapi('default', undefined, [entry('shoes', ['a'], {effectiveSearchMode: 'semantic'})]),
          scapiSemantic: semanticApi([
            {...failedEntry('shoes', 500, 'boom'), effectiveSearchMode: 'lexical'},
            entry('boots', ['b'], {effectiveSearchMode: undefined}),
          ]),
        });

        expect(findingsOf(analysis, 'mode-fallbacks')).to.deep.equal([]);
      });
    });

    describe('identical-result-lists', () => {
      const same = ['a', 'b', 'c'];

      it('reports queries that return the same list', () => {
        const analysis = analyzeSearchSources({
          storefrontLexical: lexicalStorefront([
            entry('q1', same),
            entry('q2', same),
            entry('q3', same),
            entry('q4', ['d', 'e']),
          ]),
          scapiLexical: lexicalApi([entry('q1', ['x']), entry('q2', ['y']), entry('q3', ['z']), entry('q4', ['w'])]),
        });

        const found = only(analysis, 'identical-result-lists');
        expect(found.severity).to.equal('warning');
        expect(found.source).to.equal('storefrontLexical');
        expect(found.pair).to.equal(undefined);
        expect(found.queries).to.deep.equal(['q1', 'q2', 'q3']);
        expect(found.examples).to.deep.equal([{query: 'q1', productIds: same}]);
        expect(found.message).to.equal(
          'Storefront (lexical): 3 queries of 4 with results return a result list another query also returns; the largest group is 3 queries with exactly the same list (2 distinct lists across 4 queries).',
        );
        expect(found.likelyCauses.join(' ')).to.include('--bypass-page-cache');
      });

      it('gives one example for each group of queries', () => {
        const analysis = analyzeSearchSources({
          scapiLexical: lexicalApi([
            entry('q1', ['a']),
            entry('q2', ['a']),
            entry('q3', ['b']),
            entry('q4', ['b']),
            entry('q5', ['c']),
          ]),
          scapiSemantic: semanticApi([entry('q1', ['x'])]),
        });

        const found = only(analysis, 'identical-result-lists');
        expect(found.queries).to.have.members(['q1', 'q2', 'q3', 'q4']);
        expect(found.examples).to.deep.equal([
          {query: 'q1', productIds: ['a']},
          {query: 'q3', productIds: ['b']},
        ]);
        expect(found.likelyCauses.join(' ')).to.not.include('--bypass-page-cache');
      });

      it('is a warning when 20% of the queries with results share a list, a notice below', () => {
        const analyze = (count: number, options?: AnalyzeSearchSourcesOptions) =>
          analyzeSearchSources(
            {
              scapiLexical: lexicalApi([
                entry('q1', same),
                entry('q2', same),
                ...ids('r', count - 2).map((query) => entry(query, [query])),
              ]),
              scapiSemantic: semanticApi([entry('q1', ['x'])]),
            },
            options,
          );

        expect(only(analyze(10), 'identical-result-lists').severity).to.equal('warning');
        expect(only(analyze(11), 'identical-result-lists').severity).to.equal('notice');
        expect(only(analyze(11, {thresholds: {sharedListShare: 0.15}}), 'identical-result-lists').severity).to.equal(
          'warning',
        );
        expect(only(analyze(10, {thresholds: {sharedListShare: 0.25}}), 'identical-result-lists').severity).to.equal(
          'notice',
        );
      });

      it('does not report queries whose lists differ, that returned nothing or that failed', () => {
        const analysis = analyzeSearchSources({
          scapiLexical: lexicalApi([
            entry('q1', ['a']),
            entry('q2', ['b']),
            entry('q3', [], {total: 0}),
            entry('q4', [], {total: 0}),
            failedEntry('q5', 500, 'boom'),
            failedEntry('q6', 500, 'boom'),
          ]),
          scapiSemantic: semanticApi([entry('q1', ['a'])]),
        });

        expect(findingsOf(analysis, 'identical-result-lists')).to.deep.equal([]);
      });
    });

    describe('zero-results', () => {
      it('reports queries that returned no products and whether other sources found some', () => {
        const analysis = analyzeSearchSources({
          storefrontLexical: lexicalStorefront([
            entry('shoes', ['a', 'b']),
            entry('obscure', [], {total: 0, redirectedTo: 'https://www.example.com/help'}),
          ]),
          scapiLexical: lexicalApi([entry('shoes', ['a', 'b']), entry('obscure', ['z'])]),
        });

        const found = only(analysis, 'zero-results');
        expect(found.severity).to.equal('warning');
        expect(found.source).to.equal('storefrontLexical');
        expect(found.queries).to.deep.equal(['obscure']);
        expect(found.message).to.equal(
          'Storefront (lexical): 1 of 2 successful queries returned no products (1 of them has results in another source, 1 of them was redirected).',
        );
        expect(found.likelyCauses.join(' ')).to.include('redirected');
      });

      it('words a query nobody found results for', () => {
        const analysis = analyzeSearchSources({
          scapiLexical: lexicalApi([entry('shoes', ['a']), entry('nothing', [], {total: 0})]),
          scapiSemantic: semanticApi([entry('shoes', ['a']), entry('nothing', [], {total: 0})]),
        });

        const found = findingsOf(analysis, 'zero-results');
        expect(found).to.have.lengthOf(2);
        expect(found[0].message).to.equal('API (lexical): 1 of 2 successful queries returned no products.');
        expect(found[0].likelyCauses.join(' ')).to.include('locale, currency or refinements');
      });

      it('is a warning from 10% of the queries and a notice below', () => {
        const analyze = (count: number, options?: AnalyzeSearchSourcesOptions) =>
          analyzeSearchSources(
            {
              scapiLexical: lexicalApi([
                entry('empty', [], {total: 0}),
                ...ids('q', count - 1).map((query) => entry(query, [query])),
              ]),
              scapiSemantic: semanticApi([entry('q1', ['q1'])]),
            },
            options,
          );

        expect(only(analyze(10), 'zero-results').severity).to.equal('warning');
        expect(only(analyze(11), 'zero-results').severity).to.equal('notice');
        expect(only(analyze(11, {thresholds: {warningShare: 0.05}}), 'zero-results').severity).to.equal('warning');
      });

      it('lists the queries other sources found results for first', () => {
        const analysis = analyzeSearchSources({
          storefrontLexical: lexicalStorefront([
            entry('alone', [], {total: 0}),
            entry('found-by-one', [], {total: 0}),
            entry('found-by-two', [], {total: 0}),
          ]),
          storefrontSemantic: semanticStorefront([
            entry('alone', [], {total: 0}),
            entry('found-by-one', ['a']),
            entry('found-by-two', ['a']),
          ]),
          scapiLexical: lexicalApi([
            entry('alone', [], {total: 0}),
            entry('found-by-one', [], {total: 0}),
            entry('found-by-two', ['a']),
          ]),
        });

        const found = findingsOf(analysis, 'zero-results').find((item) => item.source === 'storefrontLexical');
        expect(found?.queries).to.deep.equal(['found-by-two', 'found-by-one', 'alone']);
      });

      it('does not count a failed query', () => {
        const analysis = analyzeSearchSources({
          scapiLexical: lexicalApi([entry('shoes', ['a']), failedEntry('boots', 500, 'boom')]),
          scapiSemantic: semanticApi([entry('shoes', ['a']), entry('boots', ['b'])]),
        });

        expect(findingsOf(analysis, 'zero-results')).to.deep.equal([]);
      });
    });

    describe('failed-queries', () => {
      const analyzeFailure = (failure: SearchCaptureEntry, channel: 'api' | 'storefront' = 'api') =>
        analyzeSearchSources({
          ...(channel === 'api'
            ? {scapiLexical: lexicalApi([entry('shoes', ['a']), failure])}
            : {storefrontLexical: lexicalStorefront([entry('shoes', ['a']), failure])}),
          scapiSemantic: semanticApi([entry('shoes', ['a']), entry(failure.query, ['b'])]),
        });

      it('reports queries that failed and the first error', () => {
        const analysis = analyzeFailure(failedEntry('boots', 500, 'Internal Server Error'));

        const found = only(analysis, 'failed-queries');
        expect(found.severity).to.equal('warning');
        expect(found.source).to.equal('scapiLexical');
        expect(found.queries).to.deep.equal(['boots']);
        expect(found.message).to.equal(
          'API (lexical): 1 of 2 queries failed. The first error is HTTP 500: Internal Server Error.',
        );
        expect(found.likelyCauses.join(' ')).to.include('temporary error or a timeout');
      });

      it('does not compare the query that failed', () => {
        const analysis = analyzeFailure(failedEntry('boots', 500, 'boom'));

        expect(analysis.pairs[0].summary.queries).to.equal(2);
        expect(analysis.pairs[0].summary.compared).to.equal(1);
      });

      it('points at the token scope for an API source that was refused', () => {
        const found = only(analyzeFailure(failedEntry('boots', 403, 'Forbidden')), 'failed-queries');

        expect(found.likelyCauses.join(' ')).to.include('sfcc.shopper-product-search');
      });

      it('points at the storefront password for a storefront that refused the request', () => {
        const found = only(analyzeFailure(failedEntry('boots', 401, 'Unauthorized'), 'storefront'), 'failed-queries');

        expect(found.source).to.equal('storefrontLexical');
        expect(found.likelyCauses.join(' ')).to.include('storefront password');
      });

      it('names rate limiting and rejected requests', () => {
        expect(
          only(analyzeFailure(failedEntry('boots', 429, 'Too Many Requests')), 'failed-queries').likelyCauses.join(' '),
        ).to.include('rate limited');
        expect(
          only(analyzeFailure(failedEntry('boots', 400, 'Bad Request')), 'failed-queries').likelyCauses.join(' '),
        ).to.include('rejected');
      });

      it('words a request that did not complete without a status', () => {
        const found = only(analyzeFailure(failedEntry('boots', 0, 'connect ECONNREFUSED')), 'failed-queries');

        expect(found.message).to.equal(
          'API (lexical): 1 of 2 queries failed. The first error is connect ECONNREFUSED.',
        );
        expect(found.likelyCauses.join(' ')).to.include('timeout');
      });

      it('shortens a long error', () => {
        const found = only(analyzeFailure(failedEntry('boots', 500, 'x'.repeat(300))), 'failed-queries');

        expect(found.message).to.include(`${'x'.repeat(117)}...`);
        expect(found.message).to.not.include('x'.repeat(118));
      });

      it('treats a response with an error and a 2xx status as failed', () => {
        const analysis = analyzeFailure({...failedEntry('boots', 200, 'bad body')});

        expect(only(analysis, 'failed-queries').message).to.include('The first error is HTTP 200: bad body.');
      });
    });
  });

  describe('findings across the pairs', () => {
    const storefrontBase = ids('s', 20);

    /** The lexical channel pair overlaps `lexicalShared` of 20 products, the semantic channel pair `semanticShared`. */
    function channelGap(lexicalShared: number, semanticShared: number, options?: AnalyzeSearchSourcesOptions) {
      const semanticBase = ids('t', 20);
      return analyzeSearchSources(
        {
          storefrontLexical: lexicalStorefront([entry('shoes', storefrontBase)]),
          storefrontSemantic: semanticStorefront([entry('shoes', semanticBase)]),
          scapiLexical: lexicalApi([entry('shoes', sharing(storefrontBase, lexicalShared, 'l'))]),
          scapiSemantic: semanticApi([entry('shoes', sharing(semanticBase, semanticShared, 'm'))]),
        },
        {kValues: [20], ...options},
      );
    }

    describe('channel-gap-grew', () => {
      it('reports a storefront that agrees with the API less under semantic search', () => {
        const found = only(channelGap(18, 8), 'channel-gap-grew');

        expect(found.severity).to.equal('warning');
        expect(found.pair).to.equal(undefined);
        expect(found.source).to.equal(undefined);
        expect(found.queries).to.deep.equal(['shoes']);
        expect(found.message).to.equal(
          'The storefront and the API agree less under semantic search than under lexical search: the mean overlap at 20 fell from 0.90 to 0.40.',
        );
        expect(found.likelyCauses.length).to.be.greaterThan(0);
      });

      it('reports a drop of exactly 0.2 and not a smaller one', () => {
        expect(findingsOf(channelGap(18, 14), 'channel-gap-grew')).to.have.lengthOf(1);
        expect(findingsOf(channelGap(18, 15), 'channel-gap-grew')).to.deep.equal([]);
      });

      it('uses the drop given in the thresholds', () => {
        expect(
          findingsOf(channelGap(18, 15, {thresholds: {channelGapDrop: 0.1}}), 'channel-gap-grew'),
        ).to.have.lengthOf(1);
        expect(findingsOf(channelGap(18, 8, {thresholds: {channelGapDrop: 0.6}}), 'channel-gap-grew')).to.deep.equal(
          [],
        );
      });

      it('does not report a storefront that agrees more under semantic search', () => {
        expect(findingsOf(channelGap(8, 18), 'channel-gap-grew')).to.deep.equal([]);
      });

      it('needs both same-engine pairs', () => {
        const sources = agreeingSources();
        const analysis = analyzeSearchSources({
          storefrontLexical: sources.storefrontLexical,
          scapiLexical: sources.scapiLexical,
          scapiSemantic: sources.scapiSemantic,
        });

        expect(findingsOf(analysis, 'channel-gap-grew')).to.deep.equal([]);
      });

      it('orders the queries by how much their agreement dropped', () => {
        const base = ids('s', 20);
        const semanticBase = ids('t', 20);
        const analysis = analyzeSearchSources(
          {
            storefrontLexical: lexicalStorefront([entry('mild', base), entry('steep', base)]),
            storefrontSemantic: semanticStorefront([entry('mild', semanticBase), entry('steep', semanticBase)]),
            scapiLexical: lexicalApi([entry('mild', sharing(base, 18, 'l')), entry('steep', sharing(base, 20, 'l'))]),
            scapiSemantic: semanticApi([
              entry('mild', sharing(semanticBase, 16, 'm')),
              entry('steep', sharing(semanticBase, 10, 'm')),
            ]),
          },
          {kValues: [20]},
        );

        expect(only(analysis, 'channel-gap-grew').queries).to.deep.equal(['steep', 'mild']);
      });
    });

    describe('storefront-engine-mismatch', () => {
      /** The storefront semantic capture shares `lexicalShared` of its products with the lexical API, `semanticShared` with the semantic API. */
      function semanticStorefrontAgainst(
        lexicalShared: number,
        semanticShared: number,
        request?: Partial<StorefrontSearchCaptureRequest>,
      ) {
        return analyzeSearchSources(
          {
            storefrontSemantic: semanticStorefront([entry('shoes', storefrontBase)], request),
            scapiLexical: lexicalApi([entry('shoes', sharing(storefrontBase, lexicalShared, 'l'))]),
            scapiSemantic: semanticApi([entry('shoes', sharing(storefrontBase, semanticShared, 'm'))]),
          },
          {kValues: [20]},
        );
      }

      it('reports a semantic storefront capture that looks like lexical search', () => {
        const found = only(semanticStorefrontAgainst(18, 8), 'storefront-engine-mismatch');

        expect(found.severity).to.equal('warning');
        expect(found.source).to.equal('storefrontSemantic');
        expect(found.pair).to.equal(undefined);
        expect(found.queries).to.deep.equal(['shoes']);
        expect(found.message).to.equal(
          'The storefront (semantic) capture looks closer to the lexical API results than to the semantic ones (mean overlap at 20: 0.90 with the lexical API results, 0.40 with the semantic API results).',
        );
        const causes = found.likelyCauses.join(' ');
        expect(causes).to.include('Agentic Commerce Search');
        expect(causes).to.include('A/B split');
        expect(causes).to.include('--bypass-page-cache');
      });

      it('does not suggest bypassing the page cache when the capture already did', () => {
        const found = only(semanticStorefrontAgainst(18, 8, {bypassPageCache: true}), 'storefront-engine-mismatch');

        expect(found.likelyCauses.join(' ')).to.not.include('--bypass-page-cache');
        expect(found.likelyCauses.join(' ')).to.include('A/B split');
      });

      it('reports a lexical storefront capture that looks like semantic search', () => {
        const analysis = analyzeSearchSources(
          {
            storefrontLexical: lexicalStorefront([entry('shoes', storefrontBase)]),
            scapiLexical: lexicalApi([entry('shoes', sharing(storefrontBase, 4, 'l'))]),
            scapiSemantic: semanticApi([entry('shoes', sharing(storefrontBase, 18, 'm'))]),
          },
          {kValues: [20]},
        );

        const found = only(analysis, 'storefront-engine-mismatch');
        expect(found.source).to.equal('storefrontLexical');
        expect(found.message).to.include(
          'The storefront (lexical) capture looks closer to the semantic API results than to the lexical ones',
        );
        expect(found.likelyCauses.join(' ')).to.include('labelled the wrong way round');
      });

      it('does not report a capture that matches its engine or is unclear', () => {
        expect(findingsOf(semanticStorefrontAgainst(8, 18), 'storefront-engine-mismatch')).to.deep.equal([]);
        expect(findingsOf(semanticStorefrontAgainst(17, 15), 'storefront-engine-mismatch')).to.deep.equal([]);
      });

      it('reports at a gap of exactly 0.15', () => {
        expect(findingsOf(semanticStorefrontAgainst(17, 14), 'storefront-engine-mismatch')).to.have.lengthOf(1);
      });

      it('needs both API captures', () => {
        const analysis = analyzeSearchSources({
          storefrontSemantic: semanticStorefront([entry('shoes', storefrontBase)]),
          scapiLexical: lexicalApi([entry('shoes', storefrontBase)]),
        });

        expect(findingsOf(analysis, 'storefront-engine-mismatch')).to.deep.equal([]);
      });

      it('lists the queries that look most like the other engine first', () => {
        const analysis = analyzeSearchSources(
          {
            storefrontSemantic: semanticStorefront([
              entry('mild', storefrontBase),
              entry('strong', storefrontBase),
              entry('neutral', storefrontBase),
            ]),
            scapiLexical: lexicalApi([
              entry('mild', sharing(storefrontBase, 16, 'l')),
              entry('strong', sharing(storefrontBase, 20, 'l')),
              entry('neutral', sharing(storefrontBase, 10, 'l')),
            ]),
            scapiSemantic: semanticApi([
              entry('mild', sharing(storefrontBase, 12, 'm')),
              entry('strong', sharing(storefrontBase, 4, 'm')),
              entry('neutral', sharing(storefrontBase, 10, 'm')),
            ]),
          },
          {kValues: [20]},
        );

        // Only the queries that look more like the other engine are listed, the strongest first.
        expect(only(analysis, 'storefront-engine-mismatch').queries).to.deep.equal(['strong', 'mild']);
      });
    });
  });

  describe('ordering', () => {
    function severityRank(finding: SearchFinding): number {
      return {warning: 0, notice: 1, info: 2}[finding.severity];
    }

    /** A scenario that raises findings of every severity, for sources and for pairs. */
    function busyAnalysis() {
      const lexical = ['shirt', 'dress', 'jeans'].map((query) =>
        entry(query, ids(`${query}-`, 10), {
          refinements: [brand(4)],
          sortingOptions: ['best-matches', 'price-low-to-high'],
        }),
      );
      const semantic = ['shirt', 'dress', 'jeans'].map((query) =>
        entry(query, [...ids(`${query}-`, 4), ...ids(`${query}-sem-`, 6)], {
          effectiveSearchMode: 'semantic',
          sortingOptions: ['best-matches'],
        }),
      );
      const storefrontLexicalEntries = lexical.map((item) => ({
        ...item,
        hits: item.hits.slice(0, 9),
        total: 9,
      }));
      return analyzeSearchSources(
        {
          storefrontLexical: lexicalStorefront([...storefrontLexicalEntries, failedEntry('boots', 500, 'boom')]),
          storefrontSemantic: semanticStorefront(
            lexical.map((item, index) => ({
              ...item,
              hits: [...item.hits.slice(0, 9), {productId: `extra-${index}`}],
              total: 10,
            })),
          ),
          scapiLexical: lexicalApi(lexical),
          scapiSemantic: semanticApi(semantic),
        },
        {kValues: [1, 5, 10]},
      );
    }

    it('lists warnings, then notices, then info', () => {
      const analysis = busyAnalysis();
      const ranks = analysis.findings.map((finding) => severityRank(finding));

      expect(ranks).to.deep.equal([...ranks].sort((a, b) => a - b));
      expect(new Set(analysis.findings.map((finding) => finding.severity))).to.include.keys('warning', 'info');
    });

    it('lists findings about sources and across pairs before the findings of a pair, in pair order', () => {
      const analysis = busyAnalysis();

      for (const severity of ['warning', 'notice', 'info'] as const) {
        const group = analysis.findings.filter((finding) => finding.severity === severity);
        const pairRanks = group.map((finding) => (finding.pair ? SEARCH_SOURCE_PAIR_IDS.indexOf(finding.pair) : -1));
        expect(pairRanks, `pair order of the ${severity} findings`).to.deep.equal([...pairRanks].sort((a, b) => a - b));
      }
      const warnings = analysis.findings.filter((finding) => finding.severity === 'warning');
      expect(warnings.some((finding) => finding.pair === undefined)).to.equal(true);
      expect(warnings.some((finding) => finding.pair !== undefined)).to.equal(true);
    });

    it('keeps the order of findings of a pair the same on every run', () => {
      expect(busyAnalysis().findings.map((finding) => [finding.code, finding.pair, finding.source])).to.deep.equal(
        busyAnalysis().findings.map((finding) => [finding.code, finding.pair, finding.source]),
      );
    });

    it('only uses documented codes, severities and fields', () => {
      for (const finding of busyAnalysis().findings) {
        expect(SEARCH_FINDING_CODES).to.include(finding.code);
        expect(['info', 'notice', 'warning']).to.include(finding.severity);
        expect(finding.message).to.be.a('string').and.not.equal('');
        expect(finding.likelyCauses).to.be.an('array').that.is.not.empty;
        expect(finding.queries).to.be.an('array');
      }
    });
  });

  describe('limits on queries and examples', () => {
    const affectedQueries = (count: number) => ids('q', count);
    const analyze = (count: number, options?: AnalyzeSearchSourcesOptions) =>
      lexicalChannel(
        affectedQueries(count).map((query, index) => entry(query, ['common', ...ids(`${query}-x`, index + 1)])),
        affectedQueries(count).map((query) => entry(query, ['common'])),
        options,
      );

    it('keeps at most five examples by default', () => {
      const found = only(analyze(8), 'storefront-only-products');

      expect(found.examples).to.have.lengthOf(DEFAULT_ANALYSIS_MAX_EXAMPLES);
      expect(found.queries).to.have.lengthOf(8);
    });

    it('keeps the examples of the most affected queries', () => {
      const found = only(analyze(8), 'storefront-only-products');

      expect(found.examples?.map((example) => example.query)).to.deep.equal(['q8', 'q7', 'q6', 'q5', 'q4']);
    });

    it('keeps the number of examples it is told to', () => {
      expect(only(analyze(8, {maxExamples: 2}), 'storefront-only-products').examples).to.have.lengthOf(2);
      expect(only(analyze(8, {maxExamples: 20}), 'storefront-only-products').examples).to.have.lengthOf(8);
    });

    it('keeps no examples when told so', () => {
      const found = only(analyze(8, {maxExamples: 0}), 'storefront-only-products');

      expect(found).to.not.have.property('examples');
      expect(found.queries).to.have.lengthOf(8);
    });

    it('lists at most ten queries by default, most affected first', () => {
      const found = only(analyze(14), 'storefront-only-products');

      expect(found.queries).to.have.lengthOf(DEFAULT_ANALYSIS_MAX_QUERIES);
      expect(found.queries.slice(0, 3)).to.deep.equal(['q14', 'q13', 'q12']);
      expect(found.message).to.include('in 14 of 14 compared queries');
    });

    it('lists the number of queries it is told to', () => {
      expect(only(analyze(8, {maxQueries: 3}), 'storefront-only-products').queries).to.deep.equal(['q8', 'q7', 'q6']);
      expect(only(analyze(8, {maxQueries: 0}), 'storefront-only-products').queries).to.deep.equal([]);
    });

    it('names at most five products in an example', () => {
      const analysis = lexicalChannel([entry('shoes', ['common', ...ids('x', 9)])], [entry('shoes', ['common'])]);

      expect(only(analysis, 'storefront-only-products').examples?.[0].productIds).to.deep.equal(ids('x', 5));
      expect(only(analysis, 'storefront-only-products').message).to.include('(9 products in total)');
    });
  });

  describe('result', () => {
    it('is the same for the same captures', () => {
      expect(analyzeSearchSources(agreeingSources())).to.deep.equal(analyzeSearchSources(agreeingSources()));
    });

    it('does not change the captures given', () => {
      const sources = deepFreeze(agreeingSources());
      const before = structuredClone(sources);

      analyzeSearchSources(sources);

      expect(sources).to.deep.equal(before);
    });

    it('survives a JSON round trip', () => {
      const analysis = analyzeSearchSources({
        storefrontLexical: lexicalStorefront([entry('shoes', ['a', 'x']), failedEntry('boots', 500, 'boom')]),
        scapiLexical: lexicalApi([entry('shoes', ['a', 'b']), entry('boots', ['c'])]),
        scapiSemantic: semanticApi([entry('shoes', ['b', 'a']), entry('boots', ['c'])]),
      });

      expect(analysis.findings.length).to.be.greaterThan(0);
      expect(JSON.parse(JSON.stringify(analysis))).to.deep.equal(analysis);
    });

    it('reports no findings, only the engine comparison, when everything agrees', () => {
      const analysis = analyzeSearchSources(agreeingSources());

      expect(analysis.findings.map((finding) => finding.code)).to.deep.equal(['engine-change', 'engine-change']);
      expect(analysis.findings.every((finding) => finding.severity === 'info')).to.equal(true);
    });
  });
});
