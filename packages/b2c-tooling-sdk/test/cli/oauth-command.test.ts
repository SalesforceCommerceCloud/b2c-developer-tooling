/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {ImplicitOAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {DEFAULT_PUBLIC_CLIENT_ID} from '@salesforce/b2c-tooling-sdk';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../helpers/stub-parse.js';

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

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    command = new TestOAuthCommand([], config);
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
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
});
