/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {
  createOdsClient,
  createClientTypeMiddleware,
  CLIENT_TYPE_HEADER,
  CLI_TYPE_VALUE,
} from '../../src/clients/ods.js';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

describe('ODS X-Client-Type', () => {
  describe('ods.ts client-type constants', () => {
    it('CLIENT_TYPE_HEADER', () => {
      expect(CLIENT_TYPE_HEADER).to.equal('X-Client-Type');
    });

    it('CLI_TYPE_VALUE', () => {
      expect(CLI_TYPE_VALUE).to.equal('B2C-CLI');
    });
  });

  describe('createClientTypeMiddleware', () => {
    it('adds X-Client-Type header', async () => {
      const middleware = createClientTypeMiddleware();
      if (!middleware.onRequest) {
        throw new Error('Expected onRequest');
      }
      const request = new Request('https://example.com/api/v1/sandboxes', {method: 'GET'});
      const modified = await middleware.onRequest({request} as Parameters<typeof middleware.onRequest>[0]);
      if (!modified || !(modified instanceof Request)) {
        throw new Error('Expected Request');
      }
      expect(modified.headers.get(CLIENT_TYPE_HEADER)).to.equal(CLI_TYPE_VALUE);
    });

    it('preserves existing headers', async () => {
      const middleware = createClientTypeMiddleware();
      if (!middleware.onRequest) {
        throw new Error('Expected onRequest');
      }
      const request = new Request('https://example.com/api/v1/sandboxes', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      });
      const modified = await middleware.onRequest({request} as Parameters<typeof middleware.onRequest>[0]);
      if (!modified || !(modified instanceof Request)) {
        throw new Error('Expected Request');
      }
      expect(modified.headers.get('Authorization')).to.equal('Bearer test-token');
      expect(modified.headers.get('Content-Type')).to.equal('application/json');
      expect(modified.headers.get(CLIENT_TYPE_HEADER)).to.equal(CLI_TYPE_VALUE);
    });
  });

  describe('createOdsClient', () => {
    const server = setupServer();
    const TEST_HOST = 'admin.test.dx.commercecloud.salesforce.com';
    const BASE_URL = `https://${TEST_HOST}/api/v1`;

    before(() => {
      server.listen({onUnhandledRequest: 'error'});
    });

    afterEach(() => {
      server.resetHandlers();
    });

    after(() => {
      server.close();
    });

    it('sends X-Client-Type on ODS requests', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.get(`${BASE_URL}/sandboxes`, ({request}) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({data: []});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createOdsClient({host: TEST_HOST}, auth);

      const {data, error} = await client.GET('/sandboxes', {});

      expect(error).to.be.undefined;
      expect(data?.data).to.be.an('array');
      expect(capturedHeaders?.get(CLIENT_TYPE_HEADER)).to.equal(CLI_TYPE_VALUE);
    });

    it('sends X-Client-Type for GET /me, POST /sandboxes, etc.', async () => {
      const capturedRequests: Array<{method: string; headers: Headers}> = [];

      server.use(
        http.get(`${BASE_URL}/sandboxes`, ({request}) => {
          capturedRequests.push({method: 'GET', headers: request.headers});
          return HttpResponse.json({data: []});
        }),
      );

      server.use(
        http.get(`${BASE_URL}/me`, ({request}) => {
          capturedRequests.push({method: 'GET', headers: request.headers});
          return HttpResponse.json({data: {user: {name: 'Test User'}}});
        }),
      );

      server.use(
        http.post(`${BASE_URL}/sandboxes`, async ({request}) => {
          capturedRequests.push({method: 'POST', headers: request.headers});
          return HttpResponse.json({data: {id: 'new-sandbox'}});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createOdsClient({host: TEST_HOST}, auth);

      await client.GET('/sandboxes', {});
      await client.GET('/me', {});
      await client.POST('/sandboxes', {
        body: {realm: 'test', ttl: 24, resourceProfile: 'medium', analyticsEnabled: true},
      });

      expect(capturedRequests).to.have.lengthOf(3);
      for (const req of capturedRequests) {
        expect(req.headers.get(CLIENT_TYPE_HEADER)).to.equal(
          CLI_TYPE_VALUE,
          `Expected ${req.method} request to have ${CLIENT_TYPE_HEADER} header`,
        );
      }
    });

    it('works with extraParams headers', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.get(`${BASE_URL}/sandboxes`, ({request}) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({data: []});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createOdsClient(
        {
          host: TEST_HOST,
          extraParams: {
            headers: {
              'X-Custom-Header': 'custom-value',
            },
          },
        },
        auth,
      );

      await client.GET('/sandboxes', {});

      expect(capturedHeaders?.get(CLIENT_TYPE_HEADER)).to.equal(CLI_TYPE_VALUE);
      expect(capturedHeaders?.get('X-Custom-Header')).to.equal('custom-value');
    });
  });
});
