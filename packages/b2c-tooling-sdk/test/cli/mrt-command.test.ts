/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {Config} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';

// Create a test command class
class TestMrtCommand extends MrtCommand<typeof TestMrtCommand> {
  static id = 'test:mrt';
  static description = 'Test MRT command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods for testing
  public testGetMrtAuth() {
    return this.getMrtAuth();
  }

  public testHasMrtCredentials() {
    return this.hasMrtCredentials();
  }

  public testRequireMrtCredentials() {
    return this.requireMrtCredentials();
  }

  public testCreateMrtClient(project: {org: string; project: string; env: string}) {
    return this.createMrtClient(project);
  }
}

// Type for mocking command properties in tests
type MockableMrtCommand = TestMrtCommand & {
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

describe('cli/mrt-command', () => {
  let config: Config;
  let command: TestMrtCommand;

  beforeEach(async () => {
    config = await Config.load();
    command = new TestMrtCommand([], config);
  });

  describe('init', () => {
    it('initializes command with MRT flags', async () => {
      const cmd = command as MockableMrtCommand;
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

    it('handles api-key flag', async () => {
      const cmd = command as MockableMrtCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'api-key': 'test-api-key'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.flags['api-key']).to.equal('test-api-key');

      cmd.parse = originalParse;
    });

    it('handles project flag', async () => {
      const cmd = command as MockableMrtCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {project: 'test-project'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.flags.project).to.equal('test-project');

      cmd.parse = originalParse;
    });

    it('handles environment flag', async () => {
      const cmd = command as MockableMrtCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {environment: 'staging'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.flags.environment).to.equal('staging');

      cmd.parse = originalParse;
    });

    it('handles cloud-origin flag', async () => {
      const cmd = command as MockableMrtCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'cloud-origin': 'https://cloud-staging.mobify.com'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.flags['cloud-origin']).to.equal('https://cloud-staging.mobify.com');

      cmd.parse = originalParse;
    });
  });

  describe('getMrtAuth', () => {
    it('throws error when no API key', async () => {
      const cmd = command as MockableMrtCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      try {
        command.testGetMrtAuth();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        // Error message may be translated, so just check it's an error about MRT/API key
        const message = (error as Error).message.toLowerCase();
        expect(message).to.satisfy(
          (msg: string) => msg.includes('mrt') || msg.includes('api') || msg.includes('schlüssel'),
        );
      }

      cmd.parse = originalParse;
    });

    it('returns ApiKeyStrategy when API key is set', async () => {
      const cmd = command as MockableMrtCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'api-key': 'test-api-key'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const auth = command.testGetMrtAuth();
      expect(auth).to.be.an('object');

      cmd.parse = originalParse;
    });
  });

  describe('hasMrtCredentials', () => {
    it('returns false when no API key', async () => {
      const cmd = command as MockableMrtCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const hasCreds = command.testHasMrtCredentials();
      expect(hasCreds).to.be.false;

      cmd.parse = originalParse;
    });

    it('returns true when API key is set', async () => {
      const cmd = command as MockableMrtCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'api-key': 'test-api-key'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const hasCreds = command.testHasMrtCredentials();
      expect(hasCreds).to.be.true;

      cmd.parse = originalParse;
    });
  });

  describe('requireMrtCredentials', () => {
    it('throws error when no credentials', async () => {
      const cmd = command as MockableMrtCommand;
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
        command.testRequireMrtCredentials();
      } catch {
        // Expected
      }

      expect(errorCalled).to.be.true;

      if (originalError) {
        cmd.error = originalError;
      }
      cmd.parse = originalParse;
    });

    it('does not throw when API key is set', async () => {
      const cmd = command as MockableMrtCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'api-key': 'test-api-key'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      // Should not throw
      command.testRequireMrtCredentials();

      cmd.parse = originalParse;
    });
  });

  describe('createMrtClient', () => {
    it('throws error when no credentials', async () => {
      const cmd = command as MockableMrtCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      try {
        command.testCreateMrtClient({org: 'test-org', project: 'test-project', env: 'staging'});
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).to.be.an('error');
      }

      cmd.parse = originalParse;
    });

    it('creates MRT client when credentials available', async () => {
      const cmd = command as MockableMrtCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'api-key': 'test-api-key'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const client = command.testCreateMrtClient({org: 'test-org', project: 'test-project', env: 'staging'});
      expect(client).to.be.an('object');

      cmd.parse = originalParse;
    });
  });
});
