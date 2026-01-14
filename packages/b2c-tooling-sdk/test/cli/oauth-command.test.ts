/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {Config} from '@oclif/core';
import {OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';

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

  public testAccountManagerHost() {
    return this.accountManagerHost;
  }

  public testGetOAuthStrategy() {
    return this.getOAuthStrategy();
  }

  public testHasOAuthCredentials() {
    return this.hasOAuthCredentials();
  }

  public testHasFullOAuthCredentials() {
    return this.hasFullOAuthCredentials();
  }

  public testRequireOAuthCredentials() {
    return this.requireOAuthCredentials();
  }
}

// Type for mocking command properties in tests
type MockableOAuthCommand = TestOAuthCommand & {
  parse: () => Promise<{
    args: Record<string, string | number | boolean>;
    flags: Record<string, string | number | boolean>;
    metadata: Record<string, string | number | boolean>;
  }>;
  flags: Record<string, string | number | boolean>;
  args: Record<string, string | number | boolean>;
  resolvedConfig: Record<string, string | number | boolean>;
  error?: (message: string, options?: {exit?: number}) => never;
};

describe('cli/oauth-command', () => {
  let config: Config;
  let command: TestOAuthCommand;

  beforeEach(async () => {
    config = await Config.load();
    command = new TestOAuthCommand([], config);
  });

  describe('init', () => {
    it('initializes command with OAuth flags', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.flags).to.be.an('object');
      expect(cmd.resolvedConfig).to.be.an('object');

      cmd.parse = originalParse;
    });

    it('handles client-id flag', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'client-id': 'test-client-id'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.flags['client-id']).to.equal('test-client-id');

      cmd.parse = originalParse;
    });

    it('handles client-secret flag', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'client-secret': 'test-secret'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.flags['client-secret']).to.equal('test-secret');

      cmd.parse = originalParse;
    });

    it('handles scope flag', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {scope: ['mail', 'roles']},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.flags.scope).to.be.an('array');

      cmd.parse = originalParse;
    });

    it('handles account-manager-host flag', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'account-manager-host': 'custom.example.com'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.flags['account-manager-host']).to.equal('custom.example.com');

      cmd.parse = originalParse;
    });
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

  describe('accountManagerHost', () => {
    it('returns default account manager host', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const host = command.testAccountManagerHost();
      expect(host).to.be.a('string');
      expect(host.length).to.be.greaterThan(0);

      cmd.parse = originalParse;
    });

    it('returns custom account manager host from flag', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'account-manager-host': 'custom.example.com'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const host = command.testAccountManagerHost();
      expect(host).to.equal('custom.example.com');

      cmd.parse = originalParse;
    });
  });

  describe('getOAuthStrategy', () => {
    it('throws error when no credentials available', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      try {
        command.testGetOAuthStrategy();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).to.be.an('error');
      }

      cmd.parse = originalParse;
    });

    it('returns OAuthStrategy when client credentials available', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'client-id': 'test-client', 'client-secret': 'test-secret'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const strategy = command.testGetOAuthStrategy();
      expect(strategy).to.be.an('object');

      cmd.parse = originalParse;
    });

    it('returns ImplicitOAuthStrategy when only clientId available', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'client-id': 'test-client', 'auth-methods': ['implicit']},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const strategy = command.testGetOAuthStrategy();
      expect(strategy).to.be.an('object');

      cmd.parse = originalParse;
    });
  });

  describe('hasOAuthCredentials', () => {
    it('returns false when no clientId', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const hasCreds = command.testHasOAuthCredentials();
      expect(hasCreds).to.be.false;

      cmd.parse = originalParse;
    });

    it('returns true when clientId is set', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'client-id': 'test-client'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const hasCreds = command.testHasOAuthCredentials();
      expect(hasCreds).to.be.true;

      cmd.parse = originalParse;
    });
  });

  describe('hasFullOAuthCredentials', () => {
    it('returns false when only clientId', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'client-id': 'test-client'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const hasFull = command.testHasFullOAuthCredentials();
      expect(hasFull).to.be.false;

      cmd.parse = originalParse;
    });

    it('returns true when both clientId and clientSecret', async () => {
      const cmd = command as MockableOAuthCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'client-id': 'test-client', 'client-secret': 'test-secret'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const hasFull = command.testHasFullOAuthCredentials();
      expect(hasFull).to.be.true;

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
      const originalError = cmd.error.bind(command);
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
