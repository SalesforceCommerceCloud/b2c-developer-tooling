/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import OrgAudit from '../../../src/commands/org/audit.js';
import {stubCommandConfigAndLogger, stubJsonEnabled, makeCommandThrowOnError} from '../../helpers/test-setup.js';

const TEST_HOST = 'account.test.demandware.com';
const BASE_URL = `https://${TEST_HOST}/dw/rest/v1`;
const OAUTH_URL = `https://${TEST_HOST}/dwsso/oauth2/access_token`;

function createMockJWT(payload: Record<string, unknown> = {}): string {
  const header = {alg: 'HS256', typ: 'JWT'};
  const defaultPayload = {sub: 'test-client', iat: Math.floor(Date.now() / 1000), ...payload};
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(defaultPayload)).toString('base64url');
  return `${headerB64}.${payloadB64}.signature`;
}

/**
 * Unit tests for org audit command CLI logic.
 * Tests output formatting, error handling, column selection.
 * SDK tests cover the actual API calls.
 */
describe('org audit', () => {
  const server = setupServer();

  const mockOrg = {
    id: 'org-123',
    name: 'Test Organization',
    realms: ['realm1'],
    twoFAEnabled: true,
    vaasEnabled: false,
    sfIdentityFederation: true,
  };

  const mockAuditLogs = [
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
  ];

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  beforeEach(() => {
    isolateConfig();
  });

  afterEach(() => {
    sinon.restore();
    server.resetHandlers();
    restoreConfig();
  });

  after(() => {
    server.close();
  });

  describe('command structure', () => {
    it('should require org as argument', () => {
      expect(OrgAudit.args).to.have.property('org');
      expect(OrgAudit.args.org.required).to.be.true;
    });

    it('should have correct description', () => {
      expect(OrgAudit.description).to.be.a('string');
      expect(OrgAudit.description.length).to.be.greaterThan(0);
    });

    it('should enable JSON flag', () => {
      expect(OrgAudit.enableJsonFlag).to.be.true;
    });
  });

  describe('output formatting', () => {
    it('should return audit logs in JSON mode', async () => {
      const command = new OrgAudit([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {org: 'org-123'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/organizations/org-123`, () => {
          return HttpResponse.json(mockOrg);
        }),
        http.get(`${BASE_URL}/organizations/org-123/audit-log-records`, () => {
          return HttpResponse.json({content: mockAuditLogs});
        }),
      );

      const result = await command.run();

      expect(result).to.have.property('content');
      expect(result.content).to.not.be.undefined;
      expect(result.content).to.have.lengthOf(2);
      expect(result.content![0].eventType).to.equal('USER_CREATED');
      expect(result.content![0].authorDisplayName).to.equal('John Doe');
    });

    it('should return audit logs in non-JSON mode', async () => {
      const command = new OrgAudit([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {org: 'org-123'},
        configurable: true,
      });

      (command as any).flags = {};
      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, false);

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/organizations/org-123`, () => {
          return HttpResponse.json(mockOrg);
        }),
        http.get(`${BASE_URL}/organizations/org-123/audit-log-records`, () => {
          return HttpResponse.json({content: mockAuditLogs});
        }),
      );

      const result = await command.run();

      expect(result).to.have.property('content');
      expect(result.content).to.have.lengthOf(2);
    });

    it('should handle empty audit logs', async () => {
      const command = new OrgAudit([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {org: 'org-123'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/organizations/org-123`, () => {
          return HttpResponse.json(mockOrg);
        }),
        http.get(`${BASE_URL}/organizations/org-123/audit-log-records`, () => {
          return HttpResponse.json({content: []});
        }),
      );

      const result = await command.run();

      expect(result.content).to.deep.equal([]);
    });

    it('should get organization by name when ID lookup fails', async () => {
      const command = new OrgAudit([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {org: 'Test Organization'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/organizations/Test%20Organization`, () => {
          return HttpResponse.json({error: {message: 'Not found'}}, {status: 404});
        }),
        http.get(`${BASE_URL}/organizations/search/findByName`, () => {
          return HttpResponse.json({content: [mockOrg]});
        }),
        http.get(`${BASE_URL}/organizations/org-123/audit-log-records`, () => {
          return HttpResponse.json({content: mockAuditLogs});
        }),
      );

      const result = await command.run();

      expect(result).to.have.property('content');
      expect(result.content).to.have.lengthOf(2);
    });

    it('should handle 404 errors with custom message', async () => {
      const command = new OrgAudit([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {org: 'nonexistent-org'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/organizations/nonexistent-org`, () => {
          return HttpResponse.json({error: {message: 'Not found'}}, {status: 404});
        }),
        http.get(`${BASE_URL}/organizations/search/findByName`, () => {
          return HttpResponse.json({content: []});
        }),
      );

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        const errorMessage = (error as Error).message;
        expect(errorMessage).to.include('not found');
      }
    });

    it('should handle column selection with --columns flag', async () => {
      const command = new OrgAudit([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {org: 'org-123'},
        configurable: true,
      });

      (command as any).flags = {columns: 'timestamp,authorDisplayName,eventType'};
      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, false);

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/organizations/org-123`, () => {
          return HttpResponse.json(mockOrg);
        }),
        http.get(`${BASE_URL}/organizations/org-123/audit-log-records`, () => {
          return HttpResponse.json({content: mockAuditLogs});
        }),
      );

      const result = await command.run();

      expect(result).to.have.property('content');
      expect(result.content).to.have.lengthOf(2);
    });

    it('should handle extended columns with --extended flag', async () => {
      const command = new OrgAudit([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {org: 'org-123'},
        configurable: true,
      });

      (command as any).flags = {extended: true};
      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, false);

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/organizations/org-123`, () => {
          return HttpResponse.json(mockOrg);
        }),
        http.get(`${BASE_URL}/organizations/org-123/audit-log-records`, () => {
          return HttpResponse.json({content: mockAuditLogs});
        }),
      );

      const result = await command.run();

      expect(result).to.have.property('content');
      expect(result.content).to.have.lengthOf(2);
    });

    it('should format timestamps correctly', async () => {
      const command = new OrgAudit([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {org: 'org-123'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);

      const logsWithTimestamps = [
        {
          timestamp: '2025-07-31T10:30:45Z',
          authorDisplayName: 'Test User',
          authorEmail: 'test@example.com',
          eventType: 'TEST_EVENT',
          eventMessage: 'Test message',
        },
      ];

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/organizations/org-123`, () => {
          return HttpResponse.json(mockOrg);
        }),
        http.get(`${BASE_URL}/organizations/org-123/audit-log-records`, () => {
          return HttpResponse.json({content: logsWithTimestamps});
        }),
      );

      const result = await command.run();

      expect(result.content).to.have.lengthOf(1);
      expect(result.content![0].timestamp).to.equal('2025-07-31T10:30:45Z');
    });
  });
});
