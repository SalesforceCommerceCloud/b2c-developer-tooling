/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  ImplicitOAuthStrategy,
  StatefulOAuthStrategy,
  setStoredSession,
  clearStoredSession,
  resetStatefulStoreForTesting,
} from '@salesforce/b2c-tooling-sdk/auth';
import {DEFAULT_PUBLIC_CLIENT_ID} from '@salesforce/b2c-tooling-sdk';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../helpers/stub-parse.js';

function makeJWT(payload: Record<string, unknown> = {}): string {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const header = Buffer.from(JSON.stringify({alg: 'HS256', typ: 'JWT'})).toString('base64');
  const body = Buffer.from(JSON.stringify({sub: 'test', exp, scope: 'sfcc.products', ...payload})).toString('base64');
  const sig = Buffer.from('sig').toString('base64');
  return `${header}.${body}.${sig}`;
}

function makeValidJWT(): string {
  return makeJWT();
}

function makeExpiredJWT(): string {
  return makeJWT({exp: Math.floor(Date.now() / 1000) - 120});
}

// Create a test command class (no default client ID)
class TestOAuthCommand extends OAuthCommand<typeof TestOAuthCommand> {
  static id = 'test:oauth';
  static description = 'Test OAuth command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods for testing
  public testRequireOAuthCredentials() {
    return this.requireOAuthCredentials();
  }

  public testHasOAuthCredentials() {
    return this.hasOAuthCredentials();
  }

  public testGetOAuthStrategy() {
    return this.getOAuthStrategy();
  }

  public testRequireTenantId() {
    return this.requireTenantId();
  }
}

// Test command with default client ID (simulates AmCommand/OdsCommand behavior)
class TestOAuthCommandWithDefault extends OAuthCommand<typeof TestOAuthCommandWithDefault> {
  static id = 'test:oauth-default';
  static description = 'Test OAuth command with default client';

  async run(): Promise<void> {}

  protected override getDefaultClientId(): string {
    return DEFAULT_PUBLIC_CLIENT_ID;
  }

  public testHasOAuthCredentials() {
    return this.hasOAuthCredentials();
  }

  public testRequireOAuthCredentials() {
    return this.requireOAuthCredentials();
  }

  public testGetOAuthStrategy() {
    return this.getOAuthStrategy();
  }
}

describe('cli/oauth-command', () => {
  let config: Config;
  let command: TestOAuthCommand;
  const originalEnv = process.env.NODE_ENV;

  before(() => {
    process.env.NODE_ENV = 'test';
  });
  after(() => {
    process.env.NODE_ENV = originalEnv;
  });

  beforeEach(async () => {
    clearStoredSession();
    resetStatefulStoreForTesting();
    isolateConfig();
    config = await Config.load();
    command = new TestOAuthCommand([], config);
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
    clearStoredSession();
    resetStatefulStoreForTesting();
  });

  describe('requireOAuthCredentials', () => {
    it('throws error when no credentials', async () => {
      stubParse(command);

      await command.init();

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        command.testRequireOAuthCredentials();
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
    });

    it('does not throw when clientId is set', async () => {
      stubParse(command, {'client-id': 'test-client'});

      await command.init();
      // Should not throw
      command.testRequireOAuthCredentials();
    });
  });

  describe('--user-auth flag', () => {
    it('should force implicit auth method when --user-auth is set', async () => {
      stubParse(command, {
        'client-id': 'test-client',
        'client-secret': 'test-secret',
        'user-auth': true,
      });

      await command.init();

      // With --user-auth, even though client-secret is provided,
      // implicit auth should be used
      const strategy = command.testGetOAuthStrategy();
      expect(strategy).to.be.instanceOf(ImplicitOAuthStrategy);
    });

    it('should use client-credentials when --user-auth is not set and secret is provided', async () => {
      stubParse(command, {
        'client-id': 'test-client',
        'client-secret': 'test-secret',
        'user-auth': false,
      });

      await command.init();

      // Without --user-auth, client-credentials should be used when secret is available
      const strategy = command.testGetOAuthStrategy();
      expect(strategy).to.not.be.instanceOf(ImplicitOAuthStrategy);
    });
  });

  describe('requireTenantId', () => {
    it('returns tenant ID as-is when no f_ecom_ prefix', async () => {
      stubParse(command, {'client-id': 'test-client', 'tenant-id': 'abcd_001'});
      await command.init();

      expect(command.testRequireTenantId()).to.equal('abcd_001');
    });

    it('strips f_ecom_ prefix from tenant ID', async () => {
      stubParse(command, {'client-id': 'test-client', 'tenant-id': 'f_ecom_abcd_001'});
      await command.init();

      expect(command.testRequireTenantId()).to.equal('abcd_001');
    });

    it('throws error when no tenant ID provided', async () => {
      stubParse(command);
      await command.init();

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        command.testRequireTenantId();
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
    });
  });

  describe('getDefaultClientId', () => {
    it('returns undefined by default (no fallback)', async () => {
      stubParse(command);
      await command.init();

      expect(command.testHasOAuthCredentials()).to.be.false;
    });

    describe('with default client ID override', () => {
      let commandWithDefault: TestOAuthCommandWithDefault;

      beforeEach(async () => {
        commandWithDefault = new TestOAuthCommandWithDefault([], config);
      });

      it('hasOAuthCredentials returns true even without explicit clientId', async () => {
        stubParse(commandWithDefault);
        await commandWithDefault.init();

        expect(commandWithDefault.testHasOAuthCredentials()).to.be.true;
      });

      it('requireOAuthCredentials does not throw without explicit clientId', async () => {
        stubParse(commandWithDefault);
        await commandWithDefault.init();

        // Should not throw because default client is available
        commandWithDefault.testRequireOAuthCredentials();
      });

      it('getOAuthStrategy returns ImplicitOAuthStrategy using default client', async () => {
        stubParse(commandWithDefault);
        await commandWithDefault.init();

        const strategy = commandWithDefault.testGetOAuthStrategy();
        expect(strategy).to.be.instanceOf(ImplicitOAuthStrategy);
      });

      it('uses explicit clientId over default when provided', async () => {
        stubParse(commandWithDefault, {'client-id': 'explicit-client'});
        await commandWithDefault.init();

        const strategy = commandWithDefault.testGetOAuthStrategy();
        expect(strategy).to.be.instanceOf(ImplicitOAuthStrategy);
      });

      it('uses client-credentials when both clientId and clientSecret are provided', async () => {
        stubParse(commandWithDefault, {'client-id': 'explicit-client', 'client-secret': 'secret'});
        await commandWithDefault.init();

        const strategy = commandWithDefault.testGetOAuthStrategy();
        // client-credentials has higher priority than implicit in the default auth methods
        expect(strategy).to.not.be.instanceOf(ImplicitOAuthStrategy);
      });
    });
  });

  describe('stateful auth', () => {
    it('hasOAuthCredentials returns true when stateful session exists', async () => {
      setStoredSession({
        clientId: 'stored-client',
        accessToken: makeValidJWT(),
        refreshToken: null,
        renewBase: null,
        user: null,
      });
      stubParse(command);
      await command.init();

      expect(command.testHasOAuthCredentials()).to.be.true;
    });

    it('getOAuthStrategy returns StatefulOAuthStrategy when stateful session is valid', async () => {
      const token = makeValidJWT();
      setStoredSession({
        clientId: 'stored-client',
        accessToken: token,
        refreshToken: null,
        renewBase: null,
        user: null,
      });
      stubParse(command);
      await command.init();

      const strategy = command.testGetOAuthStrategy();
      expect(strategy).to.be.instanceOf(StatefulOAuthStrategy);
      const tokenResponse = await (strategy as StatefulOAuthStrategy).getTokenResponse();
      expect(tokenResponse.accessToken).to.equal(token);
    });

    it('falls back to stateless when no stateful session', async () => {
      stubParse(command, {'client-id': 'c', 'client-secret': 's'});
      await command.init();

      const strategy = command.testGetOAuthStrategy();
      expect(strategy).to.not.be.instanceOf(StatefulOAuthStrategy);
    });

    it('warns about expired renewable token and falls back to stateless', async () => {
      setStoredSession({
        clientId: 'stored-client',
        accessToken: makeExpiredJWT(),
        refreshToken: null,
        renewBase: 'c2VjcmV0',
        user: null,
      });
      stubParse(command, {'client-id': 'c', 'client-secret': 's'});
      await command.init();

      const warnStub = sinon.stub(command, 'warn');
      const strategy = command.testGetOAuthStrategy();

      expect(strategy).to.not.be.instanceOf(StatefulOAuthStrategy);
      expect(warnStub.calledOnce).to.be.true;
      expect(warnStub.firstCall.args[0]).to.include('auth client renew');
    });

    it('warns about expired non-renewable token and falls back to stateless', async () => {
      setStoredSession({
        clientId: 'stored-client',
        accessToken: makeExpiredJWT(),
        refreshToken: null,
        renewBase: null,
        user: null,
      });
      stubParse(command, {'client-id': 'c', 'client-secret': 's'});
      await command.init();

      const warnStub = sinon.stub(command, 'warn');
      const strategy = command.testGetOAuthStrategy();

      expect(strategy).to.not.be.instanceOf(StatefulOAuthStrategy);
      expect(warnStub.calledOnce).to.be.true;
      expect(warnStub.firstCall.args[0]).to.include('auth client');
      expect(warnStub.firstCall.args[0]).to.include('auth login');
    });

    it('warns and skips valid session when --client-secret is passed', async () => {
      setStoredSession({
        clientId: 'stored-client',
        accessToken: makeValidJWT(),
        refreshToken: null,
        renewBase: null,
        user: null,
      });
      const cmdWithFlags = new TestOAuthCommand(['--client-secret', 's'], config);
      stubParse(cmdWithFlags, {'client-id': 'stored-client', 'client-secret': 's'});
      await cmdWithFlags.init();

      const warnStub = sinon.stub(cmdWithFlags, 'warn');
      const strategy = cmdWithFlags.testGetOAuthStrategy();

      expect(strategy).to.not.be.instanceOf(StatefulOAuthStrategy);
      expect(warnStub.calledOnce).to.be.true;
      expect(warnStub.firstCall.args[0]).to.include('Valid token found');
      expect(warnStub.firstCall.args[0]).to.include('--client-secret');
    });

    it('uses stateful session when only --client-id matches stored session', async () => {
      setStoredSession({
        clientId: 'stored-client',
        accessToken: makeValidJWT(),
        refreshToken: null,
        renewBase: null,
        user: null,
      });
      const cmdWithClientId = new TestOAuthCommand(['--client-id', 'stored-client'], config);
      stubParse(cmdWithClientId, {'client-id': 'stored-client'});
      await cmdWithClientId.init();

      const warnStub = sinon.stub(cmdWithClientId, 'warn');
      const strategy = cmdWithClientId.testGetOAuthStrategy();

      expect(strategy).to.be.instanceOf(StatefulOAuthStrategy);
      expect(warnStub.called).to.be.false;
    });

    it('does not warn when no stateful session exists', async () => {
      stubParse(command, {'client-id': 'c', 'client-secret': 's'});
      await command.init();

      const warnStub = sinon.stub(command, 'warn');
      command.testGetOAuthStrategy();

      expect(warnStub.called).to.be.false;
    });
  });
});
