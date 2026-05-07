/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import BmUsersUpdate from '../../../../src/commands/bm/users/update.js';
import {createIsolatedConfigHooks, createTestCommand, expectError} from '../../../helpers/test-setup.js';

describe('bm users update', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(BmUsersUpdate, hooks.getConfig(), flags, args);
  }

  function stubCommon(command: any, {jsonEnabled}: {jsonEnabled: boolean}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
  }

  it('updates user with --disabled in JSON mode', async () => {
    const command: any = await createCommand({disabled: true}, {login: 'user@x.com'});
    stubCommon(command, {jsonEnabled: true});

    const mockUser = {login: 'user@x.com', disabled: true};
    const ocapiPatch = sinon.stub().resolves({data: mockUser, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {PATCH: ocapiPatch}}));

    const result = await command.run();
    expect(result.disabled).to.equal(true);
    expect(ocapiPatch.calledOnce).to.equal(true);
    const body = ocapiPatch.firstCall.args[1].body;
    expect(body).to.deep.equal({disabled: true});
  });

  it('combines multiple field flags into PATCH body', async () => {
    const command: any = await createCommand(
      {'first-name': 'Jane', 'last-name': 'Doe', 'preferred-ui-locale': 'en_US'},
      {login: 'user@x.com'},
    );
    stubCommon(command, {jsonEnabled: true});

    const ocapiPatch = sinon.stub().resolves({data: {login: 'user@x.com'}, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {PATCH: ocapiPatch}}));

    await command.run();
    const body = ocapiPatch.firstCall.args[1].body;
    expect(body).to.deep.equal({
      first_name: 'Jane',
      last_name: 'Doe',
      preferred_ui_locale: 'en_US',
    });
  });

  it('errors when no fields are specified', async () => {
    const command: any = await createCommand({}, {login: 'user@x.com'});
    stubCommon(command, {jsonEnabled: true});

    sinon.stub(command, 'instance').get(() => ({ocapi: {PATCH: sinon.stub()}}));

    await expectError(() => command.run(), /No fields specified/);
  });

  it('throws on 404', async () => {
    const command: any = await createCommand({disabled: true}, {login: 'missing@x.com'});
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));

    const ocapiPatch = sinon.stub().resolves({
      data: undefined,
      error: {fault: {message: 'User not found'}},
      response: {status: 404, statusText: 'Not Found'},
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {PATCH: ocapiPatch}}));

    await expectError(() => command.run(), 'Failed to update user');
  });
});
