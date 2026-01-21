/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import JobImport from '../../../src/commands/job/import.js';
import {JobExecutionError} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('job import', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(JobImport, hooks.getConfig(), flags, args);
  }

  function stubCommon(command: any) {
    const instance = {config: {hostname: 'example.com'}};
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'requireWebDavCredentials').returns(void 0);
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

  it('imports remote filename when --remote is set', async () => {
    const command: any = await createCommand({remote: true, json: true}, {target: 'a.zip'});
    const instance = stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const importStub = sinon.stub().resolves({
      execution: {execution_status: 'finished', exit_status: {code: 'OK'}} as any,
      archiveFilename: 'a.zip',
      archiveKept: false,
    });
    command.operations = {...command.operations, siteArchiveImport: importStub};

    await command.run();

    expect(importStub.calledOnce).to.equal(true);
    expect(importStub.getCall(0).args[0]).to.equal(instance);
    expect(importStub.getCall(0).args[1]).to.deep.equal({remoteFilename: 'a.zip'});
  });

  it('imports local target when --remote is not set', async () => {
    const command: any = await createCommand({json: true}, {target: './dir'});
    const instance = stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const importStub = sinon.stub().resolves({
      execution: {execution_status: 'finished', exit_status: {code: 'OK'}} as any,
      archiveFilename: 'a.zip',
      archiveKept: false,
    });
    command.operations = {...command.operations, siteArchiveImport: importStub};

    await command.run();

    expect(importStub.calledOnce).to.equal(true);
    expect(importStub.getCall(0).args[0]).to.equal(instance);
    expect(importStub.getCall(0).args[1]).to.equal('./dir');
  });

  it('returns early when before hooks skip', async () => {
    const command: any = await createCommand({json: true}, {target: './dir'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: true, skipReason: 'by plugin'});
    const importStub = sinon.stub().rejects(new Error('Unexpected import'));
    command.operations = {...command.operations, siteArchiveImport: importStub};

    const result = await command.run();

    expect(importStub.called).to.equal(false);
    expect(result.execution.exit_status.code).to.equal('skipped');
  });

  it('shows job log and errors on JobExecutionError when show-log is true', async () => {
    const command: any = await createCommand({json: true}, {target: './dir'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);
    sinon.stub(command, 'showJobLog').resolves(void 0);

    const exec: any = {execution_status: 'finished', exit_status: {code: 'ERROR'}};
    const error = new JobExecutionError('failed', exec);
    const importStub = sinon.stub().rejects(error);
    command.operations = {...command.operations, siteArchiveImport: importStub};

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
