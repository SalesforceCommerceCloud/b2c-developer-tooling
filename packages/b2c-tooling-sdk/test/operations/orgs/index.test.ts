/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {getOrg, getOrgByName, listOrgs, getOrgAuditLogs} from '../../../src/operations/orgs/index.js';
import {createAccountManagerOrgsClient} from '../../../src/clients/am-api.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const TEST_HOST = 'account.test.demandware.com';
const BASE_URL = `https://${TEST_HOST}/dw/rest/v1`;

describe('operations/orgs', () => {
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

  let client: ReturnType<typeof createAccountManagerOrgsClient>;
  let mockAuth: MockAuthStrategy;

  beforeEach(() => {
    mockAuth = new MockAuthStrategy();
    client = createAccountManagerOrgsClient({hostname: TEST_HOST}, mockAuth);
  });

  describe('getOrg', () => {
    it('should get organization by ID', async () => {
      const mockOrg = {
        id: 'org-123',
        name: 'Test Organization',
        realms: ['realm1', 'realm2'],
        twoFARoles: ['role1'],
        twoFAEnabled: true,
        allowedVerifierTypes: ['TOTP'],
        vaasEnabled: false,
        sfIdentityFederation: true,
      };

      server.use(
        http.get(`${BASE_URL}/organizations/org-123`, () => {
          return HttpResponse.json(mockOrg);
        }),
      );

      const result = await getOrg(client, 'org-123');

      expect(result).to.deep.equal(mockOrg);
      expect(result.id).to.equal('org-123');
      expect(result.name).to.equal('Test Organization');
    });

    it('should throw error when organization not found', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/nonexistent`, () => {
          return HttpResponse.json({error: {message: 'Not found'}}, {status: 404});
        }),
      );

      try {
        await getOrg(client, 'nonexistent');
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('not found');
      }
    });
  });

  describe('getOrgByName', () => {
    it('should get organization by name', async () => {
      const mockOrg = {
        id: 'org-123',
        name: 'Test Organization',
        realms: ['realm1'],
        twoFARoles: [],
        twoFAEnabled: false,
        allowedVerifierTypes: [],
        vaasEnabled: false,
        sfIdentityFederation: false,
      };

      server.use(
        http.get(`${BASE_URL}/organizations/search/findByName`, () => {
          return HttpResponse.json({content: [mockOrg]});
        }),
      );

      const result = await getOrgByName(client, 'Test Organization');

      expect(result).to.deep.equal(mockOrg);
      expect(result.name).to.equal('Test Organization');
    });

    it('should throw error when organization not found', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/search/findByName`, () => {
          return HttpResponse.json({content: []});
        }),
      );

      try {
        await getOrgByName(client, 'Nonexistent Org');
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('not found');
      }
    });
  });

  describe('listOrgs', () => {
    it('should list organizations with default options', async () => {
      const mockOrgs = {
        content: [
          {
            id: 'org-1',
            name: 'Organization 1',
            realms: ['realm1'],
            twoFARoles: [],
            twoFAEnabled: false,
            allowedVerifierTypes: [],
            vaasEnabled: false,
            sfIdentityFederation: false,
          },
        ],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 25,
      };

      server.use(
        http.get(`${BASE_URL}/organizations`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('size')).to.equal('25');
          expect(url.searchParams.get('page')).to.equal('0');
          return HttpResponse.json(mockOrgs);
        }),
      );

      const result = await listOrgs(client);

      expect(result).to.deep.equal(mockOrgs);
    });

    it('should list organizations with pagination', async () => {
      const mockOrgs = {
        content: [
          {
            id: 'org-1',
            name: 'Organization 1',
            realms: [],
            twoFARoles: [],
            twoFAEnabled: false,
            allowedVerifierTypes: [],
            vaasEnabled: false,
            sfIdentityFederation: false,
          },
        ],
        totalElements: 50,
        totalPages: 2,
        number: 1,
        size: 50,
      };

      server.use(
        http.get(`${BASE_URL}/organizations`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('size')).to.equal('50');
          expect(url.searchParams.get('page')).to.equal('1');
          return HttpResponse.json(mockOrgs);
        }),
      );

      const result = await listOrgs(client, {size: 50, page: 1});

      expect(result).to.deep.equal(mockOrgs);
    });

    it('should list all organizations when all flag is set', async () => {
      const mockOrgs = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 5000,
      };

      server.use(
        http.get(`${BASE_URL}/organizations`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('size')).to.equal('5000');
          return HttpResponse.json(mockOrgs);
        }),
      );

      const result = await listOrgs(client, {all: true});

      expect(result.size).to.equal(5000);
    });
  });

  describe('getOrgAuditLogs', () => {
    it('should get audit logs for organization', async () => {
      const mockLogs = {
        content: [
          {
            timestamp: '2025-01-15T10:30:45Z',
            authorDisplayName: 'John Doe',
            authorEmail: 'john.doe@example.com',
            eventType: 'USER_CREATED',
            eventMessage: 'User created successfully',
          },
          {
            timestamp: '2025-01-16T14:20:30Z',
            authorDisplayName: 'Jane Smith',
            authorEmail: 'jane.smith@example.com',
            eventType: 'USER_UPDATED',
            eventMessage: 'User updated',
          },
        ],
        totalElements: 2,
        totalPages: 1,
        number: 0,
        size: 25,
      };

      server.use(
        http.get(`${BASE_URL}/organizations/org-123/audit-log-records`, () => {
          return HttpResponse.json(mockLogs);
        }),
      );

      const result = await getOrgAuditLogs(client, 'org-123');

      expect(result).to.deep.equal(mockLogs);
      expect(result.content).to.have.lengthOf(2);
      expect(result.content[0].eventType).to.equal('USER_CREATED');
    });

    it('should handle empty audit logs', async () => {
      const mockLogs = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 25,
      };

      server.use(
        http.get(`${BASE_URL}/organizations/org-123/audit-log-records`, () => {
          return HttpResponse.json(mockLogs);
        }),
      );

      const result = await getOrgAuditLogs(client, 'org-123');

      expect(result.content).to.have.lengthOf(0);
    });
  });
});
