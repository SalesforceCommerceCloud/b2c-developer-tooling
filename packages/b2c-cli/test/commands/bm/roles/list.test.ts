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

  function createMockBackend() {
    return {
      name: 'ocapi' as const,
      listRoles: sinon.stub(),
      getRole: sinon.stub(),
      createRole: sinon.stub(),
      deleteRole: sinon.stub(),
      getPermissions: sinon.stub(),
      setPermissions: sinon.stub(),
      grantRole: sinon.stub(),
      revokeRole: sinon.stub(),
    };
  }

  function stubCommon(command: any, {jsonEnabled}: {jsonEnabled: boolean}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'instance').get(() => ({config: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
    const backend = createMockBackend();
    sinon.stub(command, 'createRolesBackend').returns(backend);
    return backend;
  }

  it('returns data in JSON mode', async () => {
    const command: any = await createCommand();
    const backend = stubCommon(command, {jsonEnabled: true});

    backend.listRoles.resolves({total: 2, start: 0, count: 2, hits: [{id: 'Administrator'}, {id: 'Editor'}]});

    const result = await command.run();
    expect(result.count).to.equal(2);
    expect(result.hits).to.have.length(2);
    expect(backend.listRoles.calledOnce).to.equal(true);
  });

  it('prints "no roles" message when empty in non-JSON mode', async () => {
    const command: any = await createCommand();
    const backend = stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    backend.listRoles.resolves({total: 0, start: 0, count: 0, hits: []});

    const result = await command.run();
    expect(result.total).to.equal(0);
  });

  it('throws when backend returns error', async () => {
    const command: any = await createCommand();
    const backend = stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    backend.listRoles.rejects(new Error('Failed to list roles: boom'));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch (error: any) {
      expect(error.message).to.include('Failed to list roles');
    }
  });
});
