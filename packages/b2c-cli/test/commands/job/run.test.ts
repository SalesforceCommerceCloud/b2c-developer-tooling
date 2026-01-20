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

  function stubCommon(command: any) {
    const instance = {config: {hostname: 'example.com'}};
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'instance').get(() => instance);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'createContext').callsFake((operationType: any, metadata: any) => ({
      operationType,
      metadata,
      startTime: Date.now(),
    }));
    return instance;
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
    const instance = stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const execStub = sinon.stub().resolves({id: 'e1', execution_status: 'running'});
    const waitStub = sinon.stub().rejects(new Error('Unexpected wait'));
    command.operations = {...command.operations, executeJob: execStub, waitForJob: waitStub};

    const result = await command.run();

    expect(execStub.calledOnce).to.equal(true);
    expect(execStub.getCall(0).args[0]).to.equal(instance);
    expect(waitStub.called).to.equal(false);
    expect(result.id).to.equal('e1');
  });

  it('waits when --wait is true', async () => {
    const command: any = await createCommand({wait: true, timeout: 1, json: true}, {jobId: 'my-job'});
    const instance = stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const execStub = sinon.stub().resolves({id: 'e1', execution_status: 'running'});
    const waitStub = sinon.stub().resolves({id: 'e1', execution_status: 'finished'});
    command.operations = {...command.operations, executeJob: execStub, waitForJob: waitStub};

    const result = await command.run();

    expect(waitStub.calledOnce).to.equal(true);
    expect(waitStub.getCall(0).args[0]).to.equal(instance);
    expect(result.execution_status).to.equal('finished');
  });

  it('returns early when before hooks skip', async () => {
    const command: any = await createCommand({json: true}, {jobId: 'my-job'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: true, skipReason: 'by plugin'});

    const result = await command.run();

    expect(result.exit_status.code).to.equal('skipped');
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

  it('shows job log and errors on JobExecutionError when waiting and show-log is true', async () => {
    const command: any = await createCommand({wait: true, json: true, 'show-log': true}, {jobId: 'my-job'});
    stubCommon(command);

    command.flags = {...command.flags, wait: true, json: true, 'show-log': true};

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);
    const execStub = sinon.stub().resolves({id: 'e1', execution_status: 'running'});
    command.operations = {...command.operations, executeJob: execStub};
    sinon.stub(command, 'showJobLog').resolves(void 0);

    const exec: any = {execution_status: 'finished', exit_status: {code: 'ERROR'}};
    const {JobExecutionError} = await import('@salesforce/b2c-tooling-sdk/operations/jobs');
    const jobError = new JobExecutionError('failed', exec);
    expect(jobError).to.be.instanceOf(JobExecutionError);
    const waitStub = sinon.stub().rejects(jobError);
    command.operations = {...command.operations, waitForJob: waitStub};

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    expect(errorStub.called).to.equal(true);
  });
});
