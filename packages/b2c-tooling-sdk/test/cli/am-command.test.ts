/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {AmCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../helpers/stub-parse.js';

// Create a test command class
class TestAmCommand extends AmCommand<typeof TestAmCommand> {
  static id = 'test:am';
  static description = 'Test AM command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods for testing
  public testAccountManagerClient() {
    return this.accountManagerClient;
  }
}

describe('cli/am-command', () => {
  let config: Config;
  let command: TestAmCommand;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    command = new TestAmCommand([], config);
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('accountManagerClient', () => {
    it('should create unified account manager client', async () => {
      stubParse(command, {'client-id': 'test-client', 'client-secret': 'test-secret'});

      await command.init();
      const client = command.testAccountManagerClient();

      expect(client).to.exist;
      // Unified client should have all API methods
      expect(client.getUser).to.be.a('function');
      expect(client.listUsers).to.be.a('function');
      expect(client.getRole).to.be.a('function');
      expect(client.listRoles).to.be.a('function');
      expect(client.getOrg).to.be.a('function');
      expect(client.listOrgs).to.be.a('function');
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
