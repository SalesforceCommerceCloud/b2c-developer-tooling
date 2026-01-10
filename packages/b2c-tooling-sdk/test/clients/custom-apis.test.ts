/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {
  createCustomApisClient,
  toOrganizationId,
  toTenantId,
  buildTenantScope,
  ORGANIZATION_ID_PREFIX,
  SCAPI_TENANT_SCOPE_PREFIX,
} from '@salesforce/b2c-tooling-sdk/clients';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const SHORT_CODE = 'kv7kzm78';
const TENANT_ID = 'zzxy_prd';
const BASE_URL = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/dx/custom-apis/v1`;

describe('clients/custom-apis', () => {
  describe('createCustomApisClient', () => {
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

    it('creates a client with the correct base URL', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/:organizationId/endpoints`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json({
            limit: 10,
            total: 0,
            data: [],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createCustomApisClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data, error} = await client.GET('/organizations/{organizationId}/endpoints', {
        params: {path: {organizationId: 'f_ecom_zzxy_prd'}},
      });

      expect(error).to.be.undefined;
      expect(data?.data).to.deep.equal([]);
    });

    it('fetches endpoints with active code version', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/:organizationId/endpoints`, () => {
          return HttpResponse.json({
            limit: 10,
            total: 2,
            activeCodeVersion: 'version1',
            data: [
              {
                apiName: 'loyalty-info',
                apiVersion: 'v1',
                cartridgeName: 'my_cartridge',
                endpointPath: '/customers',
                httpMethod: 'GET',
                status: 'active',
                securityScheme: 'ShopperToken',
                id: '10bd7f2dc40ab7aede7f0d60e5c3a783',
              },
              {
                apiName: 'loyalty-info',
                apiVersion: 'v1',
                cartridgeName: 'my_cartridge_2',
                endpointPath: '/customers',
                httpMethod: 'POST',
                status: 'not_registered',
                errorReason: "Cartridge 'my_cartridge_2' not found.",
                id: '20bd7f2dc40ab7aede7f0d60e5c3a784',
              },
            ],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createCustomApisClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data} = await client.GET('/organizations/{organizationId}/endpoints', {
        params: {path: {organizationId: 'f_ecom_zzxy_prd'}},
      });

      expect(data?.total).to.equal(2);
      expect(data?.activeCodeVersion).to.equal('version1');
      expect(data?.data).to.have.length(2);
      expect(data?.data?.[0]?.status).to.equal('active');
      expect(data?.data?.[1]?.status).to.equal('not_registered');
      expect(data?.data?.[1]?.errorReason).to.equal("Cartridge 'my_cartridge_2' not found.");
    });

    it('filters endpoints by status', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/:organizationId/endpoints`, ({request}) => {
          const url = new URL(request.url);
          const statusFilter = url.searchParams.get('status');

          expect(statusFilter).to.equal('active');

          return HttpResponse.json({
            limit: 10,
            total: 1,
            filter: {status: 'active'},
            data: [
              {
                apiName: 'loyalty-info',
                apiVersion: 'v1',
                cartridgeName: 'my_cartridge',
                endpointPath: '/customers',
                httpMethod: 'GET',
                status: 'active',
              },
            ],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createCustomApisClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data} = await client.GET('/organizations/{organizationId}/endpoints', {
        params: {
          path: {organizationId: 'f_ecom_zzxy_prd'},
          query: {status: 'active'},
        },
      });

      expect(data?.filter?.status).to.equal('active');
      expect(data?.data).to.have.length(1);
    });

    it('handles API errors', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/:organizationId/endpoints`, () => {
          return HttpResponse.json(
            {
              title: 'Bad Request',
              type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/bad-request',
              detail: "Invalid value 'foo' for filter parameter 'status'",
            },
            {status: 400},
          );
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createCustomApisClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data, error} = await client.GET('/organizations/{organizationId}/endpoints', {
        params: {path: {organizationId: 'f_ecom_zzxy_prd'}},
      });

      expect(data).to.be.undefined;
      expect(error).to.have.property('title', 'Bad Request');
      expect(error).to.have.property('detail');
    });
  });

  describe('toOrganizationId', () => {
    it('adds f_ecom_ prefix to tenant ID', () => {
      expect(toOrganizationId('zzxy_prd')).to.equal('f_ecom_zzxy_prd');
    });

    it('returns unchanged if already has f_ecom_ prefix', () => {
      expect(toOrganizationId('f_ecom_zzxy_prd')).to.equal('f_ecom_zzxy_prd');
    });

    it('handles various tenant ID formats', () => {
      expect(toOrganizationId('abcd_001')).to.equal('f_ecom_abcd_001');
      expect(toOrganizationId('test')).to.equal('f_ecom_test');
    });

    it('uses ORGANIZATION_ID_PREFIX constant', () => {
      expect(ORGANIZATION_ID_PREFIX).to.equal('f_ecom_');
    });
  });

  describe('toTenantId', () => {
    it('strips f_ecom_ prefix from organization ID', () => {
      expect(toTenantId('f_ecom_zzxy_prd')).to.equal('zzxy_prd');
    });

    it('returns unchanged if no f_ecom_ prefix', () => {
      expect(toTenantId('zzxy_prd')).to.equal('zzxy_prd');
    });

    it('handles various formats', () => {
      expect(toTenantId('f_ecom_abcd_001')).to.equal('abcd_001');
      expect(toTenantId('f_ecom_test')).to.equal('test');
    });
  });

  describe('buildTenantScope', () => {
    it('builds scope from tenant ID', () => {
      expect(buildTenantScope('zzxy_prd')).to.equal('SALESFORCE_COMMERCE_API:zzxy_prd');
    });

    it('strips f_ecom_ prefix before building scope', () => {
      expect(buildTenantScope('f_ecom_zzxy_prd')).to.equal('SALESFORCE_COMMERCE_API:zzxy_prd');
    });

    it('uses SCAPI_TENANT_SCOPE_PREFIX constant', () => {
      expect(SCAPI_TENANT_SCOPE_PREFIX).to.equal('SALESFORCE_COMMERCE_API:');
    });

    it('handles various tenant ID formats', () => {
      expect(buildTenantScope('abcd_001')).to.equal('SALESFORCE_COMMERCE_API:abcd_001');
      expect(buildTenantScope('f_ecom_test')).to.equal('SALESFORCE_COMMERCE_API:test');
    });
  });
});
