/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '@salesforce/b2c-tooling-sdk/clients';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const DEFAULT_BASE_URL = DEFAULT_MRT_ORIGIN;

describe('clients/mrt', () => {
  describe('createMrtClient', () => {
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

    it('creates a client with default origin', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json({results: []});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      const {data, error} = await client.GET('/api/projects/', {});

      expect(error).to.be.undefined;
      expect(data).to.deep.equal({results: []});
    });

    it('creates a client with custom origin', async () => {
      const customOrigin = 'https://custom.mobify.com';

      server.use(
        http.get(`${customOrigin}/api/projects/`, () => {
          return HttpResponse.json({results: [{slug: 'test-project'}]});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({origin: customOrigin}, auth);

      const {data} = await client.GET('/api/projects/', {});

      expect(data?.results).to.have.length(1);
    });

    it('normalizes origin without protocol', async () => {
      server.use(
        http.get('https://custom.mobify.com/api/projects/', () => {
          return HttpResponse.json({results: []});
        }),
      );

      const auth = new MockAuthStrategy();
      // Origin without https:// prefix
      const client = createMrtClient({origin: 'custom.mobify.com'}, auth);

      const {error} = await client.GET('/api/projects/', {});

      expect(error).to.be.undefined;
    });

    it('makes authenticated requests with path parameters', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:project_slug/`, ({params}) => {
          return HttpResponse.json({
            slug: params.project_slug,
            name: 'Test Project',
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      const {data} = await client.GET('/api/projects/{project_slug}/', {
        params: {path: {project_slug: 'my-project'}},
      });

      expect(data?.slug).to.equal('my-project');
    });

    it('handles POST requests with body', async () => {
      let receivedBody: unknown;

      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:project_slug/builds/`, async ({request}) => {
          receivedBody = await request.json();
          return HttpResponse.json({
            bundle_id: 123,
            message: 'Bundle created',
            url: 'https://runtime.commercecloud.com/...',
            bundle_preview_url: null,
            warnings: [],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      const {data} = await client.POST('/api/projects/{project_slug}/builds/', {
        params: {path: {project_slug: 'my-project'}},
        body: {
          message: 'Test bundle',
          encoding: 'base64',
          data: 'dGVzdA==',
          ssr_parameters: {},
          ssr_only: ['ssr.js'],
          ssr_shared: ['shared.js'],
        },
      });

      expect(receivedBody).to.deep.include({
        message: 'Test bundle',
        encoding: 'base64',
      });
      expect(data).to.have.property('bundle_id');
    });

    it('handles API errors', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:project_slug/`, () => {
          return HttpResponse.json({detail: 'Project not found'}, {status: 404});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      const {data, error} = await client.GET('/api/projects/{project_slug}/', {
        params: {path: {project_slug: 'nonexistent'}},
      });

      expect(data).to.be.undefined;
      expect(error).to.deep.equal({detail: 'Project not found'});
    });
  });
});
