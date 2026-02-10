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
import ClientCreate from '../../../../src/commands/am/clients/create.js';
import {
  stubCommandConfigAndLogger,
  stubJsonEnabled,
  stubImplicitOAuthStrategy,
  makeCommandThrowOnError,
} from '../../../helpers/test-setup.js';

const TEST_HOST = 'account.test.demandware.com';
const BASE_URL = `https://${TEST_HOST}/dw/rest/v1`;

describe('am clients create', () => {
  const server = setupServer();

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
    it('should have required flags', () => {
      expect(ClientCreate.flags).to.have.property('name');
      expect(ClientCreate.flags).to.have.property('organizations');
      expect(ClientCreate.flags).to.have.property('password');
      expect(ClientCreate.flags.name.required).to.be.true;
      expect(ClientCreate.flags.organizations.required).to.be.true;
      expect(ClientCreate.flags.password.required).to.be.true;
    });

    it('should have correct description', () => {
      expect(ClientCreate.description).to.be.a('string');
      expect(ClientCreate.description.length).to.be.greaterThan(0);
    });

    it('should enable JSON flag', () => {
      expect(ClientCreate.enableJsonFlag).to.be.true;
    });
  });

  describe('validation', () => {
    it('should reject name over 200 characters', async () => {
      const command = new ClientCreate([], {} as any);
      (command as any).flags = {
        name: 'x'.repeat(201),
        organizations: 'org-1',
        password: 'ValidP@ssword12',
      };
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/Name must be at most 200 characters/);
      }
    });

    it('should reject description over 256 characters', async () => {
      const command = new ClientCreate([], {} as any);
      (command as any).flags = {
        name: 'My Client',
        description: 'x'.repeat(257),
        organizations: 'org-1',
        password: 'ValidP@ssword12',
      };
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/Description must be at most 256 characters/);
      }
    });

    it('should reject password shorter than 12 characters', async () => {
      const command = new ClientCreate([], {} as any);
      (command as any).flags = {
        name: 'My Client',
        organizations: 'org-1',
        password: 'Short1',
      };
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/Password must be at least 12 characters/);
      }
    });

    it('should reject password longer than 128 characters', async () => {
      const command = new ClientCreate([], {} as any);
      (command as any).flags = {
        name: 'My Client',
        organizations: 'org-1',
        password: 'a'.repeat(129),
      };
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/Password must be at most 128 characters/);
      }
    });

    it('should reject invalid role-tenant-filter pattern', async () => {
      const command = new ClientCreate([], {} as any);
      (command as any).flags = {
        name: 'My Client',
        organizations: 'org-1',
        password: 'ValidP@ssword12',
        'role-tenant-filter': 'invalid-format',
      };
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/Role tenant filter must match pattern/);
      }
    });

    it('should reject empty organizations', async () => {
      const command = new ClientCreate([], {} as any);
      (command as any).flags = {
        name: 'My Client',
        organizations: '  ,  ',
        password: 'ValidP@ssword12',
      };
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/At least one organization ID is required/);
      }
    });
  });

  describe('output formatting', () => {
    it('should return created client in JSON mode', async () => {
      const command = new ClientCreate([], {} as any);
      (command as any).flags = {
        name: 'New Client',
        organizations: 'org-123',
        password: 'SecureP@ssword12',
      };
      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);
      stubImplicitOAuthStrategy(command);

      const mockCreated = {
        id: 'new-client-id',
        name: 'New Client',
        description: null,
        active: false,
        tokenEndpointAuthMethod: 'client_secret_basic',
      };

      server.use(
        http.post(`${BASE_URL}/apiclients`, async ({request}) => {
          const body = (await request.json()) as {name?: string; organizations?: string[]; password?: string};
          expect(body.name).to.equal('New Client');
          expect(body.organizations).to.deep.equal(['org-123']);
          return HttpResponse.json(mockCreated);
        }),
      );

      const result = await command.run();

      expect(result.id).to.equal('new-client-id');
      expect(result.name).to.equal('New Client');
    });
  });
});
