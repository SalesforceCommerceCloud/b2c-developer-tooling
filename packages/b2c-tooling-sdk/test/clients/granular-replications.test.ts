/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createGranularReplicationsClient} from '../../src/clients/granular-replications.js';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const SHORT_CODE = 'kv7kzm78';
const ORG_ID = 'f_ecom_zzxy_prd';
const BASE_URL = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/operation/replications/v1`;

describe('Granular Replications Client', () => {
  const server = setupServer();
  let client: ReturnType<typeof createGranularReplicationsClient>;
  let mockAuth: MockAuthStrategy;

  before(() => server.listen({onUnhandledRequest: 'error'}));
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  beforeEach(() => {
    mockAuth = new MockAuthStrategy();
    client = createGranularReplicationsClient({shortCode: SHORT_CODE, organizationId: ORG_ID}, mockAuth);
  });

  it('should create client with config', () => {
    expect(client).to.exist;
  });

  describe('LIST granular-processes', () => {
    it('should list granular processes', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/granular-processes`, () => {
          return HttpResponse.json({
            data: [
              {
                id: 'proc-1',
                status: 'completed',
                startTime: '2025-01-01T00:00:00Z',
                initiatedBy: 'user@example.com',
                productItem: {productId: 'PROD-1'},
              },
              {
                id: 'proc-2',
                status: 'in_progress',
                startTime: '2025-01-01T01:00:00Z',
                initiatedBy: 'user@example.com',
                priceTableItem: {priceTableId: 'table-1'},
              },
            ],
            total: 2,
          });
        }),
      );

      const result = await client.GET('/organizations/{organizationId}/granular-processes', {
        params: {path: {organizationId: ORG_ID}},
      });

      expect(result.data?.data).to.have.length(2);
      expect(result.data?.total).to.equal(2);
      expect(result.data?.data?.[0].id).to.equal('proc-1');
      expect(result.data?.data?.[0].status).to.equal('completed');
    });

    it('should list with pagination parameters', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/granular-processes`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('limit')).to.equal('10');
          expect(url.searchParams.get('offset')).to.equal('20');
          return HttpResponse.json({
            data: [],
            total: 0,
          });
        }),
      );

      await client.GET('/organizations/{organizationId}/granular-processes', {
        params: {
          path: {organizationId: ORG_ID},
          query: {limit: 10, offset: 20},
        },
      });
    });

    it('should handle list errors', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/granular-processes`, () => {
          return HttpResponse.json(
            {
              title: 'Forbidden',
              detail: 'Feature not enabled for this organization',
            },
            {status: 403},
          );
        }),
      );

      const result = await client.GET('/organizations/{organizationId}/granular-processes', {
        params: {path: {organizationId: ORG_ID}},
      });

      expect(result.error).to.exist;
      expect(result.response.status).to.equal(403);
    });
  });

  describe('POST granular-processes', () => {
    it('should queue product for publishing', async () => {
      server.use(
        http.post(`${BASE_URL}/organizations/${ORG_ID}/granular-processes`, async ({request}) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).to.deep.equal({product: {productId: 'PROD-1'}});
          return HttpResponse.json({id: 'proc-123'}, {status: 201});
        }),
      );

      const result = await client.POST('/organizations/{organizationId}/granular-processes', {
        params: {path: {organizationId: ORG_ID}},
        body: {product: {productId: 'PROD-1'}},
      });

      expect(result.data?.id).to.equal('proc-123');
      expect(result.response.status).to.equal(201);
    });

    it('should queue price table for publishing', async () => {
      server.use(
        http.post(`${BASE_URL}/organizations/${ORG_ID}/granular-processes`, async ({request}) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).to.deep.equal({priceTable: {priceTableId: 'table-1'}});
          return HttpResponse.json({id: 'proc-456'}, {status: 201});
        }),
      );

      const result = await client.POST('/organizations/{organizationId}/granular-processes', {
        params: {path: {organizationId: ORG_ID}},
        body: {priceTable: {priceTableId: 'table-1'}},
      });

      expect(result.data?.id).to.equal('proc-456');
    });

    it('should queue private content asset for publishing', async () => {
      server.use(
        http.post(`${BASE_URL}/organizations/${ORG_ID}/granular-processes`, async ({request}) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).to.deep.equal({
            contentAsset: {contentId: 'hero-banner', type: 'private', siteId: 'RefArch'},
          });
          return HttpResponse.json({id: 'proc-789'}, {status: 201});
        }),
      );

      const result = await client.POST('/organizations/{organizationId}/granular-processes', {
        params: {path: {organizationId: ORG_ID}},
        body: {contentAsset: {contentId: 'hero-banner', type: 'private', siteId: 'RefArch'}},
      });

      expect(result.data?.id).to.equal('proc-789');
    });

    it('should queue shared content asset for publishing', async () => {
      server.use(
        http.post(`${BASE_URL}/organizations/${ORG_ID}/granular-processes`, async ({request}) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).to.deep.equal({
            contentAsset: {contentId: 'footer-links', type: 'shared', libraryId: 'SharedLibrary'},
          });
          return HttpResponse.json({id: 'proc-abc'}, {status: 201});
        }),
      );

      const result = await client.POST('/organizations/{organizationId}/granular-processes', {
        params: {path: {organizationId: ORG_ID}},
        body: {contentAsset: {contentId: 'footer-links', type: 'shared', libraryId: 'SharedLibrary'}},
      });

      expect(result.data?.id).to.equal('proc-abc');
    });

    it('should handle 422 error when not on staging', async () => {
      server.use(
        http.post(`${BASE_URL}/organizations/${ORG_ID}/granular-processes`, () => {
          return HttpResponse.json(
            {
              title: 'Unprocessable Entity',
              detail: 'Granular replication can only be initiated from staging instances',
            },
            {status: 422},
          );
        }),
      );

      const result = await client.POST('/organizations/{organizationId}/granular-processes', {
        params: {path: {organizationId: ORG_ID}},
        body: {product: {productId: 'PROD-1'}},
      });

      expect(result.error).to.exist;
      expect(result.response.status).to.equal(422);
    });

    it('should handle 409 conflict during replication', async () => {
      server.use(
        http.post(`${BASE_URL}/organizations/${ORG_ID}/granular-processes`, () => {
          return HttpResponse.json(
            {
              title: 'Conflict',
              detail: 'Cannot queue items while full replication is running',
            },
            {status: 409},
          );
        }),
      );

      const result = await client.POST('/organizations/{organizationId}/granular-processes', {
        params: {path: {organizationId: ORG_ID}},
        body: {product: {productId: 'PROD-1'}},
      });

      expect(result.error).to.exist;
      expect(result.response.status).to.equal(409);
    });
  });

  describe('GET granular-processes/{id}', () => {
    it('should get process details', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/granular-processes/proc-1`, () => {
          return HttpResponse.json({
            id: 'proc-1',
            status: 'completed',
            startTime: '2025-01-01T00:00:00Z',
            endTime: '2025-01-01T00:05:00Z',
            initiatedBy: 'user@example.com',
            productItem: {productId: 'PROD-1'},
          });
        }),
      );

      const result = await client.GET('/organizations/{organizationId}/granular-processes/{id}', {
        params: {path: {organizationId: ORG_ID, id: 'proc-1'}},
      });

      expect(result.data?.id).to.equal('proc-1');
      expect(result.data?.status).to.equal('completed');
      expect(result.data?.productItem?.productId).to.equal('PROD-1');
    });

    it('should get process with content asset', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/granular-processes/proc-2`, () => {
          return HttpResponse.json({
            id: 'proc-2',
            status: 'in_progress',
            startTime: '2025-01-01T01:00:00Z',
            initiatedBy: 'user@example.com',
            contentAssetItem: {contentId: 'hero', type: 'private', siteId: 'RefArch'},
          });
        }),
      );

      const result = await client.GET('/organizations/{organizationId}/granular-processes/{id}', {
        params: {path: {organizationId: ORG_ID, id: 'proc-2'}},
      });

      expect(result.data?.contentAssetItem?.contentId).to.equal('hero');
      expect(result.data?.contentAssetItem?.type).to.equal('private');
    });

    it('should handle 404 for nonexistent process', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/granular-processes/invalid`, () => {
          return HttpResponse.json(
            {
              title: 'Not Found',
              detail: 'Process not found',
            },
            {status: 404},
          );
        }),
      );

      const result = await client.GET('/organizations/{organizationId}/granular-processes/{id}', {
        params: {path: {organizationId: ORG_ID, id: 'invalid'}},
      });

      expect(result.error).to.exist;
      expect(result.response.status).to.equal(404);
    });
  });
});
