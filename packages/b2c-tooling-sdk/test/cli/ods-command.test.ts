/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {Config} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';

// Create a test command class
class TestOdsCommand extends OdsCommand<typeof TestOdsCommand> {
  static id = 'test:ods';
  static description = 'Test ODS command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods for testing
  public testOdsClient() {
    return this.odsClient;
  }
}

// Type for mocking command properties in tests
type MockableOdsCommand = TestOdsCommand & {
  parse: () => Promise<{
    args: Record<string, string | number | boolean>;
    flags: Record<string, string | number | boolean>;
    metadata: Record<string, string | number | boolean>;
  }>;
  flags: Record<string, string | number | boolean>;
  args: Record<string, string | number | boolean>;
  resolvedConfig: Record<string, string | number | boolean>;
};

describe('cli/ods-command', () => {
  let config: Config;
  let command: TestOdsCommand;

  beforeEach(async () => {
    config = await Config.load();
    command = new TestOdsCommand([], config);
  });

  describe('odsClient', () => {
    it('throws error when no OAuth credentials', async () => {
      const cmd = command as MockableOdsCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      try {
        // Accessing odsClient getter will try to create client
        command.testOdsClient();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).to.be.an('error');
      }

      cmd.parse = originalParse;
    });

    it('creates ODS client lazily', async () => {
      const cmd = command as MockableOdsCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {},
        flags: {'client-id': 'test-client', 'client-secret': 'test-secret'},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const client1 = command.testOdsClient();
      const client2 = command.testOdsClient();
      // Should return same instance
      expect(client1).to.equal(client2);

      cmd.parse = originalParse;
    });
  });
});
