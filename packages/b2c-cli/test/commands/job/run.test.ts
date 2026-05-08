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

describe('job run', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(JobRun, hooks.getConfig(), flags, args);
  }

  function createMockBackend() {
    return {
      name: 'ocapi' as const,
      executeJob: sinon.stub(),
      getJobExecution: sinon.stub(),
      searchJobExecutions: sinon.stub(),
      deleteJobExecution: sinon.stub(),
      getJobLog: sinon.stub(),
    };
  }

  function stubCommon(command: any) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'instance').get(() => ({config: {hostname: 'example.com'}}));
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'createContext').callsFake((operationType: any, metadata: any) => ({
      operationType,
      metadata,
      startTime: Date.now(),
    }));
    const backend = createMockBackend();
    sinon.stub(command, 'createJobsBackend').returns(backend);
    return backend;
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
    const backend = stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    backend.executeJob.resolves({id: 'e1', executionStatus: 'running'});

    const result = await command.run();

    expect(backend.executeJob.calledOnce).to.equal(true);
    expect(backend.executeJob.getCall(0).args[0]).to.equal('my-job');
    expect(result.id).to.equal('e1');
  });

  it('waits when --wait is true', async () => {
    const command: any = await createCommand(
      {wait: true, timeout: 10, 'poll-interval': 1, json: true},
      {jobId: 'my-job'},
    );
    const backend = stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    backend.executeJob.resolves({id: 'e1', executionStatus: 'running'});
    backend.getJobExecution.resolves({
      id: 'e1',
      executionStatus: 'finished',
      exitStatus: {code: 'OK', status: 'ok'},
    });

    const result = await command.run();

    expect(backend.getJobExecution.called).to.equal(true);
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
