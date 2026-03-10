/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {
  getGuestToken,
  getRegisteredToken,
  type SlasTokenConfig,
  type SlasRegisteredLoginConfig,
} from '@salesforce/b2c-tooling-sdk/slas';

const SHORT_CODE = 'kv7kzm78';
const ORG_ID = 'f_ecom_abcd_123';
const BASE_URL = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${ORG_ID}`;

const MOCK_TOKEN_RESPONSE = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 1800,
  token_type: 'Bearer',
  usid: 'mock-usid',
  customer_id: 'mock-customer-id',
};

function baseConfig(overrides: Partial<SlasTokenConfig> = {}): SlasTokenConfig {
  return {
    shortCode: SHORT_CODE,
    organizationId: ORG_ID,
    slasClientId: 'test-client-id',
    siteId: 'RefArch',
    redirectUri: 'http://localhost:3000/callback',
    ...overrides,
  };
}

describe('slas/token', () => {
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

  describe('getGuestToken - public client (PKCE)', () => {
    it('exchanges authorization code for token via PKCE flow', async () => {
      server.use(
        http.get(`${BASE_URL}/oauth2/authorize`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('client_id')).to.equal('test-client-id');
          expect(url.searchParams.get('response_type')).to.equal('code');
          expect(url.searchParams.get('hint')).to.equal('guest');
          expect(url.searchParams.get('code_challenge')).to.be.a('string');
          expect(url.searchParams.get('redirect_uri')).to.equal('http://localhost:3000/callback');

          return new HttpResponse(null, {
            status: 303,
            headers: {
              Location: `http://localhost:3000/callback?code=auth-code-123&usid=usid-456`,
            },
          });
        }),
        http.post(`${BASE_URL}/oauth2/token`, async ({request}) => {
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('grant_type')).to.equal('authorization_code_pkce');
          expect(params.get('client_id')).to.equal('test-client-id');
          expect(params.get('code')).to.equal('auth-code-123');
          expect(params.get('code_verifier')).to.be.a('string');
          expect(params.get('channel_id')).to.equal('RefArch');
          expect(params.get('usid')).to.equal('usid-456');

          return HttpResponse.json(MOCK_TOKEN_RESPONSE);
        }),
      );

      const result = await getGuestToken(baseConfig());

      expect(result.access_token).to.equal('mock-access-token');
      expect(result.refresh_token).to.equal('mock-refresh-token');
      expect(result.expires_in).to.equal(1800);
      expect(result.usid).to.equal('mock-usid');
    });

    it('throws when authorize does not return 303', async () => {
      server.use(
        http.get(`${BASE_URL}/oauth2/authorize`, () => {
          return HttpResponse.json({error: 'invalid_client'}, {status: 401});
        }),
      );

      try {
        await getGuestToken(baseConfig());
        expect.fail('Expected error');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('authorize');
      }
    });
  });

  describe('getGuestToken - private client (client_credentials)', () => {
    it('obtains token via client_credentials grant', async () => {
      server.use(
        http.post(`${BASE_URL}/oauth2/token`, async ({request}) => {
          const auth = request.headers.get('Authorization');
          const expected = Buffer.from('test-client-id:test-secret').toString('base64');
          expect(auth).to.equal(`Basic ${expected}`);

          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('grant_type')).to.equal('client_credentials');
          expect(params.get('channel_id')).to.equal('RefArch');

          return HttpResponse.json(MOCK_TOKEN_RESPONSE);
        }),
      );

      const result = await getGuestToken(baseConfig({slasClientSecret: 'test-secret'}));

      expect(result.access_token).to.equal('mock-access-token');
    });

    it('throws on token error', async () => {
      server.use(
        http.post(`${BASE_URL}/oauth2/token`, () => {
          return HttpResponse.json({error: 'invalid_client'}, {status: 401});
        }),
      );

      try {
        await getGuestToken(baseConfig({slasClientSecret: 'bad-secret'}));
        expect.fail('Expected error');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('client_credentials');
        expect((error as Error).message).to.include('401');
      }
    });
  });

  describe('getRegisteredToken - public client', () => {
    it('logs in with shopper credentials and exchanges code via PKCE', async () => {
      server.use(
        http.post(`${BASE_URL}/oauth2/login`, async ({request}) => {
          const auth = request.headers.get('Authorization');
          const expected = Buffer.from('user@example.com:pass123').toString('base64');
          expect(auth).to.equal(`Basic ${expected}`);

          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('client_id')).to.equal('test-client-id');
          expect(params.get('channel_id')).to.equal('RefArch');
          expect(params.get('code_challenge')).to.be.a('string');

          return new HttpResponse(null, {
            status: 303,
            headers: {
              Location: `http://localhost:3000/callback?code=reg-code-789&usid=usid-reg`,
            },
          });
        }),
        http.post(`${BASE_URL}/oauth2/token`, async ({request}) => {
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('grant_type')).to.equal('authorization_code_pkce');
          expect(params.get('code')).to.equal('reg-code-789');
          expect(params.get('code_verifier')).to.be.a('string');

          return HttpResponse.json(MOCK_TOKEN_RESPONSE);
        }),
      );

      const config: SlasRegisteredLoginConfig = {
        ...baseConfig(),
        shopperLogin: 'user@example.com',
        shopperPassword: 'pass123',
      };

      const result = await getRegisteredToken(config);

      expect(result.access_token).to.equal('mock-access-token');
    });
  });

  describe('getRegisteredToken - private client', () => {
    it('logs in with shopper credentials and exchanges code with Basic auth', async () => {
      server.use(
        http.post(`${BASE_URL}/oauth2/login`, () => {
          return new HttpResponse(null, {
            status: 303,
            headers: {
              Location: `http://localhost:3000/callback?code=priv-code&usid=usid-priv`,
            },
          });
        }),
        http.post(`${BASE_URL}/oauth2/token`, async ({request}) => {
          const auth = request.headers.get('Authorization');
          const expected = Buffer.from('test-client-id:test-secret').toString('base64');
          expect(auth).to.equal(`Basic ${expected}`);

          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('grant_type')).to.equal('authorization_code');
          expect(params.get('code')).to.equal('priv-code');

          return HttpResponse.json(MOCK_TOKEN_RESPONSE);
        }),
      );

      const config: SlasRegisteredLoginConfig = {
        ...baseConfig({slasClientSecret: 'test-secret'}),
        shopperLogin: 'user@example.com',
        shopperPassword: 'pass123',
      };

      const result = await getRegisteredToken(config);

      expect(result.access_token).to.equal('mock-access-token');
    });

    it('throws when login does not return 303', async () => {
      server.use(
        http.post(`${BASE_URL}/oauth2/login`, () => {
          return HttpResponse.json({error: 'invalid_credentials'}, {status: 401});
        }),
      );

      const config: SlasRegisteredLoginConfig = {
        ...baseConfig(),
        shopperLogin: 'bad@example.com',
        shopperPassword: 'wrong',
      };

      try {
        await getRegisteredToken(config);
        expect.fail('Expected error');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('login');
      }
    });
  });
});
