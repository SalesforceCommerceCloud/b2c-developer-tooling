/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {runCommand} from '@oclif/test';
import {expect} from 'chai';
import {createIsolatedEnvHooks} from '../../helpers/test-setup.js';

describe('cip tables', () => {
  const hooks = createIsolatedEnvHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  it('shows help without errors', async () => {
    const {error} = await runCommand('cip tables --help');
    expect(error).to.be.undefined;
  });

  it('rejects --user-auth for CIP metadata commands', async () => {
    const {error} = await runCommand('cip tables --tenant-id zzxy_prd --user-auth');
    expect(error).to.not.be.undefined;
    expect(error?.message).to.include('client-credentials');
  });
});
