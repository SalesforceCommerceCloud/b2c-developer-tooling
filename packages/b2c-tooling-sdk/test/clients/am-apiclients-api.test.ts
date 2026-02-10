/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {
  createAccountManagerApiClientsClient,
  listApiClients,
  getApiClient,
  createApiClient,
  updateApiClient,
  deleteApiClient,
  changeApiClientPassword,
} from '../../src/clients/am-api.js';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const TEST_HOST = 'account.test.demandware.com';
const BASE_URL = `https://${TEST_HOST}/dw/rest/v1`;

describe('Account Manager API Clients API', () => {
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

  let client: ReturnType<typeof createAccountManagerApiClientsClient>;
  let mockAuth: MockAuthStrategy;

  beforeEach(() => {
    mockAuth = new MockAuthStrategy();
    client = createAccountManagerApiClientsClient({hostname: TEST_HOST}, mockAuth);
  });

  describe('client creation', () => {
    it('should create client with default host', () => {
      const auth = new MockAuthStrategy();
      const c = createAccountManagerApiClientsClient({}, auth);
      expect(c).to.exist;
    });

    it('should create client with custom host', () => {
      const auth = new MockAuthStrategy();
      const c = createAccountManagerApiClientsClient({hostname: 'custom.host.com'}, auth);
      expect(c).to.exist;
    });
  });

  describe('listApiClients', () => {
    it('should list API clients with default pagination', async () => {
      const mockContent = [
        {
          id: 'client-1',
          name: 'Test Client',
          description: 'A test client',
          active: true,
          tokenEndpointAuthMethod: 'client_secret_basic',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      server.use(
        http.get(`${BASE_URL}/apiclients`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          const url = new URL(request.url);
          expect(url.searchParams.get('size')).to.equal('20');
          expect(url.searchParams.get('page')).to.equal('0');
          return HttpResponse.json({content: mockContent});
        }),
      );

      const result = await listApiClients(client, {});

      expect(result.content).to.have.lengthOf(1);
      expect(result.content![0].id).to.equal('client-1');
      expect(result.content![0].name).to.equal('Test Client');
    });

    it('should pass size and page options', async () => {
      server.use(
        http.get(`${BASE_URL}/apiclients`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('size')).to.equal('50');
          expect(url.searchParams.get('page')).to.equal('2');
          return HttpResponse.json({content: []});
        }),
      );

      const result = await listApiClients(client, {size: 50, page: 2});

      expect(result.content).to.deep.equal([]);
    });

    it('should throw on API error', async () => {
      server.use(
        http.get(`${BASE_URL}/apiclients`, () => {
          return HttpResponse.json({errors: [{message: 'Forbidden'}]}, {status: 403});
        }),
      );

      try {
        await listApiClients(client, {});
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Forbidden');
      }
    });
  });

  describe('getApiClient', () => {
    it('should get API client by ID', async () => {
      const mockClient = {
        id: 'client-123',
        name: 'My Client',
        description: 'Description',
        active: true,
        tokenEndpointAuthMethod: 'client_secret_post',
        createdAt: '2025-01-01T00:00:00.000Z',
        redirectUrls: ['https://example.com/callback'],
        scopes: ['openid'],
        defaultScopes: [],
        versionControl: false,
        passwordModificationTimestamp: null,
      };

      server.use(
        http.get(`${BASE_URL}/apiclients/client-123`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json(mockClient);
        }),
      );

      const result = await getApiClient(client, 'client-123');

      expect(result.id).to.equal('client-123');
      expect(result.name).to.equal('My Client');
      expect(result.redirectUrls).to.deep.equal(['https://example.com/callback']);
    });

    it('should pass expand query when provided', async () => {
      server.use(
        http.get(`${BASE_URL}/apiclients/client-123`, ({request}) => {
          const url = new URL(request.url);
          const expandParams = url.searchParams.getAll('expand');
          expect(expandParams).to.include('organizations');
          expect(expandParams).to.include('roles');
          return HttpResponse.json({id: 'client-123', name: 'Test'});
        }),
      );

      await getApiClient(client, 'client-123', ['organizations', 'roles']);
    });

    it('should throw when API client not found', async () => {
      server.use(
        http.get(`${BASE_URL}/apiclients/nonexistent`, () => {
          return HttpResponse.json({error: {message: 'Not found'}}, {status: 404});
        }),
      );

      try {
        await getApiClient(client, 'nonexistent');
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('API client nonexistent not found');
      }
    });
  });

  describe('createApiClient', () => {
    it('should create API client', async () => {
      const body = {
        name: 'New Client',
        description: 'New description',
        organizations: ['org-1'],
        active: false,
        password: 'SecureP@ssword12',
        tokenEndpointAuthMethod: 'client_secret_basic' as const,
      };
      const created = {
        id: 'new-id',
        name: body.name,
        description: body.description,
        active: false,
        tokenEndpointAuthMethod: body.tokenEndpointAuthMethod,
      };

      server.use(
        http.post(`${BASE_URL}/apiclients`, async ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          const sent = (await request.json()) as Record<string, unknown>;
          expect(sent.name).to.equal(body.name);
          expect(sent.description).to.equal(body.description);
          return HttpResponse.json(created);
        }),
      );

      const result = await createApiClient(client, body);

      expect(result.id).to.equal('new-id');
      expect(result.name).to.equal(body.name);
    });

    it('should omit active when false (minimal create body)', async () => {
      const body = {
        name: 'Inactive Client',
        organizations: ['org-1'],
        active: false,
        password: 'SecureP@ssword12',
        tokenEndpointAuthMethod: 'client_secret_basic' as const,
      };

      server.use(
        http.post(`${BASE_URL}/apiclients`, async ({request}) => {
          const sent = (await request.json()) as Record<string, unknown>;
          expect(sent).to.not.have.property('active');
          expect(sent.name).to.equal(body.name);
          return HttpResponse.json({id: 'id', name: body.name, active: false});
        }),
      );

      await createApiClient(client, body);
    });

    it('should throw with field errors on validation failure', async () => {
      server.use(
        http.post(`${BASE_URL}/apiclients`, () => {
          return HttpResponse.json(
            {
              errors: [
                {
                  message: 'Validation failed',
                  fieldErrors: [
                    {field: 'name', defaultMessage: 'must not be blank'},
                    {field: 'description', defaultMessage: 'length must be at most 256'},
                  ],
                },
              ],
            },
            {status: 400},
          );
        }),
      );

      try {
        await createApiClient(client, {
          name: '',
          organizations: ['org-1'],
          active: false,
          password: 'SecureP@ssword12',
          tokenEndpointAuthMethod: 'client_secret_basic',
        });
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        const msg = (error as Error).message;
        expect(msg).to.include('Validation failed');
        expect(msg).to.match(/name.*must not be blank|description.*256/);
      }
    });
  });

  describe('updateApiClient', () => {
    it('should update API client', async () => {
      const body = {name: 'Updated Name', description: 'Updated desc', active: true};
      const updated = {
        id: 'client-123',
        name: body.name,
        description: body.description,
        active: true,
        tokenEndpointAuthMethod: 'client_secret_basic',
      };

      server.use(
        http.put(`${BASE_URL}/apiclients/client-123`, async ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          const sent = (await request.json()) as Record<string, unknown>;
          expect(sent.name).to.equal(body.name);
          return HttpResponse.json(updated);
        }),
      );

      const result = await updateApiClient(client, 'client-123', body);

      expect(result.name).to.equal(body.name);
      expect(result.description).to.equal(body.description);
    });

    it('should throw with field errors on validation failure', async () => {
      server.use(
        http.put(`${BASE_URL}/apiclients/client-123`, () => {
          return HttpResponse.json(
            {
              errors: [
                {
                  message: 'Invalid request',
                  fieldErrors: [{field: 'name', defaultMessage: 'length must be at most 200'}],
                },
              ],
            },
            {status: 400},
          );
        }),
      );

      try {
        await updateApiClient(client, 'client-123', {name: 'x'.repeat(201), active: true});
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Invalid request');
        expect((error as Error).message).to.include('name');
      }
    });
  });

  describe('deleteApiClient', () => {
    it('should delete API client', async () => {
      server.use(
        http.delete(`${BASE_URL}/apiclients/client-123`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return new HttpResponse(null, {status: 204});
        }),
      );

      await deleteApiClient(client, 'client-123');
    });

    it('should throw when client must be disabled 7 days', async () => {
      server.use(
        http.delete(`${BASE_URL}/apiclients/client-123`, () => {
          return HttpResponse.json({error: {message: 'Precondition Failed'}}, {status: 412});
        }),
      );

      try {
        await deleteApiClient(client, 'client-123');
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('disabled for at least 7 days');
      }
    });
  });

  describe('changeApiClientPassword', () => {
    it('should change API client password', async () => {
      server.use(
        http.put(`${BASE_URL}/apiclients/client-123/password`, async ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          const body = (await request.json()) as {old: string; new: string};
          expect(body.old).to.equal('old-secret');
          expect(body.new).to.equal('new-secret');
          return new HttpResponse(null, {status: 204});
        }),
      );

      await changeApiClientPassword(client, 'client-123', 'old-secret', 'new-secret');
    });

    it('should throw on API error', async () => {
      server.use(
        http.put(`${BASE_URL}/apiclients/client-123/password`, () => {
          return HttpResponse.json({error: {message: 'Current password is incorrect'}}, {status: 400});
        }),
      );

      try {
        await changeApiClientPassword(client, 'client-123', 'wrong', 'new-secret');
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Current password is incorrect');
      }
    });
  });
});
