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
import SearchCaptureStorefront from '../../../src/commands/search/capture-storefront.js';
import {createIsolatedConfigHooks, createTestCommand, expectError, stubJsonEnabled} from '../../helpers/test-setup.js';

const ORIGIN = 'https://www.example.com';
const SEARCH_PATH = '/on/demandware.store/Sites-RefArch-Site/default/Search-Show';
const AJAX_PATH = '/on/demandware.store/Sites-RefArch-Site/default/Search-ShowAjax';
const PAGE_URL = `${ORIGIN}${SEARCH_PATH}`;

const BASE_FLAGS = {
  server: 'www.example.com',
  'site-id': 'RefArch',
  limit: 25,
  delay: 0,
  'bypass-page-cache': false,
};

/** An SFRA search page with one tile per product ID, or the no-results page when there are none. */
function searchPage(query: string, ids: string[]): string {
  const tiles = ids
    .map(
      (id) =>
        `<div class="col-6"><div class="product" data-pid="${id}"><div class="pdp-link"><a class="link" href="/${id}.html">Product ${id}</a></div></div></div>`,
    )
    .join('');
  const count =
    ids.length > 0
      ? `<span class="search-result-count">${ids.length} Results for</span> <span class="search-keywords">"${query}"</span>`
      : `<p>No products were found for: <span class="search-keywords">"${query}"</span></p>`;
  const panels =
    ids.length > 0
      ? `<div class="card refinement"><div class="card-header"><h2>Color</h2></div><div class="card-body"><ul><li><button data-href="${AJAX_PATH}?prefn1=refinementColor&amp;prefv1=Blue&amp;q=${encodeURIComponent(query)}"><span aria-hidden="true">Blue</span></button></li></ul></div></div>`
      : '';
  return `<!DOCTYPE html><html><body><div class="result-count">${count}</div><div class="refinements">${panels}</div><div class="row product-grid">${tiles}</div></body></html>`;
}

function html(body: string, init?: {status?: number; statusText?: string}) {
  return new HttpResponse(body, {...init, headers: {'Content-Type': 'text/html; charset=utf-8'}});
}

describe('search capture-storefront', () => {
  const hooks = createIsolatedConfigHooks();
  const server = setupServer();
  let tmp: string;

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  beforeEach(async () => {
    await hooks.beforeEach();
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-search-capture-storefront-'));
  });

  afterEach(() => {
    server.resetHandlers();
    hooks.afterEach();
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  after(() => {
    server.close();
  });

  it('captures the search page of each query and writes the capture file', async () => {
    const requests: Array<{authorization: null | string; url: URL}> = [];
    server.use(
      http.get(PAGE_URL, ({request}) => {
        const url = new URL(request.url);
        requests.push({authorization: request.headers.get('Authorization'), url});
        const query = url.searchParams.get('q')!;
        return html(searchPage(query, query === 'shirt' ? ['p1', 'p2'] : []));
      }),
    );
    const output = path.join(tmp, 'storefront.json');

    const command: any = await createTestCommand(SearchCaptureStorefront, hooks.getConfig(), {
      ...BASE_FLAGS,
      query: ['shirt', 'zzzqqq', 'shirt'],
      output,
    });
    stubJsonEnabled(command, true);

    const capture = await command.run();

    expect(capture.label).to.equal('storefront');
    expect(capture.request).to.deep.equal({
      source: 'storefront',
      host: 'www.example.com',
      siteId: 'RefArch',
      locale: 'default',
      path: SEARCH_PATH,
      limit: 25,
    });
    expect(capture.results.map((entry: {query: string}) => entry.query)).to.deep.equal(['shirt', 'zzzqqq']);
    expect(capture.results[0]).to.include({status: 200, total: 2});
    expect(capture.results[0].hits).to.deep.equal([
      {productId: 'p1', productName: 'Product p1'},
      {productId: 'p2', productName: 'Product p2'},
    ]);
    expect(capture.results[0].refinements).to.deep.equal([
      {attributeId: 'refinementColor', label: 'Color', values: [{value: 'Blue', label: 'Blue'}]},
    ]);
    expect(capture.results[1]).to.include({status: 200, total: 0});
    expect(requests.map((request) => request.url.searchParams.get('sz'))).to.deep.equal(['25', '25']);
    expect(requests.map((request) => request.authorization)).to.deep.equal([null, null]);
    expect(JSON.parse(fs.readFileSync(output, 'utf8'))).to.deep.equal(capture);
  });

  it('sends the storefront password and saves the pages', async () => {
    const authorizations: Array<null | string> = [];
    server.use(
      http.get(PAGE_URL, ({request}) => {
        authorizations.push(request.headers.get('Authorization'));
        return html(searchPage(new URL(request.url).searchParams.get('q')!, ['p1']));
      }),
    );
    const pages = path.join(tmp, 'pages');

    const command: any = await createTestCommand(SearchCaptureStorefront, hooks.getConfig(), {
      ...BASE_FLAGS,
      query: ['shirt', 'Red Dress!'],
      'storefront-password': 'open-sesame',
      'save-html': pages,
      label: 'before',
    });
    stubJsonEnabled(command, true);

    const capture = await command.run();

    const expected = `Basic ${Buffer.from('storefront:open-sesame').toString('base64')}`;
    expect(authorizations).to.deep.equal([expected, expected]);
    expect(capture.label).to.equal('before');
    expect(fs.readdirSync(pages).sort()).to.deep.equal(['01-shirt.html', '02-red-dress.html']);
    expect(fs.readFileSync(path.join(pages, '01-shirt.html'), 'utf8')).to.equal(searchPage('shirt', ['p1']));
    expect(JSON.stringify(capture)).to.not.include('open-sesame');
  });

  it('prints a table of results and the page warnings', async () => {
    server.use(
      http.get(PAGE_URL, () =>
        html(
          '<div class="result-count"><span class="search-result-count">1 Results for</span></div><div class="product-grid"><div class="product" data-pid="p1"></div></div>',
        ),
      ),
    );
    const stdout = sinon.stub(ux, 'stdout');

    const command: any = await createTestCommand(SearchCaptureStorefront, hooks.getConfig(), {
      ...BASE_FLAGS,
      query: ['shirt'],
    });
    command.log = () => {};
    const warn = sinon.stub(command, 'warn');
    stubJsonEnabled(command, false);

    await command.run();

    const printed = stdout.args.map((args) => String(args[0])).join('\n');
    expect(printed).to.include('Top hit');
    expect(printed).to.include('p1');
    expect(printed).to.include('1 page warning(s)');
    expect(warn.args.map((args) => String(args[0]))).to.deep.equal(['1 page(s): No filter panels found (refinement)']);
  });

  it('rejects a --param without a name', async () => {
    const command: any = await createTestCommand(SearchCaptureStorefront, hooks.getConfig(), {
      ...BASE_FLAGS,
      query: ['shirt'],
      param: ['srule=top-sellers', '=x'],
    });

    await expectError(() => command.run(), 'Invalid --param "=x": use name=value.');
  });

  it('rejects parameters the capture sets before sending any request', async () => {
    const command: any = await createTestCommand(SearchCaptureStorefront, hooks.getConfig(), {
      ...BASE_FLAGS,
      query: ['shirt'],
      param: ['sz=10'],
    });

    await expectError(() => command.run(), 'The sz parameter is set by the capture');
  });

  it('requires a storefront host and a site ID', async () => {
    const withoutServer: any = await createTestCommand(SearchCaptureStorefront, hooks.getConfig(), {
      ...BASE_FLAGS,
      server: undefined,
      query: ['shirt'],
    });
    await expectError(() => withoutServer.run(), 'A storefront host is required');

    const withoutSite: any = await createTestCommand(SearchCaptureStorefront, hooks.getConfig(), {
      ...BASE_FLAGS,
      'site-id': undefined,
      query: ['shirt'],
    });
    await expectError(() => withoutSite.run(), 'site-id is required');
  });

  it('requires at least one query', async () => {
    const command: any = await createTestCommand(SearchCaptureStorefront, hooks.getConfig(), BASE_FLAGS);

    await expectError(() => command.run(), 'at least one query');
  });

  it('reads and checks the page profile', async () => {
    const valid = path.join(tmp, 'profile.json');
    fs.writeFileSync(valid, JSON.stringify({productTile: '.tile', productIdAttribute: 'data-sku'}));
    const invalid = path.join(tmp, 'invalid.json');
    fs.writeFileSync(invalid, JSON.stringify({tiles: '.tile'}));
    server.use(
      http.get(PAGE_URL, () =>
        html('<div class="search-result-count">1 Results</div><div class="tile" data-sku="A-1"></div>'),
      ),
    );

    const command: any = await createTestCommand(SearchCaptureStorefront, hooks.getConfig(), {
      ...BASE_FLAGS,
      query: ['shirt'],
      profile: valid,
    });
    stubJsonEnabled(command, true);
    const capture = await command.run();
    expect(capture.results[0].hits).to.deep.equal([{productId: 'A-1'}]);

    const unknownKey: any = await createTestCommand(SearchCaptureStorefront, hooks.getConfig(), {
      ...BASE_FLAGS,
      query: ['shirt'],
      profile: invalid,
    });
    await expectError(
      () => unknownKey.run(),
      /Invalid page profile .*invalid\.json: Unknown page profile key\(s\): tiles/,
    );

    const missing: any = await createTestCommand(SearchCaptureStorefront, hooks.getConfig(), {
      ...BASE_FLAGS,
      query: ['shirt'],
      profile: path.join(tmp, 'missing.json'),
    });
    await expectError(() => missing.run(), 'Could not read page profile');
  });

  it('fails when every request fails and still writes the capture', async () => {
    server.use(http.get(PAGE_URL, () => html('Unavailable', {status: 503, statusText: 'Service Unavailable'})));
    const output = path.join(tmp, 'failed.json');

    const command: any = await createTestCommand(SearchCaptureStorefront, hooks.getConfig(), {
      ...BASE_FLAGS,
      query: ['shirt', 'dress'],
      output,
    });
    stubJsonEnabled(command, true);

    await expectError(() => command.run(), 'All 2 page request(s) failed. First error: HTTP 503 Service Unavailable');
    const written = JSON.parse(fs.readFileSync(output, 'utf8'));
    expect(written.results.map((entry: {status: number}) => entry.status)).to.deep.equal([503, 503]);
  });
});
