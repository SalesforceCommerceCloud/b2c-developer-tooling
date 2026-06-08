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

  it('returns role details in JSON mode', async () => {
    const command: any = await createCommand({}, {role: 'Administrator'});
    const backend = stubCommon(command, {jsonEnabled: true});

    backend.getRole.resolves({id: 'Administrator', description: 'Admin role', userCount: 5, userManager: true});

    const result = await command.run();
    expect(result.id).to.equal('Administrator');
    expect(result.userCount).to.equal(5);
  });

  it('displays role details in non-JSON mode', async () => {
    const command: any = await createCommand({}, {role: 'Administrator'});
    const backend = stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    backend.getRole.resolves({id: 'Administrator', description: 'Admin role', userCount: 5});

    const stdoutStub = sinon.stub(ux, 'stdout').returns(void 0 as any);

    const result = await command.run();
    expect(result.id).to.equal('Administrator');
    expect(stdoutStub.calledOnce).to.equal(true);
  });

  it('throws on 404', async () => {
    const command: any = await createCommand({}, {role: 'NonExistent'});
    const backend = stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    backend.getRole.rejects(new Error('Failed to get role NonExistent: Role not found'));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch (error: any) {
      expect(error.message).to.include('Failed to get role');
    }
  });
});
