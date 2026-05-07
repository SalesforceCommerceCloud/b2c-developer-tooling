/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {ux} from '@oclif/core';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import BmAccessKeyCreate from '../../../../src/commands/bm/access-key/create.js';
import {createIsolatedConfigHooks, createTestCommand, expectError} from '../../../helpers/test-setup.js';

describe('bm access-key create', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(BmAccessKeyCreate, hooks.getConfig(), flags, args);
  }

  function stubCommon(command: any, {jsonEnabled}: {jsonEnabled: boolean}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
  }

  it('creates an access key and returns secret in JSON mode', async () => {
    const command: any = await createCommand({scope: 'STOREFRONT'}, {login: 'user@x.com'});
    stubCommon(command, {jsonEnabled: true});
    sinon.stub(command, 'log').returns(void 0);

    const ocapiPut = sinon.stub().resolves({
      data: {access_key: 'secret-value', enabled: true, expiration_date: '2027-01-01'},
      error: undefined,
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {PUT: ocapiPut}}));

    const result = await command.run();
    expect(result.access_key).to.equal('secret-value');
    expect(result.enabled).to.equal(true);
    expect(ocapiPut.calledOnce).to.equal(true);
    expect(ocapiPut.firstCall.args[0]).to.equal('/users/{login}/access_key/{scope}');
    expect(ocapiPut.firstCall.args[1].params.path).to.deep.equal({
      login: 'user@x.com',
      scope: 'STOREFRONT',
    });
  });

  it('displays access key details in non-JSON mode', async () => {
    const command: any = await createCommand({scope: 'WEBDAV_AND_STUDIO'}, {login: 'user@x.com'});
    stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    const ocapiPut = sinon.stub().resolves({
      data: {access_key: 'secret-value', enabled: true, expiration_date: '2027-01-01'},
      error: undefined,
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {PUT: ocapiPut}}));

    const stdoutStub = sinon.stub(ux, 'stdout').returns(void 0 as any);

    const result = await command.run();
    expect(result.access_key).to.equal('secret-value');
    expect(stdoutStub.calledOnce).to.equal(true);
  });

  it('throws when API returns a fault', async () => {
    const command: any = await createCommand({scope: 'WEBDAV_AND_STUDIO'}, {login: 'user@x.com'});
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'log').returns(void 0);

    const ocapiPut = sinon.stub().resolves({
      data: undefined,
      error: {fault: {message: 'Bad request'}},
      response: {status: 400, statusText: 'Bad Request'},
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {PUT: ocapiPut}}));

    await expectError(() => command.run(), /Failed to create access key/);
  });
});
