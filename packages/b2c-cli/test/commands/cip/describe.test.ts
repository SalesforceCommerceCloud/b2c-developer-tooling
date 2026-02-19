/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {runCommand} from '@oclif/test';
import {expect} from 'chai';
import {createIsolatedEnvHooks} from '../../helpers/test-setup.js';

describe('cip describe', () => {
  const hooks = createIsolatedEnvHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  it('shows help without errors', async () => {
    const {error} = await runCommand('cip describe --help');
    expect(error).to.be.undefined;
  });

  it('requires a table argument', async () => {
    const {error} = await runCommand('cip describe');
    expect(error).to.not.be.undefined;
    expect(error?.message).to.include('Missing 1 required arg');
  });
});
