/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {ux} from '@oclif/core';
import {expect} from 'chai';
import sinon from 'sinon';
import SitesCartridgesList from '../../../../src/commands/sites/cartridges/list.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('sites cartridges list', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(SitesCartridgesList, hooks.getConfig(), flags);
  }

  function stubCommon(command: any, {jsonEnabled, siteId}: {jsonEnabled: boolean; siteId?: string}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
    if (siteId) {
      sinon.stub(command, 'flags').get(() => ({'site-id': siteId, bm: false}));
    }
  }

  it('returns CartridgePathResult in JSON mode', async () => {
    const command: any = await createCommand({'site-id': 'RefArch'});
    stubCommon(command, {jsonEnabled: true, siteId: 'RefArch'});

    const ocapiGet = sinon.stub().resolves({
      data: {id: 'RefArch', cartridges: 'cart_a:cart_b'},
      error: undefined,
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const result = await command.run();
    expect(result.siteId).to.equal('RefArch');
    expect(result.cartridgeList).to.deep.equal(['cart_a', 'cart_b']);
  });

  it('prints numbered list in non-JSON mode', async () => {
    const command: any = await createCommand({'site-id': 'RefArch'});
    stubCommon(command, {jsonEnabled: false, siteId: 'RefArch'});
    sinon.stub(command, 'log').returns(void 0);

    const ocapiGet = sinon.stub().resolves({
      data: {id: 'RefArch', cartridges: 'cart_a:cart_b'},
      error: undefined,
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const stdoutStub = sinon.stub(ux, 'stdout').returns(void 0 as any);

    await command.run();
    // Header + 2 cartridge lines
    expect(stdoutStub.callCount).to.equal(3);
    expect(stdoutStub.secondCall.args[0]).to.include('1. cart_a');
    expect(stdoutStub.thirdCall.args[0]).to.include('2. cart_b');
  });

  it('resolves --bm to Sites-Site', async () => {
    const command: any = await createCommand({bm: true});
    stubCommon(command, {jsonEnabled: true});
    sinon.stub(command, 'flags').get(() => ({'site-id': undefined, bm: true}));

    const ocapiGet = sinon.stub().resolves({
      data: {id: 'Sites-Site', cartridges: 'bm_cart'},
      error: undefined,
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {GET: ocapiGet}}));

    const result = await command.run();
    expect(result.siteId).to.equal('Sites-Site');
    expect(ocapiGet.firstCall.args[0]).to.equal('/sites/{site_id}');
    expect(ocapiGet.firstCall.args[1].params.path.site_id).to.equal('Sites-Site');
  });

  it('errors when neither --site-id nor --bm provided', async () => {
    const command: any = await createCommand();
    stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'flags').get(() => ({'site-id': undefined, bm: false}));

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('--site-id');
    }
  });
});
