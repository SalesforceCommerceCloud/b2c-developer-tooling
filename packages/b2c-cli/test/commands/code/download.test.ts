/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import CodeDownload from '../../../src/commands/code/download.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('code download', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(CodeDownload, hooks.getConfig(), flags, args);
  }

  function stubCommon(command: any) {
    const instance = {config: {hostname: 'example.com', codeVersion: 'v1'}};
    sinon.stub(command, 'requireWebDavCredentials').returns(void 0);
    sinon.stub(command, 'hasOAuthCredentials').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'warn').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', codeVersion: 'v1'}}));
    sinon.stub(command, 'instance').get(() => instance);
    return instance;
  }

  it('runs before hooks and returns early when skipped', async () => {
    const command: any = await createCommand({}, {cartridgePath: '.'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: true, skipReason: 'by plugin'});
    sinon.stub(command, 'runAfterHooks').rejects(new Error('Unexpected after hooks'));

    const result = await command.run();

    expect(result).to.deep.equal({cartridges: [], codeVersion: 'v1', outputDirectory: 'cartridges'});
  });

  it('calls downloadCartridges with correct arguments', async () => {
    const command: any = await createCommand({output: './out'}, {cartridgePath: '.'});
    const instance = stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const downloadResult = {cartridges: ['app_storefront'], codeVersion: 'v1', outputDirectory: '/tmp/out'};
    const downloadStub = sinon.stub().resolves(downloadResult);
    command.operations = {...command.operations, downloadCartridges: downloadStub};

    const result = await command.run();

    expect(downloadStub.calledOnce).to.equal(true);
    expect(downloadStub.firstCall.args[0]).to.equal(instance);
    expect(downloadStub.firstCall.args[1]).to.equal('./out');
    expect(downloadStub.firstCall.args[2]).to.have.property('include');
    expect(downloadStub.firstCall.args[2]).to.have.property('exclude');
    expect(result).to.deep.equal(downloadResult);
  });

  it('passes cartridge filter flags through to options', async () => {
    const command: any = await createCommand(
      {cartridge: ['app_storefront', 'app_core'], 'exclude-cartridge': ['test_cart']},
      {cartridgePath: '.'},
    );
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const downloadResult = {
      cartridges: ['app_storefront', 'app_core'],
      codeVersion: 'v1',
      outputDirectory: 'cartridges',
    };
    const downloadStub = sinon.stub().resolves(downloadResult);
    command.operations = {...command.operations, downloadCartridges: downloadStub};

    await command.run();

    const options = downloadStub.firstCall.args[2];
    expect(options.include).to.deep.equal(['app_storefront', 'app_core']);
    expect(options.exclude).to.deep.equal(['test_cart']);
  });

  it('builds mirror map when --mirror flag is set', async () => {
    const command: any = await createCommand({mirror: true}, {cartridgePath: '.'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);
    sinon
      .stub(command, 'findCartridgesWithProviders')
      .resolves([{name: 'app_storefront', src: '/project/app_storefront', dest: 'app_storefront'}]);

    const downloadResult = {cartridges: ['app_storefront'], codeVersion: 'v1', outputDirectory: 'cartridges'};
    const downloadStub = sinon.stub().resolves(downloadResult);
    command.operations = {...command.operations, downloadCartridges: downloadStub};

    await command.run();

    const options = downloadStub.firstCall.args[2];
    expect(options.mirror).to.be.instanceOf(Map);
    expect(options.mirror.get('app_storefront')).to.equal('/project/app_storefront');
  });

  it('errors when no code version and no OAuth credentials', async () => {
    const command: any = await createCommand({}, {cartridgePath: '.'});

    sinon.stub(command, 'requireWebDavCredentials').returns(void 0);
    sinon.stub(command, 'hasOAuthCredentials').returns(false);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'warn').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', codeVersion: undefined}}));

    const errorStub = sinon.stub(command, 'error').throws(new Error('OAuth required'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    expect(errorStub.calledOnce).to.equal(true);
    const errorMessage = errorStub.firstCall.args[0];
    expect(errorMessage).to.include('auto-discover');
  });

  it('uses active code version when codeVersion is not set', async () => {
    const command: any = await createCommand({}, {cartridgePath: '.'});

    sinon.stub(command, 'requireWebDavCredentials').returns(void 0);
    sinon.stub(command, 'hasOAuthCredentials').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'warn').returns(void 0);

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', codeVersion: undefined}}));

    const instanceConfig: any = {hostname: 'example.com', codeVersion: undefined};
    const instance = {config: instanceConfig};
    sinon.stub(command, 'instance').get(() => instance);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const activeStub = sinon.stub().resolves({id: 'active_v', active: true});
    const downloadResult = {cartridges: ['c1'], codeVersion: 'active_v', outputDirectory: 'cartridges'};
    const downloadStub = sinon.stub().resolves(downloadResult);
    command.operations = {...command.operations, getActiveCodeVersion: activeStub, downloadCartridges: downloadStub};

    const result = await command.run();

    expect(activeStub.calledOnce).to.equal(true);
    expect(instanceConfig.codeVersion).to.equal('active_v');
    expect(result.codeVersion).to.equal('active_v');
  });

  it('calls afterHooks on failure', async () => {
    const command: any = await createCommand({}, {cartridgePath: '.'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    const afterHooksStub = sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const downloadStub = sinon.stub().rejects(new Error('download failed'));
    command.operations = {...command.operations, downloadCartridges: downloadStub};

    sinon.stub(command, 'error').throws(new Error('Expected'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    expect(afterHooksStub.calledOnce).to.equal(true);
    const [, result] = afterHooksStub.firstCall.args;
    expect(result.success).to.equal(false);
    expect(result.error.message).to.equal('download failed');
  });

  it('errors when --mirror set but no local cartridges found', async () => {
    const command: any = await createCommand({mirror: true}, {cartridgePath: '.'});
    stubCommon(command);

    sinon.stub(command, 'findCartridgesWithProviders').resolves([]);
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    expect(errorStub.calledOnce).to.equal(true);
    expect(errorStub.firstCall.args[0]).to.include('mirror');
  });
});
