/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {
  createAccountManagerUsersClient,
  createAccountManagerRolesClient,
  getUser,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUser,
  findUserByLogin,
  fetchRoleMapping,
  resolveToInternalRole,
  resolveFromInternalRole,
} from '../../src/clients/am-api.js';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const TEST_HOST = 'account.test.demandware.com';
const BASE_URL = `https://${TEST_HOST}/dw/rest/v1`;

describe('Account Manager Users API Client', () => {
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

  describe('client creation', () => {
    it('should create client with default host', () => {
      const auth = new MockAuthStrategy();
      const client = createAccountManagerUsersClient({}, auth);
      expect(client).to.exist;
    });

    it('should create client with custom host', () => {
      const auth = new MockAuthStrategy();
      const client = createAccountManagerUsersClient({hostname: 'custom.host.com'}, auth);
      expect(client).to.exist;
    });
  });

  describe('getUser', () => {
    it('should get user by ID', async () => {
      const mockUser = {
        id: 'user-123',
        mail: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userState: 'ENABLED',
      };

      server.use(
        http.get(`${BASE_URL}/users/user-123`, () => {
          return HttpResponse.json(mockUser);
        }),
      );

      const user = await getUser(client, 'user-123');

      expect(user).to.deep.equal(mockUser);
      expect(user.mail).to.equal('user@example.com');
    });

    it('should throw error when user not found', async () => {
      server.use(
        http.get(`${BASE_URL}/users/nonexistent`, () => {
          return HttpResponse.json({error: {message: 'User not found'}}, {status: 404});
        }),
      );

      try {
        await getUser(client, 'nonexistent');
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('User nonexistent not found');
      }
    });
  });

  describe('listUsers', () => {
    it('should list users with pagination', async () => {
      const mockUsers = {
        content: [
          {id: 'user-1', mail: 'user1@example.com', firstName: 'John', lastName: 'Doe'},
          {id: 'user-2', mail: 'user2@example.com', firstName: 'Jane', lastName: 'Smith'},
        ],
      };

      server.use(
        http.get(`${BASE_URL}/users`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('size')).to.equal('20');
          expect(url.searchParams.get('page')).to.equal('0');
          return HttpResponse.json(mockUsers);
        }),
      );

      const result = await listUsers(client, {size: 20, page: 0});

      expect(result.content).to.not.be.undefined;
      expect(result.content).to.have.lengthOf(2);
      expect(result.content![0].mail).to.equal('user1@example.com');
    });

    it('should use default pagination', async () => {
      server.use(
        http.get(`${BASE_URL}/users`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('size')).to.equal('20');
          expect(url.searchParams.get('page')).to.equal('0');
          return HttpResponse.json({content: []});
        }),
      );

      const result = await listUsers(client);

      expect(result.content).to.be.an('array');
    });

    it('should handle out-of-bounds page error', async () => {
      server.use(
        http.get(`${BASE_URL}/users`, () => {
          return HttpResponse.json(
            {
              errors: [{message: 'fromIndex(60) > toIndex(55)', code: 'PAGINATION_ERROR'}],
            },
            {status: 400},
          );
        }),
      );

      try {
        await listUsers(client, {size: 20, page: 3});
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Page 3 is out of bounds');
      }
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const newUser = {
        mail: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        organizations: ['org-123'],
        primaryOrganization: 'org-123',
      };

      const createdUser = {
        id: 'user-456',
        ...newUser,
        userState: 'INITIAL',
      };

      server.use(
        http.post(`${BASE_URL}/users`, async ({request}) => {
          const body = await request.json();
          expect(body).to.deep.equal(newUser);
          return HttpResponse.json(createdUser, {status: 201});
        }),
      );

      const result = await createUser(client, newUser);

      expect(result).to.deep.equal(createdUser);
      expect(result.mail).to.equal('newuser@example.com');
    });
  });

  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const userId = 'user-123';
      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const updatedUser = {
        id: userId,
        mail: 'user@example.com',
        ...updates,
      };

      server.use(
        http.put(`${BASE_URL}/users/${userId}`, async ({request}) => {
          const body = await request.json();
          expect(body).to.deep.equal(updates);
          return HttpResponse.json(updatedUser);
        }),
      );

      const result = await updateUser(client, userId, updates);

      expect(result).to.deep.equal(updatedUser);
      expect(result.firstName).to.equal('Updated');
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const userId = 'user-123';

      server.use(
        http.post(`${BASE_URL}/users/${userId}/disable`, () => {
          return HttpResponse.json({}, {status: 200});
        }),
      );

      await deleteUser(client, userId);
      // Should not throw
    });
  });

  describe('resetUser', () => {
    it('should reset a user', async () => {
      const userId = 'user-123';

      server.use(
        http.post(`${BASE_URL}/users/${userId}/reset`, () => {
          return HttpResponse.json({}, {status: 200});
        }),
      );

      await resetUser(client, userId);
      // Should not throw
    });
  });

  describe('findUserByLogin', () => {
    it('should find user by email', async () => {
      const mockUser = {id: 'user-123', mail: 'user@example.com', firstName: 'John', lastName: 'Doe'};

      server.use(
        http.get(`${BASE_URL}/users/search/findByLogin`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('login')).to.equal('user@example.com');
          return HttpResponse.json(mockUser);
        }),
      );

      const user = await findUserByLogin(client, 'user@example.com');

      expect(user).to.deep.equal(mockUser);
    });

    it('should return undefined when user not found', async () => {
      server.use(
        http.get(`${BASE_URL}/users/search/findByLogin`, () => {
          return HttpResponse.json({}, {status: 404});
        }),
      );

      const result = await findUserByLogin(client, 'nonexistent@example.com');

      expect(result).to.be.undefined;
    });

    it('should fetch expanded user when expand is requested', async () => {
      const mockUser = {id: 'user-123', mail: 'user@example.com', firstName: 'John', lastName: 'Doe'};
      const expandedUser = {
        ...mockUser,
        organizations: [{id: 'org-1', name: 'Test Org'}],
      };

      server.use(
        http.get(`${BASE_URL}/users/search/findByLogin`, () => {
          return HttpResponse.json(mockUser);
        }),
        http.get(`${BASE_URL}/users/user-123`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('expand')).to.equal('organizations');
          return HttpResponse.json(expandedUser);
        }),
      );

      const user = await findUserByLogin(client, 'user@example.com', ['organizations']);

      expect(user).to.deep.equal(expandedUser);
    });
  });

  describe('role mapping', () => {
    const mockRoles = {
      content: [
        {id: 'bm-admin', roleEnumName: 'ECOM_ADMIN', description: 'Business Manager Administrator'},
        {id: 'bm-user', roleEnumName: 'ECOM_USER', description: 'Business Manager User'},
      ],
    };

    it('should fetch role mapping from the API', async () => {
      server.use(
        http.get(`${BASE_URL}/roles`, () => {
          return HttpResponse.json(mockRoles);
        }),
      );

      const rolesClient = createAccountManagerRolesClient({hostname: TEST_HOST}, mockAuth);
      const mapping = await fetchRoleMapping(rolesClient);

      expect(mapping.byId.get('bm-admin')).to.equal('ECOM_ADMIN');
      expect(mapping.byId.get('bm-user')).to.equal('ECOM_USER');
      expect(mapping.byEnumName.get('ECOM_ADMIN')).to.equal('bm-admin');
      expect(mapping.byEnumName.get('ECOM_USER')).to.equal('bm-user');
    });

    it('should resolve role id to internal roleEnumName', async () => {
      server.use(
        http.get(`${BASE_URL}/roles`, () => {
          return HttpResponse.json(mockRoles);
        }),
      );

      const rolesClient = createAccountManagerRolesClient({hostname: TEST_HOST}, mockAuth);
      const mapping = await fetchRoleMapping(rolesClient);

      expect(resolveToInternalRole('bm-admin', mapping)).to.equal('ECOM_ADMIN');
      expect(resolveToInternalRole('bm-user', mapping)).to.equal('ECOM_USER');
      // Accepts roleEnumName directly
      expect(resolveToInternalRole('ECOM_ADMIN', mapping)).to.equal('ECOM_ADMIN');
      // Falls back to generic transform for unknown roles
      expect(resolveToInternalRole('custom-role', mapping)).to.equal('CUSTOM_ROLE');
    });

    it('should resolve internal roleEnumName to role id', async () => {
      server.use(
        http.get(`${BASE_URL}/roles`, () => {
          return HttpResponse.json(mockRoles);
        }),
      );

      const rolesClient = createAccountManagerRolesClient({hostname: TEST_HOST}, mockAuth);
      const mapping = await fetchRoleMapping(rolesClient);

      expect(resolveFromInternalRole('ECOM_ADMIN', mapping)).to.equal('bm-admin');
      expect(resolveFromInternalRole('ECOM_USER', mapping)).to.equal('bm-user');
      // Falls back to generic transform for unknown roles
      expect(resolveFromInternalRole('CUSTOM_ROLE', mapping)).to.equal('custom-role');
    });
  });
});
