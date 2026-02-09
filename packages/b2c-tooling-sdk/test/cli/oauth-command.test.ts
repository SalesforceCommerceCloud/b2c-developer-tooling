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
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../helpers/stub-parse.js';

// Create a test command class
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
});
