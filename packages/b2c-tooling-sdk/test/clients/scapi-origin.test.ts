/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {
  createCustomApisClient,
  createSlasShopperClient,
  getScapiBaseUrl,
  getScapiOrigin,
  setScapiBaseUrl,
  SCAPI_BASE_URL_ENV_VAR,
} from '@salesforce/b2c-tooling-sdk/clients';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const LOCAL_ORIGIN = 'https://localhost:25010';

describe('clients/scapi-origin', () => {
  let savedEnv: string | undefined;

  beforeEach(() => {
    savedEnv = process.env[SCAPI_BASE_URL_ENV_VAR];
    delete process.env[SCAPI_BASE_URL_ENV_VAR];
    setScapiBaseUrl(undefined);
  });

  afterEach(() => {
    setScapiBaseUrl(undefined);
    if (savedEnv === undefined) delete process.env[SCAPI_BASE_URL_ENV_VAR];
    else process.env[SCAPI_BASE_URL_ENV_VAR] = savedEnv;
  });

  describe('getScapiOrigin', () => {
    it('defaults to the short-code host', () => {
      expect(getScapiOrigin('kv7kzm78')).to.equal('https://kv7kzm78.api.commercecloud.salesforce.com');
    });

    it('uses the override and strips trailing slashes', () => {
      setScapiBaseUrl(`${LOCAL_ORIGIN}//`);
      expect(getScapiOrigin('kv7kzm78')).to.equal(LOCAL_ORIGIN);
      expect(getScapiBaseUrl()).to.equal(LOCAL_ORIGIN);
    });

    it('falls back to SFCC_SCAPI_BASE_URL', () => {
      process.env[SCAPI_BASE_URL_ENV_VAR] = LOCAL_ORIGIN;
      expect(getScapiOrigin('kv7kzm78')).to.equal(LOCAL_ORIGIN);
    });

    it('prefers the explicit override over the env var', () => {
      process.env[SCAPI_BASE_URL_ENV_VAR] = 'https://from-env:1';
      setScapiBaseUrl(LOCAL_ORIGIN);
      expect(getScapiOrigin('kv7kzm78')).to.equal(LOCAL_ORIGIN);
    });

    it('treats an empty value as unset', () => {
      setScapiBaseUrl('  ');
      expect(getScapiBaseUrl()).to.be.undefined;
    });

    it('rejects values that are not http(s) URLs', () => {
      expect(() => setScapiBaseUrl('localhost:25010')).to.throw(/Invalid SCAPI base URL/);
      expect(() => setScapiBaseUrl('not a url')).to.throw(/Invalid SCAPI base URL/);
    });
  });

  describe('clients', () => {
    const server = setupServer();

    before(() => server.listen({onUnhandledRequest: 'error'}));
    afterEach(() => server.resetHandlers());
    after(() => server.close());

    it('sends admin SCAPI requests to the override origin with unchanged paths', async () => {
      server.use(
        http.get(`${LOCAL_ORIGIN}/dx/custom-apis/v1/organizations/:organizationId/endpoints`, () =>
          HttpResponse.json({limit: 10, total: 0, data: []}),
        ),
      );
      setScapiBaseUrl(LOCAL_ORIGIN);

      const client = createCustomApisClient({shortCode: 'kv7kzm78', tenantId: 'zzzz_s01'}, new MockAuthStrategy());
      const {data, error} = await client.GET('/organizations/{organizationId}/endpoints', {
        params: {path: {organizationId: 'f_ecom_zzzz_s01'}},
      });

      expect(error).to.be.undefined;
      expect(data?.data).to.deep.equal([]);
    });

    it('sends SLAS shopper requests to the override origin', async () => {
      server.use(
        http.post(`${LOCAL_ORIGIN}/shopper/auth/v1/organizations/f_ecom_zzzz_s01/oauth2/token`, () =>
          HttpResponse.json({access_token: 'local-token'}),
        ),
      );
      setScapiBaseUrl(LOCAL_ORIGIN);

      const client = createSlasShopperClient({shortCode: 'kv7kzm78', organizationId: 'f_ecom_zzzz_s01'});
      const {data} = await client.POST('/oauth2/token', {
        body: {grant_type: 'client_credentials'} as never,
      });

      expect((data as {access_token?: string} | undefined)?.access_token).to.equal('local-token');
    });
  });
});
