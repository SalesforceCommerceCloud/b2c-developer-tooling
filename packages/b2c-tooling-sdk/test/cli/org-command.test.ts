/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {OrgCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../helpers/stub-parse.js';

// Create a test command class
class TestOrgCommand extends OrgCommand<typeof TestOrgCommand> {
  static id = 'test:org';
  static description = 'Test org command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods for testing
  public testAccountManagerOrgsClient() {
    return this.accountManagerOrgsClient;
  }
}

describe('cli/org-command', () => {
  let config: Config;
  let command: TestOrgCommand;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    command = new TestOrgCommand([], config);
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('accountManagerOrgsClient', () => {
    it('should create account manager orgs client', async () => {
      stubParse(command, {'client-id': 'test-client', 'client-secret': 'test-secret'});

      await command.init();
      const client = command.testAccountManagerOrgsClient();

      expect(client).to.exist;
    });

    it('should use OAuth credentials from config', async () => {
      stubParse(command, {'client-id': 'test-client', 'client-secret': 'test-secret'});

      await command.init();
      const client = command.testAccountManagerOrgsClient();

      expect(client).to.exist;
      // Client should be created with OAuth authentication
    });
  });
});
