/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {AmCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {ImplicitOAuthStrategy, OAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../helpers/stub-parse.js';

type TokenResponse = {
  accessToken: string;
  expires: Date;
  scopes: string[];
};

function futureDate(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

// Create a test command class
class TestAmCommand extends AmCommand<typeof TestAmCommand> {
  static id = 'am:users:list';
  static description = 'Test AM command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods for testing
  public testAccountManagerClient() {
    return this.accountManagerClient;
  }

  public getAuthMethodUsed() {
    return this.authMethodUsed;
  }

  // Expose catch for testing
  public async testCatch(err: Error & {exitCode?: number}): Promise<never> {
    return this.catch(err);
  }
}

// Separate test command classes for different subtopics
class TestAmOrgsCommand extends AmCommand<typeof TestAmOrgsCommand> {
  static id = 'am:orgs:list';
  static description = 'Test AM orgs command';
  async run(): Promise<void> {}
  public testAccountManagerClient() {
    return this.accountManagerClient;
  }
  public async testCatch(err: Error & {exitCode?: number}): Promise<never> {
    return this.catch(err);
  }
}

class TestAmClientsCommand extends AmCommand<typeof TestAmClientsCommand> {
  static id = 'am:clients:list';
  static description = 'Test AM clients command';
  async run(): Promise<void> {}
  public testAccountManagerClient() {
    return this.accountManagerClient;
  }
  public async testCatch(err: Error & {exitCode?: number}): Promise<never> {
    return this.catch(err);
  }
}

class TestAmRolesCommand extends AmCommand<typeof TestAmRolesCommand> {
  static id = 'am:roles:list';
  static description = 'Test AM roles command';
  async run(): Promise<void> {}
  public testAccountManagerClient() {
    return this.accountManagerClient;
  }
  public async testCatch(err: Error & {exitCode?: number}): Promise<never> {
    return this.catch(err);
  }
}

describe('cli/am-command', () => {
  let config: Config;
  let command: TestAmCommand;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    command = new TestAmCommand([], config);
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('getDefaultAuthMethods (inherited from parent)', () => {
    it('should use parent default auth methods (client-credentials first)', async () => {
      stubParse(command, {'client-id': 'test-client'});
      await command.init();

      // AmCommand no longer overrides getDefaultAuthMethods
      // When both clientId and clientSecret are provided, client-credentials should be used first
      // This verifies AM commands now use standard auth order
    });
  });

  describe('accountManagerClient', () => {
    it('should create unified account manager client', async () => {
      stubParse(command, {
        'client-id': 'test-client',
      });

      await command.init();

      // Mock getOAuthStrategy to return ImplicitOAuthStrategy with mocked implicitFlowLogin
      const strategy = new ImplicitOAuthStrategy({
        clientId: 'test-client',
        accountManagerHost: 'account.test.demandware.com',
      });

      // Mock implicitFlowLogin to avoid browser-based OAuth flow
      (strategy as unknown as {implicitFlowLogin: () => Promise<TokenResponse>}).implicitFlowLogin = async () => ({
        accessToken: 'test-token',
        expires: futureDate(30),
        scopes: [],
      });

      // Stub getOAuthStrategy to return our mocked strategy
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sinon.stub(command as any, 'getOAuthStrategy').returns(strategy);

      const client = command.testAccountManagerClient();

      expect(client).to.exist;
      // Unified client should have all API methods
      expect(client.getUser).to.be.a('function');
      expect(client.listUsers).to.be.a('function');
      expect(client.getRole).to.be.a('function');
      expect(client.listRoles).to.be.a('function');
      expect(client.getOrg).to.be.a('function');
      expect(client.listOrgs).to.be.a('function');
    });

    it('should track auth method used as implicit', async () => {
      stubParse(command, {
        'client-id': 'test-client',
      });

      await command.init();

      const strategy = new ImplicitOAuthStrategy({
        clientId: 'test-client',
        accountManagerHost: 'account.test.demandware.com',
      });
      (strategy as unknown as {implicitFlowLogin: () => Promise<TokenResponse>}).implicitFlowLogin = async () => ({
        accessToken: 'test-token',
        expires: futureDate(30),
        scopes: [],
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sinon.stub(command as any, 'getOAuthStrategy').returns(strategy);

      command.testAccountManagerClient();

      expect(command.getAuthMethodUsed()).to.equal('implicit');
    });

    it('should track auth method used as client-credentials', async () => {
      stubParse(command, {
        'client-id': 'test-client',
        'client-secret': 'test-secret',
      });

      await command.init();

      const strategy = new OAuthStrategy({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        accountManagerHost: 'account.test.demandware.com',
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sinon.stub(command as any, 'getOAuthStrategy').returns(strategy);

      command.testAccountManagerClient();

      expect(command.getAuthMethodUsed()).to.equal('client-credentials');
    });
  });

  describe('catch() - auth error guidance', () => {
    async function setupCommandWithStrategy(
      cmd: {
        testAccountManagerClient: () => unknown;
        testCatch: (err: Error) => Promise<never>;
      } & AmCommand<// eslint-disable-next-line @typescript-eslint/no-explicit-any
      any>,
      authType: 'implicit' | 'client-credentials',
    ) {
      stubParse(cmd, {
        'client-id': 'test-client',
        ...(authType === 'client-credentials' ? {'client-secret': 'test-secret'} : {}),
      });
      await cmd.init();

      const strategy =
        authType === 'implicit'
          ? new ImplicitOAuthStrategy({
              clientId: 'test-client',
              accountManagerHost: 'account.test.demandware.com',
            })
          : new OAuthStrategy({
              clientId: 'test-client',
              clientSecret: 'test-secret',
              accountManagerHost: 'account.test.demandware.com',
            });

      if (authType === 'implicit') {
        (strategy as unknown as {implicitFlowLogin: () => Promise<TokenResponse>}).implicitFlowLogin = async () => ({
          accessToken: 'test-token',
          expires: futureDate(30),
          scopes: [],
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sinon.stub(cmd as any, 'getOAuthStrategy').returns(strategy);
      cmd.testAccountManagerClient();
    }

    it('should suggest User Administrator role for client-credentials + users subtopic', async () => {
      await setupCommandWithStrategy(command, 'client-credentials');

      // Stub super.catch to capture the modified error
      const errorStub = sinon.stub(command, 'error').throws(new Error('exit'));

      try {
        await command.testCatch(new Error('operation forbidden'));
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
      const errorMessage = errorStub.firstCall.args[0] as string;
      expect(errorMessage).to.include('User Administrator');
      expect(errorMessage).to.include('--user-auth');
    });

    it('should suggest --user-auth for client-credentials + orgs subtopic', async () => {
      const orgsCommand = new TestAmOrgsCommand([], config);
      await setupCommandWithStrategy(orgsCommand, 'client-credentials');

      const errorStub = sinon.stub(orgsCommand, 'error').throws(new Error('exit'));

      try {
        await orgsCommand.testCatch(new Error('403 Forbidden'));
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
      const errorMessage = errorStub.firstCall.args[0] as string;
      expect(errorMessage).to.include('--user-auth');
      expect(errorMessage).to.include('Account Administrator');
    });

    it('should suggest --user-auth for client-credentials + clients subtopic', async () => {
      const clientsCommand = new TestAmClientsCommand([], config);
      await setupCommandWithStrategy(clientsCommand, 'client-credentials');

      const errorStub = sinon.stub(clientsCommand, 'error').throws(new Error('exit'));

      try {
        await clientsCommand.testCatch(new Error('unauthorized'));
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
      const errorMessage = errorStub.firstCall.args[0] as string;
      expect(errorMessage).to.include('--user-auth');
      expect(errorMessage).to.include('Account Administrator');
      expect(errorMessage).to.include('API Administrator');
    });

    it('should suggest AM_ACCOUNT_ADMIN or AM_USER_ADMIN for implicit + users subtopic', async () => {
      await setupCommandWithStrategy(command, 'implicit');

      const errorStub = sinon.stub(command, 'error').throws(new Error('exit'));

      try {
        await command.testCatch(new Error('authentication invalid'));
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
      const errorMessage = errorStub.firstCall.args[0] as string;
      expect(errorMessage).to.include('Account Administrator');
      expect(errorMessage).to.include('User Administrator');
    });

    it('should suggest AM_ACCOUNT_ADMIN or AM_API_ADMIN for implicit + clients subtopic', async () => {
      const clientsCommand = new TestAmClientsCommand([], config);
      await setupCommandWithStrategy(clientsCommand, 'implicit');

      const errorStub = sinon.stub(clientsCommand, 'error').throws(new Error('exit'));

      try {
        await clientsCommand.testCatch(new Error('operation forbidden'));
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
      const errorMessage = errorStub.firstCall.args[0] as string;
      expect(errorMessage).to.include('Account Administrator');
      expect(errorMessage).to.include('API Administrator');
    });

    it('should suggest AM_ACCOUNT_ADMIN for implicit + orgs subtopic', async () => {
      const orgsCommand = new TestAmOrgsCommand([], config);
      await setupCommandWithStrategy(orgsCommand, 'implicit');

      const errorStub = sinon.stub(orgsCommand, 'error').throws(new Error('exit'));

      try {
        await orgsCommand.testCatch(new Error('403'));
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
      const errorMessage = errorStub.firstCall.args[0] as string;
      expect(errorMessage).to.include('Account Administrator');
    });

    it('should suggest User Administrator role for client-credentials + roles subtopic', async () => {
      const rolesCommand = new TestAmRolesCommand([], config);
      await setupCommandWithStrategy(rolesCommand, 'client-credentials');

      const errorStub = sinon.stub(rolesCommand, 'error').throws(new Error('exit'));

      try {
        await rolesCommand.testCatch(new Error('operation forbidden'));
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
      const errorMessage = errorStub.firstCall.args[0] as string;
      expect(errorMessage).to.include('User Administrator');
      expect(errorMessage).to.include('--user-auth');
    });

    it('should pass through non-auth errors unchanged', async () => {
      await setupCommandWithStrategy(command, 'client-credentials');

      const errorStub = sinon.stub(command, 'error').throws(new Error('exit'));

      try {
        await command.testCatch(new Error('network timeout'));
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
      const errorMessage = errorStub.firstCall.args[0] as string;
      expect(errorMessage).to.equal('network timeout');
      expect(errorMessage).to.not.include('Suggestion');
    });
  });
});
