/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sinon from 'sinon';
import {JobExecutionError} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import JobImportSet from '../../../src/commands/job/import-set.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('job import-set', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(JobImportSet, hooks.getConfig(), flags, args);
  }

  function stubCommon(command: any) {
    const instance = {config: {hostname: 'example.com'}};
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'requireWebDavCredentials').returns(void 0);
    sinon.stub(command, 'instance').get(() => instance);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'warn').returns(void 0);
    sinon.stub(command, 'createContext').callsFake((...arguments_: unknown[]) => {
      const [operationType, metadata] = arguments_ as [string, Record<string, unknown>];
      return {
        operationType,
        metadata,
        startTime: Date.now(),
      };
    });
    return instance;
  }

  function result(overrides: Record<string, unknown> = {}) {
    return {
      setId: 'storefront-data',
      directory: './impex',
      dryRun: false,
      runId: 'run-1',
      items: [],
      imported: 2,
      skipped: 1,
      pending: 0,
      ...overrides,
    };
  }

  it('forwards import-set, lock, and job options to the SDK operation', async () => {
    const command: any = await createCommand(
      {
        json: true,
        'set-id': 'storefront-data',
        'keep-archive': true,
        'cartridge-metadata': false,
        'import-set-exclude': ['fixtures', 'test/integration'],
        'break-lock': true,
        'stale-lock-seconds': 900,
        'lock-poll-interval': 5,
        'project-directory': './workspace',
        timeout: 600,
        'poll-interval': 2,
      },
      {directory: './impex'},
    );
    const instance = stubCommon(command);
    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);
    const importSetStub = sinon.stub().resolves(result());
    command.operations = {siteArchiveImportSet: importSetStub};

    const output = await command.run();

    expect(output.imported).to.equal(2);
    expect(importSetStub.calledOnce).to.equal(true);
    expect(importSetStub.getCall(0).args[0]).to.equal(instance);
    expect(importSetStub.getCall(0).args[1]).to.equal('./impex');
    const options = importSetStub.getCall(0).args[2];
    expect(options).to.include({
      setId: 'storefront-data',
      keepArchive: true,
      includeCartridgeMetadata: false,
      cartridgeRoot: './workspace',
      breakLock: true,
      staleLockSeconds: 900,
      lockPollIntervalSeconds: 5,
    });
    expect(options.excludeDirectories).to.deep.equal(['fixtures', 'test/integration']);
    expect(options.waitOptions).to.include({timeoutSeconds: 600, pollIntervalSeconds: 2});
  });

  it('uses the migrations directory when no directory is provided', async () => {
    const command: any = await createCommand({json: true}, {});
    const instance = stubCommon(command);
    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);
    const importSetStub = sinon.stub().resolves(result({directory: './migrations'}));
    command.operations = {siteArchiveImportSet: importSetStub};

    await command.run();

    expect(importSetStub.calledOnceWith(instance, './migrations', sinon.match.object)).to.equal(true);
    expect(importSetStub.firstCall.args[2].setId).to.equal('migrations');
    expect(importSetStub.firstCall.args[2].includeCartridgeMetadata).to.equal(true);
  });

  it('uses project import-set exclusions from package.json', async () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-import-set-config-'));
    fs.writeFileSync(
      path.join(projectRoot, 'package.json'),
      JSON.stringify({b2c: {importSetExclude: ['fixtures', 'test/integration']}}),
    );

    try {
      const command: any = await createCommand({json: true, 'project-directory': projectRoot}, {});
      const instance = stubCommon(command);
      sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
      sinon.stub(command, 'runAfterHooks').resolves(void 0);
      const importSetStub = sinon.stub().resolves(result({directory: './migrations'}));
      command.operations = {siteArchiveImportSet: importSetStub};

      await command.run();

      expect(importSetStub.firstCall.args[0]).to.equal(instance);
      expect(importSetStub.firstCall.args[2].excludeDirectories).to.deep.equal(['fixtures', 'test/integration']);
    } finally {
      fs.rmSync(projectRoot, {recursive: true, force: true});
    }
  });

  it('returns without importing when a lifecycle hook skips the operation', async () => {
    const command: any = await createCommand({json: true}, {directory: './impex'});
    stubCommon(command);
    sinon.stub(command, 'runBeforeHooks').resolves({skip: true, skipReason: 'deployment policy'});
    const importSetStub = sinon.stub().rejects(new Error('Unexpected import'));
    command.operations = {siteArchiveImportSet: importSetStub};

    const output = await command.run();

    expect(importSetStub.called).to.equal(false);
    expect(output.runId).to.equal('skipped');
  });

  it('prints post-import notes for imported items after a run', async () => {
    const command: any = await createCommand({}, {directory: './impex'});
    const importedTarget = path.join(process.cwd(), 'cartridges', 'app_example', 'metadata');
    stubCommon(command);
    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);
    command.operations = {
      siteArchiveImportSet: sinon.stub().resolves(
        result({
          items: [
            {
              id: 'cartridge-metadata/app_example',
              target: importedTarget,
              kind: 'directory',
              status: 'imported',
              note: 'Enable the preference in BM.',
            },
            {
              id: 'b-sites',
              target: path.join(process.cwd(), 'impex', 'b-sites'),
              kind: 'directory',
              status: 'skipped',
              note: 'Should not be shown.',
            },
            {
              id: 'c-catalog',
              target: path.join(process.cwd(), 'impex', 'c-catalog'),
              kind: 'directory',
              status: 'imported',
            },
          ],
        }),
      ),
    };

    await command.run();

    const logged = command.log.getCalls().map((call: any) => call.args[0]);
    expect(logged.some((line: string) => line?.includes('Post-import notes:'))).to.equal(true);
    expect(logged.some((line: string) => line?.includes('cartridges/app_example/metadata'))).to.equal(true);
    expect(logged.some((line: string) => line?.includes('cartridge-metadata/app_example'))).to.equal(false);
    expect(logged.some((line: string) => line?.includes('Enable the preference in BM.'))).to.equal(true);
    expect(logged.some((line: string) => line?.includes('Should not be shown.'))).to.equal(false);
  });

  it('previews notes for pending items during a dry run', async () => {
    const command: any = await createCommand({'dry-run': true}, {directory: './impex'});
    const pendingTarget = path.join(process.cwd(), 'impex', 'a-metadata');
    stubCommon(command);
    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);
    command.operations = {
      siteArchiveImportSet: sinon.stub().resolves(
        result({
          dryRun: true,
          imported: 0,
          skipped: 0,
          pending: 1,
          items: [
            {
              id: 'a-metadata',
              target: pendingTarget,
              kind: 'directory',
              status: 'pending',
              note: 'Manual follow-up here.',
            },
          ],
        }),
      ),
    };

    await command.run();

    const logged = command.log.getCalls().map((call: any) => call.args[0]);
    expect(logged.some((line: string) => line?.includes('Post-import notes (preview):'))).to.equal(true);
    expect(logged.some((line: string) => line?.includes('Manual follow-up here.'))).to.equal(true);
  });

  it('shows the platform job log when an item import fails', async () => {
    const command: any = await createCommand({json: true, 'show-log': true}, {directory: './impex'});
    stubCommon(command);
    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);
    const execution: any = {id: 'execution-1', execution_status: 'finished', exit_status: {code: 'ERROR'}};
    command.operations = {
      siteArchiveImportSet: sinon.stub().rejects(new JobExecutionError('Import failed', execution)),
    };
    const showLogStub = sinon.stub(command, 'showJobLog').resolves(void 0);
    sinon.stub(command, 'error').throws(new Error('Expected command error'));

    try {
      await command.run();
      expect.fail('Expected command error');
    } catch {
      // Expected.
    }

    expect(showLogStub.calledOnceWith(execution)).to.equal(true);
  });

  it('shows the filesystem source instead of the internal item ID', async () => {
    const command: any = await createCommand({}, {directory: './impex'});
    stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(false);
    const source = path.join(process.cwd(), 'cartridges', 'int_example', 'metadata', 'seed-data');

    command.handleEvent({
      type: 'item-importing',
      item: {id: 'cartridge-metadata/int_example/seed-data', target: source, kind: 'directory'},
      index: 1,
      total: 1,
    });

    expect(command.log.calledOnceWith('  1/1 importing  cartridges/int_example/metadata/seed-data')).to.equal(true);
  });

  it('shows the target hostname in the import plan', async () => {
    const command: any = await createCommand({}, {directory: './impex'});
    stubCommon(command);
    sinon.stub(command, 'jsonEnabled').returns(false);

    command.handleEvent({type: 'plan', setId: 'migrations', total: 2, pending: 1, skipped: 1, dryRun: false});

    expect(command.log.firstCall.calledWithExactly('Import set migrations on example.com:')).to.equal(true);
    expect(command.log.secondCall.calledWithExactly('  2 item(s), 1 pending, 1 already applied')).to.equal(true);
  });
});
