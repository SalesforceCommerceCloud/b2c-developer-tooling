/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {DEFAULT_MRT_ORIGIN} from '../../../src/clients/mrt.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';
import {
  createEnv,
  getEnv,
  deleteEnv,
  waitForEnv,
  cloneEnv,
  getEnvironmentsScapi,
  createEnvironmentScapi,
  cloneEnvironmentScapi,
  getEnvironmentByIdScapi,
  updateEnvironmentScapi,
  deleteEnvironmentScapi,
  setPrimaryEnvironmentScapi,
  createCacheInvalidationScapi,
  listEnvironmentsWithBackend,
  createEnvironmentWithBackend,
  cloneEnvironmentWithBackend,
  getEnvironmentWithBackend,
  updateEnvironmentWithBackend,
  deleteEnvironmentWithBackend,
  setPrimaryEnvironmentWithBackend,
  invalidateCacheWithBackend,
} from '../../../src/operations/mrt/env.js';
import type {ScapiMrtConnection} from '../../../src/operations/mrt/mrt-backend.js';

const DEFAULT_BASE_URL = DEFAULT_MRT_ORIGIN;

const SHORT_CODE = 'kv7kzm78';
const TENANT_ID = 'zzxy_prd';
const ORGANIZATION_ID = 'f_ecom_zzxy_prd';
const STOREFRONT_ID = 'my-project';
const ENVIRONMENT_ID = 'staging';
const SOURCE_ENVIRONMENT_ID = 'production';

const SCAPI_BASE = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/storefront/environments/v1`;
const SCAPI_ENVIRONMENTS = `${SCAPI_BASE}/organizations/:organizationId/storefronts/:storefrontId/environments`;
const SCAPI_ENVIRONMENT = `${SCAPI_ENVIRONMENTS}/:environmentId`;
const SCAPI_CLONE = `${SCAPI_ENVIRONMENTS}/clone`;
const SCAPI_PRIMARY = `${SCAPI_ENVIRONMENT}/primary`;
const SCAPI_CACHE = `${SCAPI_ENVIRONMENT}/cache-invalidations`;
const LEGACY_TARGETS = `${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/`;
const LEGACY_TARGET = `${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/`;
const LEGACY_CLONE = `${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/clone/`;
const LEGACY_INVALIDATION = `${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/invalidation/`;

function scapiConn(): ScapiMrtConnection {
  return {shortCode: SHORT_CODE, tenantId: TENANT_ID, auth: new MockAuthStrategy()};
}

/** A full legacy MRT target row as the Cloud API returns it. */
function legacyTarget(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    slug: ENVIRONMENT_ID,
    name: 'Staging Environment',
    state: 'ready',
    ssr_region: 'us-east-1',
    ssr_architecture: 'arm64',
    is_production: false,
    ...overrides,
  };
}

/** A full SCAPI environment object as the Environments API returns it. */
function scapiEnvironment(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    environmentId: ENVIRONMENT_ID,
    displayName: 'Staging Environment',
    status: 'ready',
    isPrimary: false,
    ssrRegion: 'us-east-1',
    ssrArchitecture: 'arm64',
    isProduction: false,
    mrtOrigin: 'https://origin.example.com',
    creationDate: '2026-04-08T21:47:28.188965Z',
    lastModified: '2026-04-09T10:00:00Z',
    ...overrides,
  };
}

describe('operations/mrt/env', () => {
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

  describe('createEnv', () => {
    it('should create an environment with minimal options', async () => {
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/`, async ({request}) => {
          const body = (await request.json()) as any;
          return HttpResponse.json({
            slug: body.slug,
            name: body.name,
            state: 'creating',
            created_at: '2025-01-01T00:00:00Z',
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const result = await createEnv(
        {
          projectSlug: 'my-project',
          slug: 'staging',
          name: 'Staging Environment',
        },
        auth,
      );

      expect(result.slug).to.equal('staging');
      expect(result.name).to.equal('Staging Environment');
      expect(result.state).to.equal('creating');
    });

    it('should create an environment with all options', async () => {
      let receivedBody: any;

      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/`, async ({request}) => {
          receivedBody = await request.json();
          return HttpResponse.json({
            slug: receivedBody.slug,
            name: receivedBody.name,
            state: 'CREATING',
            is_production: receivedBody.is_production,
            ssr_region: receivedBody.ssr_region,
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const result = await createEnv(
        {
          projectSlug: 'my-project',
          slug: 'production',
          name: 'Production Environment',
          region: 'us-east-1',
          isProduction: true,
          hostname: '*.example.com',
          externalHostname: 'www.example.com',
          externalDomain: 'example.com',
          allowCookies: true,
          enableSourceMaps: false,
          logLevel: 'INFO',
          whitelistedIps: '192.168.1.0/24',
          proxyConfigs: [
            {
              path: 'api',
              host: 'api.example.com',
            },
          ],
        },
        auth,
      );

      expect(result.slug).to.equal('production');
      expect(result.is_production).to.be.true;
      expect(receivedBody.ssr_region).to.equal('us-east-1');
      expect(receivedBody.hostname).to.equal('*.example.com');
      expect(receivedBody.ssr_external_hostname).to.equal('www.example.com');
      expect(receivedBody.ssr_proxy_configs).to.have.lengthOf(1);
    });

    it('should handle API errors', async () => {
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/`, () => {
          return HttpResponse.json({error: 'Environment already exists'}, {status: 400});
        }),
      );

      const auth = new MockAuthStrategy();

      try {
        await createEnv(
          {
            projectSlug: 'my-project',
            slug: 'staging',
            name: 'Staging',
          },
          auth,
        );
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to create environment');
      }
    });
  });

  describe('getEnv', () => {
    it('should get a specific environment', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/`, () => {
          return HttpResponse.json({
            slug: 'staging',
            name: 'Staging Environment',
            state: 'ready',
            is_production: false,
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const result = await getEnv({projectSlug: 'my-project', slug: 'staging'}, auth);

      expect(result.slug).to.equal('staging');
      expect(result.name).to.equal('Staging Environment');
      expect(result.state).to.equal('ready');
    });

    it('should handle 404 for non-existent environment', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/`, () => {
          return HttpResponse.json({error: 'Not found'}, {status: 404});
        }),
      );

      const auth = new MockAuthStrategy();

      try {
        await getEnv({projectSlug: 'my-project', slug: 'nonexistent'}, auth);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to get environment');
      }
    });
  });

  describe('deleteEnv', () => {
    it('should delete an environment', async () => {
      let deleteRequested = false;

      server.use(
        http.delete(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/`, () => {
          deleteRequested = true;
          return new HttpResponse(null, {status: 204});
        }),
      );

      const auth = new MockAuthStrategy();
      await deleteEnv({projectSlug: 'my-project', slug: 'staging'}, auth);

      expect(deleteRequested).to.be.true;
    });

    it('should handle delete errors', async () => {
      server.use(
        http.delete(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/`, () => {
          return HttpResponse.json({error: 'Cannot delete'}, {status: 400});
        }),
      );

      const auth = new MockAuthStrategy();

      try {
        await deleteEnv({projectSlug: 'my-project', slug: 'staging'}, auth);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to delete environment');
      }
    });
  });

  describe('waitForEnv', () => {
    const instantSleep = () => Promise.resolve();

    it('should return when environment is ACTIVE', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/`, () => {
          return HttpResponse.json({
            slug: 'staging',
            state: 'ACTIVE',
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const result = await waitForEnv(
        {
          projectSlug: 'my-project',
          slug: 'staging',
          pollIntervalSeconds: 1,
          sleep: instantSleep,
        },
        auth,
      );

      expect(result.state).to.equal('ACTIVE');
    });

    it('should poll until environment becomes ACTIVE', async () => {
      let callCount = 0;

      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/`, () => {
          callCount++;
          if (callCount < 3) {
            return HttpResponse.json({
              slug: 'staging',
              state: 'CREATING',
            });
          }
          return HttpResponse.json({
            slug: 'staging',
            state: 'ACTIVE',
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const result = await waitForEnv(
        {
          projectSlug: 'my-project',
          slug: 'staging',
          pollIntervalSeconds: 1,
          sleep: instantSleep,
        },
        auth,
      );

      expect(result.state).to.equal('ACTIVE');
      expect(callCount).to.be.greaterThanOrEqual(3);
    });

    it('should call onPoll callback with structured info', async () => {
      const pollUpdates: any[] = [];

      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/`, () => {
          return HttpResponse.json({
            slug: 'staging',
            state: 'ACTIVE',
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const result = await waitForEnv(
        {
          projectSlug: 'my-project',
          slug: 'staging',
          pollIntervalSeconds: 1,
          sleep: instantSleep,
          onPoll: (info) => {
            pollUpdates.push(info);
          },
        },
        auth,
      );

      expect(result.state).to.equal('ACTIVE');
      expect(pollUpdates.length).to.be.greaterThan(0);
      expect(pollUpdates[0]).to.have.property('slug', 'staging');
      expect(pollUpdates[0]).to.have.property('elapsedSeconds').that.is.a('number');
      expect(pollUpdates[0]).to.have.property('state', 'ACTIVE');
    });

    it('should timeout after specified duration', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/`, () => {
          return HttpResponse.json({
            slug: 'staging',
            state: 'CREATING',
          });
        }),
      );

      const auth = new MockAuthStrategy();

      // Virtual clock that advances by 1s on every call to simulate timeout without real waiting.
      let virtualNow = 0;
      const fakeNow = () => {
        virtualNow += 1000;
        return virtualNow;
      };

      try {
        await waitForEnv(
          {
            projectSlug: 'my-project',
            slug: 'staging',
            pollIntervalSeconds: 1,
            timeoutSeconds: 1,
            sleep: instantSleep,
            now: fakeNow,
          },
          auth,
        );
        expect.fail('Should have thrown timeout error');
      } catch (error: any) {
        expect(error.message).to.include('Timeout');
      }
    });

    it('should throw error when environment enters CREATE_FAILED state', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/`, () => {
          return HttpResponse.json({
            slug: 'staging',
            state: 'CREATE_FAILED',
          });
        }),
      );

      const auth = new MockAuthStrategy();

      try {
        await waitForEnv(
          {
            projectSlug: 'my-project',
            slug: 'staging',
            pollIntervalSeconds: 1,
            sleep: instantSleep,
          },
          auth,
        );
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('creation failed');
      }
    });

    it('should throw error when environment enters PUBLISH_FAILED state', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/`, () => {
          return HttpResponse.json({
            slug: 'staging',
            state: 'PUBLISH_FAILED',
          });
        }),
      );

      const auth = new MockAuthStrategy();

      try {
        await waitForEnv(
          {
            projectSlug: 'my-project',
            slug: 'staging',
            pollIntervalSeconds: 1,
            sleep: instantSleep,
          },
          auth,
        );
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('publish failed');
      }
    });
  });

  describe('cloneEnv', () => {
    it('should clone an environment and return the new target', async () => {
      let receivedBody: any;
      let receivedPath: string | undefined;

      server.use(
        http.post(
          `${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/clone/`,
          async ({request, params}) => {
            receivedBody = await request.json();
            receivedPath = `${params.projectSlug}/${params.targetSlug}`;
            return HttpResponse.json(
              {slug: params.targetSlug, name: 'Staging Copy', state: 'CREATE_IN_PROGRESS'},
              {status: 201},
            );
          },
        ),
      );

      const auth = new MockAuthStrategy();
      const result = await cloneEnv(
        {
          projectSlug: 'my-project',
          slug: 'staging-copy',
          fromSlug: 'staging',
          cloneRedirects: true,
          cloneEnvironmentVariables: true,
        },
        auth,
      );

      expect(receivedPath).to.equal('my-project/staging-copy');
      expect(receivedBody.from_target_slug).to.equal('staging');
      expect(receivedBody.clone_redirects).to.be.true;
      expect(receivedBody.clone_environment_variables).to.be.true;
      expect(receivedBody.clone_b2c_target_info).to.be.false;
      expect(result.slug).to.equal('staging-copy');
      expect(result.state).to.equal('CREATE_IN_PROGRESS');
    });

    it('should pass through custom domain options', async () => {
      let receivedBody: any;

      server.use(
        http.post(
          `${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/clone/`,
          async ({request, params}) => {
            receivedBody = await request.json();
            return HttpResponse.json({slug: params.targetSlug, name: 'qa', state: 'CREATE_IN_PROGRESS'}, {status: 201});
          },
        ),
      );

      const auth = new MockAuthStrategy();
      await cloneEnv(
        {
          projectSlug: 'my-project',
          slug: 'qa',
          fromSlug: 'staging',
          externalHostname: 'qa.example.com',
          externalDomain: 'example.com',
          certificateId: 123,
        },
        auth,
      );

      expect(receivedBody.ssr_external_hostname).to.equal('qa.example.com');
      expect(receivedBody.ssr_external_domain).to.equal('example.com');
      expect(receivedBody.certificate_id).to.equal(123);
    });

    it('should throw on API error', async () => {
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/clone/`, () =>
          HttpResponse.json({message: 'Source target not found'}, {status: 404}),
        ),
      );

      const auth = new MockAuthStrategy();
      try {
        await cloneEnv({projectSlug: 'p', slug: 's', fromSlug: 'missing'}, auth);
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('clone environment');
      }
    });
  });

  // -------------------------------------------------------------------------
  // SCAPI MRT environment operations
  // -------------------------------------------------------------------------

  describe('getEnvironmentsScapi', () => {
    it('maps the SCAPI envelope into normalized views and forwards pagination', async () => {
      server.use(
        http.get(SCAPI_ENVIRONMENTS, ({params, request}) => {
          expect(params.organizationId).to.equal(ORGANIZATION_ID);
          expect(params.storefrontId).to.equal(STOREFRONT_ID);
          const url = new URL(request.url);
          expect(url.searchParams.get('limit')).to.equal('10');
          expect(url.searchParams.get('offset')).to.equal('5');
          return HttpResponse.json({limit: 10, offset: 5, total: 1, data: [scapiEnvironment()]});
        }),
      );

      const result = await getEnvironmentsScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        limit: 10,
        offset: 5,
      });

      expect(result.count).to.equal(1);
      expect(result.environments[0]).to.deep.equal({
        id: ENVIRONMENT_ID,
        name: 'Staging Environment',
        status: 'ready',
        isPrimary: false,
        region: 'us-east-1',
        architecture: 'arm64',
        isProduction: false,
        origin: 'https://origin.example.com',
        createdAt: '2026-04-08T21:47:28.188965Z',
        updatedAt: '2026-04-09T10:00:00Z',
        backend: 'scapi',
      });
      // raw is the native SCAPI envelope surfaced verbatim for --json.
      expect(result.raw).to.have.property('total', 1);
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.get(SCAPI_ENVIRONMENTS, () => {
          return HttpResponse.json(
            {title: 'Not Found', detail: 'Storefront my-project not found'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await getEnvironmentsScapi(scapiConn(), {storefrontId: STOREFRONT_ID});
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('Storefront my-project not found');
        expect(error.status).to.equal(404);
      }
    });
  });

  describe('createEnvironmentScapi', () => {
    it('posts the display name only and normalizes the 202 response', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(SCAPI_ENVIRONMENTS, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(scapiEnvironment({status: 'building'}), {status: 202});
        }),
      );

      const result = await createEnvironmentScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        displayName: 'Staging Environment',
      });

      expect(receivedBody).to.deep.equal({displayName: 'Staging Environment'});
      expect(result.environment).to.deep.include({id: ENVIRONMENT_ID, status: 'building', backend: 'scapi'});
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.post(SCAPI_ENVIRONMENTS, () => {
          return HttpResponse.json(
            {title: 'Bad Request', detail: 'displayName is invalid'},
            {status: 400, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await createEnvironmentScapi(scapiConn(), {storefrontId: STOREFRONT_ID, displayName: ''});
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('displayName is invalid');
        expect(error.status).to.equal(400);
      }
    });
  });

  describe('cloneEnvironmentScapi', () => {
    it('includes clone flags in the body only when defined', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(SCAPI_CLONE, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(scapiEnvironment({environmentId: 'staging-copy', status: 'building'}), {
            status: 202,
          });
        }),
      );

      const result = await cloneEnvironmentScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        sourceEnvironmentId: SOURCE_ENVIRONMENT_ID,
        displayName: 'Staging Copy',
        cloneRedirects: true,
      });

      // cloneEnvironmentVariables / cloneB2cTargetInfo were undefined, so omitted.
      expect(receivedBody).to.deep.equal({
        sourceEnvironmentId: SOURCE_ENVIRONMENT_ID,
        displayName: 'Staging Copy',
        cloneRedirects: true,
      });
      expect(result.environment).to.deep.include({id: 'staging-copy', backend: 'scapi'});
    });
  });

  describe('getEnvironmentByIdScapi', () => {
    it('gets a single environment by ID', async () => {
      server.use(
        http.get(SCAPI_ENVIRONMENT, ({params}) => {
          expect(params.environmentId).to.equal(ENVIRONMENT_ID);
          return HttpResponse.json(scapiEnvironment());
        }),
      );

      const result = await getEnvironmentByIdScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
      });

      expect(result.environment).to.deep.include({id: ENVIRONMENT_ID, name: 'Staging Environment', backend: 'scapi'});
    });
  });

  describe('updateEnvironmentScapi', () => {
    it('patches only the supplied fields', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.patch(SCAPI_ENVIRONMENT, async ({request, params}) => {
          expect(params.environmentId).to.equal(ENVIRONMENT_ID);
          receivedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(scapiEnvironment({displayName: 'Renamed'}));
        }),
      );

      const result = await updateEnvironmentScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        changes: {displayName: 'Renamed'},
      });

      expect(receivedBody).to.deep.equal({displayName: 'Renamed'});
      expect(result.environment).to.deep.include({id: ENVIRONMENT_ID, name: 'Renamed', backend: 'scapi'});
    });
  });

  describe('deleteEnvironmentScapi', () => {
    it('normalizes the 202 (environment in deleting status) response', async () => {
      server.use(
        http.delete(SCAPI_ENVIRONMENT, ({params}) => {
          expect(params.environmentId).to.equal(ENVIRONMENT_ID);
          return HttpResponse.json(scapiEnvironment({status: 'deleting'}), {status: 202});
        }),
      );

      const result = await deleteEnvironmentScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
      });

      expect(result.environment).to.deep.include({id: ENVIRONMENT_ID, status: 'deleting', backend: 'scapi'});
    });

    it('treats a 204 No Content as success (no environment body)', async () => {
      server.use(
        http.delete(SCAPI_ENVIRONMENT, () => {
          return new HttpResponse(null, {status: 204});
        }),
      );

      const result = await deleteEnvironmentScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
      });

      expect(result.environment).to.equal(undefined);
      expect(result.raw).to.equal(null);
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.delete(SCAPI_ENVIRONMENT, () => {
          return HttpResponse.json(
            {title: 'Conflict', detail: 'Cannot delete the primary environment'},
            {status: 409, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await deleteEnvironmentScapi(scapiConn(), {storefrontId: STOREFRONT_ID, environmentId: ENVIRONMENT_ID});
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.status).to.equal(409);
      }
    });
  });

  describe('setPrimaryEnvironmentScapi', () => {
    it('PUTs to the primary sub-path and returns the environment', async () => {
      let called = false;
      server.use(
        http.put(SCAPI_PRIMARY, ({params}) => {
          called = true;
          expect(params.environmentId).to.equal(ENVIRONMENT_ID);
          return HttpResponse.json(scapiEnvironment({isPrimary: true}));
        }),
      );

      const result = await setPrimaryEnvironmentScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
      });

      expect(called).to.equal(true);
      expect(result.environment).to.deep.include({id: ENVIRONMENT_ID, isPrimary: true, backend: 'scapi'});
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.put(SCAPI_PRIMARY, () => {
          return HttpResponse.json(
            {title: 'Conflict', detail: 'Environment must be ready'},
            {status: 409, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await setPrimaryEnvironmentScapi(scapiConn(), {storefrontId: STOREFRONT_ID, environmentId: ENVIRONMENT_ID});
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.status).to.equal(409);
      }
    });
  });

  describe('createCacheInvalidationScapi', () => {
    it('posts the pattern and treats an empty 202 as success', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(SCAPI_CACHE, async ({request, params}) => {
          expect(params.environmentId).to.equal(ENVIRONMENT_ID);
          receivedBody = (await request.json()) as Record<string, unknown>;
          return new HttpResponse(null, {status: 202});
        }),
      );

      await createCacheInvalidationScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        pattern: '/*',
      });

      expect(receivedBody).to.deep.equal({pattern: '/*'});
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.post(SCAPI_CACHE, () => {
          return HttpResponse.json(
            {title: 'Bad Request', detail: 'pattern must start with /'},
            {status: 400, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await createCacheInvalidationScapi(scapiConn(), {
          storefrontId: STOREFRONT_ID,
          environmentId: ENVIRONMENT_ID,
          pattern: 'bad',
        });
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.status).to.equal(400);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Backend-aware wrappers (legacy ↔ SCAPI routing)
  // -------------------------------------------------------------------------

  describe('listEnvironmentsWithBackend', () => {
    it('routes to SCAPI when preference is scapi', async () => {
      server.use(
        http.get(SCAPI_ENVIRONMENTS, () => {
          return HttpResponse.json({limit: 25, offset: 0, total: 1, data: [scapiEnvironment()]});
        }),
      );

      const result = await listEnvironmentsWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
      });

      expect(result.backend).to.equal('scapi');
      expect(result.count).to.equal(1);
      expect(result.environments[0]).to.deep.include({id: ENVIRONMENT_ID, backend: 'scapi'});
      expect(result.raw).to.have.property('total', 1);
    });

    it('routes to legacy and surfaces the legacy shape as raw', async () => {
      server.use(
        http.get(LEGACY_TARGETS, () => {
          return HttpResponse.json({count: 1, results: [legacyTarget()]});
        }),
      );

      const result = await listEnvironmentsWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
      });

      expect(result.backend).to.equal('legacy');
      expect(result.environments[0]).to.deep.include({
        id: ENVIRONMENT_ID,
        name: 'Staging Environment',
        backend: 'legacy',
      });
      expect(result.raw).to.have.property('environments');
    });

    it('auto falls back from SCAPI to legacy on a safe error', async () => {
      const fallbacks: string[] = [];
      server.use(
        http.get(SCAPI_ENVIRONMENTS, () => {
          return HttpResponse.json(
            {title: 'Not Found', detail: 'not found'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
        http.get(LEGACY_TARGETS, () => {
          return HttpResponse.json({count: 1, results: [legacyTarget()]});
        }),
      );

      const result = await listEnvironmentsWithBackend({
        preference: 'auto',
        scapiConnection: scapiConn(),
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        onFallback: (reason) => fallbacks.push(reason),
      });

      expect(result.backend).to.equal('legacy');
      expect(fallbacks).to.have.length(1);
    });

    it('auto uses legacy when no SCAPI connection is configured', async () => {
      server.use(
        http.get(LEGACY_TARGETS, () => {
          return HttpResponse.json({count: 0, results: []});
        }),
      );

      const result = await listEnvironmentsWithBackend({
        preference: 'auto',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
      });

      expect(result.backend).to.equal('legacy');
      expect(result.count).to.equal(0);
    });

    it('explicit scapi with no SCAPI connection fails loud', async () => {
      try {
        await listEnvironmentsWithBackend({preference: 'scapi', projectSlug: STOREFRONT_ID});
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('SCAPI MRT backend requires');
      }
    });
  });

  describe('createEnvironmentWithBackend', () => {
    it('creates via SCAPI sending only the display name', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(SCAPI_ENVIRONMENTS, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(scapiEnvironment({status: 'building'}), {status: 202});
        }),
      );

      const result = await createEnvironmentWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        name: 'Staging Environment',
        // legacy-only fields are ignored by the SCAPI branch
        slug: ENVIRONMENT_ID,
        isProduction: true,
      });

      expect(result.backend).to.equal('scapi');
      expect(receivedBody).to.deep.equal({displayName: 'Staging Environment'});
      expect(result.environment).to.deep.include({id: ENVIRONMENT_ID, backend: 'scapi'});
    });

    it('creates via legacy forwarding the full configuration', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(LEGACY_TARGETS, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(legacyTarget({state: 'creating'}), {status: 201});
        }),
      );

      const result = await createEnvironmentWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        name: 'Staging Environment',
        slug: ENVIRONMENT_ID,
        isProduction: true,
      });

      expect(result.backend).to.equal('legacy');
      expect(receivedBody).to.include({slug: ENVIRONMENT_ID, is_production: true});
      expect(result.environment).to.deep.include({id: ENVIRONMENT_ID, backend: 'legacy'});
    });

    it('legacy create requires a slug', async () => {
      try {
        await createEnvironmentWithBackend({
          preference: 'legacy',
          legacyAuth: new MockAuthStrategy(),
          projectSlug: STOREFRONT_ID,
          name: 'Staging Environment',
        });
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('requires an environment slug');
      }
    });
  });

  describe('cloneEnvironmentWithBackend', () => {
    it('clones via SCAPI requiring a display name', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(SCAPI_CLONE, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(scapiEnvironment({environmentId: 'staging-copy', status: 'building'}), {
            status: 202,
          });
        }),
      );

      const result = await cloneEnvironmentWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        displayName: 'Staging Copy',
        sourceEnvironment: SOURCE_ENVIRONMENT_ID,
        cloneRedirects: true,
      });

      expect(result.backend).to.equal('scapi');
      expect(receivedBody).to.include({sourceEnvironmentId: SOURCE_ENVIRONMENT_ID, displayName: 'Staging Copy'});
      expect(result.environment).to.deep.include({id: 'staging-copy', backend: 'scapi'});
    });

    it('scapi clone requires a display name', async () => {
      try {
        await cloneEnvironmentWithBackend({
          preference: 'scapi',
          scapiConnection: scapiConn(),
          projectSlug: STOREFRONT_ID,
          sourceEnvironment: SOURCE_ENVIRONMENT_ID,
        });
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('requires a display name');
      }
    });

    it('clones via legacy requiring a slug', async () => {
      server.use(
        http.post(LEGACY_CLONE, ({params}) => {
          return HttpResponse.json(legacyTarget({slug: params.targetSlug, state: 'CREATE_IN_PROGRESS'}), {status: 201});
        }),
      );

      const result = await cloneEnvironmentWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        slug: 'staging-copy',
        sourceEnvironment: SOURCE_ENVIRONMENT_ID,
      });

      expect(result.backend).to.equal('legacy');
      expect(result.environment).to.deep.include({id: 'staging-copy', backend: 'legacy'});
    });
  });

  describe('getEnvironmentWithBackend', () => {
    it('gets via SCAPI', async () => {
      server.use(http.get(SCAPI_ENVIRONMENT, () => HttpResponse.json(scapiEnvironment())));

      const result = await getEnvironmentWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
      });

      expect(result.backend).to.equal('scapi');
      expect(result.environment).to.deep.include({id: ENVIRONMENT_ID, backend: 'scapi'});
    });

    it('gets via legacy', async () => {
      server.use(http.get(LEGACY_TARGET, () => HttpResponse.json(legacyTarget())));

      const result = await getEnvironmentWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
      });

      expect(result.backend).to.equal('legacy');
      expect(result.environment).to.deep.include({id: ENVIRONMENT_ID, backend: 'legacy'});
    });
  });

  describe('updateEnvironmentWithBackend', () => {
    it('updates the display name only via SCAPI', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.patch(SCAPI_ENVIRONMENT, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(scapiEnvironment({displayName: 'Renamed'}));
        }),
      );

      const result = await updateEnvironmentWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        name: 'Renamed',
        // legacy-only fields must not leak into the SCAPI body
        isProduction: true,
      });

      expect(result.backend).to.equal('scapi');
      expect(receivedBody).to.deep.equal({displayName: 'Renamed'});
    });

    it('scapi update requires a name', async () => {
      try {
        await updateEnvironmentWithBackend({
          preference: 'scapi',
          scapiConnection: scapiConn(),
          projectSlug: STOREFRONT_ID,
          environment: ENVIRONMENT_ID,
        });
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('display name');
      }
    });

    it('updates via legacy forwarding the full field set', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.patch(LEGACY_TARGET, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(legacyTarget({is_production: true}));
        }),
      );

      const result = await updateEnvironmentWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        isProduction: true,
      });

      expect(result.backend).to.equal('legacy');
      expect(receivedBody).to.include({is_production: true});
    });
  });

  describe('deleteEnvironmentWithBackend', () => {
    it('deletes via SCAPI', async () => {
      let called = false;
      server.use(
        http.delete(SCAPI_ENVIRONMENT, () => {
          called = true;
          return HttpResponse.json(scapiEnvironment({status: 'deleting'}), {status: 202});
        }),
      );

      const result = await deleteEnvironmentWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
      });

      expect(result.backend).to.equal('scapi');
      expect(called).to.equal(true);
    });

    it('explicit scapi surfaces errors without falling back to legacy', async () => {
      let legacyCalled = false;
      server.use(
        http.delete(SCAPI_ENVIRONMENT, () => {
          return HttpResponse.json(
            {title: 'Not Found', detail: 'not found'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
        http.delete(LEGACY_TARGET, () => {
          legacyCalled = true;
          return new HttpResponse(null, {status: 204});
        }),
      );

      try {
        await deleteEnvironmentWithBackend({
          preference: 'scapi',
          scapiConnection: scapiConn(),
          legacyAuth: new MockAuthStrategy(),
          projectSlug: STOREFRONT_ID,
          environment: ENVIRONMENT_ID,
        });
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.status).to.equal(404);
      }
      expect(legacyCalled).to.equal(false);
    });

    it('deletes via legacy', async () => {
      let called = false;
      server.use(
        http.delete(LEGACY_TARGET, () => {
          called = true;
          return new HttpResponse(null, {status: 204});
        }),
      );

      const result = await deleteEnvironmentWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
      });

      expect(result.backend).to.equal('legacy');
      expect(called).to.equal(true);
    });
  });

  describe('setPrimaryEnvironmentWithBackend', () => {
    it('sets the primary environment via SCAPI', async () => {
      server.use(http.put(SCAPI_PRIMARY, () => HttpResponse.json(scapiEnvironment({isPrimary: true}))));

      const result = await setPrimaryEnvironmentWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
      });

      expect(result.backend).to.equal('scapi');
      expect(result.environment).to.deep.include({id: ENVIRONMENT_ID, isPrimary: true, backend: 'scapi'});
    });

    it('is unsupported on the legacy backend', async () => {
      try {
        await setPrimaryEnvironmentWithBackend({
          preference: 'legacy',
          legacyAuth: new MockAuthStrategy(),
          projectSlug: STOREFRONT_ID,
          environment: ENVIRONMENT_ID,
        });
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('only supported on the SCAPI MRT backend');
      }
    });

    it('is unsupported when auto resolves to legacy (no SCAPI connection)', async () => {
      try {
        await setPrimaryEnvironmentWithBackend({
          preference: 'auto',
          legacyAuth: new MockAuthStrategy(),
          projectSlug: STOREFRONT_ID,
          environment: ENVIRONMENT_ID,
        });
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('only supported on the SCAPI MRT backend');
      }
    });
  });

  describe('invalidateCacheWithBackend', () => {
    it('invalidates via SCAPI and reports a null raw (empty 202)', async () => {
      let receivedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(SCAPI_CACHE, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, unknown>;
          return new HttpResponse(null, {status: 202});
        }),
      );

      const result = await invalidateCacheWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        pattern: '/*',
      });

      expect(result.backend).to.equal('scapi');
      expect(result.raw).to.equal(null);
      expect(receivedBody).to.deep.equal({pattern: '/*'});
    });

    it('invalidates via legacy and surfaces the legacy result as raw', async () => {
      server.use(
        http.post(LEGACY_INVALIDATION, () => {
          return HttpResponse.json({result: 'ok', slug: ENVIRONMENT_ID});
        }),
      );

      const result = await invalidateCacheWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        pattern: '/*',
      });

      expect(result.backend).to.equal('legacy');
      expect(result.raw).to.deep.include({result: 'ok', slug: ENVIRONMENT_ID});
    });
  });
});
