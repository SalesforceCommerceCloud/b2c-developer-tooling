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
import {createEnv, getEnv, deleteEnv, waitForEnv} from '../../../src/operations/mrt/env.js';

const DEFAULT_BASE_URL = DEFAULT_MRT_ORIGIN;

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
    it('should return immediately when environment is ACTIVE', async () => {
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
          pollInterval: 100,
        },
        auth,
      );

      expect(result.state).to.equal('ACTIVE');
    });

    it('should poll until environment becomes ACTIVE', async function () {
      this.timeout(5000);

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
          pollInterval: 100,
        },
        auth,
      );

      expect(result.state).to.equal('ACTIVE');
      expect(callCount).to.be.greaterThanOrEqual(3);
    });

    it('should call onPoll callback', async function () {
      this.timeout(5000);

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
      await waitForEnv(
        {
          projectSlug: 'my-project',
          slug: 'staging',
          pollInterval: 100,
          onPoll: (env) => {
            pollUpdates.push(env);
          },
        },
        auth,
      );

      expect(pollUpdates.length).to.be.greaterThan(0);
      expect(pollUpdates[0].slug).to.equal('staging');
    });

    it('should timeout after specified duration', async function () {
      this.timeout(5000);

      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/target/:targetSlug/`, () => {
          return HttpResponse.json({
            slug: 'staging',
            state: 'CREATING',
          });
        }),
      );

      const auth = new MockAuthStrategy();

      try {
        await waitForEnv(
          {
            projectSlug: 'my-project',
            slug: 'staging',
            pollInterval: 100,
            timeout: 500,
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
            pollInterval: 100,
          },
          auth,
        );
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('creation failed');
      }
    });
  });
});
