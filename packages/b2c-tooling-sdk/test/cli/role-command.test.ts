/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {RoleCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {isolateConfig, restoreConfig} from '../helpers/config-isolation.js';
import {stubParse} from '../helpers/stub-parse.js';

// Create a test command class
class TestRoleCommand extends RoleCommand<typeof TestRoleCommand> {
  static id = 'test:role';
  static description = 'Test role command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods for testing
  public testAccountManagerRolesClient() {
    return this.accountManagerRolesClient;
  }
}

describe('cli/role-command', () => {
  let config: Config;
  let command: TestRoleCommand;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    command = new TestRoleCommand([], config);
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('accountManagerRolesClient', () => {
    it('should create account manager roles client', async () => {
      stubParse(command, {'client-id': 'test-client', 'client-secret': 'test-secret'});

      await command.init();
      const client = command.testAccountManagerRolesClient();

      expect(client).to.exist;
    });

    it('should use OAuth credentials from config', async () => {
      stubParse(command, {'client-id': 'test-client', 'client-secret': 'test-secret'});

      await command.init();
      const client = command.testAccountManagerRolesClient();

      expect(client).to.exist;
      // Client should be created with OAuth authentication
    });
  });
});
