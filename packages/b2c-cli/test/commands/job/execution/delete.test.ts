/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import JobExecutionDelete from '../../../../src/commands/job/execution/delete.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../helpers/test-setup.js';

describe('job execution delete', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(JobExecutionDelete, hooks.getConfig(), flags, args);
  }

  function createScapiBackend() {
    // SCAPI backend implements DeletableJobsBackend (has deleteJobExecution)
    return {
      name: 'scapi' as const,
      executeJob: sinon.stub(),
      getJobExecution: sinon.stub(),
      searchJobExecutions: sinon.stub(),
      deleteJobExecution: sinon.stub(),
      getJobLog: sinon.stub(),
    };
  }

  function createOcapiBackend() {
    // OCAPI backend does NOT implement deleteJobExecution
    return {
      name: 'ocapi' as const,
      executeJob: sinon.stub(),
      getJobExecution: sinon.stub(),
      searchJobExecutions: sinon.stub(),
      getJobLog: sinon.stub(),
    };
  }

  function stubCommon(command: any, backend: object) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'instance').get(() => ({config: {hostname: 'example.com'}}));
    sinon.stub(command, 'createJobsBackend').returns(backend);
    return backend;
  }

  it('deletes a job execution when SCAPI backend is active', async () => {
    const command: any = await createCommand({}, {jobId: 'my-job', executionId: 'exec-1'});
    const backend = stubCommon(command, createScapiBackend()) as ReturnType<typeof createScapiBackend>;
    backend.deleteJobExecution.resolves();

    await runSilent(() => command.run());

    expect(backend.deleteJobExecution.calledOnce).to.equal(true);
    expect(backend.deleteJobExecution.getCall(0).args[0]).to.equal('my-job');
    expect(backend.deleteJobExecution.getCall(0).args[1]).to.equal('exec-1');
  });

  it('errors with a clear message when OCAPI backend is active (no delete capability)', async () => {
    const command: any = await createCommand({}, {jobId: 'my-job', executionId: 'exec-1'});
    stubCommon(command, createOcapiBackend());

    try {
      await command.run();
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).to.match(/SCAPI/i);
    }
  });
});
