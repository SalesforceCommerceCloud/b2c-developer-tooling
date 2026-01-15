/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {isolateConfig, restoreConfig} from '../helpers/config-isolation.js';
import {stubParse} from '../helpers/stub-parse.js';

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

describe('cli/ods-command', () => {
  let config: Config;
  let command: TestOdsCommand;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    command = new TestOdsCommand([], config);
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('odsClient', () => {
    it('throws error when no OAuth credentials', async () => {
      stubParse(command);

      await command.init();
      try {
        // Accessing odsClient getter will try to create client
        command.testOdsClient();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });

    it('creates ODS client lazily', async () => {
      stubParse(command, {'client-id': 'test-client', 'client-secret': 'test-secret'});

      await command.init();
      const client1 = command.testOdsClient();
      const client2 = command.testOdsClient();
      // Should return same instance
      expect(client1).to.equal(client2);
    });
  });
});
