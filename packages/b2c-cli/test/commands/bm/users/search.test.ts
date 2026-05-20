/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import BmUsersSearch from '../../../../src/commands/bm/users/search.js';
import {createIsolatedConfigHooks, createTestCommand, expectError} from '../../../helpers/test-setup.js';

describe('bm users search', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(BmUsersSearch, hooks.getConfig(), flags);
  }

  function stubCommon(command: any, {jsonEnabled}: {jsonEnabled: boolean}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
  }

  it('returns search results in JSON mode with no flags (match_all)', async () => {
    const command: any = await createCommand();
    stubCommon(command, {jsonEnabled: true});

    const mockResult = {hits: [{login: 'a@x.com'}], total: 1, count: 1};
    const ocapiPost = sinon.stub().resolves({data: mockResult, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {POST: ocapiPost}}));

    const result = await command.run();
    expect(result.total).to.equal(1);
    expect(ocapiPost.calledOnce).to.equal(true);
    expect(ocapiPost.firstCall.args[0]).to.equal('/user_search');
    const body = ocapiPost.firstCall.args[1].body;
    expect(body.query).to.deep.equal({match_all_query: {}});
  });

  it('builds text_query from --search-phrase', async () => {
    const command: any = await createCommand({'search-phrase': 'smith'});
    stubCommon(command, {jsonEnabled: true});

    const ocapiPost = sinon.stub().resolves({data: {hits: [], total: 0}, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {POST: ocapiPost}}));

    await command.run();
    const body = ocapiPost.firstCall.args[1].body;
    expect(body.query).to.deep.equal({
      text_query: {
        fields: ['login', 'email', 'first_name', 'last_name'],
        search_phrase: 'smith',
      },
    });
  });

  it('passes raw --query JSON verbatim', async () => {
    const raw = {text_query: {fields: ['login'], search_phrase: 'foo'}};
    const command: any = await createCommand({query: JSON.stringify(raw)});
    stubCommon(command, {jsonEnabled: true});

    const ocapiPost = sinon.stub().resolves({data: {hits: [], total: 0}, error: undefined});
    sinon.stub(command, 'instance').get(() => ({ocapi: {POST: ocapiPost}}));

    await command.run();
    const body = ocapiPost.firstCall.args[1].body;
    expect(body.query).to.deep.equal(raw);
  });

  it('errors on invalid --query JSON', async () => {
    const command: any = await createCommand({query: 'not-valid-json'});
    stubCommon(command, {jsonEnabled: true});

    // No POST should be invoked, but stub instance defensively.
    sinon.stub(command, 'instance').get(() => ({ocapi: {POST: sinon.stub()}}));

    await expectError(() => command.run(), /Invalid --query JSON/);
  });

  it('throws when OCAPI returns error', async () => {
    const command: any = await createCommand();
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));

    const ocapiPost = sinon.stub().resolves({
      data: undefined,
      error: {fault: {message: 'bad query'}},
      response: {status: 400, statusText: 'Bad Request'},
    });
    sinon.stub(command, 'instance').get(() => ({ocapi: {POST: ocapiPost}}));

    await expectError(() => command.run(), 'Failed to search users');
  });
});
