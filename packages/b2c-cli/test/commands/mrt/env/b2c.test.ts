/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtB2CTargetInfo from '../../../../src/commands/mrt/env/b2c.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt env b2c', () => {
  let config: Config;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  function createCommand(): any {
    return new MrtB2CTargetInfo([], config);
  }

  function stubErrorToThrow(command: any): sinon.SinonStub {
    return sinon.stub(command, 'error').throws(new Error('Expected error'));
  }

  function stubCommonAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
  }

  it('calls command.error when project is missing', async () => {
    const command = createCommand();

    stubParse(command, {}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('calls command.error when environment is missing', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project'}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: undefined}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('calls getB2CTargetInfo and returns B2C info when no update flags provided', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', environment: 'production'}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'production', mrtOrigin: 'https://example.com'},
    }));

    const getStub = sinon.stub().resolves({
      instance_id: 'aaaa_prd',
      sites: ['RefArch', 'SiteGenesis'],
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;
      if (!project) this.error('MRT project is required.');
      if (!environment) this.error('MRT environment is required.');
      const result = await getStub({
        projectSlug: project,
        targetSlug: environment,
        origin: 'https://example.com',
      });
      return result;
    };

    const result = await command.run();

    expect(getStub.calledOnce).to.equal(true);
    const [input] = getStub.firstCall.args;
    expect(input.projectSlug).to.equal('my-project');
    expect(input.targetSlug).to.equal('production');
    expect(result.instance_id).to.equal('aaaa_prd');
    expect(result.sites).to.deep.equal(['RefArch', 'SiteGenesis']);
  });

  it('calls setB2CTargetInfo when instance-id flag is provided', async () => {
    const command = createCommand();

    stubParse(
      command,
      {project: 'my-project', environment: 'production', 'instance-id': 'bbbb_stg', sites: 'RefArch,SiteGenesis'},
      {},
    );
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'production', mrtOrigin: 'https://example.com'},
    }));

    const setStub = sinon.stub().resolves({
      instance_id: 'bbbb_stg',
      sites: ['RefArch', 'SiteGenesis'],
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;
      if (!project) this.error('MRT project is required.');
      if (!environment) this.error('MRT environment is required.');
      const instanceId = this.flags['instance-id'];
      const sitesStr = this.flags.sites;
      const sites = sitesStr ? sitesStr.split(',').map((s: string) => s.trim()) : undefined;
      const result = await setStub({
        projectSlug: project,
        targetSlug: environment,
        instanceId,
        sites,
        origin: 'https://example.com',
      });
      return result;
    };

    const result = await command.run();

    expect(setStub.calledOnce).to.equal(true);
    const [input] = setStub.firstCall.args;
    expect(input.instanceId).to.equal('bbbb_stg');
    expect(input.sites).to.deep.equal(['RefArch', 'SiteGenesis']);
    expect(result.instance_id).to.equal('bbbb_stg');
  });

  it('handles B2C target info with no sites', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', environment: 'staging'}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

    const getStub = sinon.stub().resolves({
      instance_id: 'cccc_dev',
      sites: [],
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await getStub({
        projectSlug: 'my-project',
        targetSlug: 'staging',
        origin: 'https://example.com',
      });
      return result;
    };

    const result = await command.run();

    expect(getStub.calledOnce).to.equal(true);
    expect(result.instance_id).to.equal('cccc_dev');
    expect(result.sites).to.have.lengthOf(0);
  });
});
