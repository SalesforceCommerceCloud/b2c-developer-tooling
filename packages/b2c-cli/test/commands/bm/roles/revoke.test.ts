/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import BmRolesRevoke from '../../../../src/commands/bm/roles/revoke.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('bm roles revoke', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(BmRolesRevoke, hooks.getConfig(), flags, args);
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

  it('revokes role and returns result in JSON mode', async () => {
    const command: any = await createCommand({role: 'Administrator'}, {login: 'user@example.com'});
    const backend = stubCommon(command, {jsonEnabled: true});

    backend.revokeRole.resolves();

    const result = await command.run();
    expect(result.success).to.equal(true);
    expect(result.role).to.equal('Administrator');
    expect(result.login).to.equal('user@example.com');
    expect(backend.revokeRole.calledOnce).to.equal(true);
  });

  it('logs success in non-JSON mode', async () => {
    const command: any = await createCommand({role: 'Administrator'}, {login: 'user@example.com'});
    const backend = stubCommon(command, {jsonEnabled: false});
    const logStub = sinon.stub(command, 'log').returns(void 0);

    backend.revokeRole.resolves();

    await command.run();
    expect(logStub.calledWith(sinon.match('user@example.com'))).to.equal(true);
  });

  it('throws on 404 for non-existent assignment', async () => {
    const command: any = await createCommand({role: 'Administrator'}, {login: 'nobody@example.com'});
    const backend = stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    backend.revokeRole.rejects(new Error('Failed to revoke role Administrator from nobody@example.com: Not found'));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch (error: any) {
      expect(error.message).to.include('Failed to revoke role');
    }
  });
});
