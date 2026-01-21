/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {runCommand} from '@oclif/test';
import {expect} from 'chai';

describe('scapi schemas list', () => {
  it('shows help without errors', async () => {
    const {error} = await runCommand('scapi schemas list --help');
    expect(error).to.be.undefined;
  });

  it('requires tenant-id flag', async () => {
    const {error} = await runCommand('scapi schemas list');
    expect(error).to.not.be.undefined;
    expect(error?.message).to.include('tenant-id');
  });

  it('shows available columns in help', async () => {
    const {stdout} = await runCommand('scapi schemas list --help');
    expect(stdout).to.include('apiFamily');
    expect(stdout).to.include('apiName');
    expect(stdout).to.include('apiVersion');
    expect(stdout).to.include('status');
  });

  it('shows filter flags in help', async () => {
    const {stdout} = await runCommand('scapi schemas list --help');
    expect(stdout).to.include('--api-family');
    expect(stdout).to.include('--api-name');
    expect(stdout).to.include('--api-version');
    expect(stdout).to.include('--status');
  });
});
