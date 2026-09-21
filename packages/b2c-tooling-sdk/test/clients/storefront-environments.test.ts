/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createStorefrontEnvironmentsClient, STOREFRONT_ENVIRONMENTS_CASCADE} from '@salesforce/b2c-tooling-sdk/clients';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const SHORT_CODE = 'kv7kzm78';
const TENANT_ID = 'zzxy_prd';
const ORGANIZATION_ID = 'f_ecom_zzxy_prd';
const STOREFRONT_ID = 'my-storefront';
const ENVIRONMENT_ID = 'production';
const BASE_URL = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/storefront/environments/v1`;
const ENV_VARS_PATH = `${BASE_URL}/organizations/:organizationId/storefronts/:storefrontId/environments/:environmentId/environment-variables`;

const ENV_VARS_ENDPOINT =
  '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/environment-variables';

describe('clients/storefront-environments', () => {
  describe('createStorefrontEnvironmentsClient', () => {
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
        http.get(ENV_VARS_PATH, ({request, params}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          expect(params.organizationId).to.equal(ORGANIZATION_ID);
          expect(params.storefrontId).to.equal(STOREFRONT_ID);
          expect(params.environmentId).to.equal(ENVIRONMENT_ID);
          return HttpResponse.json({});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createStorefrontEnvironmentsClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data, error} = await client.GET(ENV_VARS_ENDPOINT, {
        params: {path: {organizationId: ORGANIZATION_ID, storefrontId: STOREFRONT_ID, environmentId: ENVIRONMENT_ID}},
      });

      expect(error).to.be.undefined;
      expect(data).to.deep.equal({});
    });

    it('gets environment variables as a masked map', async () => {
      server.use(
        http.get(ENV_VARS_PATH, () => {
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

      const auth = new MockAuthStrategy();
      const client = createStorefrontEnvironmentsClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data} = await client.GET(ENV_VARS_ENDPOINT, {
        params: {path: {organizationId: ORGANIZATION_ID, storefrontId: STOREFRONT_ID, environmentId: ENVIRONMENT_ID}},
      });

      expect(Object.keys(data ?? {})).to.have.members(['API_KEY', 'DEBUG']);
      expect(data?.API_KEY?.value).to.equal('****cret');
      expect(data?.API_KEY?.publishingStatus).to.equal('completed');
      expect(data?.DEBUG?.value).to.equal('****lse');
    });

    it('updates environment variables with a merge-PATCH and returns 204', async () => {
      let receivedBody: Record<string, {value: unknown}> | undefined;
      server.use(
        http.patch(ENV_VARS_PATH, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, {value: unknown}>;
          return new HttpResponse(null, {status: 204});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createStorefrontEnvironmentsClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {error, response} = await client.PATCH(ENV_VARS_ENDPOINT, {
        params: {path: {organizationId: ORGANIZATION_ID, storefrontId: STOREFRONT_ID, environmentId: ENVIRONMENT_ID}},
        body: {NEW_VAR: {value: 'value'}},
      });

      expect(error).to.be.undefined;
      expect(response.status).to.equal(204);
      // Only the explicitly-sent key is in the payload; omitted keys are preserved server-side.
      expect(receivedBody).to.deep.equal({NEW_VAR: {value: 'value'}});
    });

    it('deletes a variable by sending a null value', async () => {
      let receivedBody: Record<string, {value: unknown}> | undefined;
      server.use(
        http.patch(ENV_VARS_PATH, async ({request}) => {
          receivedBody = (await request.json()) as Record<string, {value: unknown}>;
          return new HttpResponse(null, {status: 204});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createStorefrontEnvironmentsClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {error, response} = await client.PATCH(ENV_VARS_ENDPOINT, {
        params: {path: {organizationId: ORGANIZATION_ID, storefrontId: STOREFRONT_ID, environmentId: ENVIRONMENT_ID}},
        body: {OLD_VAR: {value: null}},
      });

      expect(error).to.be.undefined;
      expect(response.status).to.equal(204);
      expect(receivedBody).to.deep.equal({OLD_VAR: {value: null}});
    });

    it('handles RFC 7807 API errors', async () => {
      server.use(
        http.get(ENV_VARS_PATH, () => {
          return HttpResponse.json(
            {
              title: 'Not Found',
              type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/not-found',
              detail: 'Environment production not found',
            },
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          );
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createStorefrontEnvironmentsClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data, error} = await client.GET(ENV_VARS_ENDPOINT, {
        params: {path: {organizationId: ORGANIZATION_ID, storefrontId: STOREFRONT_ID, environmentId: ENVIRONMENT_ID}},
      });

      expect(data).to.be.undefined;
      expect(error).to.have.property('title', 'Not Found');
      expect(error).to.have.property('detail', 'Environment production not found');
    });
  });

  describe('STOREFRONT_ENVIRONMENTS_CASCADE', () => {
    it('reads accept rw or ro; writes require rw', () => {
      expect(STOREFRONT_ENVIRONMENTS_CASCADE).to.deep.equal({
        read: [['sfcc.storefront.environments.rw'], ['sfcc.storefront.environments']],
        write: [['sfcc.storefront.environments.rw']],
      });
    });
  });
});
