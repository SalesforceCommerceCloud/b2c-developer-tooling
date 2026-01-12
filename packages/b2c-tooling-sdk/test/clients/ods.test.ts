/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createOdsClient} from '../../src/clients/ods.js';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const TEST_HOST = 'admin.test.dx.commercecloud.salesforce.com';
const BASE_URL = `https://${TEST_HOST}/api/v1`;

describe('ODS Client', () => {
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

  let odsClient: ReturnType<typeof createOdsClient>;
  let mockAuth: MockAuthStrategy;

  beforeEach(() => {
    mockAuth = new MockAuthStrategy();
    odsClient = createOdsClient({host: TEST_HOST}, mockAuth);
  });

  describe('client creation', () => {
    it('should create client with default host', () => {
      const auth = new MockAuthStrategy();
      const client = createOdsClient({}, auth);
      expect(client).to.exist;
    });

    it('should create client with custom host', () => {
      const auth = new MockAuthStrategy();
      const client = createOdsClient({host: 'custom.host.com'}, auth);
      expect(client).to.exist;
    });

    it('should create client with extra params', () => {
      const auth = new MockAuthStrategy();
      const client = createOdsClient(
        {
          extraParams: {
            query: {debug: 'true'},
            body: {_internal: {trace: true}},
          },
        },
        auth,
      );
      expect(client).to.exist;
    });
  });

  describe('GET /sandboxes', () => {
    it('should list sandboxes', async () => {
      const mockSandboxes = [
        {id: 'sb-1', realm: 'aaab', state: 'started'},
        {id: 'sb-2', realm: 'aaaa', state: 'stopped'},
      ];

      server.use(
        http.get(`${BASE_URL}/sandboxes`, () => {
          return HttpResponse.json({data: mockSandboxes});
        }),
      );

      const {data, error} = await odsClient.GET('/sandboxes', {});

      expect(error).to.be.undefined;
      expect(data?.data).to.have.lengthOf(2);
      expect(data?.data?.[0].id).to.equal('sb-1');
    });

    it('should handle empty sandbox list', async () => {
      server.use(
        http.get(`${BASE_URL}/sandboxes`, () => {
          return HttpResponse.json({data: []});
        }),
      );

      const {data, error} = await odsClient.GET('/sandboxes', {});

      expect(error).to.be.undefined;
      expect(data?.data).to.be.an('array').with.lengthOf(0);
    });

    it('should pass query parameters correctly', async () => {
      server.use(
        http.get(`${BASE_URL}/sandboxes`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('include_deleted')).to.equal('true');
          expect(url.searchParams.get('filter_params')).to.equal('realm=zzzv');
          return HttpResponse.json({data: []});
        }),
      );

      const {data, error} = await odsClient.GET('/sandboxes', {
        params: {
          query: {
            include_deleted: true,
            filter_params: 'realm=zzzv',
          },
        },
      });

      expect(error).to.be.undefined;
      expect(data?.data).to.be.an('array').with.lengthOf(0);
    });

    it('should handle 401 error', async () => {
      server.use(
        http.get(`${BASE_URL}/sandboxes`, () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Unauthorized',
                code: 'UNAUTHORIZED',
              },
            },
            {status: 401},
          );
        }),
      );

      const {data, error, response} = await odsClient.GET('/sandboxes', {});

      expect(data).to.be.undefined;
      expect(error).to.exist;
      expect(response.status).to.equal(401);
    });

    it('should handle 500 error', async () => {
      server.use(
        http.get(`${BASE_URL}/sandboxes`, () => {
          return new HttpResponse(null, {status: 500, statusText: 'Internal Server Error'});
        }),
      );

      const {data, error, response} = await odsClient.GET('/sandboxes', {});

      expect(data).to.be.undefined;
      expect(error).to.exist;
      expect(response.status).to.equal(500);
    });
  });

  describe('GET /sandboxes/{sandboxId}', () => {
    it('should get sandbox by ID', async () => {
      const mockSandbox = {
        id: 'sb-123',
        realm: 'zzzv',
        state: 'started',
      };

      server.use(
        http.get(`${BASE_URL}/sandboxes/sb-123`, () => {
          return HttpResponse.json({data: mockSandbox});
        }),
      );

      const {data, error} = await odsClient.GET('/sandboxes/{sandboxId}', {
        params: {
          path: {sandboxId: 'sb-123'},
        },
      });

      expect(error).to.be.undefined;
      expect(data?.data?.id).to.equal('sb-123');
      expect(data?.data?.state).to.equal('started');
      expect(data?.data?.realm).to.equal('zzzv');
    });

    it('should handle 404 not found', async () => {
      server.use(
        http.get(`${BASE_URL}/sandboxes/nonexistent`, () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Sandbox not found',
                code: 'NOT_FOUND',
              },
            },
            {status: 404},
          );
        }),
      );

      const {data, error, response} = await odsClient.GET('/sandboxes/{sandboxId}', {
        params: {
          path: {sandboxId: 'nonexistent'},
        },
      });

      expect(data).to.be.undefined;
      expect(error).to.exist;
      expect(response.status).to.equal(404);
    });
  });

  describe('POST /sandboxes', () => {
    it('should create a sandbox', async () => {
      server.use(
        http.post(`${BASE_URL}/sandboxes`, async ({request}) => {
          const body = (await request.json()) as {realm: string; ttl: number; resourceProfile: string};
          expect(body.realm).to.equal('zzzv');
          expect(body.ttl).to.equal(24);
          expect(body.resourceProfile).to.equal('medium');
          return HttpResponse.json({
            data: {
              id: 'new-sb-id',
              realm: body.realm,
              state: 'creating',
              resourceProfile: body.resourceProfile,
            },
          });
        }),
      );

      const {data, error} = await odsClient.POST('/sandboxes', {
        body: {
          realm: 'zzzv',
          ttl: 24,
          resourceProfile: 'medium',
          autoScheduled: false,
          analyticsEnabled: false,
        },
      });

      expect(error).to.be.undefined;
      expect(data?.data?.id).to.equal('new-sb-id');
      expect(data?.data?.state).to.equal('creating');
    });

    it('should include settings in request', async () => {
      server.use(
        http.post(`${BASE_URL}/sandboxes`, async ({request}) => {
          const body = (await request.json()) as {
            settings?: {ocapi?: unknown[]; webdav?: unknown[]};
          };
          expect(body.settings).to.exist;
          expect(body.settings?.ocapi).to.be.an('array');
          expect(body.settings?.webdav).to.be.an('array');
          return HttpResponse.json({
            data: {id: 'new-sb-id', realm: 'zzzv', state: 'creating'},
          });
        }),
      );

      const {data, error} = await odsClient.POST('/sandboxes', {
        body: {
          realm: 'zzzv',
          ttl: 24,
          resourceProfile: 'medium',
          autoScheduled: false,
          analyticsEnabled: false,
          settings: {
            ocapi: [{client_id: 'test-client', resources: []}],
            webdav: [{client_id: 'test-client', permissions: []}],
          },
        },
      });

      expect(error).to.be.undefined;
      expect(data?.data?.id).to.equal('new-sb-id');
      expect(data?.data?.state).to.equal('creating');
    });

    it('should handle validation errors', async () => {
      server.use(
        http.post(`${BASE_URL}/sandboxes`, () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Invalid realm',
                code: 'VALIDATION_ERROR',
              },
            },
            {status: 400},
          );
        }),
      );

      const {data, error, response} = await odsClient.POST('/sandboxes', {
        body: {
          realm: 'invalid',
          ttl: 24,
          resourceProfile: 'medium',
          autoScheduled: false,
          analyticsEnabled: false,
        },
      });

      expect(data).to.be.undefined;
      expect(error).to.exist;
      expect(response.status).to.equal(400);
    });
  });

  describe('POST /sandboxes/{sandboxId}/operations', () => {
    ['start', 'stop', 'restart'].forEach((operation) => {
      it(`should ${operation} a sandbox`, async () => {
        server.use(
          http.post(`${BASE_URL}/sandboxes/sb-123/operations`, async ({request}) => {
            const body = (await request.json()) as {operation: string};
            expect(body.operation).to.equal(operation);
            return HttpResponse.json({
              data: {
                id: `op-${operation}-123`,
                sandboxId: 'sb-123',
                operation,
                operationState: 'running',
              },
            });
          }),
        );

        const {data, error} = await odsClient.POST('/sandboxes/{sandboxId}/operations', {
          params: {
            path: {sandboxId: 'sb-123'},
          },
          body: {
            operation: operation as 'start' | 'stop' | 'restart',
          },
        });

        expect(error).to.be.undefined;
        expect(data?.data?.operationState).to.equal('running');
      });
    });

    it('should handle invalid state transitions', async () => {
      server.use(
        http.post(`${BASE_URL}/sandboxes/sb-123/operations`, () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Invalid state transition',
                code: 'INVALID_STATE',
              },
            },
            {status: 400},
          );
        }),
      );

      const {data, error, response} = await odsClient.POST('/sandboxes/{sandboxId}/operations', {
        params: {
          path: {sandboxId: 'sb-123'},
        },
        body: {
          operation: 'start',
        },
      });

      expect(data).to.be.undefined;
      expect(error).to.exist;
      expect(response.status).to.equal(400);
    });
  });

  describe('DELETE /sandboxes/{sandboxId}', () => {
    it('should delete a sandbox', async () => {
      server.use(
        http.delete(`${BASE_URL}/sandboxes/sb-123`, () => {
          return HttpResponse.json({
            data: {
              id: 'op-123',
              sandboxId: 'sb-123',
              status: 'deleting',
            },
          });
        }),
      );

      const {error} = await odsClient.DELETE('/sandboxes/{sandboxId}', {
        params: {
          path: {sandboxId: 'sb-123'},
        },
      });

      expect(error).to.be.undefined;
    });

    it('should handle sandbox not found', async () => {
      server.use(
        http.delete(`${BASE_URL}/sandboxes/nonexistent`, () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Sandbox not found',
                code: 'NOT_FOUND',
              },
            },
            {status: 404},
          );
        }),
      );

      const {data, error, response} = await odsClient.DELETE('/sandboxes/{sandboxId}', {
        params: {
          path: {sandboxId: 'nonexistent'},
        },
      });

      expect(data).to.be.undefined;
      expect(error).to.exist;
      expect(response.status).to.equal(404);
    });
  });

  describe('GET /me', () => {
    it('should get user info', async () => {
      const mockUserInfo = {
        data: {
          user: {
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
          },
          realms: ['zzzv', 'aaaa'],
          sandboxes: ['sb-1', 'sb-2'],
        },
      };

      server.use(
        http.get(`${BASE_URL}/me`, () => {
          return HttpResponse.json(mockUserInfo);
        }),
      );

      const {data, error} = await odsClient.GET('/me', {});

      expect(error).to.be.undefined;
      expect(data?.data?.user?.name).to.equal('Test User');
      expect(data?.data?.realms).to.have.lengthOf(2);
    });
  });

  describe('GET /system', () => {
    it('should get system info', async () => {
      const mockSystemInfo = {
        data: {
          region: 'us-east-1',
          inboundIps: ['1.2.3.4'],
          outboundIps: ['5.6.7.8'],
          sandboxIps: ['9.10.11.12', '13.14.15.16'],
        },
      };

      server.use(
        http.get(`${BASE_URL}/system`, () => {
          return HttpResponse.json(mockSystemInfo);
        }),
      );

      const {data, error} = await odsClient.GET('/system', {});

      expect(error).to.be.undefined;
      expect(data?.data?.region).to.equal('us-east-1');
      expect(data?.data?.sandboxIps).to.have.lengthOf(2);
    });
  });

  describe('authentication', () => {
    it('should include Bearer token in requests', async () => {
      server.use(
        http.get(`${BASE_URL}/sandboxes`, ({request}) => {
          const authHeader = request.headers.get('Authorization');
          expect(authHeader).to.equal('Bearer test-token');
          return HttpResponse.json({data: []});
        }),
      );

      const {error} = await odsClient.GET('/sandboxes', {});

      expect(error).to.be.undefined;
    });

    it('should use custom token when provided', async () => {
      const customAuth = new MockAuthStrategy('custom-token-123');
      const customClient = createOdsClient({host: TEST_HOST}, customAuth);

      server.use(
        http.get(`${BASE_URL}/sandboxes`, ({request}) => {
          const authHeader = request.headers.get('Authorization');
          expect(authHeader).to.equal('Bearer custom-token-123');
          return HttpResponse.json({data: []});
        }),
      );

      const {error} = await customClient.GET('/sandboxes', {});
      expect(error).to.be.undefined;
    });
  });
});
