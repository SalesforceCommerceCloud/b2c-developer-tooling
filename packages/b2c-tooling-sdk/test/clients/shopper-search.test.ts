/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createShopperSearchClient} from '@salesforce/b2c-tooling-sdk/clients';

const SHORT_CODE = 'kv7kzm78';
const ORG_ID = 'f_ecom_abcd_123';
const SEARCH_URL = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/search/shopper-search/v1/organizations/${ORG_ID}/product-search`;

describe('clients/shopper-search', () => {
  const server = setupServer();

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  afterEach(() => {
    server.resetHandlers();
  });

  after(() => {
    server.close();
  });

  it('sends the shopper token as a bearer token and the query parameters', async () => {
    let authorization: null | string = null;
    let url: URL | undefined;
    server.use(
      http.get(SEARCH_URL, ({request}) => {
        authorization = request.headers.get('Authorization');
        url = new URL(request.url);
        return HttpResponse.json({hits: [], query: 'shirt', refinements: [], total: 0, limit: 5, offset: 0});
      }),
    );

    const client = createShopperSearchClient({shortCode: SHORT_CODE, getAccessToken: () => 'shopper-token'});
    const {data, response} = await client.GET('/organizations/{organizationId}/product-search', {
      params: {path: {organizationId: ORG_ID}, query: {siteId: 'RefArch', q: 'shirt', limit: 5, searchMode: 'lexical'}},
    });

    expect(response.status).to.equal(200);
    expect(data?.total).to.equal(0);
    expect(authorization).to.equal('Bearer shopper-token');
    expect(url?.searchParams.get('siteId')).to.equal('RefArch');
    expect(url?.searchParams.get('q')).to.equal('shirt');
    expect(url?.searchParams.get('limit')).to.equal('5');
    expect(url?.searchParams.get('searchMode')).to.equal('lexical');
  });

  it('asks for the token on every request', async () => {
    const seen: string[] = [];
    server.use(
      http.get(SEARCH_URL, ({request}) => {
        seen.push(request.headers.get('Authorization') ?? '');
        return HttpResponse.json({hits: [], query: 'q', refinements: [], total: 0, limit: 25, offset: 0});
      }),
    );

    let calls = 0;
    const client = createShopperSearchClient({
      shortCode: SHORT_CODE,
      async getAccessToken() {
        calls++;
        return `token-${calls}`;
      },
    });
    const params = {params: {path: {organizationId: ORG_ID}, query: {siteId: 'RefArch', q: 'q'}}};
    await client.GET('/organizations/{organizationId}/product-search', params);
    await client.GET('/organizations/{organizationId}/product-search', params);

    expect(seen).to.deep.equal(['Bearer token-1', 'Bearer token-2']);
  });
});
