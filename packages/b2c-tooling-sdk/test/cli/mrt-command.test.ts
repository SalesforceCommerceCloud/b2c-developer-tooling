/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {isolateConfig, restoreConfig} from '../helpers/config-isolation.js';
import {stubParse} from '../helpers/stub-parse.js';

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

describe('cli/mrt-command', () => {
  let config: Config;
  let command: TestMrtCommand;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    command = new TestMrtCommand([], config);
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('requireMrtCredentials', () => {
    it('throws error when no credentials', async () => {
      stubParse(command, {'credentials-file': '/dev/null'}); // Use non-existent credentials file

      await command.init();

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        command.testRequireMrtCredentials();
      } catch {
        // Expected
      }

      expect(errorStub.called).to.be.true;
    });

    it('does not throw when API key is set', async () => {
      stubParse(command, {'api-key': 'test-api-key'});

      await command.init();
      // Should not throw
      command.testRequireMrtCredentials();
    });
  });
});
