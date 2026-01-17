/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createScapiSchemasClient, SCAPI_SCHEMAS_DEFAULT_SCOPES} from '@salesforce/b2c-tooling-sdk/clients';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const SHORT_CODE = 'kv7kzm78';
const TENANT_ID = 'zzxy_prd';
const BASE_URL = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/dx/scapi-schemas/v1`;

describe('clients/scapi-schemas', () => {
  describe('createScapiSchemasClient', () => {
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
        http.get(`${BASE_URL}/organizations/:organizationId/schemas`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json({
            limit: 10,
            total: 0,
            data: [],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createScapiSchemasClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data, error} = await client.GET('/organizations/{organizationId}/schemas', {
        params: {path: {organizationId: 'f_ecom_zzxy_prd'}},
      });

      expect(error).to.be.undefined;
      expect(data?.data).to.deep.equal([]);
    });

    it('lists schemas with metadata', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/:organizationId/schemas`, () => {
          return HttpResponse.json({
            limit: 10,
            total: 2,
            data: [
              {
                schemaVersion: '1.0.0',
                apiFamily: 'shopper',
                apiName: 'products',
                apiVersion: 'v1',
                status: 'current',
                link: '/organizations/f_ecom_zzxy_prd/schemas/shopper/products/v1',
              },
              {
                schemaVersion: '1.0.0',
                apiFamily: 'shopper',
                apiName: 'orders',
                apiVersion: 'v1',
                status: 'current',
                link: '/organizations/f_ecom_zzxy_prd/schemas/shopper/orders/v1',
              },
            ],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createScapiSchemasClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data} = await client.GET('/organizations/{organizationId}/schemas', {
        params: {path: {organizationId: 'f_ecom_zzxy_prd'}},
      });

      expect(data?.total).to.equal(2);
      expect(data?.data).to.have.length(2);
      expect(data?.data?.[0]?.apiFamily).to.equal('shopper');
      expect(data?.data?.[0]?.apiName).to.equal('products');
    });

    it('filters schemas by apiFamily', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/:organizationId/schemas`, ({request}) => {
          const url = new URL(request.url);
          const apiFamily = url.searchParams.get('apiFamily');

          expect(apiFamily).to.equal('shopper');

          return HttpResponse.json({
            limit: 10,
            total: 1,
            filter: {apiFamily: 'shopper'},
            data: [
              {
                schemaVersion: '1.0.0',
                apiFamily: 'shopper',
                apiName: 'products',
                apiVersion: 'v1',
                status: 'current',
              },
            ],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createScapiSchemasClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data} = await client.GET('/organizations/{organizationId}/schemas', {
        params: {
          path: {organizationId: 'f_ecom_zzxy_prd'},
          query: {apiFamily: 'shopper'},
        },
      });

      expect(data?.filter?.apiFamily).to.equal('shopper');
      expect(data?.data).to.have.length(1);
    });

    it('fetches a specific schema', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/:organizationId/schemas/:apiFamily/:apiName/:apiVersion`, ({params}) => {
          expect(params.apiFamily).to.equal('shopper');
          expect(params.apiName).to.equal('products');
          expect(params.apiVersion).to.equal('v1');

          return HttpResponse.json({
            openapi: '3.0.3',
            info: {
              title: 'Shopper Products',
              version: 'v1',
            },
            paths: {
              '/products': {
                get: {summary: 'Get products'},
              },
            },
            components: {
              schemas: {
                Product: {type: 'object'},
              },
            },
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createScapiSchemasClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data} = await client.GET('/organizations/{organizationId}/schemas/{apiFamily}/{apiName}/{apiVersion}', {
        params: {
          path: {
            organizationId: 'f_ecom_zzxy_prd',
            apiFamily: 'shopper',
            apiName: 'products',
            apiVersion: 'v1',
          },
        },
      });

      expect(data?.openapi).to.equal('3.0.3');
      expect(data?.info?.title).to.equal('Shopper Products');
      expect(data?.paths).to.have.property('/products');
    });

    it('handles API errors', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/:organizationId/schemas/:apiFamily/:apiName/:apiVersion`, () => {
          return HttpResponse.json(
            {
              title: 'Not Found',
              type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/not-found',
              detail: 'Schema not found',
            },
            {status: 404},
          );
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createScapiSchemasClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data, error} = await client.GET(
        '/organizations/{organizationId}/schemas/{apiFamily}/{apiName}/{apiVersion}',
        {
          params: {
            path: {
              organizationId: 'f_ecom_zzxy_prd',
              apiFamily: 'shopper',
              apiName: 'nonexistent',
              apiVersion: 'v1',
            },
          },
        },
      );

      expect(data).to.be.undefined;
      expect(error).to.have.property('title', 'Not Found');
      expect(error).to.have.property('detail');
    });
  });

  describe('SCAPI_SCHEMAS_DEFAULT_SCOPES', () => {
    it('includes the correct default scope', () => {
      expect(SCAPI_SCHEMAS_DEFAULT_SCOPES).to.deep.equal(['sfcc.scapi-schemas']);
    });
  });
});
