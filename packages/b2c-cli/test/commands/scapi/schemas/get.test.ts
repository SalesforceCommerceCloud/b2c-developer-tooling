/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {Help} from '@oclif/core';
import type {Config} from '@oclif/core';
import {captureOutput} from '@oclif/test';
import {createIsolatedEnvHooks, getSharedFullConfig} from '../../../helpers/test-setup.js';

describe('scapi schemas get', () => {
  const hooks = createIsolatedEnvHooks();
  let config: Config;

  before(async () => {
    config = await getSharedFullConfig();
  });

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function run(id: string, argv: string[] = []) {
    return captureOutput(async () => config.runCommand(id, argv));
  }

  async function showHelp(argv: string[]) {
    return captureOutput(async () => {
      const help = new Help(config);
      await help.showHelp(argv);
    });
  }

  it('shows help without errors', async () => {
    const {error} = await showHelp(['scapi:schemas:get']);
    expect(error).to.be.undefined;
  });

  it('requires tenant-id flag', async () => {
    // Provide mock OAuth credentials so we get past OAuth validation to tenant-id validation
    const {error} = await run('scapi:schemas:get', [
      'shopper',
      'products',
      'v1',
      '--client-id',
      'test-client',
      '--short-code',
      'testcode',
    ]);
    expect(error).to.not.be.undefined;
    expect(error?.message).to.include('tenant-id');
  });

  it('requires apiFamily argument', async () => {
    const {error} = await run('scapi:schemas:get', ['--tenant-id', 'f_ecom_zzxy_prd']);
    expect(error).to.not.be.undefined;
    expect(error?.message).to.include('apiFamily');
  });

  it('shows expand flags in help', async () => {
    const {stdout} = await showHelp(['scapi:schemas:get']);
    expect(stdout).to.include('--expand-paths');
    expect(stdout).to.include('--expand-schemas');
    expect(stdout).to.include('--expand-examples');
    expect(stdout).to.include('--expand-all');
    expect(stdout).to.include('--expand-custom-properties');
  });

  it('shows list flags in help', async () => {
    const {stdout} = await showHelp(['scapi:schemas:get']);
    expect(stdout).to.include('--list-paths');
    expect(stdout).to.include('--list-schemas');
    expect(stdout).to.include('--list-examples');
  });

  it('shows output format flags in help', async () => {
    const {stdout} = await showHelp(['scapi:schemas:get']);
    expect(stdout).to.include('--yaml');
    expect(stdout).to.include('--json');
  });
});
