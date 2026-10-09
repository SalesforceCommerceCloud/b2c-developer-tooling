/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import BmRolesDelete from '../../../../src/commands/bm/roles/delete.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('bm roles delete', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(BmRolesDelete, hooks.getConfig(), flags, args);
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

  it('deletes role and returns result in JSON mode', async () => {
    const command: any = await createCommand({}, {role: 'TestRole'});
    const backend = stubCommon(command, {jsonEnabled: true});

    backend.deleteRole.resolves();

    const result = await command.run();
    expect(result.success).to.equal(true);
    expect(result.role).to.equal('TestRole');
    expect(backend.deleteRole.calledOnce).to.equal(true);
  });

  it('throws on 403 for system roles', async () => {
    const command: any = await createCommand({}, {role: 'Administrator'});
    const backend = stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    backend.deleteRole.rejects(new Error('Failed to delete role Administrator: Deletion not allowed'));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch (error: any) {
      expect(error.message).to.include('Failed to delete role');
    }
  });

  it('throws on 404 for non-existent role', async () => {
    const command: any = await createCommand({}, {role: 'NoSuchRole'});
    const backend = stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    backend.deleteRole.rejects(new Error('Failed to delete role NoSuchRole: Role not found'));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch (error: any) {
      expect(error.message).to.include('Failed to delete role');
    }
  });
});
