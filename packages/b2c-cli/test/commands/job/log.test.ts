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

describe('job log', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(JobLog, hooks.getConfig(), flags, args);
  }

  function stubCommon(command: any) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', tenantId: 'tenant_test'}}));
    sinon.stub(command, 'instance').get(() => ({
      config: {hostname: 'example.com'},
      webdav: {get: sinon.stub().resolves(new TextEncoder().encode('log content here'))},
    }));
    sinon.stub(command, 'log').returns(void 0);
    const fake = makeDispatcherFake();
    sinon.stub(command, 'createJobsDispatcher').returns(fake.dispatcher);
    return fake;
  }

  it('fetches log for a specific execution', async () => {
    const command: any = await createCommand({}, {jobId: 'my-job', executionId: 'exec-1'});
    const {runner} = stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(false);

    const execution = {
      id: 'exec-1',
      jobId: 'my-job',
      isLogFileExisting: true,
      logFilePath: '/Sites/LOGS/jobs/exec-1.log',
      exitStatus: {code: 'OK'},
    };
    runner.resolves(execution);

    const result = (await runSilent(() => command.run())) as {execution: unknown; log: string};

    expect(runner.calledOnce).to.equal(true);
    expect(result.log).to.equal('log content here');
    expect(result.execution).to.equal(execution);
  });

  it('searches for most recent execution with log', async () => {
    const command: any = await createCommand({}, {jobId: 'my-job'});
    const {runner} = stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(false);

    const execWithoutLog = {id: 'exec-1', jobId: 'my-job', isLogFileExisting: false};
    const execWithLog = {
      id: 'exec-2',
      jobId: 'my-job',
      isLogFileExisting: true,
      logFilePath: '/Sites/LOGS/jobs/exec-2.log',
      exitStatus: {code: 'OK'},
    };
    runner.resolves({total: 2, hits: [execWithoutLog, execWithLog]});

    const result = (await runSilent(() => command.run())) as {log: string};

    expect(runner.calledOnce).to.equal(true);
    expect(result.log).to.equal('log content here');
  });

  it('searches for most recent failed execution with --failed', async () => {
    const command: any = await createCommand({failed: true}, {jobId: 'my-job'});
    const {runner} = stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(false);

    const execution = {
      id: 'exec-3',
      jobId: 'my-job',
      isLogFileExisting: true,
      logFilePath: '/Sites/LOGS/jobs/exec-3.log',
      exitStatus: {code: 'ERROR'},
    };
    runner.resolves({total: 1, hits: [execution]});

    const result = (await runSilent(() => command.run())) as {log: string};

    expect(result.log).to.equal('log content here');
  });

  it('errors when specific execution has no log file', async () => {
    const command: any = await createCommand({}, {jobId: 'my-job', executionId: 'exec-1'});
    const {runner} = stubCommon(command);

    runner.resolves({id: 'exec-1', jobId: 'my-job', isLogFileExisting: false});

    try {
      await command.run();
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).to.include('No log file exists');
    }
  });

  it('errors when no executions with log found', async () => {
    const command: any = await createCommand({}, {jobId: 'my-job'});
    const {runner} = stubCommon(command);

    runner.resolves({total: 0, hits: []});

    try {
      await command.run();
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).to.include('No execution with a log file found');
    }
  });

  it('returns structured result in json mode', async () => {
    const command: any = await createCommand({json: true}, {jobId: 'my-job', executionId: 'exec-1'});
    const {runner} = stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const execution = {
      id: 'exec-1',
      jobId: 'my-job',
      isLogFileExisting: true,
      logFilePath: '/Sites/LOGS/jobs/exec-1.log',
      exitStatus: {code: 'OK'},
    };
    runner.resolves(execution);

    const result = await command.run();

    expect(result).to.have.property('execution');
    expect(result).to.have.property('log', 'log content here');
  });
});
