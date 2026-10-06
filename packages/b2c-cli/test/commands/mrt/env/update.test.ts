/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtEnvUpdate from '../../../../src/commands/mrt/env/update.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt env update', () => {
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
    return new MrtEnvUpdate([], config);
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

    stubParse(command, {name: 'New Name'}, {});
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

    stubParse(command, {project: 'my-project', name: 'New Name'}, {});
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

  it('routes through the backend-aware update on the legacy backend and returns raw under --json', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', name: 'Updated Staging', production: true}, {});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

    const updateStub = sinon.stub().resolves({
      backend: 'legacy',
      environment: {id: 'staging', name: 'Updated Staging', status: 'ready', backend: 'legacy'},
      raw: {slug: 'staging', name: 'Updated Staging', state: 'ready'},
    } as any);
    command.operations = {...command.operations, updateEnvironmentWithBackend: updateStub};

    const result = await command.run();

    expect(updateStub.calledOnce).to.equal(true);
    const [input] = updateStub.firstCall.args;
    expect(input.projectSlug).to.equal('my-project');
    expect(input.environment).to.equal('staging');
    expect(input.name).to.equal('Updated Staging');
    expect(input.isProduction).to.equal(true);
    expect(result.name).to.equal('Updated Staging');
  });

  it('requires --name on the SCAPI backend', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', 'mrt-backend': 'scapi'}, {});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtBackend: 'scapi'}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('display name only');
    }
  });

  it('updates the display name via the SCAPI backend', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', name: 'Renamed', 'mrt-backend': 'scapi'}, {});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtBackend: 'scapi'}}));

    const updateStub = sinon.stub().resolves({
      backend: 'scapi',
      environment: {id: 'staging', name: 'Renamed', status: 'ready', backend: 'scapi'},
      raw: {environmentId: 'staging', displayName: 'Renamed'},
    } as any);
    command.operations = {...command.operations, updateEnvironmentWithBackend: updateStub};

    const result = await command.run();

    const [input] = updateStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.name).to.equal('Renamed');
    expect(result.displayName).to.equal('Renamed');
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
