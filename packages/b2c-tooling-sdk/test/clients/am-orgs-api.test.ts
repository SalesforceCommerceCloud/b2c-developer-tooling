/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createAccountManagerOrgsClient} from '../../src/clients/am-api.js';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const TEST_HOST = 'account.test.demandware.com';
const BASE_URL = `https://${TEST_HOST}/dw/rest/v1`;

describe('Account Manager Organizations API Client', () => {
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

  describe('client creation', () => {
    it('should create client with default host', () => {
      const auth = new MockAuthStrategy();
      const client = createAccountManagerOrgsClient({}, auth);
      expect(client).to.exist;
    });

    it('should create client with custom host', () => {
      const auth = new MockAuthStrategy();
      const client = createAccountManagerOrgsClient({hostname: 'custom.host.com'}, auth);
      expect(client).to.exist;
    });
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
        passwordMinEntropy: 8,
        links: {self: {href: '/organizations/org-123'}},
      };

      server.use(
        http.get(`${BASE_URL}/organizations/org-123`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json(mockOrg);
        }),
      );

      const org = await client.getOrg('org-123');

      expect(org).to.not.have.property('links');
      expect(org.id).to.equal('org-123');
      expect(org.name).to.equal('Test Organization');
      expect(org.realms).to.deep.equal(['realm1', 'realm2']);
    });

    it('should throw error when organization not found', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/nonexistent`, () => {
          return HttpResponse.json({error: {message: 'Not found'}}, {status: 404});
        }),
      );

      try {
        await client.getOrg('nonexistent');
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Organization nonexistent not found');
      }
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/org-123`, () => {
          return HttpResponse.json({error: {message: 'Unauthorized'}}, {status: 401});
        }),
      );

      try {
        await client.getOrg('org-123');
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Authentication invalid');
      }
    });

    it('should handle permission errors', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/org-123`, () => {
          return HttpResponse.json({error: {message: 'Forbidden'}}, {status: 403});
        }),
      );

      try {
        await client.getOrg('org-123');
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Operation forbidden');
      }
    });
  });

  describe('getOrgByName', () => {
    it('should get organization by exact name match', async () => {
      const mockOrg = {
        id: 'org-123',
        name: 'Test Organization',
        realms: ['realm1'],
        twoFARoles: [],
        twoFAEnabled: false,
        allowedVerifierTypes: [],
        vaasEnabled: false,
        sfIdentityFederation: false,
        links: {self: {href: '/organizations/org-123'}},
      };

      server.use(
        http.get(`${BASE_URL}/organizations/search/findByName`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('startsWith')).to.equal('Test Organization');
          expect(url.searchParams.get('ignoreCase')).to.equal('false');
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json({content: [mockOrg]});
        }),
      );

      const org = await client.getOrgByName('Test Organization');

      expect(org).to.not.have.property('links');
      expect(org.id).to.equal('org-123');
      expect(org.name).to.equal('Test Organization');
    });

    it('should find exact match when multiple results returned', async () => {
      const exactMatch = {
        id: 'org-123',
        name: 'Test Organization',
        realms: [],
        twoFARoles: [],
        twoFAEnabled: false,
        allowedVerifierTypes: [],
        vaasEnabled: false,
        sfIdentityFederation: false,
      };
      const partialMatch = {
        id: 'org-456',
        name: 'Test Organization Extended',
        realms: [],
        twoFARoles: [],
        twoFAEnabled: false,
        allowedVerifierTypes: [],
        vaasEnabled: false,
        sfIdentityFederation: false,
      };

      server.use(
        http.get(`${BASE_URL}/organizations/search/findByName`, () => {
          return HttpResponse.json({content: [exactMatch, partialMatch]});
        }),
      );

      const org = await client.getOrgByName('Test Organization');

      expect(org.id).to.equal('org-123');
      expect(org.name).to.equal('Test Organization');
    });

    it('should throw error when organization not found', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/search/findByName`, () => {
          return HttpResponse.json({content: []});
        }),
      );

      try {
        await client.getOrgByName('Nonexistent Org');
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Organization Nonexistent Org not found');
      }
    });

    it('should throw error when organization name is ambiguous', async () => {
      const org1 = {
        id: 'org-1',
        name: 'Test Org',
        realms: [],
        twoFARoles: [],
        twoFAEnabled: false,
        allowedVerifierTypes: [],
        vaasEnabled: false,
        sfIdentityFederation: false,
      };
      const org2 = {
        id: 'org-2',
        name: 'Test Org Extended',
        realms: [],
        twoFARoles: [],
        twoFAEnabled: false,
        allowedVerifierTypes: [],
        vaasEnabled: false,
        sfIdentityFederation: false,
      };

      server.use(
        http.get(`${BASE_URL}/organizations/search/findByName`, () => {
          return HttpResponse.json({content: [org1, org2]});
        }),
      );

      try {
        await client.getOrgByName('Ambiguous Name');
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('is ambiguous');
      }
    });

    it('should handle 404 errors from API', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/search/findByName`, () => {
          return HttpResponse.json({error: {message: 'Not found'}}, {status: 404});
        }),
      );

      try {
        await client.getOrgByName('Test Org');
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Organization Test Org not found');
      }
    });
  });

  describe('listOrgs', () => {
    it('should list organizations with default pagination', async () => {
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
            links: {self: {href: '/organizations/org-1'}},
          },
          {
            id: 'org-2',
            name: 'Organization 2',
            realms: ['realm2'],
            twoFARoles: [],
            twoFAEnabled: false,
            allowedVerifierTypes: [],
            vaasEnabled: false,
            sfIdentityFederation: false,
            links: {self: {href: '/organizations/org-2'}},
          },
        ],
        totalElements: 2,
        totalPages: 1,
        number: 0,
        size: 25,
      };

      server.use(
        http.get(`${BASE_URL}/organizations`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('size')).to.equal('25');
          expect(url.searchParams.get('page')).to.equal('0');
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json(mockOrgs);
        }),
      );

      const result = await client.listOrgs();

      expect(result.content).to.have.lengthOf(2);
      expect(result.content[0]).to.not.have.property('links');
      expect(result.content[1]).to.not.have.property('links');
      expect(result.content[0].id).to.equal('org-1');
      expect(result.content[1].id).to.equal('org-2');
    });

    it('should list organizations with custom pagination', async () => {
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

      const result = await client.listOrgs({size: 50, page: 1});

      expect(result.content).to.have.lengthOf(1);
      expect(result.number).to.equal(1);
      expect(result.size).to.equal(50);
    });

    it('should use max page size when all flag is set', async () => {
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
          expect(url.searchParams.get('page')).to.equal('0');
          return HttpResponse.json(mockOrgs);
        }),
      );

      const result = await client.listOrgs({all: true});

      expect(result.size).to.equal(5000);
    });

    it('should remove links from all organizations in collection', async () => {
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
            links: {self: {href: '/organizations/org-1'}},
          },
        ],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 25,
      };

      server.use(
        http.get(`${BASE_URL}/organizations`, () => {
          return HttpResponse.json(mockOrgs);
        }),
      );

      const result = await client.listOrgs();

      expect(result.content[0]).to.not.have.property('links');
      expect(result.content[0].id).to.equal('org-1');
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
        http.get(`${BASE_URL}/organizations/org-123/audit-log-records`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json(mockLogs);
        }),
      );

      const result = await client.getOrgAuditLogs('org-123');

      expect(result.content).to.have.lengthOf(2);
      expect(result.content[0].eventType).to.equal('USER_CREATED');
      expect(result.content[0].authorDisplayName).to.equal('John Doe');
      expect(result.content[1].eventType).to.equal('USER_UPDATED');
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

      const result = await client.getOrgAuditLogs('org-123');

      expect(result.content).to.have.lengthOf(0);
      expect(result.totalElements).to.equal(0);
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/org-123/audit-log-records`, () => {
          return HttpResponse.json({error: {message: 'Unauthorized'}}, {status: 401});
        }),
      );

      try {
        await client.getOrgAuditLogs('org-123');
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Authentication invalid');
      }
    });
  });
});
