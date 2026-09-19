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

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>, argv: string[] = []) {
    return createTestCommand(JobImport, hooks.getConfig(), flags, args, argv);
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

  it('passes wait:false to siteArchiveImport when --no-wait is set', async () => {
    const command: any = await createCommand({wait: false, json: true}, {target: './dir'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const importStub = sinon.stub().resolves({
      execution: {id: 'exec-1', execution_status: 'running'} as any,
      archiveFilename: 'import-123.zip',
      archiveKept: true,
    });
    command.operations = {...command.operations, siteArchiveImport: importStub};

    const result = await command.run();

    expect(importStub.calledOnce).to.equal(true);
    const options = importStub.getCall(0).args[2];
    expect(options.wait).to.equal(false);
    expect(result.execution.execution_status).to.equal('running');
  });

  it('passes wait:true to siteArchiveImport by default', async () => {
    const command: any = await createCommand({wait: true, json: true}, {target: './dir'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const importStub = sinon.stub().resolves({
      execution: {execution_status: 'finished', exit_status: {code: 'OK'}} as any,
      archiveFilename: 'a.zip',
      archiveKept: false,
    });
    command.operations = {...command.operations, siteArchiveImport: importStub};

    await command.run();

    const options = importStub.getCall(0).args[2];
    expect(options.wait).to.equal(true);
  });

  it('polls for a delayed storefront setup execution after a successful import', async () => {
    const command: any = await createCommand(
      {wait: true, 'wait-for-storefront': true, 'poll-interval': 1, json: true},
      {target: './dir'},
    );
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const importResult = {
      execution: {execution_status: 'finished', exit_status: {code: 'OK'}} as any,
      archiveFilename: 'a.zip',
      archiveKept: false,
    };
    const importStub = sinon.stub().resolves(importResult);
    const searchStub = sinon.stub();
    searchStub.onCall(0).resolves({total: 1, count: 1, start: 0, hits: [{id: 'old-exec'}]});
    searchStub.onCall(1).resolves({total: 1, count: 1, start: 0, hits: [{id: 'old-exec'}]});
    searchStub.onCall(2).resolves({
      total: 2,
      count: 2,
      start: 0,
      hits: [{id: 'storefront-exec', execution_status: 'running'}, {id: 'old-exec'}],
    });
    const storefrontExecution = {
      id: 'storefront-exec',
      execution_status: 'finished',
      exit_status: {code: 'OK'},
    };
    const waitStub = sinon.stub().resolves(storefrontExecution);
    const backend = {searchJobExecutions: searchStub, waitForJob: waitStub};
    const sleepStub = sinon.stub().resolves(void 0);
    const getLogStub = sinon.stub().rejects(new Error('Unexpected log download'));
    command.operations = {
      ...command.operations,
      getJobLog: getLogStub,
      createJobsCompatibilityBackend: sinon.stub().returns(backend),
      siteArchiveImport: importStub,
      sleep: sleepStub,
    };

    const result = await command.run();

    expect(searchStub.callCount).to.equal(3);
    expect(sleepStub.calledOnceWith(2000)).to.equal(true);
    expect(waitStub.calledOnce).to.equal(true);
    expect(waitStub.getCall(0).args.slice(0, 2)).to.deep.equal([
      'sfcc-post-import-setup-storefront',
      'storefront-exec',
    ]);
    expect(result).to.deep.equal({importResult, storefrontSetupExecution: storefrontExecution});
    expect(getLogStub.called).to.equal(false);
  });

  it('does not poll for storefront setup when the import fails', async () => {
    const command: any = await createCommand({wait: true, 'wait-for-storefront': true, json: true}, {target: './dir'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);
    sinon.stub(command, 'showJobLog').resolves(void 0);

    const searchStub = sinon.stub().resolves({total: 0, count: 0, start: 0, hits: []});
    const backend = {searchJobExecutions: searchStub, waitForJob: sinon.stub()};
    const failedExecution: any = {execution_status: 'finished', exit_status: {code: 'ERROR'}};
    command.operations = {
      ...command.operations,
      createJobsCompatibilityBackend: sinon.stub().returns(backend),
      siteArchiveImport: sinon.stub().rejects(new JobExecutionError('failed', failedExecution)),
    };
    sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    // One pre-import snapshot only; delayed-execution polling never starts.
    expect(searchStub.calledOnce).to.equal(true);
    expect(backend.waitForJob.called).to.equal(false);
  });

  it('stops storefront setup discovery after the bounded polling window', async () => {
    const command: any = await createCommand({wait: true, 'wait-for-storefront': true, json: true}, {target: './dir'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const importStub = sinon.stub().resolves({
      execution: {execution_status: 'finished', exit_status: {code: 'OK'}} as any,
      archiveFilename: 'a.zip',
      archiveKept: false,
    });
    const searchStub = sinon.stub().resolves({total: 1, count: 1, start: 0, hits: [{id: 'old-exec'}]});
    const backend = {searchJobExecutions: searchStub, waitForJob: sinon.stub()};
    const sleepStub = sinon.stub().resolves(void 0);
    command.operations = {
      ...command.operations,
      createJobsCompatibilityBackend: sinon.stub().returns(backend),
      siteArchiveImport: importStub,
      sleep: sleepStub,
    };
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    // One snapshot plus 31 discovery searches (0 through 60 seconds).
    expect(searchStub.callCount).to.equal(32);
    expect(sleepStub.callCount).to.equal(30);
    expect(backend.waitForJob.called).to.equal(false);
    expect(errorStub.firstCall.args[0]).to.match(/did not start within 60 seconds/);
  });

  for (const scenario of [
    'data errors',
    'clean log',
    'unavailable log',
    'missing log',
    'logging disabled',
    'split import',
  ]) {
    it(`preserves the discovery timeout with ${scenario}`, async () => {
      const command: any = await createCommand(
        {
          wait: true,
          'wait-for-storefront': true,
          'show-log': scenario !== 'logging disabled',
          split: scenario === 'split import',
          json: true,
        },
        {target: './dir'},
      );
      const instance = stubCommon(command);
      sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
      sinon.stub(command, 'runAfterHooks').resolves();
      const result = {
        execution: {
          id: 'import-1',
          execution_status: 'finished',
          exit_status: {code: 'OK'},
          is_log_file_existing: scenario !== 'missing log',
          log_file_path: '/Sites/LOGS/import.log',
        },
        archiveFilename: 'a.zip',
        archiveKept: false,
      };
      const dataError = "[DATAERROR] [3/43] null: ecomSiteId 'RefArch' is already used, skipping element.";
      const getLogStub = sinon
        .stub()
        .resolves(
          scenario === 'clean log'
            ? 'Import completed OK'
            : `INFO Starting import\r\nWARN ${dataError}\r\nDataErrorCount: 1`,
        );
      if (scenario === 'unavailable log') getLogStub.rejects(new Error('WebDAV unavailable'));
      command.operations = {
        ...command.operations,
        createJobsCompatibilityBackend: sinon.stub().returns({searchJobExecutions: sinon.stub().resolves({hits: []})}),
        siteArchiveImport: sinon.stub().resolves(result),
        siteArchiveImportSplit: sinon
          .stub()
          .resolves([result, {...result, execution: {...result.execution, id: 'import-2'}}]),
        sleep: sinon.stub().resolves(),
        getJobLog: getLogStub,
      };
      let failure: Error | undefined;
      try {
        await command.run();
      } catch (error) {
        failure = error as Error;
      }
      expect(failure?.message).to.include('did not start within 60 seconds');
      if (scenario === 'data errors' || scenario === 'split import') {
        expect(failure?.message).to.include(`Import execution import-1 data errors:\n${dataError}`);
        expect(failure?.message).not.to.include('INFO Starting import');
        expect(getLogStub.firstCall.args).to.deep.equal([instance, result.execution]);
        if (scenario === 'split import') expect(failure?.message).to.include('Import execution import-2 data errors:');
      } else {
        expect(failure?.message).not.to.include('[DATAERROR]');
      }
      expect(getLogStub.callCount).to.equal(
        scenario === 'missing log' || scenario === 'logging disabled' ? 0 : scenario === 'split import' ? 2 : 1,
      );
    });
  }

  it('rejects --wait-for-storefront with --no-wait', async () => {
    const command: any = await createCommand({wait: false, 'wait-for-storefront': true, json: true}, {target: './dir'});
    stubCommon(command);

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    expect(errorStub.calledOnce).to.equal(true);
    expect(errorStub.firstCall.args[0]).to.match(/--wait-for-storefront requires --wait/);
  });

  it('forwards extra positionals as paths to siteArchiveImport', async () => {
    const command: any = await createCommand({json: true}, {target: './my-site-data'}, [
      './my-site-data',
      'sites/RefArch',
      'libraries/mylib',
    ]);
    stubCommon(command);

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
    const options = importStub.getCall(0).args[2];
    expect(options.paths).to.deep.equal(['sites/RefArch', 'libraries/mylib']);
  });

  it('does not pass paths option when no extra positionals are given', async () => {
    const command: any = await createCommand({json: true}, {target: './dir'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const importStub = sinon.stub().resolves({
      execution: {execution_status: 'finished', exit_status: {code: 'OK'}} as any,
      archiveFilename: 'a.zip',
      archiveKept: false,
    });
    command.operations = {...command.operations, siteArchiveImport: importStub};

    await command.run();

    const options = importStub.getCall(0).args[2];
    expect(options.paths).to.equal(undefined);
  });

  it('errors when extra positionals are combined with --remote', async () => {
    const command: any = await createCommand({remote: true, json: true}, {target: 'a.zip'}, ['a.zip', 'sites/RefArch']);
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});

    const importStub = sinon.stub().rejects(new Error('Should not be called'));
    command.operations = {...command.operations, siteArchiveImport: importStub};

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    expect(errorStub.called).to.equal(true);
    expect(importStub.called).to.equal(false);
  });

  it('shows job log and errors on JobExecutionError when show-log is true', async () => {
    const command: any = await createCommand({json: true}, {target: './dir'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);
    const showLogStub = sinon.stub(command, 'showJobLog').resolves(void 0);

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
    expect(showLogStub.calledOnceWith(exec)).to.equal(true);
  });

  it('calls siteArchiveImportSplit with parsed max-size when --split is set', async () => {
    const command: any = await createCommand(
      {split: true, 'max-size': '150mb', wait: true, json: true},
      {target: './big'},
    );
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const splitStub = sinon.stub().resolves([
      {
        execution: {execution_status: 'finished', exit_status: {code: 'OK'}} as any,
        archiveFilename: 'big-xml.zip',
        archiveKept: false,
      },
      {
        execution: {execution_status: 'finished', exit_status: {code: 'OK'}} as any,
        archiveFilename: 'big-assets-1.zip',
        archiveKept: false,
      },
    ]);
    const importStub = sinon.stub().rejects(new Error('plain import should not be called'));
    command.operations = {...command.operations, siteArchiveImport: importStub, siteArchiveImportSplit: splitStub};

    const result = await command.run();

    expect(splitStub.calledOnce).to.equal(true);
    expect(importStub.called).to.equal(false);
    expect(splitStub.getCall(0).args[1]).to.equal('./big');
    expect(splitStub.getCall(0).args[2].maxBytes).to.equal(150 * 1024 * 1024);
    expect(result).to.have.lengthOf(2);
  });

  it('parses a bare --max-size number as MiB', async () => {
    const command: any = await createCommand(
      {split: true, 'max-size': '128', wait: true, json: true},
      {target: './big'},
    );
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const splitStub = sinon.stub().resolves([
      {
        execution: {execution_status: 'finished', exit_status: {code: 'OK'}} as any,
        archiveFilename: 'big-xml.zip',
        archiveKept: false,
      },
    ]);
    command.operations = {...command.operations, siteArchiveImportSplit: splitStub};

    await command.run();

    expect(splitStub.getCall(0).args[2].maxBytes).to.equal(128 * 1024 * 1024);
  });

  it('errors when --split is combined with --remote', async () => {
    const command: any = await createCommand({split: true, remote: true, wait: true, json: true}, {target: 'a.zip'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    expect(errorStub.called).to.equal(true);
    expect(errorStub.getCall(0).args[0]).to.match(/--split is not supported with --remote/);
  });

  it('errors on an invalid --max-size value', async () => {
    const command: any = await createCommand(
      {split: true, 'max-size': 'huge', wait: true, json: true},
      {target: './big'},
    );
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    expect(errorStub.called).to.equal(true);
    expect(errorStub.getCall(0).args[0]).to.match(/Invalid size/);
  });

  it('passes an onOversize callback that warns and recommends --split', async () => {
    const command: any = await createCommand({json: false}, {target: './dir'});
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);
    const warnStub = sinon.stub(command, 'warn').returns(void 0);

    const importStub = sinon.stub().callsFake(async (_instance: any, _target: any, options: any) => {
      // Simulate the SDK detecting an oversized archive.
      options.onOversize({bytes: 200 * 1024 * 1024, maxBytes: 190 * 1024 * 1024});
      return {
        execution: {execution_status: 'finished', exit_status: {code: 'OK'}} as any,
        archiveFilename: 'a.zip',
        archiveKept: false,
      };
    });
    command.operations = {...command.operations, siteArchiveImport: importStub};

    await command.run();

    expect(importStub.getCall(0).args[2].maxBytes).to.equal(190 * 1024 * 1024);
    expect(warnStub.called).to.equal(true);
    expect(warnStub.getCall(0).args[0]).to.match(/--split/);
  });
});
