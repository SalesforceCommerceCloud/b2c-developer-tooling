/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import JobWait from '../../../src/commands/job/wait.js';
import {isolateConfig, restoreConfig} from '../../helpers/config-isolation.js';
import {stubParse} from '../../helpers/stub-parse.js';

describe('job wait', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    const command: any = new JobWait([], config);
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

  it('waits using wrapper without real polling', async () => {
    const command: any = await createCommand({'poll-interval': 1, json: true}, {jobId: 'my-job', executionId: 'e1'});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const waitStub = sinon.stub(command, 'waitForJob').resolves({id: 'e1', execution_status: 'finished'});

    const result = await command.run();

    expect(waitStub.calledOnce).to.equal(true);
    expect(result.id).to.equal('e1');
  });
});
