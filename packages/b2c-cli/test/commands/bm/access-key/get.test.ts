/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {ux} from '@oclif/core';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import BmAccessKeyGet from '../../../../src/commands/bm/access-key/get.js';
import {createIsolatedConfigHooks, createTestCommand, expectError} from '../../../helpers/test-setup.js';

describe('bm access-key get', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(BmAccessKeyGet, hooks.getConfig(), flags, args);
  }

  function stubCommon(command: any, {jsonEnabled}: {jsonEnabled: boolean}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
  }

  it('returns access key details in JSON mode with explicit login', async () => {
    const command: any = await createCommand({scope: 'WEBDAV_AND_STUDIO'}, {login: 'user@x.com'});
    stubCommon(command, {jsonEnabled: true});
    sinon.stub(command, 'log').returns(void 0);

    const ocapiGet = sinon.stub().resolves({
      data: {enabled: true, expiration_date: '2027-01-01'},
      error: undefined,
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const result = await command.run();
    expect(result.enabled).to.equal(true);
    expect(result.expiration_date).to.equal('2027-01-01');
    expect(ocapiGet.calledOnce).to.equal(true);
    expect(ocapiGet.firstCall.args[0]).to.equal('/users/{login}/access_key/{scope}');
    expect(ocapiGet.firstCall.args[1].params.path).to.deep.equal({
      login: 'user@x.com',
      scope: 'WEBDAV_AND_STUDIO',
    });
  });

  it('falls back to whoami when login arg is omitted', async () => {
    const command: any = await createCommand({scope: 'WEBDAV_AND_STUDIO'}, {});
    stubCommon(command, {jsonEnabled: true});
    sinon.stub(command, 'log').returns(void 0);

    const ocapiGet = sinon.stub().callsFake((path: string) => {
      if (path === '/users/this') {
        return Promise.resolve({data: {login: 'me@x.com'}, error: undefined});
      }
      return Promise.resolve({data: {enabled: true}, error: undefined});
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const result = await command.run();
    expect(result.enabled).to.equal(true);
    expect(ocapiGet.callCount).to.equal(2);
    expect(ocapiGet.firstCall.args[0]).to.equal('/users/this');
    expect(ocapiGet.secondCall.args[0]).to.equal('/users/{login}/access_key/{scope}');
    expect(ocapiGet.secondCall.args[1].params.path).to.deep.equal({
      login: 'me@x.com',
      scope: 'WEBDAV_AND_STUDIO',
    });
  });

  it('displays access key fields in non-JSON mode', async () => {
    const command: any = await createCommand({scope: 'WEBDAV_AND_STUDIO'}, {login: 'user@x.com'});
    stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    const ocapiGet = sinon.stub().resolves({
      data: {enabled: true, expiration_date: '2027-01-01'},
      error: undefined,
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const stdoutStub = sinon.stub(ux, 'stdout').returns(void 0 as any);

    const result = await command.run();
    expect(result.enabled).to.equal(true);
    expect(stdoutStub.calledOnce).to.equal(true);
  });

  it('throws on 404', async () => {
    const command: any = await createCommand({scope: 'WEBDAV_AND_STUDIO'}, {login: 'user@x.com'});
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'log').returns(void 0);

    const ocapiGet = sinon.stub().resolves({
      data: undefined,
      error: {fault: {message: 'Access key not found'}},
      response: {status: 404, statusText: 'Not Found'},
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    await expectError(() => command.run(), /Failed to get access key/);
  });
});
