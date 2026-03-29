/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import BmRolesCreate from '../../../../src/commands/bm/roles/create.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('bm roles create', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(BmRolesCreate, hooks.getConfig(), flags, args);
  }

  function stubCommon(command: any, {jsonEnabled}: {jsonEnabled: boolean}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
  }

  it('creates role and returns in JSON mode', async () => {
    const command: any = await createCommand({description: 'Test role'}, {role: 'TestRole'});
    stubCommon(command, {jsonEnabled: true});

    const mockRole = {id: 'TestRole', description: 'Test role'};
    const ocapiPut = sinon.stub().resolves({data: mockRole, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {PUT: ocapiPut}}));

    const result = await command.run();
    expect(result.id).to.equal('TestRole');
    expect(ocapiPut.calledOnce).to.equal(true);
  });

  it('logs success in non-JSON mode', async () => {
    const command: any = await createCommand({}, {role: 'TestRole'});
    stubCommon(command, {jsonEnabled: false});
    const logStub = sinon.stub(command, 'log').returns(void 0);

    const ocapiPut = sinon.stub().resolves({data: {id: 'TestRole'}, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {PUT: ocapiPut}}));

    await command.run();
    expect(logStub.calledWith(sinon.match('TestRole'))).to.equal(true);
  });

  it('throws on 403 for reserved roles', async () => {
    const command: any = await createCommand({}, {role: 'Support'});
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));

    const ocapiPut = sinon.stub().resolves({
      data: undefined,
      error: {fault: {message: 'Operation not allowed'}},
      response: {status: 403, statusText: 'Forbidden'},
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {PUT: ocapiPut}}));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch (error: any) {
      expect(error.message).to.include('Failed to create role');
    }
  });
});
