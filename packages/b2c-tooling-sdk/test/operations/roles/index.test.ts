/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {getRole, listRoles} from '../../../src/operations/roles/index.js';
import {createAccountManagerRolesClient} from '../../../src/clients/am-roles-api.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const TEST_HOST = 'account.test.demandware.com';
const BASE_URL = `https://${TEST_HOST}/dw/rest/v1`;

describe('operations/roles', () => {
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

      const result = await getRole(client, 'bm-admin');

      expect(result).to.deep.equal(mockRole);
    });
  });

  describe('listRoles', () => {
    it('should list roles with default options', async () => {
      const mockRoles = {
        content: [
          {
            id: 'bm-admin',
            description: 'Business Manager Administrator',
            roleEnumName: 'ECOM_ADMIN',
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

      const result = await listRoles(client);

      expect(result).to.deep.equal(mockRoles);
    });

    it('should list roles with pagination', async () => {
      const mockRoles = {
        content: [
          {
            id: 'bm-admin',
            description: 'Business Manager Administrator',
          },
        ],
      };

      server.use(
        http.get(`${BASE_URL}/roles`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('size')).to.equal('50');
          expect(url.searchParams.get('page')).to.equal('1');
          return HttpResponse.json(mockRoles);
        }),
      );

      const result = await listRoles(client, {size: 50, page: 1});

      expect(result).to.deep.equal(mockRoles);
    });

    it('should list roles with target type filter', async () => {
      const mockRoles = {
        content: [
          {
            id: 'bm-admin',
            description: 'Business Manager Administrator',
            targetType: 'User',
          },
        ],
      };

      server.use(
        http.get(`${BASE_URL}/roles`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('roleTargetType')).to.equal('User');
          return HttpResponse.json(mockRoles);
        }),
      );

      const result = await listRoles(client, {roleTargetType: 'User'});

      expect(result).to.deep.equal(mockRoles);
    });
  });
});
