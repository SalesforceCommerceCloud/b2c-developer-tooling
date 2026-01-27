/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {
  AuthMiddlewareRegistry,
  applyAuthRequestMiddleware,
  applyAuthResponseMiddleware,
  globalAuthMiddlewareRegistry,
} from '@salesforce/b2c-tooling-sdk/auth';
import type {AuthMiddleware, AuthMiddlewareProvider} from '@salesforce/b2c-tooling-sdk/auth';
import {OAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

const AM_HOST = 'account.demandware.com';
const AM_URL = `https://${AM_HOST}/dwsso/oauth2/access_token`;

describe('auth/middleware', () => {
  describe('AuthMiddlewareRegistry', () => {
    it('register() adds providers and getProviderNames() returns them', () => {
      const registry = new AuthMiddlewareRegistry();

      registry.register({
        name: 'p1',
        getMiddleware() {
          return undefined;
        },
      });

      registry.register({
        name: 'p2',
        getMiddleware() {
          return undefined;
        },
      });

      expect(registry.size).to.equal(2);
      expect(registry.getProviderNames()).to.deep.equal(['p1', 'p2']);
    });

    it('unregister() removes an existing provider by name', () => {
      const registry = new AuthMiddlewareRegistry();

      registry.register({
        name: 'p1',
        getMiddleware() {
          return undefined;
        },
      });

      expect(registry.size).to.equal(1);
      expect(registry.unregister('p1')).to.equal(true);
      expect(registry.size).to.equal(0);
    });

    it('unregister() returns false when provider does not exist', () => {
      const registry = new AuthMiddlewareRegistry();
      registry.register({
        name: 'p1',
        getMiddleware() {
          return undefined;
        },
      });

      expect(registry.unregister('missing')).to.equal(false);
      expect(registry.size).to.equal(1);
    });

    it('getMiddleware() returns middleware in registration order and skips undefined', () => {
      const registry = new AuthMiddlewareRegistry();

      const m1: AuthMiddleware = {
        async onRequest({request}) {
          request.headers.set('x-m1', '1');
          return request;
        },
      };

      const m2: AuthMiddleware = {
        async onRequest({request}) {
          request.headers.set('x-m2', '2');
          return request;
        },
      };

      registry.register({
        name: 'skip',
        getMiddleware() {
          return undefined;
        },
      });

      registry.register({
        name: 'p1',
        getMiddleware() {
          return m1;
        },
      });

      registry.register({
        name: 'p2',
        getMiddleware() {
          return m2;
        },
      });

      const middlewares = registry.getMiddleware();
      expect(middlewares).to.have.length(2);
      expect(middlewares[0]).to.equal(m1);
      expect(middlewares[1]).to.equal(m2);
    });

    it('clear() removes all providers', () => {
      const registry = new AuthMiddlewareRegistry();
      registry.register({
        name: 'p1',
        getMiddleware() {
          return undefined;
        },
      });

      expect(registry.size).to.equal(1);
      registry.clear();
      expect(registry.size).to.equal(0);
      expect(registry.getProviderNames()).to.deep.equal([]);
    });
  });

  describe('applyAuthRequestMiddleware', () => {
    it('applies middleware in order', async () => {
      const middleware: AuthMiddleware[] = [
        {
          async onRequest({request}) {
            request.headers.set('x-first', 'first');
            return request;
          },
        },
        {
          async onRequest({request}) {
            request.headers.set('x-second', 'second');
            return request;
          },
        },
      ];

      const request = new Request('https://example.com');
      const result = await applyAuthRequestMiddleware(request, middleware);

      expect(result.headers.get('x-first')).to.equal('first');
      expect(result.headers.get('x-second')).to.equal('second');
    });

    it('skips middleware without onRequest', async () => {
      const middleware: AuthMiddleware[] = [
        {
          async onResponse() {
            return undefined;
          },
        },
        {
          async onRequest({request}) {
            request.headers.set('x-header', 'value');
            return request;
          },
        },
      ];

      const request = new Request('https://example.com');
      const result = await applyAuthRequestMiddleware(request, middleware);

      expect(result.headers.get('x-header')).to.equal('value');
    });

    it('continues if middleware returns void', async () => {
      const middleware: AuthMiddleware[] = [
        {
          async onRequest() {
            // Returns void (undefined)
          },
        },
        {
          async onRequest({request}) {
            request.headers.set('x-header', 'value');
            return request;
          },
        },
      ];

      const request = new Request('https://example.com');
      const result = await applyAuthRequestMiddleware(request, middleware);

      expect(result.headers.get('x-header')).to.equal('value');
    });
  });

  describe('applyAuthResponseMiddleware', () => {
    it('applies middleware in order', async () => {
      let order = '';
      const middleware: AuthMiddleware[] = [
        {
          async onResponse({response}) {
            order += 'first';
            return response;
          },
        },
        {
          async onResponse({response}) {
            order += '-second';
            return response;
          },
        },
      ];

      const request = new Request('https://example.com');
      const response = new Response('body');
      await applyAuthResponseMiddleware(request, response, middleware);

      expect(order).to.equal('first-second');
    });

    it('skips middleware without onResponse', async () => {
      let called = false;
      const middleware: AuthMiddleware[] = [
        {
          async onRequest() {
            return undefined;
          },
        },
        {
          async onResponse({response}) {
            called = true;
            return response;
          },
        },
      ];

      const request = new Request('https://example.com');
      const response = new Response('body');
      await applyAuthResponseMiddleware(request, response, middleware);

      expect(called).to.be.true;
    });
  });

  describe('globalAuthMiddlewareRegistry integration with OAuthStrategy', () => {
    const server = setupServer();

    before(() => {
      server.listen({onUnhandledRequest: 'error'});
    });

    afterEach(() => {
      server.resetHandlers();
      // Clear token cache between tests
      const dummy = new OAuthStrategy({clientId: 'test-client', clientSecret: 'test-secret'});
      dummy.invalidateToken();
    });

    after(() => {
      server.close();
    });

    it('applies User-Agent headers to OAuth token requests', async () => {
      let capturedUserAgent: string | null = null;
      let capturedSfdcUserAgent: string | null = null;

      server.use(
        http.post(AM_URL, ({request}) => {
          capturedUserAgent = request.headers.get('User-Agent');
          capturedSfdcUserAgent = request.headers.get('sfdc_user_agent');

          const mockToken = createMockJWT({sub: 'test-client-ua'});
          return HttpResponse.json({
            access_token: mockToken,
            expires_in: 1800,
            scope: 'sfcc.sandbox.manage',
          });
        }),
      );

      // The user-agent provider should already be registered via the module import
      // Just verify the headers are present
      const strategy = new OAuthStrategy({
        clientId: 'test-client-ua',
        clientSecret: 'test-secret',
        scopes: ['sfcc.sandbox.manage'],
      });

      await strategy.getTokenResponse();

      // User-Agent headers should be set (the exact value depends on whether
      // CLI has overridden it, but they should be present)
      expect(capturedUserAgent).to.not.be.null;
      expect(capturedSfdcUserAgent).to.not.be.null;
    });

    it('applies custom auth middleware', async () => {
      let customHeaderValue: string | null = null;

      server.use(
        http.post(AM_URL, ({request}) => {
          customHeaderValue = request.headers.get('X-Custom-Auth-Header');

          const mockToken = createMockJWT({sub: 'test-client-custom'});
          return HttpResponse.json({
            access_token: mockToken,
            expires_in: 1800,
          });
        }),
      );

      // Register custom middleware
      const customProvider: AuthMiddlewareProvider = {
        name: 'custom-test-middleware',
        getMiddleware() {
          return {
            async onRequest({request}) {
              request.headers.set('X-Custom-Auth-Header', 'custom-value');
              return request;
            },
          };
        },
      };

      globalAuthMiddlewareRegistry.register(customProvider);

      try {
        const strategy = new OAuthStrategy({
          clientId: 'test-client-custom',
          clientSecret: 'test-secret',
        });

        await strategy.getTokenResponse();

        expect(customHeaderValue).to.equal('custom-value');
      } finally {
        // Clean up
        globalAuthMiddlewareRegistry.unregister('custom-test-middleware');
      }
    });
  });
});

/**
 * Helper to create a mock JWT token
 */
function createMockJWT(payload: Record<string, unknown>): string {
  const header = {alg: 'HS256', typ: 'JWT'};
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `${headerB64}.${payloadB64}.mock-signature`;
}
