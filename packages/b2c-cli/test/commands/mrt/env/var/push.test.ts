/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config, ux} from '@oclif/core';
import MrtEnvVarPush from '../../../../../src/commands/mrt/env/var/push.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../../helpers/stub-parse.js';

describe('mrt env var push', () => {
  let config: Config;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    sinon.stub(ux, 'stdout');
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  function createCommand(): any {
    return new MrtEnvVarPush([], config);
  }

  function stubCommonAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
  }

  function stubResolvedConfig(command: any, project = 'my-project', environment = 'staging'): void {
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: project, mrtEnvironment: environment, mrtOrigin: 'https://example.com'},
    }));
  }

  function stubEnvFile(command: any, content: string): void {
    command.operations = {...command.operations, readEnvFile: sinon.stub().returns(content)};
  }

  it('errors when env file is missing', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: false});
    await command.init();

    stubCommonAuth(command);
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

    stubCommonAuth(command);
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

    stubCommonAuth(command);
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

    stubCommonAuth(command);
    stubResolvedConfig(command);
    stubEnvFile(command, 'PUBLIC__foo=bar\n');

    const listStub = sinon.stub().resolves({variables: [{name: 'PUBLIC__foo', value: 'bar'}]} as any);
    const setBatchStub = sinon.stub().resolves(void 0);
    const setStub = sinon.stub().resolves(void 0);
    command.operations = {...command.operations, listEnvVars: listStub, setEnvVars: setBatchStub, setEnvVar: setStub};

    await command.run();

    expect(setBatchStub.called).to.be.false;
    expect(setStub.called).to.be.false;
  });

  it('calls setEnvVars (batch) for changed variables when --yes is set', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: true});
    await command.init();

    stubCommonAuth(command);
    stubResolvedConfig(command);
    stubEnvFile(command, 'PUBLIC__foo=new-val\nPUBLIC__bar=added\n');

    const listStub = sinon.stub().resolves({variables: [{name: 'PUBLIC__foo', value: 'old-val'}]} as any);
    const setBatchStub = sinon.stub().resolves(void 0);
    const setStub = sinon.stub().resolves(void 0);
    command.operations = {...command.operations, listEnvVars: listStub, setEnvVars: setBatchStub, setEnvVar: setStub};

    await command.run();

    // Should use batch setEnvVars, not individual setEnvVar
    expect(setBatchStub.calledOnce).to.be.true;
    expect(setStub.called).to.be.false;
    const vars = setBatchStub.firstCall.args[0].variables;
    expect(vars).to.have.property('PUBLIC__foo', 'new-val');
    expect(vars).to.have.property('PUBLIC__bar', 'added');
  });

  it('does not call setEnvVars for excluded prefix variables', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: true});
    await command.init();

    stubCommonAuth(command);
    stubResolvedConfig(command);
    stubEnvFile(command, 'PUBLIC__foo=bar\nMRT_PROJECT=my-project\n');

    const listStub = sinon.stub().resolves({variables: []} as any);
    const setBatchStub = sinon.stub().resolves(void 0);
    const setStub = sinon.stub().resolves(void 0);
    command.operations = {...command.operations, listEnvVars: listStub, setEnvVars: setBatchStub, setEnvVar: setStub};

    await command.run();

    // MRT_PROJECT should be excluded; only PUBLIC__foo should be set via batch
    expect(setBatchStub.calledOnce).to.be.true;
    expect(setStub.called).to.be.false;
    const vars = setBatchStub.firstCall.args[0].variables;
    expect(vars).to.have.property('PUBLIC__foo', 'bar');
    expect(vars).to.not.have.property('MRT_PROJECT');
  });

  it('falls back to individual setEnvVar calls when setEnvVars batch fails', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: true});
    await command.init();

    stubCommonAuth(command);
    stubResolvedConfig(command);
    stubEnvFile(command, 'GOOD_VAR=ok\nBAD_VAR=fail\n');

    sinon.stub(command, 'warn').returns(void 0);

    const listStub = sinon.stub().resolves({variables: []} as any);
    const setBatchStub = sinon.stub().rejects(new Error('batch API error'));
    const setStub = sinon.stub().resolves(void 0);
    command.operations = {...command.operations, listEnvVars: listStub, setEnvVars: setBatchStub, setEnvVar: setStub};

    await command.run();

    // Batch should be tried once, then fallback to individual calls
    expect(setBatchStub.calledOnce).to.be.true;
    expect(setStub.callCount).to.equal(2);
  });

  it('reports per-variable failures and continues when falling back from batch', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: true});
    await command.init();

    stubCommonAuth(command);
    stubResolvedConfig(command);
    stubEnvFile(command, 'GOOD_VAR=ok\nBAD_VAR=fail\n');
    const warnStub = sinon.stub(command, 'warn').returns(void 0);

    const listStub = sinon.stub().resolves({variables: []} as any);
    const setBatchStub = sinon.stub().rejects(new Error('batch API error'));
    const setStub = sinon
      .stub()
      .onFirstCall()
      .resolves(void 0)
      .onSecondCall()
      .rejects(new Error('API error'));
    command.operations = {...command.operations, listEnvVars: listStub, setEnvVars: setBatchStub, setEnvVar: setStub};

    // Should not throw even if one var fails
    await command.run();

    expect(setStub.callCount).to.equal(2);
    // Failure should be logged as a warning
    const warnMessages = warnStub.getCalls().map((c: any) => c.args[0]);
    expect(warnMessages.join(' ')).to.match(/fail|error/i);
  });

  it('skips confirmation prompt when --yes flag is set', async () => {
    const command = createCommand();
    stubParse(command, {file: '.env', 'exclude-prefix': ['MRT_'], yes: true});
    await command.init();

    stubCommonAuth(command);
    stubResolvedConfig(command);
    stubEnvFile(command, 'NEW_VAR=value\n');

    const listStub = sinon.stub().resolves({variables: []} as any);
    const setBatchStub = sinon.stub().resolves(void 0);
    const setStub = sinon.stub().resolves(void 0);
    command.operations = {...command.operations, listEnvVars: listStub, setEnvVars: setBatchStub, setEnvVar: setStub};

    // If prompt were called it would hang; --yes should skip it
    await command.run();

    expect(setBatchStub.calledOnce).to.be.true;
    expect(setStub.called).to.be.false;
  });
});
