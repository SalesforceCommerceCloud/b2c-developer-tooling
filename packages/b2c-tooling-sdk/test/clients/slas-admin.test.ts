/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createSlasClient} from '@salesforce/b2c-tooling-sdk/clients';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

describe('clients/slas-admin', () => {
  describe('createSlasClient', () => {
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

    it('uses shortCode to build base URL and applies auth middleware', async () => {
      const shortCode = 'kv7kzm78';
      const baseUrl = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth-admin/v1`;

      server.use(
        http.get(`${baseUrl}/tenants/:tenantId/clients`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json({total: 0, data: []});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createSlasClient({shortCode}, auth);

      const {data, error} = await client.GET('/tenants/{tenantId}/clients', {
        params: {path: {tenantId: 'tenant-1'}},
      });

      expect(error).to.be.undefined;
      expect(data).to.deep.equal({total: 0, data: []});
    });

    it('returns structured error for non-2xx responses', async () => {
      const shortCode = 'kv7kzm78';
      const baseUrl = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth-admin/v1`;

      server.use(
        http.get(`${baseUrl}/tenants/:tenantId/clients`, () => {
          return HttpResponse.json(
            {
              status: 403,
              title: 'Forbidden',
              type: 'about:blank',
              detail: 'Not allowed',
            },
            {status: 403},
          );
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createSlasClient({shortCode}, auth);

      const {data, error} = await client.GET('/tenants/{tenantId}/clients', {
        params: {path: {tenantId: 'tenant-1'}},
      });

      expect(data).to.be.undefined;
      expect(error).to.deep.equal({
        status: 403,
        title: 'Forbidden',
        type: 'about:blank',
        detail: 'Not allowed',
      });
    });

    it('handles POST requests with body', async () => {
      const shortCode = 'kv7kzm78';
      const baseUrl = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth-admin/v1`;

      server.use(
        http.post(`${baseUrl}/tenants/:tenantId/clients`, async ({request}) => {
          const body = (await request.json()) as any;

          expect(body.clientId).to.equal('new-client-123');
          expect(body.clientName).to.equal('Test Client');
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');

          return HttpResponse.json({
            clientId: 'new-client-123',
            clientName: 'Test Client',
            createdAt: '2025-01-01T00:00:00Z',
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createSlasClient({shortCode}, auth);

      const {data, error} = await (client as any).POST('/tenants/{tenantId}/clients', {
        params: {path: {tenantId: 'tenant-1'}},
        body: {
          clientId: 'new-client-123',
          clientName: 'Test Client',
        },
      });

      expect(error).to.be.undefined;
      expect(data).to.have.property('clientId', 'new-client-123');
      expect(data).to.have.property('clientName', 'Test Client');
    });

    it('handles PUT/PATCH requests for updates', async () => {
      const shortCode = 'kv7kzm78';
      const baseUrl = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth-admin/v1`;

      server.use(
        http.patch(`${baseUrl}/tenants/:tenantId/clients/:clientId`, async ({request, params}) => {
          const body = (await request.json()) as any;

          expect(params.clientId).to.equal('client-123');
          expect(body.clientName).to.equal('Updated Name');

          return HttpResponse.json({
            clientId: 'client-123',
            clientName: 'Updated Name',
            updatedAt: '2025-01-01T00:00:00Z',
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createSlasClient({shortCode}, auth);

      const {data, error} = await (client as any).PATCH('/tenants/{tenantId}/clients/{clientId}', {
        params: {
          path: {tenantId: 'tenant-1', clientId: 'client-123'},
        },
        body: {
          clientName: 'Updated Name',
        },
      });

      expect(error).to.be.undefined;
      expect(data).to.have.property('clientName', 'Updated Name');
    });

    it('handles DELETE requests', async () => {
      const shortCode = 'kv7kzm78';
      const baseUrl = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth-admin/v1`;

      server.use(
        http.delete(`${baseUrl}/tenants/:tenantId/clients/:clientId`, ({params}) => {
          expect(params.clientId).to.equal('client-to-delete');
          return new HttpResponse(null, {status: 204});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createSlasClient({shortCode}, auth);

      const {response, error} = await client.DELETE('/tenants/{tenantId}/clients/{clientId}', {
        params: {
          path: {tenantId: 'tenant-1', clientId: 'client-to-delete'},
        },
      });

      expect(error).to.be.undefined;
      expect(response.status).to.equal(204);
    });

    it('handles query parameters correctly', async () => {
      const shortCode = 'kv7kzm78';
      const baseUrl = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth-admin/v1`;

      server.use(
        http.get(`${baseUrl}/tenants/:tenantId/clients`, ({request}) => {
          const url = new URL(request.url);
          const limit = url.searchParams.get('limit');
          const offset = url.searchParams.get('offset');

          expect(limit).to.equal('10');
          expect(offset).to.equal('20');

          return HttpResponse.json({
            total: 100,
            limit: 10,
            offset: 20,
            data: [{clientId: 'client-1'}],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createSlasClient({shortCode}, auth);

      const {data, error} = await client.GET('/tenants/{tenantId}/clients', {
        params: {
          path: {tenantId: 'tenant-1'},
          query: {limit: 10, offset: 20} as any,
        },
      });

      expect(error).to.be.undefined;
      expect(data as any).to.have.property('limit', 10);
      expect(data as any).to.have.property('offset', 20);
    });

    it('handles 404 not found errors', async () => {
      const shortCode = 'kv7kzm78';
      const baseUrl = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth-admin/v1`;

      server.use(
        http.get(`${baseUrl}/tenants/:tenantId/clients/:clientId`, () => {
          return HttpResponse.json(
            {
              status: 404,
              title: 'Not Found',
              detail: 'Client not found',
            },
            {status: 404},
          );
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createSlasClient({shortCode}, auth);

      const {data, error} = await client.GET('/tenants/{tenantId}/clients/{clientId}', {
        params: {path: {tenantId: 'tenant-1', clientId: 'nonexistent'}},
      });

      expect(data).to.be.undefined;
      expect(error).to.have.property('status', 404);
      expect(error).to.have.property('title', 'Not Found');
    });

    it('handles 500 server errors', async () => {
      const shortCode = 'kv7kzm78';
      const baseUrl = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth-admin/v1`;

      server.use(
        http.get(`${baseUrl}/tenants/:tenantId/clients`, () => {
          return HttpResponse.json(
            {
              status: 500,
              title: 'Internal Server Error',
              detail: 'Something went wrong',
            },
            {status: 500},
          );
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createSlasClient({shortCode}, auth);

      const {data, error} = await client.GET('/tenants/{tenantId}/clients', {
        params: {path: {tenantId: 'tenant-1'}},
      });

      expect(data).to.be.undefined;
      expect(error).to.have.property('status', 500);
    });

    it('handles empty response arrays', async () => {
      const shortCode = 'kv7kzm78';
      const baseUrl = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth-admin/v1`;

      server.use(
        http.get(`${baseUrl}/tenants/:tenantId/clients`, () => {
          return HttpResponse.json({total: 0, data: []});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createSlasClient({shortCode}, auth);

      const {data, error} = await client.GET('/tenants/{tenantId}/clients', {
        params: {path: {tenantId: 'tenant-1'}},
      });

      expect(error).to.be.undefined;
      expect(data?.data).to.be.an('array').that.is.empty;
      expect((data as any)?.total).to.equal(0);
    });

    it('handles pagination parameters', async () => {
      const shortCode = 'kv7kzm78';
      const baseUrl = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth-admin/v1`;

      server.use(
        http.get(`${baseUrl}/tenants/:tenantId/clients`, ({request}) => {
          const url = new URL(request.url);
          const limit = Number.parseInt(url.searchParams.get('limit') || '25');
          const offset = Number.parseInt(url.searchParams.get('offset') || '0');

          return HttpResponse.json({
            total: 100,
            limit,
            offset,
            data: Array.from({length: limit}, (_, i) => ({
              clientId: `client-${offset + i + 1}`,
            })),
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createSlasClient({shortCode}, auth);

      // First page
      const page1 = await client.GET('/tenants/{tenantId}/clients', {
        params: {
          path: {tenantId: 'tenant-1'},
          query: {limit: 25, offset: 0} as any,
        },
      });

      expect((page1.data as any)?.data).to.have.length(25);
      expect((page1.data as any)?.data?.[0]?.clientId).to.equal('client-1');

      // Second page
      const page2 = await client.GET('/tenants/{tenantId}/clients', {
        params: {
          path: {tenantId: 'tenant-1'},
          query: {limit: 25, offset: 25} as any,
        },
      });

      expect((page2.data as any)?.data).to.have.length(25);
      expect((page2.data as any)?.data?.[0]?.clientId).to.equal('client-26');
    });
  });
});
