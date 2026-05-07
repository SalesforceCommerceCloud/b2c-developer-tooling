/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import BmAccessKeyDelete from '../../../../src/commands/bm/access-key/delete.js';
import {createIsolatedConfigHooks, createTestCommand, expectError} from '../../../helpers/test-setup.js';

describe('bm access-key delete', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(BmAccessKeyDelete, hooks.getConfig(), flags, args);
  }

  function stubCommon(command: any, {jsonEnabled}: {jsonEnabled: boolean}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
  }

  it('deletes an access key with --force in JSON mode', async () => {
    const command: any = await createCommand({force: true, scope: 'WEBDAV_AND_STUDIO'}, {login: 'user@x.com'});
    stubCommon(command, {jsonEnabled: true});
    sinon.stub(command, 'log').returns(void 0);

    const ocapiDelete = sinon.stub().resolves({data: undefined, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {DELETE: ocapiDelete}}));

    const result = await command.run();
    expect(result).to.deep.equal({
      success: true,
      login: 'user@x.com',
      scope: 'WEBDAV_AND_STUDIO',
      hostname: 'example.com',
    });
    expect(ocapiDelete.calledOnce).to.equal(true);
    expect(ocapiDelete.firstCall.args[0]).to.equal('/users/{login}/access_key/{scope}');
    expect(ocapiDelete.firstCall.args[1].params.path).to.deep.equal({
      login: 'user@x.com',
      scope: 'WEBDAV_AND_STUDIO',
    });
  });

  it('falls back to whoami when login arg is omitted', async () => {
    const command: any = await createCommand({force: true, scope: 'WEBDAV_AND_STUDIO'}, {});
    stubCommon(command, {jsonEnabled: true});
    sinon.stub(command, 'log').returns(void 0);

    const ocapiGet = sinon.stub().resolves({data: {login: 'me@x.com'}, error: undefined});
    const ocapiDelete = sinon.stub().resolves({data: undefined, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet, DELETE: ocapiDelete}}));

    const result = await command.run();
    expect(result.success).to.equal(true);
    expect(result.login).to.equal('me@x.com');
    expect(ocapiGet.calledOnce).to.equal(true);
    expect(ocapiGet.firstCall.args[0]).to.equal('/users/this');
    expect(ocapiDelete.calledOnce).to.equal(true);
    expect(ocapiDelete.firstCall.args[1].params.path).to.deep.equal({
      login: 'me@x.com',
      scope: 'WEBDAV_AND_STUDIO',
    });
  });

  it('throws on 404', async () => {
    const command: any = await createCommand({force: true, scope: 'WEBDAV_AND_STUDIO'}, {login: 'user@x.com'});
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);

    const ocapiDelete = sinon.stub().resolves({
      data: undefined,
      error: {fault: {message: 'Access key not found'}},
      response: {status: 404, statusText: 'Not Found'},
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {DELETE: ocapiDelete}}));

    await expectError(() => command.run(), /Failed to delete access key/);
  });
});
