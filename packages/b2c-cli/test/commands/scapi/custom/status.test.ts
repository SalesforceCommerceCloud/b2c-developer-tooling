/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {runCommand} from '@oclif/test';
import {expect} from 'chai';

describe('scapi custom status', () => {
  it('shows help without errors', async () => {
    const {error} = await runCommand('scapi custom status --help');
    expect(error).to.be.undefined;
  });

  it('requires tenant-id flag', async () => {
    const {error} = await runCommand('scapi custom status');
    expect(error).to.not.be.undefined;
    expect(error?.message).to.include('tenant-id');
  });
});
