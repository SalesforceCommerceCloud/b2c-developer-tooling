/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtEnvVarPush from '../../../../../src/commands/mrt/env/var/push.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../../helpers/stub-parse.js';

describe('mrt env var push', () => {
  let config: Config;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  function createCommand(): any {
    const command = new MrtEnvVarPush([], config);
    // Human progress goes through this.log (suppressed by oclif under --json);
    // stub it so tests don't leak output to the console.
    sinon.stub(command, 'log');
    return command;
  }

  /**
   * Stubs the resolved MRT backend context. `getMrtBackendContext()` reads
   * `resolvedConfig.hasMrtConfig()` and builds auth strategies, which the plain
   * `{values}` config stub can't satisfy — so we stub the resolver directly.
   */
  function stubBackendContext(
    command: any,
    ctx: {preference?: string; scapiConnection?: unknown; legacyAuth?: unknown} = {},
  ): void {
    sinon.stub(command, 'getMrtBackendContext').returns({
      preference: ctx.preference ?? 'auto',
      scapiConnection: ctx.scapiConnection,
      legacyAuth: 'legacyAuth' in ctx ? ctx.legacyAuth : {},
    } as any);
  }

  function stubResolvedConfig(command: any, project = 'my-project', environment = 'staging'): void {
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: project, mrtEnvironment: environment, mrtOrigin: 'https://example.com'},
    }));
  }

  function stubEnvFile(command: any, content: string): void {
    command.operations = {...command.operations, readEnvFile: sinon.stub().returns(content)};
  }

  /**
   * Wires the three backend-aware operations onto the command with a resolved
   * `backend` on the list result (which the writes are pinned to).
   */
  function stubOperations(
    command: any,
    opts: {
      backend?: 'legacy' | 'scapi';
      remote?: Array<{name: string; value: string}>;
      setBatch?: sinon.SinonStub;
      setOne?: sinon.SinonStub;
    } = {},
  ): {listStub: sinon.SinonStub; setBatchStub: sinon.SinonStub; setStub: sinon.SinonStub} {
    const backend = opts.backend ?? 'legacy';
    const listStub = sinon.stub().resolves({
      backend,
      count: opts.remote?.length ?? 0,
      variables: (opts.remote ?? []).map((v) => ({...v, backend})),
      raw: {},
    });
    const setBatchStub = opts.setBatch ?? sinon.stub().resolves({backend});
    const setStub = opts.setOne ?? sinon.stub().resolves({backend});
    command.operations = {
      ...command.operations,
      listEnvVarsWithBackend: listStub,
      setEnvVarsWithBackend: setBatchStub,
      setEnvVarWithBackend: setStub,
    };
    return {listStub, setBatchStub, setStub};
  }

  it('errors when env file is missing', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: false});
    await command.init();

    stubResolvedConfig(command);

    command.operations = {
      ...command.operations,
      readEnvFile: sinon.stub().throws(Object.assign(new Error('not found'), {code: 'ENOENT'})),
    };
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Expected error to be thrown');
    } catch {
      expect(errorStub.calledOnce).to.be.true;
      const msg: string = errorStub.firstCall.args[0];
      expect(msg).to.match(/not found|missing|does not exist/i);
    }
  });

  it('errors when MRT project is missing', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: false});
    await command.init();

    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: undefined, mrtEnvironment: 'staging'},
    }));
    stubEnvFile(command, 'PUBLIC__foo=bar\n');

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Expected error to be thrown');
    } catch {
      expect(errorStub.calledOnce).to.be.true;
    }
  });

  it('errors when MRT environment is missing', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: false});
    await command.init();

    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: undefined},
    }));
    stubEnvFile(command, 'PUBLIC__foo=bar\n');

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Expected error to be thrown');
    } catch {
      expect(errorStub.calledOnce).to.be.true;
    }
  });

  it('exits early when there is nothing to sync', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: false});
    await command.init();

    stubBackendContext(command);
    stubResolvedConfig(command);
    stubEnvFile(command, 'PUBLIC__foo=bar\n');

    const {listStub, setBatchStub, setStub} = stubOperations(command, {
      remote: [{name: 'PUBLIC__foo', value: 'bar'}],
    });

    await command.run();

    expect(listStub.calledOnce, 'remote env vars must be fetched to compute diff').to.be.true;
    expect(setBatchStub.called).to.be.false;
    expect(setStub.called).to.be.false;
  });

  it('calls the batch setter for changed variables when --yes is set', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: true});
    await command.init();

    stubBackendContext(command);
    stubResolvedConfig(command);
    stubEnvFile(command, 'PUBLIC__foo=new-val\nPUBLIC__bar=added\n');

    const {setBatchStub, setStub} = stubOperations(command, {
      remote: [{name: 'PUBLIC__foo', value: 'old-val'}],
    });

    await command.run();

    // Should use the batch setter, not individual writes
    expect(setBatchStub.calledOnce).to.be.true;
    expect(setStub.called).to.be.false;
    const vars = setBatchStub.firstCall.args[0].variables;
    expect(vars).to.have.property('PUBLIC__foo', 'new-val');
    expect(vars).to.have.property('PUBLIC__bar', 'added');
  });

  it('pins writes to the backend the read resolved to', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: true});
    await command.init();

    stubBackendContext(command, {preference: 'auto'});
    stubResolvedConfig(command);
    stubEnvFile(command, 'PUBLIC__foo=bar\n');

    // The read falls back to legacy under auto; writes must pin to legacy.
    const {setBatchStub} = stubOperations(command, {backend: 'legacy', remote: []});

    await command.run();

    expect(setBatchStub.calledOnce).to.be.true;
    expect(setBatchStub.firstCall.args[0].preference).to.equal('legacy');
  });

  it('does not push excluded prefix variables', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: true});
    await command.init();

    stubBackendContext(command);
    stubResolvedConfig(command);
    stubEnvFile(command, 'PUBLIC__foo=bar\nMRT_PROJECT=my-project\n');

    const {setBatchStub, setStub} = stubOperations(command, {remote: []});

    await command.run();

    // MRT_PROJECT should be excluded; only PUBLIC__foo should be set via batch
    expect(setBatchStub.calledOnce).to.be.true;
    expect(setStub.called).to.be.false;
    const vars = setBatchStub.firstCall.args[0].variables;
    expect(vars).to.have.property('PUBLIC__foo', 'bar');
    expect(vars).to.not.have.property('MRT_PROJECT');
  });

  it('falls back to individual writes when the legacy batch fails', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: true});
    await command.init();

    stubBackendContext(command);
    stubResolvedConfig(command);
    stubEnvFile(command, 'GOOD_VAR=ok\nBAD_VAR=fail\n');

    sinon.stub(command, 'warn').returns(void 0);

    const {setBatchStub, setStub} = stubOperations(command, {
      backend: 'legacy',
      remote: [],
      setBatch: sinon.stub().rejects(new Error('batch API error')),
    });

    await command.run();

    // Batch tried once, then fallback to individual calls
    expect(setBatchStub.calledOnce).to.be.true;
    expect(setStub.callCount).to.equal(2);
  });

  it('reports per-variable failures and continues when falling back from a legacy batch', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: true});
    await command.init();

    stubBackendContext(command);
    stubResolvedConfig(command);
    stubEnvFile(command, 'GOOD_VAR=ok\nBAD_VAR=fail\n');
    const warnStub = sinon.stub(command, 'warn').returns(void 0);

    const {setStub} = stubOperations(command, {
      backend: 'legacy',
      remote: [],
      setBatch: sinon.stub().rejects(new Error('batch API error')),
      setOne: sinon.stub().onFirstCall().resolves({backend: 'legacy'}).onSecondCall().rejects(new Error('API error')),
    });

    // Should not throw even if one var fails
    await command.run();

    expect(setStub.callCount).to.equal(2);
    const warnMessages = warnStub.getCalls().map((c: any) => c.args[0]);
    expect(warnMessages.join(' ')).to.match(/fail|error/i);
  });

  it('does not retry per-key when a SCAPI batch fails (single merge-PATCH)', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: true});
    await command.init();

    stubBackendContext(command, {preference: 'scapi'});
    stubResolvedConfig(command);
    stubEnvFile(command, 'GOOD_VAR=ok\nBAD_VAR=fail\n');
    const warnStub = sinon.stub(command, 'warn').returns(void 0);

    const {setBatchStub, setStub} = stubOperations(command, {
      backend: 'scapi',
      remote: [],
      setBatch: sinon.stub().rejects(new Error('403 missing scope')),
    });

    const result = await command.run();

    expect(setBatchStub.calledOnce).to.be.true;
    // SCAPI applies a single merge-PATCH; no per-key retry.
    expect(setStub.called).to.be.false;
    expect(result.failed).to.equal(2);
    expect(result.pushed).to.equal(0);
    const warnMessages = warnStub.getCalls().map((c: any) => c.args[0]);
    expect(warnMessages.join(' ')).to.match(/missing scope/i);
  });

  it('skips confirmation prompt when --yes flag is set', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: true});
    await command.init();

    stubBackendContext(command);
    stubResolvedConfig(command);
    stubEnvFile(command, 'NEW_VAR=value\n');

    const {setBatchStub, setStub} = stubOperations(command, {remote: []});

    // If prompt were called it would hang; --yes should skip it
    await command.run();

    expect(setBatchStub.calledOnce).to.be.true;
    expect(setStub.called).to.be.false;
  });

  it('requires --yes under --json instead of prompting', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: false});
    await command.init();

    // --json makes the command non-interactive: it must error (not prompt or
    // hang) when confirmation would be needed, and never touch the backend.
    sinon.stub(command, 'jsonEnabled').returns(true);
    stubBackendContext(command);
    stubResolvedConfig(command);
    stubEnvFile(command, 'NEW_VAR=value\n');

    const {setBatchStub, setStub} = stubOperations(command, {remote: []});
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Expected error to be thrown');
    } catch {
      expect(errorStub.calledOnce).to.be.true;
      expect(errorStub.firstCall.args[0]).to.match(/--yes/i);
    }

    // No write should have been attempted.
    expect(setBatchStub.called).to.be.false;
    expect(setStub.called).to.be.false;
  });

  it('emits no human progress under --json (with --yes)', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: true});
    await command.init();

    // --json + --yes: the push still happens, but every progress line (fetch
    // notice, diff summary, per-var ticks, final summary) is suppressed so
    // stdout carries only the JSON result.
    sinon.stub(command, 'jsonEnabled').returns(true);
    stubBackendContext(command);
    stubResolvedConfig(command);
    stubEnvFile(command, 'NEW_VAR=value\n');

    const {setBatchStub} = stubOperations(command, {remote: []});

    const result = await command.run();

    expect(setBatchStub.calledOnce).to.be.true;
    expect((command.log as sinon.SinonStub).called, 'no human progress under --json').to.be.false;
    expect(result.pushed).to.equal(1);
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
