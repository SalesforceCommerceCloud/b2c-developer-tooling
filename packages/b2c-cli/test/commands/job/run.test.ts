/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import JobRun from '../../../src/commands/job/run.js';
import {JobExecutionError} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import {isolateConfig, restoreConfig} from '../../helpers/config-isolation.js';
import {stubParse} from '../../helpers/stub-parse.js';

describe('job run', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    const command: any = new JobRun([], config);
    stubParse(command, flags, args);
    await command.init();
    return command;
  }

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  function stubCommon(command: any) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({hostname: 'example.com'}));
    sinon.stub(command, 'log').returns(void 0);
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
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const execStub = sinon.stub(command, 'executeJob').resolves({id: 'e1', execution_status: 'running'});
    const waitStub = sinon.stub(command, 'waitForJob').rejects(new Error('Unexpected wait'));

    const result = await command.run();

    expect(execStub.calledOnce).to.equal(true);
    expect(waitStub.called).to.equal(false);
    expect(result.id).to.equal('e1');
  });

  it('waits when --wait is true', async () => {
    const command: any = await createCommand({wait: true, timeout: 1, json: true}, {jobId: 'my-job'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    sinon.stub(command, 'executeJob').resolves({id: 'e1', execution_status: 'running'});
    const waitStub = sinon.stub(command, 'waitForJob').resolves({id: 'e1', execution_status: 'finished'});

    const result = await command.run();

    expect(waitStub.calledOnce).to.equal(true);
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

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'executeJob').resolves({id: 'e1', execution_status: 'running'});
    const showLogStub = sinon.stub(command, 'showJobLog').resolves(void 0);

    const exec: any = {execution_status: 'finished', exit_status: {code: 'ERROR'}};
    sinon.stub(command, 'waitForJob').rejects(new JobExecutionError('failed', exec));

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    expect(showLogStub.calledOnce).to.equal(true);
    expect(errorStub.called).to.equal(true);
  });
});
