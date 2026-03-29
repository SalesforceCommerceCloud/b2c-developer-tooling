/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SitesCartridgesAdd from '../../../../src/commands/sites/cartridges/add.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('sites cartridges add', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(SitesCartridgesAdd, hooks.getConfig(), flags, args);
  }

  function stubCommon(
    command: any,
    {jsonEnabled, siteId, position, target}: {jsonEnabled: boolean; siteId: string; position?: string; target?: string},
  ) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
    sinon.stub(command, 'flags').get(() => ({
      'site-id': siteId,
      bm: false,
      position: position ?? 'first',
      target,
    }));
    sinon.stub(command, 'args').get(() => ({cartridge: 'my_cartridge'}));
  }

  it('adds cartridge via OCAPI POST and returns result', async () => {
    const command: any = await createCommand({'site-id': 'RefArch'}, {cartridge: 'my_cartridge'});
    stubCommon(command, {jsonEnabled: true, siteId: 'RefArch'});

    const ocapiPost = sinon.stub().resolves({
      data: {cartridges: 'cart_a:my_cartridge', site_id: 'RefArch'},
      error: undefined,
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {POST: ocapiPost}}));

    const result = await command.run();
    expect(result.cartridges).to.equal('cart_a:my_cartridge');
    expect(ocapiPost.calledOnce).to.be.true;
  });

  it('passes position and target to OCAPI', async () => {
    const command: any = await createCommand(
      {'site-id': 'RefArch', position: 'after', target: 'cart_a'},
      {cartridge: 'my_cartridge'},
    );
    stubCommon(command, {jsonEnabled: true, siteId: 'RefArch', position: 'after', target: 'cart_a'});

    const ocapiPost = sinon.stub().resolves({
      data: {cartridges: 'cart_a:my_cartridge', site_id: 'RefArch'},
      error: undefined,
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {POST: ocapiPost}}));

    await command.run();

    const body = ocapiPost.firstCall.args[1].body;
    expect(body.name).to.equal('my_cartridge');
    expect(body.position).to.equal('after');
    expect(body.target).to.equal('cart_a');
  });

  it('prints success message in non-JSON mode', async () => {
    const command: any = await createCommand({'site-id': 'RefArch'}, {cartridge: 'my_cartridge'});
    stubCommon(command, {jsonEnabled: false, siteId: 'RefArch'});

    const ocapiPost = sinon.stub().resolves({
      data: {cartridges: 'cart_a:my_cartridge', site_id: 'RefArch'},
      error: undefined,
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {POST: ocapiPost}}));

    const logStub = sinon.stub(command, 'log');

    await command.run();
    expect(logStub.callCount).to.be.at.least(1);
    expect(logStub.firstCall.args[0]).to.include('Added');
    expect(logStub.firstCall.args[0]).to.include('my_cartridge');
  });

  it('errors when position is before/after without --target', async () => {
    const command: any = await createCommand({'site-id': 'RefArch', position: 'before'}, {cartridge: 'my_cartridge'});
    stubCommon(command, {jsonEnabled: false, siteId: 'RefArch', position: 'before'});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('--target');
    }
  });
});
