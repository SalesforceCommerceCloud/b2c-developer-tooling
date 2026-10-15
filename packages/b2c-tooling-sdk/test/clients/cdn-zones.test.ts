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
  listAllZones,
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

  describe('listAllZones', () => {
    const server = setupServer();
    const requests: URL[] = [];

    const makeZones = (start: number, count: number) =>
      Array.from({length: count}, (_, i) => ({zoneId: `zone${start + i}`, name: `zone-${start + i}`}));

    function mockPages(total: number, failAtOffset?: number) {
      server.use(
        http.get(`${BASE_URL}/organizations/:organizationId/zones/info`, ({request}) => {
          const url = new URL(request.url);
          requests.push(url);
          const limit = Number(url.searchParams.get('limit') ?? 25);
          const offset = Number(url.searchParams.get('offset') ?? 0);
          if (offset === failAtOffset) {
            return HttpResponse.json({title: 'Boom'}, {status: 500});
          }
          return HttpResponse.json({data: makeZones(offset, Math.max(0, Math.min(limit, total - offset)))});
        }),
      );
    }

    function createClient() {
      return createCdnZonesClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, new MockAuthStrategy());
    }

    before(() => {
      server.listen({onUnhandledRequest: 'error'});
    });

    beforeEach(() => {
      requests.length = 0;
    });

    afterEach(() => {
      server.resetHandlers();
    });

    after(() => {
      server.close();
    });

    it('pages past the first 25 zones using limit=50', async () => {
      mockPages(63);

      const {zones, error} = await listAllZones(createClient(), ORG_ID);

      expect(error).to.be.undefined;
      expect(zones).to.have.length(63);
      expect(zones[62].name).to.equal('zone-62');
      expect(requests.map((u) => u.searchParams.get('offset'))).to.deep.equal(['0', '50']);
      expect(requests.every((u) => u.searchParams.get('limit') === '50')).to.equal(true);
    });

    it('makes a single request when the first page is short', async () => {
      mockPages(3);

      const {zones} = await listAllZones(createClient(), ORG_ID);

      expect(zones).to.have.length(3);
      expect(requests).to.have.length(1);
    });

    it('terminates on an empty page after a full page', async () => {
      mockPages(50);

      const {zones} = await listAllZones(createClient(), ORG_ID);

      expect(zones).to.have.length(50);
      expect(requests).to.have.length(2);
    });

    it('returns an empty list when there are no zones', async () => {
      mockPages(0);

      const {zones, error} = await listAllZones(createClient(), ORG_ID);

      expect(error).to.be.undefined;
      expect(zones).to.deep.equal([]);
    });

    it('returns the error and partial zones when a later page fails', async () => {
      mockPages(120, 50);

      const {zones, error} = await listAllZones(createClient(), ORG_ID);

      expect(error).to.exist;
      expect(zones).to.have.length(50);
    });
  });
});
