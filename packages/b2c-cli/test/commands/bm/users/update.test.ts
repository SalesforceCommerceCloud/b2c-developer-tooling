/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import BmUsersUpdate from '../../../../src/commands/bm/users/update.js';
import {createIsolatedConfigHooks, createTestCommand, expectError} from '../../../helpers/test-setup.js';

describe('bm users update', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(BmUsersUpdate, hooks.getConfig(), flags, args);
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

  it('updates user with --disabled in JSON mode', async () => {
    const command: any = await createCommand({disabled: true}, {login: 'user@x.com'});
    const backend = stubCommon(command, {jsonEnabled: true});

    backend.updateUser.resolves({login: 'user@x.com', disabled: true});

    const result = await command.run();
    expect(result.disabled).to.equal(true);
    expect(backend.updateUser.calledOnce).to.equal(true);
    const changes = backend.updateUser.firstCall.args[1];
    expect(changes).to.deep.equal({disabled: true});
  });

  it('combines multiple field flags into changes', async () => {
    const command: any = await createCommand(
      {'first-name': 'Jane', 'last-name': 'Doe', 'preferred-ui-locale': 'en_US'},
      {login: 'user@x.com'},
    );
    const backend = stubCommon(command, {jsonEnabled: true});

    backend.updateUser.resolves({login: 'user@x.com'});

    await command.run();
    const changes = backend.updateUser.firstCall.args[1];
    expect(changes).to.deep.equal({
      firstName: 'Jane',
      lastName: 'Doe',
      preferredUiLocale: 'en_US',
    });
  });

  it('errors when no fields are specified', async () => {
    const command: any = await createCommand({}, {login: 'user@x.com'});
    stubCommon(command, {jsonEnabled: true});

    await expectError(() => command.run(), /No fields specified/);
  });

  it('throws on 404', async () => {
    const command: any = await createCommand({disabled: true}, {login: 'missing@x.com'});
    const backend = stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    backend.updateUser.rejects(new Error('Failed to update user missing@x.com: User not found'));

    await expectError(() => command.run(), 'Failed to update user');
  });
});
