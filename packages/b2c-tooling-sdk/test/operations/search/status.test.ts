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
  checkSearchModes,
  MAX_STATUS_QUERIES,
  SEARCH_CAPTURE_SCHEMA_VERSION,
  type RequestedSearchMode,
  type SearchModeStatus,
} from '@salesforce/b2c-tooling-sdk/operations/search';

const SHORT_CODE = 'kv7kzm78';
const ORG_ID = 'f_ecom_abcd_123';
const SEARCH_URL = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/search/shopper-search/v1/organizations/${ORG_ID}/product-search`;
const SEARCH_PREFERENCES =
  'Merchant Tools > Agentic Commerce Search > Search Preferences > Enable Agentic Commerce Search';

/** What the search API answers: an engine that served the request, no engine, an error or a network failure. */
type Reply = {detail: string; status: number} | 'lexical' | 'network' | 'semantic' | 'unreported';

type Summary = Pick<SearchModeStatus, 'agenticCommerceSearch' | 'semanticRequests' | 'siteDefault'>;

const BAD_MODE: Reply = {status: 400, detail: 'Invalid searchMode'};
const UNAVAILABLE: Reply = {status: 500, detail: 'Search is unavailable'};

/** A site with Agentic Commerce Search on: the default is semantic, and each mode is served as requested. */
function healthy(requested: RequestedSearchMode): Reply {
  return requested === 'lexical' ? 'lexical' : 'semantic';
}

function searchResult(query: string, engine?: string) {
  return {
    query,
    total: 12,
    limit: 1,
    offset: 0,
    hits: [{productId: `${query}-1`, productName: `Product ${query}`}],
    refinements: [],
    ...(engine && {effectiveSearchMode: engine}),
  };
}

function summaryOf(status: SearchModeStatus): Summary {
  return {
    agenticCommerceSearch: status.agenticCommerceSearch,
    semanticRequests: status.semanticRequests,
    siteDefault: status.siteDefault,
  };
}

describe('operations/search status', () => {
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

  /** Answers every productSearch request from `reply` and returns the requests received, in order. */
  function serve(reply: (requested: RequestedSearchMode, query: string) => Reply): URL[] {
    const requests: URL[] = [];
    server.use(
      http.get(SEARCH_URL, ({request}) => {
        const url = new URL(request.url);
        requests.push(url);
        const query = url.searchParams.get('q')!;
        const result = reply((url.searchParams.get('searchMode') ?? 'default') as RequestedSearchMode, query);
        if (result === 'network') return HttpResponse.error();
        if (typeof result === 'object') {
          return HttpResponse.json(
            {title: 'Error', type: 'about:blank', detail: result.detail},
            {status: result.status},
          );
        }
        return HttpResponse.json(searchResult(query, result === 'unreported' ? undefined : result));
      }),
    );
    return requests;
  }

  function check(queries: string[], options: {currency?: string; locale?: string} = {}): Promise<SearchModeStatus> {
    return checkSearchModes(client, {organizationId: ORG_ID, siteId: 'RefArch', queries, ...options});
  }

  describe('requests', () => {
    it('sends each query without a search mode, as lexical and as semantic, asking for one hit', async () => {
      const requests = serve(healthy);

      await check(['red dress', 'leather boots']);

      expect(requests.map((url) => [url.searchParams.get('q'), url.searchParams.get('searchMode')])).to.deep.equal([
        ['red dress', null],
        ['red dress', 'lexical'],
        ['red dress', 'semantic'],
        ['leather boots', null],
        ['leather boots', 'lexical'],
        ['leather boots', 'semantic'],
      ]);
      expect(requests.map((url) => url.searchParams.get('limit'))).to.deep.equal(['1', '1', '1', '1', '1', '1']);
      expect(requests.map((url) => url.searchParams.get('siteId'))).to.deep.equal(Array(6).fill('RefArch'));
      expect(requests[0].searchParams.has('locale')).to.equal(false);
      expect(requests[0].searchParams.has('currency')).to.equal(false);
    });

    it('sends the locale and currency with every request when given', async () => {
      const requests = serve(healthy);

      await check(['red dress'], {locale: 'en-US', currency: 'USD'});

      expect(requests).to.have.length(3);
      expect(requests.map((url) => url.searchParams.get('locale'))).to.deep.equal(['en-US', 'en-US', 'en-US']);
      expect(requests.map((url) => url.searchParams.get('currency'))).to.deep.equal(['USD', 'USD', 'USD']);
    });

    it('drops blank and repeated queries and accepts the most queries allowed', async () => {
      const requests = serve(healthy);

      const status = await check([
        ' red dress ',
        'red dress',
        '',
        'blue jeans',
        'leather boots',
        'wool coat',
        'rain jacket',
      ]);

      expect(MAX_STATUS_QUERIES).to.equal(5);
      expect(requests).to.have.length(15);
      expect(status.probes.map((probe) => probe.query)).to.deep.equal(
        ['red dress', 'blue jeans', 'leather boots', 'wool coat', 'rain jacket'].flatMap((query) => [
          query,
          query,
          query,
        ]),
      );
    });

    it('rejects no queries and too many queries without calling the API', async () => {
      const requests = serve(healthy);

      for (const queries of [[], ['  ', '']]) {
        try {
          await check(queries);
          expect.fail('Should have thrown');
        } catch (error) {
          expect((error as Error).message).to.include('At least one query is required');
        }
      }

      try {
        await check(['a b', 'c d', 'e f', 'g h', 'i j', 'k l']);
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.equal('At most 5 queries are allowed (got 6)');
      }

      expect(requests).to.have.length(0);
    });
  });

  describe('result', () => {
    it('records every request with the engine that served it', async () => {
      serve((requested, query) => (requested === 'default' && query === 'blue jeans' ? 'lexical' : healthy(requested)));

      const status = await checkSearchModes(client, {
        organizationId: ORG_ID,
        siteId: 'RefArch',
        shortCode: SHORT_CODE,
        queries: ['red dress', 'blue jeans'],
      });

      expect(status.schemaVersion).to.equal(SEARCH_CAPTURE_SCHEMA_VERSION);
      expect(status).to.include({siteId: 'RefArch', organizationId: ORG_ID, shortCode: SHORT_CODE});
      expect(new Date(status.checkedAt).toISOString()).to.equal(status.checkedAt);
      expect(
        status.probes.map(({query, requested, status: code, total, effectiveSearchMode}) => ({
          query,
          requested,
          status: code,
          total,
          effectiveSearchMode,
        })),
      ).to.deep.equal([
        {query: 'red dress', requested: 'default', status: 200, total: 12, effectiveSearchMode: 'semantic'},
        {query: 'red dress', requested: 'lexical', status: 200, total: 12, effectiveSearchMode: 'lexical'},
        {query: 'red dress', requested: 'semantic', status: 200, total: 12, effectiveSearchMode: 'semantic'},
        {query: 'blue jeans', requested: 'default', status: 200, total: 12, effectiveSearchMode: 'lexical'},
        {query: 'blue jeans', requested: 'lexical', status: 200, total: 12, effectiveSearchMode: 'lexical'},
        {query: 'blue jeans', requested: 'semantic', status: 200, total: 12, effectiveSearchMode: 'semantic'},
      ]);
      for (const probe of status.probes) {
        expect(probe.latencyMs).to.be.a('number').and.at.least(0);
        expect(probe).to.not.have.property('error');
      }
      expect(status.warnings).to.deep.equal([]);
      // No undefined-valued keys, so the result matches what `--json` prints.
      expect(JSON.parse(JSON.stringify(status))).to.deep.equal(status);
    });

    it('leaves out the short code when none is given', async () => {
      serve(healthy);

      const status = await check(['red dress']);

      expect(status).to.not.have.property('shortCode');
    });

    it('records an API error with its status and message and keeps probing', async () => {
      const requests = serve((requested) => (requested === 'lexical' ? BAD_MODE : healthy(requested)));

      const status = await check(['red dress', 'blue jeans']);

      expect(requests).to.have.length(6);
      const lexical = status.probes.filter((probe) => probe.requested === 'lexical');
      expect(lexical).to.have.length(2);
      for (const probe of lexical) {
        expect(probe).to.include({status: 400, error: 'Invalid searchMode'});
        expect(probe).to.not.have.any.keys('total', 'effectiveSearchMode');
      }
      expect(status.probes.filter((probe) => probe.error === undefined)).to.have.length(4);
    });

    it('records a network failure with status 0 and a message', async () => {
      serve((requested) => (requested === 'semantic' ? 'network' : healthy(requested)));

      const status = await check(['red dress']);

      const semantic = status.probes.find((probe) => probe.requested === 'semantic')!;
      expect(semantic.status).to.equal(0);
      expect(semantic.error).to.be.a('string').and.not.equal('');
      expect(status.semanticRequests).to.equal('failed');
      expect(status.warnings.join(' ')).to.not.include('HTTP 0');
    });
  });

  describe('verdict', () => {
    interface Case {
      expected: Summary;
      name: string;
      queries: string[];
      reply: (requested: RequestedSearchMode, query: string) => Reply;
    }

    const cases: Case[] = [
      {
        name: 'serving: a semantic request is served by semantic search',
        queries: ['red dress'],
        reply: healthy,
        expected: {agenticCommerceSearch: 'serving', semanticRequests: 'served', siteDefault: 'semantic'},
      },
      {
        name: 'serving: one query is served by semantic search while a single-word lookup falls back',
        queries: ['shirt', 'red dress'],
        reply: (requested, query) => (requested === 'semantic' && query === 'shirt' ? 'lexical' : healthy(requested)),
        expected: {agenticCommerceSearch: 'serving', semanticRequests: 'served', siteDefault: 'semantic'},
      },
      {
        name: 'serving: another semantic request failing does not matter',
        queries: ['red dress', 'blue jeans'],
        reply: (requested, query) =>
          requested === 'semantic' && query === 'red dress' ? UNAVAILABLE : healthy(requested),
        expected: {agenticCommerceSearch: 'serving', semanticRequests: 'served', siteDefault: 'semantic'},
      },
      {
        name: 'serving, with a lexical site default: requests without a search mode are not served by semantic search',
        queries: ['red dress'],
        reply: (requested) => (requested === 'default' ? 'lexical' : healthy(requested)),
        expected: {agenticCommerceSearch: 'serving', semanticRequests: 'served', siteDefault: 'lexical'},
      },
      {
        name: 'not-serving: multi-word queries fall back to lexical search',
        queries: ['red dress'],
        reply: () => 'lexical',
        expected: {agenticCommerceSearch: 'not-serving', semanticRequests: 'fallback', siteDefault: 'lexical'},
      },
      {
        name: 'not-serving: a multi-word query falls back while another semantic request reports no engine',
        queries: ['red dress', 'blue jeans'],
        reply: (requested, query) => {
          if (requested !== 'semantic') return 'lexical';
          return query === 'red dress' ? 'lexical' : 'unreported';
        },
        expected: {agenticCommerceSearch: 'not-serving', semanticRequests: 'fallback', siteDefault: 'lexical'},
      },
      {
        name: 'unknown: only a single-word query falls back',
        queries: ['shirt'],
        reply: () => 'lexical',
        expected: {agenticCommerceSearch: 'unknown', semanticRequests: 'fallback', siteDefault: 'lexical'},
      },
      {
        name: 'unknown: the multi-word query fails while the single-word query falls back',
        queries: ['shirt', 'red dress'],
        reply: (requested, query) => {
          if (requested === 'semantic' && query === 'red dress') return UNAVAILABLE;
          return 'lexical';
        },
        expected: {agenticCommerceSearch: 'unknown', semanticRequests: 'fallback', siteDefault: 'lexical'},
      },
      {
        name: 'not-serving: the API rejects the semantic search mode with HTTP 400',
        queries: ['red dress', 'blue jeans'],
        reply: (requested) => (requested === 'semantic' ? BAD_MODE : 'lexical'),
        expected: {agenticCommerceSearch: 'not-serving', semanticRequests: 'rejected', siteDefault: 'lexical'},
      },
      {
        name: 'not-serving: the semantic search mode is rejected while only the lexical request succeeds',
        queries: ['red dress'],
        reply: (requested) => (requested === 'lexical' ? 'lexical' : BAD_MODE),
        expected: {agenticCommerceSearch: 'not-serving', semanticRequests: 'rejected', siteDefault: 'failed'},
      },
      {
        name: 'unknown: every request is rejected with HTTP 400, so the cause is not the search mode',
        queries: ['red dress'],
        reply: () => ({status: 400, detail: 'Invalid locale'}),
        expected: {agenticCommerceSearch: 'unknown', semanticRequests: 'rejected', siteDefault: 'failed'},
      },
      {
        name: 'unknown: requests succeed without reporting an engine',
        queries: ['red dress'],
        reply: () => 'unreported',
        expected: {agenticCommerceSearch: 'unknown', semanticRequests: 'unreported', siteDefault: 'unreported'},
      },
      {
        name: 'unknown: semantic requests fail with a server error',
        queries: ['red dress'],
        reply: (requested) => (requested === 'semantic' ? UNAVAILABLE : 'lexical'),
        expected: {agenticCommerceSearch: 'unknown', semanticRequests: 'failed', siteDefault: 'lexical'},
      },
      {
        name: 'unknown: semantic requests fail with different errors, so they are not all rejected',
        queries: ['red dress', 'blue jeans'],
        reply: (requested, query) => {
          if (requested !== 'semantic') return 'lexical';
          return query === 'red dress' ? BAD_MODE : UNAVAILABLE;
        },
        expected: {agenticCommerceSearch: 'unknown', semanticRequests: 'failed', siteDefault: 'lexical'},
      },
      {
        name: 'unknown: semantic requests fail with a network error',
        queries: ['red dress'],
        reply: (requested) => (requested === 'semantic' ? 'network' : 'lexical'),
        expected: {agenticCommerceSearch: 'unknown', semanticRequests: 'failed', siteDefault: 'lexical'},
      },
      {
        name: 'site default mixed: requests without a search mode are served by different engines',
        queries: ['red dress', 'blue jeans'],
        reply: (requested, query) => {
          if (requested === 'default') return query === 'red dress' ? 'semantic' : 'lexical';
          return healthy(requested);
        },
        expected: {agenticCommerceSearch: 'serving', semanticRequests: 'served', siteDefault: 'mixed'},
      },
      {
        name: 'site default: failed requests without a search mode are ignored when others succeed',
        queries: ['red dress', 'blue jeans'],
        reply: (requested, query) =>
          requested === 'default' && query === 'red dress' ? UNAVAILABLE : healthy(requested),
        expected: {agenticCommerceSearch: 'serving', semanticRequests: 'served', siteDefault: 'semantic'},
      },
      {
        name: 'site default: requests that report no engine are ignored when another reports one',
        queries: ['red dress', 'blue jeans'],
        reply: (requested, query) =>
          requested === 'default' && query === 'red dress' ? 'unreported' : healthy(requested),
        expected: {agenticCommerceSearch: 'serving', semanticRequests: 'served', siteDefault: 'semantic'},
      },
      {
        name: 'site default failed: no request without a search mode succeeds',
        queries: ['red dress'],
        reply: (requested) => (requested === 'default' ? UNAVAILABLE : healthy(requested)),
        expected: {agenticCommerceSearch: 'serving', semanticRequests: 'served', siteDefault: 'failed'},
      },
      {
        name: 'site default unreported: requests without a search mode report no engine',
        queries: ['red dress'],
        reply: (requested) => (requested === 'default' ? 'unreported' : healthy(requested)),
        expected: {agenticCommerceSearch: 'serving', semanticRequests: 'served', siteDefault: 'unreported'},
      },
    ];

    for (const {name, queries, reply, expected} of cases) {
      it(name, async () => {
        serve(reply);

        const status = await check(queries);

        expect(summaryOf(status)).to.deep.equal(expected);
      });
    }
  });

  describe('warnings', () => {
    it('has none for a site that serves semantic search', async () => {
      serve(healthy);

      const status = await check(['red dress']);

      expect(status.warnings).to.deep.equal([]);
    });

    it('says to add a multi-word query when every query is a single word and semantic search is not served', async () => {
      serve(() => 'lexical');

      const status = await check(['shirt', 'boots']);

      expect(status.agenticCommerceSearch).to.equal('unknown');
      expect(status.warnings).to.have.length(1);
      expect(status.warnings[0]).to.include('Every query is a single word');
      expect(status.warnings[0]).to.include('fall back to lexical search even when Agentic Commerce Search is on');
      expect(status.warnings[0]).to.include('add a multi-word query');
    });

    it('does not mention single-word queries when semantic search is served', async () => {
      serve(healthy);

      const status = await check(['shirt']);

      expect(status.semanticRequests).to.equal('served');
      expect(status.warnings).to.deep.equal([]);
    });

    it('does not mention single-word queries when one query has several words', async () => {
      serve(() => 'lexical');

      const status = await check(['shirt', 'red dress']);

      expect(status.warnings.join(' ')).to.not.include('single word');
    });

    it('explains a fallback of multi-word queries and names them', async () => {
      serve(() => 'lexical');

      const status = await check(['shirt', 'red dress', 'blue jeans']);

      expect(status.agenticCommerceSearch).to.equal('not-serving');
      expect(status.warnings).to.have.length(1);
      expect(status.warnings[0]).to.include('"red dress", "blue jeans"');
      expect(status.warnings[0]).to.not.include('"shirt"');
      expect(status.warnings[0]).to.include(
        'Agentic Commerce Search is off for the site, or its semantic index is not ready yet',
      );
      expect(status.warnings[0]).to.include('about two to three days');
    });

    it('includes the API message when the semantic search mode is rejected, and says where to turn it on', async () => {
      serve((requested) => (requested === 'semantic' ? BAD_MODE : 'lexical'));

      const status = await check(['red dress']);

      expect(status.warnings).to.have.length(1);
      expect(status.warnings[0]).to.include('searchMode=semantic');
      expect(status.warnings[0]).to.include('HTTP 400: Invalid searchMode');
      expect(status.warnings[0]).to.include(SEARCH_PREFERENCES);
      expect(status.warnings[0]).to.include('about two to three days');
    });

    it('points at the site, locale and currency when every request is rejected', async () => {
      serve(() => ({status: 400, detail: 'Invalid locale'}));

      const status = await check(['red dress']);

      expect(status.warnings).to.have.length(1);
      expect(status.warnings[0]).to.include('HTTP 400: Invalid locale');
      expect(status.warnings[0]).to.include('site ID, locale or currency');
      expect(status.warnings[0]).to.not.include(SEARCH_PREFERENCES);
    });

    it('says the engine cannot be determined when the API reports none, once', async () => {
      serve(() => 'unreported');

      const status = await check(['red dress']);

      expect(status.warnings).to.have.length(1);
      expect(status.warnings[0]).to.include('did not report effectiveSearchMode');
      expect(status.warnings[0]).to.include('Business Manager');
    });

    it('says the engine cannot be determined when only requests without a search mode report none', async () => {
      serve((requested) => (requested === 'default' ? 'unreported' : healthy(requested)));

      const status = await check(['red dress']);

      expect(status.agenticCommerceSearch).to.equal('serving');
      expect(status.warnings).to.have.length(1);
      expect(status.warnings[0]).to.include('did not report effectiveSearchMode');
    });

    it('says shoppers probably still get lexical search when only requested semantic searches are served by it', async () => {
      serve((requested) => (requested === 'semantic' ? 'semantic' : 'lexical'));

      const status = await check(['red dress']);

      expect(summaryOf(status)).to.deep.equal({
        agenticCommerceSearch: 'serving',
        semanticRequests: 'served',
        siteDefault: 'lexical',
      });
      expect(status.warnings).to.have.length(1);
      expect(status.warnings[0]).to.include('shoppers probably still get lexical search');
      expect(status.warnings[0]).to.include('Business Manager');
    });

    it('names multi-word queries that fell back while others were served by semantic search', async () => {
      serve((requested, query) => (requested === 'lexical' || query === 'blue jacket' ? 'lexical' : 'semantic'));

      const status = await check(['red dress', 'blue jacket']);

      expect(summaryOf(status)).to.deep.equal({
        agenticCommerceSearch: 'serving',
        semanticRequests: 'served',
        siteDefault: 'mixed',
      });
      expect(status.warnings).to.have.length(1);
      expect(status.warnings[0]).to.include('fell back to lexical search ("blue jacket")');
    });

    it('reports a failed semantic request with its status and message', async () => {
      serve((requested) => (requested === 'semantic' ? UNAVAILABLE : 'lexical'));

      const status = await check(['red dress']);

      expect(status.warnings).to.have.length(1);
      expect(status.warnings[0]).to.include('None of the searchMode=semantic requests succeeded');
      expect(status.warnings[0]).to.include('HTTP 500: Search is unavailable');
    });
  });
});
