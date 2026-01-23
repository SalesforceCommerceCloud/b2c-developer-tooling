/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {getUserByLogin, createUser, updateUser, grantRole, revokeRole} from '../../../src/operations/users/index.js';
import {createAccountManagerUsersClient} from '../../../src/clients/am-users-api.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const TEST_HOST = 'account.test.demandware.com';
const BASE_URL = `https://${TEST_HOST}/dw/rest/v1`;

describe('operations/users', () => {
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

  let client: ReturnType<typeof createAccountManagerUsersClient>;
  let mockAuth: MockAuthStrategy;

  beforeEach(() => {
    mockAuth = new MockAuthStrategy();
    client = createAccountManagerUsersClient({hostname: TEST_HOST}, mockAuth);
  });

  describe('getUserByLogin', () => {
    it('should get user by login', async () => {
      const mockUser = {
        id: 'user-123',
        mail: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      server.use(
        http.get(`${BASE_URL}/users`, () => {
          return HttpResponse.json({content: [mockUser]});
        }),
      );

      const result = await getUserByLogin(client, 'user@example.com');

      expect(result).to.deep.equal(mockUser);
    });

    it('should throw error when user not found', async () => {
      server.use(
        http.get(`${BASE_URL}/users`, () => {
          return HttpResponse.json({content: []});
        }),
      );

      try {
        await getUserByLogin(client, 'nonexistent@example.com');
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('User nonexistent@example.com not found');
      }
    });
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const userData = {
        mail: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        organizations: ['org-123'],
        primaryOrganization: 'org-123',
      };

      const createdUser = {
        id: 'user-456',
        ...userData,
      };

      server.use(
        http.post(`${BASE_URL}/users`, async ({request}) => {
          const body = (await request.json()) as typeof userData;
          expect(body).to.deep.equal(userData);
          return HttpResponse.json(createdUser, {status: 201});
        }),
      );

      const result = await createUser(client, {user: userData});

      expect(result).to.deep.equal(createdUser);
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const userId = 'user-123';
      const changes = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const updatedUser = {
        id: userId,
        mail: 'user@example.com',
        ...changes,
      };

      server.use(
        http.put(`${BASE_URL}/users/${userId}`, async ({request}) => {
          const body = (await request.json()) as typeof changes;
          expect(body).to.deep.equal(changes);
          return HttpResponse.json(updatedUser);
        }),
      );

      const result = await updateUser(client, {userId, changes});

      expect(result).to.deep.equal(updatedUser);
    });
  });

  describe('grantRole', () => {
    it('should grant a role without scope', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        mail: 'user@example.com',
        roles: [],
      };

      const updatedUser = {
        ...mockUser,
        roles: ['bm-admin'],
      };

      let getUserCallCount = 0;
      let updateUserCallCount = 0;

      server.use(
        http.get(`${BASE_URL}/users/${userId}`, () => {
          getUserCallCount++;
          return HttpResponse.json(mockUser);
        }),
        http.put(`${BASE_URL}/users/${userId}`, async ({request}) => {
          updateUserCallCount++;
          const body = (await request.json()) as {roles?: string[]};
          expect(body.roles).to.include('bm-admin');
          return HttpResponse.json(updatedUser);
        }),
      );

      const result = await grantRole(client, {userId, role: 'bm-admin'});

      expect(result).to.deep.equal(updatedUser);
      expect(getUserCallCount).to.equal(1);
      expect(updateUserCallCount).to.equal(1);
    });

    it('should grant a role with scope', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        mail: 'user@example.com',
        roles: [],
        roleTenantFilter: '',
      };

      const updatedUser = {
        ...mockUser,
        roles: ['bm-admin'],
        roleTenantFilter: 'bm-admin:tenant1,tenant2',
      };

      server.use(
        http.get(`${BASE_URL}/users/${userId}`, () => {
          return HttpResponse.json(mockUser);
        }),
        http.put(`${BASE_URL}/users/${userId}`, async ({request}) => {
          const body = (await request.json()) as {roleTenantFilter?: string};
          expect(body.roleTenantFilter).to.include('bm-admin:tenant1,tenant2');
          return HttpResponse.json(updatedUser);
        }),
      );

      const result = await grantRole(client, {
        userId,
        role: 'bm-admin',
        scope: 'tenant1,tenant2',
      });

      expect(result).to.deep.equal(updatedUser);
    });

    it('should add scope to existing role', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        mail: 'user@example.com',
        roles: ['bm-admin'],
        roleTenantFilter: 'bm-admin:tenant1',
      };

      const updatedUser = {
        ...mockUser,
        roleTenantFilter: 'bm-admin:tenant1,tenant2',
      };

      server.use(
        http.get(`${BASE_URL}/users/${userId}`, () => {
          return HttpResponse.json(mockUser);
        }),
        http.put(`${BASE_URL}/users/${userId}`, async ({request}) => {
          const body = (await request.json()) as {roleTenantFilter?: string};
          expect(body.roleTenantFilter).to.include('tenant1');
          expect(body.roleTenantFilter).to.include('tenant2');
          return HttpResponse.json(updatedUser);
        }),
      );

      await grantRole(client, {
        userId,
        role: 'bm-admin',
        scope: 'tenant2',
      });
    });
  });

  describe('revokeRole', () => {
    it('should revoke entire role', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        mail: 'user@example.com',
        roles: ['bm-admin', 'bm-user'],
        roleTenantFilter: 'bm-admin:tenant1',
      };

      const updatedUser = {
        ...mockUser,
        roles: ['bm-user'],
        roleTenantFilter: '',
      };

      server.use(
        http.get(`${BASE_URL}/users/${userId}`, () => {
          return HttpResponse.json(mockUser);
        }),
        http.put(`${BASE_URL}/users/${userId}`, async ({request}) => {
          const body = (await request.json()) as {roles?: string[]};
          expect(body.roles).to.not.include('bm-admin');
          expect(body.roles).to.include('bm-user');
          return HttpResponse.json(updatedUser);
        }),
      );

      const result = await revokeRole(client, {userId, role: 'bm-admin'});

      expect(result).to.deep.equal(updatedUser);
    });

    it('should revoke specific scope from role', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        mail: 'user@example.com',
        roles: ['bm-admin'],
        roleTenantFilter: 'bm-admin:tenant1,tenant2',
      };

      const updatedUser = {
        ...mockUser,
        roleTenantFilter: 'bm-admin:tenant1',
      };

      server.use(
        http.get(`${BASE_URL}/users/${userId}`, () => {
          return HttpResponse.json(mockUser);
        }),
        http.put(`${BASE_URL}/users/${userId}`, async ({request}) => {
          const body = (await request.json()) as {roleTenantFilter?: string};
          expect(body.roleTenantFilter).to.include('tenant1');
          expect(body.roleTenantFilter).to.not.include('tenant2');
          return HttpResponse.json(updatedUser);
        }),
      );

      await revokeRole(client, {
        userId,
        role: 'bm-admin',
        scope: 'tenant2',
      });
    });

    it('should remove role when all scopes are revoked', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        mail: 'user@example.com',
        roles: ['bm-admin'],
        roleTenantFilter: 'bm-admin:tenant1',
      };

      const updatedUser = {
        ...mockUser,
        roles: [],
        roleTenantFilter: '',
      };

      server.use(
        http.get(`${BASE_URL}/users/${userId}`, () => {
          return HttpResponse.json(mockUser);
        }),
        http.put(`${BASE_URL}/users/${userId}`, async ({request}) => {
          const body = (await request.json()) as {roleTenantFilter?: string};
          expect(body.roleTenantFilter).to.be.undefined;
          return HttpResponse.json(updatedUser);
        }),
      );

      await revokeRole(client, {
        userId,
        role: 'bm-admin',
        scope: 'tenant1',
      });
    });
  });
});
