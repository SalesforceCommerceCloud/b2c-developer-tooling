/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {runCommand} from '@oclif/test';
import {expect} from 'chai';

describe('_test', () => {
  // Skip in automated tests - this is a debug command that intentionally produces log output
  // Run manually with: ./cli _test
  it.skip('runs the smoke test command without errors', async () => {
    const {error} = await runCommand('_test');
    expect(error).to.be.undefined;
  });
});
