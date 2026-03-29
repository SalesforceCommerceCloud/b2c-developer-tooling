/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SitesCartridgesSet from '../../../../src/commands/sites/cartridges/set.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('sites cartridges set', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(SitesCartridgesSet, hooks.getConfig(), flags, args);
  }

  function stubCommon(command: any, {jsonEnabled, siteId}: {jsonEnabled: boolean; siteId: string}) {
    sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
    sinon.stub(command, 'flags').get(() => ({'site-id': siteId, bm: false}));
    sinon.stub(command, 'args').get(() => ({cartridges: 'new_cart1:new_cart2'}));
  }

  it('sets cartridge path via OCAPI PUT', async () => {
    const command: any = await createCommand({'site-id': 'RefArch'}, {cartridges: 'new_cart1:new_cart2'});
    stubCommon(command, {jsonEnabled: true, siteId: 'RefArch'});

    const ocapiPut = sinon.stub().resolves({
      data: {cartridges: 'new_cart1:new_cart2', site_id: 'RefArch'},
      error: undefined,
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {PUT: ocapiPut}}));

    const result = await command.run();
    expect(result.cartridges).to.equal('new_cart1:new_cart2');
    expect(result.cartridgeList).to.deep.equal(['new_cart1', 'new_cart2']);
    expect(ocapiPut.calledOnce).to.be.true;
  });

  it('calls assertDestructiveOperationAllowed', async () => {
    const command: any = await createCommand({'site-id': 'RefArch'}, {cartridges: 'cart1'});
    const destructiveStub = sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'flags').get(() => ({'site-id': 'RefArch', bm: false}));
    sinon.stub(command, 'args').get(() => ({cartridges: 'cart1'}));

    const ocapiPut = sinon.stub().resolves({
      data: {cartridges: 'cart1', site_id: 'RefArch'},
      error: undefined,
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {PUT: ocapiPut}}));

    await command.run();
    expect(destructiveStub.calledOnce).to.be.true;
  });

  it('prints success message in non-JSON mode', async () => {
    const command: any = await createCommand({'site-id': 'RefArch'}, {cartridges: 'cart1:cart2'});
    stubCommon(command, {jsonEnabled: false, siteId: 'RefArch'});

    const ocapiPut = sinon.stub().resolves({
      data: {cartridges: 'cart1:cart2', site_id: 'RefArch'},
      error: undefined,
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {PUT: ocapiPut}}));

    const logStub = sinon.stub(command, 'log');

    await command.run();
    expect(logStub.callCount).to.be.at.least(1);
    expect(logStub.firstCall.args[0]).to.include('updated');
  });
});
