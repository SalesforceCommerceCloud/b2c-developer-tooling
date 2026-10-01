/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {rejects} from 'node:assert/strict';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {MiddlewareRegistry} from '@salesforce/b2c-tooling-sdk/clients';
import {
  ScapiShopperSessions,
  createScapiRequest,
  getScapiAuthInfo,
  loadScapiSchemas,
  type ScapiShopperAuth,
} from '@salesforce/b2c-tooling-sdk/scapi';

const server = setupServer();
const origin = 'https://test.api.commercecloud.salesforce.com';
const tokenUrl = `${origin}/shopper/auth/v1/organizations/f_ecom_test_001/oauth2/token`;
const products = '/product/shopper-products/v1/organizations/{organizationId}/products/p1';
const signal = () => new AbortController().signal;
const adminAuth: AuthStrategy = {fetch, getAuthorizationHeader: async () => 'Bearer admin-token'};

function jwt(claims: Record<string, unknown>): string {
  return ['{}', JSON.stringify(claims), ''].map((part) => Buffer.from(part).toString('base64url')).join('.');
}

function request(shopperAuth?: ScapiShopperAuth, siteId: string | undefined = 'RefArch') {
  return createScapiRequest({
    shortCode: 'test',
    tenantId: 'test_001',
    siteId,
    auth: adminAuth,
    shopperAuth,
    safety: {level: 'NONE'},
    documents: loadScapiSchemas(),
    middlewareRegistry: new MiddlewareRegistry(),
  });
}

function shopperConfig() {
  return {
    shortCode: 'test',
    tenantId: 'test_001',
    slasClientId: 'shopper-client',
    slasClientSecret: 'secret',
    middlewareRegistry: new MiddlewareRegistry(),
  };
}

describe('SCAPI shopper execution', () => {
  before(() => server.listen({onUnhandledRequest: 'error'}));
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  it('calls Shopper APIs with a guest session that persists across executions and refreshes', async () => {
    const grants: string[] = [];
    const authorizations: string[] = [];
    let issued = 0;
    server.use(
      http.post(tokenUrl, async ({request: tokenRequest}) => {
        const body = new URLSearchParams(await tokenRequest.text());
        grants.push(`${body.get('grant_type')}:${body.get('channel_id')}:${body.get('refresh_token') ?? ''}`);
        issued++;
        return HttpResponse.json({
          access_token: `shopper-${issued}`,
          refresh_token: `refresh-${issued}`,
          // The first token is already inside the expiry margin.
          expires_in: issued === 1 ? 30 : 1800,
          token_type: 'BEARER',
          usid: 'usid-1',
          customer_id: 'guest',
        });
      }),
      http.get(`${origin}/product/shopper-products/v1/organizations/f_ecom_test_001/products/p1`, ({request: api}) => {
        authorizations.push(`${api.headers.get('authorization')}:${new URL(api.url).searchParams.get('siteId')}`);
        return HttpResponse.json({id: 'p1'});
      }),
    );
    const sessions = new ScapiShopperSessions();
    expect(await request(sessions.for(shopperConfig()))({method: 'GET', path: products}, signal())).to.deep.include({
      ok: true,
    });
    // A later execution reuses the session; an expiring token is refreshed, not replaced.
    await request(sessions.for(shopperConfig()))({method: 'GET', path: products}, signal());
    await request(sessions.for(shopperConfig()))({method: 'GET', path: products}, signal());
    expect(grants).to.deep.equal(['client_credentials:RefArch:', 'refresh_token:RefArch:refresh-1']);
    expect(authorizations).to.deep.equal([
      'Bearer shopper-1:RefArch',
      'Bearer shopper-2:RefArch',
      'Bearer shopper-2:RefArch',
    ]);

    // Tokens are site-bound.
    await request(sessions.for(shopperConfig()))({method: 'GET', path: products, query: {siteId: 'Other'}}, signal());
    expect(grants.at(-1)).to.equal('client_credentials:Other:');
  });

  it('selects authentication from the operation contract', async () => {
    const shopperAuth: ScapiShopperAuth = {getAccessToken: async () => 'unused', invalidate() {}};
    let adminCalls = 0;
    server.use(
      http.patch(`${origin}/checkout/orders/v1/organizations/f_ecom_test_001/orders/o1`, ({request: api}) => {
        adminCalls++;
        expect(api.headers.get('authorization')).to.equal('Bearer admin-token');
        return HttpResponse.json({});
      }),
    );
    // AmOAuth2 OR trusted-system on behalf: the Admin alternative is used.
    await request(shopperAuth)(
      {
        method: 'PATCH',
        path: '/checkout/orders/v1/organizations/{organizationId}/orders/o1',
        query: {siteId: 'RefArch'},
        body: {status: 'new'},
      },
      signal(),
    );
    expect(adminCalls).to.equal(1);
    await rejects(
      () =>
        request(shopperAuth)(
          {
            method: 'POST',
            path: '/checkout/orders/v1/organizations/{organizationId}/orders',
            query: {siteId: 'RefArch'},
            body: {},
          },
          signal(),
        ),
      /SCAPI_SHOPPER_AUTH_UNSUPPORTED/,
    );
    await rejects(
      () =>
        request(shopperAuth)(
          {method: 'GET', path: '/customer/shopper-customers/v1/organizations/{organizationId}/customers/c1'},
          signal(),
        ),
      /SCAPI_REGISTERED_SHOPPER_UNSUPPORTED/,
    );
    await rejects(() => request()({method: 'GET', path: products}, signal()), /SCAPI_SHOPPER_AUTH_UNAVAILABLE/);
    await rejects(() => request(shopperAuth, '')({method: 'GET', path: products}, signal()), /siteId/);

    const document = loadScapiSchemas().find((item) => item.entry.id === 'product/shopper-products/v1')!;
    const operation = document.schema.paths['/organizations/{organizationId}/products/{id}'].get;
    expect(getScapiAuthInfo(document, operation)).to.deep.include({types: ['shopper'], executable: true});
  });

  it('explains rejected shopper tokens with granted scopes and starts a new session', async () => {
    const invalidated: string[] = [];
    const shopperAuth: ScapiShopperAuth = {
      getAccessToken: async () => jwt({scp: 'sfcc.shopper-categories sfcc.shopper-standard'}),
      invalidate: (siteId) => invalidated.push(siteId),
    };
    server.use(
      http.get(`${origin}/product/shopper-products/v1/organizations/f_ecom_test_001/products/p1`, () =>
        HttpResponse.json({title: 'Unauthorized'}, {status: 401}),
      ),
    );
    const result = (await request(shopperAuth)({method: 'GET', path: products}, signal())) as {
      diagnostic: {code: string; message: string};
    };
    expect(result.diagnostic.code).to.equal('SCAPI_UNAUTHORIZED');
    expect(result.diagnostic.message)
      .to.include('Shopper token')
      .and.include('accepts any of: sfcc.shopper-products, sfcc.shopper-standard')
      .and.include('grants sfcc.shopper-standard, so scopes are likely not the cause');
    expect(invalidated).to.deep.equal(['RefArch']);
  });

  it('explains that the standard shopper scope covers only operations that accept it', async () => {
    let scp = 'sfcc.shopper-standard';
    const shopperAuth: ScapiShopperAuth = {getAccessToken: async () => jwt({scp}), invalidate() {}};
    server.use(
      http.get(`${origin}/product/shopper-products/v1/organizations/f_ecom_test_001/products/p1/images`, () =>
        HttpResponse.json({title: 'Forbidden'}, {status: 403}),
      ),
    );
    const forbidden = async () =>
      (
        (await request(shopperAuth)({method: 'GET', path: `${products}/images`}, signal())) as {
          diagnostic: {message: string};
        }
      ).diagnostic.message;
    // The images contract lists sfcc.shopper-products but not sfcc.shopper-standard.
    expect(await forbidden())
      .to.include('accepts any of: sfcc.shopper-products.')
      .and.include('sfcc.shopper-standard does not cover this operation');
    scp = 'sfcc.shopper-categories';
    expect(await forbidden()).to.include('The shopper token grants: sfcc.shopper-categories; add one of');
  });

  it('reports SLAS configuration and login failures', async () => {
    await rejects(
      () =>
        request(new ScapiShopperSessions().for({...shopperConfig(), slasClientId: undefined}))(
          {method: 'GET', path: products},
          signal(),
        ),
      /SCAPI_SHOPPER_CONFIG_MISSING/,
    );
    server.use(http.post(tokenUrl, () => HttpResponse.json({error: 'invalid_client'}, {status: 401})));
    await rejects(
      () => request(new ScapiShopperSessions().for(shopperConfig()))({method: 'GET', path: products}, signal()),
      /SCAPI_SHOPPER_AUTH_FAILED: .*invalid_client/,
    );
  });
});
