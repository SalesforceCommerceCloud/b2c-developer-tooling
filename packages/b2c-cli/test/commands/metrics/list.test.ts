/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {runCommand} from '@oclif/test';
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MetricsList from '../../../src/commands/metrics/list.js';
import {createIsolatedEnvHooks, runSilent} from '../../helpers/test-setup.js';

describe('metrics list', () => {
  const hooks = createIsolatedEnvHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  it('shows help without errors', async () => {
    const {error} = await runCommand('metrics list --help');
    expect(error).to.be.undefined;
  });

  it('shows CLOSED BETA in help', async () => {
    const {stdout} = await runCommand('metrics list --help');
    expect(stdout).to.include('CLOSED BETA');
  });

  it('lists all categories', async () => {
    const {stdout} = await runCommand('metrics list');
    expect(stdout).to.include('overall');
    expect(stdout).to.include('sales');
    expect(stdout).to.include('ecdn');
    expect(stdout).to.include('third-party');
    expect(stdout).to.include('scapi');
    expect(stdout).to.include('scapi-hooks');
    expect(stdout).to.include('mrt');
    expect(stdout).to.include('controller');
    expect(stdout).to.include('ocapi');
  });

  describe('run', () => {
    let config: Config;

    beforeEach(async () => {
      config = await Config.load();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('returns categories in JSON mode', async () => {
      const command: any = new MetricsList([], config);
      await command.init();
      sinon.stub(command, 'jsonEnabled').returns(true);

      const result = await command.run();
      expect(result.categories).to.be.an('array');
      expect(result.categories.length).to.equal(9);
      expect(result.categories[0]).to.have.property('category');
      expect(result.categories[0]).to.have.property('description');
    });

    it('displays categories in non-JSON mode', async () => {
      const command: any = new MetricsList([], config);
      await command.init();

      const result = (await runSilent(() => command.run())) as {categories: unknown[]};
      expect(result.categories.length).to.equal(9);
    });
  });
});
