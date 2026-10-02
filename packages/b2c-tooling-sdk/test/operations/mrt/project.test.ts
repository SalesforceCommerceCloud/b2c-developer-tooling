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
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  getStorefrontsScapi,
  createStorefrontScapi,
  getStorefrontByIdScapi,
  updateStorefrontScapi,
  deleteStorefrontScapi,
  listProjectsWithBackend,
  createProjectWithBackend,
  getProjectWithBackend,
  updateProjectWithBackend,
  deleteProjectWithBackend,
  normalizeLegacyProject,
  normalizeProjectScapi,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import type {ScapiMrtConnection} from '../../../src/operations/mrt/mrt-backend.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const DEFAULT_BASE_URL = DEFAULT_MRT_ORIGIN;

const SHORT_CODE = 'kv7kzm78';
const TENANT_ID = 'zzxy_prd';
const ORGANIZATION_ID = 'f_ecom_zzxy_prd';
const STOREFRONT_ID = 'my-storefront';

const SCAPI_BASE = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/storefront/storefronts/v1`;
const SCAPI_STOREFRONTS = `${SCAPI_BASE}/organizations/:organizationId/storefronts`;
const SCAPI_STOREFRONT = `${SCAPI_STOREFRONTS}/:storefrontId`;

const LEGACY_PROJECTS = `${DEFAULT_BASE_URL}/api/projects/`;
const LEGACY_PROJECT = `${DEFAULT_BASE_URL}/api/projects/:projectSlug/`;

function scapiConn(): ScapiMrtConnection {
  return {shortCode: SHORT_CODE, tenantId: TENANT_ID, auth: new MockAuthStrategy()};
}

/** A representative SCAPI storefront payload. */
function scapiStorefront(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    storefrontId: STOREFRONT_ID,
    storefrontName: 'My Storefront',
    type: 'storefront_next',
    setupStatus: 'ok',
    ssrRegion: 'us_east_1',
    ssrArchitecture: 'arm64',
    sites: ['RefArch'],
    creationDate: '2026-01-01T00:00:00Z',
    lastModified: '2026-02-01T00:00:00Z',
    ...overrides,
  };
}

describe('operations/mrt/project', () => {
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
  // Normalizers (presentation-agnostic mapping across backends)
  // -------------------------------------------------------------------------

  describe('normalizeLegacyProject', () => {
    it('maps legacy fields and defaults missing status to active', () => {
      const view = normalizeLegacyProject({
        slug: STOREFRONT_ID,
        name: 'My Storefront',
        project_type: 'sfra',
        ssr_region: 'us-east-1',
        organization: 'my-org',
        url: 'https://example.com',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z',
      });

      expect(view).to.deep.equal({
        id: STOREFRONT_ID,
        name: 'My Storefront',
        type: 'sfra',
        status: 'active',
        region: 'us-east-1',
        architecture: undefined,
        url: 'https://example.com',
        organization: 'my-org',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
        backend: 'legacy',
      });
    });
  });

  describe('normalizeProjectScapi', () => {
    it('maps SCAPI storefront fields, keeping the underscored region form', () => {
      const view = normalizeProjectScapi(scapiStorefront() as never);

      expect(view).to.deep.equal({
        id: STOREFRONT_ID,
        name: 'My Storefront',
        type: 'storefront_next',
        status: 'ok',
        region: 'us_east_1',
        architecture: 'arm64',
        sites: ['RefArch'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
        backend: 'scapi',
      });
    });
  });

  // -------------------------------------------------------------------------
  // Legacy MRT operations
  // -------------------------------------------------------------------------

  describe('listProjects', () => {
    it('lists projects', async () => {
      server.use(
        http.get(LEGACY_PROJECTS, () => {
          return HttpResponse.json({
            count: 1,
            next: null,
            previous: null,
            results: [{slug: STOREFRONT_ID, name: 'My Storefront'}],
          });
        }),
      );

      const result = await listProjects({}, new MockAuthStrategy());

      expect(result.count).to.equal(1);
      expect(result.projects).to.have.length(1);
      expect(result.projects[0].slug).to.equal(STOREFRONT_ID);
    });

    it('throws error on API failure', async () => {
      server.use(
        http.get(LEGACY_PROJECTS, () => {
          return HttpResponse.json({message: 'boom'}, {status: 500});
        }),
      );

      try {
        await listProjects({}, new MockAuthStrategy());
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to list projects');
      }
    });
  });

  describe('createProject', () => {
    it('creates a project with only the provided fields', async () => {
      let receivedBody: unknown;
      server.use(
        http.post(LEGACY_PROJECTS, async ({request}) => {
          receivedBody = await request.json();
          return HttpResponse.json({slug: STOREFRONT_ID, name: 'My Storefront'}, {status: 201});
        }),
      );

      const project = await createProject(
        {name: 'My Storefront', organization: 'my-org', ssrRegion: 'us-east-1'},
        new MockAuthStrategy(),
      );

      expect(receivedBody).to.deep.equal({name: 'My Storefront', organization: 'my-org', ssr_region: 'us-east-1'});
      expect(project.slug).to.equal(STOREFRONT_ID);
    });

    it('throws error on API failure', async () => {
      server.use(
        http.post(LEGACY_PROJECTS, () => {
          return HttpResponse.json({message: 'invalid'}, {status: 400});
        }),
      );

      try {
        await createProject({name: 'x', organization: 'my-org'}, new MockAuthStrategy());
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to create project');
      }
    });
  });

  describe('getProject', () => {
    it('gets a project by slug', async () => {
      server.use(
        http.get(LEGACY_PROJECT, ({params}) => {
          expect(params.projectSlug).to.equal(STOREFRONT_ID);
          return HttpResponse.json({slug: STOREFRONT_ID, name: 'My Storefront'});
        }),
      );

      const project = await getProject({projectSlug: STOREFRONT_ID}, new MockAuthStrategy());

      expect(project.slug).to.equal(STOREFRONT_ID);
    });

    it('throws error on API failure', async () => {
      server.use(
        http.get(LEGACY_PROJECT, () => {
          return HttpResponse.json({message: 'not found'}, {status: 404});
        }),
      );

      try {
        await getProject({projectSlug: 'nope'}, new MockAuthStrategy());
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to get project');
      }
    });
  });

  describe('updateProject', () => {
    it('patches only the provided fields', async () => {
      let receivedBody: unknown;
      server.use(
        http.patch(LEGACY_PROJECT, async ({request}) => {
          receivedBody = await request.json();
          return HttpResponse.json({slug: STOREFRONT_ID, name: 'New Name'});
        }),
      );

      const project = await updateProject({projectSlug: STOREFRONT_ID, name: 'New Name'}, new MockAuthStrategy());

      expect(receivedBody).to.deep.equal({name: 'New Name'});
      expect(project.name).to.equal('New Name');
    });

    it('throws error on API failure', async () => {
      server.use(
        http.patch(LEGACY_PROJECT, () => {
          return HttpResponse.json({message: 'bad'}, {status: 400});
        }),
      );

      try {
        await updateProject({projectSlug: STOREFRONT_ID, name: 'x'}, new MockAuthStrategy());
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to update project');
      }
    });
  });

  describe('deleteProject', () => {
    it('deletes a project by slug', async () => {
      let called = false;
      server.use(
        http.delete(LEGACY_PROJECT, ({params}) => {
          called = true;
          expect(params.projectSlug).to.equal(STOREFRONT_ID);
          return new HttpResponse(null, {status: 204});
        }),
      );

      await deleteProject({projectSlug: STOREFRONT_ID}, new MockAuthStrategy());

      expect(called).to.equal(true);
    });

    it('throws error on API failure', async () => {
      server.use(
        http.delete(LEGACY_PROJECT, () => {
          return HttpResponse.json({message: 'not found'}, {status: 404});
        }),
      );

      try {
        await deleteProject({projectSlug: 'nope'}, new MockAuthStrategy());
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to delete project');
      }
    });
  });

  // -------------------------------------------------------------------------
  // SCAPI MRT (Storefronts) operations
  // -------------------------------------------------------------------------

  describe('getStorefrontsScapi', () => {
    it('maps the SCAPI envelope into normalized project views and forwards pagination', async () => {
      server.use(
        http.get(SCAPI_STOREFRONTS, ({params, request}) => {
          expect(params.organizationId).to.equal(ORGANIZATION_ID);
          const url = new URL(request.url);
          expect(url.searchParams.get('limit')).to.equal('10');
          expect(url.searchParams.get('offset')).to.equal('5');
          return HttpResponse.json({limit: 10, offset: 5, total: 1, data: [scapiStorefront()]});
        }),
      );

      const result = await getStorefrontsScapi(scapiConn(), {limit: 10, offset: 5});

      expect(result.count).to.equal(1);
      expect(result.projects[0]).to.deep.include({id: STOREFRONT_ID, backend: 'scapi', region: 'us_east_1'});
      // raw is the native SCAPI envelope surfaced verbatim for --json.
      expect(result.raw).to.have.property('total', 1);
      expect(result.raw).to.have.property('data');
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.get(SCAPI_STOREFRONTS, () => {
          return HttpResponse.json(
            {title: 'Not Found', detail: 'organization not found'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await getStorefrontsScapi(scapiConn(), {});
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('organization not found');
        expect((error as {status?: number}).status).to.equal(404);
      }
    });
  });

  describe('createStorefrontScapi', () => {
    it('posts storefrontName/type/sites and returns the normalized storefront', async () => {
      let receivedBody: unknown;
      server.use(
        http.post(SCAPI_STOREFRONTS, async ({request}) => {
          receivedBody = await request.json();
          return HttpResponse.json(scapiStorefront({setupStatus: 'in_progress'}), {status: 202});
        }),
      );

      const result = await createStorefrontScapi(scapiConn(), {
        storefrontName: 'My Storefront',
        type: 'storefront_next',
        sites: ['RefArch'],
      });

      expect(receivedBody).to.deep.equal({
        storefrontName: 'My Storefront',
        type: 'storefront_next',
        sites: ['RefArch'],
      });
      expect(result.project).to.deep.include({id: STOREFRONT_ID, status: 'in_progress', backend: 'scapi'});
      expect(result.raw).to.have.property('storefrontId', STOREFRONT_ID);
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.post(SCAPI_STOREFRONTS, () => {
          return HttpResponse.json(
            {title: 'Bad Request', detail: 'at least one site is required'},
            {status: 400, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await createStorefrontScapi(scapiConn(), {storefrontName: 'x', type: 'storefront_next', sites: []});
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('at least one site is required');
        expect((error as {status?: number}).status).to.equal(400);
      }
    });
  });

  describe('getStorefrontByIdScapi', () => {
    it('gets a single storefront by id', async () => {
      server.use(
        http.get(SCAPI_STOREFRONT, ({params}) => {
          expect(params.organizationId).to.equal(ORGANIZATION_ID);
          expect(params.storefrontId).to.equal(STOREFRONT_ID);
          return HttpResponse.json(scapiStorefront());
        }),
      );

      const result = await getStorefrontByIdScapi(scapiConn(), {storefrontId: STOREFRONT_ID});

      expect(result.project).to.deep.include({id: STOREFRONT_ID, backend: 'scapi'});
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.get(SCAPI_STOREFRONT, () => {
          return HttpResponse.json(
            {title: 'Not Found', detail: 'storefront not found'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await getStorefrontByIdScapi(scapiConn(), {storefrontId: 'nope'});
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as {status?: number}).status).to.equal(404);
      }
    });
  });

  describe('updateStorefrontScapi', () => {
    it('sends only the supplied fields and full-replaces sites', async () => {
      let receivedBody: unknown;
      server.use(
        http.patch(SCAPI_STOREFRONT, async ({request}) => {
          receivedBody = await request.json();
          return HttpResponse.json(scapiStorefront({sites: ['RefArch', 'OtherSite']}));
        }),
      );

      const result = await updateStorefrontScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        sites: ['RefArch', 'OtherSite'],
        allowCookies: false,
      });

      // Only defined fields are sent; name/url are not part of the SCAPI contract.
      expect(receivedBody).to.deep.equal({sites: ['RefArch', 'OtherSite'], allowCookies: false});
      expect(result.project.sites).to.deep.equal(['RefArch', 'OtherSite']);
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.patch(SCAPI_STOREFRONT, () => {
          return HttpResponse.json(
            {title: 'Forbidden', detail: 'Missing scope'},
            {status: 403, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await updateStorefrontScapi(scapiConn(), {storefrontId: STOREFRONT_ID, sites: ['RefArch']});
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as {status?: number}).status).to.equal(403);
      }
    });
  });

  describe('deleteStorefrontScapi', () => {
    it('treats a 202 body as success and surfaces it as raw', async () => {
      server.use(
        http.delete(SCAPI_STOREFRONT, ({params}) => {
          expect(params.storefrontId).to.equal(STOREFRONT_ID);
          return HttpResponse.json(scapiStorefront({setupStatus: 'delete_in_progress'}), {status: 202});
        }),
      );

      const result = await deleteStorefrontScapi(scapiConn(), {storefrontId: STOREFRONT_ID});

      expect(result.raw).to.have.property('setupStatus', 'delete_in_progress');
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.delete(SCAPI_STOREFRONT, () => {
          return HttpResponse.json(
            {title: 'Not Found', detail: 'storefront not found'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await deleteStorefrontScapi(scapiConn(), {storefrontId: 'nope'});
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as {status?: number}).status).to.equal(404);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Backend-aware wrappers (legacy ↔ SCAPI routing)
  // -------------------------------------------------------------------------

  describe('listProjectsWithBackend', () => {
    it('routes to SCAPI when preference is scapi', async () => {
      server.use(
        http.get(SCAPI_STOREFRONTS, () => {
          return HttpResponse.json({limit: 25, offset: 0, total: 1, data: [scapiStorefront()]});
        }),
      );

      const result = await listProjectsWithBackend({preference: 'scapi', scapiConnection: scapiConn()});

      expect(result.backend).to.equal('scapi');
      expect(result.count).to.equal(1);
      expect(result.projects[0]).to.deep.include({id: STOREFRONT_ID, backend: 'scapi'});
      expect(result.raw).to.have.property('total', 1);
    });

    it('routes to legacy when preference is legacy and surfaces the legacy shape as raw', async () => {
      server.use(
        http.get(LEGACY_PROJECTS, () => {
          return HttpResponse.json({
            count: 1,
            next: null,
            previous: null,
            results: [{slug: STOREFRONT_ID, name: 'My Storefront', ssr_region: 'us-east-1'}],
          });
        }),
      );

      const result = await listProjectsWithBackend({preference: 'legacy', legacyAuth: new MockAuthStrategy()});

      expect(result.backend).to.equal('legacy');
      expect(result.projects[0]).to.deep.include({id: STOREFRONT_ID, backend: 'legacy', region: 'us-east-1'});
      // Legacy raw preserves the ListProjectsResult shape for --json.
      expect(result.raw).to.have.property('count', 1);
      expect(result.raw).to.have.property('projects');
    });

    it('auto falls back from SCAPI to legacy on a safe error', async () => {
      const fallbacks: string[] = [];
      server.use(
        http.get(SCAPI_STOREFRONTS, () => {
          return HttpResponse.json(
            {title: 'Not Found', detail: 'not found'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
        http.get(LEGACY_PROJECTS, () => {
          return HttpResponse.json({count: 1, results: [{slug: STOREFRONT_ID, name: 'My Storefront'}]});
        }),
      );

      const result = await listProjectsWithBackend({
        preference: 'auto',
        scapiConnection: scapiConn(),
        legacyAuth: new MockAuthStrategy(),
        onFallback: (reason) => fallbacks.push(reason),
      });

      expect(result.backend).to.equal('legacy');
      expect(result.projects[0]).to.deep.include({id: STOREFRONT_ID, backend: 'legacy'});
      expect(fallbacks).to.have.length(1);
    });

    it('auto uses legacy when no SCAPI connection is configured', async () => {
      server.use(
        http.get(LEGACY_PROJECTS, () => {
          return HttpResponse.json({count: 0, results: []});
        }),
      );

      const result = await listProjectsWithBackend({preference: 'auto', legacyAuth: new MockAuthStrategy()});

      expect(result.backend).to.equal('legacy');
      expect(result.count).to.equal(0);
    });

    it('explicit scapi with no SCAPI connection fails loud', async () => {
      try {
        await listProjectsWithBackend({preference: 'scapi'});
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('SCAPI MRT backend requires');
      }
    });

    it('legacy preference with no legacy auth throws the legacy-auth-required error', async () => {
      try {
        await listProjectsWithBackend({preference: 'legacy'});
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Legacy MRT credentials are required');
      }
    });
  });

  describe('createProjectWithBackend', () => {
    it('creates via SCAPI when preference is scapi', async () => {
      let receivedBody: unknown;
      server.use(
        http.post(SCAPI_STOREFRONTS, async ({request}) => {
          receivedBody = await request.json();
          return HttpResponse.json(scapiStorefront({setupStatus: 'in_progress'}), {status: 202});
        }),
      );

      const result = await createProjectWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        name: 'My Storefront',
        type: 'storefront_next',
        sites: ['RefArch'],
      });

      expect(result.backend).to.equal('scapi');
      expect(receivedBody).to.deep.equal({
        storefrontName: 'My Storefront',
        type: 'storefront_next',
        sites: ['RefArch'],
      });
      expect(result.project).to.deep.include({id: STOREFRONT_ID, backend: 'scapi'});
    });

    it('defaults the SCAPI storefront type to storefront_next when omitted', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(SCAPI_STOREFRONTS, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(scapiStorefront(), {status: 202});
        }),
      );

      await createProjectWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        name: 'My Storefront',
        sites: ['RefArch'],
      });

      expect(receivedBody?.type).to.equal('storefront_next');
    });

    it('creates via legacy when preference is legacy', async () => {
      server.use(
        http.post(LEGACY_PROJECTS, () => {
          return HttpResponse.json({slug: STOREFRONT_ID, name: 'My Storefront'}, {status: 201});
        }),
      );

      const result = await createProjectWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        name: 'My Storefront',
        organization: 'my-org',
      });

      expect(result.backend).to.equal('legacy');
      expect(result.project).to.deep.include({id: STOREFRONT_ID, backend: 'legacy'});
    });

    it('legacy create without an organization throws', async () => {
      try {
        await createProjectWithBackend({
          preference: 'legacy',
          legacyAuth: new MockAuthStrategy(),
          name: 'My Storefront',
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('requires --organization');
      }
    });
  });

  describe('getProjectWithBackend', () => {
    it('gets via SCAPI when preference is scapi', async () => {
      server.use(
        http.get(SCAPI_STOREFRONT, () => {
          return HttpResponse.json(scapiStorefront());
        }),
      );

      const result = await getProjectWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
      });

      expect(result.backend).to.equal('scapi');
      expect(result.project).to.deep.include({id: STOREFRONT_ID, backend: 'scapi'});
    });

    it('gets via legacy when preference is legacy', async () => {
      server.use(
        http.get(LEGACY_PROJECT, () => {
          return HttpResponse.json({slug: STOREFRONT_ID, name: 'My Storefront'});
        }),
      );

      const result = await getProjectWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
      });

      expect(result.backend).to.equal('legacy');
      expect(result.project).to.deep.include({id: STOREFRONT_ID, backend: 'legacy'});
    });
  });

  describe('updateProjectWithBackend', () => {
    it('updates via SCAPI, converting the hyphenated region to the underscored form', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.patch(SCAPI_STOREFRONT, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(scapiStorefront());
        }),
      );

      const result = await updateProjectWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        ssrRegion: 'us-east-1',
        sites: ['RefArch'],
      });

      expect(result.backend).to.equal('scapi');
      expect(receivedBody?.ssrRegion).to.equal('us_east_1');
      expect(receivedBody?.sites).to.deep.equal(['RefArch']);
    });

    it('updates via legacy when preference is legacy', async () => {
      server.use(
        http.patch(LEGACY_PROJECT, () => {
          return HttpResponse.json({slug: STOREFRONT_ID, name: 'New Name'});
        }),
      );

      const result = await updateProjectWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        name: 'New Name',
      });

      expect(result.backend).to.equal('legacy');
      expect(result.project).to.deep.include({id: STOREFRONT_ID, name: 'New Name', backend: 'legacy'});
    });
  });

  describe('deleteProjectWithBackend', () => {
    it('deletes via SCAPI when preference is scapi', async () => {
      let called = false;
      server.use(
        http.delete(SCAPI_STOREFRONT, () => {
          called = true;
          return HttpResponse.json(scapiStorefront({setupStatus: 'delete_in_progress'}), {status: 202});
        }),
      );

      const result = await deleteProjectWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
      });

      expect(result.backend).to.equal('scapi');
      expect(called).to.equal(true);
      expect(result.raw).to.have.property('setupStatus', 'delete_in_progress');
    });

    it('explicit scapi surfaces errors without falling back to legacy', async () => {
      let legacyCalled = false;
      server.use(
        http.delete(SCAPI_STOREFRONT, () => {
          return HttpResponse.json(
            {title: 'Not Found', detail: 'not found'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
        http.delete(LEGACY_PROJECT, () => {
          legacyCalled = true;
          return new HttpResponse(null, {status: 204});
        }),
      );

      try {
        await deleteProjectWithBackend({
          preference: 'scapi',
          scapiConnection: scapiConn(),
          legacyAuth: new MockAuthStrategy(),
          projectSlug: STOREFRONT_ID,
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
        http.delete(LEGACY_PROJECT, () => {
          called = true;
          return new HttpResponse(null, {status: 204});
        }),
      );

      const result = await deleteProjectWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
      });

      expect(result.backend).to.equal('legacy');
      expect(called).to.equal(true);
    });
  });
});
