/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {
  createCdnZonesClient,
  CDN_ZONES_READ_SCOPES,
  CDN_ZONES_RW_SCOPES,
  toOrganizationId,
} from '@salesforce/b2c-tooling-sdk/clients';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const SHORT_CODE = 'kv7kzm78';
const TENANT_ID = 'zzxy_prd';
const ORG_ID = toOrganizationId(TENANT_ID);
const BASE_URL = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/cdn/zones/v1`;

describe('clients/cdn-zones', () => {
  describe('createCdnZonesClient', () => {
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

    it('creates a client with the correct base URL and applies auth middleware', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/:organizationId/zones/info`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json({
            data: [],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createCdnZonesClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data, error} = await client.GET('/organizations/{organizationId}/zones/info', {
        params: {path: {organizationId: ORG_ID}},
      });

      expect(error).to.be.undefined;
      expect(data?.data).to.deep.equal([]);
    });

    it('lists zones with zone data', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/:organizationId/zones/info`, () => {
          return HttpResponse.json({
            data: [
              {
                zoneId: 'zone-abc123',
                name: 'my-storefront',
                status: 'active',
              },
              {
                zoneId: 'zone-def456',
                name: 'another-zone',
                status: 'pending',
              },
            ],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createCdnZonesClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data} = await client.GET('/organizations/{organizationId}/zones/info', {
        params: {path: {organizationId: ORG_ID}},
      });

      expect(data?.data).to.have.length(2);
      expect(data?.data?.[0]?.name).to.equal('my-storefront');
      expect(data?.data?.[0]?.status).to.equal('active');
      expect(data?.data?.[1]?.zoneId).to.equal('zone-def456');
    });

    it('fetches security settings for a zone', async () => {
      const zoneId = 'zone-abc123';

      server.use(
        http.get(`${BASE_URL}/organizations/:organizationId/zones/:zoneId/security-settings`, ({params}) => {
          expect(params.organizationId).to.equal(ORG_ID);
          expect(params.zoneId).to.equal(zoneId);

          return HttpResponse.json({
            data: {
              securityLevel: 'medium',
              alwaysUseHttps: true,
              tls13Enabled: true,
              wafEnabled: false,
              hsts: {
                enabled: true,
                includeSubdomains: true,
                maxAge: 31536000,
                preload: false,
              },
            },
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createCdnZonesClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data} = await client.GET('/organizations/{organizationId}/zones/{zoneId}/security-settings', {
        params: {
          path: {organizationId: ORG_ID, zoneId},
        },
      });

      expect(data?.data?.securityLevel).to.equal('medium');
      expect(data?.data?.alwaysUseHttps).to.be.true;
      expect(data?.data?.tls13Enabled).to.be.true;
    });

    it('performs cache purge with POST request', async () => {
      const zoneId = 'zone-abc123';
      let capturedBody: unknown;

      server.use(
        http.post(`${BASE_URL}/organizations/:organizationId/zones/:zoneId/cachepurge`, async ({request}) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            data: {
              cachePurged: true,
              details: 'Purge completed successfully',
            },
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createCdnZonesClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth, {readWrite: true});

      const {data} = await client.POST('/organizations/{organizationId}/zones/{zoneId}/cachepurge', {
        params: {
          path: {organizationId: ORG_ID, zoneId},
        },
        body: {
          path: 'www.example.com/dw/shop/v21_9/products',
        },
      });

      expect(data?.data?.cachePurged).to.be.true;
      expect(capturedBody).to.deep.include({
        path: 'www.example.com/dw/shop/v21_9/products',
      });
    });

    it('updates security settings with PATCH request', async () => {
      const zoneId = 'zone-abc123';
      let capturedBody: unknown;

      server.use(
        http.patch(`${BASE_URL}/organizations/:organizationId/zones/:zoneId/security-settings`, async ({request}) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            data: {
              securityLevel: 'high',
              alwaysUseHttps: true,
              tls13Enabled: true,
              wafEnabled: true,
            },
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createCdnZonesClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth, {readWrite: true});

      const {data} = await client.PATCH('/organizations/{organizationId}/zones/{zoneId}/security-settings', {
        params: {
          path: {organizationId: ORG_ID, zoneId},
        },
        body: {
          securityLevel: 'high',
          alwaysUseHttps: true,
        },
      });

      expect(data?.data?.securityLevel).to.equal('high');
      expect(capturedBody).to.deep.include({securityLevel: 'high'});
    });

    it('deletes a certificate with DELETE request', async () => {
      const zoneId = 'zone-abc123';
      const certificateId = 'cert-xyz789';

      server.use(
        http.delete(
          `${BASE_URL}/organizations/:organizationId/zones/:zoneId/certificates/:certificateId`,
          ({params}) => {
            expect(params.certificateId).to.equal(certificateId);
            return new HttpResponse(null, {status: 204});
          },
        ),
      );

      const auth = new MockAuthStrategy();
      const client = createCdnZonesClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth, {readWrite: true});

      const {error, response} = await client.DELETE(
        '/organizations/{organizationId}/zones/{zoneId}/certificates/{certificateId}',
        {
          params: {
            path: {organizationId: ORG_ID, zoneId, certificateId},
          },
        },
      );

      expect(error).to.be.undefined;
      expect(response.status).to.equal(204);
    });

    it('handles 404 errors', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/:organizationId/zones/:zoneId/security-settings`, () => {
          return HttpResponse.json(
            {
              title: 'Not Found',
              type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/not-found',
              detail: 'Zone not found',
            },
            {status: 404},
          );
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createCdnZonesClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data, error} = await client.GET('/organizations/{organizationId}/zones/{zoneId}/security-settings', {
        params: {
          path: {organizationId: ORG_ID, zoneId: 'nonexistent-zone'},
        },
      });

      expect(data).to.be.undefined;
      expect(error).to.have.property('title', 'Not Found');
      expect(error).to.have.property('detail', 'Zone not found');
    });

    it('handles 500 server errors', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/:organizationId/zones/info`, () => {
          return HttpResponse.json(
            {
              title: 'Internal Server Error',
              type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/internal-error',
              detail: 'An unexpected error occurred',
            },
            {status: 500},
          );
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createCdnZonesClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, auth);

      const {data, error} = await client.GET('/organizations/{organizationId}/zones/info', {
        params: {path: {organizationId: ORG_ID}},
      });

      expect(data).to.be.undefined;
      expect(error).to.have.property('title', 'Internal Server Error');
    });
  });

  describe('CDN_ZONES_READ_SCOPES', () => {
    it('includes the correct read scope', () => {
      expect(CDN_ZONES_READ_SCOPES).to.deep.equal(['sfcc.cdn-zones']);
    });
  });

  describe('CDN_ZONES_RW_SCOPES', () => {
    it('includes the correct read-write scope', () => {
      expect(CDN_ZONES_RW_SCOPES).to.deep.equal(['sfcc.cdn-zones.rw']);
    });
  });

  describe('toOrganizationId', () => {
    it('converts tenant ID to organization ID with prefix', () => {
      expect(toOrganizationId('zzxy_prd')).to.equal('f_ecom_zzxy_prd');
    });

    it('returns already-prefixed IDs unchanged', () => {
      expect(toOrganizationId('f_ecom_zzxy_prd')).to.equal('f_ecom_zzxy_prd');
    });
  });
});
