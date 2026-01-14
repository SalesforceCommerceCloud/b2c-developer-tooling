/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {OdsClient, type OdsConfig} from '@salesforce/b2c-tooling-sdk/platform';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const BASE_URL = 'https://api.commercecloud.salesforce.com/ods';

describe('platform/ods', () => {
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

  describe('OdsClient', () => {
    it('creates client with config and auth', () => {
      const config: OdsConfig = {region: 'us'};
      const auth = new MockAuthStrategy();
      const client = new OdsClient(config, auth);
      expect(client).to.exist;
      expect(client.config).to.deep.equal(config);
      expect(client.auth).to.equal(auth);
    });

    it('creates client with empty config', () => {
      const config: OdsConfig = {};
      const auth = new MockAuthStrategy();
      const client = new OdsClient(config, auth);
      expect(client).to.exist;
      expect(client.config).to.deep.equal(config);
    });

    it('creates client with region in config', () => {
      const config: OdsConfig = {region: 'eu'};
      const auth = new MockAuthStrategy();
      const client = new OdsClient(config, auth);
      expect(client).to.exist;
      expect(client.config.region).to.equal('eu');
    });

    it('request normalizes path with leading slash', async () => {
      server.use(
        http.get(`${BASE_URL}/api/sandboxes`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json({data: []});
        }),
      );

      const config: OdsConfig = {};
      const auth = new MockAuthStrategy();
      const client = new OdsClient(config, auth);
      const response = await client.request('/api/sandboxes');
      expect(response).to.exist;
      expect(response.ok).to.be.true;
    });

    it('request handles path without leading slash', async () => {
      server.use(
        http.get(`${BASE_URL}/api/sandboxes`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json({data: []});
        }),
      );

      const config: OdsConfig = {};
      const auth = new MockAuthStrategy();
      const client = new OdsClient(config, auth);
      const response = await client.request('api/sandboxes');
      expect(response).to.exist;
      expect(response.ok).to.be.true;
    });

    it('request passes through RequestInit options', async () => {
      let receivedMethod: string | null = null;
      let receivedBody: string | null = null;

      server.use(
        http.post(`${BASE_URL}/api/sandboxes`, async ({request}) => {
          receivedMethod = request.method;
          receivedBody = await request.text();
          return HttpResponse.json({data: {id: 'sb-123'}});
        }),
      );

      const config: OdsConfig = {};
      const auth = new MockAuthStrategy();
      const client = new OdsClient(config, auth);
      const response = await client.request('/api/sandboxes', {
        method: 'POST',
        body: JSON.stringify({realm: 'zzzv'}),
        headers: {'Content-Type': 'application/json'},
      });

      expect(response).to.exist;
      expect(response.ok).to.be.true;
      expect(receivedMethod).to.equal('POST');
      expect(receivedBody).to.equal('{"realm":"zzzv"}');
    });

    it('request handles GET requests', async () => {
      server.use(
        http.get(`${BASE_URL}/api/sandboxes/sb-123`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json({data: {id: 'sb-123', state: 'started'}});
        }),
      );

      const config: OdsConfig = {};
      const auth = new MockAuthStrategy();
      const client = new OdsClient(config, auth);
      const response = await client.request('/api/sandboxes/sb-123');
      const data = await response.json();
      expect(response.ok).to.be.true;
      expect(data).to.deep.equal({data: {id: 'sb-123', state: 'started'}});
    });

    it('request handles error responses', async () => {
      server.use(
        http.get(`${BASE_URL}/api/sandboxes/nonexistent`, () => {
          return HttpResponse.json({error: {message: 'Not found'}}, {status: 404});
        }),
      );

      const config: OdsConfig = {};
      const auth = new MockAuthStrategy();
      const client = new OdsClient(config, auth);
      const response = await client.request('/api/sandboxes/nonexistent');
      expect(response.ok).to.be.false;
      expect(response.status).to.equal(404);
    });

    it('request uses auth strategy fetch method', async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get(`${BASE_URL}/api/test`, ({request}) => {
          requestUrl = request.url;
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json({success: true});
        }),
      );

      const config: OdsConfig = {};
      const auth = new MockAuthStrategy();
      const client = new OdsClient(config, auth);
      const response = await client.request('/api/test');
      expect(response).to.exist;
      expect(requestUrl).to.equal(`${BASE_URL}/api/test`);
    });

    it('request handles empty path', async () => {
      server.use(
        http.get(`${BASE_URL}`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json({status: 'ok'});
        }),
      );

      const config: OdsConfig = {};
      const auth = new MockAuthStrategy();
      const client = new OdsClient(config, auth);
      const response = await client.request('');
      expect(response).to.exist;
      expect(response.ok).to.be.true;
    });

    it('request handles path with query parameters', async () => {
      server.use(
        http.get(`${BASE_URL}/api/sandboxes`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('include_deleted')).to.equal('true');
          return HttpResponse.json({data: []});
        }),
      );

      const config: OdsConfig = {};
      const auth = new MockAuthStrategy();
      const client = new OdsClient(config, auth);
      const response = await client.request('/api/sandboxes?include_deleted=true');
      expect(response).to.exist;
      expect(response.ok).to.be.true;
    });

    it('request handles DELETE requests', async () => {
      server.use(
        http.delete(`${BASE_URL}/api/sandboxes/sb-123`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json({data: {id: 'op-123', status: 'deleting'}});
        }),
      );

      const config: OdsConfig = {};
      const auth = new MockAuthStrategy();
      const client = new OdsClient(config, auth);
      const response = await client.request('/api/sandboxes/sb-123', {method: 'DELETE'});
      expect(response).to.exist;
      expect(response.ok).to.be.true;
    });

    it('request handles PUT requests', async () => {
      let receivedBody: string | null = null;

      server.use(
        http.put(`${BASE_URL}/api/sandboxes/sb-123`, async ({request}) => {
          receivedBody = await request.text();
          return HttpResponse.json({data: {id: 'sb-123', updated: true}});
        }),
      );

      const config: OdsConfig = {};
      const auth = new MockAuthStrategy();
      const client = new OdsClient(config, auth);
      const response = await client.request('/api/sandboxes/sb-123', {
        method: 'PUT',
        body: JSON.stringify({ttl: 48}),
        headers: {'Content-Type': 'application/json'},
      });

      expect(response).to.exist;
      expect(response.ok).to.be.true;
      expect(receivedBody).to.equal('{"ttl":48}');
    });
  });
});
