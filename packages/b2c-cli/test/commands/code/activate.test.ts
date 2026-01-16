/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import CodeActivate from '../../../src/commands/code/activate.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

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

    expect(patchStub.calledOnce).to.equal(true);
    expect(patchStub.getCall(0).args[0]).to.equal('/code_versions/{code_version_id}');
  });

  it('errors when no code version is provided for activate mode', async () => {
    const command: any = await createCommand({}, {});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', codeVersion: undefined}}));

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    expect(errorStub.calledOnce).to.equal(true);
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

    expect(getStub.calledOnce).to.equal(true);
    expect(patchStub.callCount).to.equal(2);
  });

  it('calls command.error when reload fails with an error message', async () => {
    const command: any = await createCommand({reload: true}, {codeVersion: 'v1'});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', codeVersion: undefined}}));

    const getStub = sinon.stub().resolves({
      data: {
        data: [{id: 'v1', active: true}],
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

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    expect(errorStub.calledOnce).to.equal(true);
  });
});
