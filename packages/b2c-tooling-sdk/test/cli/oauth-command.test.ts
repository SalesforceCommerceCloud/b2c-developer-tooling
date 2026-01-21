/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
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
  public testParseAuthMethods() {
    return this.parseAuthMethods();
  }

  public testRequireOAuthCredentials() {
    return this.requireOAuthCredentials();
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

  describe('parseAuthMethods', () => {
    it('returns undefined when no auth methods specified', async () => {
      stubParse(command);

      await command.init();
      const methods = command.testParseAuthMethods();
      expect(methods).to.be.undefined;
    });

    it('parses valid auth methods', async () => {
      stubParse(command, {'auth-methods': ['client-credentials', 'implicit']});

      await command.init();
      const methods = command.testParseAuthMethods();
      expect(methods).to.include('client-credentials');
      expect(methods).to.include('implicit');
    });

    it('filters out invalid auth methods', async () => {
      stubParse(command, {'auth-methods': ['client-credentials', 'invalid', 'basic']});

      await command.init();
      const methods = command.testParseAuthMethods();
      expect(methods).to.include('client-credentials');
      expect(methods).to.not.include('invalid');
    });
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
});
