/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import JobWait from '../../../src/commands/job/wait.js';
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

describe('job wait', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(JobWait, hooks.getConfig(), flags, args);
  }

  it('waits using dispatcher polling', async () => {
    const command: any = await createCommand({'poll-interval': 1, json: true}, {jobId: 'my-job', executionId: 'e1'});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', tenantId: 'tenant_test'}}));
    sinon.stub(command, 'instance').get(() => ({config: {hostname: 'example.com'}}));
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const {runner, dispatcher} = makeDispatcherFake();
    runner.resolves({
      id: 'e1',
      jobId: 'my-job',
      executionStatus: 'finished',
      exitStatus: {code: 'OK', status: 'ok'},
    });
    sinon.stub(command, 'createJobsDispatcher').returns(dispatcher);

    const result = await command.run();

    expect(runner.called).to.equal(true);
    expect(result.id).to.equal('e1');
  });
});
