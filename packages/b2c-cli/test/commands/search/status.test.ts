/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {ux} from '@oclif/core';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {SEARCH_CAPTURE_SCHEMA_VERSION, type SearchModeStatus} from '@salesforce/b2c-tooling-sdk/operations/search';
import SearchStatus from '../../../src/commands/search/status.js';
import {createIsolatedConfigHooks, createTestCommand, expectError, stubJsonEnabled} from '../../helpers/test-setup.js';

const SHORT_CODE = 'kv7kzm78';
const ORG_ID = 'f_ecom_abcd_123';
const ORIGIN = `https://${SHORT_CODE}.api.commercecloud.salesforce.com`;
const TOKEN_URL = `${ORIGIN}/shopper/auth/v1/organizations/${ORG_ID}/oauth2/token`;
const SEARCH_URL = `${ORIGIN}/search/shopper-search/v1/organizations/${ORG_ID}/product-search`;
const SEARCH_PREFERENCES =
  'Merchant Tools > Agentic Commerce Search > Search Preferences > Enable Agentic Commerce Search';

const BASE_FLAGS = {
  'tenant-id': 'abcd_123',
  'short-code': SHORT_CODE,
  'site-id': 'RefArch',
  'slas-client-id': 'my-client',
  'slas-client-secret': 'my-secret',
};

/** What the search API answers: the engine that served the request, an error or a network failure. */
type Reply = 'lexical' | 'network' | 'semantic' | {detail: string; status: number};

interface SearchRequest {
  authorization: null | string;
  url: URL;
}

const BAD_MODE: Reply = {status: 400, detail: 'Invalid searchMode'};
const UNKNOWN_SITE: Reply = {status: 400, detail: 'Unknown site'};

/** A site with Agentic Commerce Search on: requests without a mode get semantic search. */
function healthy(requested: null | string): Reply {
  return requested === 'lexical' ? 'lexical' : 'semantic';
}

function searchResult(query: string, engine: string) {
  return {
    query,
    total: 12,
    limit: 1,
    offset: 0,
    hits: [{productId: `${query}-1`}],
    refinements: [],
    effectiveSearchMode: engine,
  };
}

describe('search status', () => {
  const hooks = createIsolatedConfigHooks();
  const server = setupServer();
  let stdout: sinon.SinonStub;
  let tokenRequests: number;

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  beforeEach(async () => {
    await hooks.beforeEach();
    stdout = sinon.stub(ux, 'stdout');
    tokenRequests = 0;
    server.use(
      http.post(TOKEN_URL, () => {
        tokenRequests++;
        return HttpResponse.json({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 1800,
          token_type: 'Bearer',
          usid: 'mock-usid',
          customer_id: 'mock-customer-id',
        });
      }),
    );
  });

  afterEach(() => {
    server.resetHandlers();
    hooks.afterEach();
  });

  after(() => {
    server.close();
  });

  /** Answers every productSearch request from `reply` and returns the requests received, in order. */
  function serve(reply: (requested: null | string, query: string) => Reply): SearchRequest[] {
    const requests: SearchRequest[] = [];
    server.use(
      http.get(SEARCH_URL, ({request}) => {
        const url = new URL(request.url);
        requests.push({authorization: request.headers.get('Authorization'), url});
        const query = url.searchParams.get('q')!;
        const result = reply(url.searchParams.get('searchMode'), query);
        if (result === 'network') return HttpResponse.error();
        if (typeof result === 'object') {
          return HttpResponse.json(
            {title: 'Error', type: 'about:blank', detail: result.detail},
            {status: result.status},
          );
        }
        return HttpResponse.json(searchResult(query, result));
      }),
    );
    return requests;
  }

  /** Creates the command, collecting what it logs and warns so nothing reaches the console. */
  async function createCommand(flags: Record<string, unknown>, json: boolean) {
    const command: any = await createTestCommand(SearchStatus, hooks.getConfig(), {...BASE_FLAGS, ...flags});
    const logged: string[] = [];
    const warned: string[] = [];
    command.log = (message: string) => logged.push(message);
    command.warn = (message: string) => warned.push(message);
    stubJsonEnabled(command, json);
    return {command, logged, warned};
  }

  function printed(): string {
    return stdout.args.map((args) => String(args[0])).join('\n');
  }

  describe('requests', () => {
    it('sends each query without a mode, as lexical and as semantic, with a guest token', async () => {
      const requests = serve(healthy);
      const {command, logged} = await createCommand({query: ['red dress', 'leather boots', 'red dress']}, true);

      const status: SearchModeStatus = await command.run();

      expect(
        requests.map((request) => [request.url.searchParams.get('q'), request.url.searchParams.get('searchMode')]),
      ).to.deep.equal([
        ['red dress', null],
        ['red dress', 'lexical'],
        ['red dress', 'semantic'],
        ['leather boots', null],
        ['leather boots', 'lexical'],
        ['leather boots', 'semantic'],
      ]);
      expect(requests.map((request) => request.authorization)).to.deep.equal(
        Array.from({length: 6}).fill('Bearer mock-access-token'),
      );
      expect(requests.map((request) => request.url.searchParams.get('limit'))).to.deep.equal(
        Array.from({length: 6}).fill('1'),
      );
      expect(requests.map((request) => request.url.searchParams.get('siteId'))).to.deep.equal(
        Array.from({length: 6}).fill('RefArch'),
      );
      expect(status.probes).to.have.length(6);
      expect(tokenRequests).to.equal(1);
      expect(logged).to.deep.equal([]);
    });

    it('sends the locale and currency with every request', async () => {
      const requests = serve(healthy);
      const {command} = await createCommand({query: ['red dress'], locale: 'en-US', currency: 'USD'}, true);

      await command.run();

      expect(requests).to.have.length(3);
      expect(requests.map((request) => request.url.searchParams.get('locale'))).to.deep.equal(
        Array.from({length: 3}).fill('en-US'),
      );
      expect(requests.map((request) => request.url.searchParams.get('currency'))).to.deep.equal(
        Array.from({length: 3}).fill('USD'),
      );
    });

    it('accepts five distinct queries, counting a repeated query once', async () => {
      const requests = serve(healthy);
      const {command} = await createCommand(
        {query: ['red dress', 'blue jeans', 'leather boots', 'wool coat', 'rain jacket', ' red dress ']},
        true,
      );

      const status: SearchModeStatus = await command.run();

      expect(requests).to.have.length(15);
      expect(status.probes).to.have.length(15);
    });
  });

  describe('--json', () => {
    it('returns the status with the site, the verdicts and the probes', async () => {
      serve(healthy);
      const {command, warned} = await createCommand({query: ['red dress']}, true);

      const status: SearchModeStatus = await command.run();

      expect(status).to.include({
        schemaVersion: SEARCH_CAPTURE_SCHEMA_VERSION,
        siteId: 'RefArch',
        organizationId: ORG_ID,
        shortCode: SHORT_CODE,
        agenticCommerceSearch: 'serving',
        siteDefault: 'semantic',
        semanticRequests: 'served',
      });
      expect(status.checkedAt).to.be.a('string');
      expect(status.warnings).to.deep.equal([]);
      expect(
        status.probes.map((probe) => [probe.requested, probe.status, probe.effectiveSearchMode, probe.total]),
      ).to.deep.equal([
        ['default', 200, 'semantic', 12],
        ['lexical', 200, 'lexical', 12],
        ['semantic', 200, 'semantic', 12],
      ]);
      expect(warned).to.deep.equal([]);
      expect(printed()).to.equal('');
    });
  });

  describe('output', () => {
    it('prints the probes, the verdict and the site default engine', async () => {
      serve(healthy);
      const {command, logged, warned} = await createCommand({query: ['red dress', 'leather boots']}, false);

      await command.run();

      expect(logged).to.deep.equal([
        'Fetching guest shopper token...',
        'Checking search modes on site RefArch (6 search request(s))...',
      ]);
      const output = printed();
      for (const header of ['Query', 'Requested', 'Status', 'Served by', 'Total', 'ms']) {
        expect(output).to.include(header);
      }
      expect(output).to.include('red dress');
      expect(output).to.include('leather boots');
      expect(output).to.not.include('Error');
      expect(output).to.include('Agentic Commerce Search: serving');
      expect(output).to.include('Site default engine: semantic');
      expect(warned).to.deep.equal([]);
    });

    it('shows the failed request and says that Agentic Commerce Search is not serving when the API rejects semantic', async () => {
      serve((requested) => (requested === 'semantic' ? BAD_MODE : healthy(requested)));
      const {command, warned} = await createCommand({query: ['red dress']}, false);

      const status: SearchModeStatus = await command.run();

      expect(status.agenticCommerceSearch).to.equal('not-serving');
      const output = printed();
      expect(output).to.include('Error');
      expect(output).to.include('Invalid searchMode');
      expect(output).to.include('Agentic Commerce Search: not serving');
      expect(output).to.include('Site default engine: semantic');
      expect(warned).to.have.length(2);
      expect(warned[0]).to.equal('1 of 3 search request(s) failed.');
      expect(warned[1]).to.include('HTTP 400: Invalid searchMode');
      expect(warned[1]).to.include(SEARCH_PREFERENCES);
    });

    it('says not serving and warns about the queries that fell back to lexical search', async () => {
      serve(() => 'lexical');
      const {command, warned} = await createCommand({query: ['red dress', 'leather boots']}, false);

      await command.run();

      const output = printed();
      expect(output).to.include('Agentic Commerce Search: not serving');
      expect(output).to.include('Site default engine: lexical');
      expect(warned).to.have.length(1);
      expect(warned[0]).to.include('"red dress", "leather boots"');
      expect(warned[0]).to.include('two to three days');
    });

    it('says unknown and asks for a multi-word query when only single-word queries fell back', async () => {
      serve(() => 'lexical');
      const {command, warned} = await createCommand({query: ['dress']}, false);

      const status: SearchModeStatus = await command.run();

      expect(status.agenticCommerceSearch).to.equal('unknown');
      const output = printed();
      expect(output).to.include('Agentic Commerce Search: unknown');
      expect(output).to.include('Site default engine: lexical');
      expect(warned).to.have.length(1);
      expect(warned[0]).to.include('Every query is a single word');
    });

    it('prints each warning of the check after the summary', async () => {
      const {command, warned} = await createCommand({query: ['red dress']}, false);
      command.operations = {
        ...command.operations,
        getGuestToken: sinon.stub().resolves({access_token: 'token'}),
        checkSearchModes: sinon.stub().resolves({
          schemaVersion: SEARCH_CAPTURE_SCHEMA_VERSION,
          siteId: 'RefArch',
          organizationId: ORG_ID,
          checkedAt: '2026-01-01T00:00:00.000Z',
          agenticCommerceSearch: 'unknown',
          siteDefault: 'unreported',
          semanticRequests: 'unreported',
          probes: [{query: 'red dress', requested: 'default', status: 200, latencyMs: 5, total: 3}],
          warnings: ['First warning.', 'Second warning.'],
        } satisfies SearchModeStatus),
      };

      await command.run();

      const output = printed();
      expect(output).to.include('Agentic Commerce Search: unknown');
      expect(output).to.include('Site default engine: unreported');
      expect(warned).to.deep.equal(['First warning.', 'Second warning.']);
    });
  });

  describe('operations', () => {
    it('gets the guest token and runs the check with the settings it is given', async () => {
      const result: SearchModeStatus = {
        schemaVersion: SEARCH_CAPTURE_SCHEMA_VERSION,
        siteId: 'RefArch',
        organizationId: ORG_ID,
        shortCode: SHORT_CODE,
        checkedAt: '2026-01-01T00:00:00.000Z',
        agenticCommerceSearch: 'serving',
        siteDefault: 'semantic',
        semanticRequests: 'served',
        probes: [{query: 'red dress', requested: 'default', status: 200, latencyMs: 5}],
        warnings: [],
      };
      const getGuestToken = sinon.stub().resolves({access_token: 'injected-token'});
      const checkSearchModes = sinon.stub().resolves(result);
      const {command} = await createCommand(
        {
          query: ['red dress', 'red dress'],
          locale: 'en-US',
          currency: 'USD',
          'redirect-uri': 'https://example.com/callback',
        },
        true,
      );
      command.operations = {getGuestToken, checkSearchModes};

      const status = await command.run();

      expect(status).to.equal(result);
      expect(getGuestToken.calledOnce).to.equal(true);
      expect(getGuestToken.firstCall.args[0]).to.deep.include({
        shortCode: SHORT_CODE,
        organizationId: ORG_ID,
        slasClientId: 'my-client',
        slasClientSecret: 'my-secret',
        siteId: 'RefArch',
        redirectUri: 'https://example.com/callback',
      });
      expect(checkSearchModes.calledOnce).to.equal(true);
      expect(checkSearchModes.firstCall.args[1]).to.deep.equal({
        organizationId: ORG_ID,
        siteId: 'RefArch',
        shortCode: SHORT_CODE,
        queries: ['red dress'],
        locale: 'en-US',
        currency: 'USD',
      });
      expect(tokenRequests).to.equal(0);
    });

    it('uses the default redirect URI when none is given', async () => {
      const getGuestToken = sinon.stub().resolves({access_token: 'injected-token'});
      const checkSearchModes = sinon.stub().resolves({probes: [{status: 200}], warnings: []});
      const {command} = await createCommand({query: ['red dress']}, true);
      command.operations = {getGuestToken, checkSearchModes};

      await command.run();

      expect(getGuestToken.firstCall.args[0].redirectUri).to.equal('http://localhost:3000/callback');
    });
  });

  describe('validation', () => {
    it('requires at least one query before fetching a token', async () => {
      const {command} = await createCommand({}, false);

      await expectError(() => command.run(), 'Provide one to 5 queries with --query');
      expect(tokenRequests).to.equal(0);
    });

    it('ignores blank queries', async () => {
      const {command} = await createCommand({query: ['', '   ']}, false);

      await expectError(() => command.run(), 'Provide one to 5 queries with --query');
      expect(tokenRequests).to.equal(0);
    });

    it('rejects more than five queries before fetching a token', async () => {
      const {command} = await createCommand(
        {query: ['red dress', 'blue jeans', 'leather boots', 'wool coat', 'rain jacket', 'rain boots']},
        false,
      );

      await expectError(() => command.run(), 'At most 5 queries are allowed (got 6).');
      expect(tokenRequests).to.equal(0);
    });

    it('requires a SLAS client ID', async () => {
      const {command} = await createCommand({'slas-client-id': undefined, query: ['red dress']}, false);

      await expectError(() => command.run(), 'SLAS client ID is required');
      expect(tokenRequests).to.equal(0);
    });

    it('requires a site ID', async () => {
      const {command} = await createCommand({'site-id': undefined, query: ['red dress']}, false);

      await expectError(() => command.run(), 'site-id is required');
      expect(tokenRequests).to.equal(0);
    });

    it('requires a short code', async () => {
      const {command} = await createCommand({'short-code': undefined, query: ['red dress']}, false);

      await expectError(() => command.run(), 'SCAPI short code required');
      expect(tokenRequests).to.equal(0);
    });

    it('requires a tenant ID', async () => {
      const {command} = await createCommand({'tenant-id': undefined, query: ['red dress']}, false);

      await expectError(() => command.run(), 'tenant-id is required');
      expect(tokenRequests).to.equal(0);
    });
  });

  describe('failures', () => {
    it('fails when every request fails, with the first error', async () => {
      serve(() => UNKNOWN_SITE);
      const {command} = await createCommand({query: ['red dress']}, true);

      await expectError(() => command.run(), 'All 3 search request(s) failed. First error (HTTP 400): Unknown site');
    });

    it('fails when no request gets a response', async () => {
      serve(() => 'network');
      const {command} = await createCommand({query: ['red dress']}, false);

      await expectError(() => command.run(), /All 3 search request\(s\) failed\. First error \(no response\): /);
      expect(printed()).to.equal('');
    });

    it('does not fail when only some requests fail', async () => {
      serve((requested) => (requested === 'lexical' ? UNKNOWN_SITE : healthy(requested)));
      const {command, warned} = await createCommand({query: ['red dress']}, false);

      const status: SearchModeStatus = await command.run();

      expect(status.probes.filter((probe) => probe.error !== undefined)).to.have.length(1);
      expect(warned).to.include('1 of 3 search request(s) failed.');
      expect(printed()).to.include('Unknown site');
    });
  });
});
