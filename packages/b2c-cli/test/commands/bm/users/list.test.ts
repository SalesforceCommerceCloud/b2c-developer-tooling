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

  function stubCommon(command: any, {jsonEnabled}: {jsonEnabled: boolean}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
  }

  it('returns data in JSON mode', async () => {
    const command: any = await createCommand();
    stubCommon(command, {jsonEnabled: true});

    const mockUsers = {count: 2, total: 2, data: [{login: 'a@x.com'}, {login: 'b@x.com'}]};
    const ocapiGet = sinon.stub().resolves({data: mockUsers, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const result = await command.run();
    expect(result.count).to.equal(2);
    expect(result.data).to.have.length(2);
    expect(ocapiGet.calledOnce).to.equal(true);
    expect(ocapiGet.firstCall.args[0]).to.equal('/users');
  });

  it('prints "no users" message when empty in non-JSON mode', async () => {
    const command: any = await createCommand();
    stubCommon(command, {jsonEnabled: false});
    const logStub = sinon.stub(command, 'log').returns(void 0);

    const ocapiGet = sinon.stub().resolves({data: {count: 0, total: 0, data: []}, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const result = await command.run();
    expect(result.count).to.equal(0);
    expect(logStub.calledWith(sinon.match(/No users found/))).to.equal(true);
  });

  it('throws when OCAPI returns error', async () => {
    const command: any = await createCommand();
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));

    const ocapiGet = sinon.stub().resolves({
      data: undefined,
      error: {fault: {message: 'forbidden'}},
      response: {status: 403, statusText: 'Forbidden'},
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    await expectError(() => command.run(), 'Failed to list users');
  });
});
