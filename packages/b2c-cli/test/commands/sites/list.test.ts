/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {ux} from '@oclif/core';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import SitesList from '../../../src/commands/sites/list.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('sites list', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(SitesList, hooks.getConfig(), flags, args);
  }

  function stubCommon(command: any, {jsonEnabled}: {jsonEnabled: boolean}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({hostname: 'example.com'}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
  }

  function stubErrorToThrow(command: any) {
    return sinon.stub(command, 'error').throws(new Error('Expected error'));
  }

  it('returns data in JSON mode', async () => {
    const command: any = await createCommand();

    stubCommon(command, {jsonEnabled: true});

    const ocapiGet = sinon.stub().resolves({data: {count: 1, data: [{id: 'site1'}]}, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const result = await command.run();
    expect(result.count).to.equal(1);
    expect(ocapiGet.calledOnce).to.equal(true);
  });

  it('prints "no sites" message when count is 0 in non-JSON mode', async () => {
    const command: any = await createCommand();

    stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    const ocapiGet = sinon.stub().resolves({data: {count: 0, data: []}, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const stdoutStub = sinon.stub(ux, 'stdout').returns(void 0 as any);

    const result = await command.run();
    expect(result.count).to.equal(0);
    expect(stdoutStub.calledOnce).to.equal(true);
  });

  it('calls command.error when ocapi returns error', async () => {
    const command: any = await createCommand();

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({hostname: 'example.com'}));

    const ocapiGet = sinon.stub().resolves({data: undefined, error: {message: 'boom'}});
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });
});
