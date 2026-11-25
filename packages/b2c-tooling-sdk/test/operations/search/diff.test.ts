/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  compareRankedLists,
  compareRefinements,
  diffSearchCaptures,
  priceOrderOf,
  SEARCH_CAPTURE_SCHEMA_VERSION,
  type ScapiSearchCaptureRequest,
  type SearchCapture,
  type SearchCaptureEntry,
  type StorefrontSearchCaptureRequest,
} from '@salesforce/b2c-tooling-sdk/operations/search';

function entry(query: string, ids: string[], overrides: Partial<SearchCaptureEntry> = {}): SearchCaptureEntry {
  return {
    query,
    status: 200,
    latencyMs: 10,
    total: ids.length,
    hits: ids.map((productId) => ({productId})),
    refinements: [],
    ...overrides,
  };
}

function capture(
  label: string,
  results: SearchCaptureEntry[],
  request: Partial<ScapiSearchCaptureRequest> = {},
): SearchCapture {
  return {
    schemaVersion: SEARCH_CAPTURE_SCHEMA_VERSION,
    label,
    capturedAt: '2026-01-01T00:00:00.000Z',
    request: {organizationId: 'f_ecom_abcd_123', siteId: 'RefArch', limit: 25, ...request},
    results,
  };
}

function storefrontCapture(
  label: string,
  results: SearchCaptureEntry[],
  request: Partial<StorefrontSearchCaptureRequest> = {},
): SearchCapture {
  return {
    schemaVersion: SEARCH_CAPTURE_SCHEMA_VERSION,
    label,
    capturedAt: '2026-01-01T00:00:00.000Z',
    request: {
      host: 'www.example.com',
      siteId: 'RefArch',
      locale: 'default',
      path: '/on/demandware.store/Sites-RefArch-Site/default/Search-Show',
      limit: 25,
      ...request,
      source: 'storefront',
    },
    results,
  };
}

describe('operations/search diff', () => {
  describe('compareRankedLists', () => {
    it('reports identical lists as full agreement', () => {
      const result = compareRankedLists(['a', 'b', 'c'], ['a', 'b', 'c'], {kValues: [1, 3]});

      expect(result.overlap).to.deep.equal({effectiveMaxK: 3, atK: {'1': 1, '3': 1}});
      expect(result.membership.containment).to.equal('equal');
      expect(result.order).to.include({top1Agree: true, longestCommonPrefix: 3, firstDivergenceRank: null});
      expect(result.order.displacement).to.deep.equal({compared: 3, meanAbs: 0, maxAbs: 0, topMovers: []});
    });

    it('caps overlap at the shorter list and always reports the full comparable depth', () => {
      const result = compareRankedLists(['a', 'b', 'c', 'd', 'e', 'f'], ['a', 'x', 'c', 'd'], {kValues: [1, 3, 10]});

      expect(result.overlap.effectiveMaxK).to.equal(4);
      expect(result.overlap.atK).to.deep.equal({'1': 1, '3': 0.6667, '4': 0.75});
      expect(result.overlap.skippedK).to.deep.equal([10]);
    });

    it('lists the IDs only one side returned, in rank order', () => {
      const result = compareRankedLists(['a', 'b', 'c', 'd'], ['c', 'e', 'a', 'f']);

      expect(result.membership).to.deep.equal({
        intersectionSize: 2,
        baselineOnlyCount: 2,
        candidateOnlyCount: 2,
        containment: 'neither_subset',
        baselineOnlyIds: ['b', 'd'],
        candidateOnlyIds: ['e', 'f'],
      });
    });

    it('names subset, disjoint and empty relationships', () => {
      expect(compareRankedLists(['a'], ['a', 'b']).membership.containment).to.equal('baseline_subset_of_candidate');
      expect(compareRankedLists(['a', 'b'], ['b']).membership.containment).to.equal('candidate_subset_of_baseline');
      expect(compareRankedLists(['a'], ['b']).membership.containment).to.equal('disjoint');
      expect(compareRankedLists([], ['b']).membership.containment).to.equal('baseline_empty');
      expect(compareRankedLists(['a'], []).membership.containment).to.equal('candidate_empty');
      const empty = compareRankedLists([], []);
      expect(empty.membership.containment).to.equal('both_empty');
      expect(empty.overlap).to.deep.equal({effectiveMaxK: 0, atK: {}, skippedK: [1, 3, 5, 10]});
    });

    it('truncates long ID lists when maxIds is set', () => {
      const result = compareRankedLists(['a', 'b', 'c'], ['x', 'y'], {maxIds: 1});

      expect(result.membership.baselineOnlyIds).to.deep.equal(['a']);
      expect(result.membership.candidateOnlyIds).to.deep.equal(['x']);
      expect(result.membership.baselineOnlyCount).to.equal(3);
      expect(result.membership.truncated).to.equal(true);
    });

    it('measures rank displacement over shared products only', () => {
      const result = compareRankedLists(['a', 'b', 'c', 'd'], ['c', 'a', 'x', 'b']);

      expect(result.order.top1Agree).to.equal(false);
      expect(result.order.baselineTop1RankInCandidate).to.equal(2);
      expect(result.order.candidateTop1RankInBaseline).to.equal(3);
      expect(result.order.firstDivergenceRank).to.equal(1);
      expect(result.order.displacement.compared).to.equal(3);
      expect(result.order.displacement.maxAbs).to.equal(2);
      expect(result.order.displacement.meanAbs).to.equal(1.67);
      expect(result.order.displacement.topMovers[0]).to.deep.equal({
        productId: 'b',
        baselineRank: 2,
        candidateRank: 4,
        delta: 2,
      });
    });
  });

  describe('compareRefinements', () => {
    it('reports refinements on one side only and changed value sets', () => {
      const result = compareRefinements(
        [
          {attributeId: 'brand', values: [{value: 'acme'}, {value: 'globex'}]},
          {attributeId: 'c_color', values: [{value: 'red'}]},
          {attributeId: 'price', values: [{value: '(0..50)'}]},
        ],
        [
          {attributeId: 'brand', values: [{value: 'acme'}, {value: 'initech'}]},
          {attributeId: 'price', values: [{value: '(0..50)'}]},
          {attributeId: 'c_size', values: [{value: 'M'}]},
        ],
      );

      expect(result.baselineOnly).to.deep.equal(['c_color']);
      expect(result.candidateOnly).to.deep.equal(['c_size']);
      expect(result.changed).to.deep.equal([
        {
          attributeId: 'brand',
          baselineValueCount: 2,
          candidateValueCount: 2,
          baselineOnlyValues: ['globex'],
          candidateOnlyValues: ['initech'],
          countChanges: [],
        },
      ]);
    });

    it('reports hit count changes for values both sides returned', () => {
      const result = compareRefinements(
        [
          {
            attributeId: 'brand',
            values: [
              {value: 'acme', hitCount: 75},
              {value: 'globex', hitCount: 64},
              {value: 'initech', hitCount: 2},
              {value: 'acme', hitCount: 1},
            ],
          },
          {attributeId: 'c_color', values: [{value: 'red', hitCount: 3}]},
        ],
        [
          {
            attributeId: 'brand',
            values: [{value: 'acme', hitCount: 75}, {value: 'globex', hitCount: 58}, {value: 'initech'}],
          },
          {attributeId: 'c_color', values: [{value: 'red', hitCount: 3}]},
        ],
      );

      // Same values on both sides: only the counts differ. A value without a count is not compared,
      // and a repeated value keeps its first count.
      expect(result.changed).to.deep.equal([
        {
          attributeId: 'brand',
          baselineValueCount: 3,
          candidateValueCount: 3,
          baselineOnlyValues: [],
          candidateOnlyValues: [],
          countChanges: [{value: 'globex', baselineHitCount: 64, candidateHitCount: 58}],
        },
      ]);
    });
  });

  describe('priceOrderOf', () => {
    const hits = (...prices: Array<number | undefined>) =>
      prices.map((price, index) => ({productId: `p${index}`, ...(price !== undefined && {price})}));

    it('names the order of the prices, allowing equal neighbors', () => {
      expect(priceOrderOf(hits(5, 5, 9.99, 20))).to.equal('ascending');
      expect(priceOrderOf(hits(20, 9.99, 9.99))).to.equal('descending');
      expect(priceOrderOf(hits(4, 4, 4))).to.equal('equal');
      expect(priceOrderOf(hits(5, 20, 9.99))).to.equal('unordered');
    });

    it('skips hits without a price and needs at least two prices', () => {
      expect(priceOrderOf(hits(5, undefined, 9, Number.NaN, 12))).to.equal('ascending');
      expect(priceOrderOf(hits(5, undefined))).to.equal(undefined);
      expect(priceOrderOf([])).to.equal(undefined);
    });
  });

  describe('diffSearchCaptures', () => {
    it('compares matching queries and summarizes across them', () => {
      const baseline = capture(
        'lexical',
        [entry('shirt', ['a', 'b', 'c']), entry('dress', ['d', 'e']), entry('zzzz', [])],
        {searchMode: 'lexical'},
      );
      const candidate = capture(
        'semantic',
        [
          entry('shirt', ['a', 'c', 'x'], {effectiveSearchMode: 'semantic'}),
          entry('dress', ['d', 'e'], {effectiveSearchMode: 'lexical'}),
          entry('zzzz', ['q'], {effectiveSearchMode: 'semantic'}),
        ],
        {searchMode: 'semantic'},
      );

      const diff = diffSearchCaptures(baseline, candidate, {kValues: [1, 2]});

      expect(diff.kValues).to.deep.equal([1, 2]);
      expect(diff.summary.queries).to.equal(3);
      expect(diff.summary.compared).to.equal(3);
      expect(diff.summary.top1Agreements).to.equal(2);
      // shirt: @1 = 1, @2 = 0.5; dress: @1 = 1, @2 = 1; zzzz: no comparable depth
      expect(diff.summary.meanOverlapAtK).to.deep.equal({'1': 1, '2': 0.75});
      expect(diff.summary.baseline).to.include({
        label: 'lexical',
        zeroResults: 1,
        queriesWithHits: 2,
        modeFallbacks: 0,
      });
      expect(diff.summary.baseline.effectiveSearchModes).to.deep.equal({unreported: 3});
      expect(diff.summary.candidate.modeFallbacks).to.equal(1);
      expect(diff.summary.candidate.effectiveSearchModes).to.deep.equal({semantic: 2, lexical: 1});

      const dress = diff.queries.find((query) => query.query === 'dress')!;
      expect(dress.candidate.modeFallback).to.equal(true);
      expect(dress.candidate.effectiveSearchMode).to.equal('lexical');
      expect(diff.queries.find((query) => query.query === 'shirt')!.candidate.modeFallback).to.equal(undefined);
      expect(diff.queries.find((query) => query.query === 'zzzz')!.results!.membership.containment).to.equal(
        'baseline_empty',
      );
      expect(diff.warnings).to.deep.equal([]);
    });

    it('flags many queries returning the same result list', () => {
      const same = ['a', 'b', 'c'];
      const baseline = capture('before', [entry('shirt', ['s1']), entry('dress', ['d1']), entry('boots', ['b1'])]);
      const candidate = capture('after', [entry('shirt', same), entry('dress', same), entry('boots', same)]);

      const diff = diffSearchCaptures(baseline, candidate);

      expect(diff.summary.baseline).to.include({distinctResultSets: 3, largestSharedResultSet: 1});
      expect(diff.summary.candidate).to.include({distinctResultSets: 1, largestSharedResultSet: 3});
    });

    it('omits metrics for failed queries and counts the failures', () => {
      const baseline = capture('before', [entry('shirt', ['a']), entry('dress', ['b'])]);
      const candidate = capture('after', [
        entry('shirt', [], {status: 401, error: 'Unauthorized'}),
        entry('dress', ['b']),
      ]);

      const diff = diffSearchCaptures(baseline, candidate);
      const shirt = diff.queries.find((query) => query.query === 'shirt')!;

      expect(shirt.note).to.equal('candidate failed');
      expect(shirt.results).to.equal(undefined);
      expect(shirt.candidate).to.include({status: 401, error: 'Unauthorized'});
      expect(diff.summary.compared).to.equal(1);
      expect(diff.summary.candidate.failed).to.equal(1);
    });

    it('lists unmatched queries and request differences', () => {
      const baseline = capture('before', [entry('shirt', ['a']), entry('hat', ['h'])], {limit: 25});
      const candidate = capture('after', [entry('shirt', ['a']), entry('scarf', ['s'])], {limit: 10, locale: 'fr-FR'});

      const diff = diffSearchCaptures(baseline, candidate);

      expect(diff.summary.queries).to.equal(1);
      expect(diff.unmatchedQueries).to.deep.equal({baselineOnly: ['hat'], candidateOnly: ['scarf']});
      expect(diff.warnings).to.have.length(2);
      expect(diff.warnings[0]).to.include('limit');
      expect(diff.warnings[1]).to.include('locale');
    });

    it('compares a storefront capture with a Shopper Search capture', () => {
      const storefront = storefrontCapture('storefront', [
        entry('shirt', ['a', 'b'], {
          refinements: [
            {attributeId: 'color', label: 'Color', values: [{value: 'Blue'}, {value: 'Red'}]},
            {attributeId: 'price', label: 'Price', values: [{value: '(0..20)'}]},
          ],
          redirectedTo: 'https://www.example.com/shirts/',
        }),
      ]);
      const api = capture(
        'semantic',
        [
          entry('shirt', ['a', 'b'], {
            effectiveSearchMode: 'lexical',
            refinements: [
              {attributeId: 'c_color', label: 'Color', values: [{value: 'Blue'}, {value: 'Red'}]},
              {attributeId: 'price', label: 'Price', values: [{value: '(0.00..20.00)'}]},
              {attributeId: 'c_size', label: 'Size', values: []},
            ],
          }),
        ],
        {searchMode: 'semantic', limit: 10},
      );

      const diff = diffSearchCaptures(storefront, api);
      const [shirt] = diff.queries;

      expect(shirt.refinements).to.deep.equal({baselineOnly: [], candidateOnly: [], changed: []});
      expect(shirt.results?.overlap.atK['1']).to.equal(1);
      expect(shirt.baseline.redirectedTo).to.equal('https://www.example.com/shirts/');
      expect(shirt.baseline.modeFallback).to.equal(undefined);
      expect(shirt.candidate.modeFallback).to.equal(true);
      expect(diff.summary.refinementDifferences).to.equal(0);
      expect(diff.warnings).to.have.length(2);
      expect(diff.warnings[0]).to.include('different sources (baseline storefront, candidate scapi)');
      expect(diff.warnings[1]).to.equal('Captures differ in limit: baseline 25, candidate 10');
    });

    it('keeps refinement IDs as they are when both captures come from the same source', () => {
      const baseline = capture('before', [
        entry('shirt', ['a'], {refinements: [{attributeId: 'c_color', values: [{value: 'Blue'}]}]}),
      ]);
      const candidate = capture('after', [
        entry('shirt', ['a'], {refinements: [{attributeId: 'color', values: [{value: 'Blue'}]}]}),
      ]);

      const [shirt] = diffSearchCaptures(baseline, candidate).queries;

      expect(shirt.refinements).to.deep.equal({baselineOnly: ['c_color'], candidateOnly: ['color'], changed: []});
    });

    it('lists how two storefront captures were requested differently', () => {
      const baseline = storefrontCapture('before', [entry('shirt', ['a'])], {params: {srule: 'top-sellers'}});
      const candidate = storefrontCapture('after', [entry('shirt', ['a'])], {
        host: 'staging.example.com',
        bypassPageCache: true,
      });

      const diff = diffSearchCaptures(baseline, candidate);

      expect(diff.warnings).to.deep.equal([
        'Captures differ in host: baseline www.example.com, candidate staging.example.com',
        'Captures differ in params: baseline {"srule":"top-sellers"}, candidate (not set)',
        'Captures differ in bypassPageCache: baseline (not set), candidate true',
      ]);
    });

    it('compares the sorting options, the applied sort and the order of the hit prices', () => {
      const priced = (query: string, prices: number[], overrides: Partial<SearchCaptureEntry> = {}) =>
        entry(query, [], {
          hits: prices.map((price, index) => ({productId: `${query}-${index}`, price})),
          ...overrides,
        });
      const baseline = capture(
        'lexical',
        [
          priced('mug', [5, 9, 12], {
            sortingOptions: ['best-matches', 'price-low-to-high', 'top-sellers'],
            selectedSortingOption: 'price-low-to-high',
          }),
          priced('cup', [3, 7], {
            sortingOptions: ['best-matches', 'price-low-to-high', 'top-sellers'],
            selectedSortingOption: 'price-low-to-high',
          }),
        ],
        {searchMode: 'lexical', sort: 'price-low-to-high'},
      );
      const candidate = capture(
        'semantic',
        [
          priced('mug', [12, 5, 9], {
            sortingOptions: ['best-matches', 'price-low-to-high'],
            selectedSortingOption: 'price-low-to-high',
          }),
          priced('cup', [3], {sortingOptions: ['best-matches', 'price-low-to-high', 'top-sellers']}),
        ],
        {searchMode: 'semantic', sort: 'price-low-to-high'},
      );

      const diff = diffSearchCaptures(baseline, candidate);
      const mug = diff.queries.find((query) => query.query === 'mug')!;
      const cup = diff.queries.find((query) => query.query === 'cup')!;

      expect(mug.sorting).to.deep.equal({
        baselineOnly: ['top-sellers'],
        candidateOnly: [],
        baselineSelected: 'price-low-to-high',
        candidateSelected: 'price-low-to-high',
      });
      expect(mug.baseline.priceOrder).to.equal('ascending');
      expect(mug.candidate.priceOrder).to.equal('unordered');
      expect(cup.sorting).to.deep.equal({
        baselineOnly: [],
        candidateOnly: [],
        baselineSelected: 'price-low-to-high',
      });
      expect(cup.candidate).to.not.have.property('priceOrder');
      expect(diff.summary.sortingDifferences).to.equal(2);
      expect(diff.summary.baseline).to.deep.include({
        sortingOptions: ['best-matches', 'price-low-to-high', 'top-sellers'],
        selectedSortingOptions: {'price-low-to-high': 2},
        priceOrders: {ascending: 2},
      });
      expect(diff.summary.candidate).to.deep.include({
        sortingOptions: ['best-matches', 'price-low-to-high', 'top-sellers'],
        selectedSortingOptions: {'price-low-to-high': 1, unreported: 1},
        priceOrders: {unordered: 1},
      });
      expect(diff.warnings).to.deep.equal([]);
    });

    it('counts sorting option IDs from the response as plain keys', () => {
      const candidate = capture('after', [entry('mug', ['a'], {selectedSortingOption: '__proto__'})]);

      const {selectedSortingOptions} = diffSearchCaptures(capture('before', [entry('mug', ['a'])]), candidate).summary
        .candidate;

      expect(Object.getOwnPropertyNames(selectedSortingOptions)).to.deep.equal(['__proto__']);
      expect(Object.getPrototypeOf(selectedSortingOptions)).to.equal(Object.prototype);
      expect(Object.getOwnPropertyDescriptor(selectedSortingOptions, '__proto__')?.value).to.equal(1);
    });

    it('counts refinement hit count changes and summarizes each refinement', () => {
      const brand = (...counts: number[]) => ({
        attributeId: 'brand',
        values: counts.map((hitCount, index) => ({value: `brand-${index}`, hitCount})),
      });
      const productType = {attributeId: 'c_productType', values: [{value: 'Candles', hitCount: 12}]};
      const baseline = capture('lexical', [
        entry('candle', ['a'], {refinements: [brand(85, 60), productType]}),
        entry('soap', ['b'], {refinements: [brand(10), productType]}),
        entry('jam', ['c'], {refinements: [brand(4)]}),
      ]);
      const candidate = capture('semantic', [
        entry('candle', ['a'], {refinements: [brand(75, 64)]}),
        entry('soap', ['b'], {refinements: [brand(10)]}),
        entry('jam', ['c'], {refinements: [{attributeId: 'brand', values: [{value: 'other', hitCount: 4}]}]}),
      ]);

      const diff = diffSearchCaptures(baseline, candidate);

      expect(diff.summary).to.include({refinementDifferences: 3, refinementCountDifferences: 1});
      expect(diff.summary.refinementAttributes).to.deep.equal([
        {attributeId: 'brand', both: 3, baselineOnly: 0, candidateOnly: 0, valuesDiffer: 1, countsDiffer: 1},
        {attributeId: 'c_productType', both: 0, baselineOnly: 2, candidateOnly: 0, valuesDiffer: 0, countsDiffer: 0},
      ]);
      expect(diff.queries[0].refinements!.changed[0].countChanges).to.deep.equal([
        {value: 'brand-0', baselineHitCount: 85, candidateHitCount: 75},
        {value: 'brand-1', baselineHitCount: 60, candidateHitCount: 64},
      ]);
    });

    it('warns when the sort or the refinements differ, in any order', () => {
      const baseline = capture('before', [entry('mug', ['a'])], {refine: ['price=(0..50)', 'brand=Acme']});
      const sameRefinements = capture('after', [entry('mug', ['a'])], {refine: ['brand=Acme', 'price=(0..50)']});
      const otherSort = capture('after', [entry('mug', ['a'])], {sort: 'top-sellers', refine: ['brand=Acme']});

      expect(diffSearchCaptures(baseline, sameRefinements).warnings).to.deep.equal([]);
      expect(diffSearchCaptures(baseline, otherSort).warnings).to.deep.equal([
        'Captures differ in sort: baseline (not set), candidate top-sellers',
        'Captures differ in refine: baseline ["brand=Acme","price=(0..50)"], candidate ["brand=Acme"]',
      ]);
    });

    it('rejects input that is not a capture', () => {
      const valid = capture('ok', [entry('shirt', ['a'])]);
      expect(() => diffSearchCaptures({foo: 1} as unknown as SearchCapture, valid)).to.throw('baseline');
      expect(() => diffSearchCaptures(valid, {...valid, schemaVersion: 2} as unknown as SearchCapture)).to.throw(
        'candidate',
      );
    });

    it('rejects k values with no positive integer', () => {
      const valid = capture('ok', [entry('shirt', ['a'])]);
      expect(() => diffSearchCaptures(valid, valid, {kValues: [0, -1]})).to.throw('kValues');
    });
  });
});
