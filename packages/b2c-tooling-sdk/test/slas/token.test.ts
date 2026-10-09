/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import sinon from 'sinon';
import {createHash} from 'node:crypto';
import {
  createExtraParamsMiddleware,
  globalMiddlewareRegistry,
  MiddlewareRegistry,
} from '@salesforce/b2c-tooling-sdk/clients';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';
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
    globalMiddlewareRegistry.clear();
    sinon.restore();
  });

  after(() => {
    server.close();
  });

  for (const registered of [false, true]) {
    for (const privateClient of [false, true]) {
      it(`applies middleware throughout ${privateClient ? 'private' : 'public'} ${registered ? 'registered' : 'guest'} flow`, async () => {
        const requests: Request[] = [];
        const responses: number[] = [];
        const middleware = createExtraParamsMiddleware({headers: {'x-mobify': 'true'}, query: {diagnostic: 'enabled'}});
        globalMiddlewareRegistry.register({
          name: 'slas-test',
          getMiddleware(clientType) {
            if (clientType !== 'slas') return undefined;
            return {
              ...middleware,
              onResponse({response}) {
                responses.push(response.status);
              },
            };
          },
        });

        let challenge: string | null = null;
        server.use(
          http.all(`${BASE_URL}/oauth2/:endpoint`, async ({request, params}) => {
            requests.push(request);
            const url = new URL(request.url);
            expect(request.headers.get('x-mobify')).to.equal('true');
            expect(url.searchParams.get('diagnostic')).to.equal('enabled');
            const body = new URLSearchParams(await request.text());
            if (params.endpoint !== 'token') {
              expect(request.redirect).to.equal('manual');
              challenge = registered ? body.get('code_challenge') : url.searchParams.get('code_challenge');
              if (registered) {
                expect(request.headers.get('authorization')).to.equal(
                  `Basic ${Buffer.from('user@example.com:pass123').toString('base64')}`,
                );
              }
              return new HttpResponse(null, {
                status: 303,
                headers: {Location: 'http://localhost:3000/callback?code=code%2B%26%3D&usid=visitor'},
              });
            }
            expect(request.headers.get('content-type')).to.equal('application/x-www-form-urlencoded');
            expect(request.redirect).to.equal('error');
            expect(body.get('channel_id')).to.equal('RefArch');
            expect(request.headers.get('authorization')).to.equal(
              privateClient ? `Basic ${Buffer.from('test-client-id:test-secret').toString('base64')}` : null,
            );
            if (registered || !privateClient) {
              expect(body.get('code')).to.equal('code+&=');
              expect(createHash('sha256').update(body.get('code_verifier')!).digest('base64url')).to.equal(challenge);
            } else {
              expect(body.get('grant_type')).to.equal('client_credentials');
            }
            return HttpResponse.json(MOCK_TOKEN_RESPONSE);
          }),
        );
        const config = baseConfig({slasClientSecret: privateClient ? 'test-secret' : undefined});
        const result = registered
          ? await getRegisteredToken({...config, shopperLogin: 'user@example.com', shopperPassword: 'pass123'})
          : await getGuestToken(config);
        expect(result).to.deep.equal(MOCK_TOKEN_RESPONSE);
        expect(requests).to.have.length(registered || !privateClient ? 2 : 1);
        expect(responses).to.deep.equal(registered || !privateClient ? [303, 200] : [200]);
      });
    }
  }

  it('uses an explicitly supplied registry instead of the global registry', async () => {
    globalMiddlewareRegistry.register({
      name: 'global',
      getMiddleware: () => createExtraParamsMiddleware({headers: {'x-global': 'true'}}),
    });
    const middlewareRegistry = new MiddlewareRegistry();
    middlewareRegistry.register({
      name: 'custom',
      getMiddleware: () => createExtraParamsMiddleware({headers: {'x-custom': 'true'}}),
    });
    server.use(
      http.post(`${BASE_URL}/oauth2/token`, ({request}) => {
        expect(request.headers.get('x-custom')).to.equal('true');
        expect(request.headers.has('x-global')).to.equal(false);
        return HttpResponse.json(MOCK_TOKEN_RESPONSE);
      }),
    );
    await getGuestToken(baseConfig({slasClientSecret: 'test-secret', middlewareRegistry}));
  });

  it('preserves network error context', async () => {
    server.use(http.post(`${BASE_URL}/oauth2/token`, () => HttpResponse.error()));
    try {
      await getGuestToken(baseConfig({slasClientSecret: 'test-secret'}));
      expect.fail('Expected a network error');
    } catch (error) {
      expect(error).to.include({
        name: 'NetworkError',
        operation: 'SLAS token request',
        host: `${SHORT_CODE}.api.commercecloud.salesforce.com`,
      });
    }
  });

  it('preserves cancellation through request middleware', async () => {
    const controller = new AbortController();
    let requestAborted = false;
    globalMiddlewareRegistry.register({
      name: 'slas-cancellation',
      getMiddleware: () => createExtraParamsMiddleware({headers: {'x-test': 'true'}, query: {test: 'true'}}),
    });
    server.use(
      http.post(`${BASE_URL}/oauth2/token`, ({request}) => {
        request.signal.addEventListener('abort', () => {
          requestAborted = true;
        });
        controller.abort();
        return HttpResponse.json(MOCK_TOKEN_RESPONSE);
      }),
    );
    try {
      await getGuestToken(baseConfig({slasClientSecret: 'test-secret', signal: controller.signal}));
      expect.fail('Expected cancellation');
    } catch (error) {
      expect((error as Error).message).to.match(/abort/i);
    }
    expect(requestAborted).to.equal(true);
  });

  it('logs request status without authentication headers or token bodies', async () => {
    const trace = sinon.spy(getLogger(), 'trace');
    const debug = sinon.spy(getLogger(), 'debug');
    server.use(http.post(`${BASE_URL}/oauth2/token`, () => HttpResponse.json(MOCK_TOKEN_RESPONSE)));
    await getGuestToken(baseConfig({slasClientSecret: 'test-secret'}));
    expect(trace.called).to.equal(false);
    expect(debug.args.some(([details]) => typeof details === 'object' && details?.status === 200)).to.equal(true);
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
      const debug = sinon.stub(getLogger(), 'debug');
      server.use(
        http.post(`${BASE_URL}/oauth2/token`, () => {
          return HttpResponse.json(
            {error: 'invalid_client'},
            {status: 401, headers: {sfdc_correlation_id: 'test-correlation', 'set-cookie': 'session=sensitive-cookie'}},
          );
        }),
      );

      try {
        await getGuestToken(baseConfig({slasClientSecret: 'bad-secret'}));
        expect.fail('Expected error');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('client_credentials');
        expect((error as Error).message).to.include('401');
        expect((error as Error).message).to.include('invalid_client');
      }

      const responseLog = debug.getCalls().find((call) => call.args[0]?.status === 401);
      expect(responseLog?.args[0]).to.include({status: 401, correlationId: 'test-correlation'});
      expect(JSON.stringify(debug.args)).not.to.include('sensitive-cookie');
      expect(JSON.stringify(debug.args)).not.to.include('bad-secret');
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
    it('exchanges code via PKCE with Basic auth (sends code_verifier)', async () => {
      // Regression test for W-23235332: the login step always presents a
      // code_challenge, so the private-client token exchange must send the
      // matching code_verifier with the authorization_code_pkce grant. The
      // previous behavior used grant_type=authorization_code WITHOUT a
      // code_verifier, which SLAS rejects with "400 code_verifier is required".
      let loginChallenge: string | null = null;
      server.use(
        http.post(`${BASE_URL}/oauth2/login`, async ({request}) => {
          const params = new URLSearchParams(await request.text());
          loginChallenge = params.get('code_challenge');
          expect(loginChallenge).to.be.a('string');

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
          expect(params.get('grant_type')).to.equal('authorization_code_pkce');
          expect(params.get('client_id')).to.equal('test-client-id');
          expect(params.get('code')).to.equal('priv-code');
          // The verifier must be present so SLAS can validate the challenge.
          expect(params.get('code_verifier')).to.be.a('string').and.not.empty;
          expect(params.get('channel_id')).to.equal('RefArch');
          expect(params.get('usid')).to.equal('usid-priv');

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
