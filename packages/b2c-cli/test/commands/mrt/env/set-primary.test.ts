/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtEnvSetPrimary from '../../../../src/commands/mrt/env/set-primary.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt env set-primary', () => {
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
    return new MrtEnvSetPrimary([], config);
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

    stubParse(command, {}, {environment: 'staging'});
    await command.init();

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined, mrtEnvironment: 'staging'}}));

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('sets the primary environment via the SCAPI backend and returns raw under --json', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', 'mrt-backend': 'scapi'}, {environment: 'staging'});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtBackend: 'scapi'}}));

    const setPrimaryStub = sinon.stub().resolves({
      backend: 'scapi',
      environment: {id: 'staging', name: 'Staging', status: 'ready', isPrimary: true, backend: 'scapi'},
      raw: {environmentId: 'staging', displayName: 'Staging', isPrimary: true},
    } as any);
    command.operations = {...command.operations, setPrimaryEnvironmentWithBackend: setPrimaryStub};

    const result = await command.run();

    expect(setPrimaryStub.calledOnce).to.equal(true);
    const [input] = setPrimaryStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    expect(input.projectSlug).to.equal('my-project');
    expect(input.environment).to.equal('staging');
    expect(result.isPrimary).to.equal(true);
  });

  it('resolves the environment from the positional argument', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', 'mrt-backend': 'scapi'}, {environment: 'production'});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtBackend: 'scapi'}}));

    const setPrimaryStub = sinon.stub().resolves({
      backend: 'scapi',
      environment: {id: 'production', name: 'Production', isPrimary: true, backend: 'scapi'},
      raw: {environmentId: 'production'},
    } as any);
    command.operations = {...command.operations, setPrimaryEnvironmentWithBackend: setPrimaryStub};

    await command.run();

    const [input] = setPrimaryStub.firstCall.args;
    expect(input.environment).to.equal('production');
  });

  it('surfaces the unsupported-on-legacy error from the wrapper', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project'}, {environment: 'staging'});
    await command.init();

    stubBackendContext(command, {preference: 'legacy', legacyAuth: {}});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project'}}));

    const setPrimaryStub = sinon
      .stub()
      .rejects(new Error('Setting a primary environment is only supported on the SCAPI MRT backend.'));
    command.operations = {...command.operations, setPrimaryEnvironmentWithBackend: setPrimaryStub};

    try {
      await command.run();
      expect.fail('Expected error');
    } catch (error) {
      expect((error as Error).message).to.include('only supported on the SCAPI MRT backend');
    }
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
