/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {ux} from '@oclif/core';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import JobSearch from '../../../src/commands/job/search.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

function makeDispatcherFake() {
  const runner = sinon.stub();
  return {
    runner,
    dispatcher: {
      active: 'scapi' as const,
      run: runner,
      runScapiOnly: sinon.stub(),
    },
  };
}

describe('job search', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(JobSearch, hooks.getConfig(), flags, args);
  }

  function stubCommon(command: any) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', tenantId: 'tenant_test'}}));
    sinon.stub(command, 'instance').get(() => ({config: {hostname: 'example.com'}}));
    sinon.stub(command, 'log').returns(void 0);
    const fake = makeDispatcherFake();
    sinon.stub(command, 'createJobsDispatcher').returns(fake.dispatcher);
    return fake;
  }

  it('returns results in json mode', async () => {
    const command: any = await createCommand({json: true}, {});
    const {runner} = stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(true);

    runner.resolves({total: 1, hits: [{id: 'e1'}]});
    const uxStub = sinon.stub(ux, 'stdout');

    const result = await command.run();

    expect(runner.calledOnce).to.equal(true);
    expect(uxStub.called).to.equal(false);
    expect(result.total).to.equal(1);
  });

  it('prints no results in non-json mode', async () => {
    const command: any = await createCommand({}, {});
    const {runner} = stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(false);

    runner.resolves({total: 0, hits: []});
    const uxStub = sinon.stub(ux, 'stdout');

    const result = await command.run();

    expect(result.total).to.equal(0);
    expect(uxStub.calledOnce).to.equal(true);
    expect(runner.calledOnce).to.equal(true);
  });
});
