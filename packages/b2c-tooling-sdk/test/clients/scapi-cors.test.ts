/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createScapiCorsClient, SCAPI_CORS_READ_SCOPES, SCAPI_CORS_RW_SCOPES} from '@salesforce/b2c-tooling-sdk/clients';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const SHORT_CODE = 'kv7kzm78';
const TENANT_ID = 'zzxy_prd';
const BASE_URL = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/configuration/cors/v1`;
const ORG_ID = 'f_ecom_zzxy_prd';
const SITE_ID = 'RefArch';

describe('clients/scapi-cors', () => {
  describe('createScapiCorsClient', () => {
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

    it('creates a client with the correct base URL and auth header', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/:organizationId/cors`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json({corsClientPreferences: []});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createScapiCorsClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data, error} = await client.GET('/organizations/{organizationId}/cors', {
        params: {path: {organizationId: ORG_ID}, query: {siteId: SITE_ID}},
      });

      expect(error).to.be.undefined;
      expect(data?.corsClientPreferences).to.deep.equal([]);
    });

    it('GET returns CORS preferences for a site', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/:organizationId/cors`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('siteId')).to.equal(SITE_ID);
          return HttpResponse.json({
            corsClientPreferences: [{clientId: 'abc-123', origins: ['http://foo.com', 'https://bar.com']}],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createScapiCorsClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data} = await client.GET('/organizations/{organizationId}/cors', {
        params: {path: {organizationId: ORG_ID}, query: {siteId: SITE_ID}},
      });

      expect(data?.corsClientPreferences).to.have.length(1);
      expect(data?.corsClientPreferences?.[0]?.clientId).to.equal('abc-123');
      expect(data?.corsClientPreferences?.[0]?.origins).to.deep.equal(['http://foo.com', 'https://bar.com']);
    });

    it('GET returns empty preferences when none configured', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/:organizationId/cors`, () => {
          return HttpResponse.json({});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createScapiCorsClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data, error} = await client.GET('/organizations/{organizationId}/cors', {
        params: {path: {organizationId: ORG_ID}, query: {siteId: SITE_ID}},
      });

      expect(error).to.be.undefined;
      expect(data?.corsClientPreferences).to.be.undefined;
    });

    it('PUT creates or replaces CORS preferences', async () => {
      const requestBody = {corsClientPreferences: [{clientId: 'abc-123', origins: ['http://foo.com']}]};

      server.use(
        http.put(`${BASE_URL}/organizations/:organizationId/cors`, async ({request}) => {
          const body = await request.json();
          expect(body).to.deep.equal(requestBody);
          return HttpResponse.json(requestBody, {status: 200});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createScapiCorsClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data, error} = await client.PUT('/organizations/{organizationId}/cors', {
        params: {path: {organizationId: ORG_ID}, query: {siteId: SITE_ID}},
        body: requestBody,
      });

      expect(error).to.be.undefined;
      expect(data?.corsClientPreferences?.[0]?.clientId).to.equal('abc-123');
    });

    it('DELETE removes CORS preferences and returns 204', async () => {
      server.use(
        http.delete(`${BASE_URL}/organizations/:organizationId/cors`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('siteId')).to.equal(SITE_ID);
          return new HttpResponse(null, {status: 204});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createScapiCorsClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {error} = await client.DELETE('/organizations/{organizationId}/cors', {
        params: {path: {organizationId: ORG_ID}, query: {siteId: SITE_ID}},
      });

      expect(error).to.be.undefined;
    });

    it('handles API error responses', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/:organizationId/cors`, () => {
          return HttpResponse.json(
            {
              title: 'Not Found',
              type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/not-found',
              detail: 'Site not found',
            },
            {status: 404},
          );
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createScapiCorsClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data, error} = await client.GET('/organizations/{organizationId}/cors', {
        params: {path: {organizationId: ORG_ID}, query: {siteId: 'NonExistent'}},
      });

      expect(data).to.be.undefined;
      expect(error).to.have.property('title', 'Not Found');
      expect(error).to.have.property('detail', 'Site not found');
    });
  });

  describe('scope constants', () => {
    it('SCAPI_CORS_READ_SCOPES contains the read-only scope', () => {
      expect(SCAPI_CORS_READ_SCOPES).to.deep.equal(['sfcc.cors-preferences']);
    });

    it('SCAPI_CORS_RW_SCOPES contains the read-write scope', () => {
      expect(SCAPI_CORS_RW_SCOPES).to.deep.equal(['sfcc.cors-preferences.rw']);
    });
  });
});
