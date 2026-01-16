/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import CodeDeploy from '../../../src/commands/code/deploy.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('code deploy', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(CodeDeploy, hooks.getConfig(), flags, args);
  }

  function stubCommon(command: any) {
    sinon.stub(command, 'requireWebDavCredentials').returns(void 0);
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'warn').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', codeVersion: 'v1'}}));
    sinon.stub(command, 'instance').get(() => ({config: {hostname: 'example.com', codeVersion: 'v1'}}));
  }

  it('runs before hooks and returns early when skipped', async () => {
    const command: any = await createCommand({}, {cartridgePath: '.'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: true, skipReason: 'by plugin'});
    sinon.stub(command, 'runAfterHooks').rejects(new Error('Unexpected after hooks'));
    sinon.stub(command, 'findCartridgesWithProviders').rejects(new Error('Unexpected cartridge discovery'));

    const result = await command.run();

    expect(result).to.deep.equal({cartridges: [], codeVersion: 'v1', reloaded: false});
  });

  it('errors when no cartridges are found', async () => {
    const command: any = await createCommand({}, {cartridgePath: '.'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'findCartridgesWithProviders').resolves([]);

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    expect(errorStub.calledOnce).to.equal(true);
  });

  it('calls delete + upload and reload when flags are set', async () => {
    const command: any = await createCommand({delete: true, reload: true}, {cartridgePath: '.'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    const afterHooksStub = sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const cartridges = [{name: 'c1', src: '/tmp/c1', dest: 'c1'}];
    sinon.stub(command, 'findCartridgesWithProviders').resolves(cartridges);

    const deleteStub = sinon.stub(command, 'deleteCartridges').resolves(void 0);
    const uploadStub = sinon.stub(command, 'uploadCartridges').resolves(void 0);
    const reloadStub = sinon.stub(command, 'reloadCodeVersion').resolves(void 0);

    const result = await command.run();

    expect(deleteStub.calledOnceWithExactly(cartridges)).to.equal(true);
    expect(uploadStub.calledOnceWithExactly(cartridges)).to.equal(true);
    expect(reloadStub.calledOnceWithExactly('v1')).to.equal(true);

    expect(result).to.deep.include({codeVersion: 'v1', reloaded: true});
    expect(afterHooksStub.calledOnce).to.equal(true);
  });

  it('swallows reload errors and still succeeds', async () => {
    const command: any = await createCommand({reload: true}, {cartridgePath: '.'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const cartridges = [{name: 'c1', src: '/tmp/c1', dest: 'c1'}];
    sinon.stub(command, 'findCartridgesWithProviders').resolves(cartridges);

    sinon.stub(command, 'uploadCartridges').resolves(void 0);
    sinon.stub(command, 'reloadCodeVersion').rejects(new Error('reload failed'));

    const result = await command.run();

    expect(result.reloaded).to.equal(false);
  });

  it('uses active code version when resolvedConfig is missing codeVersion', async () => {
    const command: any = await createCommand({}, {cartridgePath: '.'});

    sinon.stub(command, 'requireWebDavCredentials').returns(void 0);
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'warn').returns(void 0);

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', codeVersion: undefined}}));

    const instanceConfig: any = {hostname: 'example.com', codeVersion: undefined};
    sinon.stub(command, 'instance').get(() => ({config: instanceConfig}));

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    sinon.stub(command, 'getActiveCodeVersion').resolves({id: 'active', active: true});

    const cartridges = [{name: 'c1', src: '/tmp/c1', dest: 'c1'}];
    sinon.stub(command, 'findCartridgesWithProviders').resolves(cartridges);
    sinon.stub(command, 'uploadCartridges').resolves(void 0);

    const result = await command.run();

    expect(instanceConfig.codeVersion).to.equal('active');
    expect(result.codeVersion).to.equal('active');
  });
});
