/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {MrtClient, type MrtProject} from '@salesforce/b2c-tooling-sdk/platform';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const BASE_URL = 'https://api.commercecloud.salesforce.com/mrt';

describe('platform/mrt', () => {
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

  describe('MrtClient', () => {
    const project: MrtProject = {
      org: 'test-org',
      project: 'test-project',
      env: 'production',
    };

    it('creates client with project and auth', () => {
      const auth = new MockAuthStrategy();
      const client = new MrtClient(project, auth);
      expect(client).to.exist;
      expect(client.project).to.deep.equal(project);
      expect(client.auth).to.equal(auth);
    });

    it('request normalizes path with leading slash', async () => {
      server.use(
        http.get(`${BASE_URL}/api/projects`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json({results: []});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = new MrtClient(project, auth);
      const response = await client.request('/api/projects');
      expect(response).to.exist;
      expect(response.ok).to.be.true;
    });

    it('request handles path without leading slash', async () => {
      server.use(
        http.get(`${BASE_URL}/api/projects`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json({results: []});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = new MrtClient(project, auth);
      const response = await client.request('api/projects');
      expect(response).to.exist;
      expect(response.ok).to.be.true;
    });

    it('request passes through RequestInit options', async () => {
      let receivedMethod: string | null = null;
      let receivedBody: string | null = null;

      server.use(
        http.post(`${BASE_URL}/api/builds`, async ({request}) => {
          receivedMethod = request.method;
          receivedBody = await request.text();
          return HttpResponse.json({id: 'build-123'});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = new MrtClient(project, auth);
      const response = await client.request('/api/builds', {
        method: 'POST',
        body: JSON.stringify({message: 'test'}),
        headers: {'Content-Type': 'application/json'},
      });

      expect(response).to.exist;
      expect(response.ok).to.be.true;
      expect(receivedMethod).to.equal('POST');
      expect(receivedBody).to.equal('{"message":"test"}');
    });

    it('request handles GET requests', async () => {
      server.use(
        http.get(`${BASE_URL}/api/projects/test-project`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json({slug: 'test-project'});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = new MrtClient(project, auth);
      const response = await client.request('/api/projects/test-project');
      const data = await response.json();
      expect(response.ok).to.be.true;
      expect(data).to.deep.equal({slug: 'test-project'});
    });

    it('request handles error responses', async () => {
      server.use(
        http.get(`${BASE_URL}/api/projects/nonexistent`, () => {
          return HttpResponse.json({detail: 'Not found'}, {status: 404});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = new MrtClient(project, auth);
      const response = await client.request('/api/projects/nonexistent');
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

      const auth = new MockAuthStrategy();
      const client = new MrtClient(project, auth);
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

      const auth = new MockAuthStrategy();
      const client = new MrtClient(project, auth);
      const response = await client.request('');
      expect(response).to.exist;
      expect(response.ok).to.be.true;
    });

    it('request handles path with query parameters', async () => {
      server.use(
        http.get(`${BASE_URL}/api/projects`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('env')).to.equal('production');
          return HttpResponse.json({results: []});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = new MrtClient(project, auth);
      const response = await client.request('/api/projects?env=production');
      expect(response).to.exist;
      expect(response.ok).to.be.true;
    });
  });
});
