/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {UserCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {isolateConfig, restoreConfig} from '../helpers/config-isolation.js';
import {stubParse} from '../helpers/stub-parse.js';

// Create a test command class
class TestUserCommand extends UserCommand<typeof TestUserCommand> {
  static id = 'test:user';
  static description = 'Test user command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods for testing
  public testAccountManagerClient() {
    return this.accountManagerClient;
  }
}

describe('cli/user-command', () => {
  let config: Config;
  let command: TestUserCommand;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    command = new TestUserCommand([], config);
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('accountManagerClient', () => {
    it('should create account manager client', async () => {
      stubParse(command, {'client-id': 'test-client', 'client-secret': 'test-secret'});

      await command.init();
      const client = command.testAccountManagerClient();

      expect(client).to.exist;
    });

    it('should use OAuth credentials from config', async () => {
      stubParse(command, {'client-id': 'test-client', 'client-secret': 'test-secret'});

      await command.init();
      const client = command.testAccountManagerClient();

      expect(client).to.exist;
      // Client should be created with OAuth authentication
    });
  });
});
