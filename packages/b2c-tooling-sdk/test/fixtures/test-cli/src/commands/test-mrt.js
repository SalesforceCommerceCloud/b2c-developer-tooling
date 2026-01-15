/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Use relative import since this fixture is inside the SDK's test folder
import {MrtCommand} from '../../../../../src/cli/index.js';

/**
 * Test command that extends MrtCommand for integration testing.
 * Exercises MRT command features like api-key, project, and environment flags.
 */
export default class TestMrt extends MrtCommand {
  static id = 'test-mrt';
  static description = 'Test command for MrtCommand integration testing';
  static enableJsonFlag = true;

  async run() {
    const result = {
      // Mask API key for security (just show if present)
      hasApiKey: Boolean(this.flags['api-key']),
      project: this.flags.project,
      environment: this.flags.environment,
      cloudOrigin: this.flags['cloud-origin'],
      credentialsFile: this.flags['credentials-file'],
      hasMrtCredentials: this.hasMrtCredentials(),
    };

    if (this.jsonEnabled()) {
      return result;
    }

    this.log('Has API key: ' + result.hasApiKey);
    this.log('Project: ' + (result.project || 'not set'));
    this.log('Environment: ' + (result.environment || 'not set'));
    this.log('Has MRT credentials: ' + result.hasMrtCredentials);

    return result;
  }
}
