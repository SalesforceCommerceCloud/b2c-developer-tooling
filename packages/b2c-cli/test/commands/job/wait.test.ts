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

describe('job wait', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(JobWait, hooks.getConfig(), flags, args);
  }

  it('waits using wrapper without real polling', async () => {
    const command: any = await createCommand({'poll-interval': 1, json: true}, {jobId: 'my-job', executionId: 'e1'});

    const instance = {config: {hostname: 'example.com'}};

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'instance').get(() => instance);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const waitStub = sinon.stub().resolves({id: 'e1', execution_status: 'finished'});
    command.operations = {...command.operations, waitForJob: waitStub};

    const result = await command.run();

    expect(waitStub.calledOnce).to.equal(true);
    expect(waitStub.getCall(0).args[0]).to.equal(instance);
    expect(result.id).to.equal('e1');
  });
});
