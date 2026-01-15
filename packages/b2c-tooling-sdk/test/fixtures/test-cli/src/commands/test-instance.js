/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Use relative import since this fixture is inside the SDK's test folder
import {InstanceCommand} from '../../../../../src/cli/index.js';

/**
 * Test command that extends InstanceCommand for integration testing.
 * Exercises instance command features like server flag and instance getter.
 */
export default class TestInstance extends InstanceCommand {
  static id = 'test-instance';
  static description = 'Test command for InstanceCommand integration testing';
  static enableJsonFlag = true;

  async run() {
    // Check server via resolvedConfig (no hasServer method on InstanceCommand)
    const hasServer = Boolean(this.resolvedConfig.hostname);

    // Return server/instance info without requiring server (for testing flags work)
    const result = {
      server: this.resolvedConfig.hostname,
      hasServer,
    };

    // Only access instance if server is provided (avoids requireServer error)
    if (hasServer) {
      result.instance = this.instance.config.hostname;
    }

    if (this.jsonEnabled()) {
      return result;
    }

    this.log('Server: ' + (result.server || 'not set'));
    this.log('Has server: ' + result.hasServer);

    return result;
  }
}
