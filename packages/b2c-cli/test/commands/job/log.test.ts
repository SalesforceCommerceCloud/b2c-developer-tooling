/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import JobLog from '../../../src/commands/job/log.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../helpers/test-setup.js';

describe('job log', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(JobLog, hooks.getConfig(), flags, args);
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
    const backend = createMockBackend();
    sinon.stub(command, 'createJobsBackend').returns(backend);
    return backend;
  }

  it('fetches log for a specific execution', async () => {
    const command: any = await createCommand({}, {jobId: 'my-job', executionId: 'exec-1'});
    const backend = stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(false);

    const execution = {id: 'exec-1', jobId: 'my-job', isLogFileExisting: true, exitStatus: {code: 'OK'}};
    backend.getJobExecution.resolves(execution);
    backend.getJobLog.resolves('log content here');

    const result = (await runSilent(() => command.run())) as {execution: unknown; log: string};

    expect(backend.getJobExecution.calledOnce).to.equal(true);
    expect(backend.getJobExecution.getCall(0).args[0]).to.equal('my-job');
    expect(backend.getJobExecution.getCall(0).args[1]).to.equal('exec-1');
    expect(backend.getJobLog.calledOnce).to.equal(true);
    expect(result.log).to.equal('log content here');
    expect(result.execution).to.equal(execution);
  });

  it('searches for most recent execution with log', async () => {
    const command: any = await createCommand({}, {jobId: 'my-job'});
    const backend = stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(false);

    const execWithoutLog = {id: 'exec-1', jobId: 'my-job', isLogFileExisting: false};
    const execWithLog = {id: 'exec-2', jobId: 'my-job', isLogFileExisting: true, exitStatus: {code: 'OK'}};
    backend.searchJobExecutions.resolves({total: 2, hits: [execWithoutLog, execWithLog]});
    backend.getJobLog.resolves('log from exec-2');

    const result = (await runSilent(() => command.run())) as {log: string};

    expect(backend.searchJobExecutions.calledOnce).to.equal(true);
    expect(backend.searchJobExecutions.getCall(0).args[0]).to.deep.include({jobId: 'my-job'});
    expect(backend.getJobLog.calledOnce).to.equal(true);
    expect(backend.getJobLog.getCall(0).args[0]).to.equal(execWithLog);
    expect(result.log).to.equal('log from exec-2');
  });

  it('searches for most recent failed execution with --failed', async () => {
    const command: any = await createCommand({failed: true}, {jobId: 'my-job'});
    const backend = stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(false);

    const execution = {id: 'exec-3', jobId: 'my-job', isLogFileExisting: true, exitStatus: {code: 'ERROR'}};
    backend.searchJobExecutions.resolves({total: 1, hits: [execution]});
    backend.getJobLog.resolves('error log');

    const result = (await runSilent(() => command.run())) as {log: string};

    expect(backend.searchJobExecutions.getCall(0).args[0]).to.deep.include({status: ['ERROR']});
    expect(result.log).to.equal('error log');
  });

  it('errors when specific execution has no log file', async () => {
    const command: any = await createCommand({}, {jobId: 'my-job', executionId: 'exec-1'});
    const backend = stubCommon(command);

    const execution = {id: 'exec-1', jobId: 'my-job', isLogFileExisting: false};
    backend.getJobExecution.resolves(execution);

    try {
      await command.run();
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).to.include('No log file exists');
    }
  });

  it('errors when no executions with log found', async () => {
    const command: any = await createCommand({}, {jobId: 'my-job'});
    const backend = stubCommon(command);

    backend.searchJobExecutions.resolves({total: 0, hits: []});

    try {
      await command.run();
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).to.include('No execution with a log file found');
    }
  });

  it('returns structured result in json mode', async () => {
    const command: any = await createCommand({json: true}, {jobId: 'my-job', executionId: 'exec-1'});
    const backend = stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const execution = {id: 'exec-1', jobId: 'my-job', isLogFileExisting: true, exitStatus: {code: 'OK'}};
    backend.getJobExecution.resolves(execution);
    backend.getJobLog.resolves('json log content');

    const result = await command.run();

    expect(result).to.have.property('execution');
    expect(result).to.have.property('log', 'json log content');
  });
});
