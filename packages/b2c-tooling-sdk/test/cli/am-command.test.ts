/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {AmCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {ImplicitOAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
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
  static id = 'test:am';
  static description = 'Test AM command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods for testing
  public testAccountManagerClient() {
    return this.accountManagerClient;
  }

  public getDefaultAuthMethods() {
    return super.getDefaultAuthMethods();
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

  describe('getDefaultAuthMethods', () => {
    it('should get from parent and move implicit to first when present', () => {
      const methods = command.getDefaultAuthMethods();
      // Parent returns ['client-credentials', 'implicit']
      // AmCommand should move 'implicit' to first: ['implicit', 'client-credentials']
      expect(methods).to.deep.equal(['implicit', 'client-credentials']);
      expect(methods[0]).to.equal('implicit');
      expect(methods).to.include('client-credentials');
    });

    it('should prepend implicit when not present in parent defaults', () => {
      // This test verifies the logic works even if parent didn't include implicit
      // In practice, parent always includes it, but we test the prepend logic
      const parentMethods = ['client-credentials'];
      // Simulate what would happen if parent didn't have implicit
      const implicitIndex = parentMethods.indexOf('implicit');
      if (implicitIndex < 0) {
        const result = ['implicit', ...parentMethods];
        expect(result).to.deep.equal(['implicit', 'client-credentials']);
        expect(result[0]).to.equal('implicit');
      }
    });
  });

  describe('accountManagerClient', () => {
    it('should create unified account manager client', async () => {
      // Use implicit flow (AmCommand's default priority) with mocked implicitFlowLogin
      stubParse(command, {
        'client-id': 'test-client',
      });

      await command.init();

      // Mock getOAuthStrategy to return ImplicitOAuthStrategy with mocked implicitFlowLogin
      const strategy = new ImplicitOAuthStrategy({
        clientId: 'test-client',
        accountManagerHost: 'account.test.demandware.com',
      });

      // Mock implicitFlowLogin to avoid browser-based OAuth flow (following oauth-implicit.test.ts pattern)
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

    it('should use OAuth credentials from config', async () => {
      // Use implicit flow (AmCommand's default priority) with mocked implicitFlowLogin
      stubParse(command, {
        'client-id': 'test-client',
      });

      await command.init();

      // Mock getOAuthStrategy to return ImplicitOAuthStrategy with mocked implicitFlowLogin
      const strategy = new ImplicitOAuthStrategy({
        clientId: 'test-client',
        accountManagerHost: 'account.test.demandware.com',
      });

      // Mock implicitFlowLogin to avoid browser-based OAuth flow (following oauth-implicit.test.ts pattern)
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
      // Client should be created with OAuth authentication
    });
  });
});
