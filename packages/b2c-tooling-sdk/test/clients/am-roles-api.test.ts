/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createAccountManagerRolesClient, getRole, listRoles} from '../../src/clients/am-roles-api.js';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const TEST_HOST = 'account.test.demandware.com';
const BASE_URL = `https://${TEST_HOST}/dw/rest/v1`;

describe('Account Manager Roles API Client', () => {
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

  let client: ReturnType<typeof createAccountManagerRolesClient>;
  let mockAuth: MockAuthStrategy;

  beforeEach(() => {
    mockAuth = new MockAuthStrategy();
    client = createAccountManagerRolesClient({hostname: TEST_HOST}, mockAuth);
  });

  describe('client creation', () => {
    it('should create client with default host', () => {
      const auth = new MockAuthStrategy();
      const client = createAccountManagerRolesClient({}, auth);
      expect(client).to.exist;
    });

    it('should create client with custom host', () => {
      const auth = new MockAuthStrategy();
      const client = createAccountManagerRolesClient({hostname: 'custom.host.com'}, auth);
      expect(client).to.exist;
    });
  });

  describe('getRole', () => {
    it('should get role by ID', async () => {
      const mockRole = {
        id: 'bm-admin',
        description: 'Business Manager Administrator',
        roleEnumName: 'ECOM_ADMIN',
        scope: 'INSTANCE',
        targetType: 'User',
        twoFAEnabled: false,
        permissions: ['permission1', 'permission2'],
      };

      server.use(
        http.get(`${BASE_URL}/roles/bm-admin`, () => {
          return HttpResponse.json(mockRole);
        }),
      );

      const role = await getRole(client, 'bm-admin');

      expect(role).to.deep.equal(mockRole);
      expect(role.id).to.equal('bm-admin');
    });

    it('should throw error when role not found', async () => {
      server.use(
        http.get(`${BASE_URL}/roles/nonexistent`, () => {
          return HttpResponse.json({error: {message: 'Role not found'}}, {status: 404});
        }),
      );

      try {
        await getRole(client, 'nonexistent');
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Role nonexistent not found');
      }
    });
  });

  describe('listRoles', () => {
    it('should list roles with pagination', async () => {
      const mockRoles = {
        content: [
          {
            id: 'bm-admin',
            description: 'Business Manager Administrator',
            roleEnumName: 'ECOM_ADMIN',
            scope: 'INSTANCE',
            targetType: 'User',
          },
          {
            id: 'bm-user',
            description: 'Business Manager User',
            roleEnumName: 'ECOM_USER',
            scope: 'INSTANCE',
            targetType: 'User',
          },
        ],
      };

      server.use(
        http.get(`${BASE_URL}/roles`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('size')).to.equal('20');
          expect(url.searchParams.get('page')).to.equal('0');
          return HttpResponse.json(mockRoles);
        }),
      );

      const result = await listRoles(client, {size: 20, page: 0});

      expect(result.content).to.not.be.undefined;
      expect(result.content).to.have.lengthOf(2);
      expect(result.content![0].id).to.equal('bm-admin');
    });

    it('should use default pagination', async () => {
      server.use(
        http.get(`${BASE_URL}/roles`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('size')).to.equal('20');
          expect(url.searchParams.get('page')).to.equal('0');
          return HttpResponse.json({content: []});
        }),
      );

      const result = await listRoles(client);

      expect(result.content).to.be.an('array');
    });

    it('should filter by target type', async () => {
      server.use(
        http.get(`${BASE_URL}/roles`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('roleTargetType')).to.equal('User');
          return HttpResponse.json({content: []});
        }),
      );

      const result = await listRoles(client, {roleTargetType: 'User'});

      expect(result.content).to.be.an('array');
    });

    it('should handle out-of-bounds page error', async () => {
      server.use(
        http.get(`${BASE_URL}/roles`, () => {
          return HttpResponse.json(
            {
              errors: [{message: 'fromIndex(60) > toIndex(55)', code: 'PAGINATION_ERROR'}],
            },
            {status: 400},
          );
        }),
      );

      try {
        await listRoles(client, {size: 20, page: 3});
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Page 3 is out of bounds');
      }
    });
  });
});
