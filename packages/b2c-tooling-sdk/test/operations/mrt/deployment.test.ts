/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {DEFAULT_MRT_ORIGIN} from '../../../src/clients/mrt.js';
import {ScapiRequestError} from '../../../src/clients/scapi-backend-utils.js';
import {
  createDeployment,
  listScapiDeployments,
  createScapiDeployment,
  getScapiDeployment,
  waitForScapiDeployment,
  listMrtDeployments,
  deployMrtBundle,
  normalizeLegacyDeployment,
  normalizeScapiDeployment,
} from '../../../src/operations/mrt/deployment.js';
import type {ScapiMrtConnection} from '../../../src/operations/mrt/mrt-backend.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const DEFAULT_BASE_URL = DEFAULT_MRT_ORIGIN;

const SHORT_CODE = 'kv7kzm78';
const TENANT_ID = 'zzxy_prd';
const ORGANIZATION_ID = 'f_ecom_zzxy_prd';
const STOREFRONT_ID = 'my-project';
const ENVIRONMENT_ID = 'staging';
const SCAPI_BASE = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/storefront/deployments/v1`;
const SCAPI_DEPLOYMENTS = `${SCAPI_BASE}/organizations/:organizationId/storefronts/:storefrontId/environments/:environmentId/deployments`;
const SCAPI_DEPLOYMENT_BY_ID = `${SCAPI_DEPLOYMENTS}/:deploymentId`;
const LEGACY_DEPLOY = `${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/deploy/`;

function scapiConn(): ScapiMrtConnection {
  return {shortCode: SHORT_CODE, tenantId: TENANT_ID, auth: new MockAuthStrategy()};
}

const noSleep = async () => {};

describe('operations/mrt/deployment', () => {
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

  describe('createDeployment', () => {
    it('starts a deployment for an existing bundle', async () => {
      let receivedBody: {bundle_id?: number} | undefined;

      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/deploy/`, async ({request}) => {
          receivedBody = (await request.json()) as {bundle_id?: number};
          return HttpResponse.json({}, {status: 202});
        }),
      );

      const auth = new MockAuthStrategy();
      const result = await createDeployment({projectSlug: 'my-project', targetSlug: 'staging', bundleId: 123}, auth);

      expect(receivedBody?.bundle_id).to.equal(123);
      expect(result.bundleId).to.equal(123);
      expect(result.targetSlug).to.equal('staging');
      expect(result.status).to.equal('pending');
      expect(result.warnings).to.deep.equal([]);
    });

    it('returns warnings from the deploy response', async () => {
      const warning = 'x86 support ends January 31, 2027. Switch to ARM in environment settings to avoid disruptions';

      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/deploy/`, () => {
          return HttpResponse.json({warnings: [warning]}, {status: 202});
        }),
      );

      const auth = new MockAuthStrategy();
      const result = await createDeployment({projectSlug: 'my-project', targetSlug: 'staging', bundleId: 123}, auth);

      expect(result.warnings).to.deep.equal([warning]);
    });

    it('defaults warnings to [] when the response has no body', async () => {
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/deploy/`, () => {
          return new HttpResponse(null, {status: 204});
        }),
      );

      const auth = new MockAuthStrategy();
      const result = await createDeployment({projectSlug: 'my-project', targetSlug: 'staging', bundleId: 123}, auth);

      expect(result.warnings).to.deep.equal([]);
    });

    it('throws on deploy failure', async () => {
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/deploy/`, () => {
          return HttpResponse.json({message: 'Target not found'}, {status: 404});
        }),
      );

      const auth = new MockAuthStrategy();
      try {
        await createDeployment({projectSlug: 'my-project', targetSlug: 'invalid', bundleId: 123}, auth);
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to create deployment');
      }
    });
  });

  describe('normalizers', () => {
    it('normalizes a legacy deployment list item', () => {
      const view = normalizeLegacyDeployment({
        user: 'dev@example.com',
        bundle: {id: 170, message: 'my bundle'},
        created_at: '2026-04-08T21:47:31Z',
        status: 'Finished',
        deploy_type: 'Publish',
        duration: '76s',
      } as never);
      expect(view).to.deep.equal({
        bundleId: 170,
        bundleMessage: 'my bundle',
        status: 'Finished',
        deploymentType: 'Publish',
        creationDate: '2026-04-08T21:47:31Z',
        createdBy: 'dev@example.com',
        backend: 'legacy',
      });
    });

    it('normalizes a SCAPI deployment', () => {
      const view = normalizeScapiDeployment({
        deploymentId: 'b035a4d7-ec6b-4dcd-af8f-3a847b10fed8',
        status: 'finished',
        deploymentType: 'publish',
        creationDate: '2026-04-08T21:47:31Z',
        createdBy: 'dev@example.com',
        bundle: {bundleId: 170, description: 'my bundle'},
      });
      expect(view).to.deep.equal({
        deploymentId: 'b035a4d7-ec6b-4dcd-af8f-3a847b10fed8',
        bundleId: 170,
        bundleMessage: 'my bundle',
        status: 'finished',
        deploymentType: 'publish',
        creationDate: '2026-04-08T21:47:31Z',
        createdBy: 'dev@example.com',
        backend: 'scapi',
      });
    });
  });

  describe('listScapiDeployments', () => {
    it('lists and normalizes SCAPI deployments', async () => {
      server.use(
        http.get(SCAPI_DEPLOYMENTS, ({request, params}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          expect(params.organizationId).to.equal(ORGANIZATION_ID);
          expect(params.storefrontId).to.equal(STOREFRONT_ID);
          expect(params.environmentId).to.equal(ENVIRONMENT_ID);
          return HttpResponse.json({
            limit: 25,
            offset: 0,
            total: 1,
            data: [
              {
                deploymentId: 'dep-1',
                status: 'finished',
                deploymentType: 'publish',
                bundle: {bundleId: 170, description: 'my bundle'},
              },
            ],
          });
        }),
      );

      const result = await listScapiDeployments(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
      });

      expect(result.count).to.equal(1);
      expect(result.deployments).to.have.length(1);
      expect(result.deployments[0]).to.deep.include({deploymentId: 'dep-1', bundleId: 170, backend: 'scapi'});
    });

    it('forwards limit/offset as SCAPI pagination query params and reports the full total', async () => {
      let captured: URLSearchParams | undefined;
      server.use(
        http.get(SCAPI_DEPLOYMENTS, ({request}) => {
          captured = new URL(request.url).searchParams;
          return HttpResponse.json({limit: 50, offset: 100, total: 250, data: []});
        }),
      );

      const result = await listScapiDeployments(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        limit: 50,
        offset: 100,
      });

      expect(captured?.get('limit')).to.equal('50');
      expect(captured?.get('offset')).to.equal('100');
      expect(result.count).to.equal(250);
    });

    it('throws a ScapiRequestError carrying the status on failure', async () => {
      server.use(
        http.get(SCAPI_DEPLOYMENTS, () =>
          HttpResponse.json(
            {title: 'Forbidden', type: 'about:blank', detail: 'nope'},
            {status: 403, headers: {'Content-Type': 'application/problem+json'}},
          ),
        ),
      );

      let threw: unknown;
      try {
        await listScapiDeployments(scapiConn(), {storefrontId: STOREFRONT_ID, environmentId: ENVIRONMENT_ID});
      } catch (error) {
        threw = error;
      }
      expect(threw).to.be.instanceOf(ScapiRequestError);
      expect((threw as ScapiRequestError).status).to.equal(403);
    });
  });

  describe('createScapiDeployment', () => {
    it('queues a deployment and returns the deploymentId', async () => {
      server.use(
        http.post(SCAPI_DEPLOYMENTS, async ({request}) => {
          const body = (await request.json()) as {bundleId: number};
          expect(body.bundleId).to.equal(170);
          return HttpResponse.json({deploymentId: 'dep-xyz', status: 'queued', bundle: {bundleId: 170}}, {status: 202});
        }),
      );

      const result = await createScapiDeployment(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        bundleId: 170,
      });

      expect(result.deploymentId).to.equal('dep-xyz');
      expect(result.status).to.equal('queued');
      expect(result.bundleId).to.equal(170);
    });

    it('throws a ScapiRequestError with status 409 on conflict', async () => {
      server.use(
        http.post(SCAPI_DEPLOYMENTS, () =>
          HttpResponse.json(
            {title: 'Conflict', type: 'about:blank', detail: 'in progress'},
            {status: 409, headers: {'Content-Type': 'application/problem+json'}},
          ),
        ),
      );

      let threw: unknown;
      try {
        await createScapiDeployment(scapiConn(), {
          storefrontId: STOREFRONT_ID,
          environmentId: ENVIRONMENT_ID,
          bundleId: 170,
        });
      } catch (error) {
        threw = error;
      }
      expect(threw).to.be.instanceOf(ScapiRequestError);
      expect((threw as ScapiRequestError).status).to.equal(409);
    });
  });

  describe('getScapiDeployment', () => {
    it('fetches a single deployment by ID', async () => {
      server.use(
        http.get(SCAPI_DEPLOYMENT_BY_ID, ({params}) => {
          expect(params.deploymentId).to.equal('dep-1');
          return HttpResponse.json({deploymentId: 'dep-1', status: 'in_progress'});
        }),
      );

      const deployment = await getScapiDeployment(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        deploymentId: 'dep-1',
      });

      expect(deployment.deploymentId).to.equal('dep-1');
      expect(deployment.status).to.equal('in_progress');
    });
  });

  describe('waitForScapiDeployment', () => {
    it('polls by ID until the deployment finishes', async () => {
      let call = 0;
      server.use(
        http.get(SCAPI_DEPLOYMENT_BY_ID, () => {
          call += 1;
          return HttpResponse.json({
            deploymentId: 'dep-1',
            status: call === 1 ? 'in_progress' : 'finished',
            progress: {description: 'Updating CDN', percentage: call === 1 ? 40 : 100},
          });
        }),
      );

      const polls: string[] = [];
      const deployment = await waitForScapiDeployment(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        deploymentId: 'dep-1',
        pollIntervalSeconds: 1,
        timeoutSeconds: 600,
        sleep: noSleep,
        onPoll: (info) => polls.push(info.status),
      });

      expect(deployment.status).to.equal('finished');
      expect(polls).to.deep.equal(['in_progress', 'finished']);
    });

    it('polls immediately without an initial sleep (finishes on the first poll)', async () => {
      let getCalls = 0;
      server.use(
        http.get(SCAPI_DEPLOYMENT_BY_ID, () => {
          getCalls += 1;
          return HttpResponse.json({deploymentId: 'dep-1', status: 'finished'});
        }),
      );

      let sleepCalls = 0;
      const deployment = await waitForScapiDeployment(scapiConn(), {
        storefrontId: STOREFRONT_ID,
        environmentId: ENVIRONMENT_ID,
        deploymentId: 'dep-1',
        pollIntervalSeconds: 30,
        timeoutSeconds: 600,
        sleep: async () => {
          sleepCalls += 1;
        },
      });

      // The first poll runs before any sleep, so an already-finished deployment
      // returns at once instead of waiting a full poll interval.
      expect(deployment.status).to.equal('finished');
      expect(getCalls).to.equal(1);
      expect(sleepCalls).to.equal(0);
    });

    it('throws when the deployment fails, including the status message', async () => {
      server.use(
        http.get(SCAPI_DEPLOYMENT_BY_ID, () =>
          HttpResponse.json({deploymentId: 'dep-1', status: 'failed', statusMessage: 'build error'}),
        ),
      );

      let threw: unknown;
      try {
        await waitForScapiDeployment(scapiConn(), {
          storefrontId: STOREFRONT_ID,
          environmentId: ENVIRONMENT_ID,
          deploymentId: 'dep-1',
          sleep: noSleep,
        });
      } catch (error) {
        threw = error;
      }
      expect((threw as Error).message).to.include('build error');
    });

    it('throws on timeout without issuing a request', async () => {
      let nowCalls = 0;
      let threw: unknown;
      try {
        await waitForScapiDeployment(scapiConn(), {
          storefrontId: STOREFRONT_ID,
          environmentId: ENVIRONMENT_ID,
          deploymentId: 'dep-1',
          timeoutSeconds: 1,
          sleep: noSleep,
          now: () => (nowCalls++ === 0 ? 0 : 1_000_000),
        });
      } catch (error) {
        threw = error;
      }
      expect((threw as Error).message).to.include('Timeout waiting for deployment');
    });
  });

  describe('listMrtDeployments (backend-aware)', () => {
    it('routes to SCAPI when preference is scapi', async () => {
      server.use(
        http.get(SCAPI_DEPLOYMENTS, () =>
          HttpResponse.json({limit: 25, offset: 0, total: 1, data: [{deploymentId: 'dep-1', status: 'finished'}]}),
        ),
      );

      const result = await listMrtDeployments({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        targetSlug: ENVIRONMENT_ID,
      });

      expect(result.backend).to.equal('scapi');
      expect(result.deployments[0].deploymentId).to.equal('dep-1');
    });

    it('routes to legacy when preference is legacy', async () => {
      server.use(
        http.get(LEGACY_DEPLOY, () =>
          HttpResponse.json({
            count: 1,
            next: null,
            previous: null,
            results: [{bundle: {id: 5, message: 'legacy bundle'}, status: 'Finished', deploy_type: 'Publish'}],
          }),
        ),
      );

      const result = await listMrtDeployments({
        preference: 'legacy',
        scapiConnection: scapiConn(),
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        targetSlug: ENVIRONMENT_ID,
      });

      expect(result.backend).to.equal('legacy');
      expect(result.deployments[0]).to.deep.include({bundleId: 5, bundleMessage: 'legacy bundle', backend: 'legacy'});
    });

    it('auto falls back from SCAPI to legacy on a safe status', async () => {
      server.use(
        http.get(SCAPI_DEPLOYMENTS, () =>
          HttpResponse.json(
            {title: 'Not Found', type: 'about:blank', detail: 'no env'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          ),
        ),
        http.get(LEGACY_DEPLOY, () => HttpResponse.json({count: 0, next: null, previous: null, results: []})),
      );

      const fallbacks: string[] = [];
      const result = await listMrtDeployments({
        preference: 'auto',
        scapiConnection: scapiConn(),
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        targetSlug: ENVIRONMENT_ID,
        onFallback: (reason) => fallbacks.push(reason),
      });

      expect(result.backend).to.equal('legacy');
      expect(fallbacks).to.have.length(1);
    });
  });

  describe('deployMrtBundle (backend-aware)', () => {
    it('deploys via SCAPI and returns the deploymentId', async () => {
      server.use(
        http.post(SCAPI_DEPLOYMENTS, () =>
          HttpResponse.json({deploymentId: 'dep-xyz', status: 'queued'}, {status: 202}),
        ),
      );

      const result = await deployMrtBundle({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        targetSlug: ENVIRONMENT_ID,
        bundleId: 170,
      });

      expect(result.backend).to.equal('scapi');
      expect(result.deploymentId).to.equal('dep-xyz');
      expect(result.status).to.equal('queued');
    });

    it('deploys via legacy with no deploymentId', async () => {
      server.use(http.post(LEGACY_DEPLOY, () => HttpResponse.json({}, {status: 202})));

      const result = await deployMrtBundle({
        preference: 'legacy',
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        targetSlug: ENVIRONMENT_ID,
        bundleId: 170,
      });

      expect(result.backend).to.equal('legacy');
      expect(result.deploymentId).to.be.undefined;
    });

    it('auto falls back to legacy deploy on a safe SCAPI status', async () => {
      server.use(
        http.post(SCAPI_DEPLOYMENTS, () =>
          HttpResponse.json(
            {title: 'Bad Request', type: 'about:blank', detail: 'bad'},
            {status: 400, headers: {'Content-Type': 'application/problem+json'}},
          ),
        ),
        http.post(LEGACY_DEPLOY, () => HttpResponse.json({}, {status: 202})),
      );

      const result = await deployMrtBundle({
        preference: 'auto',
        scapiConnection: scapiConn(),
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        targetSlug: ENVIRONMENT_ID,
        bundleId: 170,
      });

      expect(result.backend).to.equal('legacy');
    });

    it('scapi mode surfaces a 409 conflict without falling back', async () => {
      server.use(
        http.post(SCAPI_DEPLOYMENTS, () =>
          HttpResponse.json(
            {title: 'Conflict', type: 'about:blank', detail: 'in progress'},
            {status: 409, headers: {'Content-Type': 'application/problem+json'}},
          ),
        ),
      );

      let threw: unknown;
      try {
        await deployMrtBundle({
          preference: 'scapi',
          scapiConnection: scapiConn(),
          legacyAuth: new MockAuthStrategy(),
          projectSlug: STOREFRONT_ID,
          targetSlug: ENVIRONMENT_ID,
          bundleId: 170,
        });
      } catch (error) {
        threw = error;
      }
      expect(threw).to.be.instanceOf(ScapiRequestError);
      expect((threw as ScapiRequestError).status).to.equal(409);
    });
  });
});
