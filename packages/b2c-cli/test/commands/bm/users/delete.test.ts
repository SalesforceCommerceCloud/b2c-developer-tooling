/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import BmUsersDelete from '../../../../src/commands/bm/users/delete.js';
import {createIsolatedConfigHooks, createTestCommand, expectError} from '../../../helpers/test-setup.js';

describe('bm users delete', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(BmUsersDelete, hooks.getConfig(), flags, args);
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

  it('deletes user with --force in JSON mode', async () => {
    const command: any = await createCommand({force: true}, {login: 'user@x.com'});
    const backend = stubCommon(command, {jsonEnabled: true});

    backend.deleteUser.resolves();

    const result = await command.run();
    expect(result.success).to.equal(true);
    expect(result.login).to.equal('user@x.com');
    expect(result.hostname).to.equal('example.com');
    expect(backend.deleteUser.calledOnce).to.equal(true);
  });

  it('throws on 404', async () => {
    const command: any = await createCommand({force: true}, {login: 'missing@x.com'});
    const backend = stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    backend.deleteUser.rejects(new Error('Failed to delete user missing@x.com: User not found'));

    await expectError(() => command.run(), /Failed to delete user/);
  });

  it('skips confirmation prompt in JSON mode without --force', async () => {
    const command: any = await createCommand({}, {login: 'user@x.com'});
    const backend = stubCommon(command, {jsonEnabled: true});

    backend.deleteUser.resolves();

    const result = await command.run();
    expect(result.success).to.equal(true);
    expect(backend.deleteUser.calledOnce).to.equal(true);
  });
});
