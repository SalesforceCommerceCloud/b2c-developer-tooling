/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {runCommand} from '@oclif/test';
import {expect} from 'chai';
import {isLikelyQualifiedCipSiteId} from '../../../src/utils/cip/report-command.js';
import {createIsolatedEnvHooks} from '../../helpers/test-setup.js';

describe('cip report', () => {
  const hooks = createIsolatedEnvHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  it('shows help without errors', async () => {
    const {error} = await runCommand('cip report --help');
    expect(error).to.be.undefined;
  });

  it('shows report subcommand help without errors', async () => {
    const {error} = await runCommand('cip report sales-analytics --help');
    expect(error).to.be.undefined;
  });

  it('supports --describe without credentials', async () => {
    const {error} = await runCommand('cip report sales-analytics --describe');
    expect(error).to.be.undefined;
  });

  it('supports --sql and exits without credentials', async () => {
    const {error, stdout} = await runCommand('cip report sales-analytics --site-id Sites-SiteGenesis-Site --sql');
    expect(error).to.be.undefined;
    expect(stdout).to.include('ccdw_aggr_sales_summary');
  });

  it('rejects --user-auth for CIP commands', async () => {
    const {error} = await runCommand('cip report sales-analytics --site-id Sites-SiteGenesis-Site --sql --user-auth');
    expect(error).to.not.be.undefined;
    expect(error?.message).to.include('client-credentials');
  });

  it('rejects non client-credentials auth methods', async () => {
    const {error} = await runCommand(
      'cip report sales-analytics --site-id Sites-SiteGenesis-Site --sql --auth-methods implicit',
    );
    expect(error).to.not.be.undefined;
    expect(error?.message).to.include('client-credentials');
  });

  it('warns when siteId is not in Sites-{siteId}-Site format', () => {
    expect(isLikelyQualifiedCipSiteId('SiteGenesis')).to.equal(false);
  });

  it('does not warn when siteId uses Sites-{siteId}-Site format', () => {
    expect(isLikelyQualifiedCipSiteId('Sites-SiteGenesis-Site')).to.equal(true);
  });
});
