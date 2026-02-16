/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {runCommand} from '@oclif/test';
import {expect} from 'chai';
import {createIsolatedEnvHooks} from '../../helpers/test-setup.js';

describe('cip query', () => {
  const hooks = createIsolatedEnvHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  it('shows help without errors', async () => {
    const {error} = await runCommand('cip query --help');
    expect(error).to.be.undefined;
  });

  it('requires one SQL source', async () => {
    const {error} = await runCommand('cip query --tenant-id zzxy_prd --client-id test --client-secret secret');
    expect(error).to.not.be.undefined;
    expect(error?.message).to.include('No SQL provided');
  });

  it('rejects positional SQL when --file is also set', async () => {
    const {error} = await runCommand('cip query "SELECT 1" --file ./query.sql');
    expect(error).to.not.be.undefined;
    expect(error?.message).to.include('exactly one source');
  });
});
