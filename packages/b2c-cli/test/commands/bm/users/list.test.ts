/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import BmUsersList from '../../../../src/commands/bm/users/list.js';
import {createIsolatedConfigHooks, createTestCommand, expectError} from '../../../helpers/test-setup.js';

describe('bm users list', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(BmUsersList, hooks.getConfig(), flags);
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

  it('returns data in JSON mode', async () => {
    const command: any = await createCommand();
    const backend = stubCommon(command, {jsonEnabled: true});

    backend.listUsers.resolves({
      total: 2,
      start: 0,
      count: 2,
      hits: [{login: 'a@x.com'}, {login: 'b@x.com'}],
    });

    const result = await command.run();
    expect(result.count).to.equal(2);
    expect(result.hits).to.have.length(2);
    expect(backend.listUsers.calledOnce).to.equal(true);
  });

  it('prints "no users" message when empty in non-JSON mode', async () => {
    const command: any = await createCommand();
    const backend = stubCommon(command, {jsonEnabled: false});
    const logStub = sinon.stub(command, 'log').returns(void 0);

    backend.listUsers.resolves({total: 0, start: 0, count: 0, hits: []});

    const result = await command.run();
    expect(result.total).to.equal(0);
    expect(logStub.calledWith(sinon.match(/No users found/))).to.equal(true);
  });

  it('throws when backend returns error', async () => {
    const command: any = await createCommand();
    const backend = stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    backend.listUsers.rejects(new Error('Failed to list users: forbidden'));

    await expectError(() => command.run(), 'Failed to list users');
  });
});
