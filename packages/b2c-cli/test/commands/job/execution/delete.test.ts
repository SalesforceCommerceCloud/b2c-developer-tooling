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

  function stubCommon(
    command: any,
    opts: {client?: unknown; tenantId?: string; preference?: 'auto' | 'ocapi' | 'scapi'} = {},
  ) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', tenantId: opts.tenantId}}));
    sinon.stub(command, 'instance').get(() => ({config: {hostname: 'example.com'}}));
    sinon.stub(command, 'apiBackendPreference').get(() => opts.preference ?? 'auto');
    sinon.stub(command, 'buildScapiJobsClient').returns(opts.client);
  }

  it('calls scapiDeleteJobExecution when SCAPI is configured', async () => {
    const command: any = await createCommand({}, {jobId: 'my-job', executionId: 'exec-1'});
    // Provide a fake client that responds with no error from the openapi-fetch shape.
    const fakeClient = {
      DELETE: sinon.stub().resolves({error: undefined, response: {status: 204}}),
    };
    stubCommon(command, {client: fakeClient, tenantId: 'tenant_test'});

    await runSilent(() => command.run());

    expect(fakeClient.DELETE.calledOnce).to.equal(true);
    const call = fakeClient.DELETE.getCall(0);
    expect(call.args[0]).to.match(/executions\/\{executionId\}$/);
    expect(call.args[1].params.path.jobId).to.equal('my-job');
    expect(call.args[1].params.path.executionId).to.equal('exec-1');
  });

  it('errors when --api-backend ocapi is set', async () => {
    const command: any = await createCommand({}, {jobId: 'my-job', executionId: 'exec-1'});
    stubCommon(command, {client: {}, tenantId: 'tenant_test', preference: 'ocapi'});

    try {
      await command.run();
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).to.match(/SCAPI/i);
    }
  });

  it('errors when SCAPI is not configured', async () => {
    const command: any = await createCommand({}, {jobId: 'my-job', executionId: 'exec-1'});
    stubCommon(command, {client: undefined});

    try {
      await command.run();
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).to.match(/SCAPI/i);
    }
  });
});
