/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {runCommand} from '@oclif/test';
import {expect} from 'chai';
import {createIsolatedEnvHooks} from '../../../helpers/test-setup.js';

describe('scapi schemas get', () => {
  const hooks = createIsolatedEnvHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  it('shows help without errors', async () => {
    const {error} = await runCommand('scapi schemas get --help');
    expect(error).to.be.undefined;
  });

  it('requires tenant-id flag', async () => {
    // Provide mock OAuth credentials so we get past OAuth validation to tenant-id validation
    const {error} = await runCommand(
      'scapi schemas get shopper products v1 --client-id test-client --short-code testcode',
    );
    expect(error).to.not.be.undefined;
    expect(error?.message).to.include('tenant-id');
  });

  it('requires apiFamily argument', async () => {
    const {error} = await runCommand('scapi schemas get --tenant-id f_ecom_zzxy_prd');
    expect(error).to.not.be.undefined;
    expect(error?.message).to.include('apiFamily');
  });

  it('shows expand flags in help', async () => {
    const {stdout} = await runCommand('scapi schemas get --help');
    expect(stdout).to.include('--expand-paths');
    expect(stdout).to.include('--expand-schemas');
    expect(stdout).to.include('--expand-examples');
    expect(stdout).to.include('--expand-all');
    expect(stdout).to.include('--expand-custom-properties');
  });

  it('shows list flags in help', async () => {
    const {stdout} = await runCommand('scapi schemas get --help');
    expect(stdout).to.include('--list-paths');
    expect(stdout).to.include('--list-schemas');
    expect(stdout).to.include('--list-examples');
  });

  it('shows output format flags in help', async () => {
    const {stdout} = await runCommand('scapi schemas get --help');
    expect(stdout).to.include('--yaml');
    expect(stdout).to.include('--json');
  });
});
