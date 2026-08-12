/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import BmUsersCreate from '../../../../src/commands/bm/users/create.js';
import {createIsolatedConfigHooks, createTestCommand, expectError} from '../../../helpers/test-setup.js';

describe('bm users create', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(BmUsersCreate, hooks.getConfig(), flags, args);
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
    sinon.stub(command, 'log').returns(void 0);
    const backend = createMockBackend();
    sinon.stub(command, 'createUsersBackend').returns(backend);
    return backend;
  }

  it('creates a user and passes login + email + optional fields through', async () => {
    const command: any = await createCommand(
      {email: 'user@x.com', 'first-name': 'Jane', 'last-name': 'Doe', role: ['Administrator', 'bm-admin']},
      {login: 'user@x.com'},
    );
    const backend = stubCommon(command, {jsonEnabled: true});
    backend.createOrReplaceUser.resolves({
      login: 'user@x.com',
      email: 'user@x.com',
      firstName: 'Jane',
      disabled: false,
    });

    const result = await command.run();

    expect(backend.createOrReplaceUser.calledOnce).to.be.true;
    const [login, input] = backend.createOrReplaceUser.firstCall.args;
    expect(login).to.equal('user@x.com');
    expect(input).to.deep.include({
      login: 'user@x.com',
      email: 'user@x.com',
      firstName: 'Jane',
      lastName: 'Doe',
      roles: ['Administrator', 'bm-admin'],
    });
    expect(result.login).to.equal('user@x.com');
  });

  it('omits optional fields that were not provided', async () => {
    const command: any = await createCommand({email: 'user@x.com'}, {login: 'user@x.com'});
    const backend = stubCommon(command, {jsonEnabled: true});
    backend.createOrReplaceUser.resolves({login: 'user@x.com', email: 'user@x.com'});

    await command.run();

    const [, input] = backend.createOrReplaceUser.firstCall.args;
    expect(input).to.deep.equal({login: 'user@x.com', email: 'user@x.com'});
    expect(input).to.not.have.property('roles');
    expect(input).to.not.have.property('disabled');
  });

  it('supports --disabled to create in a disabled state', async () => {
    const command: any = await createCommand({email: 'user@x.com', disabled: true}, {login: 'user@x.com'});
    const backend = stubCommon(command, {jsonEnabled: true});
    backend.createOrReplaceUser.resolves({login: 'user@x.com', email: 'user@x.com', disabled: true});

    await command.run();

    const [, input] = backend.createOrReplaceUser.firstCall.args;
    expect(input.disabled).to.equal(true);
  });

  it('surfaces a LocalUserCreationException from the backend', async () => {
    const command: any = await createCommand({email: 'user@x.com'}, {login: 'user@x.com'});
    const backend = stubCommon(command, {jsonEnabled: false});
    backend.createOrReplaceUser.rejects(
      new Error(
        'Failed to create user user@x.com: LocalUserCreationException - creation of a local BM user is not allowed',
      ),
    );

    const error = await expectError(() => command.run());
    expect((error as Error).message).to.include('LocalUserCreationException');
  });
});
