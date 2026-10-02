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
  listRedirects,
  createRedirect,
  getRedirect,
  updateRedirect,
  deleteRedirect,
  cloneRedirects,
  getRedirectsScapi,
  createRedirectScapi,
  getRedirectScapi,
  updateRedirectScapi,
  deleteRedirectScapi,
  cloneRedirectsScapi,
  listRedirectsWithBackend,
  createRedirectWithBackend,
  getRedirectWithBackend,
  updateRedirectWithBackend,
  deleteRedirectWithBackend,
  cloneRedirectsWithBackend,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import type {ScapiMrtConnection} from '../../../src/operations/mrt/mrt-backend.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const DEFAULT_BASE_URL = DEFAULT_MRT_ORIGIN;

const SHORT_CODE = 'kv7kzm78';
const TENANT_ID = 'zzxy_prd';
const STOREFRONT_ID = 'my-project';
const ENVIRONMENT_ID = 'staging';
const SOURCE_ENVIRONMENT_ID = 'production';
// Legacy keys a redirect by its source path; SCAPI keys it by a UUID.
const FROM_PATH = '/old-page';
const REDIRECT_ID = '3f9b1c2d-4e5f-6a7b-8c9d-0e1f2a3b4c5d';

const SCAPI_BASE = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/storefront/environments/v1`;
const SCAPI_REDIRECTS = `${SCAPI_BASE}/organizations/:organizationId/storefronts/:storefrontId/environments/:environmentId/redirects`;
const SCAPI_REDIRECT = `${SCAPI_REDIRECTS}/:redirectId`;
const SCAPI_CLONE = `${SCAPI_REDIRECTS}/actions/clone`;
const LEGACY_REDIRECTS = `${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/redirect/`;
const LEGACY_REDIRECT = `${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/redirect/:fromPath`;
const LEGACY_CLONE = `${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:toTargetSlug/redirect/clone/`;

function scapiConn(): ScapiMrtConnection {
  return {shortCode: SHORT_CODE, tenantId: TENANT_ID, auth: new MockAuthStrategy()};
}

/** A full legacy redirect row as the MRT Cloud API returns it. */
function legacyRedirect(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    from_path: FROM_PATH,
    to_url: '/new-page',
    http_status_code: 301,
    forward_querystring: false,
    forward_wildcard: false,
    publishing_status: 'Completed',
    user_email: 'dev@example.com',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

/** A full SCAPI redirect object as the Environments API returns it. */
function scapiRedirect(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    redirectId: REDIRECT_ID,
    source: FROM_PATH,
    destination: '/new-page',
    httpStatusCode: 301,
    forwardQuerystring: false,
    forwardWildcard: false,
    publishingStatus: 'completed',
    createdBy: 'dev@example.com',
    creationDate: '2026-04-08T21:47:28.188965Z',
    ...overrides,
  };
}

describe('operations/mrt/redirect', () => {
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

  describe('listRedirects', () => {
    it('lists redirects', async () => {
      server.use(
        http.get(LEGACY_REDIRECTS, () => {
          return HttpResponse.json({count: 1, next: null, previous: null, results: [legacyRedirect()]});
        }),
      );

      const result = await listRedirects(
        {projectSlug: STOREFRONT_ID, targetSlug: ENVIRONMENT_ID},
        new MockAuthStrategy(),
      );

      expect(result.count).to.equal(1);
      expect(result.redirects).to.have.length(1);
      expect(result.redirects[0].from_path).to.equal(FROM_PATH);
    });

    it('throws error on API failure', async () => {
      server.use(
        http.get(LEGACY_REDIRECTS, () => {
          return HttpResponse.json({detail: 'Project not found'}, {status: 404});
        }),
      );

      try {
        await listRedirects({projectSlug: 'nope', targetSlug: ENVIRONMENT_ID}, new MockAuthStrategy());
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to list redirects');
      }
    });
  });

  describe('createRedirect', () => {
    it('creates a redirect', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(LEGACY_REDIRECTS, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(legacyRedirect(), {status: 201});
        }),
      );

      const redirect = await createRedirect(
        {projectSlug: STOREFRONT_ID, targetSlug: ENVIRONMENT_ID, fromPath: FROM_PATH, toUrl: '/new-page'},
        new MockAuthStrategy(),
      );

      expect(receivedBody).to.include({from_path: FROM_PATH, to_url: '/new-page'});
      expect(redirect.from_path).to.equal(FROM_PATH);
    });
  });

  describe('getRedirect', () => {
    it('gets a redirect by from_path', async () => {
      let called = false;
      server.use(
        http.get(LEGACY_REDIRECT, () => {
          called = true;
          return HttpResponse.json(legacyRedirect());
        }),
      );

      const redirect = await getRedirect(
        {projectSlug: STOREFRONT_ID, targetSlug: ENVIRONMENT_ID, fromPath: FROM_PATH},
        new MockAuthStrategy(),
      );

      expect(called).to.equal(true);
      expect(redirect.to_url).to.equal('/new-page');
    });
  });

  describe('updateRedirect', () => {
    it('patches only the supplied fields', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.patch(LEGACY_REDIRECT, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(legacyRedirect({to_url: '/newer-page'}));
        }),
      );

      const redirect = await updateRedirect(
        {projectSlug: STOREFRONT_ID, targetSlug: ENVIRONMENT_ID, fromPath: FROM_PATH, toUrl: '/newer-page'},
        new MockAuthStrategy(),
      );

      expect(receivedBody).to.deep.equal({to_url: '/newer-page'});
      expect(redirect.to_url).to.equal('/newer-page');
    });
  });

  describe('deleteRedirect', () => {
    it('deletes a redirect by from_path', async () => {
      let called = false;
      server.use(
        http.delete(LEGACY_REDIRECT, () => {
          called = true;
          return new HttpResponse(null, {status: 204});
        }),
      );

      await deleteRedirect(
        {projectSlug: STOREFRONT_ID, targetSlug: ENVIRONMENT_ID, fromPath: FROM_PATH},
        new MockAuthStrategy(),
      );

      expect(called).to.equal(true);
    });

    it('throws error on API failure', async () => {
      server.use(
        http.delete(LEGACY_REDIRECT, () => {
          return HttpResponse.json({detail: 'Not found'}, {status: 404});
        }),
      );

      try {
        await deleteRedirect(
          {projectSlug: STOREFRONT_ID, targetSlug: ENVIRONMENT_ID, fromPath: FROM_PATH},
          new MockAuthStrategy(),
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to delete redirect');
      }
    });
  });

  describe('cloneRedirects', () => {
    it('clones redirects between targets', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(LEGACY_CLONE, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({count: 2, results: [legacyRedirect(), legacyRedirect({from_path: '/b'})]});
        }),
      );

      const result = await cloneRedirects(
        {projectSlug: STOREFRONT_ID, fromTargetSlug: SOURCE_ENVIRONMENT_ID, toTargetSlug: ENVIRONMENT_ID},
        new MockAuthStrategy(),
      );

      expect(receivedBody).to.deep.equal({from_target_slug: SOURCE_ENVIRONMENT_ID});
      expect(result.count).to.equal(2);
    });
  });

  // -------------------------------------------------------------------------
  // SCAPI MRT operations
  // -------------------------------------------------------------------------

  describe('getRedirectsScapi', () => {
    it('maps the SCAPI envelope into normalized views', async () => {
      server.use(
        http.get(SCAPI_REDIRECTS, ({params, request}) => {
          expect(params.organizationId).to.equal('f_ecom_zzxy_prd');
          expect(params.storefrontId).to.equal(STOREFRONT_ID);
          expect(params.environmentId).to.equal(ENVIRONMENT_ID);
          const url = new URL(request.url);
          expect(url.searchParams.get('limit')).to.equal('10');
          expect(url.searchParams.get('offset')).to.equal('5');
          return HttpResponse.json({limit: 10, offset: 5, total: 1, data: [scapiRedirect()]});
        }),
      );

      const result = await getRedirectsScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        limit: 10,
        offset: 5,
      });

      expect(result.count).to.equal(1);
      expect(result.redirects[0]).to.deep.equal({
        id: REDIRECT_ID,
        source: FROM_PATH,
        destination: '/new-page',
        httpStatusCode: 301,
        forwardQuerystring: false,
        forwardWildcard: false,
        status: 'completed',
        createdAt: '2026-04-08T21:47:28.188965Z',
        createdBy: 'dev@example.com',
        backend: 'scapi',
      });
      // raw is the native SCAPI envelope surfaced verbatim for --json.
      expect(result.raw).to.have.property('total', 1);
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.get(SCAPI_REDIRECTS, () => {
          return HttpResponse.json(
            {title: 'Not Found', detail: 'Environment staging not found'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await getRedirectsScapi(scapiConn(), {storefrontId: STOREFRONT_ID, environmentId: ENVIRONMENT_ID});
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Environment staging not found');
        expect((error as {status?: number}).status).to.equal(404);
      }
    });
  });

  describe('createRedirectScapi', () => {
    it('posts source/destination and always sends the forward flags', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(SCAPI_REDIRECTS, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(scapiRedirect({publishingStatus: 'pending'}), {status: 201});
        }),
      );

      const result = await createRedirectScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        redirect: {source: FROM_PATH, destination: '/new-page', httpStatusCode: 302},
      });

      // forwardQuerystring/forwardWildcard are required by the schema: default to false.
      expect(receivedBody).to.deep.equal({
        source: FROM_PATH,
        destination: '/new-page',
        httpStatusCode: 302,
        forwardQuerystring: false,
        forwardWildcard: false,
      });
      expect(result.redirect).to.deep.include({id: REDIRECT_ID, status: 'pending', backend: 'scapi'});
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.post(SCAPI_REDIRECTS, () => {
          return HttpResponse.json(
            {title: 'Bad Request', detail: 'source is invalid'},
            {status: 400, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await createRedirectScapi(scapiConn(), {
          storefrontId: STOREFRONT_ID,
          environmentId: ENVIRONMENT_ID,
          redirect: {source: 'bad', destination: '/x'},
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('source is invalid');
        expect((error as {status?: number}).status).to.equal(400);
      }
    });
  });

  describe('getRedirectScapi', () => {
    it('gets a single redirect by UUID', async () => {
      server.use(
        http.get(SCAPI_REDIRECT, ({params}) => {
          expect(params.redirectId).to.equal(REDIRECT_ID);
          return HttpResponse.json(scapiRedirect());
        }),
      );

      const result = await getRedirectScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        redirectId: REDIRECT_ID,
      });

      expect(result.redirect).to.deep.include({id: REDIRECT_ID, source: FROM_PATH, backend: 'scapi'});
    });
  });

  describe('updateRedirectScapi', () => {
    it('patches only the supplied fields', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.patch(SCAPI_REDIRECT, async ({request, params}) => {
          expect(params.redirectId).to.equal(REDIRECT_ID);
          receivedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(scapiRedirect({destination: '/newer-page'}));
        }),
      );

      const result = await updateRedirectScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        redirectId: REDIRECT_ID,
        changes: {destination: '/newer-page'},
      });

      expect(receivedBody).to.deep.equal({destination: '/newer-page'});
      expect(result.redirect).to.deep.include({id: REDIRECT_ID, destination: '/newer-page', backend: 'scapi'});
    });
  });

  describe('deleteRedirectScapi', () => {
    it('treats 204 No Content as success', async () => {
      let called = false;
      server.use(
        http.delete(SCAPI_REDIRECT, ({params}) => {
          called = true;
          expect(params.redirectId).to.equal(REDIRECT_ID);
          return new HttpResponse(null, {status: 204});
        }),
      );

      await deleteRedirectScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        redirectId: REDIRECT_ID,
      });

      expect(called).to.equal(true);
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.delete(SCAPI_REDIRECT, () => {
          return HttpResponse.json(
            {title: 'Forbidden', detail: 'Missing scope'},
            {status: 403, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await deleteRedirectScapi(scapiConn(), {
          storefrontId: STOREFRONT_ID,
          environmentId: ENVIRONMENT_ID,
          redirectId: REDIRECT_ID,
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as {status?: number}).status).to.equal(403);
      }
    });
  });

  describe('cloneRedirectsScapi', () => {
    it('posts the source environment and treats 201 (no body) as success', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(SCAPI_CLONE, async ({request, params}) => {
          expect(params.environmentId).to.equal(ENVIRONMENT_ID);
          receivedBody = (await request.json()) as Record<string, unknown>;
          return new HttpResponse(null, {status: 201});
        }),
      );

      await cloneRedirectsScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        sourceEnvironmentId: SOURCE_ENVIRONMENT_ID,
      });

      expect(receivedBody).to.deep.equal({sourceEnvironmentId: SOURCE_ENVIRONMENT_ID});
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.post(SCAPI_CLONE, () => {
          return HttpResponse.json(
            {title: 'Bad Request', detail: 'source and destination must differ'},
            {status: 400, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await cloneRedirectsScapi(scapiConn(), {
          storefrontId: STOREFRONT_ID,
          environmentId: ENVIRONMENT_ID,
          sourceEnvironmentId: ENVIRONMENT_ID,
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as {status?: number}).status).to.equal(400);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Backend-aware wrappers (legacy ↔ SCAPI routing)
  // -------------------------------------------------------------------------

  describe('listRedirectsWithBackend', () => {
    it('routes to SCAPI when preference is scapi', async () => {
      server.use(
        http.get(SCAPI_REDIRECTS, () => {
          return HttpResponse.json({limit: 25, offset: 0, total: 1, data: [scapiRedirect()]});
        }),
      );

      const result = await listRedirectsWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
      });

      expect(result.backend).to.equal('scapi');
      expect(result.count).to.equal(1);
      expect(result.redirects[0]).to.deep.include({id: REDIRECT_ID, backend: 'scapi'});
      expect(result.raw).to.have.property('total', 1);
    });

    it('routes to legacy when preference is legacy and surfaces the legacy shape as raw', async () => {
      server.use(
        http.get(LEGACY_REDIRECTS, () => {
          return HttpResponse.json({count: 1, next: null, previous: null, results: [legacyRedirect()]});
        }),
      );

      const result = await listRedirectsWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
      });

      expect(result.backend).to.equal('legacy');
      expect(result.redirects[0]).to.deep.include({id: FROM_PATH, source: FROM_PATH, backend: 'legacy'});
      // Legacy raw preserves the pre-split ListRedirectsResult shape for --json.
      expect(result.raw).to.have.property('count', 1);
      expect(result.raw).to.have.property('redirects');
    });

    it('auto falls back from SCAPI to legacy on a safe error', async () => {
      const fallbacks: string[] = [];
      server.use(
        http.get(SCAPI_REDIRECTS, () => {
          return HttpResponse.json(
            {title: 'Not Found', detail: 'not found'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
        http.get(LEGACY_REDIRECTS, () => {
          return HttpResponse.json({count: 1, results: [legacyRedirect()]});
        }),
      );

      const result = await listRedirectsWithBackend({
        preference: 'auto',
        scapiConnection: scapiConn(),
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        onFallback: (reason) => fallbacks.push(reason),
      });

      expect(result.backend).to.equal('legacy');
      expect(result.redirects[0]).to.deep.include({backend: 'legacy'});
      expect(fallbacks).to.have.length(1);
    });

    it('auto uses legacy when no SCAPI connection is configured', async () => {
      server.use(
        http.get(LEGACY_REDIRECTS, () => {
          return HttpResponse.json({count: 0, results: []});
        }),
      );

      const result = await listRedirectsWithBackend({
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
        await listRedirectsWithBackend({
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

  describe('createRedirectWithBackend', () => {
    it('creates via SCAPI when preference is scapi', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(SCAPI_REDIRECTS, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(scapiRedirect(), {status: 201});
        }),
      );

      const result = await createRedirectWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        source: FROM_PATH,
        destination: '/new-page',
        httpStatusCode: 301,
      });

      expect(result.backend).to.equal('scapi');
      expect(receivedBody).to.include({source: FROM_PATH, destination: '/new-page'});
      expect(result.redirect).to.deep.include({id: REDIRECT_ID, backend: 'scapi'});
    });

    it('creates via legacy when preference is legacy', async () => {
      server.use(
        http.post(LEGACY_REDIRECTS, () => {
          return HttpResponse.json(legacyRedirect(), {status: 201});
        }),
      );

      const result = await createRedirectWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        source: FROM_PATH,
        destination: '/new-page',
      });

      expect(result.backend).to.equal('legacy');
      expect(result.redirect).to.deep.include({id: FROM_PATH, source: FROM_PATH, backend: 'legacy'});
    });
  });

  describe('getRedirectWithBackend', () => {
    it('gets via SCAPI using the UUID identifier', async () => {
      server.use(
        http.get(SCAPI_REDIRECT, ({params}) => {
          expect(params.redirectId).to.equal(REDIRECT_ID);
          return HttpResponse.json(scapiRedirect());
        }),
      );

      const result = await getRedirectWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        identifier: REDIRECT_ID,
      });

      expect(result.backend).to.equal('scapi');
      expect(result.redirect).to.deep.include({id: REDIRECT_ID, backend: 'scapi'});
    });

    it('gets via legacy using the from_path identifier', async () => {
      server.use(
        http.get(LEGACY_REDIRECT, () => {
          return HttpResponse.json(legacyRedirect());
        }),
      );

      const result = await getRedirectWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        identifier: FROM_PATH,
      });

      expect(result.backend).to.equal('legacy');
      expect(result.redirect).to.deep.include({id: FROM_PATH, backend: 'legacy'});
    });
  });

  describe('updateRedirectWithBackend', () => {
    it('updates via SCAPI, sending only the supplied fields', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.patch(SCAPI_REDIRECT, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(scapiRedirect({destination: '/newer-page'}));
        }),
      );

      const result = await updateRedirectWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        identifier: REDIRECT_ID,
        destination: '/newer-page',
      });

      expect(result.backend).to.equal('scapi');
      expect(receivedBody).to.deep.equal({destination: '/newer-page'});
    });

    it('updates via legacy, sending only the supplied fields', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.patch(LEGACY_REDIRECT, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(legacyRedirect({to_url: '/newer-page'}));
        }),
      );

      const result = await updateRedirectWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        identifier: FROM_PATH,
        destination: '/newer-page',
      });

      expect(result.backend).to.equal('legacy');
      // The legacy backend maps `destination` onto its `to_url` field.
      expect(receivedBody).to.deep.equal({to_url: '/newer-page'});
    });
  });

  describe('deleteRedirectWithBackend', () => {
    it('deletes via SCAPI when preference is scapi', async () => {
      let called = false;
      server.use(
        http.delete(SCAPI_REDIRECT, () => {
          called = true;
          return new HttpResponse(null, {status: 204});
        }),
      );

      const result = await deleteRedirectWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        identifier: REDIRECT_ID,
      });

      expect(result.backend).to.equal('scapi');
      expect(called).to.equal(true);
    });

    it('explicit scapi surfaces errors without falling back to legacy', async () => {
      let legacyCalled = false;
      server.use(
        http.delete(SCAPI_REDIRECT, () => {
          return HttpResponse.json(
            {title: 'Not Found', detail: 'not found'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
        http.delete(LEGACY_REDIRECT, () => {
          legacyCalled = true;
          return new HttpResponse(null, {status: 204});
        }),
      );

      try {
        await deleteRedirectWithBackend({
          preference: 'scapi',
          scapiConnection: scapiConn(),
          legacyAuth: new MockAuthStrategy(),
          projectSlug: STOREFRONT_ID,
          environment: ENVIRONMENT_ID,
          identifier: REDIRECT_ID,
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
        http.delete(LEGACY_REDIRECT, () => {
          called = true;
          return new HttpResponse(null, {status: 204});
        }),
      );

      const result = await deleteRedirectWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        identifier: FROM_PATH,
      });

      expect(result.backend).to.equal('legacy');
      expect(called).to.equal(true);
    });
  });

  describe('cloneRedirectsWithBackend', () => {
    it('clones via SCAPI and reports a null count (empty 201)', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(SCAPI_CLONE, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, unknown>;
          return new HttpResponse(null, {status: 201});
        }),
      );

      const result = await cloneRedirectsWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        sourceEnvironment: SOURCE_ENVIRONMENT_ID,
        targetEnvironment: ENVIRONMENT_ID,
      });

      expect(result.backend).to.equal('scapi');
      expect(result.count).to.equal(null);
      expect(result.raw).to.equal(null);
      expect(receivedBody).to.deep.equal({sourceEnvironmentId: SOURCE_ENVIRONMENT_ID});
    });

    it('clones via legacy and reports the cloned count', async () => {
      server.use(
        http.post(LEGACY_CLONE, () => {
          return HttpResponse.json({count: 3, results: [legacyRedirect()]});
        }),
      );

      const result = await cloneRedirectsWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        sourceEnvironment: SOURCE_ENVIRONMENT_ID,
        targetEnvironment: ENVIRONMENT_ID,
      });

      expect(result.backend).to.equal('legacy');
      expect(result.count).to.equal(3);
      expect(result.raw).to.have.property('count', 3);
    });
  });
});
