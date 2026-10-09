/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {ux} from '@oclif/core';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import CodeList from '../../../src/commands/code/list.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('code list', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>) {
    return createTestCommand(CodeList, hooks.getConfig(), flags, {});
  }

  function createMockBackend() {
    return {
      name: 'ocapi' as const,
      listCodeVersions: sinon.stub(),
      getActiveCodeVersion: sinon.stub(),
      activateCodeVersion: sinon.stub(),
      deleteCodeVersion: sinon.stub(),
      createCodeVersion: sinon.stub(),
      reloadCodeVersion: sinon.stub(),
    };
  }

  function stubCommon(command: any) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'instance').get(() => ({config: {hostname: 'example.com'}}));
    const backend = createMockBackend();
    sinon.stub(command, 'createScriptsBackend').returns(backend);
    return backend;
  }

  it('returns data in json mode', async () => {
    const command: any = await createCommand({json: true});
    const backend = stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(true);

    backend.listCodeVersions.resolves([{id: 'v1', active: true}]);

    const uxStub = sinon.stub(ux, 'stdout');

    const result = await command.run();

    expect(result.total).to.equal(1);
    expect(uxStub.called).to.equal(false);
  });

  it('prints a message when no code versions are returned in non-json mode', async () => {
    const command: any = await createCommand({});
    const backend = stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(false);

    backend.listCodeVersions.resolves([]);

    const uxStub = sinon.stub(ux, 'stdout');

    const result = await command.run();

    expect(result.total).to.equal(0);
    expect(uxStub.calledOnce).to.equal(true);
  });
});
