/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '@salesforce/b2c-tooling-sdk/clients';
import {uploadBundle, listBundles} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import type {Bundle} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const DEFAULT_BASE_URL = DEFAULT_MRT_ORIGIN;

describe('operations/mrt/push', () => {
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

  describe('uploadBundle', () => {
    const testBundle: Bundle = {
      message: 'Test bundle',
      encoding: 'base64',
      data: 'dGVzdC1kYXRh', // base64 encoded "test-data"
      ssr_parameters: {SSRFunctionNodeVersion: '22.x'},
      ssr_only: ['ssr.js'],
      ssr_shared: ['static/index.html', 'static/app.js'],
    };

    it('uploads bundle without deployment', async () => {
      let receivedBody: unknown;

      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/builds/`, async ({request, params}) => {
          receivedBody = await request.json();
          expect(params.projectSlug).to.equal('my-project');
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

      const result = await uploadBundle(client, 'my-project', testBundle);

      expect(result.bundleId).to.equal(123);
      expect(result.projectSlug).to.equal('my-project');
      expect(result.deployed).to.be.false;
      expect(result.target).to.be.undefined;
      expect(result.message).to.equal('Test bundle');

      expect(receivedBody).to.deep.include({
        message: 'Test bundle',
        encoding: 'base64',
        data: 'dGVzdC1kYXRh',
      });
    });

    it('uploads bundle with deployment to target', async () => {
      let receivedBody: unknown;
      let targetSlug: string | undefined;

      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/builds/:targetSlug/`, async ({request, params}) => {
          receivedBody = await request.json();
          targetSlug = params.targetSlug as string;
          return HttpResponse.json({
            bundle_id: 456,
            message: 'Bundle created and deployed',
            url: 'https://runtime.commercecloud.com/...',
            bundle_preview_url: 'https://preview.staging.mobify.com/...',
            warnings: [],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      const result = await uploadBundle(client, 'my-project', testBundle, 'staging');

      expect(result.bundleId).to.equal(456);
      expect(result.projectSlug).to.equal('my-project');
      expect(result.deployed).to.be.true;
      expect(result.target).to.equal('staging');
      expect(targetSlug).to.equal('staging');

      expect(receivedBody).to.deep.include({
        message: 'Test bundle',
        ssr_only: ['ssr.js'],
        ssr_shared: ['static/index.html', 'static/app.js'],
      });
    });

    it('throws error on upload failure without target', async () => {
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/builds/`, () => {
          return HttpResponse.json({detail: 'Project not found'}, {status: 404});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      try {
        await uploadBundle(client, 'nonexistent', testBundle);
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to push bundle');
      }
    });

    it('throws error on upload failure with target', async () => {
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/builds/:targetSlug/`, () => {
          return HttpResponse.json({detail: 'Target not found'}, {status: 404});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      try {
        await uploadBundle(client, 'my-project', testBundle, 'invalid-target');
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to push bundle');
      }
    });
  });

  describe('listBundles', () => {
    it('lists bundles for a project', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/bundles/`, ({params}) => {
          expect(params.projectSlug).to.equal('my-project');
          return HttpResponse.json({
            count: 2,
            next: null,
            previous: null,
            results: [
              {
                id: 123,
                message: 'Bundle 1',
                created_at: '2025-01-01T00:00:00Z',
                created_by: 'user@example.com',
              },
              {
                id: 124,
                message: 'Bundle 2',
                created_at: '2025-01-02T00:00:00Z',
                created_by: 'user@example.com',
              },
            ],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      const bundles = await listBundles(client, 'my-project');

      expect(bundles).to.have.length(2);
      expect(bundles[0]).to.deep.include({id: 123, message: 'Bundle 1'});
      expect(bundles[1]).to.deep.include({id: 124, message: 'Bundle 2'});
    });

    it('passes pagination options', async () => {
      let queryParams: URLSearchParams | undefined;

      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/bundles/`, ({request}) => {
          queryParams = new URL(request.url).searchParams;
          return HttpResponse.json({results: []});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      await listBundles(client, 'my-project', {limit: 10, offset: 20});

      expect(queryParams?.get('limit')).to.equal('10');
      expect(queryParams?.get('offset')).to.equal('20');
    });

    it('returns empty array when no bundles', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/bundles/`, () => {
          return HttpResponse.json({
            count: 0,
            results: [],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      const bundles = await listBundles(client, 'my-project');

      expect(bundles).to.have.length(0);
    });

    it('throws error on API failure', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/bundles/`, () => {
          return HttpResponse.json({detail: 'Unauthorized'}, {status: 401});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      try {
        await listBundles(client, 'my-project');
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to list bundles');
      }
    });
  });
});
