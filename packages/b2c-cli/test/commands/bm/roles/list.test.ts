/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import BmRolesList from '../../../../src/commands/bm/roles/list.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('bm roles list', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(BmRolesList, hooks.getConfig(), flags);
  }

  function stubCommon(command: any, {jsonEnabled}: {jsonEnabled: boolean}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
  }

  it('returns data in JSON mode', async () => {
    const command: any = await createCommand();
    stubCommon(command, {jsonEnabled: true});

    const mockRoles = {count: 2, total: 2, data: [{id: 'Administrator'}, {id: 'Editor'}]};
    const ocapiGet = sinon.stub().resolves({data: mockRoles, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const result = await command.run();
    expect(result.count).to.equal(2);
    expect(result.data).to.have.length(2);
    expect(ocapiGet.calledOnce).to.equal(true);
  });

  it('prints "no roles" message when empty in non-JSON mode', async () => {
    const command: any = await createCommand();
    stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    const ocapiGet = sinon.stub().resolves({data: {count: 0, total: 0, data: []}, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const result = await command.run();
    expect(result.count).to.equal(0);
  });

  it('throws when OCAPI returns error', async () => {
    const command: any = await createCommand();
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));

    const ocapiGet = sinon.stub().resolves({
      data: undefined,
      error: {fault: {message: 'boom'}},
      response: {status: 500, statusText: 'Error'},
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch (error: any) {
      expect(error.message).to.include('Failed to list roles');
    }
  });
});
