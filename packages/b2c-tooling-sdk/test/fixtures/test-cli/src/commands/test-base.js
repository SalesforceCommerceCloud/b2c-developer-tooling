/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Use relative import since this fixture is inside the SDK's test folder
import {BaseCommand} from '../../../../../src/cli/index.js';

/**
 * Test command that extends BaseCommand for integration testing.
 * Exercises base command features like extra params parsing.
 */
export default class TestBase extends BaseCommand {
  static id = 'test-base';
  static description = 'Test command for BaseCommand integration testing';
  static enableJsonFlag = true;

  async run() {
    const extraParams = this.getExtraParams();

    if (this.jsonEnabled()) {
      return {extraParams};
    }

    if (extraParams) {
      this.log('Extra query params: ' + JSON.stringify(extraParams.query));
      this.log('Extra body params: ' + JSON.stringify(extraParams.body));
    } else {
      this.log('No extra params');
    }

    return {extraParams};
  }
}
