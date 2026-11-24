/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createShopperSearchClient} from '@salesforce/b2c-tooling-sdk/clients';
import {
  captureProductSearch,
  checkRefinements,
  normalizeQueries,
  parseQueryFile,
  SEARCH_CAPTURE_SCHEMA_VERSION,
} from '@salesforce/b2c-tooling-sdk/operations/search';

const SHORT_CODE = 'kv7kzm78';
const ORG_ID = 'f_ecom_abcd_123';
const SEARCH_URL = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/search/shopper-search/v1/organizations/${ORG_ID}/product-search`;

function searchResult(query: string, ids: string[], extra: Record<string, unknown> = {}) {
  return {
    query,
    total: ids.length * 10,
    limit: 25,
    offset: 0,
    hits: ids.map((productId) => ({productId, productName: `Product ${productId}`, hitType: 'master'})),
    refinements: [
      {
        attributeId: 'c_color',
        label: 'Color',
        values: [
          {value: 'red', label: 'Red', hitCount: 3},
          {value: 'blue', label: 'Blue', hitCount: 1},
        ],
      },
    ],
    sortingOptions: [
      {id: 'best-matches', label: 'Best Matches'},
      {id: 'price-low-to-high', label: 'Price Low To High'},
    ],
    searchPhraseSuggestions: {suggestedPhrases: [{phrase: `${query}s`, exactMatch: false}], suggestedTerms: []},
    ...extra,
  };
}

describe('operations/search capture', () => {
  const server = setupServer();
  const client = createShopperSearchClient({shortCode: SHORT_CODE, getAccessToken: () => 'shopper-token'});

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  afterEach(() => {
    server.resetHandlers();
  });

  after(() => {
    server.close();
  });

  it('captures hits, refinements and the served search mode for each query', async () => {
    const requests: URL[] = [];
    server.use(
      http.get(SEARCH_URL, ({request}) => {
        const url = new URL(request.url);
        requests.push(url);
        const q = url.searchParams.get('q')!;
        return HttpResponse.json(
          searchResult(q, q === 'shirt' ? ['p1', 'p2'] : ['p3'], {
            searchMode: 'semantic',
            effectiveSearchMode: q === 'shirt' ? 'semantic' : 'lexical',
          }),
        );
      }),
    );

    const progress: string[] = [];
    const capture = await captureProductSearch(client, {
      organizationId: ORG_ID,
      siteId: 'RefArch',
      queries: ['shirt', 'dress'],
      limit: 10,
      searchMode: 'semantic',
      locale: 'en-US',
      shortCode: SHORT_CODE,
      onResult: (entry, index, count) => progress.push(`${index + 1}/${count} ${entry.query}`),
    });

    expect(capture.schemaVersion).to.equal(SEARCH_CAPTURE_SCHEMA_VERSION);
    expect(capture.label).to.equal('semantic');
    expect(capture.request).to.deep.equal({
      source: 'scapi',
      shortCode: SHORT_CODE,
      organizationId: ORG_ID,
      siteId: 'RefArch',
      limit: 10,
      searchMode: 'semantic',
      locale: 'en-US',
    });
    expect(progress).to.deep.equal(['1/2 shirt', '2/2 dress']);

    expect(requests.map((url) => url.searchParams.get('searchMode'))).to.deep.equal(['semantic', 'semantic']);
    expect(requests.map((url) => url.searchParams.get('limit'))).to.deep.equal(['10', '10']);
    expect(requests[0].searchParams.get('locale')).to.equal('en-US');
    expect(requests[0].searchParams.has('currency')).to.equal(false);

    const [shirt, dress] = capture.results;
    expect(shirt.status).to.equal(200);
    expect(shirt.total).to.equal(20);
    expect(shirt.hits.map((hit) => hit.productId)).to.deep.equal(['p1', 'p2']);
    expect(shirt.effectiveSearchMode).to.equal('semantic');
    expect(shirt.refinements[0]).to.deep.equal({
      attributeId: 'c_color',
      label: 'Color',
      values: [
        {value: 'red', label: 'Red', hitCount: 3},
        {value: 'blue', label: 'Blue', hitCount: 1},
      ],
    });
    expect(shirt.sortingOptions).to.deep.equal(['best-matches', 'price-low-to-high']);
    expect(shirt.suggestedPhrases).to.deep.equal(['shirts']);
    expect(dress.effectiveSearchMode).to.equal('lexical');
    // No undefined-valued keys, so the capture matches what is saved to disk.
    expect(JSON.parse(JSON.stringify(capture))).to.deep.equal(capture);
  });

  it('omits searchMode when none is requested', async () => {
    let url: URL | undefined;
    server.use(
      http.get(SEARCH_URL, ({request}) => {
        url = new URL(request.url);
        return HttpResponse.json(searchResult('shirt', ['p1'], {selectedRefinements: {}}));
      }),
    );

    const capture = await captureProductSearch(client, {organizationId: ORG_ID, siteId: 'RefArch', queries: ['shirt']});

    expect(url?.searchParams.has('searchMode')).to.equal(false);
    expect(url?.searchParams.has('sort')).to.equal(false);
    expect(url?.searchParams.has('refine')).to.equal(false);
    expect(url?.searchParams.get('limit')).to.equal('25');
    expect(capture.label).to.equal('capture');
    expect(capture.request).to.not.have.any.keys('searchMode', 'sort', 'refine');
    expect(capture.results[0].effectiveSearchMode).to.equal(undefined);
    expect(capture.results[0]).to.not.have.property('selectedRefinements');
  });

  it('sends the sort and refinements and records hit prices and the applied refinements', async () => {
    let url: URL | undefined;
    server.use(
      http.get(SEARCH_URL, ({request}) => {
        url = new URL(request.url);
        return HttpResponse.json(
          searchResult('shirt', [], {
            hits: [
              {productId: 'p1', productName: 'Product p1', hitType: 'master', price: 9.5, priceMax: 12},
              {productId: 'p2', productName: 'Product p2', hitType: 'product', price: 20},
            ],
            selectedRefinements: {c_color: 'red|blue', price: '(0..50)'},
            selectedSortingOption: 'price-low-to-high',
          }),
        );
      }),
    );

    const capture = await captureProductSearch(client, {
      organizationId: ORG_ID,
      siteId: 'RefArch',
      queries: ['shirt'],
      sort: 'price-low-to-high',
      refine: ['c_color=red|blue', 'price=(0..50)'],
    });

    expect(url?.searchParams.get('sort')).to.equal('price-low-to-high');
    expect(url?.searchParams.getAll('refine')).to.deep.equal(['c_color=red|blue', 'price=(0..50)']);
    expect(capture.request).to.deep.include({sort: 'price-low-to-high', refine: ['c_color=red|blue', 'price=(0..50)']});
    const [shirt] = capture.results;
    expect(shirt.hits).to.deep.equal([
      {productId: 'p1', productName: 'Product p1', hitType: 'master', price: 9.5},
      {productId: 'p2', productName: 'Product p2', hitType: 'product', price: 20},
    ]);
    expect(shirt.selectedRefinements).to.deep.equal({c_color: 'red|blue', price: '(0..50)'});
    expect(shirt.selectedSortingOption).to.equal('price-low-to-high');
  });

  it('rejects refinements that are not attribute=value, and too many, without calling the API', async () => {
    expect(() => checkRefinements(['brand=Acme', 'c_color=red|blue', 'price=(0..50)'])).to.not.throw();
    const tooMany = Array.from({length: 10}, (_, index) => `c_attribute${index}=x`);
    const cases: Array<[string[], string]> = [
      [['brand'], 'Invalid refinement "brand": use attribute=value'],
      [['=Acme'], 'Invalid refinement "=Acme"'],
      [['brand='], 'Invalid refinement "brand="'],
      [tooMany, 'At most 9 refinements are allowed per request (got 10)'],
    ];
    for (const [refine, message] of cases) {
      try {
        await captureProductSearch(client, {organizationId: ORG_ID, siteId: 'RefArch', queries: ['shirt'], refine});
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include(message);
      }
    }
  });

  it('records a failed query and keeps going', async () => {
    server.use(
      http.get(SEARCH_URL, ({request}) => {
        const q = new URL(request.url).searchParams.get('q');
        if (q === 'bad') {
          return HttpResponse.json(
            {title: 'Bad Request', type: 'about:blank', detail: 'Invalid searchMode'},
            {status: 400},
          );
        }
        return HttpResponse.json(searchResult(q!, ['p1']));
      }),
    );

    const capture = await captureProductSearch(client, {
      organizationId: ORG_ID,
      siteId: 'RefArch',
      queries: ['bad', 'good'],
    });

    expect(capture.results).to.have.length(2);
    expect(capture.results[0]).to.include({query: 'bad', status: 400, error: 'Invalid searchMode'});
    expect(capture.results[0].hits).to.deep.equal([]);
    expect(capture.results[1]).to.include({query: 'good', status: 200});
    expect(capture.results[1].error).to.equal(undefined);
  });

  it('records a network failure with status 0', async () => {
    server.use(http.get(SEARCH_URL, () => HttpResponse.error()));

    const capture = await captureProductSearch(client, {organizationId: ORG_ID, siteId: 'RefArch', queries: ['shirt']});

    expect(capture.results[0].status).to.equal(0);
    expect(capture.results[0].error).to.be.a('string').and.not.equal('');
  });

  it('rejects an out-of-range limit and an empty query list without calling the API', async () => {
    try {
      await captureProductSearch(client, {organizationId: ORG_ID, siteId: 'RefArch', queries: ['shirt'], limit: 201});
      expect.fail('Should have thrown');
    } catch (error) {
      expect((error as Error).message).to.include('limit');
    }

    try {
      await captureProductSearch(client, {organizationId: ORG_ID, siteId: 'RefArch', queries: ['  ', '']});
      expect.fail('Should have thrown');
    } catch (error) {
      expect((error as Error).message).to.include('query');
    }
  });

  describe('normalizeQueries and parseQueryFile', () => {
    it('trims, drops blanks and repeats, and keeps order', () => {
      expect(normalizeQueries([' shirt ', 'dress', '', 'shirt', 'red dress'])).to.deep.equal([
        'shirt',
        'dress',
        'red dress',
      ]);
    });

    it('reads one query per line and skips comments', () => {
      const content = '# fashion\nshirt\r\n\n  # not a query\nleather boots\nshirt\n';
      expect(parseQueryFile(content)).to.deep.equal(['shirt', 'leather boots']);
    });
  });
});
