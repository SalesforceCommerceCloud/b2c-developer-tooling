/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {ux} from '@oclif/core';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import BmWhoami from '../../../src/commands/bm/whoami.js';
import {createIsolatedConfigHooks, createTestCommand, expectError} from '../../helpers/test-setup.js';

describe('bm whoami', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(BmWhoami, hooks.getConfig(), flags);
  }

  function stubCommon(command: any, {jsonEnabled}: {jsonEnabled: boolean}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
  }

  it('returns user details in JSON mode', async () => {
    const command: any = await createCommand();
    stubCommon(command, {jsonEnabled: true});
    sinon.stub(command, 'log').returns(void 0);

    const mockUser = {
      login: 'admin@example.com',
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
    };
    const ocapiGet = sinon.stub().resolves({data: mockUser, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const result = await command.run();
    expect(result).to.deep.equal(mockUser);
    expect(ocapiGet.calledOnce).to.equal(true);
    expect(ocapiGet.firstCall.args[0]).to.equal('/users/this');
  });

  it('displays user details in non-JSON mode', async () => {
    const command: any = await createCommand();
    stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    const mockUser = {
      login: 'admin@example.com',
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
    };
    const ocapiGet = sinon.stub().resolves({data: mockUser, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const stdoutStub = sinon.stub(ux, 'stdout').returns(void 0 as any);

    const result = await command.run();
    expect(result).to.deep.equal(mockUser);
    expect(stdoutStub.calledOnce).to.equal(true);
  });

  it('throws when OCAPI returns UserNotAvailableException', async () => {
    const command: any = await createCommand();
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'log').returns(void 0);

    const ocapiGet = sinon.stub().resolves({
      data: undefined,
      error: {fault: {message: 'No user was provided with the OAuth token.'}},
      response: {status: 401, statusText: 'Unauthorized'},
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    await expectError(() => command.run(), /Failed to get current user/);
  });
});
