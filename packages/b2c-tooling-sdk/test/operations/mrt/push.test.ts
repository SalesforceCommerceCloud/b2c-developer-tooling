/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '@salesforce/b2c-tooling-sdk/clients';
import {uploadBundle, listBundles, deleteBundle, bulkDeleteBundles} from '@salesforce/b2c-tooling-sdk/operations/mrt';
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
      expect(result.warnings).to.deep.equal([]);

      expect(receivedBody).to.deep.include({
        message: 'Test bundle',
        encoding: 'base64',
        data: 'dGVzdC1kYXRh',
      });
    });

    it('returns warnings from the no-target upload response', async () => {
      const warning = 'x86 support ends January 31, 2027. Switch to ARM in environment settings to avoid disruptions';

      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/builds/`, () => {
          return HttpResponse.json({
            bundle_id: 123,
            message: 'Bundle created',
            url: 'https://runtime.commercecloud.com/...',
            bundle_preview_url: null,
            warnings: [warning],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      const result = await uploadBundle(client, 'my-project', testBundle);

      expect(result.warnings).to.deep.equal([warning]);
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
      expect(result.warnings).to.deep.equal([]);
      expect(targetSlug).to.equal('staging');

      expect(receivedBody).to.deep.include({
        message: 'Test bundle',
        ssr_only: ['ssr.js'],
        ssr_shared: ['static/index.html', 'static/app.js'],
      });
    });

    it('returns warnings from the with-target deploy response', async () => {
      const warning = 'x86 support ends January 31, 2027. Switch to ARM in environment settings to avoid disruptions';

      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/builds/:targetSlug/`, () => {
          return HttpResponse.json({
            bundle_id: 456,
            message: 'Bundle created and deployed',
            url: 'https://runtime.commercecloud.com/...',
            bundle_preview_url: null,
            warnings: [warning],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      const result = await uploadBundle(client, 'my-project', testBundle, 'staging');

      expect(result.warnings).to.deep.equal([warning]);
    });

    it('defaults warnings to [] when the response omits the field', async () => {
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/builds/:targetSlug/`, () => {
          return HttpResponse.json({
            bundle_id: 789,
            message: 'Bundle created and deployed',
            url: 'https://runtime.commercecloud.com/...',
            bundle_preview_url: null,
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      const result = await uploadBundle(client, 'my-project', testBundle, 'staging');

      expect(result.warnings).to.deep.equal([]);
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

      const result = await listBundles({projectSlug: 'my-project'}, auth);

      expect(result.bundles).to.have.length(2);
      expect(result.bundles[0]).to.deep.include({id: 123, message: 'Bundle 1'});
      expect(result.bundles[1]).to.deep.include({id: 124, message: 'Bundle 2'});
      expect(result.count).to.equal(2);
    });

    it('passes pagination options', async () => {
      let queryParams: URLSearchParams | undefined;

      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/bundles/`, ({request}) => {
          queryParams = new URL(request.url).searchParams;
          return HttpResponse.json({count: 0, results: []});
        }),
      );

      const auth = new MockAuthStrategy();

      await listBundles({projectSlug: 'my-project', limit: 10, offset: 20}, auth);

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

      const result = await listBundles({projectSlug: 'my-project'}, auth);

      expect(result.bundles).to.have.length(0);
      expect(result.count).to.equal(0);
    });

    it('throws error on API failure', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/bundles/`, () => {
          return HttpResponse.json({detail: 'Unauthorized'}, {status: 401});
        }),
      );

      const auth = new MockAuthStrategy();

      try {
        await listBundles({projectSlug: 'my-project'}, auth);
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to list bundles');
      }
    });
  });

  describe('deleteBundle', () => {
    it('should DELETE the bundle and resolve on 202', async () => {
      let receivedPath: string | undefined;
      server.use(
        http.delete(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/bundles/:bundleId/`, ({params}) => {
          receivedPath = `${params.projectSlug}/${params.bundleId}`;
          return new HttpResponse(null, {status: 204});
        }),
      );

      const auth = new MockAuthStrategy();
      await deleteBundle({projectSlug: 'my-project', bundleId: 42}, auth);

      expect(receivedPath).to.equal('my-project/42');
    });

    it('should throw on error response', async () => {
      server.use(
        http.delete(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/bundles/:bundleId/`, () =>
          HttpResponse.json({message: 'Bundle in use'}, {status: 403}),
        ),
      );

      const auth = new MockAuthStrategy();
      try {
        await deleteBundle({projectSlug: 'my-project', bundleId: 42}, auth);
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('delete bundle');
      }
    });
  });

  describe('bulkDeleteBundles', () => {
    it('should send all bundle IDs and return queued/rejected lists', async () => {
      let receivedBody: {bundle_ids?: number[]} | undefined;
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/bundles/bulk-delete/`, async ({request}) => {
          receivedBody = (await request.json()) as {bundle_ids?: number[]};
          return HttpResponse.json(
            {
              bundles_queued_for_cleanup: [1, 3],
              rejected_bundles: [{bundle_id: 2, errors: 'Bundle in use'}],
            },
            {status: 202},
          );
        }),
      );

      const auth = new MockAuthStrategy();
      const result = await bulkDeleteBundles({projectSlug: 'my-project', bundleIds: [1, 2, 3]}, auth);

      expect(receivedBody?.bundle_ids).to.deep.equal([1, 2, 3]);
      expect(result.queued).to.deep.equal([1, 3]);
      expect(result.rejected).to.have.lengthOf(1);
      expect(result.rejected[0]).to.deep.equal({bundleId: 2, reason: 'Bundle in use'});
    });
  });
});
