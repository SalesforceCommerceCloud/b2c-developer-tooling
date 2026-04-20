/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {ux} from '@oclif/core';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import BmRolesGet from '../../../../src/commands/bm/roles/get.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('bm roles get', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(BmRolesGet, hooks.getConfig(), flags, args);
  }

  function stubCommon(command: any, {jsonEnabled}: {jsonEnabled: boolean}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
  }

  it('returns role details in JSON mode', async () => {
    const command: any = await createCommand({}, {role: 'Administrator'});
    stubCommon(command, {jsonEnabled: true});

    const mockRole = {id: 'Administrator', description: 'Admin role', user_count: 5, user_manager: true};
    const ocapiGet = sinon.stub().resolves({data: mockRole, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const result = await command.run();
    expect(result.id).to.equal('Administrator');
    expect(result.user_count).to.equal(5);
  });

  it('displays role details in non-JSON mode', async () => {
    const command: any = await createCommand({}, {role: 'Administrator'});
    stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    const mockRole = {id: 'Administrator', description: 'Admin role', user_count: 5};
    const ocapiGet = sinon.stub().resolves({data: mockRole, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const stdoutStub = sinon.stub(ux, 'stdout').returns(void 0 as any);

    const result = await command.run();
    expect(result.id).to.equal('Administrator');
    expect(stdoutStub.calledOnce).to.equal(true);
  });

  it('throws on 404', async () => {
    const command: any = await createCommand({}, {role: 'NonExistent'});
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));

    const ocapiGet = sinon.stub().resolves({
      data: undefined,
      error: {fault: {message: 'Role not found'}},
      response: {status: 404, statusText: 'Not Found'},
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch (error: any) {
      expect(error.message).to.include('Failed to get role');
    }
  });
});
