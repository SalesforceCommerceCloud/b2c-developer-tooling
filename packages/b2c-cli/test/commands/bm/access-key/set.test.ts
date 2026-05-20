/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import BmAccessKeySet from '../../../../src/commands/bm/access-key/set.js';
import {createIsolatedConfigHooks, createTestCommand, expectError} from '../../../helpers/test-setup.js';

describe('bm access-key set', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(BmAccessKeySet, hooks.getConfig(), flags, args);
  }

  function stubCommon(command: any, {jsonEnabled}: {jsonEnabled: boolean}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
  }

  it('enables an access key with --enabled', async () => {
    const command: any = await createCommand({enabled: true, scope: 'WEBDAV_AND_STUDIO'}, {login: 'user@x.com'});
    stubCommon(command, {jsonEnabled: true});
    sinon.stub(command, 'log').returns(void 0);

    const ocapiPatch = sinon.stub().resolves({
      data: {enabled: true, expiration_date: '2027-01-01'},
      error: undefined,
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {PATCH: ocapiPatch}}));

    const result = await command.run();
    expect(result.enabled).to.equal(true);
    expect(ocapiPatch.calledOnce).to.equal(true);
    expect(ocapiPatch.firstCall.args[0]).to.equal('/users/{login}/access_key/{scope}');
    expect(ocapiPatch.firstCall.args[1].params.path).to.deep.equal({
      login: 'user@x.com',
      scope: 'WEBDAV_AND_STUDIO',
    });
    expect(ocapiPatch.firstCall.args[1].body).to.deep.equal({enabled: true});
  });

  it('disables an access key with --no-enabled', async () => {
    const command: any = await createCommand({enabled: false, scope: 'WEBDAV_AND_STUDIO'}, {login: 'user@x.com'});
    stubCommon(command, {jsonEnabled: true});
    sinon.stub(command, 'log').returns(void 0);

    const ocapiPatch = sinon.stub().resolves({
      data: {enabled: false, expiration_date: '2027-01-01'},
      error: undefined,
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {PATCH: ocapiPatch}}));

    const result = await command.run();
    expect(result.enabled).to.equal(false);
    expect(ocapiPatch.firstCall.args[1].body).to.deep.equal({enabled: false});
  });

  it('throws on 404', async () => {
    const command: any = await createCommand({enabled: true, scope: 'WEBDAV_AND_STUDIO'}, {login: 'user@x.com'});
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'log').returns(void 0);

    const ocapiPatch = sinon.stub().resolves({
      data: undefined,
      error: {fault: {message: 'Access key not found'}},
      response: {status: 404, statusText: 'Not Found'},
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {PATCH: ocapiPatch}}));

    await expectError(() => command.run(), /Failed to update access key/);
  });
});
