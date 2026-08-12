/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {DEFAULT_MRT_ORIGIN} from '../../../src/clients/mrt.js';
import {createDeployment} from '../../../src/operations/mrt/deployment.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const DEFAULT_BASE_URL = DEFAULT_MRT_ORIGIN;

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
});
