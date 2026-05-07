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

  it('activates when --reload is not set', async () => {
    const command: any = await createCommand({}, {codeVersion: 'v1'});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', codeVersion: undefined}}));

    const patchStub = sinon.stub().resolves({data: {}, error: undefined});
    sinon.stub(command, 'instance').get(() => ({
      ocapi: {
        PATCH: patchStub,
        GET: sinon.stub().rejects(new Error('Unexpected ocapi.GET')),
      },
    }));

    await command.run();

    expect(patchStub.calledOnce).to.be.true;
    const [path, options] = patchStub.firstCall.args;
    expect(path).to.equal('/code_versions/{code_version_id}');
    expect(options?.params?.path).to.deep.equal({code_version_id: 'v1'});
    expect(options?.body).to.deep.equal({active: true});
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

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', codeVersion: undefined}}));

    const getStub = sinon.stub().resolves({
      data: {
        data: [
          {id: 'v1', active: true},
          {id: 'v2', active: false},
        ],
      },
      error: undefined,
    });

    const patchStub = sinon.stub().resolves({data: {}, error: undefined});

    sinon.stub(command, 'instance').get(() => ({
      ocapi: {
        GET: getStub,
        PATCH: patchStub,
      },
    }));

    await command.run();

    expect(getStub.calledOnce).to.be.true;
    expect(patchStub.callCount).to.equal(2);
    // Reload toggles to alternate then back to active.
    const calledIds = patchStub.getCalls().map((c) => c.args[1]?.params?.path?.code_version_id);
    expect(calledIds).to.deep.equal(['v2', 'v1']);
  });

  it('calls command.error when reload fails with an error message', async () => {
    const command: any = await createCommand({reload: true}, {codeVersion: 'v1'});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', codeVersion: undefined}}));

    // Reload toggles active → alternate → active, so we need at least two versions.
    const getStub = sinon.stub().resolves({
      data: {
        data: [
          {id: 'v1', active: true},
          {id: 'v2', active: false},
        ],
      },
      error: undefined,
    });

    const patchStub = sinon.stub().resolves({data: {}, error: {message: 'boom'}});

    sinon.stub(command, 'instance').get(() => ({
      ocapi: {
        GET: getStub,
        PATCH: patchStub,
      },
    }));

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    await expectError(() => command.run());

    expect(errorStub.calledOnce).to.be.true;
    expect(errorStub.firstCall.args[0]).to.include('Failed to reload code version');
    expect(patchStub.called).to.be.true;
  });
});
