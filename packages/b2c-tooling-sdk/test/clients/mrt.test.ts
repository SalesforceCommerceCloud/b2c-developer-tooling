/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {
  createMrtClient,
  DEFAULT_MRT_ORIGIN,
  isMrtReadOnlyResponse,
  MrtMaintenanceError,
  runWithMrtReadOnlyListener,
} from '@salesforce/b2c-tooling-sdk/clients';
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

    describe('maintenance (read-only) mode', () => {
      const READ_ONLY_HEADERS = {'X-MRT-Read-Only': 'true'};

      it('returns data normally for a read served in read-only mode', async () => {
        server.use(
          http.get(`${DEFAULT_BASE_URL}/api/projects/`, () => {
            return HttpResponse.json({results: [{slug: 'p1'}]}, {headers: READ_ONLY_HEADERS});
          }),
        );

        const client = createMrtClient({}, new MockAuthStrategy());

        const {data, error} = await client.GET('/api/projects/', {});

        expect(error).to.be.undefined;
        expect(data?.results).to.have.length(1);
      });

      it('notifies the read-only listener for a read served in read-only mode', async () => {
        server.use(
          http.get(`${DEFAULT_BASE_URL}/api/projects/`, () => {
            return HttpResponse.json({results: []}, {headers: READ_ONLY_HEADERS});
          }),
        );

        const client = createMrtClient({}, new MockAuthStrategy());

        let calls = 0;
        await runWithMrtReadOnlyListener(
          () => {
            calls += 1;
          },
          async () => {
            await client.GET('/api/projects/', {});
            await client.GET('/api/projects/', {});
          },
        );

        // Fires per read served in read-only mode; the CLI collapses these to one warning.
        expect(calls).to.equal(2);
      });

      it('does not notify the read-only listener for a normal read', async () => {
        server.use(
          http.get(`${DEFAULT_BASE_URL}/api/projects/`, () => {
            return HttpResponse.json({results: []});
          }),
        );

        const client = createMrtClient({}, new MockAuthStrategy());

        let called = false;
        await runWithMrtReadOnlyListener(
          () => {
            called = true;
          },
          async () => {
            await client.GET('/api/projects/', {});
          },
        );

        expect(called).to.be.false;
      });

      it('throws MrtMaintenanceError for a rejected write in read-only mode', async () => {
        server.use(
          http.post(`${DEFAULT_BASE_URL}/api/projects/:project_slug/builds/`, () => {
            return HttpResponse.json(
              {detail: 'Service is in READ_ONLY mode'},
              {status: 503, headers: READ_ONLY_HEADERS},
            );
          }),
        );

        const client = createMrtClient({}, new MockAuthStrategy());

        try {
          await client.POST('/api/projects/{project_slug}/builds/', {
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
          expect.fail('expected MrtMaintenanceError to be thrown');
        } catch (err) {
          expect(err).to.be.instanceOf(MrtMaintenanceError);
          expect((err as MrtMaintenanceError).status).to.equal(503);
          expect((err as MrtMaintenanceError).detail).to.equal('Service is in READ_ONLY mode');
        }
      });

      it('does not throw for a successful write in read-only mode (superuser bypass)', async () => {
        server.use(
          http.post(`${DEFAULT_BASE_URL}/api/projects/:project_slug/builds/`, () => {
            return HttpResponse.json(
              {bundle_id: 7, message: 'ok', url: 'https://x', bundle_preview_url: null, warnings: []},
              {headers: READ_ONLY_HEADERS},
            );
          }),
        );

        const client = createMrtClient({}, new MockAuthStrategy());

        const {data, error} = await client.POST('/api/projects/{project_slug}/builds/', {
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

        expect(error).to.be.undefined;
        expect(data).to.have.property('bundle_id', 7);
      });

      it('does not throw MrtMaintenanceError for a write failure without the read-only header', async () => {
        server.use(
          http.post(`${DEFAULT_BASE_URL}/api/projects/:project_slug/builds/`, () => {
            return HttpResponse.json({detail: 'Service unavailable'}, {status: 503});
          }),
        );

        const client = createMrtClient({}, new MockAuthStrategy());

        const {error} = await client.POST('/api/projects/{project_slug}/builds/', {
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

        // Normal error path — no typed maintenance error thrown.
        expect(error).to.deep.equal({detail: 'Service unavailable'});
      });

      it('does not throw MrtMaintenanceError for a non-503 write failure that carries the header', async () => {
        // During maintenance the read-only header rides on every response, including
        // unrelated failures. Only a 503 is a read-only rejection; a 403 must flow
        // through as a normal error rather than being masked as maintenance.
        server.use(
          http.post(`${DEFAULT_BASE_URL}/api/projects/:project_slug/builds/`, () => {
            return HttpResponse.json({detail: 'Forbidden'}, {status: 403, headers: READ_ONLY_HEADERS});
          }),
        );

        const client = createMrtClient({}, new MockAuthStrategy());

        const {error} = await client.POST('/api/projects/{project_slug}/builds/', {
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

        expect(error).to.deep.equal({detail: 'Forbidden'});
      });
    });
  });

  describe('isMrtReadOnlyResponse', () => {
    it('returns true when the read-only header is "true"', () => {
      const response = new Response(null, {headers: {'X-MRT-Read-Only': 'true'}});
      expect(isMrtReadOnlyResponse(response)).to.be.true;
    });

    it('is case- and whitespace-insensitive for the header value', () => {
      const response = new Response(null, {headers: {'X-MRT-Read-Only': '  TRUE '}});
      expect(isMrtReadOnlyResponse(response)).to.be.true;
    });

    it('returns false when the header is absent', () => {
      expect(isMrtReadOnlyResponse(new Response(null))).to.be.false;
    });

    it('returns false when the header is "false"', () => {
      const response = new Response(null, {headers: {'X-MRT-Read-Only': 'false'}});
      expect(isMrtReadOnlyResponse(response)).to.be.false;
    });
  });
});
