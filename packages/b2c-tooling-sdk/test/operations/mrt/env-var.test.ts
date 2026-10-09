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
  listEnvVars,
  setEnvVar,
  setEnvVars,
  deleteEnvVar,
  getEnvironmentVariablesScapi,
  updateEnvironmentVariablesScapi,
  listEnvVarsWithBackend,
  setEnvVarsWithBackend,
  setEnvVarWithBackend,
  deleteEnvVarWithBackend,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import type {ScapiMrtConnection} from '../../../src/operations/mrt/mrt-backend.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const DEFAULT_BASE_URL = DEFAULT_MRT_ORIGIN;

const SHORT_CODE = 'kv7kzm78';
const TENANT_ID = 'zzxy_prd';
const STOREFRONT_ID = 'my-project';
const ENVIRONMENT_ID = 'staging';
const SCAPI_BASE = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/storefront/environments/v1`;
const SCAPI_ENV_VARS = `${SCAPI_BASE}/organizations/:organizationId/storefronts/:storefrontId/environments/:environmentId/environment-variables`;
const LEGACY_ENV_VAR = `${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`;

function scapiConn(): ScapiMrtConnection {
  return {shortCode: SHORT_CODE, tenantId: TENANT_ID, auth: new MockAuthStrategy()};
}

describe('operations/mrt/env-var', () => {
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

  describe('listEnvVars', () => {
    it('lists environment variables with paginated format', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, () => {
          return HttpResponse.json({
            count: 2,
            next: null,
            previous: null,
            results: [
              {
                API_KEY: {
                  value: '***key',
                  created_by: 'user@example.com',
                  created_at: '2025-01-01T00:00:00Z',
                  updated_at: '2025-01-02T00:00:00Z',
                  updated_by: 'user@example.com',
                  publishing_status: 1,
                  publishing_status_description: 'published',
                },
              },
              {
                SECRET: {
                  value: '***ret',
                  created_by: 'admin@example.com',
                  created_at: '2025-01-03T00:00:00Z',
                  updated_at: '2025-01-03T00:00:00Z',
                  updated_by: 'admin@example.com',
                  publishing_status: 1,
                  publishing_status_description: 'published',
                },
              },
            ],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const result = await listEnvVars(
        {
          projectSlug: 'my-project',
          environment: 'staging',
        },
        auth,
      );

      expect(result.count).to.equal(2);
      expect(result.variables).to.have.length(2);
      expect(result.variables[0]).to.deep.include({
        name: 'API_KEY',
        value: '***key',
        createdBy: 'user@example.com',
      });
      expect(result.variables[1]).to.deep.include({
        name: 'SECRET',
        value: '***ret',
      });
    });

    it('lists environment variables with direct object format', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, () => {
          return HttpResponse.json({
            API_KEY: {
              value: '***key',
              created_by: 'user@example.com',
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-02T00:00:00Z',
              updated_by: 'user@example.com',
              publishing_status: 1,
              publishing_status_description: 'published',
            },
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const result = await listEnvVars(
        {
          projectSlug: 'my-project',
          environment: 'staging',
        },
        auth,
      );

      expect(result.variables).to.have.length(1);
      expect(result.variables[0].name).to.equal('API_KEY');
    });

    it('handles empty results', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, () => {
          return HttpResponse.json({
            count: 0,
            next: null,
            previous: null,
            results: [],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const result = await listEnvVars(
        {
          projectSlug: 'my-project',
          environment: 'staging',
        },
        auth,
      );

      expect(result.count).to.equal(0);
      expect(result.variables).to.have.length(0);
    });

    it('uses custom origin when provided', async () => {
      const customOrigin = 'https://custom.mobify.com';
      let requestedUrl = '';

      server.use(
        http.get(`${customOrigin}/api/projects/:projectSlug/target/:targetSlug/env-var/`, ({request}) => {
          requestedUrl = request.url;
          return HttpResponse.json({results: []});
        }),
      );

      const auth = new MockAuthStrategy();
      await listEnvVars(
        {
          projectSlug: 'my-project',
          environment: 'staging',
          origin: customOrigin,
        },
        auth,
      );

      expect(requestedUrl).to.include(customOrigin);
    });

    it('throws error on API failure', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, () => {
          return HttpResponse.json({detail: 'Project not found'}, {status: 404});
        }),
      );

      const auth = new MockAuthStrategy();

      try {
        await listEnvVars(
          {
            projectSlug: 'nonexistent',
            environment: 'staging',
          },
          auth,
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to list environment variables');
      }
    });
  });

  describe('setEnvVar', () => {
    it('sets a single environment variable', async () => {
      let receivedBody: unknown;

      server.use(
        http.patch(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, async ({request}) => {
          receivedBody = await request.json();
          return HttpResponse.json({}, {status: 200});
        }),
      );

      const auth = new MockAuthStrategy();
      await setEnvVar(
        {
          projectSlug: 'my-project',
          environment: 'staging',
          key: 'NEW_VAR',
          value: 'new-value',
        },
        auth,
      );

      expect(receivedBody).to.deep.equal({
        NEW_VAR: {value: 'new-value'},
      });
    });

    it('throws error on API failure', async () => {
      server.use(
        http.patch(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, () => {
          return HttpResponse.json({detail: 'Unauthorized'}, {status: 401});
        }),
      );

      const auth = new MockAuthStrategy();

      try {
        await setEnvVar(
          {
            projectSlug: 'my-project',
            environment: 'staging',
            key: 'VAR',
            value: 'value',
          },
          auth,
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to set environment variable');
      }
    });
  });

  describe('setEnvVars', () => {
    it('sets multiple environment variables', async () => {
      let receivedBody: unknown;

      server.use(
        http.patch(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, async ({request}) => {
          receivedBody = await request.json();
          return HttpResponse.json({}, {status: 200});
        }),
      );

      const auth = new MockAuthStrategy();
      await setEnvVars(
        {
          projectSlug: 'my-project',
          environment: 'staging',
          variables: {
            VAR1: 'value1',
            VAR2: 'value2',
            VAR3: 'value3',
          },
        },
        auth,
      );

      expect(receivedBody).to.deep.equal({
        VAR1: {value: 'value1'},
        VAR2: {value: 'value2'},
        VAR3: {value: 'value3'},
      });
    });

    it('throws error on API failure', async () => {
      server.use(
        http.patch(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, () => {
          return HttpResponse.json({detail: 'Invalid request'}, {status: 400});
        }),
      );

      const auth = new MockAuthStrategy();

      try {
        await setEnvVars(
          {
            projectSlug: 'my-project',
            environment: 'staging',
            variables: {VAR: 'value'},
          },
          auth,
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to set environment variables');
      }
    });
  });

  describe('deleteEnvVar', () => {
    it('deletes an environment variable by setting value to null', async () => {
      let receivedBody: unknown;

      server.use(
        http.patch(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, async ({request}) => {
          receivedBody = await request.json();
          return HttpResponse.json({}, {status: 200});
        }),
      );

      const auth = new MockAuthStrategy();
      await deleteEnvVar(
        {
          projectSlug: 'my-project',
          environment: 'staging',
          key: 'OLD_VAR',
        },
        auth,
      );

      expect(receivedBody).to.deep.equal({
        OLD_VAR: {value: null},
      });
    });

    it('throws error on API failure', async () => {
      server.use(
        http.patch(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/env-var/`, () => {
          return HttpResponse.json({detail: 'Variable not found'}, {status: 404});
        }),
      );

      const auth = new MockAuthStrategy();

      try {
        await deleteEnvVar(
          {
            projectSlug: 'my-project',
            environment: 'staging',
            key: 'NONEXISTENT',
          },
          auth,
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to delete environment variable');
      }
    });
  });

  // -------------------------------------------------------------------------
  // SCAPI MRT operations
  // -------------------------------------------------------------------------

  describe('getEnvironmentVariablesScapi', () => {
    it('maps the SCAPI map into normalized views with masked values', async () => {
      server.use(
        http.get(SCAPI_ENV_VARS, ({params}) => {
          expect(params.organizationId).to.equal('f_ecom_zzxy_prd');
          expect(params.storefrontId).to.equal(STOREFRONT_ID);
          expect(params.environmentId).to.equal(ENVIRONMENT_ID);
          return HttpResponse.json({
            API_KEY: {
              value: '****cret',
              createdBy: 'dev@example.com',
              creationDate: '2026-04-08T21:47:28.188965Z',
              lastModified: '2026-04-08T21:47:31.307595Z',
              lastModifiedBy: 'dev@example.com',
              publishingStatus: 'completed',
            },
            DEBUG: {
              value: '****lse',
              publishingStatus: 'pending',
            },
          });
        }),
      );

      const result = await getEnvironmentVariablesScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
      });

      expect(result.count).to.equal(2);
      const byName = Object.fromEntries(result.variables.map((v) => [v.name, v]));
      expect(byName.API_KEY).to.deep.equal({
        name: 'API_KEY',
        value: '****cret',
        status: 'completed',
        updatedAt: '2026-04-08T21:47:31.307595Z',
        updatedBy: 'dev@example.com',
        backend: 'scapi',
      });
      expect(byName.DEBUG).to.deep.include({name: 'DEBUG', value: '****lse', status: 'pending', backend: 'scapi'});
      expect(byName.DEBUG.updatedAt).to.be.undefined;
      // raw is the native SCAPI map surfaced verbatim for --json.
      expect(result.raw).to.have.property('API_KEY');
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.get(SCAPI_ENV_VARS, () => {
          return HttpResponse.json(
            {title: 'Not Found', detail: 'Environment staging not found'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await getEnvironmentVariablesScapi(scapiConn(), {storefrontId: STOREFRONT_ID, environmentId: ENVIRONMENT_ID});
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Environment staging not found');
        expect((error as {status?: number}).status).to.equal(404);
      }
    });
  });

  describe('updateEnvironmentVariablesScapi', () => {
    it('sends a merge-PATCH with only the given keys and treats 204 as success', async () => {
      let receivedBody: unknown;
      server.use(
        http.patch(SCAPI_ENV_VARS, async ({request}) => {
          receivedBody = await request.json();
          return new HttpResponse(null, {status: 204});
        }),
      );

      await updateEnvironmentVariablesScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        variables: {NEW_VAR: 'value'},
      });

      expect(receivedBody).to.deep.equal({NEW_VAR: {value: 'value'}});
    });

    it('sends a null value to delete a variable', async () => {
      let receivedBody: unknown;
      server.use(
        http.patch(SCAPI_ENV_VARS, async ({request}) => {
          receivedBody = await request.json();
          return new HttpResponse(null, {status: 204});
        }),
      );

      await updateEnvironmentVariablesScapi(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        variables: {OLD_VAR: null},
      });

      expect(receivedBody).to.deep.equal({OLD_VAR: {value: null}});
    });

    it('throws a ScapiRequestError on a non-2xx response', async () => {
      server.use(
        http.patch(SCAPI_ENV_VARS, () => {
          return HttpResponse.json(
            {title: 'Forbidden', detail: 'Missing scope'},
            {status: 403, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      try {
        await updateEnvironmentVariablesScapi(scapiConn(), {
          storefrontId: STOREFRONT_ID,
          environmentId: ENVIRONMENT_ID,
          variables: {VAR: 'value'},
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Missing scope');
        expect((error as {status?: number}).status).to.equal(403);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Backend-aware wrappers (legacy ↔ SCAPI routing)
  // -------------------------------------------------------------------------

  describe('listEnvVarsWithBackend', () => {
    it('routes to SCAPI when preference is scapi', async () => {
      server.use(
        http.get(SCAPI_ENV_VARS, () => {
          return HttpResponse.json({API_KEY: {value: '****key', publishingStatus: 'completed'}});
        }),
      );

      const result = await listEnvVarsWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
      });

      expect(result.backend).to.equal('scapi');
      expect(result.count).to.equal(1);
      expect(result.variables[0]).to.deep.include({name: 'API_KEY', backend: 'scapi'});
      // SCAPI raw is the native map, keyed by name.
      expect(result.raw).to.have.property('API_KEY');
    });

    it('routes to legacy when preference is legacy and surfaces the legacy shape as raw', async () => {
      server.use(
        http.get(LEGACY_ENV_VAR, () => {
          return HttpResponse.json({
            count: 1,
            next: null,
            previous: null,
            results: [{API_KEY: {value: '***key', publishing_status_description: 'published'}}],
          });
        }),
      );

      const result = await listEnvVarsWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
      });

      expect(result.backend).to.equal('legacy');
      expect(result.variables[0]).to.deep.include({name: 'API_KEY', backend: 'legacy', status: 'published'});
      // Legacy raw preserves the pre-split ListEnvVarsResult shape for --json.
      expect(result.raw).to.have.property('count', 1);
      expect(result.raw).to.have.property('variables');
      expect(result.raw).to.not.have.property('API_KEY');
    });

    it('auto falls back from SCAPI to legacy on a safe error', async () => {
      const fallbacks: string[] = [];
      server.use(
        http.get(SCAPI_ENV_VARS, () => {
          return HttpResponse.json(
            {title: 'Not Found', detail: 'not found'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
        http.get(LEGACY_ENV_VAR, () => {
          return HttpResponse.json({count: 1, results: [{API_KEY: {value: '***key'}}]});
        }),
      );

      const result = await listEnvVarsWithBackend({
        preference: 'auto',
        scapiConnection: scapiConn(),
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        onFallback: (reason) => fallbacks.push(reason),
      });

      expect(result.backend).to.equal('legacy');
      expect(result.variables[0]).to.deep.include({name: 'API_KEY', backend: 'legacy'});
      expect(fallbacks).to.have.length(1);
    });

    it('auto uses legacy when no SCAPI connection is configured', async () => {
      server.use(
        http.get(LEGACY_ENV_VAR, () => {
          return HttpResponse.json({count: 0, results: []});
        }),
      );

      const result = await listEnvVarsWithBackend({
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
        await listEnvVarsWithBackend({
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

  describe('setEnvVarsWithBackend / setEnvVarWithBackend', () => {
    it('sets multiple variables via a SCAPI merge-PATCH', async () => {
      let receivedBody: unknown;
      server.use(
        http.patch(SCAPI_ENV_VARS, async ({request}) => {
          receivedBody = await request.json();
          return new HttpResponse(null, {status: 204});
        }),
      );

      const result = await setEnvVarsWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        variables: {VAR1: 'value1', VAR2: 'value2'},
      });

      expect(result.backend).to.equal('scapi');
      expect(receivedBody).to.deep.equal({VAR1: {value: 'value1'}, VAR2: {value: 'value2'}});
    });

    it('sets a single variable via a SCAPI merge-PATCH', async () => {
      let receivedBody: unknown;
      server.use(
        http.patch(SCAPI_ENV_VARS, async ({request}) => {
          receivedBody = await request.json();
          return new HttpResponse(null, {status: 204});
        }),
      );

      const result = await setEnvVarWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        key: 'API_KEY',
        value: 'secret',
      });

      expect(result.backend).to.equal('scapi');
      expect(receivedBody).to.deep.equal({API_KEY: {value: 'secret'}});
    });

    it('routes writes to the legacy backend when preference is legacy', async () => {
      let receivedBody: unknown;
      server.use(
        http.patch(LEGACY_ENV_VAR, async ({request}) => {
          receivedBody = await request.json();
          return HttpResponse.json({}, {status: 200});
        }),
      );

      const result = await setEnvVarsWithBackend({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        variables: {VAR1: 'value1'},
      });

      expect(result.backend).to.equal('legacy');
      expect(receivedBody).to.deep.equal({VAR1: {value: 'value1'}});
    });
  });

  describe('deleteEnvVarWithBackend', () => {
    it('deletes a variable via a SCAPI merge-PATCH with a null value', async () => {
      let receivedBody: unknown;
      server.use(
        http.patch(SCAPI_ENV_VARS, async ({request}) => {
          receivedBody = await request.json();
          return new HttpResponse(null, {status: 204});
        }),
      );

      const result = await deleteEnvVarWithBackend({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        projectSlug: STOREFRONT_ID,
        environment: ENVIRONMENT_ID,
        key: 'OLD_VAR',
      });

      expect(result.backend).to.equal('scapi');
      expect(receivedBody).to.deep.equal({OLD_VAR: {value: null}});
    });

    it('explicit scapi surfaces errors without falling back to legacy', async () => {
      let legacyCalled = false;
      server.use(
        http.patch(SCAPI_ENV_VARS, () => {
          return HttpResponse.json(
            {title: 'Not Found', detail: 'not found'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
        http.patch(LEGACY_ENV_VAR, () => {
          legacyCalled = true;
          return HttpResponse.json({}, {status: 200});
        }),
      );

      try {
        await deleteEnvVarWithBackend({
          preference: 'scapi',
          scapiConnection: scapiConn(),
          legacyAuth: new MockAuthStrategy(),
          projectSlug: STOREFRONT_ID,
          environment: ENVIRONMENT_ID,
          key: 'OLD_VAR',
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as {status?: number}).status).to.equal(404);
      }
      expect(legacyCalled).to.equal(false);
    });
  });
});
