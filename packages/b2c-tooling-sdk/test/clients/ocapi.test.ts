/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createOcapiClient} from '@salesforce/b2c-tooling-sdk/clients';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

describe('clients/ocapi', () => {
  describe('createOcapiClient', () => {
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

    it('uses the default API version and applies auth middleware', async () => {
      const hostname = 'test.demandware.net';
      const baseUrl = `https://${hostname}/s/-/dw/data/v25_6`;

      server.use(
        http.get(`${baseUrl}/sites`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json({count: 0, data: []});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createOcapiClient(hostname, auth);

      const {data, error} = await client.GET('/sites', {});

      expect(error).to.be.undefined;
      expect(data).to.deep.equal({count: 0, data: []});
    });

    it('uses a custom API version when provided', async () => {
      const hostname = 'test.demandware.net';
      const apiVersion = 'v99_9';
      const baseUrl = `https://${hostname}/s/-/dw/data/${apiVersion}`;

      server.use(
        http.get(`${baseUrl}/sites`, () => {
          return HttpResponse.json({count: 1, data: [{id: 'RefArch'}]});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createOcapiClient(hostname, auth, apiVersion);

      const {data, error} = await client.GET('/sites', {});

      expect(error).to.be.undefined;
      expect(data?.count).to.equal(1);
    });

    it('returns structured error for non-2xx responses', async () => {
      const hostname = 'test.demandware.net';
      const baseUrl = `https://${hostname}/s/-/dw/data/v25_6`;

      server.use(
        http.get(`${baseUrl}/sites/nonexistent`, () => {
          return HttpResponse.json({fault: {message: 'Site not found'}}, {status: 404});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createOcapiClient(hostname, auth);

      const {data, error} = await client.GET('/sites/{site_id}', {
        params: {path: {site_id: 'nonexistent'}},
      });

      expect(data).to.be.undefined;
      expect(error).to.deep.equal({fault: {message: 'Site not found'}});
    });

    it('handles POST requests for creating resources', async () => {
      const hostname = 'test.demandware.net';
      const baseUrl = `https://${hostname}/s/-/dw/data/v25_6`;

      server.use(
        http.post(`${baseUrl}/customer_lists/:list_id/customers`, async ({request, params}) => {
          const body = (await request.json()) as any;

          expect(params.list_id).to.equal('TestList');
          expect(body.customer_no).to.equal('00001');
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');

          return HttpResponse.json({
            customer_no: '00001',
            email: 'test@example.com',
            enabled: true,
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createOcapiClient(hostname, auth);

      const {data, error} = await client.POST('/customer_lists/{list_id}/customers', {
        params: {path: {list_id: 'TestList'}},
        body: {
          customer_no: '00001',
          email: 'test@example.com',
        },
      });

      expect(error).to.be.undefined;
      expect(data).to.have.property('customer_no', '00001');
    });

    it('handles PATCH requests for partial updates', async () => {
      const hostname = 'test.demandware.net';
      const baseUrl = `https://${hostname}/s/-/dw/data/v25_6`;

      server.use(
        http.patch(`${baseUrl}/sites/:site_id`, async ({request, params}) => {
          const body = (await request.json()) as any;

          expect(params.site_id).to.equal('RefArch');
          expect(body.status).to.equal('online');

          return HttpResponse.json({
            id: 'RefArch',
            status: 'online',
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createOcapiClient(hostname, auth);

      const {data, error} = await (client as any).PATCH('/sites/{site_id}', {
        params: {path: {site_id: 'RefArch'}},
        body: {status: 'online'},
      });

      expect(error).to.be.undefined;
      expect(data).to.have.property('status', 'online');
    });

    it('handles DELETE requests', async () => {
      const hostname = 'test.demandware.net';
      const baseUrl = `https://${hostname}/s/-/dw/data/v25_6`;

      server.use(
        http.delete(`${baseUrl}/customer_lists/:list_id/customers/:customer_no`, ({params}) => {
          expect(params.list_id).to.equal('TestList');
          expect(params.customer_no).to.equal('00001');
          return new HttpResponse(null, {status: 204});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createOcapiClient(hostname, auth);

      const {response, error} = await client.DELETE('/customer_lists/{list_id}/customers/{customer_no}', {
        params: {
          path: {list_id: 'TestList', customer_no: '00001'},
        },
      });

      expect(error).to.be.undefined;
      expect(response.status).to.equal(204);
    });

    it('handles query parameters for filtering and sorting', async () => {
      const hostname = 'test.demandware.net';
      const baseUrl = `https://${hostname}/s/-/dw/data/v25_6`;

      server.use(
        http.get(`${baseUrl}/sites`, ({request}) => {
          const url = new URL(request.url);
          const select = url.searchParams.get('select');
          const count = url.searchParams.get('count');

          expect(select).to.equal('(id,status)');
          expect(count).to.equal('10');

          return HttpResponse.json({
            count: 2,
            total: 2,
            data: [
              {id: 'RefArch', status: 'online'},
              {id: 'SiteGenesis', status: 'offline'},
            ],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createOcapiClient(hostname, auth);

      const {data, error} = await client.GET('/sites', {
        params: {
          query: {
            select: '(id,status)',
            count: 10,
          },
        },
      });

      expect(error).to.be.undefined;
      expect(data?.data).to.have.length(2);
      expect(data?.data?.[0]).to.have.property('id', 'RefArch');
    });

    it('handles authentication errors (401)', async () => {
      const hostname = 'test.demandware.net';
      const baseUrl = `https://${hostname}/s/-/dw/data/v25_6`;

      server.use(
        http.get(`${baseUrl}/sites`, () => {
          return HttpResponse.json(
            {
              fault: {
                type: 'AuthenticationException',
                message: 'Invalid credentials',
              },
            },
            {status: 401},
          );
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createOcapiClient(hostname, auth);

      const {data, error} = await client.GET('/sites', {});

      expect(data).to.be.undefined;
      expect(error).to.have.nested.property('fault.type', 'AuthenticationException');
    });

    it('handles validation errors (400)', async () => {
      const hostname = 'test.demandware.net';
      const baseUrl = `https://${hostname}/s/-/dw/data/v25_6`;

      server.use(
        http.post(`${baseUrl}/sites`, () => {
          return HttpResponse.json(
            {
              fault: {
                type: 'InvalidInputException',
                message: 'Invalid site configuration',
                arguments: {
                  id: 'Site ID is required',
                },
              },
            },
            {status: 400},
          );
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createOcapiClient(hostname, auth);

      const {data, error} = await (client as any).POST('/sites', {
        body: {},
      });

      expect(data).to.be.undefined;
      expect(error).to.have.nested.property('fault.type', 'InvalidInputException');
      expect(error).to.have.nested.property('fault.arguments');
    });

    it('handles large result sets with count and total', async () => {
      const hostname = 'test.demandware.net';
      const baseUrl = `https://${hostname}/s/-/dw/data/v25_6`;

      server.use(
        http.get(`${baseUrl}/products`, ({request}) => {
          const url = new URL(request.url);
          const start = Number.parseInt(url.searchParams.get('start') || '0');
          const count = Number.parseInt(url.searchParams.get('count') || '25');

          return HttpResponse.json({
            count,
            start,
            total: 1000,
            data: Array.from({length: count}, (_, i) => ({
              id: `product-${start + i + 1}`,
            })),
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createOcapiClient(hostname, auth);

      const {data} = await (client as any).GET('/products', {
        params: {
          query: {start: 50, count: 25},
        },
      });

      expect((data as any)?.total).to.equal(1000);
      expect((data as any)?.count).to.equal(25);
      expect((data as any)?.start).to.equal(50);
      expect((data as any)?.data).to.have.length(25);
      expect((data as any)?.data?.[0]?.id).to.equal('product-51');
    });
  });
});
