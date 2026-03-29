/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SitesCartridgesRemove from '../../../../src/commands/sites/cartridges/remove.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('sites cartridges remove', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(SitesCartridgesRemove, hooks.getConfig(), flags, args);
  }

  function stubCommon(command: any, {jsonEnabled, siteId}: {jsonEnabled: boolean; siteId: string}) {
    sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
    sinon.stub(command, 'flags').get(() => ({'site-id': siteId, bm: false}));
    sinon.stub(command, 'args').get(() => ({cartridge: 'old_cart'}));
  }

  it('removes cartridge via OCAPI DELETE', async () => {
    const command: any = await createCommand({'site-id': 'RefArch'}, {cartridge: 'old_cart'});
    stubCommon(command, {jsonEnabled: true, siteId: 'RefArch'});

    const ocapiDelete = sinon.stub().resolves({
      data: {cartridges: 'cart_a', site_id: 'RefArch'},
      error: undefined,
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {DELETE: ocapiDelete}}));

    const result = await command.run();
    expect(result.cartridges).to.equal('cart_a');
    expect(ocapiDelete.calledOnce).to.be.true;
  });

  it('calls assertDestructiveOperationAllowed', async () => {
    const command: any = await createCommand({'site-id': 'RefArch'}, {cartridge: 'old_cart'});
    const destructiveStub = sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'flags').get(() => ({'site-id': 'RefArch', bm: false}));
    sinon.stub(command, 'args').get(() => ({cartridge: 'old_cart'}));

    const ocapiDelete = sinon.stub().resolves({
      data: {cartridges: 'cart_a', site_id: 'RefArch'},
      error: undefined,
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {DELETE: ocapiDelete}}));

    await command.run();
    expect(destructiveStub.calledOnce).to.be.true;
  });

  it('prints success message in non-JSON mode', async () => {
    const command: any = await createCommand({'site-id': 'RefArch'}, {cartridge: 'old_cart'});
    stubCommon(command, {jsonEnabled: false, siteId: 'RefArch'});

    const ocapiDelete = sinon.stub().resolves({
      data: {cartridges: 'cart_a', site_id: 'RefArch'},
      error: undefined,
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {DELETE: ocapiDelete}}));

    const logStub = sinon.stub(command, 'log');

    await command.run();
    expect(logStub.callCount).to.be.at.least(1);
    expect(logStub.firstCall.args[0]).to.include('Removed');
  });
});
