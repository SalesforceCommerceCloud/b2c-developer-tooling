/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import JobExport from '../../../src/commands/job/export.js';
import {JobExecutionError} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('job export', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>) {
    return createTestCommand(JobExport, hooks.getConfig(), flags, {});
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

  it('errors when no data units are provided', async () => {
    const command: any = await createCommand({output: './export'});
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

  it('errors on invalid --data-units json', async () => {
    const command: any = await createCommand({'data-units': '{not json'});
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

  it('calls export operation and passes derived dataUnits', async () => {
    const command: any = await createCommand({
      output: './export',
      'global-data': 'meta_data',
      timeout: 1,
      json: true,
    });
    const instance = stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const exportStub = sinon.stub().resolves({
      execution: {execution_status: 'finished', exit_status: {code: 'OK'}, duration: 1000} as any,
      archiveFilename: 'a.zip',
      archiveKept: false,
      localPath: './export/a.zip',
    });
    command.operations = {...command.operations, siteArchiveExportToPath: exportStub};

    const result = await command.run();

    expect(exportStub.calledOnce).to.equal(true);
    const args = exportStub.getCall(0).args;
    expect(args[0]).to.equal(instance);
    expect(args[2]).to.equal('./export');
    expect(result.archiveFilename).to.equal('a.zip');
  });

  it('returns early when before hooks skip', async () => {
    const command: any = await createCommand({'global-data': 'meta_data'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: true, skipReason: 'by plugin'});
    const exportStub = sinon.stub().rejects(new Error('Unexpected export'));
    command.operations = {...command.operations, siteArchiveExportToPath: exportStub};

    const result = await command.run();

    expect(exportStub.called).to.equal(false);
    expect(result.execution.exit_status.code).to.equal('skipped');
  });

  it('calls siteArchiveExport (not siteArchiveExportToPath) when --no-download is set', async () => {
    const command: any = await createCommand({
      output: './export',
      'global-data': 'meta_data',
      'no-download': true,
      json: true,
    });
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const exportStub = sinon.stub().resolves({
      execution: {execution_status: 'finished', exit_status: {code: 'OK'}} as any,
      archiveFilename: 'a.zip',
    });
    const exportToPathStub = sinon.stub().rejects(new Error('Should not be called'));
    command.operations = {
      ...command.operations,
      siteArchiveExport: exportStub,
      siteArchiveExportToPath: exportToPathStub,
    };

    await command.run();

    expect(exportStub.calledOnce).to.equal(true);
    expect(exportToPathStub.called).to.equal(false);
  });

  it('shows job log and errors on JobExecutionError when show-log is true', async () => {
    const command: any = await createCommand({'global-data': 'meta_data', json: true});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);
    sinon.stub(command, 'showJobLog').resolves(void 0);

    const exec: any = {execution_status: 'finished', exit_status: {code: 'ERROR'}};
    const error = new JobExecutionError('failed', exec);
    const exportStub = sinon.stub().rejects(error);
    command.operations = {...command.operations, siteArchiveExportToPath: exportStub};

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
