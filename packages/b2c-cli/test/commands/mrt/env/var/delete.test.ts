/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtEnvVarDelete from '../../../../../src/commands/mrt/env/var/delete.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../../helpers/stub-parse.js';

describe('mrt env var delete', () => {
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
    return new MrtEnvVarDelete([], config);
  }

  function stubErrorToThrow(command: any): sinon.SinonStub {
    return sinon.stub(command, 'error').throws(new Error('Expected error'));
  }

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

  it('calls command.error when project is missing', async () => {
    const command = createCommand();

    stubParse(command, {}, {key: 'MY_VAR'});
    await command.init();

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined, mrtEnvironment: 'staging'}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('calls command.error when environment is missing', async () => {
    const command = createCommand();

    stubParse(command, {}, {key: 'MY_VAR'});
    await command.init();

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: undefined}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('deletes env var via the backend wrapper', async () => {
    const command = createCommand();

    stubParse(command, {}, {key: 'MY_VAR'});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {
        mrtProject: 'my-project',
        mrtEnvironment: 'staging',
        mrtOrigin: 'https://example.com',
      },
    }));

    const delStub = sinon.stub().resolves({backend: 'legacy'});
    command.operations = {...command.operations, deleteEnvVarWithBackend: delStub};

    const result = await command.run();

    expect(delStub.calledOnce).to.equal(true);
    const [input] = delStub.firstCall.args;
    expect(input.preference).to.equal('auto');
    expect(input.projectSlug).to.equal('my-project');
    expect(input.environment).to.equal('staging');
    expect(input.key).to.equal('MY_VAR');
    expect(result.key).to.equal('MY_VAR');
    // The resolved backend is intentionally kept out of the --json payload so the
    // legacy --json output stays byte-identical (matches list / bundle deploy).
    expect(result).to.not.have.property('backend');
  });

  it('forwards the resolved SCAPI backend context to the wrapper', async () => {
    const command = createCommand();

    stubParse(command, {}, {key: 'MY_VAR'});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtBackend: 'scapi'},
    }));

    const delStub = sinon.stub().resolves({backend: 'scapi'});
    command.operations = {...command.operations, deleteEnvVarWithBackend: delStub};

    const result = await command.run();

    expect(delStub.calledOnce).to.equal(true);
    const [input] = delStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    expect(input.key).to.equal('MY_VAR');
    expect(result).to.not.have.property('backend');
  });

  it('blocks deletion in safe mode before touching the backend', async () => {
    const command = createCommand();

    stubParse(command, {}, {key: 'MY_VAR'});
    await command.init();

    const assertStub = sinon
      .stub(command, 'assertDestructiveOperationAllowed')
      .throws(new Error('destructive blocked'));
    const delStub = sinon.stub().resolves({backend: 'legacy'});
    command.operations = {...command.operations, deleteEnvVarWithBackend: delStub};

    try {
      await command.run();
      expect.fail('Expected error');
    } catch (error) {
      expect((error as Error).message).to.equal('destructive blocked');
    }
    expect(assertStub.calledOnce).to.equal(true);
    expect(delStub.called).to.equal(false);
  });

  it('emits no human progress under --json', async () => {
    const command = createCommand();

    stubParse(command, {}, {key: 'MY_VAR'});
    await command.init();

    // --json: the delete still happens, but the human success line is suppressed
    // so stdout carries only the JSON result (this.log routes through the logger
    // to stderr and would otherwise interleave).
    sinon.stub(command, 'jsonEnabled').returns(true);
    stubBackendContext(command);
    const logStub = sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));

    const delStub = sinon.stub().resolves({backend: 'legacy'});
    command.operations = {...command.operations, deleteEnvVarWithBackend: delStub};

    const result = await command.run();

    expect(delStub.calledOnce).to.equal(true);
    expect(logStub.called, 'no human progress under --json').to.equal(false);
    expect(result.key).to.equal('MY_VAR');
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
