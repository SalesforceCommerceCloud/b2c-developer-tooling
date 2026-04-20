/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import BmRolesGrant from '../../../../src/commands/bm/roles/grant.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('bm roles grant', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(BmRolesGrant, hooks.getConfig(), flags, args);
  }

  function stubCommon(command: any, {jsonEnabled}: {jsonEnabled: boolean}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
  }

  it('grants role and returns user in JSON mode', async () => {
    const command: any = await createCommand({role: 'Administrator'}, {login: 'user@example.com'});
    stubCommon(command, {jsonEnabled: true});

    const mockUser = {login: 'user@example.com', first_name: 'Test', last_name: 'User'};
    const ocapiPut = sinon.stub().resolves({data: mockUser, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {PUT: ocapiPut}}));

    const result = await command.run();
    expect(result.login).to.equal('user@example.com');
    expect(ocapiPut.calledOnce).to.equal(true);
  });

  it('logs success in non-JSON mode', async () => {
    const command: any = await createCommand({role: 'Administrator'}, {login: 'user@example.com'});
    stubCommon(command, {jsonEnabled: false});
    const logStub = sinon.stub(command, 'log').returns(void 0);

    const ocapiPut = sinon.stub().resolves({data: {login: 'user@example.com'}, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {PUT: ocapiPut}}));

    await command.run();
    expect(logStub.calledWith(sinon.match('user@example.com'))).to.equal(true);
  });

  it('throws on 400 for invalid role or user', async () => {
    const command: any = await createCommand({role: 'BadRole'}, {login: 'user@example.com'});
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));

    const ocapiPut = sinon.stub().resolves({
      data: undefined,
      error: {fault: {message: 'Invalid role'}},
      response: {status: 400, statusText: 'Bad Request'},
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {PUT: ocapiPut}}));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch (error: any) {
      expect(error.message).to.include('Failed to grant role');
    }
  });
});
