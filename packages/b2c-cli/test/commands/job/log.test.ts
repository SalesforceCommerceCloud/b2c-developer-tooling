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

  function stubCommon(command: any) {
    const instance = {config: {hostname: 'example.com'}};
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'instance').get(() => instance);
    sinon.stub(command, 'log').returns(void 0);
    return instance;
  }

  it('fetches log for a specific execution', async () => {
    const command: any = await createCommand({}, {jobId: 'my-job', executionId: 'exec-1'});
    const instance = stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(false);

    const execution = {id: 'exec-1', job_id: 'my-job', is_log_file_existing: true, exit_status: {code: 'OK'}};
    const getJobExecutionStub = sinon.stub().resolves(execution);
    const getJobLogStub = sinon.stub().resolves('log content here');
    command.operations = {...command.operations, getJobExecution: getJobExecutionStub, getJobLog: getJobLogStub};

    const result = (await runSilent(() => command.run())) as {execution: unknown; log: string};

    expect(getJobExecutionStub.calledOnce).to.equal(true);
    expect(getJobExecutionStub.getCall(0).args[0]).to.equal(instance);
    expect(getJobExecutionStub.getCall(0).args[1]).to.equal('my-job');
    expect(getJobExecutionStub.getCall(0).args[2]).to.equal('exec-1');
    expect(getJobLogStub.calledOnce).to.equal(true);
    expect(result.log).to.equal('log content here');
    expect(result.execution).to.equal(execution);
  });

  it('searches for most recent execution with log', async () => {
    const command: any = await createCommand({}, {jobId: 'my-job'});
    const instance = stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(false);

    const execWithoutLog = {id: 'exec-1', job_id: 'my-job', is_log_file_existing: false};
    const execWithLog = {id: 'exec-2', job_id: 'my-job', is_log_file_existing: true, exit_status: {code: 'OK'}};
    const searchStub = sinon.stub().resolves({total: 2, hits: [execWithoutLog, execWithLog]});
    const getJobLogStub = sinon.stub().resolves('log from exec-2');
    command.operations = {...command.operations, searchJobExecutions: searchStub, getJobLog: getJobLogStub};

    const result = (await runSilent(() => command.run())) as {log: string};

    expect(searchStub.calledOnce).to.equal(true);
    expect(searchStub.getCall(0).args[0]).to.equal(instance);
    expect(searchStub.getCall(0).args[1]).to.deep.include({jobId: 'my-job'});
    expect(getJobLogStub.calledOnce).to.equal(true);
    expect(getJobLogStub.getCall(0).args[1]).to.equal(execWithLog);
    expect(result.log).to.equal('log from exec-2');
  });

  it('searches for most recent failed execution with --failed', async () => {
    const command: any = await createCommand({failed: true}, {jobId: 'my-job'});
    stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(false);

    const execution = {id: 'exec-3', job_id: 'my-job', is_log_file_existing: true, exit_status: {code: 'ERROR'}};
    const searchStub = sinon.stub().resolves({total: 1, hits: [execution]});
    const getJobLogStub = sinon.stub().resolves('error log');
    command.operations = {...command.operations, searchJobExecutions: searchStub, getJobLog: getJobLogStub};

    const result = (await runSilent(() => command.run())) as {log: string};

    expect(searchStub.getCall(0).args[1]).to.deep.include({status: ['ERROR']});
    expect(result.log).to.equal('error log');
  });

  it('errors when specific execution has no log file', async () => {
    const command: any = await createCommand({}, {jobId: 'my-job', executionId: 'exec-1'});
    stubCommon(command);

    const execution = {id: 'exec-1', job_id: 'my-job', is_log_file_existing: false};
    sinon.stub().resolves(execution);
    command.operations = {...command.operations, getJobExecution: sinon.stub().resolves(execution)};

    try {
      await command.run();
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).to.include('No log file exists');
    }
  });

  it('errors when no executions with log found', async () => {
    const command: any = await createCommand({}, {jobId: 'my-job'});
    stubCommon(command);

    const searchStub = sinon.stub().resolves({total: 0, hits: []});
    command.operations = {...command.operations, searchJobExecutions: searchStub};

    try {
      await command.run();
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).to.include('No execution with a log file found');
    }
  });

  it('returns structured result in json mode', async () => {
    const command: any = await createCommand({json: true}, {jobId: 'my-job', executionId: 'exec-1'});
    stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const execution = {id: 'exec-1', job_id: 'my-job', is_log_file_existing: true, exit_status: {code: 'OK'}};
    command.operations = {
      ...command.operations,
      getJobExecution: sinon.stub().resolves(execution),
      getJobLog: sinon.stub().resolves('json log content'),
    };

    const result = await command.run();

    expect(result).to.have.property('execution');
    expect(result).to.have.property('log', 'json log content');
  });
});
