/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {Config} from '@oclif/core';
import {OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {isolateConfig, restoreConfig} from '../helpers/config-isolation.js';

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

// Type for mocking command properties in tests
type MockableOAuthCommand = TestOAuthCommand & {
  parse: () => Promise<{
    args: Record<string, string | number | boolean>;
    flags: Record<string, string | number | boolean | string[]>;
    metadata: Record<string, string | number | boolean>;
  }>;
  flags: Record<string, string | number | boolean | string[]>;
  args: Record<string, string | number | boolean>;
  resolvedConfig: Record<string, string | number | boolean>;
  error?: (message: string, options?: {exit?: number}) => never;
};

describe('cli/oauth-command', () => {
  let config: Config;
  let command: TestOAuthCommand;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    command = new TestOAuthCommand([], config);
  });

  afterEach(() => {
    restoreConfig();
  });

  describe('parseAuthMethods', () => {
    it('returns undefined when no auth methods specified', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const methods = command.testParseAuthMethods();
      expect(methods).to.be.undefined;

      cmd.parse = originalParse;
    });

    it('parses valid auth methods', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'auth-methods': ['client-credentials', 'implicit']},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const methods = command.testParseAuthMethods();
      expect(methods).to.include('client-credentials');
      expect(methods).to.include('implicit');

      cmd.parse = originalParse;
    });

    it('filters out invalid auth methods', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'auth-methods': ['client-credentials', 'invalid', 'basic']},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const methods = command.testParseAuthMethods();
      expect(methods).to.include('client-credentials');
      expect(methods).to.not.include('invalid');

      cmd.parse = originalParse;
    });
  });

  describe('requireOAuthCredentials', () => {
    it('throws error when no credentials', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      let errorCalled = false;
      const originalError = cmd.error?.bind(command);
      cmd.error = () => {
        errorCalled = true;
        throw new Error('Expected error');
      };

      try {
        command.testRequireOAuthCredentials();
      } catch {
        // Expected
      }

      expect(errorCalled).to.be.true;

      if (originalError) {
        cmd.error = originalError;
      }
      cmd.parse = originalParse;
    });

    it('does not throw when clientId is set', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'client-id': 'test-client'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      // Should not throw
      command.testRequireOAuthCredentials();

      cmd.parse = originalParse;
    });
  });
});
