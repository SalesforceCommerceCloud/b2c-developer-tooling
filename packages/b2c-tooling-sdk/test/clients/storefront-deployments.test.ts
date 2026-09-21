/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createStorefrontDeploymentsClient, STOREFRONT_DEPLOYMENTS_CASCADE} from '@salesforce/b2c-tooling-sdk/clients';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const SHORT_CODE = 'kv7kzm78';
const TENANT_ID = 'zzxy_prd';
const ORGANIZATION_ID = 'f_ecom_zzxy_prd';
const STOREFRONT_ID = 'my-storefront';
const ENVIRONMENT_ID = 'production';
const BASE_URL = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/storefront/deployments/v1`;
const DEPLOYMENTS_PATH = `${BASE_URL}/organizations/:organizationId/storefronts/:storefrontId/environments/:environmentId/deployments`;

describe('clients/storefront-deployments', () => {
  describe('createStorefrontDeploymentsClient', () => {
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

    it('creates a client with the correct base URL and bearer auth', async () => {
      server.use(
        http.get(DEPLOYMENTS_PATH, ({request, params}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          expect(params.organizationId).to.equal(ORGANIZATION_ID);
          expect(params.storefrontId).to.equal(STOREFRONT_ID);
          expect(params.environmentId).to.equal(ENVIRONMENT_ID);
          return HttpResponse.json({limit: 25, offset: 0, total: 0, data: []});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createStorefrontDeploymentsClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data, error} = await client.GET(
        '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/deployments',
        {
          params: {
            path: {organizationId: ORGANIZATION_ID, storefrontId: STOREFRONT_ID, environmentId: ENVIRONMENT_ID},
          },
        },
      );

      expect(error).to.be.undefined;
      expect(data?.data).to.deep.equal([]);
    });

    it('lists deployments for an environment', async () => {
      server.use(
        http.get(DEPLOYMENTS_PATH, () => {
          return HttpResponse.json({
            limit: 25,
            offset: 0,
            total: 1,
            data: [
              {
                deploymentId: 'b035a4d7-ec6b-4dcd-af8f-3a847b10fed8',
                status: 'finished',
                deploymentType: 'publish',
                creationDate: '2026-04-08T21:47:31.322339Z',
                createdBy: 'dev@example.com',
                bundle: {bundleId: 170, description: 'my bundle'},
              },
            ],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createStorefrontDeploymentsClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data} = await client.GET(
        '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/deployments',
        {
          params: {
            path: {organizationId: ORGANIZATION_ID, storefrontId: STOREFRONT_ID, environmentId: ENVIRONMENT_ID},
          },
        },
      );

      expect(data?.total).to.equal(1);
      expect(data?.data).to.have.length(1);
      expect(data?.data?.[0]?.deploymentId).to.equal('b035a4d7-ec6b-4dcd-af8f-3a847b10fed8');
      expect(data?.data?.[0]?.status).to.equal('finished');
      expect(data?.data?.[0]?.bundle?.bundleId).to.equal(170);
    });

    it('creates a deployment for an environment', async () => {
      server.use(
        http.post(DEPLOYMENTS_PATH, async ({request}) => {
          const body = (await request.json()) as {bundleId: number};
          expect(body.bundleId).to.equal(170);
          return HttpResponse.json(
            {
              deploymentId: '11111111-2222-3333-4444-555555555555',
              status: 'queued',
              deploymentType: 'publish',
              statusMessage: 'Queueing Bundle',
              bundle: {bundleId: 170},
            },
            {status: 202},
          );
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createStorefrontDeploymentsClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data, error} = await client.POST(
        '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/deployments',
        {
          params: {
            path: {organizationId: ORGANIZATION_ID, storefrontId: STOREFRONT_ID, environmentId: ENVIRONMENT_ID},
          },
          body: {bundleId: 170},
        },
      );

      expect(error).to.be.undefined;
      expect(data?.deploymentId).to.equal('11111111-2222-3333-4444-555555555555');
      expect(data?.status).to.equal('queued');
    });

    it('handles RFC 7807 API errors', async () => {
      server.use(
        http.post(DEPLOYMENTS_PATH, () => {
          return HttpResponse.json(
            {
              title: 'Not Found',
              type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/not-found',
              detail: 'Bundle 999 not found',
            },
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createStorefrontDeploymentsClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data, error} = await client.POST(
        '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/deployments',
        {
          params: {
            path: {organizationId: ORGANIZATION_ID, storefrontId: STOREFRONT_ID, environmentId: ENVIRONMENT_ID},
          },
          body: {bundleId: 999},
        },
      );

      expect(data).to.be.undefined;
      expect(error).to.have.property('title', 'Not Found');
      expect(error).to.have.property('detail', 'Bundle 999 not found');
    });
  });

  describe('STOREFRONT_DEPLOYMENTS_CASCADE', () => {
    it('reads accept rw or ro; writes require rw', () => {
      expect(STOREFRONT_DEPLOYMENTS_CASCADE).to.deep.equal({
        read: [['sfcc.storefront.deployments.rw'], ['sfcc.storefront.deployments']],
        write: [['sfcc.storefront.deployments.rw']],
      });
    });
  });
});
