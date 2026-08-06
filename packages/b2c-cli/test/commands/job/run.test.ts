/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import JobRun from '../../../src/commands/job/run.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

/**
 * The dispatcher's branch-routing behavior is unit-tested in
 * b2c-tooling-sdk/test/compat/dispatcher.test.ts. Command tests stub
 * `createJobsDispatcher` to return a fake whose `run()` returns a
 * pre-programmed value — we test command-level orchestration without
 * exercising the dispatcher internals.
 */
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

describe('job run', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(JobRun, hooks.getConfig(), flags, args);
  }

  function stubCommon(command: any) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', tenantId: 'tenant_test'}}));
    sinon.stub(command, 'instance').get(() => ({config: {hostname: 'example.com'}}));
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'createContext').callsFake((operationType: any, metadata: any) => ({
      operationType,
      metadata,
      startTime: Date.now(),
    }));
    const fake = makeDispatcherFake();
    sinon.stub(command, 'createJobsDispatcher').returns(fake.dispatcher);
    return fake;
  }

  it('errors on invalid -P param format', async () => {
    const command: any = await createCommand({param: ['bad'], json: true}, {jobId: 'my-job'});
    stubCommon(command);

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    expect(errorStub.calledOnce).to.equal(true);
  });

  it('executes without waiting when --wait is false', async () => {
    const command: any = await createCommand({param: ['A=1'], json: true}, {jobId: 'my-job'});
    const {runner} = stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    runner.resolves({id: 'e1', jobId: 'my-job', executionStatus: 'running'});

    const result = await command.run();

    expect(runner.calledOnce).to.equal(true);
    expect(result.id).to.equal('e1');
  });

  it('waits when --wait is true', async () => {
    const command: any = await createCommand(
      {wait: true, timeout: 10, 'poll-interval': 1, json: true},
      {jobId: 'my-job'},
    );
    const {runner} = stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    // First run() call is executeJob; subsequent are getJobExecution polls.
    runner.onFirstCall().resolves({id: 'e1', jobId: 'my-job', executionStatus: 'running'});
    runner.onSecondCall().resolves({
      id: 'e1',
      jobId: 'my-job',
      executionStatus: 'finished',
      exitStatus: {code: 'OK', status: 'ok'},
    });

    const result = await command.run();

    expect(runner.callCount).to.be.greaterThanOrEqual(2);
    expect(result.executionStatus).to.equal('finished');
  });

  it('returns early when before hooks skip', async () => {
    const command: any = await createCommand({json: true}, {jobId: 'my-job'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: true, skipReason: 'by plugin'});

    const result = await command.run();

    expect(result.executionStatus).to.equal('finished');
  });

  it('errors on invalid --body JSON', async () => {
    const command: any = await createCommand({body: '{bad', json: true}, {jobId: 'my-job'});
    stubCommon(command);

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    expect(errorStub.calledOnce).to.equal(true);
  });
});
