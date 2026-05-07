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

  function stubCommon(command: any, {jsonEnabled}: {jsonEnabled: boolean}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
  }

  it('deletes role and returns result in JSON mode', async () => {
    const command: any = await createCommand({}, {role: 'TestRole'});
    stubCommon(command, {jsonEnabled: true});

    const ocapiDelete = sinon.stub().resolves({data: undefined, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {DELETE: ocapiDelete}}));

    const result = await command.run();
    expect(result.success).to.equal(true);
    expect(result.role).to.equal('TestRole');
    expect(ocapiDelete.calledOnce).to.equal(true);
  });

  it('throws on 403 for system roles', async () => {
    const command: any = await createCommand({}, {role: 'Administrator'});
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));

    const ocapiDelete = sinon.stub().resolves({
      data: undefined,
      error: {fault: {message: 'Deletion not allowed'}},
      response: {status: 403, statusText: 'Forbidden'},
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {DELETE: ocapiDelete}}));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch (error: any) {
      expect(error.message).to.include('Failed to delete role');
    }
  });

  it('throws on 404 for non-existent role', async () => {
    const command: any = await createCommand({}, {role: 'NoSuchRole'});
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));

    const ocapiDelete = sinon.stub().resolves({
      data: undefined,
      error: {fault: {message: 'Role not found'}},
      response: {status: 404, statusText: 'Not Found'},
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {DELETE: ocapiDelete}}));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch (error: any) {
      expect(error.message).to.include('Failed to delete role');
    }
  });
});
