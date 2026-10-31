/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtEnvCreate from '../../../../src/commands/mrt/env/create.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt env create', () => {
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
    return new MrtEnvCreate([], config);
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

    stubParse(command, {}, {slug: 'staging'});
    await command.init();

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('routes to the legacy backend forwarding parsed proxy flags and returns raw under --json', async () => {
    const command = createCommand();

    stubParse(
      command,
      {
        project: 'my-project',
        name: 'My Env',
        region: 'eu-west-1',
        production: true,
        hostname: 'foo',
        'external-hostname': 'www.example.com',
        'external-domain': 'example.com',
        'allow-cookies': true,
        'enable-source-maps': true,
        proxy: ['api=api.example.com', 'ocapi=ocapi.example.com'],
        wait: false,
      },
      {slug: 'staging'},
    );
    await command.init();

    // auto + legacyAuth with no SCAPI connection resolves to the legacy backend.
    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

    const createStub = sinon.stub().resolves({
      backend: 'legacy',
      environment: {id: 'staging', name: 'My Env', status: 'creating', isProduction: true, backend: 'legacy'},
      raw: {slug: 'staging', name: 'My Env', state: 'creating', is_production: true},
    } as any);
    command.operations = {...command.operations, createEnvironmentWithBackend: createStub};

    const result = await command.run();

    expect(createStub.calledOnce).to.equal(true);
    const [input] = createStub.firstCall.args;
    expect(input.projectSlug).to.equal('my-project');
    expect(input.slug).to.equal('staging');
    expect(input.name).to.equal('My Env');
    expect(input.isProduction).to.equal(true);
    expect(input.proxyConfigs).to.have.lengthOf(2);
    expect(result.slug).to.equal('staging');
  });

  it('rejects on the SCAPI backend when no display name is available', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', 'mrt-backend': 'scapi'}, {});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtBackend: 'scapi'}}));

    // No command-level gate: the SCAPI create branch rejects when no display
    // name is available, and explicit scapi never falls back to legacy.
    try {
      await command.run();
      expect.fail('Expected rejection');
    } catch (error) {
      expect((error as Error).message).to.include('--name');
    }
  });

  it('creates via SCAPI with only a display name', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', name: 'Staging', 'mrt-backend': 'scapi'}, {});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtBackend: 'scapi'}}));

    const createStub = sinon.stub().resolves({
      backend: 'scapi',
      environment: {id: 'staging', name: 'Staging', status: 'building', backend: 'scapi'},
      raw: {environmentId: 'staging', displayName: 'Staging', status: 'building'},
    } as any);
    command.operations = {...command.operations, createEnvironmentWithBackend: createStub};

    const result = await command.run();

    const [input] = createStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.name).to.equal('Staging');
    expect(result.environmentId).to.equal('staging');
  });

  it('when --wait is set on the legacy backend, calls waitForEnv', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', wait: true}, {slug: 'staging'});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

    const createStub = sinon.stub().resolves({
      backend: 'legacy',
      environment: {id: 'staging', name: 'staging', status: 'creating', backend: 'legacy'},
      raw: {slug: 'staging', name: 'staging', state: 'creating'},
    } as any);
    const waitStub = sinon.stub().resolves({
      slug: 'staging',
      name: 'staging',
      state: 'ready',
      is_production: false,
    } as any);
    command.operations = {...command.operations, createEnvironmentWithBackend: createStub, waitForEnv: waitStub};

    await command.run();

    expect(waitStub.calledOnce).to.equal(true);
  });

  it('calls command.error when a proxy flag has an invalid format', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', proxy: ['INVALID']}, {slug: 'staging'});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging'}}));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
    }
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
