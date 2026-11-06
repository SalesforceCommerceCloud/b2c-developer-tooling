/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createScapiAuth} from '@salesforce/b2c-tooling-sdk/scapi';

const server = setupServer();
const slas = 'https://test.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/f_ecom_test_001/oauth2';
const signal = () => new AbortController().signal;
async function rejects(fn: () => Promise<unknown>, message: string) {
  let error: unknown;
  try {
    await fn();
  } catch (caught) {
    error = caught;
  }
  expect(error).to.be.instanceOf(Error);
  expect((error as Error).message).to.include(message);
}

describe('SCAPI token exports', () => {
  before(() => server.listen({onUnhandledRequest: 'error'}));
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  it('exports only SLAS tokens and reports missing config', async () => {
    const auth = createScapiAuth({clientId: 'test', clientSecret: 'secret'});
    await rejects(() => auth('accountManager', {}, signal()), 'SCAPI_AUTH_INPUT');
    await rejects(() => auth('slas', {}, signal()), 'slasClientId');
    await rejects(() => auth('slas', {clientSecret: 'not-allowed'}, signal()), 'SCAPI_AUTH_INPUT');
  });

  for (const privateClient of [false, true]) {
    for (const flow of ['guest', 'registered']) {
      it(`exports SLAS ${flow} tokens for ${privateClient ? 'private' : 'public'} clients`, async () => {
        let authorizations = 0;
        const authorize = () => {
          authorizations++;
          return new HttpResponse(null, {
            status: 303,
            headers: {location: 'http://localhost:3000/callback?code=test&usid=shopper'},
          });
        };
        server.use(
          http.get(`${slas}/authorize`, authorize),
          http.post(`${slas}/login`, authorize),
          http.post(`${slas}/token`, async ({request}) => {
            const body = new URLSearchParams(await request.text());
            const pkce = flow === 'registered' || !privateClient;
            expect(body.get('grant_type')).to.equal(pkce ? 'authorization_code_pkce' : 'client_credentials');
            expect(body.has('code_verifier')).to.equal(pkce);
            expect(request.headers.has('authorization')).to.equal(privateClient);
            expect(body.get('channel_id')).to.equal('selected-site');
            return HttpResponse.json({access_token: 'shopper-token', refresh_token: 'refresh', expires_in: 300});
          }),
        );
        const auth = createScapiAuth({
          shortCode: 'test',
          tenantId: 'test_001',
          slasClientId: 'shopper',
          ...(privateClient ? {slasClientSecret: 'secret'} : {}),
        });
        const result = await auth(
          'slas',
          {
            flow,
            siteId: 'selected-site',
            ...(flow === 'registered' ? {shopperLogin: 'buyer', shopperPassword: 'password'} : {}),
          },
          signal(),
        );
        expect(result).to.have.property('access_token', 'shopper-token');
        expect(authorizations).to.equal(flow === 'registered' || !privateClient ? 1 : 0);
      });
    }
  }

  it('aborts SLAS between authorization and exchange', async () => {
    const controller = new AbortController();
    let exchanges = 0;
    server.use(
      http.get(`${slas}/authorize`, () => {
        controller.abort();
        return new HttpResponse(null, {status: 303, headers: {location: 'http://localhost:3000/callback?code=test'}});
      }),
      http.post(`${slas}/token`, () => {
        exchanges++;
        return HttpResponse.json({});
      }),
    );
    const auth = createScapiAuth({shortCode: 'test', tenantId: 'test_001', slasClientId: 'shopper', siteId: 'site'});
    await rejects(() => auth('slas', {}, controller.signal), 'aborted');
    expect(exchanges).to.equal(0);
  });

  it('rejects token endpoint redirects before sending credentials to another endpoint', async () => {
    let redirected = false;
    server.use(
      http.post(
        `${slas}/token`,
        () => new HttpResponse(null, {status: 307, headers: {location: 'https://other.test/token'}}),
      ),
      http.all('https://other.test/token', () => {
        redirected = true;
        return HttpResponse.json({});
      }),
    );
    await rejects(
      () =>
        createScapiAuth({
          shortCode: 'test',
          tenantId: 'test_001',
          slasClientId: 'shopper',
          slasClientSecret: 'secret',
          siteId: 'site',
        })('slas', {}, signal()),
      'SCAPI_AUTH_SLAS',
    );
    expect(redirected).to.equal(false);
  });
});
