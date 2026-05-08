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

  function stubCommon(command: any, {jsonEnabled}: {jsonEnabled: boolean}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
  }

  it('returns user details in JSON mode', async () => {
    const command: any = await createCommand({}, {login: 'user@x.com'});
    stubCommon(command, {jsonEnabled: true});

    const mockUser = {
      login: 'user@x.com',
      email: 'user@x.com',
      first_name: 'Test',
      last_name: 'User',
      disabled: false,
    };
    const ocapiGet = sinon.stub().resolves({data: mockUser, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const result = await command.run();
    expect(result.login).to.equal('user@x.com');
    expect(result.first_name).to.equal('Test');
    expect(ocapiGet.calledOnce).to.equal(true);
  });

  it('displays user details in non-JSON mode', async () => {
    const command: any = await createCommand({}, {login: 'user@x.com'});
    stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    const mockUser = {login: 'user@x.com', email: 'user@x.com', first_name: 'Test', last_name: 'User'};
    const ocapiGet = sinon.stub().resolves({data: mockUser, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const stdoutStub = sinon.stub(ux, 'stdout').returns(void 0 as any);

    const result = await command.run();
    expect(result.login).to.equal('user@x.com');
    expect(stdoutStub.calledOnce).to.equal(true);
  });

  it('throws on 404', async () => {
    const command: any = await createCommand({}, {login: 'missing@x.com'});
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));

    const ocapiGet = sinon.stub().resolves({
      data: undefined,
      error: {fault: {message: 'User not found'}},
      response: {status: 404, statusText: 'Not Found'},
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    await expectError(() => command.run(), /Failed to get user/);
  });
});
