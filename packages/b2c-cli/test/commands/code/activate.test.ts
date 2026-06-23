/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import CodeActivate from '../../../src/commands/code/activate.js';
import {createIsolatedConfigHooks, createTestCommand, expectError} from '../../helpers/test-setup.js';

describe('code activate', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(CodeActivate, hooks.getConfig(), flags, args);
  }

  function createMockBackend() {
    return {
      name: 'ocapi' as const,
      listCodeVersions: sinon.stub(),
      getActiveCodeVersion: sinon.stub(),
      activateCodeVersion: sinon.stub(),
      deleteCodeVersion: sinon.stub(),
      createCodeVersion: sinon.stub(),
    };
  }

  function stubCommon(command: any) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', codeVersion: undefined}}));
    sinon.stub(command, 'instance').get(() => ({config: {hostname: 'example.com'}}));
    const backend = createMockBackend();
    sinon.stub(command, 'createScriptsBackend').returns(backend);
    return backend;
  }

  it('activates when --reload is not set', async () => {
    const command: any = await createCommand({}, {codeVersion: 'v1'});
    const backend = stubCommon(command);
    backend.activateCodeVersion.resolves();

    await command.run();

    expect(backend.activateCodeVersion.calledOnce).to.be.true;
    expect(backend.activateCodeVersion.firstCall.args[0]).to.equal('v1');
  });

  it('errors when no code version is provided for activate mode', async () => {
    const command: any = await createCommand({}, {});
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', codeVersion: undefined}}));

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    await expectError(() => command.run());

    expect(errorStub.calledOnce).to.be.true;
    expect(errorStub.firstCall.args[0]).to.match(/code version/i);
  });

  it('reloads the active code version when --reload is set and no arg is provided', async () => {
    const command: any = await createCommand({reload: true}, {});
    const backend = stubCommon(command);
    // reloadCodeVersion is now backend-agnostic: list+activate(alt)+activate(target)
    backend.listCodeVersions.resolves([
      {id: 'v1', active: true},
      {id: 'v2', active: false},
    ]);
    backend.activateCodeVersion.resolves();

    await command.run();

    // Called twice: alternate then target
    expect(backend.activateCodeVersion.callCount).to.equal(2);
    expect(backend.activateCodeVersion.getCall(0).args[0]).to.equal('v2');
    expect(backend.activateCodeVersion.getCall(1).args[0]).to.equal('v1');
  });

  it('calls command.error when reload fails with an error message', async () => {
    const command: any = await createCommand({reload: true}, {codeVersion: 'v1'});
    const backend = stubCommon(command);
    backend.listCodeVersions.rejects(new Error('boom'));

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    await expectError(() => command.run());

    expect(errorStub.calledOnce).to.be.true;
    expect(errorStub.firstCall.args[0]).to.include('Failed to reload code version');
  });
});
