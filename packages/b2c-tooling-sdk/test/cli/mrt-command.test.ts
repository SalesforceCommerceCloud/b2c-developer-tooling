/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {Config} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {isolateConfig, restoreConfig} from '../helpers/config-isolation.js';

// Create a test command class
class TestMrtCommand extends MrtCommand<typeof TestMrtCommand> {
  static id = 'test:mrt';
  static description = 'Test MRT command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods for testing
  public testRequireMrtCredentials() {
    return this.requireMrtCredentials();
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
    isolateConfig();
    config = await Config.load();
    command = new TestMrtCommand([], config);
  });

  afterEach(() => {
    restoreConfig();
  });

  describe('requireMrtCredentials', () => {
    it('throws error when no credentials', async () => {
      const cmd = command as MockableMrtCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'credentials-file': '/dev/null'}, // Use non-existent credentials file
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
});
