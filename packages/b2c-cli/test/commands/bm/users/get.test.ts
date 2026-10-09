/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {ux} from '@oclif/core';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import BmUsersGet from '../../../../src/commands/bm/users/get.js';
import {createIsolatedConfigHooks, createTestCommand, expectError} from '../../../helpers/test-setup.js';

describe('bm users get', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(BmUsersGet, hooks.getConfig(), flags, args);
  }

  function createMockBackend() {
    return {
      name: 'ocapi' as const,
      listUsers: sinon.stub(),
      getUser: sinon.stub(),
      createOrReplaceUser: sinon.stub(),
      updateUser: sinon.stub(),
      deleteUser: sinon.stub(),
    };
  }

  function stubCommon(command: any, {jsonEnabled}: {jsonEnabled: boolean}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'instance').get(() => ({config: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
    const backend = createMockBackend();
    sinon.stub(command, 'createUsersBackend').returns(backend);
    return backend;
  }

  it('returns user details in JSON mode', async () => {
    const command: any = await createCommand({}, {login: 'user@x.com'});
    const backend = stubCommon(command, {jsonEnabled: true});

    backend.getUser.resolves({
      login: 'user@x.com',
      email: 'user@x.com',
      firstName: 'Test',
      lastName: 'User',
      disabled: false,
    });

    const result = await command.run();
    expect(result.login).to.equal('user@x.com');
    expect(result.firstName).to.equal('Test');
    expect(backend.getUser.calledOnce).to.equal(true);
  });

  it('displays user details in non-JSON mode', async () => {
    const command: any = await createCommand({}, {login: 'user@x.com'});
    const backend = stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    backend.getUser.resolves({login: 'user@x.com', email: 'user@x.com', firstName: 'Test', lastName: 'User'});

    const stdoutStub = sinon.stub(ux, 'stdout').returns(void 0 as any);

    const result = await command.run();
    expect(result.login).to.equal('user@x.com');
    expect(stdoutStub.calledOnce).to.equal(true);
  });

  it('throws on 404', async () => {
    const command: any = await createCommand({}, {login: 'missing@x.com'});
    const backend = stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    backend.getUser.rejects(new Error('Failed to get user missing@x.com: User not found'));

    await expectError(() => command.run(), /Failed to get user/);
  });
});
