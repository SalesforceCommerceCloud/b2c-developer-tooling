/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {expect} from 'chai';
import sinon from 'sinon';
import {ux} from '@oclif/core';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import SearchCapture from '../../../src/commands/search/capture.js';
import {createIsolatedConfigHooks, createTestCommand, expectError, stubJsonEnabled} from '../../helpers/test-setup.js';

const SHORT_CODE = 'kv7kzm78';
const ORG_ID = 'f_ecom_abcd_123';
const ORIGIN = `https://${SHORT_CODE}.api.commercecloud.salesforce.com`;
const TOKEN_URL = `${ORIGIN}/shopper/auth/v1/organizations/${ORG_ID}/oauth2/token`;
const SEARCH_URL = `${ORIGIN}/search/shopper-search/v1/organizations/${ORG_ID}/product-search`;

const BASE_FLAGS = {
  'tenant-id': 'abcd_123',
  'short-code': SHORT_CODE,
  'site-id': 'RefArch',
  'slas-client-id': 'my-client',
  'slas-client-secret': 'my-secret',
  limit: 25,
};

function searchResult(query: string) {
  return {
    query,
    total: 2,
    limit: 25,
    offset: 0,
    hits: [{productId: `${query}-1`}, {productId: `${query}-2`}],
    refinements: [],
    searchMode: 'semantic',
    effectiveSearchMode: 'semantic',
  };
}

describe('search capture', () => {
  const hooks = createIsolatedConfigHooks();
  const server = setupServer();
  let tmp: string;

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  beforeEach(async () => {
    await hooks.beforeEach();
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-search-capture-'));
    server.use(
      http.post(TOKEN_URL, () =>
        HttpResponse.json({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 1800,
          token_type: 'Bearer',
          usid: 'mock-usid',
          customer_id: 'mock-customer-id',
        }),
      ),
    );
  });

  afterEach(() => {
    server.resetHandlers();
    hooks.afterEach();
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  after(() => {
    server.close();
  });

  it('captures each query with a guest token and writes the capture file', async () => {
    const requests: Array<{authorization: null | string; url: URL}> = [];
    server.use(
      http.get(SEARCH_URL, ({request}) => {
        const url = new URL(request.url);
        requests.push({authorization: request.headers.get('Authorization'), url});
        return HttpResponse.json(searchResult(url.searchParams.get('q')!));
      }),
    );
    const output = path.join(tmp, 'semantic.json');

    const command: any = await createTestCommand(SearchCapture, hooks.getConfig(), {
      ...BASE_FLAGS,
      query: ['shirt', 'dress', 'shirt'],
      'search-mode': 'semantic',
      output,
    });
    stubJsonEnabled(command, true);

    const capture = await command.run();

    expect(capture.label).to.equal('semantic');
    expect(capture.request).to.include({organizationId: ORG_ID, siteId: 'RefArch', searchMode: 'semantic', limit: 25});
    expect(capture.results.map((entry: {query: string}) => entry.query)).to.deep.equal(['shirt', 'dress']);
    expect(capture.results[0].effectiveSearchMode).to.equal('semantic');
    expect(requests.map((request) => request.authorization)).to.deep.equal([
      'Bearer mock-access-token',
      'Bearer mock-access-token',
    ]);
    expect(requests[0].url.searchParams.get('searchMode')).to.equal('semantic');
    expect(JSON.parse(fs.readFileSync(output, 'utf8'))).to.deep.equal(capture);
  });

  it('reads queries from a file', async () => {
    const seen: string[] = [];
    server.use(
      http.get(SEARCH_URL, ({request}) => {
        const q = new URL(request.url).searchParams.get('q')!;
        seen.push(q);
        return HttpResponse.json(searchResult(q));
      }),
    );
    const file = path.join(tmp, 'queries.txt');
    fs.writeFileSync(file, '# apparel\nshirt\n\nleather boots\n');

    const command: any = await createTestCommand(SearchCapture, hooks.getConfig(), {
      ...BASE_FLAGS,
      query: ['hat'],
      'queries-file': file,
    });
    stubJsonEnabled(command, true);

    const capture = await command.run();

    expect(seen).to.deep.equal(['hat', 'shirt', 'leather boots']);
    expect(capture.label).to.equal('capture');
  });

  it('prints a table of results', async () => {
    server.use(
      http.get(SEARCH_URL, ({request}) => HttpResponse.json(searchResult(new URL(request.url).searchParams.get('q')!))),
    );
    const stdout = sinon.stub(ux, 'stdout');

    const command: any = await createTestCommand(SearchCapture, hooks.getConfig(), {...BASE_FLAGS, query: ['shirt']});
    command.log = () => {};
    stubJsonEnabled(command, false);

    await command.run();

    const printed = stdout.args.map((args) => String(args[0])).join('\n');
    expect(printed).to.include('Served by');
    expect(printed).to.include('shirt-1');
  });

  it('sends the sort and refinements with every query and shows the price order', async () => {
    const requests: URL[] = [];
    server.use(
      http.get(SEARCH_URL, ({request}) => {
        const url = new URL(request.url);
        requests.push(url);
        const query = url.searchParams.get('q')!;
        return HttpResponse.json({
          ...searchResult(query),
          hits: [
            {productId: `${query}-1`, price: 5},
            {productId: `${query}-2`, price: query === 'shirt' ? 9.5 : 1},
          ],
          selectedSortingOption: 'price-low-to-high',
        });
      }),
    );
    const stdout = sinon.stub(ux, 'stdout');

    const command: any = await createTestCommand(SearchCapture, hooks.getConfig(), {
      ...BASE_FLAGS,
      query: ['shirt', 'dress'],
      sort: 'price-low-to-high',
      refine: ['c_color=red|blue', 'price=(0..50)'],
    });
    const logged: string[] = [];
    command.log = (message: string) => logged.push(message);
    stubJsonEnabled(command, false);

    const capture = await command.run();

    expect(requests.map((url) => url.searchParams.get('sort'))).to.deep.equal([
      'price-low-to-high',
      'price-low-to-high',
    ]);
    expect(requests[0].searchParams.getAll('refine')).to.deep.equal(['c_color=red|blue', 'price=(0..50)']);
    expect(capture.request).to.deep.include({sort: 'price-low-to-high', refine: ['c_color=red|blue', 'price=(0..50)']});
    expect(logged).to.include(
      'Running 2 search request(s) on site RefArch (search mode: site default; sort: price-low-to-high; refinements: c_color=red|blue, price=(0..50))...',
    );
    const printed = stdout.args.map((args) => String(args[0])).join('\n');
    expect(printed).to.include('Price order');
    expect(printed).to.include('ascending');
    expect(printed).to.include('descending');
  });

  it('rejects an invalid refinement before fetching a token', async () => {
    let tokenRequests = 0;
    server.use(
      http.post(TOKEN_URL, () => {
        tokenRequests++;
        return HttpResponse.json({}, {status: 500});
      }),
    );

    const command: any = await createTestCommand(SearchCapture, hooks.getConfig(), {
      ...BASE_FLAGS,
      query: ['shirt'],
      refine: ['brand'],
    });

    await expectError(() => command.run(), 'Invalid refinement "brand": use attribute=value');
    expect(tokenRequests).to.equal(0);
  });

  it('requires at least one query', async () => {
    const command: any = await createTestCommand(SearchCapture, hooks.getConfig(), BASE_FLAGS);

    await expectError(() => command.run(), 'at least one query');
  });

  it('requires a SLAS client ID', async () => {
    const command: any = await createTestCommand(SearchCapture, hooks.getConfig(), {
      ...BASE_FLAGS,
      'slas-client-id': undefined,
      query: ['shirt'],
    });

    await expectError(() => command.run(), 'SLAS client ID is required');
  });

  it('fails when every request fails and still writes the capture', async () => {
    server.use(
      http.get(SEARCH_URL, () =>
        HttpResponse.json({title: 'Bad Request', type: 'about:blank', detail: 'Unknown search mode'}, {status: 400}),
      ),
    );
    const output = path.join(tmp, 'failed.json');

    const command: any = await createTestCommand(SearchCapture, hooks.getConfig(), {
      ...BASE_FLAGS,
      query: ['shirt', 'dress'],
      output,
    });
    stubJsonEnabled(command, true);

    await expectError(
      () => command.run(),
      'All 2 search request(s) failed. First error (HTTP 400): Unknown search mode',
    );
    const written = JSON.parse(fs.readFileSync(output, 'utf8'));
    expect(written.results).to.have.length(2);
  });
});
