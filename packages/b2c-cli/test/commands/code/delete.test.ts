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

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'log').returns(void 0);

    const deleteStub = sinon.stub().resolves({data: {}, error: undefined});
    sinon.stub(command, 'instance').get(() => ({
      ocapi: {
        DELETE: deleteStub,
      },
    }));

    await command.run();
    expect(deleteStub.calledOnce).to.equal(true);
  });

  it('does not delete when prompt is declined', async () => {
    const command: any = await createCommand({}, {codeVersion: 'v1'});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'log').returns(void 0);

    const deleteStub = sinon.stub().rejects(new Error('Unexpected delete'));
    sinon.stub(command, 'instance').get(() => ({
      ocapi: {
        DELETE: deleteStub,
      },
    }));

    const confirmStub = sinon.stub(command, 'confirm').resolves(false);

    await command.run();

    expect(confirmStub.calledOnce).to.equal(true);
    expect(deleteStub.called).to.equal(false);
  });

  it('deletes when prompt is accepted', async () => {
    const command: any = await createCommand({}, {codeVersion: 'v1'});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'log').returns(void 0);

    const deleteStub = sinon.stub().resolves({data: {}, error: undefined});
    sinon.stub(command, 'instance').get(() => ({
      ocapi: {
        DELETE: deleteStub,
      },
    }));

    const confirmStub = sinon.stub(command, 'confirm').resolves(true);

    await command.run();

    expect(confirmStub.calledOnce).to.equal(true);
    expect(deleteStub.calledOnce).to.equal(true);
  });
});
