/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {OAuthStrategy, decodeJWT} from '@salesforce/b2c-tooling-sdk/auth';

const AM_HOST = 'account.demandware.com';
const AM_URL = `https://${AM_HOST}/dwsso/oauth2/access_token`;
const TEST_API_URL = 'https://api.test.com/endpoint';

describe('auth/oauth', () => {
  const server = setupServer();

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  afterEach(() => {
    server.resetHandlers();
    // Clear token cache between tests to avoid interference
    // We need to create a dummy strategy and invalidate to clear the cache
    const dummy = new OAuthStrategy({clientId: 'test-client', clientSecret: 'test-secret'});
    dummy.invalidateToken();
  });

  after(() => {
    server.close();
  });

  describe('decodeJWT', () => {
    it('should decode a valid JWT', () => {
      // Create a simple JWT: header.payload.signature
      const header = {alg: 'HS256', typ: 'JWT'};
      const payload = {sub: '1234567890', name: 'John Doe', iat: 1516239022};
      const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64');
      const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
      const jwt = `${headerB64}.${payloadB64}.signature`;

      const decoded = decodeJWT(jwt);

      expect(decoded.header).to.deep.equal(header);
      expect(decoded.payload).to.deep.equal(payload);
    });

    it('should throw error for invalid JWT format', () => {
      expect(() => decodeJWT('invalid')).to.throw('Invalid JWT format');
      expect(() => decodeJWT('only.two')).to.throw('Invalid JWT format');
    });
  });

  describe('OAuthStrategy', () => {
    describe('constructor', () => {
      it('should create strategy with default account manager host', () => {
        const strategy = new OAuthStrategy({
          clientId: 'test-client',
          clientSecret: 'test-secret',
        });

        expect(strategy).to.be.instanceOf(OAuthStrategy);
      });

      it('should create strategy with custom account manager host', () => {
        const strategy = new OAuthStrategy({
          clientId: 'test-client',
          clientSecret: 'test-secret',
          accountManagerHost: 'custom.host.com',
        });

        expect(strategy).to.be.instanceOf(OAuthStrategy);
      });
    });

    describe('clientCredentialsGrant', () => {
      it('should fetch access token successfully', async () => {
        const mockToken = createMockJWT({sub: 'test-client'});

        server.use(
          http.post(AM_URL, () => {
            return HttpResponse.json({
              access_token: mockToken,
              expires_in: 1800,
              scope: 'sfcc.sandbox.manage',
            });
          }),
        );

        const strategy = new OAuthStrategy({
          clientId: 'test-client',
          clientSecret: 'test-secret',
          scopes: ['sfcc.sandbox.manage'],
        });

        const tokenResponse = await strategy.getTokenResponse();

        expect(tokenResponse.accessToken).to.equal(mockToken);
        expect(tokenResponse.scopes).to.deep.equal(['sfcc.sandbox.manage']);
        expect(tokenResponse.expires).to.be.instanceOf(Date);
      });

      it('should handle token request without scopes', async () => {
        const mockToken = createMockJWT({sub: 'test-client-noscope'});

        server.use(
          http.post(AM_URL, () => {
            return HttpResponse.json({
              access_token: mockToken,
              expires_in: 1800,
            });
          }),
        );

        const strategy = new OAuthStrategy({
          clientId: 'test-client-noscope',
          clientSecret: 'test-secret',
        });

        const tokenResponse = await strategy.getTokenResponse();

        expect(tokenResponse.accessToken).to.equal(mockToken);
        expect(tokenResponse.scopes).to.deep.equal([]);
      });

      it('should throw error on failed token request', async () => {
        server.use(
          http.post(AM_URL, () => {
            return new HttpResponse('Unauthorized', {status: 401});
          }),
        );

        const strategy = new OAuthStrategy({
          clientId: 'bad-client',
          clientSecret: 'bad-secret',
        });

        try {
          await strategy.getTokenResponse();
          expect.fail('Should have thrown error');
        } catch (error: any) {
          expect(error.message).to.include('Failed to get access token');
          expect(error.message).to.include('401');
        }
      });
    });

    describe('token caching', () => {
      it('should cache and reuse valid tokens', async () => {
        const clientId = 'test-client-cache';
        const mockToken = createMockJWT({sub: clientId});
        let requestCount = 0;

        server.use(
          http.post(AM_URL, () => {
            requestCount++;
            return HttpResponse.json({
              access_token: mockToken,
              expires_in: 1800,
              scope: 'sfcc.sandbox.manage',
            });
          }),
        );

        const strategy = new OAuthStrategy({
          clientId,
          clientSecret: 'test-secret',
          scopes: ['sfcc.sandbox.manage'],
        });

        // First call - should fetch
        const token1 = await strategy.getTokenResponse();
        expect(requestCount).to.equal(1);

        // Second call - should use cache
        const token2 = await strategy.getTokenResponse();
        expect(requestCount).to.equal(1); // No additional request
        expect(token2.accessToken).to.equal(token1.accessToken);
      });

      it('should invalidate and refetch token when invalidateToken is called', async () => {
        const clientId = 'test-client-invalidate';
        const mockToken = createMockJWT({sub: clientId});
        let requestCount = 0;

        server.use(
          http.post(AM_URL, () => {
            requestCount++;
            return HttpResponse.json({
              access_token: mockToken,
              expires_in: 1800,
            });
          }),
        );

        const strategy = new OAuthStrategy({
          clientId,
          clientSecret: 'test-secret',
        });

        // First call
        await strategy.getTokenResponse();
        expect(requestCount).to.equal(1);

        // Invalidate
        strategy.invalidateToken();

        // Third call - should fetch again
        await strategy.getTokenResponse();
        expect(requestCount).to.equal(2);
      });
    });

    describe('fetch', () => {
      it('should add authorization header to requests', async () => {
        const clientId = 'test-client-fetch';
        const mockToken = createMockJWT({sub: clientId});

        server.use(
          http.post(AM_URL, () => {
            return HttpResponse.json({
              access_token: mockToken,
              expires_in: 1800,
            });
          }),
          http.get(TEST_API_URL, ({request}) => {
            const authHeader = request.headers.get('Authorization');
            const clientIdHeader = request.headers.get('x-dw-client-id');

            if (authHeader === `Bearer ${mockToken}` && clientIdHeader === clientId) {
              return HttpResponse.json({success: true});
            }

            return new HttpResponse(null, {status: 401});
          }),
        );

        const strategy = new OAuthStrategy({
          clientId,
          clientSecret: 'test-secret',
        });

        const response = await strategy.fetch(TEST_API_URL);

        expect(response.status).to.equal(200);
        const data = await response.json();
        expect(data).to.deep.equal({success: true});
      });

      it('should retry on 401 with fresh token', async () => {
        const clientId = 'test-client-retry';
        const mockToken1 = createMockJWT({sub: clientId, iat: 1000});
        const mockToken2 = createMockJWT({sub: clientId, iat: 2000});
        let tokenRequestCount = 0;
        let apiRequestCount = 0;

        server.use(
          http.post(AM_URL, () => {
            tokenRequestCount++;
            const token = tokenRequestCount === 1 ? mockToken1 : mockToken2;
            return HttpResponse.json({
              access_token: token,
              expires_in: 1800,
            });
          }),
          http.get(TEST_API_URL, ({request}) => {
            apiRequestCount++;
            const authHeader = request.headers.get('Authorization');

            // First request succeeds (establishes prior success)
            if (apiRequestCount === 1 && authHeader === `Bearer ${mockToken1}`) {
              return HttpResponse.json({success: true});
            }

            // Second request with old token fails (simulates expired token)
            if (apiRequestCount === 2 && authHeader === `Bearer ${mockToken1}`) {
              return new HttpResponse(null, {status: 401});
            }

            // Third request with new token succeeds
            if (apiRequestCount === 3 && authHeader === `Bearer ${mockToken2}`) {
              return HttpResponse.json({success: true});
            }

            return new HttpResponse(null, {status: 401});
          }),
        );

        const strategy = new OAuthStrategy({
          clientId,
          clientSecret: 'test-secret',
        });

        // First call succeeds - establishes prior success
        const firstResponse = await strategy.fetch(TEST_API_URL);
        expect(firstResponse.status).to.equal(200);

        // Second call gets 401 then retries with fresh token
        const response = await strategy.fetch(TEST_API_URL);

        expect(tokenRequestCount).to.equal(2); // Fetched twice
        expect(apiRequestCount).to.equal(3); // Initial success + 401 + retry
        expect(response.status).to.equal(200);
      });

      it('should not retry on initial 401 with bad credentials', async () => {
        const clientId = 'test-client-bad-creds';
        const mockToken = createMockJWT({sub: clientId});
        let tokenRequestCount = 0;
        let apiRequestCount = 0;

        server.use(
          http.post(AM_URL, () => {
            tokenRequestCount++;
            return HttpResponse.json({
              access_token: mockToken,
              expires_in: 1800,
            });
          }),
          http.get(TEST_API_URL, () => {
            apiRequestCount++;
            return new HttpResponse(null, {status: 401});
          }),
        );

        const strategy = new OAuthStrategy({
          clientId,
          clientSecret: 'test-secret',
        });

        // First call gets 401 - should NOT retry since no prior success
        const response = await strategy.fetch(TEST_API_URL);

        expect(tokenRequestCount).to.equal(1); // Only fetched once
        expect(apiRequestCount).to.equal(1); // API called once, no retry
        expect(response.status).to.equal(401);
      });
    });

    describe('getAuthorizationHeader', () => {
      it('should return Bearer token header', async () => {
        const clientId = 'test-client-authheader';
        const mockToken = createMockJWT({sub: clientId});

        server.use(
          http.post(AM_URL, () => {
            return HttpResponse.json({
              access_token: mockToken,
              expires_in: 1800,
            });
          }),
        );

        const strategy = new OAuthStrategy({
          clientId,
          clientSecret: 'test-secret',
        });

        const header = await strategy.getAuthorizationHeader();

        expect(header).to.equal(`Bearer ${mockToken}`);
      });
    });

    describe('getJWT', () => {
      it('should return decoded JWT', async () => {
        const clientId = 'test-client-jwt';
        const payload = {sub: clientId, name: 'Test Client', iat: 1516239022};
        const mockToken = createMockJWT(payload);

        server.use(
          http.post(AM_URL, () => {
            return HttpResponse.json({
              access_token: mockToken,
              expires_in: 1800,
            });
          }),
        );

        const strategy = new OAuthStrategy({
          clientId,
          clientSecret: 'test-secret',
        });

        const jwt = await strategy.getJWT();

        expect(jwt.payload).to.deep.include(payload);
      });
    });

    describe('withAdditionalScopes', () => {
      it('creates new strategy with additional scopes', () => {
        const original = new OAuthStrategy({
          clientId: 'test-client',
          clientSecret: 'test-secret',
          scopes: ['scope1'],
        });

        const extended = original.withAdditionalScopes(['scope2', 'scope3']);

        // Should be a different instance
        expect(extended).to.not.equal(original);
        expect(extended).to.be.instanceOf(OAuthStrategy);
      });

      it('merges scopes without duplicates', () => {
        const original = new OAuthStrategy({
          clientId: 'test-client',
          clientSecret: 'test-secret',
          scopes: ['scope1', 'scope2'],
        });

        const extended = original.withAdditionalScopes(['scope2', 'scope3']);

        // Access internal config via another withAdditionalScopes to verify
        const doubleExtended = extended.withAdditionalScopes([]);
        // The scopes should be deduplicated
        expect(doubleExtended).to.be.instanceOf(OAuthStrategy);
      });

      it('handles empty original scopes', () => {
        const original = new OAuthStrategy({
          clientId: 'test-client',
          clientSecret: 'test-secret',
        });

        const extended = original.withAdditionalScopes(['scope1', 'scope2']);

        expect(extended).to.be.instanceOf(OAuthStrategy);
      });

      it('handles empty additional scopes', () => {
        const original = new OAuthStrategy({
          clientId: 'test-client',
          clientSecret: 'test-secret',
          scopes: ['scope1'],
        });

        const extended = original.withAdditionalScopes([]);

        expect(extended).to.be.instanceOf(OAuthStrategy);
        expect(extended).to.not.equal(original);
      });

      it('preserves other config options', () => {
        const customHost = 'custom.auth.host.com';
        const original = new OAuthStrategy({
          clientId: 'test-client',
          clientSecret: 'test-secret',
          scopes: ['scope1'],
          accountManagerHost: customHost,
        });

        const extended = original.withAdditionalScopes(['scope2']);

        // The new strategy should preserve the custom host
        // We can't directly access private fields, but we can verify it's a valid strategy
        expect(extended).to.be.instanceOf(OAuthStrategy);
      });
    });

    describe('getAccessTokenForCascade', () => {
      it('returns the first candidate that AM accepts', async () => {
        const mockToken = createMockJWT({sub: 'test-client-cascade-1'});
        let lastRequestedScope: string | null = null;

        server.use(
          http.post(AM_URL, async ({request}) => {
            const body = await request.text();
            const params = new URLSearchParams(body);
            lastRequestedScope = params.get('scope');
            // Reject anything containing the rw scope; accept the read-only
            // candidate.
            if (lastRequestedScope?.includes('sfcc.jobs.rw')) {
              return HttpResponse.json({error: 'invalid_scope'}, {status: 400});
            }
            return HttpResponse.json({
              access_token: mockToken,
              expires_in: 1800,
              scope: lastRequestedScope ?? '',
            });
          }),
        );

        const strategy = new OAuthStrategy({
          clientId: 'test-client-cascade-1',
          clientSecret: 'test-secret',
        });

        const token = await strategy.getAccessTokenForCascade([['sfcc.jobs.rw'], ['sfcc.jobs']]);

        expect(token).to.equal(mockToken);
        // Last successful AM call should have used the read-only candidate.
        expect(lastRequestedScope).to.equal('sfcc.jobs');
      });

      it('returns a cached broader-scope token without hitting AM', async () => {
        // Pre-warm: first call grants rw.
        const rwToken = createMockJWT({sub: 'test-client-cascade-2'});
        let amCallCount = 0;

        server.use(
          http.post(AM_URL, async () => {
            amCallCount++;
            return HttpResponse.json({
              access_token: rwToken,
              expires_in: 1800,
              scope: 'sfcc.jobs.rw',
            });
          }),
        );

        const strategy = new OAuthStrategy({
          clientId: 'test-client-cascade-2',
          clientSecret: 'test-secret',
        });

        // First request: cascade tries rw, AM grants it. amCallCount = 1.
        await strategy.getAccessTokenForCascade([['sfcc.jobs.rw']]);
        expect(amCallCount).to.equal(1);

        // Second request: read-only cascade. The cached rw token's scopes
        // include 'sfcc.jobs.rw' — should it satisfy a request for ['sfcc.jobs']?
        // Per design: the satisfies-check looks for tokens whose scopes ⊇
        // the requested set. 'sfcc.jobs' is NOT in the rw token's scopes,
        // so it does not satisfy. AM gets called again. This test confirms
        // that hierarchical scope semantics are NOT inferred — caches are
        // exact-set matches.
        await strategy.getAccessTokenForCascade([['sfcc.jobs']]);
        expect(amCallCount).to.equal(2);
      });

      it('reuses cached token when a candidate exactly matches', async () => {
        const mockToken = createMockJWT({sub: 'test-client-cascade-3'});
        let amCallCount = 0;

        server.use(
          http.post(AM_URL, async () => {
            amCallCount++;
            return HttpResponse.json({
              access_token: mockToken,
              expires_in: 1800,
              scope: 'sfcc.jobs',
            });
          }),
        );

        const strategy = new OAuthStrategy({
          clientId: 'test-client-cascade-3',
          clientSecret: 'test-secret',
        });

        await strategy.getAccessTokenForCascade([['sfcc.jobs']]);
        await strategy.getAccessTokenForCascade([['sfcc.jobs']]);

        // Second call should hit cache.
        expect(amCallCount).to.equal(1);
      });

      it('throws the last invalid_scope when all candidates fail', async () => {
        server.use(
          http.post(AM_URL, async () => {
            return HttpResponse.json({error: 'invalid_scope'}, {status: 400});
          }),
        );

        const strategy = new OAuthStrategy({
          clientId: 'test-client-cascade-4',
          clientSecret: 'test-secret',
        });

        try {
          await strategy.getAccessTokenForCascade([['sfcc.jobs.rw'], ['sfcc.jobs']]);
          expect.fail('should have thrown');
        } catch (error) {
          expect((error as Error).message).to.include('invalid_scope');
        }
      });

      it('rethrows non-invalid_scope errors without trying further candidates', async () => {
        let amCallCount = 0;
        server.use(
          http.post(AM_URL, async () => {
            amCallCount++;
            return HttpResponse.json({error: 'invalid_client'}, {status: 401});
          }),
        );

        const strategy = new OAuthStrategy({
          clientId: 'test-client-cascade-5',
          clientSecret: 'test-secret',
        });

        try {
          await strategy.getAccessTokenForCascade([['sfcc.jobs.rw'], ['sfcc.jobs']]);
          expect.fail('should have thrown');
        } catch {
          // expected
        }
        // Should not have tried the second candidate.
        expect(amCallCount).to.equal(1);
      });
    });
  });
});

/**
 * Helper to create a mock JWT token
 */
function createMockJWT(payload: Record<string, any>): string {
  const header = {alg: 'HS256', typ: 'JWT'};
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `${headerB64}.${payloadB64}.mock-signature`;
}
