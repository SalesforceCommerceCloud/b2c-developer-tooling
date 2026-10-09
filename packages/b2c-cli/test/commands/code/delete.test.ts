/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import CodeDelete from '../../../src/commands/code/delete.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('code delete', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(CodeDelete, hooks.getConfig(), flags, args);
  }

  function createMockBackend() {
    return {
      name: 'ocapi' as const,
      listCodeVersions: sinon.stub(),
      getActiveCodeVersion: sinon.stub(),
      activateCodeVersion: sinon.stub(),
      deleteCodeVersion: sinon.stub(),
      createCodeVersion: sinon.stub(),
      reloadCodeVersion: sinon.stub(),
    };
  }

  function stubCommon(command: any) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'instance').get(() => ({config: {hostname: 'example.com'}}));
    sinon.stub(command, 'log').returns(void 0);
    const backend = createMockBackend();
    sinon.stub(command, 'createScriptsBackend').returns(backend);
    return backend;
  }

  it('deletes without prompting when --force is set', async () => {
    const command: any = await createCommand({force: true}, {codeVersion: 'v1'});
    const backend = stubCommon(command);
    backend.deleteCodeVersion.resolves();

    await command.run();

    expect(backend.deleteCodeVersion.calledOnceWithExactly('v1')).to.equal(true);
  });

  it('does not delete when prompt is declined', async () => {
    const command: any = await createCommand({}, {codeVersion: 'v1'});
    const backend = stubCommon(command);
    backend.deleteCodeVersion.rejects(new Error('Unexpected delete'));

    const confirmStub = sinon.stub().resolves(false);
    command.operations = {...command.operations, confirm: confirmStub};

    await command.run();

    expect(confirmStub.calledOnce).to.equal(true);
    expect(backend.deleteCodeVersion.called).to.equal(false);
  });

  it('deletes when prompt is accepted', async () => {
    const command: any = await createCommand({}, {codeVersion: 'v1'});
    const backend = stubCommon(command);
    backend.deleteCodeVersion.resolves();

    const confirmStub = sinon.stub().resolves(true);
    command.operations = {...command.operations, confirm: confirmStub};

    await command.run();

    expect(confirmStub.calledOnce).to.equal(true);
    expect(backend.deleteCodeVersion.calledOnceWithExactly('v1')).to.equal(true);
  });
});
