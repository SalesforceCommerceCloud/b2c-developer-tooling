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

  it('deletes without prompting when --force is set', async () => {
    const command: any = await createCommand({force: true}, {codeVersion: 'v1'});

    const instance = {config: {hostname: 'example.com'}};

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'instance').get(() => instance);
    sinon.stub(command, 'log').returns(void 0);

    const deleteStub = sinon.stub().resolves(void 0);
    command.operations = {...command.operations, deleteCodeVersion: deleteStub};

    await command.run();
    expect(deleteStub.calledOnceWithExactly(instance, 'v1')).to.equal(true);
  });

  it('does not delete when prompt is declined', async () => {
    const command: any = await createCommand({}, {codeVersion: 'v1'});

    const instance = {config: {hostname: 'example.com'}};

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'instance').get(() => instance);
    sinon.stub(command, 'log').returns(void 0);

    const deleteStub = sinon.stub().rejects(new Error('Unexpected delete'));
    const confirmStub = sinon.stub().resolves(false);
    command.operations = {...command.operations, confirm: confirmStub, deleteCodeVersion: deleteStub};

    await command.run();

    expect(confirmStub.calledOnce).to.equal(true);
    expect(deleteStub.called).to.equal(false);
  });

  it('deletes when prompt is accepted', async () => {
    const command: any = await createCommand({}, {codeVersion: 'v1'});

    const instance = {config: {hostname: 'example.com'}};

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'instance').get(() => instance);
    sinon.stub(command, 'log').returns(void 0);

    const deleteStub = sinon.stub().resolves(void 0);
    const confirmStub = sinon.stub().resolves(true);
    command.operations = {...command.operations, confirm: confirmStub, deleteCodeVersion: deleteStub};

    await command.run();

    expect(confirmStub.calledOnce).to.equal(true);
    expect(deleteStub.calledOnceWithExactly(instance, 'v1')).to.equal(true);
  });
});
