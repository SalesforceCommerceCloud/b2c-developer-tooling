/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {getRole, listRoles} from '../../../src/operations/roles/index.js';
import {createAccountManagerRolesClient} from '../../../src/clients/am-api.js';
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
        http.get(`${BASE_URL}/roles/bm-admin`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json(mockRole);
        }),
      );

      const result = await getRole(client, 'bm-admin');

      expect(result.id).to.equal('bm-admin');
      expect(result.roleEnumName).to.equal('ECOM_ADMIN');
      expect(result.permissions).to.deep.equal(['permission1', 'permission2']);
    });

    it('should throw a not-found error when role missing', async () => {
      server.use(
        http.get(`${BASE_URL}/roles/missing`, () => {
          return HttpResponse.json({error: {message: 'Not found'}}, {status: 404});
        }),
      );

      try {
        await getRole(client, 'missing');
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Role missing not found');
      }
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
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          const url = new URL(request.url);
          expect(url.searchParams.get('size')).to.equal('20');
          expect(url.searchParams.get('page')).to.equal('0');
          return HttpResponse.json(mockRoles);
        }),
      );

      const result = await listRoles(client);

      expect(result.content).to.have.lengthOf(1);
      expect(result.content?.[0].id).to.equal('bm-admin');
    });

    it('should forward custom pagination to the request', async () => {
      server.use(
        http.get(`${BASE_URL}/roles`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('size')).to.equal('50');
          expect(url.searchParams.get('page')).to.equal('1');
          return HttpResponse.json({content: []});
        }),
      );

      const result = await listRoles(client, {size: 50, page: 1});

      expect(result.content).to.deep.equal([]);
    });

    it('should forward roleTargetType filter to the request', async () => {
      server.use(
        http.get(`${BASE_URL}/roles`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('roleTargetType')).to.equal('User');
          return HttpResponse.json({content: []});
        }),
      );

      const result = await listRoles(client, {roleTargetType: 'User'});

      expect(result.content).to.deep.equal([]);
    });
  });
});
