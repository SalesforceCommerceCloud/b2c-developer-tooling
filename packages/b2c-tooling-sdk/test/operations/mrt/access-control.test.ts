/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {DEFAULT_MRT_ORIGIN} from '@salesforce/b2c-tooling-sdk/clients';
import {
  listAccessControlHeaders,
  createAccessControlHeader,
  getAccessControlHeader,
  deleteAccessControlHeader,
  getAccessControlHeadersScapi,
  createAccessControlHeaderScapi,
  getAccessControlHeaderScapi,
  deleteAccessControlHeaderScapi,
  listAccessControlHeadersWithBackend,
  createAccessControlHeaderWithBackend,
  getAccessControlHeaderWithBackend,
  deleteAccessControlHeaderWithBackend,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import type {ScapiMrtConnection} from '../../../src/operations/mrt/mrt-backend.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const DEFAULT_BASE_URL = DEFAULT_MRT_ORIGIN;

const SHORT_CODE = 'kv7kzm78';
const TENANT_ID = 'zzxy_prd';
const STOREFRONT_ID = 'my-project';
const ENVIRONMENT_ID = 'staging';
const HEADER_ID = 'ff832a9e-0e55-11ef-8f23-0242ac110002';
const SCAPI_BASE = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/storefront/environments/v1`;
const SCAPI_HEADERS = `${SCAPI_BASE}/organizations/:organizationId/storefronts/:storefrontId/environments/:environmentId/access-control-headers`;
const SCAPI_HEADER = `${SCAPI_HEADERS}/:accessControlHeaderId`;
const LEGACY_HEADERS = `${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/access-control-header/`;
const LEGACY_HEADER = `${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/access-control-header/:id/`;

function scapiConn(): ScapiMrtConnection {
  return {shortCode: SHORT_CODE, tenantId: TENANT_ID, auth: new MockAuthStrategy()};
}

describe('operations/mrt/access-control', () => {
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

  // -------------------------------------------------------------------------
  // Legacy MRT operations
  // -------------------------------------------------------------------------

  describe('listAccessControlHeaders', () => {
    it('lists access control headers', async () => {
      server.use(
        http.get(LEGACY_HEADERS, () => {
          return HttpResponse.json({
            count: 1,
            next: null,
            previous: null,
            results: [
              {
                id: HEADER_ID,
                value: '****3456',
                user_email: 'dev@example.com',
                created_at: '2026-01-01T00:00:00Z',
                publishing_status: 1,
                publishing_status_description: 'published',
              },
            ],
          });
        }),
      );

      const result = await listAccessControlHeaders(
        {projectSlug: STOREFRONT_ID, targetSlug: ENVIRONMENT_ID},
        new MockAuthStrategy(),
      );

      expect(result.count).to.equal(1);
      expect(result.headers).to.have.length(1);
      expect(result.headers[0].id).to.equal(HEADER_ID);
      expect(result.headers[0].value).to.equal('****3456');
    });

    it('throws error on API failure', async () => {
      server.use(
        http.get(LEGACY_HEADERS, () => {
          return HttpResponse.json({detail: 'Project not found'}, {status: 404});
        }),
      );

      try {
        await listAccessControlHeaders({projectSlug: 'nope', targetSlug: ENVIRONMENT_ID}, new MockAuthStrategy());
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to list access control headers');
      }
    });
  });

  describe('createAccessControlHeader', () => {
    it('creates an access control header', async () => {
      let receivedBody: unknown;
      server.use(
        http.post(LEGACY_HEADERS, async ({request}) => {
          receivedBody = await request.json();
          return HttpResponse.json({id: HEADER_ID, value: '****3456'}, {status: 201});
        }),
      );

      const header = await createAccessControlHeader(
        {projectSlug: STOREFRONT_ID, targetSlug: ENVIRONMENT_ID, value: 'my-secret-header'},
        new MockAuthStrategy(),
      );

      expect(receivedBody).to.deep.equal({value: 'my-secret-header'});
      expect(header.id).to.equal(HEADER_ID);
    });

    it('throws error on API failure', async () => {
      server.use(
        http.post(LEGACY_HEADERS, () => {
          return HttpResponse.json({detail: 'Invalid'}, {status: 400});
        }),
      );

      try {
        await createAccessControlHeader(
          {projectSlug: STOREFRONT_ID, targetSlug: ENVIRONMENT_ID, value: 'x'},
          new MockAuthStrategy(),
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to create access control header');
      }
    });
  });

  describe('getAccessControlHeader', () => {
    it('gets an access control header by id', async () => {
      server.use(
        http.get(LEGACY_HEADER, ({params}) => {
          expect(params.id).to.equal(HEADER_ID);
          return HttpResponse.json({id: HEADER_ID, value: '****3456'});
        }),
      );

      const header = await getAccessControlHeader(
        {projectSlug: STOREFRONT_ID, targetSlug: ENVIRONMENT_ID, headerId: HEADER_ID},
        new MockAuthStrategy(),
      );

      expect(header.id).to.equal(HEADER_ID);
    });

    it('throws error on API failure', async () => {
      server.use(
        http.get(LEGACY_HEADER, () => {
          return HttpResponse.json({detail: 'Not found'}, {status: 404});
        }),
      );

      try {
        await getAccessControlHeader(
          {projectSlug: STOREFRONT_ID, targetSlug: ENVIRONMENT_ID, headerId: HEADER_ID},
          new MockAuthStrategy(),
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to get access control header');
      }
    });
  });

  describe('deleteAccessControlHeader', () => {
    it('deletes an access control header by id', async () => {
      let called = false;
      server.use(
        http.delete(LEGACY_HEADER, ({params}) => {
          called = true;
          expect(params.id).to.equal(HEADER_ID);
          return new HttpResponse(null, {status: 204});
        }),
      );

      await deleteAccessControlHeader(
        {projectSlug: STOREFRONT_ID, targetSlug: ENVIRONMENT_ID, headerId: HEADER_ID},
        new MockAuthStrategy(),
      );

      expect(called).to.equal(true);
    });

    it('throws error on API failure', async () => {
      server.use(
        http.delete(LEGACY_HEADER, () => {
          return HttpResponse.json({detail: 'Not found'}, {status: 404});
        }),
      );

      try {
        await deleteAccessControlHeader(
          {projectSlug: STOREFRONT_ID, targetSlug: ENVIRONMENT_ID, headerId: HEADER_ID},
          new MockAuthStrategy(),
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to delete access control header');
      }
    });
  });

  // -------------------------------------------------------------------------
  // SCAPI MRT operations
  // -------------------------------------------------------------------------

  describe('getAccessControlHeadersScapi', () => {
    it('maps the SCAPI envelope into normalized views with masked values', async () => {
      server.use(
        http.get(SCAPI_HEADERS, ({params, request}) => {
          expect(params.organizationId).to.equal('f_ecom_zzxy_prd');
          expect(params.storefrontId).to.equal(STOREFRONT_ID);
          expect(params.environmentId).to.equal(ENVIRONMENT_ID);
          const url = new URL(request.url);
          expect(url.searchParams.get('limit')).to.equal('10');
          expect(url.searchParams.get('offset')).to.equal('5');
          return HttpResponse.json({
            limit: 10,
            offset: 5,
            total: 1,
            data: [
              {
                id: HEADER_ID,
                value: '****3456',
                createdBy: 'dev@example.com',
                creationDate: '2026-04-08T21:47:28.188965Z',
                publishingStatus: 'completed',
              },
            ],
          });
        }),
      );

      const result = await getAccessControlHeadersScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        limit: 10,
        offset: 5,
      });

      expect(result.count).to.equal(1);
      expect(result.headers[0]).to.deep.equal({
        id: HEADER_ID,
        value: '****3456',
        status: 'completed',
        createdAt: '2026-04-08T21:47:28.188965Z',
        createdBy: 'dev@example.com',
        backend: 'scapi',
      });
      // raw is the native SCAPI envelope surfaced verbatim for --json.
      expect(result.raw).to.have.property('total', 1);
      expect(result.raw).to.have.property('data');
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.get(SCAPI_HEADERS, () => {
          return HttpResponse.json(
            {title: 'Not Found', detail: 'Environment staging not found'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await getAccessControlHeadersScapi(scapiConn(), {storefrontId: STOREFRONT_ID, environmentId: ENVIRONMENT_ID});
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Environment staging not found');
        expect((error as {status?: number}).status).to.equal(404);
      }
    });
  });

  describe('createAccessControlHeaderScapi', () => {
    it('posts the value and returns the created masked header', async () => {
      let receivedBody: unknown;
      server.use(
        http.post(SCAPI_HEADERS, async ({request}) => {
          receivedBody = await request.json();
          return HttpResponse.json({id: HEADER_ID, value: '****3456', publishingStatus: 'pending'}, {status: 201});
        }),
      );

      const result = await createAccessControlHeaderScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        value: 'my-secret-header',
      });

      expect(receivedBody).to.deep.equal({value: 'my-secret-header'});
      expect(result.header).to.deep.include({id: HEADER_ID, value: '****3456', status: 'pending', backend: 'scapi'});
      expect(result.raw).to.have.property('id', HEADER_ID);
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.post(SCAPI_HEADERS, () => {
          return HttpResponse.json(
            {title: 'Bad Request', detail: 'value too short'},
            {status: 400, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await createAccessControlHeaderScapi(scapiConn(), {
          storefrontId: STOREFRONT_ID,
          environmentId: ENVIRONMENT_ID,
          value: 'short',
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('value too short');
        expect((error as {status?: number}).status).to.equal(400);
      }
    });
  });

  describe('getAccessControlHeaderScapi', () => {
    it('gets a single header by id', async () => {
      server.use(
        http.get(SCAPI_HEADER, ({params}) => {
          expect(params.accessControlHeaderId).to.equal(HEADER_ID);
          return HttpResponse.json({id: HEADER_ID, value: '****3456', publishingStatus: 'completed'});
        }),
      );

      const result = await getAccessControlHeaderScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        accessControlHeaderId: HEADER_ID,
      });

      expect(result.header).to.deep.include({id: HEADER_ID, value: '****3456', status: 'completed', backend: 'scapi'});
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.get(SCAPI_HEADER, () => {
          return HttpResponse.json(
            {title: 'Not Found', detail: 'header not found'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await getAccessControlHeaderScapi(scapiConn(), {
          storefrontId: STOREFRONT_ID,
          environmentId: ENVIRONMENT_ID,
          accessControlHeaderId: HEADER_ID,
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as {status?: number}).status).to.equal(404);
      }
    });
  });

  describe('deleteAccessControlHeaderScapi', () => {
    it('treats 204 No Content as success', async () => {
      let called = false;
      server.use(
        http.delete(SCAPI_HEADER, ({params}) => {
          called = true;
          expect(params.accessControlHeaderId).to.equal(HEADER_ID);
          return new HttpResponse(null, {status: 204});
        }),
      );

      await deleteAccessControlHeaderScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        accessControlHeaderId: HEADER_ID,
      });

      expect(called).to.equal(true);
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.delete(SCAPI_HEADER, () => {
          return HttpResponse.json(
            {title: 'Forbidden', detail: 'Missing scope'},
            {status: 403, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await deleteAccessControlHeaderScapi(scapiConn(), {
          storefrontId: STOREFRONT_ID,
          environmentId: ENVIRONMENT_ID,
          accessControlHeaderId: HEADER_ID,
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as {status?: number}).status).to.equal(403);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Backend-aware wrappers (legacy ↔ SCAPI routing)
  // -------------------------------------------------------------------------

  describe('listAccessControlHeadersWithBackend', () => {
    it('routes to SCAPI when preference is scapi', async () => {
      server.use(
        http.get(SCAPI_HEADERS, () => {
          return HttpResponse.json({limit: 25, offset: 0, total: 1, data: [{id: HEADER_ID, value: '****3456'}]});
        }),
      );

      const result = await listAccessControlHeadersWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
      });

      expect(result.backend).to.equal('scapi');
      expect(result.count).to.equal(1);
      expect(result.headers[0]).to.deep.include({id: HEADER_ID, backend: 'scapi'});
      // SCAPI raw is the native paginated envelope.
      expect(result.raw).to.have.property('total', 1);
    });

    it('routes to legacy when preference is legacy and surfaces the legacy shape as raw', async () => {
      server.use(
        http.get(LEGACY_HEADERS, () => {
          return HttpResponse.json({
            count: 1,
            next: null,
            previous: null,
            results: [{id: HEADER_ID, value: '***456', publishing_status_description: 'published'}],
          });
        }),
      );

      const result = await listAccessControlHeadersWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
      });

      expect(result.backend).to.equal('legacy');
      expect(result.headers[0]).to.deep.include({id: HEADER_ID, backend: 'legacy', status: 'published'});
      // Legacy raw preserves the pre-split ListAccessControlHeadersResult shape for --json.
      expect(result.raw).to.have.property('count', 1);
      expect(result.raw).to.have.property('headers');
    });

    it('auto falls back from SCAPI to legacy on a safe error', async () => {
      const fallbacks: string[] = [];
      server.use(
        http.get(SCAPI_HEADERS, () => {
          return HttpResponse.json(
            {title: 'Not Found', detail: 'not found'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
        http.get(LEGACY_HEADERS, () => {
          return HttpResponse.json({count: 1, results: [{id: HEADER_ID, value: '***456'}]});
        }),
      );

      const result = await listAccessControlHeadersWithBackend({
        preference: 'auto',
        scapiConnection: scapiConn(),
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        onFallback: (reason) => fallbacks.push(reason),
      });

      expect(result.backend).to.equal('legacy');
      expect(result.headers[0]).to.deep.include({id: HEADER_ID, backend: 'legacy'});
      expect(fallbacks).to.have.length(1);
    });

    it('auto uses legacy when no SCAPI connection is configured', async () => {
      server.use(
        http.get(LEGACY_HEADERS, () => {
          return HttpResponse.json({count: 0, results: []});
        }),
      );

      const result = await listAccessControlHeadersWithBackend({
        preference: 'auto',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
      });

      expect(result.backend).to.equal('legacy');
      expect(result.count).to.equal(0);
    });

    it('explicit scapi with no SCAPI connection fails loud', async () => {
      try {
        await listAccessControlHeadersWithBackend({
          preference: 'scapi',
          projectSlug: STOREFRONT_ID,
          environment: ENVIRONMENT_ID,
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('SCAPI MRT backend requires');
      }
    });
  });

  describe('createAccessControlHeaderWithBackend', () => {
    it('creates via SCAPI when preference is scapi', async () => {
      let receivedBody: unknown;
      server.use(
        http.post(SCAPI_HEADERS, async ({request}) => {
          receivedBody = await request.json();
          return HttpResponse.json({id: HEADER_ID, value: '****3456'}, {status: 201});
        }),
      );

      const result = await createAccessControlHeaderWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        value: 'my-secret-header',
      });

      expect(result.backend).to.equal('scapi');
      expect(receivedBody).to.deep.equal({value: 'my-secret-header'});
      expect(result.header).to.deep.include({id: HEADER_ID, backend: 'scapi'});
    });

    it('creates via legacy when preference is legacy', async () => {
      server.use(
        http.post(LEGACY_HEADERS, () => {
          return HttpResponse.json({id: HEADER_ID, value: '***456'}, {status: 201});
        }),
      );

      const result = await createAccessControlHeaderWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        value: 'my-secret-header',
      });

      expect(result.backend).to.equal('legacy');
      expect(result.header).to.deep.include({id: HEADER_ID, backend: 'legacy'});
    });
  });

  describe('getAccessControlHeaderWithBackend', () => {
    it('gets via SCAPI when preference is scapi', async () => {
      server.use(
        http.get(SCAPI_HEADER, () => {
          return HttpResponse.json({id: HEADER_ID, value: '****3456', publishingStatus: 'completed'});
        }),
      );

      const result = await getAccessControlHeaderWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        headerId: HEADER_ID,
      });

      expect(result.backend).to.equal('scapi');
      expect(result.header).to.deep.include({id: HEADER_ID, status: 'completed', backend: 'scapi'});
    });

    it('gets via legacy when preference is legacy', async () => {
      server.use(
        http.get(LEGACY_HEADER, () => {
          return HttpResponse.json({id: HEADER_ID, value: '***456'});
        }),
      );

      const result = await getAccessControlHeaderWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        headerId: HEADER_ID,
      });

      expect(result.backend).to.equal('legacy');
      expect(result.header).to.deep.include({id: HEADER_ID, backend: 'legacy'});
    });
  });

  describe('deleteAccessControlHeaderWithBackend', () => {
    it('deletes via SCAPI when preference is scapi', async () => {
      let called = false;
      server.use(
        http.delete(SCAPI_HEADER, () => {
          called = true;
          return new HttpResponse(null, {status: 204});
        }),
      );

      const result = await deleteAccessControlHeaderWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        headerId: HEADER_ID,
      });

      expect(result.backend).to.equal('scapi');
      expect(called).to.equal(true);
    });

    it('explicit scapi surfaces errors without falling back to legacy', async () => {
      let legacyCalled = false;
      server.use(
        http.delete(SCAPI_HEADER, () => {
          return HttpResponse.json(
            {title: 'Not Found', detail: 'not found'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
        http.delete(LEGACY_HEADER, () => {
          legacyCalled = true;
          return new HttpResponse(null, {status: 204});
        }),
      );

      try {
        await deleteAccessControlHeaderWithBackend({
          preference: 'scapi',
          scapiConnection: scapiConn(),
          legacyAuth: new MockAuthStrategy(),
          projectSlug: STOREFRONT_ID,
          environment: ENVIRONMENT_ID,
          headerId: HEADER_ID,
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as {status?: number}).status).to.equal(404);
      }
      expect(legacyCalled).to.equal(false);
    });

    it('deletes via legacy when preference is legacy', async () => {
      let called = false;
      server.use(
        http.delete(LEGACY_HEADER, () => {
          called = true;
          return new HttpResponse(null, {status: 204});
        }),
      );

      const result = await deleteAccessControlHeaderWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        headerId: HEADER_ID,
      });

      expect(result.backend).to.equal('legacy');
      expect(called).to.equal(true);
    });
  });
});
