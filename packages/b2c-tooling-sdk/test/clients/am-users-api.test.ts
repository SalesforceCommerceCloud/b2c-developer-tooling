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
  getUser,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUser,
  findUserByLogin,
  mapToInternalRole,
  mapFromInternalRole,
} from '../../src/clients/am-users-api.js';
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
      const mockUsers = {
        content: [{id: 'user-123', mail: 'user@example.com', firstName: 'John', lastName: 'Doe'}],
      };

      server.use(
        http.get(`${BASE_URL}/users`, ({request}) => {
          const url = new URL(request.url);
          // findUserByLogin searches through paginated results
          expect(url.searchParams.get('size')).to.equal('100');
          return HttpResponse.json(mockUsers);
        }),
      );

      const user = await findUserByLogin(client, 'user@example.com');

      expect(user).to.deep.equal(mockUsers.content[0]);
    });

    it('should return undefined when user not found', async () => {
      server.use(
        http.get(`${BASE_URL}/users`, () => {
          return HttpResponse.json({content: []});
        }),
      );

      const result = await findUserByLogin(client, 'nonexistent@example.com');

      expect(result).to.be.undefined;
    });

    it('should search through multiple pages', async () => {
      // Create 100 users for page 1 (full page size)
      const page1Users = {
        content: Array.from({length: 100}, (_, i) => ({
          id: `user-${i + 1}`,
          mail: `user${i + 1}@example.com`,
        })),
      };

      const page2Users = {
        content: [{id: 'user-123', mail: 'user@example.com', firstName: 'John', lastName: 'Doe'}],
      };

      let callCount = 0;
      server.use(
        http.get(`${BASE_URL}/users`, ({request}) => {
          callCount++;
          const url = new URL(request.url);
          const page = Number(url.searchParams.get('page') || '0');
          if (page === 0) {
            return HttpResponse.json(page1Users);
          }
          return HttpResponse.json(page2Users);
        }),
      );

      const user = await findUserByLogin(client, 'user@example.com');

      expect(user).to.deep.equal(page2Users.content[0]);
      expect(callCount).to.equal(2);
    });
  });

  describe('role mapping', () => {
    it('should map role name to internal role ID', () => {
      expect(mapToInternalRole('bm-admin')).to.equal('ECOM_ADMIN');
      expect(mapToInternalRole('bm-user')).to.equal('ECOM_USER');
      expect(mapToInternalRole('custom-role')).to.equal('CUSTOM_ROLE');
    });

    it('should map internal role ID to role name', () => {
      expect(mapFromInternalRole('bm-admin')).to.equal('bm-admin');
      expect(mapFromInternalRole('bm-user')).to.equal('bm-user');
      expect(mapFromInternalRole('CUSTOM_ROLE')).to.equal('custom-role');
    });
  });
});
